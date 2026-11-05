import { whatsappIcon } from './whatsapp-icon.js';
import { categories, products } from '../catalog/products.js';
import { escapeHtml as html } from '../lib/html.js';
import { contactLink, displayWhatsAppNumber } from '../lib/shop.js';
import { siteHeader } from './site-header.js';
import { productCard } from './product-card.js';

export function storefront(origin, catalog = products) {
  const categoryLinks = categories.flatMap(({ id, name }) => {
    const lead = catalog.find((product) => product.category === id);
    if (!lead) return [];
    return `<a class="category" href="?category=${id}#collection">
      <img src="${html(lead.variants[0].image)}" alt="" width="512" height="512" loading="lazy">
      <span>${html(name)} <b aria-hidden="true">↗</b></span>
    </a>`;
  }).join('');
  const hero = catalog.slice(0, 3).map(({ variants }) =>
    `<img src="${html(variants[0].image)}" alt="" width="512" height="512" fetchpriority="high">`
  ).join('');
  const data = JSON.stringify(catalog).replaceAll('<', '\\u003c');
  const title = 'Maknoon Jamil | Modestwear Catalog';
  const description = 'Shop abayas, khimars, hijabs, niqabs and modest dresses. Order on WhatsApp.';
  const homepage = origin ? new URL('/', origin).href : null;
  const cover = homepage ? new URL('/previews/maknoon-jamil-catalog.jpg', homepage).href : null;
  const social = homepage ? `
  <link rel="canonical" href="${html(homepage)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Maknoon Jamil">
  <meta property="og:url" content="${html(homepage)}">
  <meta property="og:title" content="${html(title)}">
  <meta property="og:description" content="${html(description)}">
  <meta property="og:image" content="${html(cover)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="960">
  <meta property="og:image:height" content="504">
  <meta property="og:image:alt" content="Maknoon Jamil catalog cover showing modestwear from across the collection.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${html(title)}">
  <meta name="twitter:description" content="${html(description)}">
  <meta name="twitter:image" content="${html(cover)}">` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${html(description)}">${social}
  <meta name="theme-color" content="#faf6ef">
  <title>${html(title)}</title>
  <link rel="stylesheet" href="/styles/storefront.css">
  <script src="/storefront.js" type="module"></script>
</head>
<body>
  ${siteHeader('')}
  <main class="shell" id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="kicker">Collection 01 <span aria-hidden="true">✦</span> The Drape Edit</p>
        <h1 id="hero-title">Grace in <em>every fold.</em></h1>
        <p>Fluid silhouettes and rich colours, from wide-sleeve abayas to softly layered khimars.</p>
        <a class="primary" href="#collection">Explore the collection <span aria-hidden="true">↓</span></a>
      </div>
      ${hero ? `<div class="hero-gallery" aria-hidden="true">${hero}</div>` : ''}
    </section>
    <section class="style-section" id="styles" aria-labelledby="styles-title">
      <p class="kicker">Find your silhouette</p><h2 id="styles-title">Shop by style</h2>
      <div class="category-grid">${categoryLinks}</div>
    </section>
    <section class="collection" id="collection" aria-labelledby="collection-title">
      <div class="section-head">
        <div><p class="kicker">The collection</p><h2 id="collection-title">Find your colour</h2></div>
        <div class="filters" aria-label="Filter collection" hidden>
          <button type="button" data-filter="all" aria-pressed="true">All styles</button>
          ${categories.filter(({ id }) => catalog.some(({ category }) => category === id)).map(({ id, name }) => `<button type="button" data-filter="${id}" aria-pressed="false">${html(name)}</button>`).join('')}
        </div>
      </div>
      <p class="collection-note">Choose a colour to see its photo, then message us on WhatsApp to confirm availability.</p>
      <p class="sr-only" data-result-count aria-live="polite"></p>
      ${catalog.length ? '' : '<p>No styles are listed right now.</p>'}
      <div class="product-grid">${catalog.map((product) => productCard(product, origin)).join('')}</div>
    </section>
  </main>
  <footer class="footer">
    <div class="shell footer-inner"><div><span class="wordmark">Maknoon Jamil</span><p>Modestwear boutique · <a href="/admin/">Owner sign-in</a></p></div>
    <a class="contact whatsapp-contact" href="${html(contactLink)}" target="_blank" rel="noopener noreferrer">${html(displayWhatsAppNumber())} ${whatsappIcon}</a></div>
  </footer>
  <script type="application/json" id="catalog-data">${data}</script>
</body>
</html>`;
}
