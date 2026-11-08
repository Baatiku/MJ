import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { portfolio } from '../src/components/portfolio.js';
import { storefront } from '../src/components/storefront.js';
import { flawlessGlowPage } from '../src/components/coming-soon.js';
import { popPetalsProducts, popPetalsBrand, popPetalsCategories } from '../src/catalog/pop-petals.js';
import { flawlessGlowProducts, flawlessGlowCategories } from '../src/catalog/flawless-glow.js';

test('umbrella homepage presents exactly the three businesses with dedicated links', () => {
  const html = portfolio('https://mj.masanawa.com');
  assert.match(html, /Wear it\. <em>Crave it\.<\/em> Glow\./);
  assert.match(html, /class="global-site-header"/);
  assert.match(html, /aria-current="page"/);
  assert.doesNotMatch(html, /Our Brands|Create a store|Owner sign-in|Three unique brands|href="\/setup\/"|href="\/manage\/"/);
  assert.match(html, /href="\/maknoon-jamil\/"/);
  assert.match(html, /href="\/pop-and-petals\/"/);
  assert.match(html, /href="\/flawless-glow-co\/"/);
  assert.match(html, /styles\/portfolio\.css/);
  assert.match(html, /property="og:image" content="https:\/\/mj\.masanawa\.com\/previews\/our-brands-social\.jpg"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.ok(existsSync(new URL('../public/previews/our-brands-social.jpg', import.meta.url)));
  assert.equal((html.match(/class="brand-card /g) || []).length, 3);
  for (const slug of ['maknoon-jamil', 'pop-and-petals', 'flawless-glow-co']) {
    assert.equal((html.match(new RegExp(`/images/brand-covers/${slug}\\.webp`, 'g')) || []).length, 2);
    assert.ok(existsSync(new URL(`../public/images/brand-covers/${slug}.webp`, import.meta.url)));
  }
  assert.doesNotMatch(html, /glow-art|sun-disc|mosaic-glow-label/);
  assert.doesNotMatch(html, /₦|Buy now/);
});

test('Pop & Petals catalogue only uses real supplied photographs and verified visible details', () => {
  const ids = new Set();
  const names = new Set();
  for (const product of popPetalsProducts) {
    assert.ok(!ids.has(product.id));
    ids.add(product.id);
    assert.ok(!names.has(product.name), `Duplicate product name: ${product.name}`);
    names.add(product.name);
    assert.ok(product.description.length <= 75, `Product copy is too long: ${product.name}`);
    assert.doesNotMatch(product.description, /pictured|packaging|presented|visible|coloured|topped with/i);
    assert.ok(popPetalsCategories.some(({ id }) => id === product.category));
    assert.equal(product.price, null);
    assert.ok(product.variants.length > 0);
    for (const src of [...product.variants.map((variant) => variant.image), ...(product.gallery || [])]) {
      assert.ok(existsSync(new URL('../public' + src, import.meta.url)), `Missing Pop & Petals photo: ${src}`);
    }
  }
  const html = storefront('https://mj.masanawa.com', popPetalsProducts, '/pop-and-petals/', '', popPetalsBrand);
  assert.match(html, /Something for every sweet tooth/);
  assert.match(html, /Ruby Zobo/);
  assert.match(html, /Cocoa Velvet/);
  assert.match(html, /Midnight Drizzle Box/);
  assert.match(html, /WhatsApp ordering soon/);
  assert.match(html, /class="global-site-header"/);
  assert.doesNotMatch(html, /wa\.me\//);
});

test('Flawless Glow Co offers ten clearly named, photographed products in a shared storefront', () => {
  assert.equal(flawlessGlowProducts.length, 10);
  assert.equal(new Set(flawlessGlowProducts.map(({ id }) => id)).size, 10);
  assert.equal(new Set(flawlessGlowProducts.map(({ name }) => name)).size, 10);
  for (const product of flawlessGlowProducts) {
    assert.ok(flawlessGlowCategories.some(({ id }) => id === product.category));
    assert.ok(product.description.length < 70);
    assert.doesNotMatch(product.description, /pictured|packaging|in the image|visible|SPF|cures|treats acne/i);
    assert.equal(product.price, null);
    for (const variant of product.variants) {
      assert.ok(existsSync(new URL('../public' + variant.image, import.meta.url)), `Missing beauty photo: ${variant.image}`);
    }
  }
  const html = flawlessGlowPage('https://mj.masanawa.com');
  assert.match(html, /Flawless Glow Co/);
  assert.match(html, /SADOER Fruit Crush Hand Cream Trio/);
  assert.match(html, /LAIKOU Botanical Mud Mask Mix/);
  assert.match(html, /Rainbow Silicone Facial Brush Set/);
  assert.match(html, /BIOAQUA Colour Pop Eye &amp; Lip Patches/);
  assert.match(html, /class="global-site-header"/);
  assert.equal((html.match(/class="product"/g) || []).length, 10);
  assert.match(html, /WhatsApp ordering soon/);
  assert.doesNotMatch(html, /class="glow-brand-art"|wa\.me\/|Owner sign-in/);
});
