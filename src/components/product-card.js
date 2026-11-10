import { productShare } from './product-share.js';
import { whatsappIcon } from './whatsapp-icon.js';
import { escapeHtml as html } from '../lib/html.js';
import { formatNaira, orderLabel, orderLink, variantPath } from '../lib/shop.js';

export function productCard(product, origin, number, brand = {}) {
  const first = product.variants[0];
  return `<article class="product" data-product="${product.id}" data-category="${product.category}" id="${product.id}">
    <a class="product-media" href="${variantPath(product, first, brand.home)}${brand.preview ? '?preview=1' : ''}">
      <img src="${html(first.image)}" alt="${html(product.name)}${first.id === 'pictured' ? '' : ' in ' + html(first.name)}" width="512" height="512" loading="lazy" decoding="async">
    </a>
    <div class="product-body">
      <div class="product-title"><h3>${html(product.name)}</h3>${product.price === null ? '' : `<span>${formatNaira(product.price)}</span>`}</div>
      <p class="description">${html(product.description)}</p>
      <fieldset class="colours" hidden>
        <legend>${html(brand.optionsLabel || 'Colour')} <span data-selected aria-live="polite">${html(first.name)}</span></legend>
        <div class="swatches"${product.variants.length > 6 ? ' data-collapsed' : ''}>
          ${product.variants.map((variant, index) => `<label class="swatch" title="${html(variant.name)}">
            <input type="radio" name="${product.id}-colour" value="${variant.id}" aria-label="${html(variant.name)}"${index === 0 ? ' checked' : ''}>
            <span style="--swatch:${variant.swatch}"></span>
          </label>`).join('')}
        </div>
        ${product.variants.length > 6 ? `<button type="button" class="swatches-toggle" aria-expanded="false">+${product.variants.length - 6} more colours</button>` : ''}
      </fieldset>
      ${product.available === false ? '<p class="stock-note">Currently unavailable</p>' : number === '' ? (brand.orderPending ? `<button type="button" class="order order-pending" disabled title="Business WhatsApp number pending">WhatsApp ordering soon ${whatsappIcon}</button>` : '') : `<a class="order" href="${html(orderLink(product, first, origin, number, brand.home, brand.name))}" target="_blank" rel="noopener noreferrer">
        ${orderLabel(product)} ${whatsappIcon}
      </a>`}
      ${productShare(product, first, origin, brand)}
    </div>
  </article>`;
}
