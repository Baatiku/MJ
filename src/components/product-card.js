import { escapeHtml as html } from '../lib/html.js';
import { formatNaira, orderLink, variantPath } from '../lib/shop.js';

export function productCard(product, origin) {
  const first = product.variants[0];
  return `<article class="product" data-product="${product.id}" data-category="${product.category}" id="${product.id}">
    <a class="product-media" href="${variantPath(product, first)}">
      <img src="${first.image}" alt="${html(product.name)} in ${html(first.name)}" width="512" height="512" loading="lazy" decoding="async">
    </a>
    <div class="product-body">
      <div class="product-title"><h3>${html(product.name)}</h3><span>${product.price === null ? 'Ask for price' : formatNaira(product.price)}</span></div>
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
      <a class="order" href="${html(orderLink(product, first, origin))}" target="_blank" rel="noopener noreferrer">
        ${product.price === null ? 'Ask on WhatsApp' : 'Buy on WhatsApp'} <span aria-hidden="true">↗</span>
      </a>
    </div>
  </article>`;
}
