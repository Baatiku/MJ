import { dressColours } from './dress-colours.js';

// Complete image-backed palettes are enabled product by product. Never expose
// a swatch until its colour-correct garment photo and share preview are built.
export const abayaColourEdition = 20261111;
export const twentyColourAbayas = new Set([
  'satin-waterfall-abaya',
  'covered-button-abaya',
  'flow-abaya',
  'burgundy-satin-drape',
  'draped-collar-abaya',
  'gathered-maxi-abaya',
  'everyday-abaya',
  'pleated-abaya',
  'butterfly-abaya',
  'cape-sleeve-abaya'
]);

const aliases = { navy: 'navy-blue', midnight: 'navy-blue', olive: 'olive-green', emerald: 'emerald-green' };

export function expandAbayaColours(product) {
  if (!twentyColourAbayas.has(product.id) || product.abayaColourEdition === abayaColourEdition) return product;
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
    abayaColourEdition
  };
}
