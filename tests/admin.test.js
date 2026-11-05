import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { onRequest } from '../functions/api/admin.js';
import { onRequestGet as shop } from '../functions/index.js';
import { onRequestGet as detail } from '../functions/products/[[path]].js';

test('owner can edit a colour and unlist its product with a persistent session', async () => {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../migrations/0001_catalog.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(statement) {
      const query = sql.prepare(statement);
      const bind = (...args) => ({
        first: async () => query.get(...args),
        all: async () => ({ results: query.all(...args) }),
        run: async () => query.run(...args)
      });
      return { ...bind(), bind };
    },
    batch: async (statements) => Promise.all(statements.map((statement) => statement.run()))
  };
  const origin = 'https://shop.example';
  const env = { CATALOG_DB: db, ADMIN_PASSWORD: 'test-only-secret' };
  const call = (method, body, cookie, requestOrigin = origin) => onRequest({
    env, request: new Request(origin + '/api/admin', {
      method, body: body ? JSON.stringify(body) : undefined,
      headers: { Origin: requestOrigin, Cookie: cookie || '' }
    })
  });
  assert.equal((await call('GET')).status, 401);
  assert.equal((await call('POST', { password: 'wrong' })).status, 401);
  const signedIn = await call('POST', { password: env.ADMIN_PASSWORD });
  assert.equal(signedIn.status, 200);
  const cookie = signedIn.headers.get('set-cookie').split(';')[0];
  const { products } = await (await call('GET', null, cookie)).json();
  const product = products[0];
  product.variants[0].name = 'Ink Navy';
  product.variants[0].image = 'https://cdn.example/ink-navy.jpg';
  assert.equal((await call('PUT', product, cookie, 'https://outside.example')).status, 403);
  const saved = await call('PUT', product, cookie);
  assert.equal(saved.status, 200);
  assert.equal((await call('PUT', product, cookie)).status, 409);
  const page = await shop({ env, request: new Request(origin) });
  assert.match(await page.text(), /Ink Navy/);
  const params = { path: [product.id, product.variants[0].id] };
  const request = new Request(origin + '/products/' + params.path.join('/') + '/');
  assert.match(await (await detail({ env, request, params })).text(), /cdn\.example\/ink-navy\.jpg/);
  const result = await saved.json();
  assert.equal((await call('PUT', { ...result.product, hidden: true }, cookie)).status, 200);
  assert.doesNotMatch(await (await shop({ env, request })).text(), /id="flow-abaya"/);
  assert.equal((await detail({ env, request, params })).status, 404);
  assert.equal((await call('DELETE', null, cookie)).status, 200);
  assert.equal((await call('GET', null, cookie)).status, 401);
  sql.close();
});
