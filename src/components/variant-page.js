import { productShare } from './product-share.js';
import { siteHeader } from './site-header.js';
import { globalFooter, isFeaturedShop } from './global-header.js';
import { whatsappIcon } from './whatsapp-icon.js';
import { escapeHtml as html } from '../lib/html.js';
import { contactLink, displayWhatsAppNumber, formatNaira, orderLabel, orderLink, previewImage, variantPath } from '../lib/shop.js';
import { brandHead, productSchema, socialPhoto } from '../lib/seo.js';

export function variantPage(product, variant, origin, number, brand = {}) {
  const name = brand.name || 'Maknoon Jamil';
  const home = brand.home || '/maknoon-jamil/';
  const preview = brand.preview ? '?preview=1' : '';
  const title = variant.id === 'pictured' ? product.name : `${product.name} in ${variant.name}`;
  const price = product.price === null ? 'Ask for price' : formatNaira(product.price);
  const description = `${product.description} ${product.name} from ${name}.${product.price === null ? '' : ` ${price}.`} ${number ? 'Ask about availability on WhatsApp.' : 'Browse the collection.'}`;
  const path = variantPath(product, variant, home);
  const social = origin ? `
  <link rel="canonical" href="${html(new URL(path, origin).href)}">
  <meta property="og:url" content="${html(new URL(path, origin).href)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_NG">
  <meta property="og:site_name" content="${html(name)}">
  <meta property="og:title" content="${html(title)}">
  <meta property="og:description" content="${html(description)}">
  ${socialPhoto(origin, previewImage(variant), title + ' product photograph')}
  <meta name="twitter:title" content="${html(title)}">
  <meta name="twitter:description" content="${html(description)}">` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${brand.preview ? '<meta name="robots" content="noindex, nofollow">' : ''}
  ${brandHead()}
  <title>${html(title)} | ${html(name)}</title>
  <meta name="description" content="${html(description)}">${social}
  ${origin && !brand.preview ? productSchema(origin, product, variant, { name, home }, number, path) : ''}
  <link rel="stylesheet" href="/styles/storefront.css">
  <link rel="stylesheet" href="/styles/global.css">
  <script type="module" src="/lib/product-share.js"></script>
</head>
<body${brand.themeClass ? ` class="${html(brand.themeClass)}"` : ''}${brand.accent ? ` style="--accent:${html(brand.accent)}"` : ''}>
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
        ${product.gallery?.length ? `<div class="product-gallery" aria-label="More photographs of ${html(product.name)}">${product.gallery.map((src) => `<img src="${html(src)}" alt="More views of ${html(product.name)}" loading="lazy">`).join('')}</div>` : ''}
        ${product.variants.length > 1 ? `<nav class="variant-colours" aria-label="${html(brand.optionsLabel || 'Available colours')}">
          ${product.variants.map((option) => `<a href="${variantPath(product, option, home)}${preview}"${option === variant ? ' aria-current="page"' : ''}>${html(option.name)}</a>`).join('')}
        </nav>` : ''}
        ${product.available === false ? '<p class="stock-note">Currently unavailable</p>' : number === '' ? (brand.orderPending ? `<button type="button" class="order order-pending" disabled title="Business WhatsApp number pending">WhatsApp ordering soon ${whatsappIcon}</button>` : '') : `<a class="order" href="${html(orderLink(product, variant, origin, number, home, name))}" target="_blank" rel="noopener noreferrer">${orderLabel(product)} ${whatsappIcon}</a>`}
        ${productShare(product, variant, origin, brand)}
      </div>
    </div>
  </main>
  ${isFeaturedShop(home) ? globalFooter(number) : `<footer class="footer"><div class="shell footer-inner"><span class="wordmark">${html(name)}</span>${number ? `<a class="contact whatsapp-contact" href="${html(contactLink(number, name))}" target="_blank" rel="noopener noreferrer">${html(displayWhatsAppNumber(number))} ${whatsappIcon}</a>` : ''}</div></footer>`}
${brand.preview ? '' : `<script type="application/json" id="share-selection">${JSON.stringify({ product, variant, options: { home, name, ...(origin ? { origin } : {}) } }).replaceAll('<', '\\u003c')}</script>`}
</body>
</html>`;
}
