const sessionCookie = '__Host-shop-session';
const select = 'id,slug,name,description,whatsapp,published';
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const phonePattern = /^[1-9][0-9]{7,14}$/;
const noStore = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (value, status = 200, headers = {}) => Response.json(value, { status, headers: { ...noStore, ...headers } });

function config(env) {
  const { SHOP_SUPABASE_URL: raw, SHOP_SUPABASE_PUBLIC_KEY: key } = env;
  if (!raw || !key) return null;
  const url = new URL(raw);
  return url.protocol === 'https:' && !url.username && !url.password ? { origin: url.origin, key } : null;
}

function upstream(settings, path, { token, method = 'GET', body, prefer } = {}) {
  return fetch(new URL(path, settings.origin), {
    method, redirect: 'error', signal: AbortSignal.timeout(12000),
    headers: {
      apikey: settings.key,
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

function cookie(value, age) {
  return `${sessionCookie}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
}

function cleanProfile(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const description = typeof input?.description === 'string' ? input.description.trim() : '';
  const whatsapp = typeof input?.whatsapp === 'string' ? input.whatsapp.trim().replace(/^\+/, '') : '';
  if (!name || name.length > 100 || description.length > 300 || (whatsapp && !phonePattern.test(whatsapp))) return null;
  return { name, description, whatsapp };
}

export async function onRequest({ request, env }) {
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
  if (request.method === 'POST' && request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Invalid request origin.' }, 403);
  }
  try {
    const settings = config(env);
    if (!settings) return json({ error: 'Shared owner sign-in has not been configured.' }, 503);
    const input = request.method === 'POST' ? await request.json().catch(() => null) : null;
    const action = input?.action;
    if (action === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
    if (action === 'otp' || action === 'verify') {
      const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Enter a valid email address.' }, 400);
      if (action === 'otp') {
        const response = await upstream(settings, '/auth/v1/otp', { method: 'POST', body: { email, create_user: true } });
        return response.ok ? json({ ok: true }) : json({ error: 'Could not send a code. Wait before trying again.' }, response.status === 429 ? 429 : 502);
      }
      if (typeof input.code !== 'string' || !/^\d{6,10}$/.test(input.code)) return json({ error: 'Enter the code from your email.' }, 400);
      const response = await upstream(settings, '/auth/v1/verify', { method: 'POST', body: { email, token: input.code, type: 'email' } });
      if (!response.ok) return json({ error: 'The code is invalid or expired.' }, 401);
      const data = await response.json();
      if (typeof data.access_token !== 'string' || !/^[A-Za-z0-9._-]+$/.test(data.access_token)) return json({ error: 'Sign-in could not be completed.' }, 502);
      const lifetime = Math.max(1, Math.min(3600, Number(data.expires_in) || 3600));
      return json({ ok: true }, 200, { 'Set-Cookie': cookie(data.access_token, lifetime) });
    }
    const token = request.headers.get('Cookie')?.match(/(?:^|; )__Host-shop-session=([A-Za-z0-9._-]+)(?:;|$)/)?.[1];
    if (!token) return json({ error: 'Sign in to continue.' }, 401);
    const auth = await upstream(settings, '/auth/v1/user', { token });
    if (!auth.ok) return json({ error: 'Sign in to continue.' }, 401);
    const user = await auth.json();
    if (request.method === 'GET') {
      const result = await upstream(settings, '/rest/v1/rpc/my_storefront_workspaces', { token, method: 'POST', body: {} });
      return result.ok ? json({ shops: await result.json() }) : json({ error: 'Could not load your shops.' }, 502);
    }
    const profile = cleanProfile(input);
    if (!profile) return json({ error: 'Check the shop name, description and WhatsApp number.' }, 400);
    if (action === 'create') {
      const slug = input.slug;
      if (typeof slug !== 'string' || slug.length < 3 || slug.length > 48 || !slugPattern.test(slug)) {
        return json({ error: 'Use 3–48 lowercase letters, digits or hyphens for the shop URL.' }, 400);
      }
      const result = await upstream(settings, '/rest/v1/storefront_workspaces?select=' + select, {
        token, method: 'POST', body: { ...profile, slug, owner_id: user.id }, prefer: 'return=representation'
      });
      if (result.status === 409) return json({ error: 'That shop URL is already taken.' }, 409);
      if (!result.ok) return json({ error: 'Could not create the shop.' }, 502);
      const [shop] = await result.json();
      return json({ shop }, 201);
    }
    if (action === 'update' && /^[0-9a-f-]{36}$/i.test(input.id ?? '') && typeof input.published === 'boolean') {
      // Published rows are readable by design; RLS separately gates writes.
      const query = new URLSearchParams({ id: 'eq.' + input.id, select });
      const result = await upstream(settings, '/rest/v1/storefront_workspaces?' + query, {
        token, method: 'PATCH', body: { ...profile, published: input.published }, prefer: 'return=representation'
      });
      if (!result.ok) return json({ error: 'Could not update the shop.' }, 502);
      const [shop] = await result.json();
      return shop ? json({ shop }) : json({ error: 'Shop not found.' }, 404);
    }
    return json({ error: 'Invalid workspace action.' }, 400);
  } catch {
    return json({ error: 'The storefront service is unavailable.' }, 502);
  }
}

export async function publicWorkspace(env, slug) {
  const settings = config(env);
  if (!settings || !slugPattern.test(slug) || slug.length > 48) return null;
  const query = new URLSearchParams({ select, slug: 'eq.' + slug, published: 'eq.true', limit: '1' });
  const response = await upstream(settings, '/rest/v1/storefront_workspaces?' + query);
  if (!response.ok) throw new Error('Could not load storefront.');
  const [shop] = await response.json();
  return shop ?? null;
}
