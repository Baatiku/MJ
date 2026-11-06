import { adminSessionHash } from './admin.js';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (data, status = 200) => Response.json(data, { status, headers });
const phonePattern = /^\+[1-9]\d{7,14}$/;
const contactPattern = /^(?:[1-9][0-9]{7,14}@s\.whatsapp\.net|[0-9]{5,20}@lid)$/;
const tenantPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const roleBriefs = {
  automatic: 'Follow the account’s configured automatic specialist routing.',
  account: 'Focus on account management, customer enquiries, order follow-ups and routing requests to the owner.',
  sales: 'Focus on helping customers choose products and understand confirmed prices and availability. Never invent stock, prices, discounts, delivery dates or payment details.',
  storyteller: 'Focus on original storytelling. Make clear when a story is fictional.',
  reporter: 'Focus on factual news summaries. Distinguish verified facts from uncertainty and cite sources. Never present outdated information as current.'
};

function status(data) {
  return {
    connected: data.connected === true,
    enabled: data.enabled === true,
    phone: typeof data.phone === 'string' ? data.phone : null,
    status: typeof data.status === 'string' ? data.status : 'unknown',
    qrDataUrl: !data.connected && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data.qrDataUrl ?? '') ? data.qrDataUrl : null
  };
}

function operation(input) {
  if (input?.action === 'connect' || input?.action === 'disconnect') return { method: 'POST', path: input.action };
  if (input?.action === 'pair' && phonePattern.test(input.phone ?? '')) {
    return { method: 'POST', path: 'pairing-code', body: { phoneNumber: input.phone } };
  }
  if (input?.action === 'toggle' && typeof input.enabled === 'boolean') {
    return { method: 'POST', path: 'toggle', body: { enabled: input.enabled } };
  }
  if (input?.action === 'guidance' && Object.hasOwn(roleBriefs, input.role) && typeof input.brief === 'string' && input.brief.length <= 3500) {
    const owner_instructions = [
      roleBriefs[input.role],
      input.brief.trim() ? 'Owner instructions: ' + input.brief.trim() : '',
      'Act as an AI assistant for this business. Keep customer information private and escalate decisions that require owner approval.'
    ].filter(Boolean).join('\n\n');
    return { method: 'PATCH', path: 'settings', body: { owner_instructions } };
  }
  const recipient = contactPattern.test(input?.jid ?? '') ? input.jid
    : phonePattern.test(input?.phone ?? '') ? input.phone.slice(1) + '@s.whatsapp.net' : null;
  if (input?.action === 'delegate' && input.confirm === true && recipient &&
      ['text', 'voice'].includes(input.modality) && typeof input.brief === 'string' && input.brief.trim() && input.brief.length <= 3500) {
    return {
      method: 'POST', path: 'command', body: {
        command: [
          'PLATFORM OWNER ACTION: send_contact_message',
          'Semantics: private_owner_instruction_not_recipient_speech',
          'Recipient/contact: ' + recipient,
          'Modality: ' + input.modality,
          'Owner instruction for the message:',
          input.brief.trim()
        ].join('\n')
      }
    };
  }
  return null;
}

async function callRuntime(origin, tenant, token, { method, path, body, query }) {
  const timestamp = String(Date.now());
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(token), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode([timestamp, method, tenant, path].join('\n')));
  const encoded = btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  const url = new URL('/api/tenants/' + tenant + '/' + path, origin);
  if (query) url.search = query;
  return fetch(url, {
    method, redirect: 'error', signal: AbortSignal.timeout(path === 'command' ? 55000 : 12000),
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      'X-Platform-Timestamp': timestamp,
      'X-Platform-Signature': encoded
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export async function onRequest({ request, env }) {
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
  if (request.method === 'POST' && request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Invalid request origin.' }, 403);
  }
  if (!env.CATALOG_DB || !env.ADMIN_PASSWORD) return json({ error: 'Owner sign-in must be configured first.' }, 503);
  let delegated = false;
  try {
    if (!await adminSessionHash(request, env)) return json({ error: 'Sign in to continue.' }, 401);
    const { WA_RUNTIME_ORIGIN, WA_RUNTIME_TOKEN, WA_TENANT_ID } = env;
    const origin = WA_RUNTIME_ORIGIN ? new URL(WA_RUNTIME_ORIGIN) : null;
    if (!origin || origin.protocol !== 'https:' || origin.username || origin.password ||
        !WA_RUNTIME_TOKEN || !tenantPattern.test(WA_TENANT_ID ?? '')) {
      return json({ error: 'WhatsApp service setup is pending.' }, 503);
    }
    const input = request.method === 'POST' ? await request.json().catch(() => null) : null;
    const params = new URL(request.url).searchParams;
    const listContacts = request.method === 'GET' && params.get('view') === 'contacts';
    const offset = Number(params.get('offset') || 0);
    if (listContacts && (!Number.isInteger(offset) || offset < 0 || offset > 100000)) return json({ error: 'Invalid contact page.' }, 400);
    const action = listContacts
      ? { method: 'GET', path: 'whatsapp-contacts', query: new URLSearchParams({ q: (params.get('q') || '').slice(0, 80), offset: String(offset) }).toString() }
      : request.method === 'GET' ? { method: 'GET', path: 'status' } : operation(input);
    if (!action) return json({ error: 'Check the WhatsApp request and try again.' }, 400);
    delegated = action.path === 'command';
    if (delegated && env.WA_EXACT_DELEGATION !== '1') {
      return json({ error: 'Delegation requires a worker with exact WhatsApp recipient validation.' }, 503);
    }
    const response = await callRuntime(origin, WA_TENANT_ID, WA_RUNTIME_TOKEN, action);
    if (!response.ok) {
      if (delegated) return json({ error: 'Delivery could not be confirmed. Check the WhatsApp conversation before trying again.' }, 502);
      return json({ error: 'The WhatsApp worker could not complete this action. Check the connection and try again.' }, 502);
    }
    const data = await response.json();
    if (listContacts) {
      const contacts = Array.isArray(data.contacts) ? data.contacts.slice(0, 30)
        .filter((contact) => contactPattern.test(contact?.jid ?? ''))
        .map(({ jid, name }) => ({ jid, name: typeof name === 'string' ? name.slice(0, 120) : '' })) : [];
      return json({ contacts, hasMore: data.hasMore === true });
    }
    if (action.path === 'status' || action.path === 'connect') return json(status(data));
    if (action.path === 'pairing-code') return json({ code: data.code });
    if (delegated && (data.ok !== true || data.action !== 'send_contact_message')) {
      return json({ error: 'Delivery could not be confirmed. Check the WhatsApp conversation before trying again.' }, 502);
    }
    return json({ ok: true, ...(delegated ? { modality: data.modality === 'voice' ? 'voice' : 'text' } : {}) });
  } catch {
    return json({ error: delegated
      ? 'Delivery could not be confirmed. Check the WhatsApp conversation before trying again.'
      : 'The WhatsApp service is unavailable.' }, 502);
  }
}
