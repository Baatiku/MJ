import { escapeHtml as html } from '../lib/html.js';

const icon = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 16V3m-4 4 4-4 4 4M5 13v7h14v-7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function productShare(label, preview = false) {
  return preview ? '' : `<button class="product-share" type="button" data-share-product hidden aria-label="Share ${html(label)}" aria-haspopup="dialog">${icon}<span>Share</span></button>`;
}
