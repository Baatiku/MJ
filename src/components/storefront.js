import { whatsappIcon } from './whatsapp-icon.js';
import { categories, products } from '../catalog/products.js';
import { escapeHtml as html } from '../lib/html.js';
import { contactLink, displayWhatsAppNumber, whatsappNumber, previewImage } from '../lib/shop.js';
import { brandHead, shopSchema, socialPhoto } from '../lib/seo.js';
import { siteHeader } from './site-header.js';
import { productCard } from './product-card.js';
import { globalFooter, isFeaturedShop } from './global-header.js';

export function storefront(origin, catalog = products, sharePath = '/', number = whatsappNumber, brand = {}) {
  const name = brand.name || 'Maknoon Jamil';
  const featured = isFeaturedShop(brand.home || sharePath);
  const shopCategories = brand.name ? [...new Set(catalog.map(({ category }) => category))].map((id) => ({
    id, name: Object.hasOwn(brand.categoryLabels || {}, id) ? brand.categoryLabels[id] : id.replaceAll('-', ' ')
  })) : categories;
  const categoryLinks = shopCategories.flatMap(({ id, name }) => {
    const lead = catalog.find((product) => product.category === id);
    if (!lead) return [];
    return `<a class="category" href="?category=${encodeURIComponent(id)}${brand.preview ? '&amp;preview=1' : ''}#collection">
      <img src="${html(lead.variants[0].image)}" alt="" width="512" height="512" loading="lazy">
      <span>${html(name)} <b aria-hidden="true">↗</b></span>
    </a>`;
  }).join('');
  const stockHeroOrder = ['satin-waterfall-abaya', 'full-coverage-jilbab', 'gathered-waist-maxi'];
  const realStockHeroes = (!brand.name || brand.home === '/maknoon-jamil/') ? stockHeroOrder.flatMap((id) => {
    const garment = catalog.find((item) => item.id === id && !item.hidden);
    return garment ? [garment.variants[0].image] : [];
  }) : [];
  const heroImages = brand.heroImages?.length ? brand.heroImages
    : realStockHeroes.length === 3 ? realStockHeroes : catalog.slice(0, 3).map(({ variants }) => variants[0].image);
  const hero = heroImages.slice(0, 3).map((image) =>
    `<img src="${html(image)}" alt="" width="1122" height="1402" fetchpriority="high">`
  ).join('');
  const data = JSON.stringify(catalog).replaceAll('<', '\\u003c');
  const title = brand.name ? `${name} | ${brand.seoTitle || 'Shop the Collection'}` : 'Maknoon Jamil | Abayas & Modestwear';
  const description = brand.name ? `${name}: ${brand.description || 'Browse the collection.'} See products and order on WhatsApp.` : 'Shop Maknoon Jamil abayas, khimars, hijabs and modest dresses. Explore colours and ask about availability on WhatsApp.';
  const homepage = origin ? new URL(sharePath, origin).href : null;
  const coverPath = brand.name ? (brand.shareImage || previewImage({ image: brand.cover || catalog[0]?.variants[0].image || '' })) : '/previews/brand-covers/maknoon-jamil.jpg';
  const cover = homepage && coverPath ? new URL(coverPath, homepage).href : null;
  const social = homepage ? `
  <link rel="canonical" href="${html(homepage)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${html(name)}">
  <meta property="og:locale" content="en_NG">
  <meta property="og:url" content="${html(homepage)}">
  <meta property="og:title" content="${html(title)}">
  <meta property="og:description" content="${html(description)}">
  ${cover ? socialPhoto(origin, coverPath, name + ' collection cover') : '<meta name="twitter:card" content="summary">'}
  ${coverPath.startsWith('/previews/brand-covers/') ? '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' : ''}
  <meta name="twitter:title" content="${html(title)}">
  <meta name="twitter:description" content="${html(description)}">` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${brand.preview ? '<meta name="robots" content="noindex">' : ''}
  <meta name="description" content="${html(description)}">${social}
  ${brandHead()}
  <title>${html(title)}</title>
  ${homepage && !brand.preview ? shopSchema(origin, { name, description, home: sharePath }, number, cover || '') : ''}
  <link rel="stylesheet" href="/styles/storefront.css">
  <link rel="stylesheet" href="/styles/global.css">
  <script src="/storefront.js" type="module"></script>
</head>
<body${brand.themeClass ? ` class="${html(brand.themeClass)}"` : ''}${brand.accent ? ` style="--accent:${html(brand.accent)}"` : ''}>
  ${siteHeader('', number, brand)}
  <main class="shell" id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="kicker">${brand.name ? html(name) : 'Collection 01 <span aria-hidden="true">✦</span> The Drape Edit'}</p>
        <h1 id="hero-title">${brand.name ? html(brand.headline || name) : 'Grace in <em>every fold.</em>'}</h1>
        <p>${brand.name ? html(brand.description || '') : 'Fluid silhouettes and rich colours, from wide-sleeve abayas to softly layered khimars.'}</p>
        <div class="hero-actions"><a class="primary" href="#collection">Explore the collection <span aria-hidden="true">↓</span></a>
          ${number && brand.name ? `<a class="hero-contact" href="${html(contactLink(number, name))}" target="_blank" rel="noopener noreferrer">Chat on WhatsApp ${whatsappIcon}</a>` : ''}</div>
      </div>
      ${hero ? `<div class="hero-gallery" data-count="${Math.min(3, heroImages.length)}" aria-hidden="true">${hero}</div>` : brand.emptyMessage ? `<div class="glow-brand-art" aria-hidden="true"><span class="glow-art-disc">FG</span><span>FLAWLESS GLOW CO</span></div>` : ''}
    </section>
    ${shopCategories.length ? `<section class="style-section" id="styles" aria-labelledby="styles-title">
      <p class="kicker">${html(brand.stylesKicker || 'Find your silhouette')}</p><h2 id="styles-title">${html(brand.stylesHeading || 'Shop by style')}</h2>
      <div class="category-grid" data-count="${Math.min(3, shopCategories.length)}">${categoryLinks}</div>
    </section>` : ''}
    <section class="collection" id="collection" aria-labelledby="collection-title">
      <div class="section-head">
        <div><p class="kicker">The collection</p><h2 id="collection-title">${html(brand.collectionHeading || 'Find your colour')}</h2></div>
        <div class="filters" aria-label="Filter collection" hidden>
          <button type="button" data-filter="all" aria-pressed="true">${html(brand.filterAllLabel || 'All styles')}</button>
          ${shopCategories.filter(({ id }) => catalog.some(({ category }) => category === id)).map(({ id, name }) => `<button type="button" data-filter="${id}" aria-pressed="false">${html(name)}</button>`).join('')}
        </div>
      </div>
      ${catalog.length ? `<p class="collection-note">${brand.orderPending && !number ? 'WhatsApp ordering opens as soon as the contact number is confirmed.' : number ? 'Choose your favourite, then order on WhatsApp.' : 'Explore the collection.'}</p>` : ''}
      <p class="sr-only" data-result-count aria-live="polite"></p>
      ${catalog.length ? '' : `<p class="empty-collection">${html(brand.emptyMessage || 'The collection is being updated.')}</p>`}
      <div class="product-grid" data-count="${Math.min(3, catalog.length)}">${catalog.map((product) => productCard(product, origin, number, brand)).join('')}</div>
    </section>
  </main>
  ${featured ? globalFooter(number) : `<footer class="footer"><div class="shell footer-inner"><span class="wordmark">${html(name)}</span>
    ${number ? `<a class="contact whatsapp-contact" href="${html(contactLink(number, name))}" target="_blank" rel="noopener noreferrer">${html(displayWhatsAppNumber(number))} ${whatsappIcon}</a>` : ''}</div></footer>`}
  <script type="application/json" id="catalog-data" data-order-number="${html(number)}" data-shop-home="${html(brand.home || '/')}" data-shop-name="${html(name)}" data-preview="${brand.preview ? '1' : '0'}">${data}</script>
</body>
</html>`;
}
