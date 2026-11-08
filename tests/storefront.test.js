import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categories, products } from '../src/catalog/products.js';
import { storefront } from '../src/components/storefront.js';
import { orderLink, previewImage, variantPath } from '../src/lib/shop.js';
import { variantPage } from '../src/components/variant-page.js';

const origin = 'https://shop.example';

test('each style has distinct colour choices and uniquely addressed images', () => {
  assert.equal(products.length, 25);
  assert.equal(new Set(products.map(({ id }) => id)).size, products.length);
  const images = new Set();
  for (const product of products) {
    assert.ok(categories.some(({ id }) => id === product.category));
    assert.equal(product.variants.length, 4);
    assert.equal(new Set(product.variants.map(({ id }) => id)).size, product.variants.length);
    for (const variant of product.variants) {
      assert.ok(!images.has(variant.image));
      images.add(variant.image);
      const url = new URL(orderLink(product, variant, origin));
      assert.equal(url.origin + url.pathname, 'https://wa.me/2348022519062');
      const message = url.searchParams.get('text');
      assert.ok(message.includes(product.name) && message.includes(variant.name));
      assert.equal(message.includes('₦25,000'), product.id === 'flow-abaya');
      const variantUrl = origin + variantPath(product, variant);
      assert.ok(message.endsWith(variantUrl));
      const page = variantPage(product, variant, origin);
      assert.ok(page.includes(`property="og:url" content="${variantUrl}"`));
      assert.ok(page.includes(`property="og:image" content="${origin + previewImage(variant)}"`));
      assert.ok(page.includes(`src="${variant.image}"`));
      assert.match(page, /class="global-site-header"/);
      assert.match(page, /href="\/maknoon-jamil\/" aria-current="page"/);
    }
  }
});

test('static HTML contains every product and checkout works before JS loads', () => {
  const html = storefront(origin);
  assert.doesNotMatch(html, /Style concept|The original edit|class="badge"/i);
  for (const product of products) {
    assert.ok(html.includes(`id="${product.id}"`));
    assert.ok(html.includes(orderLink(product, product.variants[0], origin)));
  }
});

test('Maknoon Jamil keeps its catalog share card and uses the shared public header', () => {
  const markup = storefront(origin);
  assert.match(markup, /property="og:url" content="https:\/\/shop.example\/"/);
  assert.match(markup, /property="og:image" content="https:\/\/shop.example\/previews\/maknoon-jamil-square.jpg"/);
  assert.match(markup, /name="twitter:card" content="summary_large_image"/);
  assert.match(markup, /class="global-site-header"/);
  assert.match(markup, /class="global-contact" href="https:\/\/wa.me\/2348022519062/);
  assert.doesNotMatch(markup, /Owner sign-in|Create a store/);
});

test('the catalog share route has a distinct canonical preview URL', () => {
  const markup = storefront(origin, undefined, '/catalog/');
  assert.ok(markup.includes('property="og:url" content="https://shop.example/catalog/"'));
  assert.ok(markup.includes('property="og:image" content="https://shop.example/previews/maknoon-jamil-square.jpg"'));
});
