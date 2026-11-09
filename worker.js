import { serveMedia } from './functions/api/_shop-media.js';
import { onRequest as shopCatalog } from './functions/api/shop-catalog.js';
import { onRequest as workspaces } from './functions/api/workspaces.js';
import { onRequestGet as publicShop } from './functions/shops/[[path]].js';
import { onRequest as admin } from './functions/api/admin.js';
import { onRequest as whatsapp } from './functions/api/whatsapp.js';
import { onRequestGet as portfolio } from './functions/index.js';
import { onRequestGet as sitemap } from './functions/sitemap.js';
import { legacyShopGet } from './functions/_legacy-shop.js';
import { onRequestGet as maknoon } from './functions/maknoon-jamil/[[path]].js';
import { onRequestGet as petals } from './functions/pop-and-petals/[[path]].js';
import { onRequestGet as glow } from './functions/flawless-glow-co/[[path]].js';
import { onRequestGet as product } from './functions/products/[[path]].js';

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    const next = () => env.ASSETS.fetch(request);
    if (pathname === '/api/shop-catalog') return shopCatalog({ request, env });
    if (pathname === '/api/workspaces') return workspaces({ request, env });
    if (pathname === '/api/admin') return admin({ request, env });
    if (pathname === '/api/whatsapp') return whatsapp({ request, env });
    if (request.method === 'GET') {
      if (pathname.startsWith('/shop-media/')) return serveMedia(request, env);
      if (['/platform-admin', '/platform-admin/'].includes(pathname)) {
        return env.ASSETS.fetch(new Request(new URL('/manage/', request.url), request));
      }
      if (pathname.startsWith('/shops/')) {
        return publicShop({ request, env, params: { path: pathname.slice('/shops/'.length).replace(/\/$/, '').split('/') } });
      }
      if (/^\/manage\/[a-z0-9-]+\/?$/.test(pathname)) {
        return env.ASSETS.fetch(new Request(new URL('/admin/', request.url), request));
      }
      if (['/', '/index.html'].includes(pathname)) return portfolio({ request, env });
      if (pathname === '/sitemap.xml') return sitemap({ request, env });
      if (['/catalog', '/catalog/'].includes(pathname) && env.CATALOG_DB) return legacyShopGet({ request, env });
      if (['/maknoon-jamil', '/maknoon-jamil/'].includes(pathname) || pathname.startsWith('/maknoon-jamil/products/')) {
        const path = pathname.replace(/^\/maknoon-jamil\/?/, '').replace(/\/$/, '').split('/').filter(Boolean);
        return maknoon({ request, env, params: { path }, next });
      }
      if (['pop-and-petals', 'flawless-glow-co'].some((slug) => pathname === `/${slug}` || pathname === `/${slug}/` || pathname.startsWith(`/${slug}/products/`))) {
        const slug = pathname.split('/')[1];
        const path = pathname.slice(slug.length + 2).replace(/\/$/, '').split('/').filter(Boolean);
        return (slug === 'pop-and-petals' ? petals : glow)({ request, env, params: { path }, next });
      }
      if (pathname.startsWith('/products/')) {
        const path = pathname.slice('/products/'.length).replace(/\/$/, '').split('/');
        return product({ request, env, params: { path }, next });
      }
    }
    return next();
  }
};
