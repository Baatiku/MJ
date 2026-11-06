import { categories } from '../../src/catalog/products.js';
import { readCatalog } from '../../src/catalog/live.js';
import { readOrderNumber } from '../../src/catalog/shop-settings.js';
import { originalMarker, originalSlug } from '../_original-id.js';
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

function usernameKey(value) {
  const username = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return username.length >= 3 && username.length <= 32 && slugPattern.test(username)
    ? 'username:' + username : null;
}

function validShopSlug(slug) {
  return typeof slug === 'string' && slug.length >= 3 && slug.length <= 48 && slugPattern.test(slug) && slug !== originalSlug;
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

export async function workspaceOwner(request, db, now = Math.floor(Date.now() / 1000)) {
  if (!db) return null;
  const token = request.headers.get('Cookie')?.match(/(?:^|; )__Host-shop-session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  const row = await db.prepare('SELECT owner_id FROM workspace_sessions WHERE token_hash = ? AND expires > ?')
    .bind(await digest(token), now).first();
  return row?.owner_id ?? null;
}

async function newSession(db, ownerId, now) {
  const token = randomToken();
  const statement = db.prepare('INSERT INTO workspace_sessions VALUES (?, ?, ?)')
    .bind(await digest(token), ownerId, now + sessionSeconds);
  return { statement, header: { 'Set-Cookie': cookie(token, sessionSeconds) } };
}

async function signIn(db, ownerId, now) {
  const { statement, header } = await newSession(db, ownerId, now);
  await db.batch([
    db.prepare('DELETE FROM workspace_sessions WHERE expires <= ?').bind(now),
    statement
  ]);
  return json({ ok: true }, 200, header);
}

export async function onRequest({ request, env }) {
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
  const origin = new URL(request.url).origin;
  if (request.method === 'POST' && request.headers.get('Origin') !== origin) {
    return json({ error: 'Invalid request origin.' }, 403);
  }
  const db = env.CATALOG_DB;
  const pepper = env.SHOP_PASSWORD_PEPPER;
  if (!db) return json({ error: 'Shop database is unavailable.' }, 503);
  if (typeof pepper !== 'string' || pepper.length < 32) return json({ error: 'Shared owner sign-in has not been configured.' }, 503);
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
    if (action === 'import-original') {
      if (!await adminSessionHash(request, env, now)) return json({ error: 'Platform admin sign-in is required.' }, 403);
      const email = emailAddress(input.email);
      const owner = email && await db.prepare('SELECT id FROM workspace_owners WHERE email = ?').bind(email).first();
      if (!owner) return json({ error: 'The owner must accept their invitation first.' }, 400);
      const existing = await db.prepare('SELECT id FROM storefront_workspaces WHERE slug = ?').bind(originalSlug).first();
      if (existing) return json({ error: 'Maknoon Jamil already has an owner workspace.' }, 409);
      const [products, whatsapp] = await Promise.all([readCatalog(db), readOrderNumber(db)]);
      const shopId = crypto.randomUUID();
      await db.batch([
        db.prepare('INSERT INTO storefront_workspaces VALUES (?, ?, ?, ?, ?, ?, 1)')
          .bind(shopId, owner.id, originalSlug, 'Maknoon Jamil', 'Fluid silhouettes and rich colours, from wide-sleeve abayas to softly layered khimars.', whatsapp),
        db.prepare('INSERT INTO workspace_shop_appearance VALUES (?, ?)').bind(shopId, JSON.stringify({
          headline: 'Grace in every fold.', cover: '/previews/maknoon-jamil-square.jpg',
          banner: 'Get a free online store for your business',
          categoryLabels: Object.fromEntries(categories.map(({ id, name }) => [id, name]))
        })),
        ...products.map(({ revision, ...product }, index) => db.prepare('INSERT INTO workspace_shop_products VALUES (?, ?, ?, 1, ?)')
          .bind(shopId, product.id, JSON.stringify(product), index * 10)),
        db.prepare("INSERT INTO catalog_edits VALUES (?, '{}', 1)").bind(originalMarker)
      ]);
      return json({ ok: true, admin: '/manage/' + originalSlug + '/' }, 201);
    }
    if (action === 'accept' || action === 'login' || action === 'register') {
      const password = input.password;
      if (typeof password !== 'string' || password.length < 14 || password.length > 128) {
        return json({ error: 'Use a password between 14 and 128 characters.' }, 400);
      }
      if (!await allowAttempt(db, request, action, now)) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
      if (action === 'register') {
        if (tokenHash && await workspaceOwner(request, db, now)) {
          return json({ error: 'You are already signed in. Create another shop from your dashboard.' }, 409);
        }
        const username = usernameKey(input.username);
        const profile = cleanProfile(input);
        if (!username) return json({ error: 'Use 3–32 letters, digits or hyphens for your username.' }, 400);
        if (!profile || !validShopSlug(input.slug)) {
          return json({ error: 'Enter a shop name and an available URL name with 3–48 lowercase letters, digits or hyphens.' }, 400);
        }
        const ownerId = crypto.randomUUID();
        const salt = randomToken();
        const hash = await passwordHash(password, salt, pepper);
        const { statement, header } = await newSession(db, ownerId, now);
        try {
          const [, inserted] = await db.batch([
            db.prepare('INSERT INTO workspace_owners (id,email,password_salt,password_hash) VALUES (?, ?, ?, ?)')
              .bind(ownerId, username, salt, hash),
            db.prepare(`INSERT INTO storefront_workspaces (id,owner_id,slug,name,description,whatsapp)
              VALUES (?,?,?,?,?,?) RETURNING ${select}`)
              .bind(crypto.randomUUID(), ownerId, input.slug, profile.name, profile.description, profile.whatsapp),
            statement
          ]);
          return json({ shop: present(inserted.results[0]) }, 201, header);
        } catch (error) {
          const [owner, shop] = await Promise.all([
            db.prepare('SELECT id FROM workspace_owners WHERE email = ?').bind(username).first(),
            db.prepare('SELECT id FROM storefront_workspaces WHERE slug = ?').bind(input.slug).first()
          ]);
          if (owner) return json({ error: 'That username is already in use. Sign in or choose another.' }, 409);
          if (shop) return json({ error: 'That shop URL is already taken.' }, 409);
          throw error;
        }
      }
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
      const identity = input.identity ?? input.email;
      const key = emailAddress(identity) || usernameKey(identity);
      const owner = key ? await db.prepare('SELECT id,password_salt,password_hash FROM workspace_owners WHERE email = ?').bind(key).first() : null;
      const hash = await passwordHash(password, owner?.password_salt || 'missing-owner', pepper);
      if (!owner || !equalHash(hash, owner.password_hash)) return json({ error: 'Incorrect email or password.' }, 401);
      return signIn(db, owner.id, now);
    }
    const session = tokenHash ? await db.prepare('SELECT owner_id FROM workspace_sessions WHERE token_hash = ? AND expires > ?').bind(tokenHash, now).first() : null;
    if (request.method === 'GET') {
      const canInvite = Boolean(await adminSessionHash(request, env, now));
      if (new URL(request.url).searchParams.get('platform') === '1') {
        if (!canInvite) return json({ error: 'Platform admin sign-in is required.' }, 401);
        const { results } = await db.prepare(`SELECT ${select} FROM storefront_workspaces ORDER BY slug`).all();
        return json({ shops: results.map(present), canInvite });
      }
      if (!session) return json({ error: 'Sign in to continue.', canInvite }, 401);
      const { results } = await db.prepare(`SELECT ${select} FROM storefront_workspaces WHERE owner_id = ? ORDER BY slug`).bind(session.owner_id).all();
      return json({ shops: results.map(present), canInvite });
    }
    if (!session) return json({ error: 'Sign in to continue.' }, 401);
    if (action === 'change-password') {
      if (typeof input.password !== 'string' || input.password.length < 14 || input.password.length > 128 ||
          typeof input.currentPassword !== 'string' || input.currentPassword.length > 128) {
        return json({ error: 'Use a new password between 14 and 128 characters.' }, 400);
      }
      if (!await allowAttempt(db, request, action, now)) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
      const owner = await db.prepare('SELECT password_salt,password_hash FROM workspace_owners WHERE id = ?').bind(session.owner_id).first();
      if (!owner || !equalHash(await passwordHash(input.currentPassword, owner.password_salt, pepper), owner.password_hash)) {
        return json({ error: 'Incorrect current password.' }, 400);
      }
      const salt = randomToken();
      const hash = await passwordHash(input.password, salt, pepper);
      const [changed] = await db.batch([
        db.prepare('UPDATE workspace_owners SET password_salt = ?, password_hash = ? WHERE id = ? AND password_hash = ? RETURNING id')
          .bind(salt, hash, session.owner_id, owner.password_hash),
        db.prepare('DELETE FROM workspace_sessions WHERE owner_id = ? AND EXISTS (SELECT 1 FROM workspace_owners WHERE id = ? AND password_hash = ?)')
          .bind(session.owner_id, session.owner_id, hash)
      ]);
      return changed.results.length ? signIn(db, session.owner_id, now) : json({ error: 'Password already changed. Sign in again.' }, 409);
    }
    const profile = cleanProfile(input);
    if (!profile) return json({ error: 'Check the shop name, description and WhatsApp number.' }, 400);
    const { name, description, whatsapp } = profile;
    if (action === 'create') {
      const slug = input.slug;
      if (!validShopSlug(slug)) {
        return json({ error: 'Choose an available shop URL with 3–48 lowercase letters, digits or hyphens.' }, 400);
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
