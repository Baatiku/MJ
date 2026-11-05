// Each colour has its own studio image, rather than a filter applied to another photo.
const colours = {
  'flow-abaya': ['plum', 'Deep Plum', '#513143'],
  'rose-khimar': ['sage', 'Soft Sage', '#77836b'],
  'blue-veil': ['charcoal', 'Charcoal', '#424447'],
  'everyday-abaya': ['terracotta', 'Terracotta', '#9b5947'],
  'pleated-abaya': ['lilac', 'Dusty Lilac', '#9b85a0'],
  'butterfly-abaya': ['emerald', 'Emerald', '#155e46'],
  'cascade-khimar': ['smoky-blue', 'Smoky Blue', '#566d85'],
  'rounded-khimar': ['dusty-rose', 'Dusty Rose', '#a97078'],
  'short-veil': ['espresso', 'Espresso', '#49342d'],
  'jilbab-veil': ['olive', 'Muted Olive', '#62634a'],
  'belted-shirt-maxi': ['denim-blue', 'Denim Blue', '#526f87'],
  'pleated-high-neck-maxi': ['wine', 'Wine Red', '#712f42'],
  'linen-a-line-maxi': ['oatmeal', 'Natural Oatmeal', '#c4ae90'],
  'tiered-gathered-maxi': ['dusty-coral', 'Dusty Coral', '#ad6c64'],
  'longline-knit-maxi': ['cocoa', 'Cocoa', '#795542'],
  'open-kimono-abaya': ['teal', 'Deep Teal', '#20585c'],
  'wide-leg-tunic-set': ['rust', 'Warm Rust', '#9b5638'],
  'cape-sleeve-abaya': ['blackberry', 'Blackberry', '#4d354c'],
  'hooded-jilbab': ['stone-grey', 'Stone Grey', '#88847e'],
  'waistcoat-maxi-set': ['chocolate', 'Chocolate', '#52392e'],
  'chiffon-wrap': ['lilac', 'Pale Dusty Lilac', '#b7a1ba'],
  'satin-square': ['champagne', 'Champagne Gold', '#c5ad83'],
  'ribbed-instant': ['slate-blue', 'Slate Blue', '#586c83'],
  'tie-back-undercap': ['ivory', 'Warm Ivory', '#eee4d0'],
  'pull-on-prayer-hijab': ['rose', 'Muted Rose', '#a4757d']
};

export function fourthColour(productId) {
  const [id, name, swatch] = colours[productId];
  return { id, name, swatch, image: `/images/${productId}-${id}.jpg` };
}
