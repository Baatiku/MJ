// Owner-requested colour palette for full-length maxi dresses. Each new
// variant points to a photograph of that exact design in the named colour.
// Existing stock photographs and seller-chosen default/priority order remain
// untouched, including original colours outside this palette.
export const dressColourEdition = 20261111;

export const dressColours = Object.freeze([
  ['black', 'Black', '#202020'],
  ['beige', 'Beige', '#c8b69d'],
  ['cream', 'Cream', '#efe7d6'],
  ['camel', 'Camel', '#b68a59'],
  ['chocolate-brown', 'Chocolate Brown', '#4b3025'],
  ['mocha', 'Mocha', '#786050'],
  ['navy-blue', 'Navy Blue', '#25344e'],
  ['olive-green', 'Olive Green', '#58603e'],
  ['khaki', 'Khaki', '#979477'],
  ['burgundy', 'Burgundy', '#69283c'],
  ['maroon', 'Maroon', '#682e33'],
  ['emerald-green', 'Emerald Green', '#08764b'],
  ['burnt-orange', 'Burnt Orange', '#bf5a27'],
  ['rust', 'Rust', '#9f4b36'],
  ['dusty-pink', 'Dusty Pink', '#bc8997'],
  ['blush', 'Blush', '#e5bcc1'],
  ['powder-blue', 'Powder Blue', '#b0d0e7'],
  ['icy-blue', 'Icy Blue', '#d3e7ee'],
  ['lavender', 'Lavender', '#ae9aca'],
  ['lilac', 'Lilac', '#c9b5dd']
]);

const aliases = {
  navy: 'navy-blue', midnight: 'navy-blue',
  olive: 'olive-green',
  'dusty-rose': 'dusty-pink'
};

const dressIds = new Set(['gathered-waist-maxi', 'linen-a-line-maxi', 'tiered-gathered-maxi']);

export function expandDressColours(product) {
  if (!dressIds.has(product.id) || product.dressColourEdition === dressColourEdition) return product;
  const originals = product.variants.map((variant) => ({ ...variant }));
  const represented = new Set(originals.map(({ id }) => aliases[id] || id));
  const additions = dressColours.filter(([id]) => !represented.has(id))
    .map(([id, name, swatch]) => ({
      id, name, swatch,
      image: `/images/maknoon-colours/${product.id}-${id}.webp`
    }));
  return {
    ...product,
    // Match original swatches to the new palette without changing their
    // existing image paths or breaking previously shared colour URLs.
    variants: [
      ...originals.map((variant) => {
        const colour = dressColours.find(([id]) => id === (aliases[variant.id] || variant.id));
        return colour ? { ...variant, name: colour[1], swatch: colour[2] } : variant;
      }),
      ...additions
    ],
    dressColourEdition
  };
}
