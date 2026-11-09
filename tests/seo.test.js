import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { portfolio } from '../src/components/portfolio.js';
import { contactPage } from '../src/components/contact.js';
import { storefront } from '../src/components/storefront.js';
import { variantPage } from '../src/components/variant-page.js';
import { popPetalsBrand, popPetalsProducts } from '../src/catalog/pop-petals.js';
import { flawlessGlowBrand, flawlessGlowProducts } from '../src/catalog/flawless-glow.js';
import { products } from '../src/catalog/products.js';
import { maknoonPhotoBatch, withMaknoonPhotoBatch } from '../src/catalog/maknoon-photo-batch.js';
import { sitemapXml } from '../src/lib/sitemap.js';
import { shareDetails } from '../src/lib/share-details.js';
import { whatsappNumber, previewImage } from '../src/lib/shop.js';

const origin = 'https://mj.masanawa.com';
const publicFile = (path) => new URL('../public' + path, import.meta.url);
const schema = (markup) => [...markup.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((match) => JSON.parse(match[1]));

test('one umbrella identity is usable at every browser-icon size', () => {
  for (const path of ['/brand/shop-mark.svg', '/brand/shop-lockup.svg', '/brand/shop-pinned.svg', '/favicon.ico',
    '/icons/favicon-16.png', '/icons/favicon-32.png', '/icons/apple-touch-icon.png',
    '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png']) {
    assert.ok(existsSync(publicFile(path)), `Missing brand icon: ${path}`);
  }
  for (const [path, size] of [['/icons/favicon-32.png', 32], ['/icons/apple-touch-icon.png', 180], ['/icons/icon-192.png', 192], ['/icons/icon-512.png', 512]]) {
    const png = readFileSync(publicFile(path));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  const manifest = JSON.parse(readFileSync(publicFile('/site.webmanifest'), 'utf8'));
  assert.equal(manifest.short_name, 'shop.');
  for (const { src } of manifest.icons) assert.ok(existsSync(publicFile(src)));
});

test('homepage and contact page expose verified contact, social metadata and organization schema', () => {
  const html = portfolio(origin);
  assert.match(html, /brand\/shop-mark\.svg/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /rel="manifest" href="\/site\.webmanifest"/);
  assert.match(html, /mailto:shop@masanawa\.com/);
  assert.match(html, /tel:\+2348022519062/);
  assert.match(html, /property="og:image:secure_url"/);
  const graph = schema(html)[0]['@graph'];
  assert.ok(graph.some((item) => item['@type'] === 'Organization' && item.email === 'shop@masanawa.com' && item.telephone === '+2348022519062'));
  assert.ok(graph.some((item) => item['@type'] === 'WebSite'));
  assert.ok(graph.some((item) => item['@type'] === 'ItemList' && item.itemListElement.length === 3));
  const contact = contactPage(origin);
  assert.match(contact, /href="mailto:shop@masanawa\.com"/);
  assert.match(contact, /href="tel:\+2348022519062"/);
  assert.match(contact, /https:\/\/wa\.me\/2348022519062/);
  assert.ok(schema(contact).some((item) => item['@type'] === 'ContactPage'));
});

test('each sister-brand storefront has a JPG share cover, matching favicon and real WhatsApp actions', () => {
  for (const [brand, catalog] of [[popPetalsBrand, popPetalsProducts], [flawlessGlowBrand, flawlessGlowProducts]]) {
    const markup = storefront(origin, catalog, brand.home, whatsappNumber, brand);
    const cover = origin + brand.shareImage;
    assert.ok(existsSync(publicFile(brand.shareImage)));
    assert.match(markup, new RegExp(`property="og:image" content="${cover.replaceAll('.', '\\.')}"`));
    assert.match(markup, /property="og:image:type" content="image\/jpeg"/);
    assert.match(markup, /name="twitter:image"/);
    assert.match(markup, /href="mailto:shop@masanawa\.com"/);
    assert.match(markup, /href="tel:\+2348022519062"/);
    assert.match(markup, /class="global-site-header"/);
    assert.match(markup, /href="\/brand\/shop-mark\.svg"/);
    assert.equal((markup.match(/data-share-product/g) || []).length, catalog.length);
    assert.match(markup, /https:\/\/wa\.me\/\?text=/);
    assert.match(markup, /wa\.me\/2348022519062/);
    const shop = schema(markup)[0]['@graph'].find((item) => item['@type'] === 'Store');
    assert.equal(shop.name, brand.name);
    assert.equal(shop.telephone, '+2348022519062');
  }
});

test('all product pages supply canonical JPG previews, SEO schema, Twitter cards and working share fallback', () => {
  for (const [brand, catalog] of [[{ name: 'Maknoon Jamil', home: '/maknoon-jamil/' }, products],
    [popPetalsBrand, popPetalsProducts], [flawlessGlowBrand, flawlessGlowProducts]]) {
    for (const product of catalog) {
      for (const variant of product.variants) {
        const markup = variantPage(product, variant, origin, whatsappNumber, brand);
        const preview = previewImage(variant);
        assert.ok(existsSync(publicFile(preview)), `${brand.name}: missing preview ${preview}`);
        assert.match(markup, /property="og:image:secure_url"/);
        assert.match(markup, /name="twitter:card" content="summary_large_image"/);
        assert.match(markup, new RegExp(`property="og:image" content="${(origin + preview).replaceAll('.', '\\.')}"`));
        assert.match(markup, /mailto:shop@masanawa\.com/);
        assert.match(markup, /data-share-product/);
        assert.match(markup, /https:\/\/wa\.me\/\?text=/);
        assert.match(markup, /rel="canonical"/);
        const structured = schema(markup)[0]['@graph'].find((item) => item['@type'] === 'Product');
        assert.equal(structured.name, variant.id === 'pictured' ? product.name : `${product.name} in ${variant.name}`);
        assert.equal(structured.image, origin + variant.image);
        if (product.price === null) assert.equal(structured.offers, undefined);
        else assert.equal(structured.offers.price, String(product.price));
      }
    }
  }
});

test('product share text is brand-specific, begins with a canonical link and omits As pictured', () => {
  const pop = popPetalsProducts.find(({ id }) => id === 'zobo');
  const result = shareDetails(pop, pop.variants[0], { home: popPetalsBrand.home, name: popPetalsBrand.name, origin });
  assert.equal(result.title, 'Ruby Zobo');
  assert.match(result.text, /Pop & Petals/);
  assert.doesNotMatch(result.text, /As pictured/);
  assert.ok(result.text.includes(`${origin}/pop-and-petals/products/zobo/pictured/`));
});

test('nine new Maknoon photographs become four products, six colours and matching detail galleries', () => {
  assert.deepEqual(maknoonPhotoBatch.map(({ id }) => id), [
    'full-drape-jilbab', 'tiered-niqab-khimar', 'gathered-maxi-abaya', 'two-tone-long-khimar'
  ]);
  assert.equal(maknoonPhotoBatch.reduce((total, product) => total + product.variants.length, 0), 6);
  const paths = maknoonPhotoBatch.flatMap(({ variants }) => variants.flatMap(({ image, gallery = [] }) => [image, ...gallery]));
  assert.equal(paths.length, 9);
  assert.equal(new Set(paths).size, 9);
  for (const path of paths) {
    assert.ok(existsSync(publicFile(path)), `Missing owner photo: ${path}`);
    assert.equal(readFileSync(publicFile(path)).subarray(0, 3).toString('hex'), 'ffd8ff');
  }
  assert.match(readFileSync(publicFile('/brand/maknoon-photo-watermark.svg'), 'utf8'), /Maknoon_jamil/);
  const niqab = maknoonPhotoBatch[1];
  const petrol = variantPage(niqab, niqab.variants[0], origin, whatsappNumber, { name: 'Maknoon Jamil', home: '/maknoon-jamil/' });
  const petrolGallery = petrol.match(/<div class="product-gallery"[^>]*>[^<]*<img[^>]*><\/div>/)?.[0];
  assert.match(petrolGallery, /mj-tiered-niqab-petrol-blue-detail\.jpg/);
  assert.doesNotMatch(petrolGallery, /mj-tiered-niqab-dusty-mauve-detail\.jpg/);
  const mauve = variantPage(niqab, niqab.variants[2], origin, whatsappNumber, { name: 'Maknoon Jamil', home: '/maknoon-jamil/' });
  const mauveGallery = mauve.match(/<div class="product-gallery"[^>]*>[^<]*<img[^>]*><\/div>/)?.[0];
  assert.match(mauveGallery, /mj-tiered-niqab-dusty-mauve-detail\.jpg/);
  assert.doesNotMatch(mauveGallery, /mj-tiered-niqab-petrol-blue-detail\.jpg/);
  const original = products.filter(({ id }) => !maknoonPhotoBatch.some((photoProduct) => photoProduct.id === id));
  assert.equal(original.length, 25);
  const ownerEdited = { ...niqab, price: 42000, hidden: true, revision: 4, position: 7 };
  const overlay = withMaknoonPhotoBatch([...original, ownerEdited]);
  assert.equal(overlay.length, products.length);
  assert.strictEqual(overlay.find(({ id }) => id === niqab.id), ownerEdited);
  assert.equal(overlay.filter(({ id }) => id === niqab.id).length, 1);
  assert.deepEqual(overlay.slice(-3).map(({ id }) => id), [
    'full-drape-jilbab', 'gathered-maxi-abaya', 'two-tone-long-khimar'
  ]);
});

test('sitemap lists all public canonical routes and robots excludes private services', () => {
  const xml = sitemapXml(origin);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.equal((xml.match(/<loc>/g) || []).length, 2 + 3 + 25 * 4 + 6 + 13 + 10);
  assert.match(xml, /https:\/\/mj\.masanawa\.com\/maknoon-jamil\/products\/flow-abaya\/navy/);
  assert.match(xml, /https:\/\/mj\.masanawa\.com\/pop-and-petals\/products\/zobo\/pictured/);
  assert.match(xml, /https:\/\/mj\.masanawa\.com\/flawless-glow-co\/products\/laikou-mud-mask-mix\/pictured/);
  assert.doesNotMatch(xml, /<loc>https:\/\/mj\.masanawa\.com\/(?:admin\/|manage\/|api\/|products\/flow-abaya\/)/);
  const robots = readFileSync(publicFile('/robots.txt'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/mj\.masanawa\.com\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/manage\//);
});
