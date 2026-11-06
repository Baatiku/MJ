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

In `/admin/`, open **Shop settings**, enter the customer order WhatsApp number with its country code, and save. The storefront uses the saved number for product orders and contact links. The assistant keeps its separately linked account.

## WhatsApp assistant pilot

The owner dashboard uses the ChatWithStars runtime API for linking, pausing, guidance and delegated text or voice replies. The storefront continues serving its catalog independently. Provision a dedicated pilot tenant and runtime deployment from the ChatWithStars integration branch; keep automatic replies paused until a test account is verified. Do not reuse a broad token from an unrelated production runtime.

Configure these server-side variables on the deployment serving `/api/whatsapp`:

| Variable | Value |
| --- | --- |
| `WA_RUNTIME_ORIGIN` | HTTPS origin of the dedicated runtime |
| `WA_RUNTIME_TOKEN` | Runtime control token, as an encrypted secret |
| `WA_TENANT_ID` | UUID of the store's runtime tenant |
| `WA_EXACT_DELEGATION` | Set to `1` only after deploying the exact-recipient runtime patch |

The existing `CATALOG_DB` and `ADMIN_PASSWORD` admin session are required. The browser never receives the runtime token. Only the platform operator can bind a dedicated runtime tenant to a shop. Delegation currently requires the recipient's exact phone-based WhatsApp JID to exist in the runtime contacts. If delivery is uncertain, check the conversation before repeating the send.

Role presets save owner instructions. The upstream automatic router still controls actual specialist selection. This pilot bridge does not provision or expose calls, groups, Channels, a tenant-scoped token broker, or catalog-aware agent tools.

### Cloudflare Worker deployment

The static storefront can run on Pages. If the production site uses **Workers Builds**, use the committed `wrangler.worker.jsonc` with build command `npm run build` and deploy command `node scripts/deploy-admin.mjs`. In **Build settings → Build variables**, set `MJ_WORKER_NAME` to the existing production Worker name and `MJ_CATALOG_DATABASE_ID` to the ID of the existing D1 catalog. The deploy script includes that exact database as `CATALOG_DB` on every release. The build variables apply to the whole platform. Its asset routing explicitly invokes the Worker for `/api/*`, so a missing binding returns an actionable JSON error rather than a static 404.

Bind the existing D1 catalog database as `CATALOG_DB` and keep the admin password and runtime token in Cloudflare secrets. Deploy the linked ChatWithStars PR before enabling delegation. The contact picker reads only the linked account's unmerged direct WhatsApp contacts. Manual entry still requires a matching contact. Verify a real text message, voice note, reconnect, inbound call and outbound call before enabling production automation.

## Shared shop workspaces on Cloudflare D1

Apply `0001_catalog.sql`, `0002_workspaces.sql` and `0003_shop_catalogs.sql` in order. For an existing deployment with the first two migrations, run only `0003_shop_catalogs.sql` on the existing `CATALOG_DB`. Keep the deployment's existing `SHOP_PASSWORD_PEPPER` and `ADMIN_PASSWORD`. The pepper is shared by all owner accounts and must stay stable.

| URL | Who uses it |
| --- | --- |
| `/platform-admin/` | Operator creates 24-hour owner invites, lists shops, migrates the original catalog and assigns dedicated WhatsApp runtime tenants |
| `/manage/` | Owners accept invites, sign in, create shops, choose a shop and change their password |
| `/manage/<slug>/` | Owner edits products, colours, prices, shop settings and WhatsApp assistant settings |
| `/shops/<slug>/` | Public storefront once published |

Client onboarding uses the existing Worker and shared D1. It requires no per-client GitHub access or Cloudflare secret. New storefronts start private with an empty catalog and use the same renderer, layout and colour selector as Maknoon Jamil. Upload matching photos from the device or use HTTPS image links. To share a storefront, publish it first. A dedicated cover, or the first visible product photo as fallback, becomes the social preview. Native Status sharing depends on whether the browser and WhatsApp expose the relevant share target.

To move the original shop to owner access, create an invite for its owner, have them accept it, then use **Move Maknoon Jamil** in platform admin. The move copies the current catalog, visibility, availability, prices, colour images and order number into the owner workspace. The root domain and existing `/products/...` and catalog URLs then read that workspace. The owner signs in at `/manage/` and edits it at `/manage/maknoon-jamil/`. The pre-move data remains in the legacy table. Avoid editing the old dashboard during the move.

### WhatsApp assistant for a client shop

Create a dedicated tenant in the configured ChatWithStars runtime, then assign its UUID to exactly one shop in platform admin. Maknoon Jamil keeps the existing `WA_TENANT_ID`. Each linked owner can use QR or pairing code, set role guidance, and browse contacts for delegation. The proxy derives the tenant from the owner's authorized shop and keeps the shared runtime credentials on the server.

The runtime must be deployed and have a real account paired to confirm QR login, reconnect, replies and text or voice delivery. Calls, groups and Channels are outside the current bridge. The presets send role guidance while the upstream router still selects the actual specialist.
