const photo = (name) => `/images/pop-petals/${name}`;

const item = (id, name, category, description, original, polished, gallery = []) => ({
  id, name, category, description, price: null, available: true,
  variants: [{ id: 'pictured', name: 'As pictured', swatch: '#c88480', image: photo(`curated/${polished}.webp`) }],
  gallery: [original, ...gallery].map(photo)
});

export const popPetalsCategories = [
  { id: 'doughnuts', name: 'Doughnuts' },
  { id: 'cream-filled', name: 'Filled favourites' },
  { id: 'cupcakes', name: 'Decorated cupcakes' },
  { id: 'dessert-cups', name: 'Dessert cups' },
  { id: 'drinks', name: 'Bottled drinks' },
  { id: 'mini-bites', name: 'Mini bites' }
];

export const popPetalsProducts = [
  item('signature-doughnut-box', 'Midnight Drizzle Box', 'doughnuts',
    'Six irresistible reasons to share.',
    '02-1000039706.jpg', 'midnight-drizzle', ['03-1000039707.jpg', '06-1000039712.jpg']),
  item('floral-rosette-cupcakes', 'Petal Swirl Cupcakes', 'cupcakes',
    'A sweet touch for your celebrations.',
    '04-1000039771.jpg', 'petal-swirl-cupcakes', ['08-1000039733.jpg']),
  item('cocoa-milk', 'Cocoa Velvet', 'drinks',
    'Your cocoa fix, ready to sip.',
    '01-1000039724.jpg', 'cocoa-velvet'),
  item('chocolate-cookie-dessert-cup', 'Cookie Cloud Cup', 'dessert-cups',
    'A spoonful of chocolate indulgence.',
    'chocolate-dessert-cup-polished.png', 'cookie-cloud-cup', ['01-1000039705.jpg']),
  item('golden-doughnuts', 'Golden Hour Doughnuts', 'doughnuts',
    'The simple pleasure of a classic.',
    '04-1000039708.jpg', 'golden-hour', ['09-1000039713.jpg']),
  item('cream-filled-doughnuts', 'Sugar Kiss Doughnuts', 'cream-filled',
    'A sweet surprise at the centre.',
    '05-1000039709.jpg', 'sugar-kiss', ['08-1000039710.jpg']),
  item('chocolate-crumb-quartet', 'Cookie Crush Quartet', 'doughnuts',
    'For the serious chocolate lover.',
    '03-1000039707.jpg', 'cookie-crush'),
  item('frosted-favourites', 'Frosted Charm Box', 'doughnuts',
    'The box you bring to the table.',
    '06-1000039712.jpg', 'frosted-charm', ['07-1000039711.jpg']),
  item('cream-and-crumb-trio', 'Cream & Crumb Trio', 'doughnuts',
    'Three little reasons to take a break.',
    '07-1000039711.jpg', 'cream-crumb-trio', ['08-1000039710.jpg']),
  item('sprinkle-doughnut-pops', 'Confetti Pops', 'doughnuts',
    'A little party in every bite.',
    '10-1000039714.jpg', 'confetti-pops'),
  item('mini-doughnut-bites', 'Golden Minis', 'mini-bites',
    'Small treats, big temptation.',
    '05-1000039770.jpg', 'golden-minis'),
  item('butterfly-cupcake-collection', 'Butterfly Bloom Cupcakes', 'cupcakes',
    'Bring a little magic to the party.',
    '08-1000039733.jpg', 'butterfly-bloom', ['06-1000039769.jpg']),
  item('zobo', 'Ruby Zobo', 'drinks',
    'A refreshing favourite, made to enjoy.',
    '03-1000039723.jpg', 'ruby-zobo')
];

// Upgrade previously bootstrapped default photos at display time without
// replacing an owner's customised product images, prices or descriptions.
const legacyCoverCorrections = {
  'floral-rosette-cupcakes': photo('02-1000039734.jpg'),
  'cocoa-milk': photo('03-1000039723.jpg'),
  'butterfly-cupcake-collection': photo('06-1000039769.jpg'),
  zobo: photo('08-1000039733.jpg')
};

export function withCurrentPopPetalsPhotos(catalog) {
  const current = new Map(popPetalsProducts.map((product) => [product.id, product]));
  return catalog.map((product) => {
    const updated = current.get(product.id);
    if (!updated || ![updated.gallery[0], legacyCoverCorrections[product.id]].includes(product.variants?.[0]?.image)) return product;
    return {
      ...product,
      variants: product.variants.map((variant, index) => index === 0
        ? { ...variant, image: updated.variants[0].image }
        : variant),
      gallery: [...new Set([...updated.gallery, ...(product.gallery || [])])]
    };
  });
}

export const popPetalsBrand = {
  name: 'Pop & Petals',
  headline: 'Sweeten the moment.',
  description: 'Your favourite excuse for a treat.',
  home: '/pop-and-petals/',
  cover: '/images/brand-covers/pop-and-petals.webp',
  heroImages: [
    '/images/pop-petals/curated/cookie-cloud-cup.webp',
    '/images/brand-covers/pop-and-petals.webp',
    '/images/pop-petals/curated/ruby-zobo.webp'
  ],
  accent: '#ae6478',
  themeClass: 'pop-petals-theme',
  stylesKicker: 'Pick your craving',
  stylesHeading: 'Something for every sweet tooth',
  collectionHeading: 'Explore the menu',
  optionsLabel: 'Presentation',
  navStyles: 'Treats',
  navCollection: 'Menu',
  filterAllLabel: 'All treats',
  categoryLabels: Object.fromEntries(popPetalsCategories.map(({ id, name }) => [id, name]))
};
