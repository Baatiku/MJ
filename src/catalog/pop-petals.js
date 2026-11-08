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
  item('signature-doughnut-box', 'Signature Doughnut Box', 'doughnuts',
    'A box of six decorated doughnuts with chocolate drizzles, cookie crumbs and creamy toppings.',
    '02-1000039706.jpg', ['03-1000039707.jpg', '06-1000039712.jpg', '01-1000039724.jpg']),
  item('floral-rosette-cupcakes', 'Floral Rosette Cupcakes', 'cupcakes',
    'Cupcakes finished with beautifully piped rosettes in soft blue, blush and plum tones, with decorative pearls.',
    '02-1000039734.jpg', ['06-1000039769.jpg']),
  item('cocoa-milk', 'Cocoa Milk', 'drinks',
    'A bottled cocoa milk drink with a chocolate-coloured swirl. Presented in Pop & Petals packaging.',
    '03-1000039723.jpg'),
  item('chocolate-cookie-dessert-cup', 'Chocolate Cookie Dessert Cup', 'dessert-cups',
    'A chocolate-and-cream swirl topped with whipped cream, chocolate pieces and dark cookie crumbles.',
    'chocolate-dessert-cup-polished.png', ['01-1000039705.jpg']),
  item('golden-doughnuts', 'Classic Golden Doughnuts', 'doughnuts',
    'Soft-looking golden doughnuts with a simple, uncoated finish, pictured in trays and takeaway boxes.',
    '04-1000039708.jpg', ['09-1000039713.jpg']),
  item('cream-filled-doughnuts', 'Cream-Filled Sugar Doughnuts', 'cream-filled',
    'Golden doughnuts generously dusted in fine sugar, with pale cream filling visible at the centre.',
    '05-1000039709.jpg', ['08-1000039710.jpg', '04-1000039771.jpg']),
  item('chocolate-crumb-quartet', 'Chocolate & Cookie Doughnut Quartet', 'doughnuts',
    'A four-piece selection featuring chocolate curls, biscuit crumbles and cookies-and-cream toppings.',
    '03-1000039707.jpg'),
  item('frosted-favourites', 'Frosted Favourites Box', 'doughnuts',
    'A mixed box of decorated doughnuts finished with smooth white frosting, cookie crumble and golden crumbs.',
    '06-1000039712.jpg', ['07-1000039711.jpg']),
  item('cream-and-crumb-trio', 'Cream & Crumb Trio', 'doughnuts',
    'Three doughnuts with a combination of creamy frosting, biscuit crumbs and a soft powdered finish.',
    '07-1000039711.jpg', ['08-1000039710.jpg']),
  item('sprinkle-doughnut-pops', 'Rainbow Sprinkle Doughnut Treats', 'doughnuts',
    'Chocolate- and vanilla-coloured icing with cheerful multicoloured sprinkles, presented in a small treat box.',
    '10-1000039714.jpg', ['05-1000039770.jpg']),
  item('mini-doughnut-bites', 'Mini Doughnut Bites', 'mini-bites',
    'Small, golden round doughnut bites, with examples of cream-coated and crumb-topped presentation.',
    '05-1000039770.jpg'),
  item('butterfly-cupcake-collection', 'Butterfly Cupcake Collection', 'cupcakes',
    'Colourful piped cupcake designs with decorative butterfly toppers, floral swirls and gold accents.',
    '06-1000039769.jpg'),
  item('zobo', 'Zobo Drink', 'drinks',
    'Deep-red bottled zobo drink in Pop & Petals branded packaging.',
    '08-1000039733.jpg')
];

export const popPetalsBrand = {
  name: 'Pop & Petals',
  headline: 'A little sweetness, beautifully made.',
  description: 'Explore decorated doughnuts, filled favourites, cupcakes, dessert cups and bottled drinks.',
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
  categoryLabels: Object.fromEntries(popPetalsCategories.map(({ id, name }) => [id, name]))
};
