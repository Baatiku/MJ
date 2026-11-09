import { sitemapXml, curatedSitemapShops } from '../src/lib/sitemap.js';
import { readCatalog } from '../src/catalog/live.js';
import { shopCatalog } from './api/shop-catalog.js';

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  let shops = curatedSitemapShops;
  if (env.CATALOG_DB) {
    try {
      const { results } = await env.CATALOG_DB.prepare('SELECT id,slug,published FROM storefront_workspaces ORDER BY slug LIMIT 1000').all();
      const stored = new Map(results.map((shop) => [shop.slug, shop]));
      shops = [];
      for (const curated of curatedSitemapShops) {
        const slug = curated.home.split('/')[1];
        const shop = stored.get(slug);
        if (shop?.published === 0) continue;
        const catalog = shop ? await shopCatalog(env.CATALOG_DB, shop.id)
          : slug === 'maknoon-jamil' ? await readCatalog(env.CATALOG_DB) : curated.catalog;
        // The historic empty Flawless Glow draft serves the static collection.
        shops.push({ home: curated.home, catalog: slug === 'flawless-glow-co' && !catalog.length ? curated.catalog : catalog });
      }
      for (const shop of results) {
        if (!shop.published || ['maknoon-jamil', 'pop-and-petals', 'flawless-glow-co'].includes(shop.slug)) continue;
        shops.push({ home: `/shops/${shop.slug}/`, catalog: await shopCatalog(env.CATALOG_DB, shop.id) });
      }
    } catch {
      // The statically verified sitemap remains available during D1 upgrades.
      shops = curatedSitemapShops;
    }
  }
  return new Response(sitemapXml(origin, shops), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=900', 'X-Content-Type-Options': 'nosniff' }
  });
}
