import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { portfolio } from '../src/components/portfolio.js';
import { storefront } from '../src/components/storefront.js';
import { flawlessGlowPage } from '../src/components/coming-soon.js';
import { popPetalsProducts, popPetalsBrand, popPetalsCategories } from '../src/catalog/pop-petals.js';

test('umbrella homepage presents exactly the three businesses with dedicated links', () => {
  const html = portfolio('https://mj.masanawa.com');
  assert.match(html, /Good things, <em>beautifully<\/em> brought together/);
  assert.match(html, /href="\/maknoon-jamil\/"/);
  assert.match(html, /href="\/pop-and-petals\/"/);
  assert.match(html, /href="\/flawless-glow-co\/"/);
  assert.match(html, /styles\/portfolio\.css/);
  assert.equal((html.match(/class="brand-card /g) || []).length, 3);
  assert.doesNotMatch(html, /₦|Buy now/);
});

test('Pop & Petals catalogue only uses real supplied photographs and verified visible details', () => {
  const ids = new Set();
  for (const product of popPetalsProducts) {
    assert.ok(!ids.has(product.id));
    ids.add(product.id);
    assert.ok(popPetalsCategories.some(({ id }) => id === product.category));
    assert.equal(product.price, null);
    assert.ok(product.variants.length > 0);
    for (const src of [...product.variants.map((variant) => variant.image), ...(product.gallery || [])]) {
      assert.ok(existsSync(new URL('../public' + src, import.meta.url)), `Missing Pop & Petals photo: ${src}`);
    }
  }
  const html = storefront('https://mj.masanawa.com', popPetalsProducts, '/pop-and-petals/', '', popPetalsBrand);
  assert.match(html, /Something for every sweet tooth/);
  assert.match(html, /Zobo Drink/);
  assert.match(html, /Cocoa Milk/);
  assert.doesNotMatch(html, /wa\.me\//);
});

test('Flawless Glow Co has an honest placeholder until product photos arrive', () => {
  const html = flawlessGlowPage('https://mj.masanawa.com');
  assert.match(html, /Flawless Glow Co/);
  assert.match(html, /Product photographs and details will be added here soon/);
});
