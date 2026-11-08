import { escapeHtml as html } from '../lib/html.js';
import { globalHeader, globalFooter } from './global-header.js';

const brands = [
  {
    id: 'maknoon',
    name: 'Maknoon Jamil',
    category: 'MODEST FASHION',
    image: '/images/brand-covers/maknoon-jamil.webp',
    alt: 'Maknoon Jamil navy abaya worn in a sunlit stone courtyard',
    href: '/maknoon-jamil/',
    cta: 'Shop modestwear'
  },
  {
    id: 'petals',
    name: 'Pop & Petals',
    category: 'BAKED TREATS & DRINKS',
    image: '/images/brand-covers/pop-and-petals.webp',
    alt: 'Pop & Petals doughnuts, cupcake and bottled Zobo',
    href: '/pop-and-petals/',
    cta: 'Shop the treats'
  },
  {
    id: 'glow',
    name: 'Flawless Glow Co',
    category: 'SKINCARE & BEAUTY',
    image: '/images/brand-covers/flawless-glow-co.webp',
    alt: 'Flawless Glow Co hand creams, face masks and eye patches',
    href: '/flawless-glow-co/',
    cta: 'Explore skincare'
  }
];

export function portfolio(origin) {
  const canonical = origin ? `<link rel="canonical" href="${html(new URL('/', origin).href)}">` : '';
  const preview = origin ? new URL('/previews/shop-all-brands-v3.jpg', origin).href : '';
  const social = preview ? `<meta property="og:type" content="website">
  <meta property="og:site_name" content="Shop">
  <meta property="og:title" content="Wear it. Crave it. Glow.">
  <meta property="og:description" content="Maknoon Jamil · Pop & Petals · Flawless Glow Co">
  <meta property="og:url" content="${html(new URL('/', origin).href)}">
  <meta property="og:image" content="${html(preview)}">
  <meta property="og:image:secure_url" content="${html(preview)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Maknoon Jamil fashion, Pop & Petals treats, and Flawless Glow Co skincare together">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Wear it. Crave it. Glow.">
  <meta name="twitter:description" content="Maknoon Jamil · Pop & Petals · Flawless Glow Co">
  <meta name="twitter:image" content="${html(preview)}">` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#faf7f1">
  <title>Shop | Maknoon Jamil, Pop & Petals & Flawless Glow Co</title>
  <meta name="description" content="Shop Maknoon Jamil modestwear, Pop & Petals treats and Flawless Glow Co skincare.">
  ${canonical}
  ${social}
  <link rel="stylesheet" href="/styles/portfolio.css">
  <link rel="stylesheet" href="/styles/global.css">
</head>
<body>
  ${globalHeader('/')}
  <main id="main">
    <section class="portfolio-hero shell" aria-labelledby="hero-title">
      <h1 id="hero-title">Wear it. <em>Crave it.</em> Glow.</h1>
      <p class="hero-lede">Maknoon Jamil <span aria-hidden="true">·</span> Pop & Petals <span aria-hidden="true">·</span> Flawless Glow Co</p>
      <a class="hero-button" href="#brands">Explore the collections <span aria-hidden="true">↓</span></a>
      <div class="portfolio-mosaic" aria-hidden="true">
        <div class="mosaic-frame mosaic-fashion"><img src="/images/brand-covers/maknoon-jamil.webp" alt="" width="1122" height="1402" fetchpriority="high"></div>
        <div class="mosaic-frame mosaic-treat"><img src="/images/brand-covers/pop-and-petals.webp" alt="" width="1122" height="1402" fetchpriority="high"></div>
        <div class="mosaic-frame mosaic-glow"><img src="/images/brand-covers/flawless-glow-co.webp" alt="" width="1122" height="1402" fetchpriority="high"></div>
      </div>
    </section>
    <section class="brand-section shell" id="brands" aria-labelledby="brands-heading">
      <h2 id="brands-heading">Explore the shops.</h2>
      <div class="brand-grid">
        ${brands.map((brand, index) => `<article class="brand-card brand-${html(brand.id)}">
          <a class="brand-image-link" href="${html(brand.href)}" aria-label="Explore ${html(brand.name)}">
            <img src="${html(brand.image)}" alt="${html(brand.alt)}" width="1122" height="1402" loading="lazy">
            <span class="brand-number">0${index + 1}</span>
          </a>
          <div class="brand-copy"><p class="brand-category">${html(brand.category)}</p><h3>${html(brand.name)}</h3><a href="${html(brand.href)}">${html(brand.cta)} <span aria-hidden="true">↗</span></a></div>
        </article>`).join('')}
      </div>
    </section>
  </main>
  ${globalFooter()}
</body>
</html>`;
}
