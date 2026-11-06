import { workspaceOwner } from '../api/workspaces.js';
import { adminSessionHash } from '../api/admin.js';
import { findShop, shopCatalog, shopAppearance } from '../api/shop-catalog.js';
import { storefront } from '../../src/components/storefront.js';
import { variantPage } from '../../src/components/variant-page.js';
import { page } from '../_catalog.js';

const notFound = () => page('<!doctype html><title>Shop not found</title><h1>Shop not found</h1>', 404);

export async function onRequestGet({ request, env, params }) {
  const [slug, section, productId, colourId] = params.path || [];
  const variantRoute = params.path?.length === 4 && section === 'products';
  if (!variantRoute && params.path?.length !== 1) return notFound();
  try {
    const url = new URL(request.url);
    const db = env.CATALOG_DB;
    const preview = url.searchParams.get('preview') === '1';
    const [owner, operator] = preview ? await Promise.all([workspaceOwner(request, db), adminSessionHash(request, env)]) : [];
    if (preview && !owner && !operator) return notFound();
    const shop = await findShop(db, slug, owner, Boolean(operator));
    if (!shop) return notFound();
    const [catalog, appearance] = await Promise.all([shopCatalog(db, shop.id), shopAppearance(db, shop.id)]);
    const home = `/shops/${shop.slug}/`;
    const brand = { ...appearance, name: shop.name, description: shop.description, home, preview, admin: `/manage/${shop.slug}/` };
    const products = catalog.filter((product) => !product.hidden);
    if (!variantRoute) return page(storefront(preview ? null : url.origin, products, home, (preview ? '' : shop.whatsapp), brand));
    const product = products.find(({ id }) => id === productId);
    const variant = product?.variants.find(({ id }) => id === colourId);
    return variant ? page(variantPage(product, variant, preview ? null : url.origin, (preview ? '' : shop.whatsapp), brand)) : notFound();
  } catch {
    return page('<!doctype html><title>Shop unavailable</title><h1>Shop temporarily unavailable</h1>', 503);
  }
}
