import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categories, products } from '../src/catalog/products.js';
import { storefront } from '../src/components/storefront.js';
import { orderLink } from '../src/lib/shop.js';

test('each style has distinct colour choices and uniquely addressed images', () => {
  assert.ok(products.length >= 10);
  assert.equal(new Set(products.map(({ id }) => id)).size, products.length);
  const images = new Set();
  for (const product of products) {
    assert.ok(categories.some(({ id }) => id === product.category));
    assert.ok(product.variants.length >= 3);
    assert.equal(new Set(product.variants.map(({ id }) => id)).size, product.variants.length);
    for (const variant of product.variants) {
      assert.ok(!images.has(variant.image));
      images.add(variant.image);
      const url = new URL(orderLink(product, variant));
      assert.equal(url.origin + url.pathname, 'https://wa.me/2348022519062');
      const message = url.searchParams.get('text');
      assert.ok(message.includes(product.name) && message.includes(variant.name));
      assert.equal(message.includes('₦25,000'), product.id === 'flow-abaya');
    }
  }
});

test('static HTML contains every product and checkout works before JS loads', () => {
  const html = storefront();
  for (const product of products) {
    assert.ok(html.includes(`id="${product.id}"`));
    assert.ok(html.includes(orderLink(product, product.variants[0])));
  }
});
