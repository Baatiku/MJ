import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { portfolio } from '../src/components/portfolio.js';
import { storefront } from '../src/components/storefront.js';
import { flawlessGlowPage } from '../src/components/coming-soon.js';
import { popPetalsProducts, popPetalsBrand, popPetalsCategories, withCurrentPopPetalsPhotos } from '../src/catalog/pop-petals.js';
import { flawlessGlowProducts, flawlessGlowCategories } from '../src/catalog/flawless-glow.js';
import { whatsappNumber } from '../src/lib/shop.js';

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
  assert.match(html, /property="og:image" content="https:\/\/mj\.masanawa\.com\/previews\/shop-all-brands-v3\.jpg"/);
  assert.match(html, /property="og:image:secure_url" content="https:\/\/mj\.masanawa\.com\/previews\/shop-all-brands-v3\.jpg"/);
  assert.match(html, /property="og:image:type" content="image\/jpeg"/);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.ok(existsSync(new URL('../public/previews/shop-all-brands-v3.jpg', import.meta.url)));
  assert.equal((html.match(/class="brand-card /g) || []).length, 3);
  for (const slug of ['maknoon-jamil', 'pop-and-petals', 'flawless-glow-co']) {
    assert.equal((html.match(new RegExp(`/images/brand-covers/${slug}\\.webp`, 'g')) || []).length, 2);
    assert.ok(existsSync(new URL(`../public/images/brand-covers/${slug}.webp`, import.meta.url)));
  }
  assert.doesNotMatch(html, /glow-art|sun-disc|mosaic-glow-label/);
  assert.doesNotMatch(html, /₦|Buy now/);
});

test('Pop & Petals catalogue uses polished photographs, original galleries and concise names', () => {
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
    for (const src of [...product.variants.flatMap((variant) => [variant.image, variant.image.replace('/images/', '/previews/').replace('.webp', '.jpg')]), ...(product.gallery || [])]) {
      assert.ok(existsSync(new URL('../public' + src, import.meta.url)), `Missing Pop & Petals photo: ${src}`);
    }
  }
  const html = storefront('https://mj.masanawa.com', popPetalsProducts, '/pop-and-petals/', whatsappNumber, popPetalsBrand);
  assert.match(html, /Something for every sweet tooth/);
  assert.match(html, /Ruby Zobo/);
  assert.match(html, /Cocoa Velvet/);
  assert.match(html, /Midnight Drizzle Box/);
  assert.match(html, /Ask on WhatsApp/);
  assert.match(html, /Chat on WhatsApp/);
  assert.match(html, new RegExp(`wa\\.me/${whatsappNumber}`));
  assert.match(html, /Hello%20Pop%20%26%20Petals/);
  assert.match(html, /class="global-site-header"/);
  assert.doesNotMatch(html, /WhatsApp ordering soon/);
});

test('existing Pop & Petals products receive corrected studio photos without overwriting owner edits', () => {
  const cocoa = popPetalsProducts.find(({ id }) => id === 'cocoa-milk');
  const zobo = popPetalsProducts.find(({ id }) => id === 'zobo');
  assert.equal(cocoa.gallery[0], '/images/pop-petals/01-1000039724.jpg');
  assert.equal(zobo.gallery[0], '/images/pop-petals/03-1000039723.jpg');
  const existing = [
    { ...cocoa, price: 1200, variants: [{ ...cocoa.variants[0], image: '/images/pop-petals/03-1000039723.jpg' }] },
    { ...zobo, price: 500, variants: [{ ...zobo.variants[0], image: '/images/pop-petals/08-1000039733.jpg' }] },
    { ...cocoa, id: 'custom-cocoa', variants: [{ ...cocoa.variants[0], image: 'https://example.org/own.jpg' }] }
  ];
  const upgraded = withCurrentPopPetalsPhotos(existing);
  assert.equal(upgraded[0].variants[0].image, cocoa.variants[0].image);
  assert.equal(upgraded[1].variants[0].image, zobo.variants[0].image);
  assert.equal(upgraded[0].price, 1200);
  assert.equal(upgraded[1].price, 500);
  assert.equal(upgraded[2].variants[0].image, 'https://example.org/own.jpg');
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
  assert.match(html, /Ask on WhatsApp/);
  assert.match(html, /Chat on WhatsApp/);
  assert.match(html, new RegExp(`wa\\.me/${whatsappNumber}`));
  assert.match(html, /Hello%20Flawless%20Glow%20Co/);
  assert.doesNotMatch(html, /class="glow-brand-art"|WhatsApp ordering soon|Owner sign-in/);
});
