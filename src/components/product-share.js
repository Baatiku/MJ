import { escapeHtml as html } from '../lib/html.js';
import { shareDetails } from '../lib/share-details.js';

const icon = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 16V3m-4 4 4-4 4 4M5 13v7h14v-7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function productShare(product, variant, origin, brand = {}) {
  if (brand.preview) return '';
  const details = shareDetails(product, variant, { origin: origin || 'https://mj.masanawa.com', home: brand.home || '/maknoon-jamil/', name: brand.name || 'Maknoon Jamil' });
  return `<a class="product-share" href="https://wa.me/?text=${encodeURIComponent(details.text)}" target="_blank" rel="noopener noreferrer" data-share-product aria-label="Share ${html(details.title)} on WhatsApp">${icon}<span>Share</span></a>`;
}
