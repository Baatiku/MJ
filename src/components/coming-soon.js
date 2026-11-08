import { storefront } from './storefront.js';
import { flawlessGlowBrand } from '../catalog/flawless-glow.js';

// Use the same catalog renderer without inventing products before photos arrive.
export function flawlessGlowPage(origin) {
  return storefront(origin, [], flawlessGlowBrand.home, '', flawlessGlowBrand);
}
