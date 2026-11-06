import { whatsappIcon } from './whatsapp-icon.js';
import { escapeHtml as html } from '../lib/html.js';
import { formatNaira, orderLabel, orderLink, variantPath } from '../lib/shop.js';

export function productCard(product, origin, number) {
  const first = product.variants[0];
  return `<article class="product" data-product="${product.id}" data-category="${product.category}" id="${product.id}">
    <a class="product-media" href="${variantPath(product, first)}">
      <img src="${html(first.image)}" alt="${html(product.name)} in ${html(first.name)}" width="512" height="512" loading="lazy" decoding="async">
    </a>
    <div class="product-body">
      <div class="product-title"><h3>${html(product.name)}</h3>${product.price === null ? '' : `<span>${formatNaira(product.price)}</span>`}</div>
      <p class="description">${html(product.description)}</p>
      <fieldset class="colours" hidden>
        <legend>Colour <span data-selected aria-live="polite">${html(first.name)}</span></legend>
        <div class="swatches">
          ${product.variants.map((variant, index) => `<label class="swatch" title="${html(variant.name)}">
            <input type="radio" name="${product.id}-colour" value="${variant.id}" aria-label="${html(variant.name)}"${index === 0 ? ' checked' : ''}>
            <span style="--swatch:${variant.swatch}"></span>
          </label>`).join('')}
        </div>
      </fieldset>
      ${product.available === false ? '<p class="stock-note">Currently unavailable</p>' : `<a class="order" href="${html(orderLink(product, first, origin, number))}" target="_blank" rel="noopener noreferrer">
        ${orderLabel(product)} ${whatsappIcon}
      </a>`}
    </div>
  </article>`;
}
