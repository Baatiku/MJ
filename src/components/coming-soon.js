import { storefront } from './storefront.js';
import { flawlessGlowBrand, flawlessGlowProducts } from '../catalog/flawless-glow.js';
import { whatsappNumber } from '../lib/shop.js';

// Keep the curated skincare collection on the same product-card and WhatsApp flow.
export function flawlessGlowPage(origin) {
  return storefront(origin, flawlessGlowProducts, flawlessGlowBrand.home, whatsappNumber, flawlessGlowBrand);
}
