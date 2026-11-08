const photo = (name) => `/images/pop-petals/${name}`;

const item = (id, name, category, description, image, gallery = []) => ({
  id, name, category, description, price: null, available: true,
  variants: [{ id: 'pictured', name: 'As pictured', swatch: '#c88480', image: photo(image) }],
  gallery: gallery.map(photo)
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
    '02-1000039706.jpg', ['03-1000039707.jpg', '06-1000039712.jpg', '01-1000039724.jpg']),
  item('floral-rosette-cupcakes', 'Petal Swirl Cupcakes', 'cupcakes',
    'A sweet touch for your celebrations.',
    '02-1000039734.jpg', ['06-1000039769.jpg']),
  item('cocoa-milk', 'Cocoa Velvet', 'drinks',
    'Your cocoa fix, ready to sip.',
    '03-1000039723.jpg'),
  item('chocolate-cookie-dessert-cup', 'Cookie Cloud Cup', 'dessert-cups',
    'A spoonful of chocolate indulgence.',
    'chocolate-dessert-cup-polished.png', ['01-1000039705.jpg']),
  item('golden-doughnuts', 'Golden Hour Doughnuts', 'doughnuts',
    'The simple pleasure of a classic.',
    '04-1000039708.jpg', ['09-1000039713.jpg']),
  item('cream-filled-doughnuts', 'Sugar Kiss Doughnuts', 'cream-filled',
    'A sweet surprise at the centre.',
    '05-1000039709.jpg', ['08-1000039710.jpg', '04-1000039771.jpg']),
  item('chocolate-crumb-quartet', 'Cookie Crush Quartet', 'doughnuts',
    'Four favourites for chocolate lovers.',
    '03-1000039707.jpg'),
  item('frosted-favourites', 'Frosted Charm Box', 'doughnuts',
    'The box you bring to the table.',
    '06-1000039712.jpg', ['07-1000039711.jpg']),
  item('cream-and-crumb-trio', 'Cream & Crumb Trio', 'doughnuts',
    'Three little reasons to take a break.',
    '07-1000039711.jpg', ['08-1000039710.jpg']),
  item('sprinkle-doughnut-pops', 'Confetti Pops', 'doughnuts',
    'A little party in every bite.',
    '10-1000039714.jpg', ['05-1000039770.jpg']),
  item('mini-doughnut-bites', 'Golden Minis', 'mini-bites',
    'Small treats, big temptation.',
    '05-1000039770.jpg'),
  item('butterfly-cupcake-collection', 'Butterfly Bloom Cupcakes', 'cupcakes',
    'Bring a little magic to the party.',
    '06-1000039769.jpg'),
  item('zobo', 'Ruby Zobo', 'drinks',
    'A refreshing favourite, made to enjoy.',
    '08-1000039733.jpg')
];

export const popPetalsBrand = {
  name: 'Pop & Petals',
  headline: 'Sweeten the moment.',
  description: 'Your favourite excuse for a treat.',
  home: '/pop-and-petals/',
  orderPending: true,
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
