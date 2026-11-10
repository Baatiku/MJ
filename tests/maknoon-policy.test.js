import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { products } from '../src/catalog/products.js';
import { readCatalog } from '../src/catalog/live.js';
import { correctMaknoonProduct, maknoonPolicyEdition, retiredMaknoonIds } from '../src/catalog/maknoon-policy.js';
import { withMaknoonPhotoBatch } from '../src/catalog/maknoon-photo-batch.js';
import { storefront } from '../src/components/storefront.js';
import { validateProduct } from '../src/catalog/live.js';
import { sitemapXml } from '../src/lib/sitemap.js';

const get = (id) => products.find((product) => product.id === id);

test('all owner-requested product retirements disappear from public catalogue, routes and SEO', () => {
  assert.equal(retiredMaknoonIds.size, 7);
  const page = storefront('https://shop.masanawa.com');
  const sitemap = sitemapXml('https://shop.masanawa.com');
  for (const id of retiredMaknoonIds) {
    assert.equal(get(id), undefined);
    assert.doesNotMatch(page, new RegExp(`id="${id}"`));
    assert.doesNotMatch(sitemap, new RegExp(`/products/${id}/`));
  }
});

test('correct titles, fabric terminology and all category-wide prices apply', () => {
  const expected = [
    ['satin-waterfall-abaya', 'Waterfall Abaya', 40000],
    ['burgundy-satin-drape', 'Burgundy Waterfall Abaya', 40000],
    ['full-coverage-satin-khimar', 'Mocha Khimar', 30000],
    ['covered-button-abaya', 'Cape Abaya', null],
    ['chiffon-wrap', 'Chiffon Wrap Veil', null],
    ['flow-abaya', 'The Flow Abaya', 25000],
    ['everyday-abaya', 'The Everyday Abaya', 25000],
    ['pleated-abaya', 'The Pleated Cuff Abaya', 25000],
    ['cape-sleeve-abaya', 'Cape-Sleeve Abaya', 30000]
  ];
  for (const [id, name, price] of expected) {
    assert.equal(get(id)?.name, name);
    assert.equal(get(id)?.price, price);
  }
  for (const item of products) {
    if (/jilbab/i.test(item.name)) assert.equal(item.price, 15000, item.name);
    else if (/khimar/i.test(item.name) || item.category === 'khimar') assert.equal(item.price, 30000, item.name);
  }
  const umbrella = { id: 'umbrella-hijab', name: 'Classic Umbrella Hijab', category: 'headwear', price: null, variants: [] };
  assert.equal(correctMaknoonProduct(umbrella).price, 15000);
  assert.equal(get('burgundy-satin-drape').category, 'abaya');
  assert.equal(get('full-coverage-jilbab').category, 'jilbab');
  assert.doesNotMatch(get('satin-waterfall-abaya').description, /satin/i);
  assert.doesNotMatch(get('covered-button-abaya').description, /covered buttons/i);
});

test('buttonless Cape Abaya images are used for every colour and the gallery', () => {
  const cape = get('covered-button-abaya');
  assert.deepEqual(cape.variants.map(({ id }) => id), ['navy', 'black', 'brown']);
  for (const image of [...cape.variants.map(({ image }) => image), ...cape.gallery]) {
    assert.match(image, /buttonless\.webp$/);
    assert.ok(existsSync(new URL(`../public${image}`, import.meta.url)));
    assert.ok(existsSync(new URL(`../public${image.replace('/images/', '/previews/').replace('.webp', '.jpg')}`, import.meta.url)));
  }
});

test('older D1 documents are corrected once and subsequent admin price edits survive', async () => {
  const stale = [
    { ...get('satin-waterfall-abaya'), maknoonPolicyEdition: undefined, name: 'Satin Waterfall Abaya', price: null },
    { ...get('full-coverage-jilbab'), maknoonPolicyEdition: undefined, category: 'khimar', price: null },
    { id: 'hooded-jilbab', name: 'Hooded Jilbab', category: 'layer', variants: [], price: null }
  ];
  const db = { prepare: () => ({ all: async () => ({ results: stale.map((item) => ({ id: item.id, document: JSON.stringify(item), revision: 2 })) }) }) };
  const live = await readCatalog(db);
  assert.equal(live.find(({ id }) => id === 'satin-waterfall-abaya')?.price, 40000);
  assert.equal(live.find(({ id }) => id === 'full-coverage-jilbab')?.price, 15000);
  assert.equal(live.some(({ id }) => id === 'hooded-jilbab'), false);
  const workspace = withMaknoonPhotoBatch(stale);
  assert.equal(workspace.some(({ id }) => id === 'hooded-jilbab'), false);
  assert.equal(workspace.find(({ id }) => id === 'satin-waterfall-abaya')?.name, 'Waterfall Abaya');
  const updatedByOwner = { ...live.find(({ id }) => id === 'satin-waterfall-abaya'), price: 42000 };
  assert.equal(updatedByOwner.maknoonPolicyEdition, maknoonPolicyEdition);
  assert.equal(correctMaknoonProduct(updatedByOwner).price, 42000);
});

test('expandable swatches preserve the circular selectors and admin supports 20+ priority colours', () => {
  const page = storefront('https://shop.masanawa.com');
  const waterfall = page.match(/<article[^>]+id="satin-waterfall-abaya"[\s\S]*?<\/article>/)?.[0];
  assert.match(waterfall, /class="swatches" data-collapsed/);
  assert.match(waterfall, /class="swatches-toggle" aria-expanded="false">\+1 more colours/);
  const base = get('chiffon-wrap');
  const twenty = Array.from({ length: 20 }, (_, i) => ({
    ...base.variants[0], id: `colour-${i + 1}`, name: `Colour ${i + 1}`
  }));
  const validated = validateProduct({ ...base, variants: twenty, hidden: false, available: true, revision: 0 });
  assert.equal(validated.variants.length, 20);
  const ordered = { ...base, variants: [base.variants[2], base.variants[0], base.variants[1]] };
  assert.match(storefront('https://shop.masanawa.com', [ordered]), new RegExp(`src="${ordered.variants[0].image}"`));
});
