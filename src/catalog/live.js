import { categories, products } from './products.js';

export async function readCatalog(db) {
  const { results } = await db.prepare('SELECT id, document, revision FROM catalog_edits').all();
  const edits = new Map(results.map(({ id, document, revision }) => [id, { ...JSON.parse(document), revision }]));
  return products.map((product) => edits.get(product.id) ?? { ...product, revision: 0, hidden: false, available: true });
}

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const asset = /^\/(?:images|previews)\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/;
function imageUrl(value) {
  if (typeof value !== 'string' || value.length > 500) return false;
  if (asset.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateProduct(input) {
  const clean = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
  if (!input || !products.some(({ id }) => id === input.id) ||
      !clean(input.name, 100) || !clean(input.description, 450) ||
      !categories.some(({ id }) => id === input.category) ||
      typeof input.hidden !== 'boolean' || typeof input.available !== 'boolean' ||
      !Number.isSafeInteger(input.revision) || input.revision < 0 ||
      !(input.price === null || Number.isSafeInteger(input.price) && input.price >= 0 && input.price <= 100000000) ||
      !Array.isArray(input.variants) || input.variants.length < 1 || input.variants.length > 16) {
    throw new Error('Check the product details and keep between 1 and 16 colours.');
  }
  const ids = new Set();
  const variants = input.variants.map((variant) => {
    if (!variant || !clean(variant.id, 50) || !slug.test(variant.id) || ids.has(variant.id) ||
        !clean(variant.name, 60) || !/^#[a-fA-F0-9]{6}$/.test(variant.swatch) || !imageUrl(variant.image)) {
      throw new Error('Each colour needs a unique ID, a name, a swatch and a valid HTTPS or catalog photo URL.');
    }
    ids.add(variant.id);
    return { id: variant.id, name: variant.name.trim(), swatch: variant.swatch, image: variant.image };
  });
  const { id, category, price, available, hidden } = input;
  return { id, category, price, available, hidden, name: input.name.trim(), description: input.description.trim(), variants };
}
