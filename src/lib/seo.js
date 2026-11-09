import { escapeHtml as html } from './html.js';
import { displayWhatsAppNumber } from './shop.js';

export const contactEmail = 'shop@masanawa.com';
export const publicSiteName = 'shop.';

export function brandHead() {
  return `<link rel="icon" href="/brand/shop-mark.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/icons/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180">
  <link rel="mask-icon" href="/brand/shop-pinned.svg" color="#573b42">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="application-name" content="shop.">
  <meta name="apple-mobile-web-app-title" content="shop.">
  <meta name="theme-color" content="#fbf5ed">`;
}

export function schemaScript(document) {
  return `<script type="application/ld+json">${JSON.stringify(document).replaceAll('<', '\\u003c')}</script>`;
}

export function organization(origin, number) {
  return {
    '@type': 'Organization',
    '@id': new URL('/#organization', origin).href,
    name: publicSiteName,
    url: new URL('/', origin).href,
    logo: new URL('/icons/icon-512.png', origin).href,
    email: contactEmail,
    ...(number ? { telephone: '+' + number, contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: '+' + number, email: contactEmail, availableLanguage: ['en'] }] } : {}),
    brand: ['Maknoon Jamil', 'Pop & Petals', 'Flawless Glow Co'].map((name) => ({ '@type': 'Brand', name }))
  };
}

export function homepageSchema(origin, number) {
  const home = new URL('/', origin).href;
  return schemaScript({ '@context': 'https://schema.org', '@graph': [
    organization(origin, number),
    { '@type': 'WebSite', '@id': home + '#website', url: home, name: publicSiteName, description: 'Maknoon Jamil, Pop & Petals and Flawless Glow Co.', publisher: { '@id': home + '#organization' }, inLanguage: 'en-NG' },
    { '@type': 'ItemList', name: 'Our shops', itemListElement: [
      { name: 'Maknoon Jamil', path: '/maknoon-jamil/' },
      { name: 'Pop & Petals', path: '/pop-and-petals/' },
      { name: 'Flawless Glow Co', path: '/flawless-glow-co/' }
    ].map(({ name, path }, index) => ({ '@type': 'ListItem', position: index + 1, name, url: new URL(path, origin).href })) }
  ] });
}

export function shopSchema(origin, { name, description, home }, number, image) {
  const url = new URL(home, origin).href;
  return schemaScript({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Store', '@id': url + '#store', name, description, url, ...(image ? { image } : {}), email: contactEmail,
      ...(number ? { telephone: '+' + number } : {}), parentOrganization: { '@id': new URL('/#organization', origin).href } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: publicSiteName, item: new URL('/', origin).href },
      { '@type': 'ListItem', position: 2, name, item: url }
    ] }
  ] });
}

export function productSchema(origin, product, variant, brand, number, path) {
  const url = new URL(path, origin).href;
  const shopUrl = new URL(brand.home, origin).href;
  const title = variant.id === 'pictured' ? product.name : `${product.name} in ${variant.name}`;
  return schemaScript({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Product', '@id': url + '#product', name: title, description: product.description, url,
      image: new URL(variant.image, origin).href, sku: `${product.id}-${variant.id}`,
      ...(product.price !== null && Number.isSafeInteger(product.price) && product.price >= 0 ? {
        offers: { '@type': 'Offer', url, price: String(product.price), priceCurrency: 'NGN',
          availability: product.available === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          seller: { '@id': shopUrl + '#store' } }
      } : {}) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: publicSiteName, item: new URL('/', origin).href },
      { '@type': 'ListItem', position: 2, name: brand.name, item: shopUrl },
      { '@type': 'ListItem', position: 3, name: title, item: url }
    ] }
  ] });
}

export function socialPhoto(origin, src, alt) {
  if (!origin || !src) return '';
  const absolute = html(new URL(src, origin).href);
  const type = /\.jpe?g(?:$|\?)/i.test(src) ? 'image/jpeg' : /\.png(?:$|\?)/i.test(src) ? 'image/png' : /\.webp(?:$|\?)/i.test(src) ? 'image/webp' : '';
  return `<meta property="og:image" content="${absolute}">
  <meta property="og:image:secure_url" content="${absolute}">
  ${type ? `<meta property="og:image:type" content="${type}">` : ''}
  <meta property="og:image:alt" content="${html(alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${absolute}">
  <meta name="twitter:image:alt" content="${html(alt)}">`;
}

export function contactDetails(number) {
  return `<a href="mailto:${contactEmail}">${contactEmail}</a>${number ? `<a href="tel:+${html(number)}">${html(displayWhatsAppNumber(number))}</a>` : ''}`;
}
