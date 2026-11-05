import { storefront } from '../src/components/storefront.js';
import { readCatalog } from '../src/catalog/live.js';
import { page } from './_catalog.js';

export async function onRequestGet({ request, env }) {
  const catalog = env.CATALOG_DB ? await readCatalog(env.CATALOG_DB) : undefined;
  return page(storefront(new URL(request.url).origin, catalog?.filter((product) => !product.hidden)));
}
