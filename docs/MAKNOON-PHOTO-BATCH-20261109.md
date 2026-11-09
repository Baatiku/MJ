# Maknoon Jamil — 9 November garment photo intake

Nine owner-supplied original photographs were compared for **garment structure**, not merely shared colour. The catalogue has **four additional designs and six colour choices**, never nine duplicate products. Earlier 25 styles, their photos, D1 owner prices/edits, URL slugs and order are preserved. New designs are appended in their first-appearance order, ready for later batches.

| Source image | Garment/photograph | Catalogue role | Public JPEG |
| --- | --- | --- | --- |
| `1000039892` | Full-length powder-blue full-drape jilbab with hand bag | New product 1: **Full-Drape Jilbab**, Powder Blue | `mj-full-drape-jilbab-powder-blue.jpg` |
| `1000039891` | Petrol-blue tiered niqab khimar over black abaya | New product 2: **Tiered Niqab Khimar**, Petrol Blue & Black | `mj-tiered-niqab-petrol-blue-black.jpg` |
| `1000039888` | Deep-plum gathered maxi close/front view | Gallery view for **Gathered Maxi Abaya** | `mj-gathered-maxi-deep-plum-detail.jpg` |
| `1000039889` | Silver-grey tiered niqab khimar over black abaya | Colour option on product 2, not a new product | `mj-tiered-niqab-silver-grey-black.jpg` |
| `1000039890` | Dusty-mauve tiered niqab khimar over deep plum abaya | Colour option on product 2, not a new product | `mj-tiered-niqab-dusty-mauve-plum.jpg` |
| `1000039887` | Close view of dusty-mauve khimar over plum outfit | Detail gallery for the Dusty Mauve & Deep Plum colour only | `mj-tiered-niqab-dusty-mauve-detail.jpg` |
| `1000039886` | Close view of petrol-blue layered khimar | Detail gallery for Petrol Blue & Black only | `mj-tiered-niqab-petrol-blue-detail.jpg` |
| `1000039885` | Full-length gathered-front deep plum maxi dress | New product 3: **Gathered Maxi Abaya**, Deep Plum; lead photo | `mj-gathered-maxi-deep-plum.jpg` |
| `1000039884` | Plum outer khimar with dusty-mauve inner maxi dress and mirror | New product 4: **Two-Tone Long Khimar**, Plum & Dusty Mauve | `mj-two-tone-khimar-plum-mauve.jpg` |

## Image art direction

- Each photo was AI-retouched using **the individual supplied image as edit target**, not generated as an ungrounded clothing design. The images were then given a second unified art-direction pass: a warm-ivory limewash-plaster studio, a shallow rounded alcove, subtle champagne-travertine floor and delicate side lighting. The original mixed gold curtains, blank backdrops and mirror were replaced. Fabric shapes, seams, colours, details, mannequin poses and recognisable accessories remain intact.
- The old inconsistent overlaid `Maknoon_jamil` text, colour callouts and decorative lines were removed during retouching. A more luxurious serif-italic **Maknoon_jamil** is placed in the same **bottom-right corner** with symmetrical **double hairline rules and a miniature eight-petalled geometric arabesque rosette**—a restrained reference to traditional Islamic ornamental art.
- The watermark's SVG is the reusable master. `node scripts/add-maknoon-watermark.mjs cleaned-image.png public/images/mj-filename.jpg` applies it with scale based on photo width and a constant relative inset. The artwork uses ivory over dark fabric or muted cocoa over the light studio floor, selected from local background luminance so the signature remains legible without a heavy opaque label.
- All nine final images are compressed JPEGs. No product is assigned an invented price, fabric specification, or assertion that separately pictured bags/abayas are included in a purchase.
- Front/full-length views lead where available. Detail views only appear for the corresponding variant; colour-specific galleries do not accidentally mix garments.
- New product IDs are deterministic, with no duplication of an existing product ID. Static pages, WhatsApp ordering, share JPEG metadata and the sitemap are generated from the same source catalogue.
- The D1 public and owner-managed Maknoon views append only new IDs missing from the owner workspace. A D1 product with the same ID takes priority, including price, order, images, and hidden state. No destructive D1 rewrite or migration is required.

## Release checks

- [x] Nine source images mapped to four designs, six colour options, and three detail photographs.
- [x] Preserve original catalogue products and existing edits; append in source order.
- [x] AI clean-up of all nine references, with original watermarks removed.
- [x] Nine portraits restaged on a cohesive ivory-and-limestone luxury backdrop.
- [x] Uniform bottom-right elegant italic wordmark with paired lines, floral arabesque and contrast-aware colours.
- [x] Canonical share URLs and sitemap default to the current `https://shop.masanawa.com` domain.
- [x] Correct variant-specific detail galleries and no duplicate products.
- [x] Integrate static pages and D1 owner-managed routes.
- [x] Preserve WhatsApp ordering and sharing links, individual preview images and sitemap discovery.
- [ ] Confirm Cloudflare production build after GitHub `main` merge and visually inspect the live website.
- [ ] Confirm WhatsApp external previews on an actual device after deployment (third-party cache may delay refresh).
