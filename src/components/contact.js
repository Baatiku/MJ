import { escapeHtml as html } from '../lib/html.js';
import { contactLink, displayWhatsAppNumber, whatsappNumber } from '../lib/shop.js';
import { brandHead, contactEmail, schemaScript, socialPhoto } from '../lib/seo.js';
import { globalHeader, globalFooter } from './global-header.js';

export function contactPage(origin) {
  const title = 'Contact shop. | Maknoon Jamil, Pop & Petals & Flawless Glow Co';
  const description = 'Questions about Maknoon Jamil, Pop & Petals or Flawless Glow Co? Contact us by email, phone or WhatsApp.';
  const url = origin ? new URL('/contact/', origin).href : '';
  return `<!doctype html><html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  ${brandHead()}
  <title>${html(title)}</title><meta name="description" content="${html(description)}">
  ${url ? `<link rel="canonical" href="${html(url)}">
    <meta property="og:type" content="website"><meta property="og:locale" content="en_NG">
    <meta property="og:title" content="${html(title)}"><meta property="og:description" content="${html(description)}">
    <meta property="og:url" content="${html(url)}">
    ${socialPhoto(origin, '/previews/shop-all-brands-v3.jpg', 'Three brands at shop.')}
    ${schemaScript({ '@context': 'https://schema.org', '@type': 'ContactPage', name: title, url, description, mainEntity: { '@id': new URL('/#organization', origin).href } })}` : ''}
  <link rel="stylesheet" href="/styles/global.css">
  </head><body class="contact-page">
  ${globalHeader('/', whatsappNumber, 'shop.')}
  <main id="main" class="contact-page-main">
    <img src="/brand/shop-mark.svg" alt="" width="76" height="76">
    <p class="contact-kicker">GET IN TOUCH</p>
    <h1>We’re here to help.</h1>
    <p>Maknoon Jamil · Pop &amp; Petals · Flawless Glow Co</p>
    <div class="contact-page-options">
      <a class="contact-page-whatsapp" href="${html(contactLink(whatsappNumber, 'shop.'))}" target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>
      <a href="mailto:${contactEmail}">${contactEmail}</a>
      <a href="tel:+${whatsappNumber}">${html(displayWhatsAppNumber(whatsappNumber))}</a>
    </div>
    <a class="contact-back" href="/">← Explore the shops</a>
  </main>
  ${globalFooter(whatsappNumber)}
  </body></html>`;
}
