import { findShop, shopCatalog, shopAppearance } from './api/shop-catalog.js';

import { originalSlug, originalMarker } from './_original-id.js';

export async function originalShop(db) {
  if (!db) return null;
  const marker = await db.prepare('SELECT id FROM catalog_edits WHERE id = ?').bind(originalMarker).first();
  return marker ? findShop(db, originalSlug, null, true) : null;
}

export async function originalView(db) {
  const shop = await originalShop(db);
  if (!shop) return null;
  const [products, appearance] = await Promise.all([shopCatalog(db, shop.id), shopAppearance(db, shop.id)]);
  return {
    ...shop, products,
    brand: { cover: '/previews/maknoon-jamil-square.jpg', ...appearance, name: shop.name, description: shop.description, home: '/', admin: '/manage/maknoon-jamil/', original: true }
  };
}
