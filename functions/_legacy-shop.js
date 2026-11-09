import { originalView } from './_original-shop.js';
import { readOrderNumber } from '../src/catalog/shop-settings.js';
import { storefront } from '../src/components/storefront.js';
import { readCatalog } from '../src/catalog/live.js';
import { page } from './_catalog.js';
import { whatsappNumber } from '../src/lib/shop.js';

export async function legacyShopGet({ request, env }) {
  const { origin } = new URL(request.url);
  const home = '/maknoon-jamil/';
  const original = await originalView(env.CATALOG_DB);
  if (original) return original.published
    ? page(storefront(origin, original.products.filter(({ hidden }) => !hidden), home, original.whatsapp || whatsappNumber, { ...original.brand, home }))
    : page('<!doctype html><title>Shop unavailable</title><h1>Shop unavailable</h1>', 404);
  const [catalog, number] = await Promise.all([env.CATALOG_DB ? readCatalog(env.CATALOG_DB) : undefined, readOrderNumber(env.CATALOG_DB)]);
  return page(storefront(origin, catalog?.filter((product) => !product.hidden), home, number, { home }));
}
