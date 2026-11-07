import { workspaceOwner } from './workspaces.js';
import { adminSessionHash } from './admin.js';

export const mediaPath = /^\/shop-media\/([a-f0-9-]{36})$/;

export async function serveMedia(request, env) {
  const match = mediaPath.exec(new URL(request.url).pathname);
  if (!match || !env.CATALOG_DB) return new Response(null, { status: 404 });
  const db = env.CATALOG_DB;
  const photo = await db.prepare(`SELECT m.data, m.shop_id, s.owner_id, s.published FROM workspace_shop_media m
    JOIN storefront_workspaces s ON s.id = m.shop_id WHERE m.id = ?`).bind(match[1]).first();
  if (!photo || (photo.published !== 1 && await workspaceOwner(request, db) !== photo.owner_id &&
      !await adminSessionHash(request, env))) return new Response(null, { status: 404 });
  const stored = new Uint8Array(photo.data);
  let body = stored;
  if (stored.byteLength === 1 && stored[0] === 0) {
    const object = await env.SHOP_IMAGES?.get('shop-media/' + photo.shop_id + '/' + match[1] + '.jpg');
    if (!object) return new Response(null, { status: 404 });
    body = object.body;
  }
  return new Response(body, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}
