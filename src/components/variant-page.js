import { productShare } from './product-share.js';
import { siteHeader } from './site-header.js';
import { whatsappIcon } from './whatsapp-icon.js';
import { escapeHtml as html } from '../lib/html.js';
import { formatNaira, orderLabel, orderLink, previewImage, variantPath } from '../lib/shop.js';

export function variantPage(product, variant, origin, number, brand = {}) {
  const name = brand.name || 'Maknoon Jamil';
  const home = brand.home || '/';
  const preview = brand.preview ? '?preview=1' : '';
  const title = `${product.name} in ${variant.name}`;
  const price = product.price === null ? 'Ask for price' : formatNaira(product.price);
  const description = `${price}. Order through ${name} on WhatsApp.`;
  const path = variantPath(product, variant, home);
  const social = origin ? `
  <link rel="canonical" href="${html(new URL(path, origin).href)}">
  <meta property="og:url" content="${html(new URL(path, origin).href)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${html(name)}">
  <meta property="og:title" content="${html(title)}">
  <meta property="og:description" content="${html(description)}">
  <meta property="og:image" content="${html(new URL(previewImage(variant), origin).href)}">

  <meta property="og:image:alt" content="${html(title)}">` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${html(title)} | ${html(name)}</title>
  <meta name="description" content="${html(description)}">${social}
  <link rel="stylesheet" href="/styles/storefront.css">
  <script type="module" src="/lib/product-share.js"></script>
</head>
<body${brand.accent ? ` style="--accent:${html(brand.accent)}"` : ''}>
  ${siteHeader(home, number, brand)}
  <main class="shell variant-page" id="main">
    <a class="variant-back" href="${html(home + preview)}#${product.id}">← Back to the collection</a>
    <div class="variant-layout">
      <img src="${html(variant.image)}" alt="${html(title)}">
      <div>
        <p class="kicker">${html(name)}</p>
        <h1>${html(product.name)}</h1>
        <p class="variant-description">${html(product.description)}</p>
        ${product.price === null ? '' : `<p class="variant-price"><strong>${html(price)}</strong></p>`}
        <nav class="variant-colours" aria-label="Available colours">
          ${product.variants.map((option) => `<a href="${variantPath(product, option, home)}${preview}"${option === variant ? ' aria-current="page"' : ''}>${html(option.name)}</a>`).join('')}
        </nav>
        ${product.available === false ? '<p class="stock-note">Currently unavailable</p>' : number === '' ? '' : `<a class="order" href="${html(orderLink(product, variant, origin, number, home, name))}" target="_blank" rel="noopener noreferrer">${orderLabel(product)} ${whatsappIcon}</a>`}
        ${productShare(title, brand.preview)}
      </div>
    </div>
  </main>
${brand.preview ? '' : `<script type="application/json" id="share-selection">${JSON.stringify({ product, variant, options: { home, name, ...(origin ? { origin } : {}) } }).replaceAll('<', '\\u003c')}</script>`}
</body>
</html>`;
}
