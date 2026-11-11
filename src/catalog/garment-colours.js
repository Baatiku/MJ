import { dressColours } from './dress-colours.js';

// Activate a style only after every new colour has its own garment-specific
// product photograph and JPEG share preview in public/maknoon-colours.
export const garmentColourEdition = 20261111;
export const twentyColourGarments = new Set([
  'full-coverage-satin-khimar',
  'full-coverage-jilbab',
  'full-drape-jilbab',
  'jilbab-veil'
]);

const aliases = {
  navy: 'navy-blue', midnight: 'navy-blue',
  olive: 'olive-green', emerald: 'emerald-green',
  'dusty-rose': 'dusty-pink'
};

export function expandGarmentColours(product) {
  if (!twentyColourGarments.has(product.id) || product.garmentColourEdition === garmentColourEdition) return product;
  const originals = product.variants.map((variant) => ({ ...variant }));
  const represented = new Set(originals.map(({ id }) => aliases[id] || id));
  return {
    ...product,
    variants: [
      ...originals.map((variant) => {
        const colour = dressColours.find(([id]) => id === (aliases[variant.id] || variant.id));
        return colour ? { ...variant, name: colour[1], swatch: colour[2] } : variant;
      }),
      ...dressColours.filter(([id]) => !represented.has(id))
        .map(([id, name, swatch]) => ({
          id, name, swatch,
          image: `/images/maknoon-colours/${product.id}-${id}.webp`
        }))
    ],
    garmentColourEdition
  };
}
