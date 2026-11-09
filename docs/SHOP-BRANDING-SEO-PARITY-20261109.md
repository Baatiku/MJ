# Shop — shared identity, search and WhatsApp parity register

Date: 9 November 2026 · Public domain: `https://mj.masanawa.com`

Scope: the shared `shop.` platform and its three owner-managed brands: Maknoon Jamil, Pop & Petals, Flawless Glow Co. The registered business name and physical address have **not** been supplied, so neither was invented. The contact details below came from the owner.

## Unified identity and contact

- [x] Preserve a single simple umbrella name: `shop.`; keep each business's name and catalogue independent.
- [x] Design a custom three-petal SVG logo: navy (fashion), blush (treats), gold (beauty), with a cream background.
- [x] Provide square emblem, horizontal lockup and monochrome Safari pinned-tab asset.
- [x] Replace the generic star in the global header with the actual logo; repeat it in the global footer.
- [x] Add the emblem and favicon to owner, setup and administrative pages.
- [x] Generate `.ico`, SVG favicon, 16/32/48 PNG favicons, 180 Apple touch icon, 192/512 install icons and maskable icon.
- [x] Add web app manifest, supported icon purposes, theme and display name.
- [x] Make `shop@masanawa.com` an actionable `mailto:` link in shared footer and Contact page.
- [x] Display the confirmed customer number **+234 802 251 9062** as a `tel:` link and working WhatsApp contact on shared pages.
- [x] Add a dedicated `/contact/` page with all three brands represented and verified contact channels.
- [x] Keep the global public header free of owner login and store-creation promotion; preserve clean mobile navigation.
- [x] Preserve client-merchant contact branding on unrelated `/shops/<slug>/` stores instead of claiming they belong to the three brands.

## Search and discovery

- [x] Supply unique page titles and short descriptions for the umbrella homepage, all three shops, products and contact page.
- [x] Include canonical URLs on public pages and correct canonical paths for the three flagship shops.
- [x] Keep historic Maknoon `/products/` URLs working while their canonical and share targets resolve to `/maknoon-jamil/products/`.
- [x] Build missing static `/maknoon-jamil/products/` pages for **all 25 × 4 = 100** clothing options.
- [x] Serve descriptive Open Graph and Twitter metadata on homepage, three store pages, product pages and contact page.
- [x] Provide fresh 1200 × 630 JPEG shop cover previews for all three business storefront addresses, plus the existing three-brand main share preview.
- [x] Use explicit `og:image`, `og:image:secure_url`, image type and accessible descriptions, with dimensions on known 1200 × 630 covers.
- [x] Supply structured Schema.org `Organization`, `WebSite` and three-brand `ItemList` on the root page.
- [x] Supply structured `Store` and `BreadcrumbList` on each shop page.
- [x] Supply structured `Product` and breadcrumb data for every individual product and option.
- [x] Include an `Offer` only when a product actually has a recorded price; never fabricate prices, reviews, ratings, SPF levels or claims.
- [x] Include the verified email and phone number in contact schema without inventing an address or office hours.
- [x] Generate a static `sitemap.xml` covering root, contact, three shops and **123 product/option URLs**.
- [x] Add a Worker sitemap route that reflects D1-published owner storefronts, visible products and hidden/deleted product changes.
- [x] Create `robots.txt` pointing to the sitemap and excluding private owner, admin, API and photo-service URLs.
- [x] Mark private editor/setup pages and preview pages `noindex` while keeping public catalogues indexable.
- [x] Add sensible static-asset cache headers for preview images, icons and brand assets.

## Product, WhatsApp and visual parity

- [x] Preserve all Maknoon Jamil variant pages, preselected colour choice, direct WhatsApp order messages and original links.
- [x] Preserve all 13 Pop & Petals product names, polished photos, original galleries and customisations in D1.
- [x] Preserve all 10 Flawless Glow Co product names, photographs, product descriptions and categories.
- [x] Validate each product preview image exists and resolves to JPEG for WebP products; keep original JPEG as-is.
- [x] Add brand-appropriate social preview metadata to the two newer brands' product and shopping pages.
- [x] Make the **Share** control a working server-rendered WhatsApp link even with JavaScript disabled.
- [x] Enhance sharing with selected colour/variant, native photo-and-caption share where the browser supports it, and a photo/caption fallback.
- [x] Correct generic “in As pictured” share wording; put the product link early for messenger link scraping.
- [x] Keep WhatsApp purchase messages brand-specific, with product and variant names and their canonical page link.
- [x] Respect each sister shop's WhatsApp override when present; otherwise fall back to the known proprietor number.
- [x] Keep unknown prices as “Ask on WhatsApp”, known prices as “Buy on WhatsApp”, and unavailable product ordering disabled.
- [x] Reuse the same card/detail/share components and global branding in all three flagship stores.

## Verification and publishing

- [x] Automated tests cover logo files and image dimensions, icons, schema, share metadata, all 123 product/variant previews, working WhatsApp fallbacks, SEO sitemap, contact, D1 shop routing and overriding.
- [x] All automated tests pass and the full static build succeeds before publication.
- [x] Static assets include all products, variants, favicons, preview images, contact page, manifest and sitemap.
- [x] Changes are committed and submitted to the site's GitHub repository for merge to `main`.

## Independent production acceptance (external dependencies)

These require a reachable published domain or privileged accounts and are not substitutes for code tests.

- [ ] Confirm the Cloudflare production deployment is serving this exact merged `main` commit.
- [ ] Verify the public domain and all three shop/product URLs return HTTP 200, including JPEG preview images, from outside the restricted development network.
- [ ] Paste live shop and product links into **WhatsApp** and verify its crawler actually displays the right thumbnail. WhatsApp may cache old thumbnails; re-scrape or share a refreshed URL after deployment.
- [ ] Verify Search Console ownership and submit `https://mj.masanawa.com/sitemap.xml` to **Google Search Console** (and Bing Webmaster Tools if desired). A code deploy cannot claim domain verification or force indexing.
- [ ] Measure real mobile Core Web Vitals on the live domain; no actual field data is available in the development environment.
- [ ] Supply confirmed owner policies, returns/shipping details and business registration/address if these should be published. None were fabricated.

Passing tests confirms intended code and static assets. Search-engine indexing, external WhatsApp crawler results and production deploy health are separate observations.
