import { escapeHtml as html } from '../lib/html.js';
import { contactLink, whatsappNumber } from '../lib/shop.js';
import { contactDetails, contactEmail } from '../lib/seo.js';
import { whatsappIcon } from './whatsapp-icon.js';

export const featuredShops = [
  { href: '/maknoon-jamil/', label: 'Maknoon Jamil' },
  { href: '/pop-and-petals/', label: 'Pop & Petals' },
  { href: '/flawless-glow-co/', label: 'Flawless Glow Co' }
];

export const isFeaturedShop = (path) => featuredShops.some(({ href }) => href === path);

export function globalHeader(active = '/', number = '', brandName = '') {
  const links = [{ href: '/', label: 'Home' }, ...featuredShops];
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="global-site-header">
    <div class="global-header-inner">
      <a class="global-wordmark" href="/" aria-label="shop. home"><img class="global-symbol" src="/brand/shop-mark.svg" alt="" width="40" height="40"> shop<span class="global-wordmark-dot">.</span></a>
      <nav class="global-nav" aria-label="Main shopping navigation">
        ${links.map(({ href, label }) => `<a href="${href}"${active === href ? ' aria-current="page"' : ''}>${html(label)}</a>`).join('')}
      </nav>
      ${number ? `<a class="global-contact" href="${html(contactLink(number, brandName))}" target="_blank" rel="noopener noreferrer" aria-label="Contact ${html(brandName)} on WhatsApp"><span>WhatsApp</span> ${whatsappIcon}</a>` : ''}
    </div>
  </header>`;
}

export function globalFooter(number = whatsappNumber) {
  return `<footer class="global-site-footer"><div class="global-footer-inner">
    <a class="global-footer-mark" href="/"><img src="/brand/shop-mark.svg" alt="" width="42" height="42">shop<span>.</span></a>
    <div class="global-footer-links">
      <nav aria-label="Footer shopping navigation">${featuredShops.map(({ href, label }) => `<a href="${href}">${html(label)}</a>`).join('')}<a href="/contact/">Contact</a></nav>
      <div class="global-footer-contact" aria-label="Customer contact details">${contactDetails(number)}</div>
      <small>Questions about your order? Email <a href="mailto:${contactEmail}">${contactEmail}</a> or call us.</small>
    </div>
  </div></footer>`;
}
