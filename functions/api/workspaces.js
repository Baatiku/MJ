import { adminSessionHash } from './admin.js';

const sessionCookie = '__Host-shop-session';
const select = 'id,slug,name,description,whatsapp,published';
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const tokenPattern = /^[a-f0-9]{64}$/;
const phonePattern = /^[1-9][0-9]{7,14}$/;
const sessionSeconds = 8 * 60 * 60;
const encoder = new TextEncoder();
const noStore = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (value, status = 200, headers = {}) => Response.json(value, { status, headers: { ...noStore, ...headers } });
const hex = (bytes) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = async (text) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));

async function passwordHash(password, salt, pepper) {
  const pepperKey = await crypto.subtle.importKey('raw', encoder.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const material = await crypto.subtle.sign('HMAC', pepperKey, encoder.encode(password));
  const key = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({
    name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000
  }, key, 256));
}

function equalHash(a, b) {
  let difference = a.length ^ b.length;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ (b.charCodeAt(index) || 0);
  return difference === 0;
}

function cookie(value, age) {
  return `${sessionCookie}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
}

function emailAddress(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function cleanProfile(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const description = typeof input?.description === 'string' ? input.description.trim() : '';
  const whatsapp = typeof input?.whatsapp === 'string' ? input.whatsapp.trim().replace(/^\+/, '') : '';
  if (!name || name.length > 100 || description.length > 300 || (whatsapp && !phonePattern.test(whatsapp))) return null;
  return { name, description, whatsapp };
}

const present = (row) => row && { ...row, published: row.published === 1 };

async function allowAttempt(db, request, action, now) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = await digest('workspace:' + action + ':' + ip);
  const result = await db.prepare(`INSERT INTO login_attempts VALUES (?, 1, ?)
    ON CONFLICT(bucket) DO UPDATE SET
      attempts = CASE WHEN expires <= ? THEN 1 ELSE attempts + 1 END,
      expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END
    RETURNING attempts`).bind(key, now + 900, now, now).first();
  return result.attempts <= 8;
}

async function signIn(db, ownerId, now) {
  const token = randomToken();
  await db.batch([
    db.prepare('DELETE FROM workspace_sessions WHERE expires <= ?').bind(now),
    db.prepare('INSERT INTO workspace_sessions VALUES (?, ?, ?)').bind(await digest(token), ownerId, now + sessionSeconds)
  ]);
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(token, sessionSeconds) });
}

export async function onRequest({ request, env }) {
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
  const origin = new URL(request.url).origin;
  if (request.method === 'POST' && request.headers.get('Origin') !== origin) {
    return json({ error: 'Invalid request origin.' }, 403);
  }
  const db = env.CATALOG_DB;
  const pepper = env.SHOP_PASSWORD_PEPPER;
  if (!db || typeof pepper !== 'string' || pepper.length < 32) return json({ error: 'Shared owner sign-in has not been configured.' }, 503);
  const now = Math.floor(Date.now() / 1000);
  try {
    const input = request.method === 'POST' ? await request.json().catch(() => null) : null;
    const action = input?.action;
    const token = request.headers.get('Cookie')?.match(/(?:^|; )__Host-shop-session=([a-f0-9]{64})(?:;|$)/)?.[1];
    const tokenHash = token ? await digest(token) : null;
    if (action === 'logout') {
      if (tokenHash) await db.prepare('DELETE FROM workspace_sessions WHERE token_hash = ?').bind(tokenHash).run();
      return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
    }
    if (action === 'invite') {
      if (!await adminSessionHash(request, env, now)) return json({ error: 'Platform admin sign-in is required.' }, 403);
      const email = emailAddress(input.email);
      if (!email) return json({ error: 'Enter a valid email address.' }, 400);
      const invite = randomToken();
      await db.prepare('INSERT INTO workspace_invites (token_hash,email,expires) VALUES (?,?,?)')
        .bind(await digest(invite), email, now + 86400).run();
      const link = new URL('/manage/', origin);
      link.hash = 'invite=' + invite;
      return json({ link: link.href }, 201);
    }
    if (action === 'accept' || action === 'login') {
      const password = input.password;
      if (typeof password !== 'string' || password.length < 14 || password.length > 128) {
        return json({ error: 'Use a password between 14 and 128 characters.' }, 400);
      }
      if (!await allowAttempt(db, request, action, now)) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
      if (action === 'accept') {
        if (typeof input.invite !== 'string' || !tokenPattern.test(input.invite)) return json({ error: 'This invite is invalid or expired.' }, 400);
        const inviteHash = await digest(input.invite);
        const ownerId = crypto.randomUUID();
        const salt = randomToken();
        const hash = await passwordHash(password, salt, pepper);
        const [insert] = await db.batch([
          db.prepare(`INSERT INTO workspace_owners (id,email,password_salt,password_hash)
            SELECT ?,email,?,? FROM workspace_invites WHERE token_hash = ? AND expires > ? AND claimed_by IS NULL
            ON CONFLICT(email) DO NOTHING RETURNING id`).bind(ownerId, salt, hash, inviteHash, now),
          db.prepare(`UPDATE workspace_invites SET claimed_by = ?
            WHERE token_hash = ? AND claimed_by IS NULL AND EXISTS (SELECT 1 FROM workspace_owners WHERE id = ?)`)
            .bind(ownerId, inviteHash, ownerId)
        ]);
        if (!insert.results?.length) return json({ error: 'This invite is invalid, expired, already used, or the email has an account.' }, 400);
        return signIn(db, ownerId, now);
      }
      const email = emailAddress(input.email);
      const owner = email ? await db.prepare('SELECT id,password_salt,password_hash FROM workspace_owners WHERE email = ?').bind(email).first() : null;
      const hash = await passwordHash(password, owner?.password_salt || 'missing-owner', pepper);
      if (!owner || !equalHash(hash, owner.password_hash)) return json({ error: 'Incorrect email or password.' }, 401);
      return signIn(db, owner.id, now);
    }
    const session = tokenHash ? await db.prepare('SELECT owner_id FROM workspace_sessions WHERE token_hash = ? AND expires > ?').bind(tokenHash, now).first() : null;
    if (request.method === 'GET') {
      const canInvite = Boolean(await adminSessionHash(request, env, now));
      if (!session) return json({ error: 'Sign in to continue.', canInvite }, 401);
      const { results } = await db.prepare(`SELECT ${select} FROM storefront_workspaces WHERE owner_id = ? ORDER BY slug`).bind(session.owner_id).all();
      return json({ shops: results.map(present), canInvite });
    }
    if (!session) return json({ error: 'Sign in to continue.' }, 401);
    const profile = cleanProfile(input);
    if (!profile) return json({ error: 'Check the shop name, description and WhatsApp number.' }, 400);
    const { name, description, whatsapp } = profile;
    if (action === 'create') {
      const slug = input.slug;
      if (typeof slug !== 'string' || slug.length < 3 || slug.length > 48 || !slugPattern.test(slug)) {
        return json({ error: 'Use 3–48 lowercase letters, digits or hyphens for the shop URL.' }, 400);
      }
      const shop = await db.prepare(`INSERT INTO storefront_workspaces (id,owner_id,slug,name,description,whatsapp)
        VALUES (?,?,?,?,?,?) ON CONFLICT(slug) DO NOTHING RETURNING ${select}`)
        .bind(crypto.randomUUID(), session.owner_id, slug, name, description, whatsapp).first();
      return shop ? json({ shop: present(shop) }, 201) : json({ error: 'That shop URL is already taken.' }, 409);
    }
    if (action === 'update' && typeof input.id === 'string' && typeof input.published === 'boolean') {
      const shop = await db.prepare(`UPDATE storefront_workspaces SET name = ?, description = ?, whatsapp = ?, published = ?
        WHERE id = ? AND owner_id = ? RETURNING ${select}`)
        .bind(name, description, whatsapp, Number(input.published), input.id, session.owner_id).first();
      return shop ? json({ shop: present(shop) }) : json({ error: 'Shop not found.' }, 404);
    }
    return json({ error: 'Invalid workspace action.' }, 400);
  } catch {
    return json({ error: 'The storefront service is unavailable.' }, 502);
  }
}

export async function publicWorkspace(env, slug) {
  if (!env.CATALOG_DB || !slugPattern.test(slug) || slug.length > 48) return null;
  return present(await env.CATALOG_DB.prepare(`SELECT ${select} FROM storefront_workspaces WHERE slug = ? AND published = 1`).bind(slug).first());
}
