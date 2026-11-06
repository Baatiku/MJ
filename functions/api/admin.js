import { originalMarker } from '../_original-id.js';
import { normalizeOrderNumber, readOrderNumber, saveOrderNumber } from '../../src/catalog/shop-settings.js';
import { readCatalog, validateProduct } from '../../src/catalog/live.js';

const cookie = '__Host-mj-admin';
const sessionSeconds = 8 * 60 * 60;
const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (data, status = 200, extra = {}) => Response.json(data, { status, headers: { ...headers, ...extra } });

async function digest(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return hex(new Uint8Array(bytes));
}

async function validPassword(supplied, expected) {
  if (typeof supplied !== 'string' || supplied.length > 256) return false;
  const [left, right] = await Promise.all([digest(supplied), digest(expected)]);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function sessionCookie(token, seconds) {
  return `${cookie}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${seconds}`;
}

export async function adminSessionHash(request, env, now = Math.floor(Date.now() / 1000)) {
  if (!env.CATALOG_DB || !env.ADMIN_PASSWORD) return null;
  const token = request.headers.get('Cookie')?.match(/(?:^|; )__Host-mj-admin=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  const hash = await digest(token + env.ADMIN_PASSWORD);
  const session = await env.CATALOG_DB.prepare('SELECT 1 FROM admin_sessions WHERE token = ? AND expires > ?').bind(hash, now).first();
  return session ? hash : null;
}

export async function onRequest({ request, env }) {
  const db = env.CATALOG_DB;
  if (!db || !env.ADMIN_PASSWORD) return json({ error: 'Admin setup is pending. Configure the database and password in Cloudflare.' }, 503);
  if (request.method !== 'GET' && request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Invalid request origin.' }, 403);
  }
  const now = Math.floor(Date.now() / 1000);
  try {
    if (request.method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const bucket = await digest(ip);
      const limit = await db.prepare(`INSERT INTO login_attempts VALUES (?, 1, ?)
        ON CONFLICT(bucket) DO UPDATE SET
        attempts = CASE WHEN expires <= ? THEN 1 ELSE attempts + 1 END,
        expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END
        RETURNING attempts`).bind(bucket, now + 900, now, now).first();
      if (limit.attempts > 8) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
      const { password } = await request.json();
      if (!await validPassword(password, env.ADMIN_PASSWORD)) return json({ error: 'Incorrect password.' }, 401);
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      await db.batch([
        db.prepare('DELETE FROM admin_sessions WHERE expires <= ?').bind(now),
        db.prepare('DELETE FROM login_attempts WHERE expires <= ? OR bucket = ?').bind(now, bucket),
        db.prepare('INSERT INTO admin_sessions VALUES (?, ?)').bind(await digest(token + env.ADMIN_PASSWORD), now + sessionSeconds)
      ]);
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token, sessionSeconds) });
    }

    const hash = await adminSessionHash(request, env, now);
    if (!hash) {
      return json({ error: 'Sign in to continue.' }, 401);
    }
    if (['GET', 'PUT'].includes(request.method) &&
        await db.prepare('SELECT id FROM catalog_edits WHERE id = ?').bind(originalMarker).first()) {
      return json({ migrated: '/manage/maknoon-jamil/' }, request.method === 'GET' ? 200 : 409);
    }
    if (request.method === 'GET') {
      const [products, orderNumber] = await Promise.all([readCatalog(db), readOrderNumber(db)]);
      return json({ products, orderNumber });
    }
    if (request.method === 'DELETE') {
      await db.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(hash).run();
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
    }
    if (request.method === 'PUT') {
      const input = await request.json();
      if (input?.action === 'set-order-number') {
        const orderNumber = normalizeOrderNumber(input.orderNumber);
        if (!orderNumber) return json({ error: 'Enter a WhatsApp number with its country code, for example +234 801 234 5678.' }, 400);
        await saveOrderNumber(db, orderNumber);
        return json({ orderNumber });
      }
      let product;
      try { product = validateProduct(input); } catch (error) { return json({ error: error.message }, 400); }
      const revision = input.revision + 1;
      const saved = input.revision === 0
        ? await db.prepare('INSERT INTO catalog_edits VALUES (?, ?, 1) ON CONFLICT(id) DO NOTHING RETURNING revision')
          .bind(product.id, JSON.stringify(product)).first()
        : await db.prepare('UPDATE catalog_edits SET document = ?, revision = ? WHERE id = ? AND revision = ? RETURNING revision')
          .bind(JSON.stringify(product), revision, product.id, input.revision).first();
      if (!saved) return json({ error: 'Someone updated this product. Reload the dashboard before editing it again.' }, 409);
      return json({ product: { ...product, revision } });
    }
    return json({ error: 'Method not allowed.' }, 405);
  } catch {
    return json({ error: 'The catalog service could not complete the request.' }, 500);
  }
}
