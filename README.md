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

The catalog uses studio renderings. The only confirmed price is ₦25,000 for the Flow Abaya. Confirm availability, price, and details over WhatsApp.

Every colour has a static product page with a JPEG link preview. The WhatsApp order message includes that page’s URL. The static build uses `https://mj.masanawa.com` for public share links and preview images. Set the optional `SITE_URL` build variable to override that origin for a different storefront domain. WhatsApp controls whether its app displays a thumbnail.

## Enable the owner dashboard

1. In Cloudflare, create a D1 database for the shop.
2. Open the database console and run the statements from `migrations/0001_catalog.sql`.
3. In the Pages project's **Settings → Bindings**, bind that database as `CATALOG_DB`. Use a separate database for preview deployments if you enable admin there.
4. In **Settings → Variables and Secrets**, add `ADMIN_PASSWORD` as an encrypted secret. Use a private password independent of the public WhatsApp number.
5. Redeploy and open `/admin/`. The static catalog works before the database is connected, but owner sign-in requires both bindings.

The editor updates names, descriptions, categories, prices, availability, visibility, and per-colour names, swatches and photo URLs. Use a catalog image path or public HTTPS URL for a matching photo. Swatch changes do not recolour photos. Hidden products disappear from the storefront and their product URLs return 404. Product image assets are public, including images previously shared in chat. An unavailable item stays listed with ordering disabled.

Catalog changes are stored in D1 and loaded on each storefront request. They take effect without a redeploy. The built-in catalog and images remain the default when no owner edits exist.

## Change the public WhatsApp number

Edit `config/shop.json` from the **Shop settings** section of `/admin/`. Use international digits only. Commit to the deployed branch to update the number for all visitors, including product orders and the footer.

## WhatsApp assistant pilot

The owner dashboard uses the ChatWithStars runtime API for linking, pausing, guidance and delegated text or voice replies. The storefront continues serving its catalog independently. Provision a dedicated pilot tenant and runtime deployment from the ChatWithStars integration branch; keep automatic replies paused until a test account is verified. Do not reuse a broad token from an unrelated production runtime.

Configure these server-side variables on the deployment serving `/api/whatsapp`:

| Variable | Value |
| --- | --- |
| `WA_RUNTIME_ORIGIN` | HTTPS origin of the dedicated runtime |
| `WA_RUNTIME_TOKEN` | Runtime control token, as an encrypted secret |
| `WA_TENANT_ID` | UUID of the store's runtime tenant |
| `WA_EXACT_DELEGATION` | Set to `1` only after deploying the exact-recipient runtime patch |

The existing `CATALOG_DB` and `ADMIN_PASSWORD` admin session are required. The browser never receives the runtime token. The bridge accepts no caller-supplied tenant ID. Delegation currently requires the recipient's exact phone-based WhatsApp JID to exist in the runtime contacts. If delivery is uncertain, check the conversation before repeating the send.

Role presets save owner instructions. The upstream automatic router still controls actual specialist selection. This pilot bridge does not provision or expose calls, groups, Channels, a tenant-scoped token broker, or catalog-aware agent tools.

### Cloudflare Worker deployment

The static storefront can run on Pages. If the production site uses **Workers Builds**, use the committed `wrangler.worker.jsonc` with build command `npm run build` and deploy command `npx wrangler deploy --config wrangler.worker.jsonc`. Set the Wrangler Worker name to the existing production Worker name before applying the configuration to an existing deployment. Its asset routing explicitly invokes the Worker for `/api/*`, so a missing binding returns an actionable JSON error rather than a static 404.

Bind the existing D1 catalog database as `CATALOG_DB` and keep the admin password and runtime token in Cloudflare secrets. Deploy the linked ChatWithStars PR before enabling delegation. The contact picker reads only the linked account's unmerged direct WhatsApp contacts. Manual entry still requires a matching contact. Verify a real text message, voice note, reconnect, inbound call and outbound call before enabling production automation.
