import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import worker from '../worker.js';

test('D1 owner invites are single-use and storefront writes are isolated', async () => {
  const sql = new DatabaseSync(':memory:');
  for (const file of ['0001_catalog.sql', '0002_workspaces.sql']) {
    sql.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
  }
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
  const call = (path, body, cookie) => worker.fetch(new Request(origin + path, {
    method: body ? 'POST' : 'GET', headers: { Origin: origin, Cookie: cookie || '' },
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
  assert.equal((await api({ action: 'logout' }, a)).status, 200);
  assert.equal((await api(null, a)).status, 401);
  assert.equal((await api({ action: 'login', email: 'a@example.com', password })).status, 200);
  sql.close();
});
