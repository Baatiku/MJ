import { escapeHtml as html } from '../lib/html.js';

const brands = [
  {
    id: 'maknoon',
    name: 'Maknoon Jamil',
    category: 'MODEST FASHION',
    description: 'Considered silhouettes, beautiful layers and pieces you will want to wear again.',
    image: '/images/flow-abaya-navy.webp',
    alt: 'A flowing navy-blue abaya from the Maknoon Jamil collection',
    href: '/maknoon-jamil/',
    cta: 'Explore modestwear'
  },
  {
    id: 'petals',
    name: 'Pop & Petals',
    category: 'BAKED TREATS & DRINKS',
    description: 'Doughnuts, decorated cupcakes, indulgent dessert cups and bottled favourites.',
    image: '/images/pop-petals/02-1000039706.jpg',
    alt: 'A six-piece box of assorted chocolate and cream-topped doughnuts',
    href: '/pop-and-petals/',
    cta: 'Explore the treats'
  },
  {
    id: 'glow',
    name: 'Flawless Glow Co',
    category: 'SUNCARE & SKINCARE',
    description: 'A dedicated home for thoughtful skin and sun-care essentials.',
    href: '/flawless-glow-co/',
    cta: 'Meet the brand'
  }
];

export function portfolio(origin) {
  const canonical = origin ? `<link rel="canonical" href="${html(new URL('/', origin).href)}">` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#faf7f1">
  <title>Our Brands | Maknoon Jamil, Pop & Petals & Flawless Glow Co</title>
  <meta name="description" content="One thoughtful destination for Maknoon Jamil modestwear, Pop & Petals treats, and Flawless Glow Co skincare.">
  ${canonical}
  <link rel="stylesheet" href="/styles/portfolio.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="top-strip">Three unique brands. One lovely place to discover them.</div>
  <header class="portfolio-header shell">
    <a class="portfolio-wordmark" href="/" aria-label="Our Brands home"><span class="mark-petal">✳</span> Our Brands</a>
    <nav aria-label="Main navigation"><a href="#brands">The brands</a><a href="/setup/">Create a store</a><a class="owner-link" href="/manage/">Owner sign-in</a></nav>
  </header>
  <main id="main">
    <section class="portfolio-hero shell" aria-labelledby="hero-title">
      <p class="eyebrow"><span class="eyebrow-rule"></span> THE COLLECTION <span class="eyebrow-rule"></span></p>
      <h1 id="hero-title">Good things, <em>beautifully</em> brought together.</h1>
      <p class="hero-lede">Style to wear. Treats to savour. Care for your skin. Discover three distinct businesses, each with a world of its own.</p>
      <a class="hero-button" href="#brands">Explore our brands <span aria-hidden="true">↓</span></a>
      <div class="portfolio-mosaic" aria-hidden="true">
        <div class="mosaic-frame mosaic-fashion"><img src="/images/flow-abaya-navy.webp" alt="" width="512" height="600" fetchpriority="high"></div>
        <div class="mosaic-frame mosaic-treat"><img src="/images/pop-petals/chocolate-dessert-cup-polished.png" alt="" width="1084" height="1451" fetchpriority="high"></div>
        <div class="mosaic-frame mosaic-glow"><div class="sun-disc"><span>F</span><span class="sun-ray" aria-hidden="true">✳</span><span>G</span></div><span class="mosaic-glow-label">FLAWLESS GLOW CO</span></div>
      </div>
    </section>
    <section class="brand-section shell" id="brands" aria-labelledby="brands-heading">
      <p class="eyebrow">DISCOVER SOMETHING LOVELY</p>
      <h2 id="brands-heading">Three brands. Three stories.</h2>
      <p class="section-intro">Choose what brings you here today. Each collection has its own look, products and details.</p>
      <div class="brand-grid">
        ${brands.map((brand, index) => `<article class="brand-card brand-${html(brand.id)}">
          <a class="brand-image-link" href="${html(brand.href)}" aria-label="Explore ${html(brand.name)}">
            ${brand.image ? `<img src="${html(brand.image)}" alt="${html(brand.alt)}" width="720" height="900" loading="lazy">` : '<span class="glow-art" aria-hidden="true"><span class="glow-art-sun">✳</span><span>Flawless<br>Glow Co</span><small>SUNCARE · SKINCARE</small></span>'}
            <span class="brand-number">0${index + 1}</span>
          </a>
          <div class="brand-copy"><p class="brand-category">${html(brand.category)}</p><h3>${html(brand.name)}</h3><p>${html(brand.description)}</p><a href="${html(brand.href)}">${html(brand.cta)} <span aria-hidden="true">↗</span></a></div>
        </article>`).join('')}
      </div>
    </section>
    <section class="closing-note shell" aria-label="Explore our collections">
      <span aria-hidden="true">✳</span>
      <p>From everyday elegance to the little things worth celebrating.</p>
      <a href="#brands">Find your collection ↑</a>
    </section>
  </main>
  <footer class="portfolio-footer"><div class="shell footer-inner"><p>Our Brands <small>MAKNOON JAMIL · POP & PETALS · FLAWLESS GLOW CO</small></p><div><a href="/setup/">Get your own online store</a><a href="/manage/">Manage a store</a></div></div></footer>
</body>
</html>`;
}
