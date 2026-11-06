import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
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
      assert.match(JSON.parse(options.body).command, /Recipient\/contact: 2348000000000@s\.whatsapp\.net/);
      return Response.json({ ok: true, action: 'send_contact_message', modality: 'text' });
    }
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
  assert.equal(fetch.mock.callCount(), 2);
});
