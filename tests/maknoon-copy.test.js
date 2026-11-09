import assert from 'node:assert/strict';
import { test } from 'node:test';
import { products } from '../src/catalog/products.js';
import { photographedStock } from '../src/catalog/stock.js';
import { maknoonPhotoBatch, withMaknoonPhotoBatch } from '../src/catalog/maknoon-photo-batch.js';
import { maknoonCopy, refineMaknoonDescription } from '../src/catalog/maknoon-copy.js';
import { readCatalog } from '../src/catalog/live.js';

test('all Maknoon products have unique boutique descriptions, not photo-observation text', () => {
  assert.equal(products.length, 36);
  assert.equal(Object.keys(maknoonCopy).length, products.length);
  assert.deepEqual(new Set(Object.keys(maknoonCopy)), new Set(products.map(({ id }) => id)));
  assert.equal(new Set(products.map(({ description }) => description)).size, products.length);
  for (const product of products) {
    const description = maknoonCopy[product.id].revised;
    assert.equal(product.description, description, `Unpolished copy for ${product.id}`);
    assert.ok(description.length >= 35 && description.length <= 140, `${product.id}: inappropriate copy length`);
    assert.doesNotMatch(description, /reference|photograph|image|shown with|pictured|confirm|ask for|upper.garment|full.length view/i);
  }
  for (const product of [...photographedStock, ...maknoonPhotoBatch]) {
    assert.equal(product.description, maknoonCopy[product.id].revised);
  }
});

test('legacy seed descriptions upgrade without overwriting owner-customised descriptions', async () => {
  const stock = products.find(({ id }) => id === 'covered-button-abaya');
  const legacy = products.find(({ id }) => id === 'flow-abaya');
  const custom = { ...stock, description: 'An owner-written description with custom details.' };
  const previous = { ...legacy, description: maknoonCopy[legacy.id].previous };

  assert.strictEqual(refineMaknoonDescription(custom), custom);
  assert.strictEqual(refineMaknoonDescription(legacy), legacy);
  assert.equal(refineMaknoonDescription(previous).description, maknoonCopy[legacy.id].revised);

  const overlay = withMaknoonPhotoBatch([custom, previous]);
  assert.strictEqual(overlay.find(({ id }) => id === stock.id), custom);
  assert.equal(overlay.find(({ id }) => id === legacy.id).description, maknoonCopy[legacy.id].revised);

  const rows = [custom, previous].map((item) => ({ id: item.id, document: JSON.stringify(item), revision: 1 }));
  const db = { prepare: () => ({ all: async () => ({ results: rows }) }) };
  const fromD1 = await readCatalog(db);
  assert.equal(fromD1.find(({ id }) => id === stock.id).description, custom.description);
  assert.equal(fromD1.find(({ id }) => id === legacy.id).description, maknoonCopy[legacy.id].revised);
});
