import { findShop, shopCatalog } from '../api/shop-catalog.js';
import { onRequestGet as publicShop } from '../shops/[[path]].js';

export async function onRequestGet({ request, env, params, next }) {
  if (!env.CATALOG_DB) return next();
  const shop = await findShop(env.CATALOG_DB, 'flawless-glow-co', null, true);
  if (!shop || !shop.published) return next();
  const catalog = await shopCatalog(env.CATALOG_DB, shop.id);
  if (!catalog.some((product) => !product.hidden)) return next();
  return publicShop({ request, env, params: { path: ['flawless-glow-co', ...(params.path || [])] } });
}
