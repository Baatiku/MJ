import { formatNaira, previewImage, variantPath } from './shop.js';

export function shareDetails(product, variant, { home = '/maknoon-jamil/', name = 'Maknoon Jamil', origin = globalThis.location?.origin || 'https://shop.masanawa.com' } = {}) {
  const title = variant.id === 'pictured' ? product.name : `${product.name} in ${variant.name}`;
  const url = new URL(variantPath(product, variant, home), origin).href;
  const price = product.price === null ? '' : `\n${formatNaira(product.price)}`;
  const availability = product.available === false ? '\nCurrently unavailable.' : '';
  return {
    title,
    text: `${title}\n${name}\n${url}${price}${availability}\n${product.description}`,
    url,
    image: new URL(previewImage(variant), origin).href,
    filename: product.id + '-' + variant.id
  };
}
