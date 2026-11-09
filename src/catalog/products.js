import { fourthColour } from './fourth-colours.js';
import { photographedStock } from './stock.js';
import { maknoonPhotoBatch } from './maknoon-photo-batch.js';

const product = (id, name, category, description, colours, price = null) => ({
  id, name, category, description, price,
  variants: colours.map(([idSuffix, name, swatch]) => ({
    id: idSuffix,
    name,
    swatch,
    image: `/images/${id}-${idSuffix}.webp`
  }))
});

const newStyle = (id, name, category, description) => ({
  id, name, category, description, price: null,
  variants: [
    ['navy', 'Midnight Navy', '#202e47'],
    ['olive', 'Olive', '#54583d'],
    ['taupe', 'Warm Taupe', '#9a8170']
  ].map(([colour, name, swatch]) => ({ id: colour, name, swatch, image: `/images/${id}-${colour}.jpg` }))
});

export const categories = [
  { id: 'abaya', name: 'Abayas', image: '/images/maknoon-stock/satin-waterfall-abaya-navy.webp' },
  { id: 'khimar', name: 'Khimars', image: '/images/maknoon-stock/full-coverage-jilbab-purple.webp' },
  { id: 'niqab', name: 'Niqab looks', image: '/images/blue-veil-blue.webp' },
  { id: 'dress', name: 'Maxi dresses', image: '/images/maknoon-stock/gathered-waist-maxi-teal.webp' },
  { id: 'layer', name: 'Layers & sets', image: '/images/open-kimono-abaya-olive.jpg' },
  { id: 'headwear', name: 'Hijabs & undercaps', image: '/images/chiffon-wrap-taupe.jpg' }
];

const styles = [
  product('flow-abaya', 'The Flow Abaya', 'abaya', 'An easy full-length drape with generous sleeves.', [
    ['navy', 'Navy Blue', '#26354e'], ['black', 'Black', '#252323'], ['brown', 'Warm Brown', '#77533a']
  ], 25000),
  product('rose-khimar', 'The Petal Khimar', 'khimar', 'Soft, overlapping layers frame the shoulders.', [
    ['rose', 'Dusty Rose', '#ad7288'], ['slate', 'Slate Blue', '#536a80'], ['black', 'Black', '#262525']
  ]),
  product('blue-veil', 'The Long Veil Look', 'niqab', 'A long khimar styled with a coordinated niqab.', [
    ['blue', 'Deep Blue', '#245875'], ['black', 'Black', '#282625'], ['espresso', 'Espresso', '#483026']
  ]),
  product('everyday-abaya', 'The Everyday Abaya', 'abaya', 'A straight silhouette with clean, simple sleeves.', [
    ['olive', 'Olive', '#585840'], ['burgundy', 'Burgundy', '#663640'], ['charcoal', 'Charcoal', '#424144']
  ]),
  product('pleated-abaya', 'The Pleated Cuff Abaya', 'abaya', 'Gathered cuffs add shape to a softly flowing cut.', [
    ['sand', 'Sand', '#ab8563'], ['mocha', 'Mocha', '#735541'], ['black', 'Black', '#252423']
  ]),
  product('butterfly-abaya', 'The Butterfly Abaya', 'abaya', 'Wide wings fall into a dramatic floor-length drape.', [
    ['black', 'Black', '#262426'], ['aubergine', 'Aubergine', '#58374f'], ['midnight', 'Midnight Navy', '#273148']
  ]),
  product('cascade-khimar', 'The Cascade Khimar', 'khimar', 'Three pointed layers give the silhouette its movement.', [
    ['plum', 'Plum', '#66384f'], ['taupe', 'Taupe', '#8c7669'], ['olive', 'Deep Olive', '#50523a']
  ]),
  product('rounded-khimar', 'The Rounded Khimar', 'khimar', 'Two softly curved layers create a gentle, rounded hem.', [
    ['oat', 'Oat', '#c2ac8d'], ['espresso', 'Espresso', '#4b3028'], ['mauve', 'Warm Mauve', '#9c707c']
  ]),
  product('short-veil', 'The Short Veil Look', 'niqab', 'A shorter drape styled with a coordinated niqab.', [
    ['slate', 'Smoky Slate', '#4b5c6c'], ['plum', 'Dusty Plum', '#795565'], ['forest', 'Forest Green', '#385344']
  ]),
  product('jilbab-veil', 'The Layered Jilbab Look', 'niqab', 'A layered jilbab silhouette styled with a matching niqab.', [
    ['black', 'Black', '#282424'], ['taupe', 'Warm Taupe', '#9a8170'], ['burgundy', 'Dark Burgundy', '#5d303a']
  ]),
  newStyle('belted-shirt-maxi', 'Belted Shirt Maxi', 'dress', 'A collared, button-front silhouette with a waist tie.'),
  newStyle('pleated-high-neck-maxi', 'High-Neck Pleated Maxi', 'dress', 'A high neckline and flowing pleats.'),
  newStyle('linen-a-line-maxi', 'A-Line Maxi', 'dress', 'A relaxed A-line cut with a softly textured finish.'),
  newStyle('tiered-gathered-maxi', 'Tiered Gathered Maxi', 'dress', 'Gathered tiers give this full-length dress movement.'),
  newStyle('longline-knit-maxi', 'Longline Knit Maxi', 'dress', 'A long, simple silhouette with a knit finish.'),
  newStyle('open-kimono-abaya', 'Open Kimono Abaya', 'layer', 'An open-front layer with wide kimono sleeves.'),
  newStyle('wide-leg-tunic-set', 'Wide-Leg Tunic Set', 'layer', 'A long tunic styled with wide-leg trousers.'),
  newStyle('cape-sleeve-abaya', 'Cape-Sleeve Abaya', 'layer', 'A flowing cape sleeve for a more formal silhouette.'),
  newStyle('hooded-jilbab', 'Hooded Jilbab', 'layer', 'A full-length jilbab with an integrated hood.'),
  newStyle('waistcoat-maxi-set', 'Longline Waistcoat Set', 'layer', 'A long waistcoat styled with a matching maxi skirt.'),
  newStyle('chiffon-wrap', 'Chiffon Wrap Hijab', 'headwear', 'A rectangular wrap with soft, overlapping folds.'),
  newStyle('satin-square', 'Satin Square Hijab', 'headwear', 'A square scarf folded into a neat triangular drape.'),
  newStyle('ribbed-instant', 'Ribbed Instant Hijab', 'headwear', 'A close-fitting pull-on shape with fine ribbing.'),
  newStyle('tie-back-undercap', 'Tie-Back Undercap', 'headwear', 'A full-coverage undercap with an adjustable tie.'),
  newStyle('pull-on-prayer-hijab', 'Pull-On Prayer Hijab', 'headwear', 'A pull-on prayer covering with a shoulder-length drape.')
];

// Real stock leads the collection. Preserve legacy catalogue entries during
// the owner's stock audit; they must not be silently deleted or marked stocked.
export const products = [
  ...photographedStock,
  ...maknoonPhotoBatch.map((item) => ({ ...item, stock: true })),
  ...styles.map((style) => ({
    ...style, variants: [...style.variants, fourthColour(style.id)]
  }))
];
