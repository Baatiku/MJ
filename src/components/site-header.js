import { escapeHtml as html } from '../lib/html.js';
import { contactLink } from '../lib/shop.js';
import { whatsappIcon } from './whatsapp-icon.js';

export function siteHeader(home = '/', number, brand = {}) {
  const target = (brand.home || '/') + (brand.preview ? '?preview=1' : '');
  const nav = (home || (brand.preview ? brand.home : '')) + (brand.preview ? '?preview=1' : '');
  return `  <a class="skip-link" href="#main">Skip to content</a>
  <a class="announcement" href="/setup/">Get a free online store for your business <span aria-hidden="true">↗</span></a>
  ${brand.banner && brand.banner !== 'Get a free online store for your business' ? `<p class="shop-announcement">${html(brand.banner)}</p>` : ''}
  <header class="shell masthead">
    <nav aria-label="Storefront"><a href="/">All brands</a><a href="${html(nav)}#styles">${html(brand.navStyles || 'Styles')}</a><a href="${html(nav)}#collection">${html(brand.navCollection || 'Collection')}</a></nav>
    <a class="wordmark" href="${html(target)}">${brand.logo ? `<img src="${html(brand.logo)}" alt="" width="40" height="40">` : ''}${html(brand.name || 'Maknoon Jamil')}<small>${brand.name ? 'STOREFRONT' : 'MODESTWEAR'}</small></a>
    ${number === '' ? '' : `<a class="contact whatsapp-contact" href="${html(contactLink(number, brand.name))}" target="_blank" rel="noopener noreferrer">WhatsApp ${whatsappIcon}</a>`}
  </header>`;
}
