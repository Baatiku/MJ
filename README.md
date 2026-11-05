# Maknoon Jamil

Static, progressively enhanced modestwear storefront. The catalog and first colour of every style render at build time. Native radio swatches update each product photograph and its prefilled WhatsApp message.

## Local development

Requires Node.js 22 or later. There are no package dependencies.

```sh
npm test
npm run build
npm run preview
```

## Deploy with Cloudflare Pages

In Cloudflare, create a **Pages** project using **Connect to Git**, authorize GitHub access to **Baatiku/MJ**, then select the repo. Use these build settings.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |
| Environment variables | None required |

Cloudflare builds and publishes `dist/`. Subsequent pushes to the connected production branch trigger deploys. The shop uses direct WhatsApp links and needs no credentials.

## Project structure

- `src/catalog/products.js` holds styles, categories, prices and variant metadata.
- `src/components/` contains build-time page and card templates.
- `src/lib/shop.js` owns WhatsApp order messages and naira formatting.
- `src/storefront.js` manages colour selection and category filters.
- `src/styles/theme.css` contains typography and colour tokens. `storefront.css` holds component and layout styles.
- `public/images/` contains separate generated WebP catalog photographs.
- `scripts/build.mjs` validates image paths and generates the static deployment.

The seven new silhouettes are labelled style concepts until availability is confirmed. The existing photo references informed three original designs. The only confirmed price is ₦25,000 for the Flow Abaya. The catalog images are generated visual references. Confirm availability, exact shade, and details over WhatsApp.
