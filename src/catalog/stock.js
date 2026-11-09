// Owner-supplied, photographed stock. These records are deliberately grouped by
// garment construction, with colour-specific images under a single product.
// Never infer price, size or included accessories from an editorial photograph.
const stockProduct = (id, name, category, description, options, gallery = []) => ({
  id,
  name,
  category,
  description,
  price: null,
  stock: true,
  variants: options.map(([colour, name, swatch]) => ({
    id: colour,
    name,
    swatch,
    image: `/images/maknoon-stock/${id}-${colour}.webp`
  })),
  ...(gallery.length ? { gallery: gallery.map((photo) => `/images/maknoon-stock/${photo}.webp`) } : {})
});

// Order follows the owner-supplied stock batches, not a generic alphabetic sort.
export const photographedStock = [
  stockProduct('satin-waterfall-abaya', 'Satin Waterfall Abaya', 'abaya',
    'A flowing round-neck abaya with a layered open-front waterfall drape in softly lustrous satin.', [
      ['navy', 'Midnight Navy', '#142343'],
      ['champagne', 'Soft Champagne', '#d9c9b0'],
      ['ivory', 'Pale Ivory', '#e5e5d9'],
      ['taupe', 'Mushroom Taupe', '#847366'],
      ['seafoam', 'Muted Seafoam', '#7b9c98'],
      ['silver', 'Pearl Silver', '#bcc0c1'],
      ['blush', 'Soft Blush', '#dec0c6']
    ], ['satin-waterfall-worn', 'satin-waterfall-seven-colours']),

  stockProduct('full-coverage-satin-khimar', 'Mocha Satin Khimar', 'khimar',
    'A long, generous khimar with a smooth satin finish and graceful drape.', [
      ['mocha', 'Chocolate Mocha', '#59454a']
    ]),

  stockProduct('burgundy-satin-drape', 'Burgundy Satin Draped Look', 'layer',
    'An elegant draped satin look. The reference shows a fabric and layering detail; ask for the full-length view and included pieces.', [
      ['burgundy', 'Deep Burgundy', '#772d4b']
    ]),

  stockProduct('covered-button-abaya', 'Covered-Button Cape Abaya', 'abaya',
    'A sweeping, wide-sleeve abaya with a round neckline and a line of small covered buttons down the front.', [
      ['navy', 'Navy Blue', '#253475'],
      ['black', 'Jet Black', '#242326'],
      ['brown', 'Warm Camel Brown', '#936b45']
    ], ['covered-button-abaya-three-colours']),

  stockProduct('draped-collar-abaya', 'Draped-Collar Abaya', 'abaya',
    'A softly draped neckline with slender hanging front ties. Only upper-garment views are available, so confirm the complete cut before ordering.', [
      ['rust', 'Rust Terracotta', '#a7534d'],
      ['black', 'Jet Black', '#252628'],
      ['navy', 'Deep Navy Blue', '#273c72'],
      ['purple', 'Rich Violet Purple', '#782a9a']
    ], ['draped-collar-abaya-four-colours']),

  stockProduct('full-coverage-jilbab', 'Full-Coverage Jilbab', 'khimar',
    'A full-length modest covering with an integrated khimar-style drape and generous sleeves. The black look is styled with a face veil; confirm included pieces.', [
      ['purple', 'Deep Purple', '#422057'],
      ['sage', 'Sage Green', '#899083'],
      ['black', 'Jet Black', '#191b1d'],
      ['mauve', 'Dusty Mauve', '#966779'],
      ['ivory', 'Soft Ivory', '#e8e5dc']
    ]),

  stockProduct('gathered-waist-maxi', 'Gathered-Waist Maxi Dress', 'dress',
    'A relaxed maxi with a raised gathered waistline, long full sleeves and gathered cuffs.', [
      ['teal', 'Teal Blue', '#116690']
    ])
];
