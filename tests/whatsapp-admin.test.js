import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import worker from '../worker.js';
import { onRequest } from '../functions/api/whatsapp.js';

test('WhatsApp admin signs scoped requests and gates exact recipient delegation', async (t) => {
  const origin = 'https://shop.example';
  const tenant = '11111111-2222-3333-4444-555555555555';
  const token = 'test-token';
  const cookie = '__Host-mj-admin=' + 'a'.repeat(64);
  const env = {
    CATALOG_DB: { prepare: () => ({ bind: () => ({ first: async () => ({ valid: 1 }) }) }) },
    ADMIN_PASSWORD: 'test-password',
    WA_RUNTIME_ORIGIN: 'https://worker.example',
    WA_RUNTIME_TOKEN: token,
    WA_TENANT_ID: tenant
  };
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    const path = url.pathname.split('/').at(-1);
    assert.equal(url.origin, 'https://worker.example');
    assert.equal(url.pathname, `/api/tenants/${tenant}/${path}`);
    const message = [options.headers['X-Platform-Timestamp'], options.method, tenant, path].join('\n');
    assert.equal(options.headers['X-Platform-Signature'], createHmac('sha256', token).update(message).digest('base64url'));
    if (path === 'command') {
      const { command } = JSON.parse(options.body);
      assert.match(command, /Recipient\/contact: (2348000000000@s\.whatsapp\.net|123456789@lid)/);
      return Response.json({ ok: true, action: 'send_contact_message', modality: command.includes('Modality: voice') ? 'voice' : 'text' });
    }
    if (path === 'whatsapp-contacts') {
      assert.equal(url.searchParams.get('q'), 'Amina');
      assert.equal(url.searchParams.get('offset'), '30');
      return Response.json({ contacts: [
        { jid: '123456789@lid', name: 'Amina', secret: 'private' },
        { jid: '123456789@g.us', name: 'Group' }
      ], hasMore: true });
    }
    if (path === 'connect') return Response.json({ connected: false, qrDataUrl: 'data:image/png;base64,AAAA' });
    if (path === 'pairing-code') return Response.json({ code: 'ABCD1234' });
    return Response.json({ connected: true, enabled: true, privateCredential: 'must not be exposed' });
  });
  const call = (body, auth = true, source = origin) => onRequest({
    request: new Request(origin + '/api/whatsapp', {
      method: body ? 'POST' : 'GET',
      headers: { ...(auth ? { Cookie: cookie } : {}), Origin: source },
      ...(body ? { body: JSON.stringify(body) } : {})
    }),
    env
  });
  assert.equal((await call(null, false)).status, 401);
  assert.equal((await call({ action: 'connect' }, true, 'https://other.example')).status, 403);
  assert.equal((await call({ action: 'any-command' })).status, 400);
  const delegate = { action: 'delegate', phone: '+2348000000000', brief: 'Thank them', modality: 'text', confirm: true };
  assert.equal((await call(delegate)).status, 503);
  assert.equal(fetch.mock.callCount(), 0);
  const data = await (await call(null)).json();
  assert.equal(data.connected, true);
  assert.equal(data.privateCredential, undefined);
  env.WA_EXACT_DELEGATION = '1';
  assert.equal((await call({ ...delegate, confirm: false })).status, 400);
  assert.deepEqual(await (await call(delegate)).json(), { ok: true, modality: 'text' });
  assert.deepEqual(await (await call({ action: 'connect' })).json(), {
    connected: false, enabled: false, phone: null, status: 'unknown', qrDataUrl: 'data:image/png;base64,AAAA'
  });
  assert.deepEqual(await (await call({ action: 'pair', phone: delegate.phone })).json(), { code: 'ABCD1234' });
  assert.deepEqual(await (await call({ action: 'toggle', enabled: false })).json(), { ok: true });
  const contacts = await worker.fetch(new Request(origin + '/api/whatsapp?view=contacts&q=Amina&offset=30', {
    headers: { Cookie: cookie }
  }), env);
  assert.deepEqual(await contacts.json(), { contacts: [{ jid: '123456789@lid', name: 'Amina' }], hasMore: true });
  assert.deepEqual(await (await call({ ...delegate, phone: undefined, jid: '123456789@lid', modality: 'voice' })).json(), { ok: true, modality: 'voice' });
  assert.equal((await call({ ...delegate, phone: undefined, jid: '123456789@g.us' })).status, 400);
  assert.equal(fetch.mock.callCount(), 7);
});


test('Worker routes both admin APIs before static assets', async () => {
  const env = { ASSETS: { fetch: async () => new Response('static') } };
  for (const path of ['/api/admin', '/api/whatsapp']) {
    const response = await worker.fetch(new Request('https://shop.example' + path), env);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Content-Type'), 'application/json');
  }
  assert.equal(await (await worker.fetch(new Request('https://shop.example/admin/'), env)).text(), 'static');
});
