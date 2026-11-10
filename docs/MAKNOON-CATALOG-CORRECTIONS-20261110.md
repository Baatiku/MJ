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

## Release verification

- `npm test` — 31 tests, all passing.
- `npm run build` — source image reference check, static pages and sitemap.
- Check both live `/maknoon-jamil/` and the D1-backed shop route after merge.
