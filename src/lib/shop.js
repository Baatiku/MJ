import { whatsappNumber as configuredNumber } from './shop-number.js';

export const whatsappNumber = configuredNumber;

if (!/^[1-9]\d{7,14}$/.test(whatsappNumber)) {
  throw new Error('Configure the WhatsApp number in international format in config/shop.json.');
}

export function displayWhatsAppNumber(number = whatsappNumber) {
  const nigeria = number.match(/^234(\d{3})(\d{3})(\d{4})$/);
  return nigeria ? `+234 ${nigeria.slice(1).join(' ')}` : `+${number}`;
}

export function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0
  }).format(amount);
}

export function whatsappLink(message, number = whatsappNumber) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
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

export const freeStoreLink = whatsappLink('Hello! I’d like to set up a free online store for my business, like Maknoon Jamil. How do I get started?', '2348161564273');
