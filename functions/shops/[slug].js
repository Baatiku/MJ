import { publicWorkspace } from '../api/workspaces.js';
import { escapeHtml as html } from '../../src/lib/html.js';
import { whatsappLink } from '../../src/lib/shop.js';
import { whatsappIcon } from '../../src/components/whatsapp-icon.js';
import { page } from '../_catalog.js';

export async function onRequestGet({ env, params }) {
  try {
    const shop = await publicWorkspace(env, params.slug);
    if (!shop) return page('<!doctype html><title>Shop not found</title><h1>Shop not found</h1>', 404);
    const link = shop.whatsapp ? whatsappLink('Hello! I’d like to ask about ' + shop.name + '.', shop.whatsapp) : null;
    return page(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${html(shop.name)}</title><meta name="description" content="${html(shop.description)}">
<link rel="stylesheet" href="/styles/storefront.css"></head>
<body><header class="shell masthead"><span class="wordmark">${html(shop.name)}</span></header>
<main class="shell"><section class="hero"><div class="hero-copy">
<h1>${html(shop.name)}</h1><p>${html(shop.description)}</p>
${link ? `<a class="primary whatsapp-contact" href="${html(link)}" target="_blank" rel="noopener noreferrer">WhatsApp ${whatsappIcon}</a>` : ''}
</div></section></main></body></html>`);
  } catch {
    return page('<!doctype html><title>Shop unavailable</title><h1>Shop temporarily unavailable</h1>', 502);
  }
}
