import { escapeHtml as html } from '../lib/html.js';
import { contactLink, freeStoreLink } from '../lib/shop.js';
import { whatsappIcon } from './whatsapp-icon.js';

export function siteHeader(home = '/') {
  return `  <a class="skip-link" href="#main">Skip to content</a>
  <a class="announcement" href="${html(freeStoreLink)}" target="_blank" rel="noopener noreferrer">${whatsappIcon} Get a free online store for your business</a>
  <header class="shell masthead">
    <nav aria-label="Storefront"><a href="${home}#styles">Styles</a><a href="${home}#collection">Collection</a></nav>
    <a class="wordmark" href="/">Maknoon Jamil<small>MODESTWEAR</small></a>
    <a class="contact whatsapp-contact" href="${html(contactLink)}" target="_blank" rel="noopener noreferrer">WhatsApp ${whatsappIcon}</a>
  </header>`;
}
