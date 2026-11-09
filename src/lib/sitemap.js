import { products } from '../catalog/products.js';
import { popPetalsProducts } from '../catalog/pop-petals.js';
import { flawlessGlowProducts } from '../catalog/flawless-glow.js';
import { variantPath } from './shop.js';

export const curatedSitemapShops = [
  { home: '/maknoon-jamil/', catalog: products },
  { home: '/pop-and-petals/', catalog: popPetalsProducts },
  { home: '/flawless-glow-co/', catalog: flawlessGlowProducts }
];

const xml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export function sitemapXml(origin, shops = curatedSitemapShops) {
  const paths = new Set(['/', '/contact/']);
  for (const { home, catalog } of shops) {
    paths.add(home);
    for (const product of catalog) {
      if (product.hidden) continue;
      for (const variant of product.variants) paths.add(variantPath(product, variant, home));
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...paths].map((path) => `  <url><loc>${xml(new URL(path, origin).href)}</loc></url>`).join('\n')}\n</urlset>\n`;
}
