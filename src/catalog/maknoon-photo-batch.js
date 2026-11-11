import { photographedStock } from './stock.js';
import { refineMaknoonDescription } from './maknoon-copy.js';
import { correctMaknoonProduct } from './maknoon-policy.js';
import { expandDressColours } from './dress-colours.js';
import { expandAbayaColours } from './abaya-colours.js';
import { expandGarmentColours } from './garment-colours.js';

// Uploaded 9 November 2026. Each distinct garment cut is one product; photographs
// that differ only by colour or camera distance are variants and detail galleries.
const photo = (name) => `/images/mj-${name}.jpg`;
const option = (id, name, swatch, image, gallery = []) => ({
  id, name, swatch, image: photo(image), ...(gallery.length ? { gallery: gallery.map(photo) } : {})
});

export const maknoonPhotoBatch = [
  {
    id: 'full-drape-jilbab', name: 'Full-Drape Jilbab', category: 'jilbab',
    description: 'A full-length, softly draped prayer jilbab with an integrated head covering.',
    price: null,
    variants: [option('powder-blue', 'Powder Blue', '#c8d0ed', 'full-drape-jilbab-powder-blue')]
  },
  {
    id: 'tiered-niqab-khimar', name: 'Tiered Niqab Khimar', category: 'niqab',
    description: 'Layered shoulder drapes and a long face veil, shown with a contrasting abaya.',
    price: null,
    variants: [
      option('petrol-blue-black', 'Petrol Blue & Black', '#18577c', 'tiered-niqab-petrol-blue-black', ['tiered-niqab-petrol-blue-detail']),
      option('silver-grey-black', 'Silver Grey & Black', '#b9b5bd', 'tiered-niqab-silver-grey-black'),
      option('dusty-mauve-plum', 'Dusty Mauve & Deep Plum', '#b87892', 'tiered-niqab-dusty-mauve-plum', ['tiered-niqab-dusty-mauve-detail'])
    ]
  },
  {
    id: 'gathered-maxi-abaya', name: 'Gathered Maxi Abaya', category: 'abaya',
    description: 'A flowing, gathered-front maxi dress with relaxed sleeves and a round neckline.',
    price: null,
    variants: [option('deep-plum', 'Deep Plum', '#6c1742', 'gathered-maxi-deep-plum', ['gathered-maxi-deep-plum-detail'])]
  },
  {
    id: 'two-tone-long-khimar', name: 'Two-Tone Long Khimar', category: 'khimar',
    description: 'A long plum khimar worn over a dusty mauve maxi dress.',
    price: null,
    variants: [option('plum-mauve', 'Deep Plum & Dusty Mauve', '#6d2244', 'two-tone-khimar-plum-mauve')]
  }
].map(refineMaknoonDescription);

// Both uploaded batches lead the Maknoon collection, before the historical
// concept styles. Existing D1 records are retained verbatim, including their
// owner-edited prices, visibility, image choices and colour selections.
export function withMaknoonPhotoBatch(catalog = []) {
  const uploaded = [...photographedStock, ...maknoonPhotoBatch.map((item) => ({ ...item, stock: true }))];
  const existing = new Map(catalog.map((item) => [item.id, item]));
  const uploadedIds = new Set(uploaded.map(({ id }) => id));
  const stocked = uploaded.map((item, i) => existing.get(item.id) || {
    ...item, revision: 0, hidden: false, available: true, position: i
  });
  return [...stocked, ...catalog.filter(({ id }) => !uploadedIds.has(id))]
    .map(refineMaknoonDescription).map(correctMaknoonProduct).filter(Boolean).map(expandDressColours).map(expandAbayaColours).map(expandGarmentColours);
}
