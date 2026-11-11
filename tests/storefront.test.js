import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categories, products } from '../src/catalog/products.js';
import { maknoonPhotoBatch } from '../src/catalog/maknoon-photo-batch.js';
import { storefront } from '../src/components/storefront.js';
import { orderLink, previewImage, variantPath } from '../src/lib/shop.js';
import { variantPage } from '../src/components/variant-page.js';
import { popPetalsBrand, popPetalsProducts } from '../src/catalog/pop-petals.js';
import { flawlessGlowBrand, flawlessGlowProducts } from '../src/catalog/flawless-glow.js';
import { existsSync, readFileSync } from 'node:fs';
import { twentyColourAbayas } from '../src/catalog/abaya-colours.js';

const origin = 'https://shop.example';

test('all three storefronts retain two product cards per row on narrow phones', () => {
  const css = readFileSync(new URL('../src/styles/storefront.css', import.meta.url), 'utf8');
  const narrow = css.match(/@media \(max-width:420px\) \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(narrow, 'Missing narrow-screen product layout');
  assert.match(narrow, /\.product-grid\s*\{\s*grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(narrow, /\.product-grid\s*\{\s*grid-template-columns:\s*1fr/);
  for (const [catalog, brand] of [[products, { home: '/maknoon-jamil/' }],
    [popPetalsProducts, popPetalsBrand], [flawlessGlowProducts, flawlessGlowBrand]]) {
    const page = storefront(origin, catalog, brand.home, undefined, brand);
    assert.match(page, /href="\/styles\/storefront\.css"/);
    assert.match(page, /class="product-grid"/);
  }
});

test('each style has distinct colour choices and uniquely addressed images', () => {
  assert.equal(products.length, 25 - 7 + 7 + maknoonPhotoBatch.length);
  assert.equal(new Set(products.map(({ id }) => id)).size, products.length);
  const images = new Set();
  for (const product of products) {
    assert.ok(categories.some(({ id }) => id === product.category));
    if (product.category === 'dress' || twentyColourAbayas.has(product.id)) assert.ok(product.variants.length >= 20);
    else if (product.stock) assert.ok(product.variants.length >= 1);
    else assert.equal(product.variants.length, 4);
    assert.equal(new Set(product.variants.map(({ id }) => id)).size, product.variants.length);
    for (const variant of product.variants) {
      assert.ok(!images.has(variant.image));
      images.add(variant.image);
      if (product.stock) {
        assert.ok(existsSync(new URL(`../public${variant.image}`, import.meta.url)));
        assert.ok(existsSync(new URL(`../public${previewImage(variant)}`, import.meta.url)));
      }
      const url = new URL(orderLink(product, variant, origin));
      assert.equal(url.origin + url.pathname, 'https://wa.me/2348022519062');
      const message = url.searchParams.get('text');
      assert.ok(message.includes(product.name) && message.includes(variant.name));
      assert.equal(message.includes('₦25,000'), ['flow-abaya', 'everyday-abaya', 'pleated-abaya'].includes(product.id));
      const variantUrl = origin + variantPath(product, variant, '/maknoon-jamil/');
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

test('photographed stock is first, grouped by construction and not duplicated by colour', () => {
  const stock = products.filter(({ stock }) => stock);
  assert.deepEqual(stock.map(({ id }) => id), [
    'satin-waterfall-abaya', 'full-coverage-satin-khimar', 'burgundy-satin-drape',
    'covered-button-abaya', 'draped-collar-abaya', 'full-coverage-jilbab', 'gathered-waist-maxi',
    'full-drape-jilbab', 'tiered-niqab-khimar', 'gathered-maxi-abaya', 'two-tone-long-khimar'
  ]);
  assert.deepEqual(stock.map(({ variants }) => variants.length), [25, 20, 20, 21, 21, 24, 21, 20, 3, 21, 1]);
  assert.deepEqual(stock[3].variants.slice(0, 3).map(({ id }) => id), ['navy', 'black', 'brown']);
  assert.deepEqual(stock[4].variants.slice(0, 4).map(({ id }) => id), ['rust', 'black', 'navy', 'purple']);
  assert.deepEqual(stock[5].variants.slice(0, 5).map(({ id }) => id), ['purple', 'sage', 'black', 'mauve', 'ivory']);
  assert.ok(products.every((product, i) => i < stock.length ? product.stock : !product.stock));
  for (const product of stock) {
    assert.ok(product.price === null || product.price === 15000 || product.price === 30000 || product.price === 40000);
    for (const src of product.gallery || []) {
      assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)));
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
  assert.match(markup, /property="og:image" content="https:\/\/shop.example\/previews\/brand-covers\/maknoon-jamil.jpg"/);
  assert.match(markup, /name="twitter:card" content="summary_large_image"/);
  assert.match(markup, /class="global-site-header"/);
  assert.match(markup, /class="global-contact" href="https:\/\/wa.me\/2348022519062/);
  assert.doesNotMatch(markup, /Owner sign-in|Create a store/);
});

test('the catalog share route has a distinct canonical preview URL', () => {
  const markup = storefront(origin, undefined, '/catalog/');
  assert.ok(markup.includes('property="og:url" content="https://shop.example/catalog/"'));
  assert.ok(markup.includes('property="og:image" content="https://shop.example/previews/brand-covers/maknoon-jamil.jpg"'));
});
