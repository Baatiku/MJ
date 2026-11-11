# Maknoon Jamil catalogue corrections — 10 November 2026

## Shipped in this release

- Retire all seven requested items, including the four previously queued:
  Belted Shirt Maxi, High-Neck Pleated Maxi, Longline Knit Maxi,
  Wide-Leg Tunic Set, Hooded Jilbab, Longline Waistcoat Set and Satin Square Hijab.
  Remove their static variant pages and unused images from production output.
- Rename **Satin Waterfall Abaya** to **Waterfall Abaya**; **Burgundy Satin
  Draped Look** to **Burgundy Waterfall Abaya**; **Mocha Satin Khimar** to
  **Mocha Khimar**; **Chiffon Wrap Hijab** to **Chiffon Wrap Veil**; and
  **Covered-Button Cape Abaya** to **Cape Abaya**. Avoid inaccurate satin or
  button descriptions.
- Waterfall and Burgundy Waterfall Abayas: **₦40,000** each. Cape-Sleeve
  Abaya: **₦30,000**. Everyday, Pleated Cuff and Flow Abayas: **₦25,000** each.
  All listed khimars: **₦30,000**; all listed jilbabs: **₦15,000**.
  Umbrella hijabs have a **₦15,000** pricing rule, but there is no product
  specifically identified as an Umbrella Hijab in the repository catalogue.
- Replace all three Cape Abaya variant photos and the combination gallery
  with images showing a truly buttonless front. Generate matching JPEG share
  previews and use new filenames to bypass cached old images.
- Upgrade older Cloudflare D1 product records on read, including titles,
  prices, categories, and old Cape Abaya photos. Preserves availability,
  hidden state, colour ordering, and other owner edits. Future admin price
  edits survive because saved products retain the correction edition.
- Keep the familiar circular colour swatches, with a compact expansion button
  after six colours. Support up to 32 variants and show a focused Maknoon
  product admin: price, main display colour, and customer preference ordering.

## Continuation status from the exhausted session

The previous session reported 60 colour images generated locally but not
committed or pushed. Those image files were not on GitHub `main` and were not
part of the repository that could be recovered here. Accordingly these
larger-scope items **remain outstanding** and are not claimed complete:

- Produce all requested 20 genuinely colour-matched photographs for each
  remaining dress, without duplicate designs or falsely labelled photos.

## 11 November continuation — full maxi-dress palette

- The three distinct **Maxi dresses** product designs are Gathered-Waist Maxi,
  A-Line Maxi and Tiered Gathered Maxi. Each now offers the requested 20-colour
  palette, illustrated by garment-specific generated studio images, while
  keeping original seller photographs and other original colours. These are
  visual colour renderings; they do **not** independently verify inventory or
  that the finished garment will have exactly the same shade.
- 56 new colour options require generated product images and individually
  generated JPEG social previews (20 for the Gathered-Waist Maxi, 18 each for
  the A-Line and Tiered Gathered styles; their existing Navy and Olive images
  already cover the other two palette colours). There are no duplicated dress
  products. Generated images live in `public/images/maknoon-colours/`; their
  previews live in `public/previews/maknoon-colours/`.
- Keep old colour IDs and links, preserve the original top/default image and
  seller colour order, and append the newly requested colours. Admin saves
  retain the edition so priority and default-image changes are not undone.
  Existing Cloudflare D1 records are upgraded on read for both legacy and
  managed Maknoon storefront paths.
- Colour expansion in this release is for the three **Maxi dresses** category
  designs. Abayas, jilbabs, khimars, niqabs and headwear retain their own
  existing verified palettes; adding the same 20 colour renderings to every
  one of those categories is a separate, larger image-generation scope.

## Follow-up: Waterfall, Cape and Flow Abayas

- Extend the same image-backed 20-colour palette to the Waterfall Abaya,
  buttonless Cape Abaya and Flow Abaya. These first three Abaya designs add 54
  generated studio colour images plus 54 JPEG product-share previews.
- Keep real photographed stock options first, preserving seller priorities,
  original photographs and shared colour URLs. A palette entry already covered
  by an owner photo is not duplicated; original colours outside the 20 remain.
- Colour images for the Cape Abaya must preserve its buttonless silhouette.
  Photo previews do not by themselves verify inventory or precise dye shades.
- Other Abayas and accessory categories remain a separate set of image batches;
  new colours will be activated only when their distinct product imagery exists.

## 11 November follow-up — all remaining Abaya palettes

### Khimar colour continuation

- The Mocha Khimar now has distinct studio renderings and JPEG share previews
  for all 19 additional colours in the owner's 20-colour palette. The original
  Mocha photograph remains first and unchanged.
- The new garment-colour edition upgrades older D1 records while preserving
  owner-selected default image, colour order, price, and availability.
- Only completed, image-backed garment styles are activated. Other Khimars,
  Jilbabs, niqab looks, layers and headwear are still awaiting their distinct
  photo sets and are not advertised as 20-colour products yet.

- Complete the outstanding seven designs: Burgundy Waterfall Abaya, Draped
  Collar Abaya, Gathered Maxi Abaya, Everyday Abaya, Pleated Cuff Abaya,
  Butterfly Abaya and Cape-Sleeve Abaya. All **ten** Abaya products now have
  the full 20 named colour choices backed by a style-specific garment image
  and individually generated JPEG sharing preview.
- Add **126** new colour photographs and previews in this release series:
  43 surviving from the interrupted generation and 83 generated during the
  final continuation. Taken together with 54 previously shipped Abaya colour
  photos and 56 maxi-dress photos, this completes the requested palettes for
  all 13 Abaya and Maxi-dress designs.
- Original seller photographs, colours outside the palette, default colour,
  manual price edits, and owner priority order are preserved. In particular,
  original `midnight`, `navy` and `olive` IDs represent Navy Blue and Olive Green,
  and the original Butterfly `emerald` represents Emerald Green, without
  introducing duplicate named swatches. These synthetic previews illustrate
  colours; they do not constitute stock or exact dye-lot verification.
- Khimars, jilbabs, veils, niqabs and other accessories keep their own existing
  colour choices. They were not part of the owner's 20-colour *dress* request.

## Release verification

- `npm test` — 31 tests, all passing.
- `npm run build` — source image reference check, static pages and sitemap.
- Check both live `/maknoon-jamil/` and the D1-backed shop route after merge.
