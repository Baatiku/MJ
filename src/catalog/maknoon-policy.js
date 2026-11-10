// Owner's catalogue corrections of 10 November 2026. These also migrate
// older D1 product documents on read, without changing unrelated shop data.
// A product saved from the admin after this release retains the owner's new
// pricing, thanks to the policy edition stored in its document.
export const maknoonPolicyEdition = 20261110;

export const retiredMaknoonIds = new Set([
  'belted-shirt-maxi', 'pleated-high-neck-maxi', 'longline-knit-maxi',
  'wide-leg-tunic-set', 'hooded-jilbab', 'waistcoat-maxi-set', 'satin-square'
]);

const correctedNames = {
  'satin-waterfall-abaya': 'Waterfall Abaya',
  'burgundy-satin-drape': 'Burgundy Waterfall Abaya',
  'full-coverage-satin-khimar': 'Mocha Khimar',
  'covered-button-abaya': 'Cape Abaya',
  'chiffon-wrap': 'Chiffon Wrap Veil'
};

const correctedCategories = {
  'burgundy-satin-drape': 'abaya',
  'cape-sleeve-abaya': 'abaya',
  'full-coverage-jilbab': 'jilbab',
  'full-drape-jilbab': 'jilbab',
  'jilbab-veil': 'jilbab'
};

const accurateDescriptions = {
  'satin-waterfall-abaya': 'Quiet elegance for celebrations, graceful evenings and everything worth dressing up for.',
  'burgundy-satin-drape': 'Rich, romantic sophistication for evenings that call for a confident statement.',
  'full-coverage-satin-khimar': 'An elegant finishing touch when your modest look deserves a little extra polish.',
  'covered-button-abaya': 'A beautifully fluid, buttonless cape cut for an effortless, refined finish.'
};

const exactPrices = {
  'satin-waterfall-abaya': 40000,
  'burgundy-satin-drape': 40000,
  'cape-sleeve-abaya': 30000,
  'flow-abaya': 25000,
  'everyday-abaya': 25000,
  'pleated-abaya': 25000
};

const capeImages = new Map(['navy', 'black', 'brown'].map((colour) => [
  colour, `/images/maknoon-stock/cape-abaya-${colour}-buttonless.webp`
]));

function correctPrice(product) {
  if (Object.hasOwn(exactPrices, product.id)) return exactPrices[product.id];
  // The jilbab rule takes precedence over the older 'khimar' category used
  // for the Full-Coverage Jilbab.
  if (/jilbab/i.test(product.name)) return 15000;
  if (/khimar/i.test(product.name) || product.category === 'khimar') return 30000;
  if (/umbrella.*hijab|hijab.*umbrella/i.test(product.name)) return 15000;
  return product.price;
}

export function correctMaknoonProduct(product) {
  if (retiredMaknoonIds.has(product.id)) return null;
  if (product.maknoonPolicyEdition === maknoonPolicyEdition) return product;
  const variants = product.id === 'covered-button-abaya' ? product.variants.map((variant) => ({
    ...variant, image: capeImages.get(variant.id) || variant.image
  })) : product.variants;
  const gallery = product.id === 'covered-button-abaya'
    ? ['/images/maknoon-stock/cape-abaya-three-colours-buttonless.webp']
    : product.gallery;
  return {
    ...product,
    name: correctedNames[product.id] || product.name,
    category: correctedCategories[product.id] || product.category,
    description: /satin|covered.buttons|button.front/i.test(product.description) && accurateDescriptions[product.id]
      ? accurateDescriptions[product.id] : product.description,
    price: correctPrice(product),
    variants,
    ...(gallery ? { gallery } : {}),
    maknoonPolicyEdition
  };
}
