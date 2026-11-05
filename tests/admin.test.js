import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { products as defaults } from '../src/catalog/products.js';
import { onRequest } from '../functions/api/admin.js';
import { onRequestGet as shop } from '../functions/index.js';
import { onRequestGet as detail } from '../functions/products/[[path]].js';

test('owner can edit a colour, set or clear its product price, and unlist it', async () => {
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
  const legacy = { ...defaults[0], hidden: false, available: true, variants: defaults[0].variants.slice(0, 3) };
  sql.prepare('INSERT INTO catalog_edits VALUES (?, ?, 1)').run(legacy.id, JSON.stringify(legacy));
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
  assert.equal(product.variants.length, 4);
  assert.equal(product.variants[3].name, 'Deep Plum');
  product.price = 32000;
  product.variants[0].name = 'Ink Navy';
  product.variants[0].image = 'https://cdn.example/ink-navy.jpg';
  assert.equal((await call('PUT', product, cookie, 'https://outside.example')).status, 403);
  const saved = await call('PUT', product, cookie);
  assert.equal(saved.status, 200);
  assert.equal((await call('PUT', product, cookie)).status, 409);
  const page = await shop({ env, request: new Request(origin) });
  const card = (await page.text()).match(/<article[^>]+id="flow-abaya"[\s\S]*?<\/article>/)[0];
  assert.match(card, /Ink Navy/);
  assert.match(card, /₦32,000/);
  assert.match(card, /Buy on WhatsApp/);
  const params = { path: [product.id, product.variants[0].id] };
  const request = new Request(origin + '/products/' + params.path.join('/') + '/');
  const priced = await (await detail({ env, request, params })).text();
  assert.match(priced, /cdn\.example\/ink-navy\.jpg/);
  assert.match(priced, /₦32,000/);
  assert.match(priced, /Buy on WhatsApp/);
  const result = await saved.json();
  const cleared = await call('PUT', { ...result.product, price: null }, cookie);
  assert.equal(cleared.status, 200);
  const unpriced = await (await detail({ env, request, params })).text();
  assert.doesNotMatch(unpriced, /₦32,000|Buy on WhatsApp/);
  assert.match(unpriced, /Ask on WhatsApp/);
  const unpricedCard = (await (await shop({ env, request })).text()).match(/<article[^>]+id="flow-abaya"[\s\S]*?<\/article>/)[0];
  assert.doesNotMatch(unpricedCard, /₦32,000|Buy on WhatsApp/);
  assert.match(unpricedCard, /Ask on WhatsApp/);
  const { product: current } = await cleared.json();
  assert.equal((await call('PUT', { ...current, hidden: true }, cookie)).status, 200);
  assert.doesNotMatch(await (await shop({ env, request })).text(), /id="flow-abaya"/);
  assert.equal((await detail({ env, request, params })).status, 404);
  assert.equal((await call('DELETE', null, cookie)).status, 200);
  assert.equal((await call('GET', null, cookie)).status, 401);
  sql.close();
});
