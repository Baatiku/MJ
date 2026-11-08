import { originalView } from '../_original-shop.js';
import { readOrderNumber } from '../../src/catalog/shop-settings.js';
import { variantPage } from '../../src/components/variant-page.js';
import { readCatalog } from '../../src/catalog/live.js';
import { page } from '../_catalog.js';

export async function onRequestGet({ request, env, params, next }) {
  if (!env.CATALOG_DB) return next();
  const path = Array.isArray(params.path) ? params.path : [];
  const [productId, colourId] = path;
  const original = await originalView(env.CATALOG_DB);
  const [catalog, number] = original
    ? [original.published ? original.products : [], original.whatsapp]
    : await Promise.all([readCatalog(env.CATALOG_DB), readOrderNumber(env.CATALOG_DB)]);
  const product = catalog.find(({ id, hidden }) => id === productId && !hidden);
  const variant = product?.variants.find(({ id }) => id === colourId);
  if (!variant || path.length !== 2) {
    return page('<!doctype html><title>Style unavailable</title><h1>Style unavailable</h1><a href="/#collection">Browse the collection</a>', 404);
  }
  const home = new URL(request.url).pathname.startsWith('/maknoon-jamil/') ? '/maknoon-jamil/' : '/';
  return page(variantPage(product, variant, new URL(request.url).origin, number, { ...original?.brand, home }));
}
