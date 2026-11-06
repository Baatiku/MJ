import { storefront } from '../src/components/storefront.js';
import { readCatalog } from '../src/catalog/live.js';
import { page } from './_catalog.js';

export async function onRequestGet({ request, env }) {
  const catalog = env.CATALOG_DB ? await readCatalog(env.CATALOG_DB) : undefined;
  const { origin, pathname } = new URL(request.url);
  const sharePath = pathname === '/catalog' || pathname === '/catalog/' ? '/catalog/' : '/';
  return page(storefront(origin, catalog?.filter((product) => !product.hidden), sharePath));
}
