import { access, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { categories, products } from '../src/catalog/products.js';
import { storefront } from '../src/components/storefront.js';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const images = new Set([
  ...categories.map(({ image }) => image),
  ...products.flatMap(({ variants }) => variants.map(({ image }) => image))
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
await writeFile(new URL('index.html', output), storefront());
console.log(`Built ${products.length} styles with ${images.size} images in dist/.`);
