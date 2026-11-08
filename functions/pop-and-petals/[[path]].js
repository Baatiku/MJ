import { findShop } from '../api/shop-catalog.js';
import { onRequestGet as publicShop } from '../shops/[[path]].js';

export async function onRequestGet({ request, env, params, next }) {
  if (!env.CATALOG_DB) return next();
  const shop = await findShop(env.CATALOG_DB, 'pop-and-petals', null, true);
  if (!shop) return next();
  if (!shop.published) return new Response('Storefront unavailable', { status: 404 });
  return publicShop({ request, env, params: { path: ['pop-and-petals', ...(params.path || [])] } });
}
