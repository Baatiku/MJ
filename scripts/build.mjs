import { access, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { categories, products } from '../src/catalog/products.js';
import { storefront } from '../src/components/storefront.js';
import { variantPage } from '../src/components/variant-page.js';
import { previewImage, variantPath, whatsappNumber } from '../src/lib/shop.js';

const publicSiteUrl = 'https://mj.masanawa.com';
const origin = new URL(process.env.SITE_URL || publicSiteUrl).origin;

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const images = new Set([
  ...categories.map(({ image }) => image),
  ...products.flatMap(({ variants }) => variants.flatMap((variant) => [variant.image, previewImage(variant)]))
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
await cp(new URL('src/lib/shop.js', root), new URL('lib/shop.js', output));
await writeFile(new URL('lib/shop-number.js', output), `export const whatsappNumber = ${JSON.stringify(whatsappNumber)};\n`);
await writeFile(new URL('index.html', output), storefront(origin));
await writeFile(new URL('catalog/index.html', output), storefront(origin, undefined, '/catalog/'));
for (const product of products) {
  for (const variant of product.variants) {
    const directory = new URL(`.${variantPath(product, variant)}`, output);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('index.html', directory), variantPage(product, variant, origin));
  }
}
console.log(`Built ${products.length} styles with ${images.size} images in dist/.`);
