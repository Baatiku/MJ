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
import { dressColours, dressColourEdition, expandDressColours } from '../src/catalog/dress-colours.js';
import { abayaColourEdition, expandAbayaColours, twentyColourAbayas } from '../src/catalog/abaya-colours.js';
import { garmentColourEdition, expandGarmentColours, twentyColourGarments } from '../src/catalog/garment-colours.js';

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
  assert.deepEqual(cape.variants.slice(0, 3).map(({ id }) => id), ['navy', 'black', 'brown']);
  for (const image of [...cape.variants.slice(0, 3).map(({ image }) => image), ...cape.gallery]) {
    assert.match(image, /buttonless\.webp$/);
    assert.ok(existsSync(new URL(`../public${image}`, import.meta.url)));
    assert.ok(existsSync(new URL(`../public${image.replace('/images/', '/previews/').replace('.webp', '.jpg')}`, import.meta.url)));
  }
});

test('image-complete Abayas have 20 named swatches, preserve old photo links and retain their priority', async () => {
  for (const id of twentyColourAbayas) {
    const abaya = get(id);
    assert.equal(abaya.abayaColourEdition, abayaColourEdition);
    assert.equal(expandAbayaColours(abaya), abaya);
    assert.equal(new Set(abaya.variants.map(({ id }) => id)).size, abaya.variants.length);
    const aliases = { navy: 'navy-blue', midnight: 'navy-blue', olive: 'olive-green', emerald: 'emerald-green' };
    const chosen = new Set(abaya.variants.map(({ id }) => aliases[id] || id));
    for (const [colourId, colourName] of dressColours) assert.ok(chosen.has(colourId), `${id} lacks ${colourName}`);
    const before = { ...abaya, abayaColourEdition: undefined, price: 42500, hidden: false, available: true,
      variants: [abaya.variants[2], abaya.variants[0], abaya.variants[1]], revision: 3 };
    const db = { prepare: () => ({ all: async () => ({ results: [
      { id, document: JSON.stringify(before), revision: 3 }
    ] }) }) };
    const updated = (await readCatalog(db)).find((product) => product.id === id);
    assert.equal(updated.variants[0].image, before.variants[0].image);
    assert.equal(updated.price, 42500);
    assert.ok(updated.variants.length >= 20);
    assert.equal(validateProduct(updated).abayaColourEdition, abayaColourEdition);
  }
});

test('completed Khimar palettes offer matching colour photographs and previews without overwriting owner choices', async () => {
  for (const id of twentyColourGarments) {
    const garment = get(id);
    assert.equal(garment.garmentColourEdition, garmentColourEdition);
    assert.equal(expandGarmentColours(garment), garment);
    assert.equal(new Set(garment.variants.map(({ id }) => id)).size, garment.variants.length);
    const represented = new Set(garment.variants.map(({ id }) => id));
    for (const [colourId] of dressColours) assert.ok(represented.has(colourId), `${id} lacks ${colourId}`);
    for (const variant of garment.variants) {
      assert.ok(existsSync(new URL(`../public${variant.image}`, import.meta.url)), variant.image);
      const preview = variant.image.replace('/images/', '/previews/').replace(/\.(webp|png)$/, '.jpg');
      assert.ok(existsSync(new URL(`../public${preview}`, import.meta.url)), preview);
    }
    const previous = { ...garment, garmentColourEdition: undefined, price: 35000, revision: 4,
      hidden: true, available: false, variants: [garment.variants[0], garment.variants[3]] };
    const db = { prepare: () => ({ all: async () => ({ results: [
      { id, document: JSON.stringify(previous), revision: 4 }
    ] }) }) };
    const updated = (await readCatalog(db)).find((item) => item.id === id);
    assert.equal(updated.variants[0].image, previous.variants[0].image);
    assert.equal(updated.price, 35000);
    assert.equal(updated.hidden, true);
    assert.equal(updated.available, false);
    assert.equal(updated.variants.length, 20);
    assert.equal(validateProduct(updated).garmentColourEdition, garmentColourEdition);
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
  assert.match(waterfall, /class="swatches-toggle" aria-expanded="false">\+19 more colours/);
  const base = get('chiffon-wrap');
  const twenty = Array.from({ length: 20 }, (_, i) => ({
    ...base.variants[0], id: `colour-${i + 1}`, name: `Colour ${i + 1}`
  }));
  const validated = validateProduct({ ...base, variants: twenty, hidden: false, available: true, revision: 0 });
  assert.equal(validated.variants.length, 20);
  const ordered = { ...base, variants: [base.variants[2], base.variants[0], base.variants[1]] };
  assert.match(storefront('https://shop.masanawa.com', [ordered]), new RegExp(`src="${ordered.variants[0].image}"`));
});

test('each maxi dress has the full 20-colour palette without losing original photography or duplicate colour choices', () => {
  for (const dress of products.filter(({ category }) => category === 'dress')) {
    assert.equal(dress.dressColourEdition, dressColourEdition);
    assert.ok(dress.variants.length >= dressColours.length);
    assert.equal(new Set(dress.variants.map(({ id }) => id)).size, dress.variants.length);
    const colourIds = new Set(dress.variants.map(({ id }) =>
      id === 'navy' ? 'navy-blue' : id === 'olive' ? 'olive-green' : id));
    for (const [id, name] of dressColours) {
      assert.ok(colourIds.has(id), `${dress.name} is missing ${name}`);
    }
    assert.deepEqual(expandDressColours(dress).variants, dress.variants);
  }
});

test('D1 catalogue colour upgrades preserve seller main image, priority, price and availability', async () => {
  const dress = get('linen-a-line-maxi');
  const unexpanded = { ...dress, dressColourEdition: undefined, revision: 4, variants: [
    { ...dress.variants[3] }, { ...dress.variants[0] }, { ...dress.variants[1] }
  ], price: 12000, available: false, hidden: true };
  const db = { prepare: () => ({ all: async () => ({ results: [
    { id: dress.id, document: JSON.stringify(unexpanded), revision: 4 }
  ] }) }) };
  const upgraded = (await readCatalog(db)).find(({ id }) => id === dress.id);
  assert.equal(upgraded.variants[0].id, unexpanded.variants[0].id);
  assert.equal(upgraded.variants[0].image, unexpanded.variants[0].image);
  assert.equal(upgraded.price, 12000);
  assert.equal(upgraded.available, false);
  assert.equal(upgraded.hidden, true);
  assert.ok(upgraded.variants.length >= 20);
  assert.equal(upgraded.dressColourEdition, dressColourEdition);
  assert.equal(validateProduct(upgraded).dressColourEdition, dressColourEdition);
});
