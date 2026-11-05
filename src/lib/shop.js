export const whatsappNumber = '2348022519062';

export function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0
  }).format(amount);
}

export function whatsappLink(message) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function orderLink(product, variant) {
  const selection = `${product.name} in ${variant.name}`;
  if (product.concept) {
    return whatsappLink(`Hello Maknoon Jamil! Is the ${selection} style available to order? Please share the price and details.`);
  }
  if (product.price === null) {
    return whatsappLink(`Hello Maknoon Jamil! I’m interested in ${selection}. Please confirm availability, price and what is included.`);
  }
  return whatsappLink(`Hello Maknoon Jamil! I’d like to order ${selection} (${formatNaira(product.price)}). Is it available?`);
}

export const contactLink = whatsappLink('Hello Maknoon Jamil! I’d like to ask about your modestwear collection.');
