import { categories, products } from '../catalog/products.js';
import { escapeHtml as html } from '../lib/html.js';
import { contactLink } from '../lib/shop.js';
import { productCard } from './product-card.js';

const categoryLinks = categories.map(({ id, name, image }) => `
  <a class="category" href="?category=${id}#collection" data-filter-link="${id}">
    <img src="${image}" alt="" width="512" height="512" loading="lazy">
    <span>${html(name)} <b aria-hidden="true">↗</b></span>
  </a>`).join('');

export function storefront() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Explore Maknoon Jamil’s abayas, khimars and niqab looks. Choose a colour and order through WhatsApp.">
  <meta name="theme-color" content="#faf6ef">
  <title>Maknoon Jamil — Modestwear Boutique</title>
  <link rel="stylesheet" href="/styles/storefront.css">
  <script src="/storefront.js" type="module"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="announcement">Nigerian modestwear boutique <span aria-hidden="true">✦</span> Orders via WhatsApp</div>
  <header class="shell masthead">
    <nav aria-label="Storefront"><a href="#styles">Styles</a><a href="#collection">Collection</a></nav>
    <a class="wordmark" href="/">Maknoon Jamil<small>MODESTWEAR</small></a>
    <a class="contact" href="${html(contactLink)}" target="_blank" rel="noopener noreferrer">WhatsApp <span aria-hidden="true">↗</span></a>
  </header>
  <main class="shell" id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="kicker">Collection 01 <span aria-hidden="true">✦</span> The Drape Edit</p>
        <h1 id="hero-title">Grace in <em>every fold.</em></h1>
        <p>Fluid silhouettes and rich colours, from wide-sleeve abayas to softly layered khimars.</p>
        <a class="primary" href="#collection">Explore the collection <span aria-hidden="true">↓</span></a>
      </div>
      <div class="hero-gallery" aria-hidden="true">
        <img src="/images/flow-abaya-navy.webp" alt="" width="512" height="512" fetchpriority="high">
        <img src="/images/rose-khimar-rose.webp" alt="" width="512" height="512" fetchpriority="high">
        <img src="/images/blue-veil-blue.webp" alt="" width="512" height="512" fetchpriority="high">
      </div>
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
          ${categories.map(({ id, name }) => `<button type="button" data-filter="${id}" aria-pressed="false">${html(name)}</button>`).join('')}
        </div>
      </div>
      <p class="collection-note">Studio imagery shows each colour. For styles marked <strong>Style concept</strong>, ask us about availability and pricing.</p>
      <p class="sr-only" data-result-count aria-live="polite"></p>
      <div class="product-grid">${products.map(productCard).join('')}</div>
    </section>
  </main>
  <footer class="footer">
    <div class="shell footer-inner"><div><span class="wordmark">Maknoon Jamil</span><p>Modestwear boutique</p></div>
    <a class="contact" href="${html(contactLink)}" target="_blank" rel="noopener noreferrer">+234 802 251 9062 <span aria-hidden="true">↗</span></a></div>
  </footer>
</body>
</html>`;
}
