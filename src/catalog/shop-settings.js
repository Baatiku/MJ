import { whatsappNumber } from '../lib/shop.js';

// Reuse the existing document store. Product slugs cannot use this reserved key.
const settingsId = '@shop-settings';

export function normalizeOrderNumber(value) {
  if (typeof value !== 'string' || value.length > 40) return null;
  const digits = value.trim().replace(/[\s()-]/g, '').replace(/^\+/, '');
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export async function readOrderNumber(db) {
  if (!db) return whatsappNumber;
  const row = await db.prepare('SELECT document FROM catalog_edits WHERE id = ?').bind(settingsId).first();
  return row ? normalizeOrderNumber(JSON.parse(row.document).orderNumber) ?? whatsappNumber : whatsappNumber;
}

export async function saveOrderNumber(db, orderNumber) {
  await db.prepare(`INSERT INTO catalog_edits (id, document, revision) VALUES (?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET document = excluded.document, revision = catalog_edits.revision + 1`)
    .bind(settingsId, JSON.stringify({ orderNumber })).run();
}
