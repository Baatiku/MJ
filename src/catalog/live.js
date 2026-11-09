import { categories, products } from './products.js';
import { fourthColour } from './fourth-colours.js';

const colourEdition = 1;

export async function readCatalog(db) {
  const { results } = await db.prepare('SELECT id, document, revision FROM catalog_edits').all();
  const edits = new Map(results.map(({ id, document, revision }) => [id, { ...JSON.parse(document), revision }]));
  return products.map((product) => {
    const edited = edits.get(product.id);
    if (!edited) return { ...product, revision: 0, hidden: false, available: true };
    // Photographed stock has its own verified colour set; do not add a
    // synthetic fourth colour when a seller edits its availability or price.
    if (product.stock) return { ...edited, stock: true };
    if (edited.colourEdition === colourEdition || edited.variants.length >= 16) return edited;
    const extra = fourthColour(product.id);
    if (edited.variants.some(({ id, name }) => id === extra.id || name.toLowerCase() === extra.name.toLowerCase())) return edited;
    return { ...edited, variants: [...edited.variants, extra] };
  });
}

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const asset = /^\/(?:images|previews)\/(?:(?:pop-petals|flawless-glow)(?:\/curated)?\/|maknoon-stock\/|brand-covers\/)?[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/;
function imageUrl(value, workspace) {
  if (typeof value !== 'string' || value.length > 500) return false;
  if (asset.test(value) || (workspace && /^\/shop-media\/[a-f0-9-]{36}$/.test(value))) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateProduct(input, { workspace = false } = {}) {
  const clean = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
  if (!input || !(workspace ? typeof input.id === 'string' && input.id.length <= 64 && slug.test(input.id) : products.some(({ id }) => id === input.id)) ||
      !clean(input.name, 100) || !clean(input.description, 450) ||
      !(workspace ? clean(input.category, 50) && slug.test(input.category) : categories.some(({ id }) => id === input.category)) ||
      typeof input.hidden !== 'boolean' || typeof input.available !== 'boolean' ||
      !Number.isSafeInteger(input.revision) || input.revision < 0 ||
      !(input.price === null || Number.isSafeInteger(input.price) && input.price >= 0 && input.price <= 100000000) ||
      !Array.isArray(input.variants) || input.variants.length < 1 || input.variants.length > 16) {
    throw new Error('Check the product details and keep between 1 and 16 colours.');
  }
  const ids = new Set();
  const variants = input.variants.map((variant) => {
    if (!variant || !clean(variant.id, 50) || !slug.test(variant.id) || ids.has(variant.id) ||
        !clean(variant.name, 60) || !/^#[a-fA-F0-9]{6}$/.test(variant.swatch) || !imageUrl(variant.image, workspace)) {
      throw new Error('Each colour needs a unique ID, a name, a swatch and a valid HTTPS or catalog photo URL.');
    }
    ids.add(variant.id);
    const gallery = Array.isArray(variant.gallery) && variant.gallery.length <= 8 && variant.gallery.every((url) => imageUrl(url, workspace)) ? variant.gallery : [];
    return { id: variant.id, name: variant.name.trim(), swatch: variant.swatch, image: variant.image,
      ...(gallery.length ? { gallery } : {}) };
  });
  const { id, category, price, available, hidden } = input;
  const gallery = Array.isArray(input.gallery) && input.gallery.length <= 12 && input.gallery.every((url) => imageUrl(url, workspace))
    ? input.gallery : [];
  return { id, category, price, available, hidden, colourEdition, name: input.name.trim(), description: input.description.trim(), variants, ...(gallery.length ? { gallery } : {}) };
}
