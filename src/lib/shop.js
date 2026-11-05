export const whatsappNumber = '2348022519062';

export function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0
  }).format(amount);
}

export function whatsappLink(message) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function variantPath(product, variant) {
  return `/products/${product.id}/${variant.id}/`;
}

export function previewImage(variant) {
  return variant.image.startsWith('/images/') && variant.image.endsWith('.webp')
    ? variant.image.replace('/images/', '/previews/').replace(/\.webp$/, '.jpg')
    : variant.image;
}

export function orderLink(product, variant, origin) {
  const selection = `${product.name} in ${variant.name}`;
  const price = product.price === null ? '' : ` (${formatNaira(product.price)})`;
  const question = product.price === null
    ? 'Please confirm the price and availability.'
    : 'Is it available?';
  const message = `Hello Maknoon Jamil! I’d like to order ${selection}${price}. ${question}`;
  const link = origin ? `\n\n${new URL(variantPath(product, variant), origin).href}` : '';
  return whatsappLink(message + link);
}

export const contactLink = whatsappLink('Hello Maknoon Jamil! I’d like to ask about your modestwear collection.');
