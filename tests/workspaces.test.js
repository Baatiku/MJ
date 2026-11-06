import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../worker.js';

test('shared workspace flow uses the verified owner, keeps drafts private and scopes public WhatsApp links', async (t) => {
  const origin = 'https://shop.example';
  const env = { SHOP_SUPABASE_URL: 'https://auth.example', SHOP_SUPABASE_PUBLIC_KEY: 'public-key' };
  const auth = '__Host-shop-session=owner-token';
  const workspace = { id: '12345678-1234-1234-1234-123456789abc', slug: 'new-shop', name: 'A & B', description: 'Custom garments', whatsapp: '2348012345678', published: false };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.origin, 'https://auth.example');
    if (url.pathname === '/auth/v1/otp') return Response.json({});
    if (url.pathname === '/auth/v1/verify') return Response.json({ access_token: 'owner-token', refresh_token: 'never-return', expires_in: 1200 });
    if (url.pathname === '/auth/v1/user') return Response.json({ id: 'verified-owner' });
    if (url.pathname.endsWith('/my_storefront_workspaces')) {
      assert.equal(options.headers.Authorization, 'Bearer owner-token');
      return Response.json([workspace]);
    }
    if (options.method === 'POST') {
      assert.equal(JSON.parse(options.body).owner_id, 'verified-owner');
      assert.equal(JSON.parse(options.body).published, undefined);
      return Response.json([workspace], { status: 201 });
    }
    if (options.method === 'PATCH') {
      assert.equal(options.headers.Authorization, 'Bearer owner-token');
      return Response.json([]);
    }
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(url.searchParams.get('published'), 'eq.true');
    return Response.json(workspace.published ? [workspace] : []);
  });
  const call = (body, cookie, source = origin) => worker.fetch(new Request(origin + '/api/workspaces', {
    method: body ? 'POST' : 'GET',
    headers: { Origin: source, ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  }), env);
  assert.equal((await call()).status, 401);
  assert.equal((await call({ action: 'otp', email: 'owner@example.com' }, null, 'https://other.example')).status, 403);
  assert.equal((await call({ action: 'otp', email: 'owner@example.com' })).status, 200);
  const verified = await call({ action: 'verify', email: 'owner@example.com', code: '123456' });
  assert.match(verified.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Strict/);
  assert.deepEqual(await verified.json(), { ok: true });
  const created = await call({ ...workspace, action: 'create', owner_id: 'someone-else', published: true }, auth);
  assert.equal(created.status, 201);
  assert.deepEqual(await (await call(null, auth)).json(), { shops: [workspace] });
  assert.equal((await call({ ...workspace, action: 'update' }, auth)).status, 404);
  const publicPage = () => worker.fetch(new Request(origin + '/shops/new-shop/'), env);
  assert.equal((await publicPage()).status, 404);
  workspace.published = true;
  const page = await (await publicPage()).text();
  assert.match(page, /A &amp; B/);
  assert.match(page, /wa.me\/2348012345678/);
  assert.doesNotMatch(page, /2348022519062/);
});
