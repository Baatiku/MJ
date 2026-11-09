import { access, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { categories, products } from '../src/catalog/products.js';
import { storefront } from '../src/components/storefront.js';
import { variantPage } from '../src/components/variant-page.js';
import { previewImage, variantPath, whatsappNumber } from '../src/lib/shop.js';
import { portfolio } from '../src/components/portfolio.js';
import { contactPage } from '../src/components/contact.js';
import { sitemapXml } from '../src/lib/sitemap.js';
import { flawlessGlowPage } from '../src/components/coming-soon.js';
import { popPetalsBrand, popPetalsProducts } from '../src/catalog/pop-petals.js';
import { flawlessGlowBrand, flawlessGlowProducts } from '../src/catalog/flawless-glow.js';

const publicSiteUrl = 'https://mj.masanawa.com';
const origin = new URL(process.env.SITE_URL || publicSiteUrl).origin;

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const images = new Set([
  ...categories.map(({ image }) => image),
  ...products.flatMap(({ variants }) => variants.flatMap((variant) => [variant.image, previewImage(variant)])),
  ...popPetalsProducts.flatMap(({ variants, gallery = [] }) => [...variants.flatMap((variant) => [variant.image, previewImage(variant)]), ...gallery]),
  ...flawlessGlowProducts.flatMap(({ variants, gallery = [] }) => [...variants.flatMap((variant) => [variant.image, previewImage(variant)]), ...gallery]),
  ...['maknoon-jamil', 'pop-and-petals', 'flawless-glow-co'].flatMap((name) => [`/images/brand-covers/${name}.webp`, `/previews/brand-covers/${name}.jpg`]),
  '/previews/shop-all-brands-v3.jpg', '/brand/shop-mark.svg', '/icons/apple-touch-icon.png', '/favicon.ico',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png'
]);

for (const image of images) {
  try {
    await access(new URL(`public${image}`, root));
  } catch {
    throw new Error(`Missing catalog image: ${image}`);
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL('public/', root), output, { recursive: true });
for (const path of ['catalog/', 'styles/', 'storefront.js']) {
  await cp(new URL(`src/${path}`, root), new URL(path, output), { recursive: true });
}
await mkdir(new URL('lib/', output));
for (const filename of ['shop.js', 'share-details.js', 'product-share.js', 'photo-upload.js']) {
  await cp(new URL('src/lib/' + filename, root), new URL('lib/' + filename, output));
}
await writeFile(new URL('lib/shop-number.js', output), `export const whatsappNumber = ${JSON.stringify(whatsappNumber)};\n`);
await writeFile(new URL('index.html', output), portfolio(origin));
await mkdir(new URL('contact/', output));
await writeFile(new URL('contact/index.html', output), contactPage(origin));
await writeFile(new URL('sitemap.xml', output), sitemapXml(origin));
await writeFile(new URL('catalog/index.html', output), storefront(origin, undefined, '/maknoon-jamil/', whatsappNumber, { home: '/maknoon-jamil/' }));
await mkdir(new URL('maknoon-jamil/', output));
await writeFile(new URL('maknoon-jamil/index.html', output), storefront(origin, undefined, '/maknoon-jamil/', whatsappNumber, { home: '/maknoon-jamil/' }));
await mkdir(new URL('pop-and-petals/', output));
await writeFile(new URL('pop-and-petals/index.html', output), storefront(origin, popPetalsProducts, '/pop-and-petals/', whatsappNumber, popPetalsBrand));
await mkdir(new URL('flawless-glow-co/', output));
await writeFile(new URL('flawless-glow-co/index.html', output), flawlessGlowPage(origin));
for (const product of products) {
  for (const variant of product.variants) {
    const pageHtml = variantPage(product, variant, origin, whatsappNumber, { home: '/maknoon-jamil/' });
    for (const home of ['/maknoon-jamil/', '/']) {
      const directory = new URL(`.${variantPath(product, variant, home)}`, output);
      await mkdir(directory, { recursive: true });
      await writeFile(new URL('index.html', directory), pageHtml);
    }
  }
}
for (const product of popPetalsProducts) {
  for (const variant of product.variants) {
    const directory = new URL(`.${variantPath(product, variant, popPetalsBrand.home)}`, output);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('index.html', directory), variantPage(product, variant, origin, whatsappNumber, popPetalsBrand));
  }
}
for (const product of flawlessGlowProducts) {
  for (const variant of product.variants) {
    const directory = new URL(`.${variantPath(product, variant, flawlessGlowBrand.home)}`, output);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('index.html', directory), variantPage(product, variant, origin, whatsappNumber, flawlessGlowBrand));
  }
}
console.log(`Built ${products.length} Maknoon styles, ${popPetalsProducts.length} Pop & Petals products and ${flawlessGlowProducts.length} Flawless Glow Co products with ${images.size} images in dist/.`);
