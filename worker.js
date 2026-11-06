import { onRequest as workspaces } from './functions/api/workspaces.js';
import { onRequestGet as publicShop } from './functions/shops/[slug].js';
import { onRequest as admin } from './functions/api/admin.js';
import { onRequest as whatsapp } from './functions/api/whatsapp.js';
import { onRequestGet as storefront } from './functions/index.js';
import { onRequestGet as product } from './functions/products/[[path]].js';

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    const next = () => env.ASSETS.fetch(request);
    if (pathname === '/api/workspaces') return workspaces({ request, env });
    if (pathname === '/api/admin') return admin({ request, env });
    if (pathname === '/api/whatsapp') return whatsapp({ request, env });
    if (request.method === 'GET') {
      const shop = pathname.match(/^\/shops\/([a-z0-9-]+)\/?$/);
      if (shop) return publicShop({ request, env, params: { slug: shop[1] } });
      if (['/', '/index.html', '/catalog', '/catalog/'].includes(pathname) && env.CATALOG_DB) {
        return storefront({ request, env, next });
      }
      if (pathname.startsWith('/products/')) {
        const path = pathname.slice('/products/'.length).replace(/\/$/, '').split('/');
        return product({ request, env, params: { path }, next });
      }
    }
    return next();
  }
};
