import { workspaceOwner } from './workspaces.js';
import { adminSessionHash } from './admin.js';
import { validateProduct } from '../../src/catalog/live.js';
import { mediaPath } from './_shop-media.js';
import { normalizeOrderNumber } from '../../src/catalog/shop-settings.js';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (data, status = 200) => Response.json(data, { status, headers });
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const columns = 'id,slug,name,description,whatsapp,published';

export async function findShop(db, slug, ownerId, operator = false) {
  if (!db || !slug || slug.length > 48 || !slugPattern.test(slug)) return null;
  const predicate = operator ? '' : ownerId ? ' AND owner_id = ?' : ' AND published = 1';
  const row = await db.prepare(`SELECT ${columns} FROM storefront_workspaces WHERE slug = ?${predicate}`)
    .bind(slug, ...(!operator && ownerId ? [ownerId] : [])).first();
  return row ? { ...row, published: row.published === 1 } : null;
}

export async function shopCatalog(db, shopId) {
  const { results } = await db.prepare('SELECT document,revision,position FROM workspace_shop_products WHERE shop_id = ? ORDER BY position, product_id').bind(shopId).all();
  return results.map(({ document, revision, position }) => ({ ...JSON.parse(document), revision, position }));
}

export async function shopAppearance(db, shopId) {
  const row = await db.prepare('SELECT document FROM workspace_shop_appearance WHERE shop_id = ?').bind(shopId).first();
  return row ? JSON.parse(row.document) : {};
}

function image(value) {
  if (!value) return '';
  if (typeof value !== 'string' || value.length > 500) return null;
  if (mediaPath.test(value) || value === '/previews/maknoon-jamil-square.jpg') return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function settings(input) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const whatsapp = input.whatsapp ? normalizeOrderNumber(input.whatsapp) : '';
  const logo = image(input.logo);
  const cover = image(input.cover);
  const headline = typeof input.headline === 'string' ? input.headline.trim() : '';
  const banner = typeof input.banner === 'string' ? input.banner.trim() : '';
  const accent = input.accent || '';
  const categoryLabels = input.categoryLabels ?? {};
  if (!name || name.length > 100 || description.length > 300 || whatsapp === null ||
      logo === null || cover === null || headline.length > 100 || banner.length > 120 ||
      (accent && !/^#[a-fA-F0-9]{6}$/.test(accent)) || typeof input.published !== 'boolean' ||
      !categoryLabels || typeof categoryLabels !== 'object' || Array.isArray(categoryLabels) ||
      Object.keys(categoryLabels).length > 24 || Object.entries(categoryLabels).some(([key,value]) =>
        !slugPattern.test(key) || key.length > 50 || typeof value !== 'string' || value.trim().length > 60)) return null;
  return { name, description, whatsapp, published: input.published, appearance: { logo, cover, headline, banner, accent, categoryLabels } };
}

async function ownsMedia(db, shopId, urls) {
  for (const url of new Set(urls)) {
    const match = mediaPath.exec(url);
    if (match && !await db.prepare('SELECT id FROM workspace_shop_media WHERE id = ? AND shop_id = ?')
      .bind(match[1], shopId).first()) return false;
  }
  return true;
}

export async function onRequest({ request, env }) {
  if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
  const url = new URL(request.url);
  if (request.method === 'PUT' && request.headers.get('Origin') !== url.origin) return json({ error: 'Invalid request origin.' }, 403);
  const db = env.CATALOG_DB;
  if (!db) return json({ error: 'Shop storage has not been configured.' }, 503);
  try {
    const [owner, operator] = await Promise.all([workspaceOwner(request, db), adminSessionHash(request, env)]);
    if (!owner && !operator) return json({ error: 'Sign in to continue.' }, 401);
    const shop = await findShop(db, url.searchParams.get('shop'), owner, Boolean(operator));
    if (!shop) return json({ error: 'Shop not found.' }, 404);
    if (request.method === 'GET') {
      const [products, appearance] = await Promise.all([shopCatalog(db, shop.id), shopAppearance(db, shop.id)]);
      return json({ shop, products, appearance });
    }
    const input = await request.json().catch(() => null);
    if (!input) return json({ error: 'Invalid request.' }, 400);
    if (input.action === 'upload-photo') {
      if (typeof input.data !== 'string' || input.data.length > 900000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(input.data)) {
        return json({ error: 'Choose a smaller photo.' }, 400);
      }
      let bytes;
      try { bytes = atob(input.data); } catch { return json({ error: 'Invalid photo.' }, 400); }
      if (!bytes.startsWith('\xff\xd8\xff')) return json({ error: 'This photo could not be converted to JPEG.' }, 400);
      const id = crypto.randomUUID();
      const photo = Uint8Array.from(bytes, (byte) => byte.charCodeAt(0));
      const key = 'shop-media/' + shop.id + '/' + id + '.jpg';
      if (env.SHOP_IMAGES) await env.SHOP_IMAGES.put(key, photo, { httpMetadata: { contentType: 'image/jpeg' } });
      try {
        await db.prepare('INSERT INTO workspace_shop_media VALUES (?, ?, ?)')
          .bind(id, shop.id, env.SHOP_IMAGES ? new Uint8Array([0]).buffer : photo.buffer).run();
      } catch (error) {
        if (env.SHOP_IMAGES) await env.SHOP_IMAGES.delete(key).catch(() => {});
        throw error;
      }
      return json({ url: '/shop-media/' + id }, 201);
    }
    if (input.action === 'settings') {
      const update = settings(input);
      if (!update) return json({ error: 'Check the storefront settings and photo links.' }, 400);
      const { name, description, whatsapp, published, appearance } = update;
      if (!await ownsMedia(db, shop.id, [appearance.logo, appearance.cover])) return json({ error: 'Upload photos for this shop.' }, 400);
      await db.batch([
        db.prepare('UPDATE storefront_workspaces SET name = ?, description = ?, whatsapp = ?, published = ? WHERE id = ?')
          .bind(name, description, whatsapp, Number(published), shop.id),
        db.prepare('INSERT INTO workspace_shop_appearance VALUES (?, ?) ON CONFLICT(shop_id) DO UPDATE SET document = excluded.document')
          .bind(shop.id, JSON.stringify(appearance))
      ]);
      return json({ shop: { ...shop, name, description, whatsapp, published }, appearance });
    }
    if (input.action === 'delete-product' && typeof input.id === 'string' && Number.isSafeInteger(input.revision) && input.revision > 0) {
      const row = await db.prepare('DELETE FROM workspace_shop_products WHERE shop_id = ? AND product_id = ? AND revision = ? RETURNING product_id')
        .bind(shop.id, input.id, input.revision).first();
      return row ? json({ ok: true }) : json({ error: 'Product changed. Refresh before removing it.' }, 409);
    }
    if (input.action !== 'save-product') return json({ error: 'Invalid shop action.' }, 400);
    let product;
    try { product = validateProduct(input.product, { workspace: true }); }
    catch (error) { return json({ error: error.message }, 400); }
    if (!await ownsMedia(db, shop.id, product.variants.map(({ image }) => image))) return json({ error: 'Upload photos for this shop.' }, 400);
    const { revision, position } = input.product;
    if (!Number.isSafeInteger(position) || position < 0 || position > 100000) return json({ error: 'Use a valid display order.' }, 400);
    const saved = revision === 0
      ? await db.prepare('INSERT INTO workspace_shop_products VALUES (?, ?, ?, 1, ?) ON CONFLICT DO NOTHING RETURNING revision')
        .bind(shop.id, product.id, JSON.stringify(product), position).first()
      : await db.prepare('UPDATE workspace_shop_products SET document = ?, revision = revision + 1, position = ? WHERE shop_id = ? AND product_id = ? AND revision = ? RETURNING revision')
        .bind(JSON.stringify(product), position, shop.id, product.id, revision).first();
    return saved ? json({ product: { ...product, revision: saved.revision, position } }) : json({ error: 'Product changed or the URL is already taken. Refresh before saving.' }, 409);
  } catch {
    return json({ error: 'Shop storage is unavailable. Check the deployment and database migration.' }, 503);
  }
}
