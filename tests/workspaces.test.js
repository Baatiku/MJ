import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import worker from '../worker.js';

test('D1 owner invites are single-use and storefront writes are isolated', async (t) => {
  const sql = new DatabaseSync(':memory:');
  for (const file of ['0001_catalog.sql', '0002_workspaces.sql', '0003_shop_catalogs.sql']) {
    sql.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
  }
  const db = {
    prepare(statement) {
      const query = sql.prepare(statement);
      const bind = (...values) => {
        const args = values.map((value) => value instanceof ArrayBuffer ? new Uint8Array(value) : value);
        return ({
        first: async () => query.get(...args),
        all: async () => ({ results: query.all(...args) }),
        run: async () => query.run(...args)
        });
      };
      return { ...bind(), bind };
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all());
        sql.exec('COMMIT');
        return results;
      } catch (error) {
        sql.exec('ROLLBACK');
        throw error;
      }
    }
  };
  const env = { CATALOG_DB: db, ADMIN_PASSWORD: 'operator-password', SHOP_PASSWORD_PEPPER: 'test-pepper-at-least-32-characters' };
  const origin = 'https://shop.example';
  const call = (path, body, cookie, method) => worker.fetch(new Request(origin + path, {
    method: method || (body ? 'POST' : 'GET'), headers: { Origin: origin, Cookie: cookie || '' },
    ...(body ? { body: JSON.stringify(body) } : {})
  }), env);
  const api = (body, cookie) => call('/api/workspaces', body, cookie);
  const session = (response) => response.headers.get('set-cookie').split(';')[0];
  const admin = session(await call('/api/admin', { password: env.ADMIN_PASSWORD }));
  const password = 'a long owner password';
  assert.equal((await api({ action: 'invite', email: 'a@example.com' })).status, 403);
  async function owner(email) {
    const created = await api({ action: 'invite', email }, admin);
    assert.equal(created.status, 201);
    const { link } = await created.json();
    const invite = new URLSearchParams(new URL(link).hash.slice(1)).get('invite');
    const accepted = await api({ action: 'accept', invite, password });
    assert.equal(accepted.status, 200);
    assert.equal((await api({ action: 'accept', invite, password })).status, 400);
    return session(accepted);
  }
  const a = await owner('a@example.com');
  const b = await owner('b@example.com');
  const profile = { name: 'A & B', description: 'Clothes', whatsapp: '+2348012345678' };
  const created = await api({ action: 'create', slug: 'new-shop', ...profile }, a);
  assert.equal(created.status, 201);
  const { shop } = await created.json();
  assert.equal((await call('/shops/new-shop/')).status, 404);
  assert.deepEqual((await (await api(null, b)).json()).shops, []);
  const update = { ...profile, action: 'update', id: shop.id, published: true };
  assert.equal((await api(update, b)).status, 404);
  assert.equal((await api(update, a)).status, 200);
  assert.equal((await api(update, b)).status, 404);
  const page = await (await call('/shops/new-shop/')).text();
  assert.match(page, /A &amp; B/);
  assert.match(page, /wa.me\/2348012345678/);
  const edit = (slug, body, cookie) => call('/api/shop-catalog?shop=' + slug, body, cookie, body ? 'PUT' : 'GET');
  const second = await api({ action: 'create', slug: 'second-shop', name: 'Second Shop' }, b);
  assert.equal(second.status, 201);
  assert.equal((await edit('new-shop', null, b)).status, 404);
  assert.equal((await edit('second-shop', null, a)).status, 404);
  assert.equal((await call('/api/workspaces?platform=1', null, a)).status, 401);
  assert.equal((await (await call('/api/workspaces?platform=1', null, admin)).json()).shops.length, 2);
  const upload = await edit('second-shop', { action: 'upload-photo', data: btoa('\xff\xd8\xff\xd9') }, b);
  assert.equal(upload.status, 201);
  const { url: photo } = await upload.json();
  assert.equal((await call(photo)).status, 404);
  assert.equal((await call(photo, null, a)).status, 404);
  assert.equal((await call(photo, null, b)).headers.get('content-type'), 'image/jpeg');
  const product = {
    id: 'linen-dress', name: 'Linen Dress', description: 'A long linen dress', category: 'dresses',
    available: true, hidden: false, price: 25000, revision: 0, position: 10,
    variants: [{ id: 'rose', name: 'Rose', swatch: '#984853', image: photo }]
  };
  const save = { action: 'save-product', product };
  assert.equal((await edit('new-shop', save, a)).status, 400);
  assert.equal((await edit('second-shop', save, a)).status, 404);
  const saved = await edit('second-shop', save, b);
  assert.equal(saved.status, 200);
  const { product: savedProduct } = await saved.json();
  assert.equal((await edit('second-shop', save, b)).status, 409);
  assert.equal((await call('/shops/second-shop/?preview=1', null, a)).status, 404);
  const draft = await (await call('/shops/second-shop/?preview=1', null, b)).text();
  assert.match(draft, /linen-dress\/rose\/\?preview=1/);
  assert.equal((await call('/shops/second-shop/products/linen-dress/rose/?preview=1', null, b)).status, 200);
  const settings = {
    action: 'settings', name: 'Second Shop', description: 'Linen pieces', whatsapp: '+234 802 345 6789',
    headline: 'Linen for every day', cover: photo, categoryLabels: { dresses: 'Linen dresses' }, published: true
  };
  assert.equal((await edit('second-shop', settings, b)).status, 200);
  assert.equal((await call(photo)).status, 200);
  const secondPage = await (await call('/shops/second-shop/')).text();
  assert.match(secondPage, /Linen for every day/);
  assert.match(secondPage, /Linen dresses/);
  assert.match(secondPage, /Buy on WhatsApp/);
  assert.match(secondPage, /wa.me\/2348023456789/);
  assert.doesNotMatch(secondPage, /wa.me\/2348012345678/);
  const variantPath = '/shops/second-shop/products/linen-dress/rose/';
  const variant = await (await call(variantPath)).text();
  assert.match(variant, /Linen Dress in Rose/);
  assert.ok(variant.includes(origin + photo));
  assert.ok(variant.includes(encodeURIComponent(origin + variantPath)));
  assert.equal((await edit('second-shop', { ...save, product: { ...savedProduct, hidden: true } }, b)).status, 200);
  assert.equal((await call(variantPath)).status, 404);
  assert.equal((await edit('second-shop', { action: 'delete-product', id: product.id, revision: 1 }, b)).status, 409);
  assert.equal((await edit('second-shop', { action: 'delete-product', id: product.id, revision: 2 }, b)).status, 200);

  env.WA_RUNTIME_ORIGIN = 'https://runtime.example';
  env.WA_RUNTIME_TOKEN = 'test-runtime-key';
  env.WA_TENANT_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const tenant = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const bind = { action: 'assign-runtime', tenant };
  const wa = (slug, body, cookie) => call('/api/whatsapp?shop=' + slug, body, cookie);
  assert.equal((await wa('second-shop', bind, b)).status, 403);
  assert.equal((await wa('second-shop', bind, admin)).status, 200);
  assert.equal((await wa('new-shop', bind, admin)).status, 409);
  assert.equal((await wa('new-shop', { ...bind, tenant: env.WA_TENANT_ID }, admin)).status, 400);
  assert.equal((await wa('second-shop', null, a)).status, 404);
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url.pathname, '/api/tenants/' + tenant + '/status');
    return Response.json({ connected: true });
  });
  assert.equal((await (await wa('second-shop', null, b)).json()).connected, true);
  t.mock.restoreAll();

  assert.equal((await api({ action: 'create', slug: 'maknoon-jamil', ...profile }, b)).status, 400);
  const importShop = { action: 'import-original', email: 'a@example.com' };
  assert.equal((await api(importShop, a)).status, 403);
  const originalBefore = await (await call('/')).text();
  const legacyData = JSON.parse(originalBefore.match(/id="catalog-data"[^>]*>([^<]+)<\/script>/)[1]);
  assert.equal((await api(importShop, admin)).status, 201);
  assert.equal((await api(importShop, admin)).status, 409);
  const originalAfter = await (await call('/')).text();
  assert.ok(originalAfter.includes(origin + '/previews/maknoon-jamil-square.jpg'));
  const migrated = await (await edit('maknoon-jamil', null, a)).json();
  assert.deepEqual(migrated.products.map(({ id }) => id), legacyData.map(({ id }) => id));
  const first = migrated.products[0];
  assert.equal((await call('/products/' + first.id + '/' + first.variants[0].id + '/')).status, 200);
  assert.equal((await edit('maknoon-jamil', null, b)).status, 404);

  const changed = await api({ action: 'change-password', currentPassword: password, password: 'a newer owner password' }, a);
  assert.equal(changed.status, 200);
  assert.equal((await api(null, a)).status, 401);
  const newSession = session(changed);
  assert.equal((await api(null, newSession)).status, 200);
  assert.equal((await api({ action: 'login', email: 'a@example.com', password })).status, 401);
  assert.equal((await api({ action: 'logout' }, newSession)).status, 200);
  assert.equal((await api(null, a)).status, 401);
  assert.equal((await api({ action: 'login', email: 'a@example.com', password: 'a newer owner password' })).status, 200);
  sql.close();
});
