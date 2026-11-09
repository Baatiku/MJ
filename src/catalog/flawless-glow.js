const image = (name) => `/images/flawless-glow/${name}.webp`;

const product = (id, name, category, description, photo) => ({
  id,
  name,
  category,
  description,
  price: null,
  available: true,
  variants: [{ id: 'pictured', name: 'As pictured', swatch: '#d0aaa0', image: image(photo) }],
  gallery: []
});

export const flawlessGlowCategories = [
  { id: 'hand-care', name: 'Hand care' },
  { id: 'face-masks', name: 'Face masks' },
  { id: 'eye-lip-care', name: 'Eye & lip care' },
  { id: 'hair-removal', name: 'Hair removal' },
  { id: 'beauty-tools', name: 'Beauty tools' }
];

export const flawlessGlowProducts = [
  product('sadoer-fruit-hand-cream-trio', 'SADOER Fruit Crush Hand Cream Trio', 'hand-care',
    'Strawberry, lemon and peach for your handbag.', 'fruit-hand-cream-trio'),
  product('sadoer-hyaluronic-sheet-mask', 'SADOER 8-Fold Hyaluronic Sheet Mask', 'face-masks',
    'A little hydration break, whenever you need one.', 'hyaluronic-sheet-mask'),
  product('sadoer-blueberry-sheet-mask', 'SADOER Blueberry Hydrating Face Mask', 'face-masks',
    'Make your evening routine a treat.', 'blueberry-sheet-mask'),
  product('sadoer-aloe-sheet-mask', 'SADOER Aloe Vera Face Mask', 'face-masks',
    'A refreshing pick for your next self-care night.', 'aloe-vera-sheet-mask'),
  product('bioaqua-eye-lip-patch-collection', 'BIOAQUA Colour Pop Eye & Lip Patches', 'eye-lip-care',
    'A playful addition to your self-care kit.', 'eye-lip-patch-collection'),
  product('bioaqua-collagen-night-mask', 'BIOAQUA Collagen Overnight Mask', 'face-masks',
    'Make a little room for your night-time routine.', 'collagen-overnight-mask'),
  product('laikou-mud-mask-mix', 'LAIKOU Botanical Mud Mask Mix', 'face-masks',
    'Matcha, eggplant, mung bean, sakura and tea tree.', 'botanical-mud-masks'),
  product('milk-chrysanthemum-wax', 'Milk & Chrysanthemum Roll-On Wax Duo', 'hair-removal',
    'Two choices for your waxing routine.', 'roll-on-wax-duo'),
  product('silver-compact-mirror-brush', 'Silver Bow Mirror & Hairbrush Compact', 'beauty-tools',
    'A pretty little touch-up companion.', 'compact-mirror-hairbrush'),
  product('rainbow-silicone-cleansing-brushes', 'Rainbow Silicone Facial Brush Set', 'beauty-tools',
    'Pick your colour for your cleansing routine.', 'silicone-cleansing-brushes')
];

export const flawlessGlowBrand = {
  name: 'Flawless Glow Co',
  seoTitle: 'Skincare & Beauty Products',
  headline: 'A little time for you.',
  description: 'Your beauty-shelf favourites.',
  home: '/flawless-glow-co/',
  cover: '/images/brand-covers/flawless-glow-co.webp',
  shareImage: '/previews/brand-covers/flawless-glow-co.jpg',
  heroImages: [
    '/images/flawless-glow/fruit-hand-cream-trio.webp',
    '/images/brand-covers/flawless-glow-co.webp',
    '/images/flawless-glow/botanical-mud-masks.webp'
  ],
  accent: '#a77f76',
  themeClass: 'flawless-glow-theme',
  stylesKicker: 'Pick your favourite',
  stylesHeading: 'What are you in the mood for?',
  collectionHeading: 'The beauty shelf',
  optionsLabel: 'Selection',
  navStyles: 'Beauty picks',
  navCollection: 'Collection',
  filterAllLabel: 'Everything',
  categoryLabels: Object.fromEntries(flawlessGlowCategories.map(({ id, name }) => [id, name]))
};
