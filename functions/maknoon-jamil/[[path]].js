import { legacyShopGet } from '../_legacy-shop.js';
import { onRequestGet as productGet } from '../products/[[path]].js';

export async function onRequestGet({ request, env, params, next }) {
  const path = params.path || [];
  if (!path.length || path.length === 1 && path[0] === '') return legacyShopGet({ request, env });
  if (path[0] === 'products' && path.length === 3) {
    return productGet({ request, env, params: { path: path.slice(1) }, next });
  }
  return next ? next() : new Response('Not found', { status: 404 });
}
