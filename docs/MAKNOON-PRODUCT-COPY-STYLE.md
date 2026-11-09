# Maknoon Jamil — product copy standard

Customer-facing descriptions should have the same memorable, confident
brevity as the Pop & Petals product descriptions. They should sell the feeling,
occasion and purpose of a garment—not narrate what appears in a photograph.

## Rules for every new Maknoon product

1. Write one bespoke sentence per **design family**, not separate text for
   each colour variant. Aim for 8–20 natural, polished words.
2. Speak to the customer: confidence, ease, modest elegance, occasions,
   thoughtful wardrobe choices and styling versatility.
3. Vary the angle for each product. Do not repeatedly use a fill-in-the-blank
   formula, stock adjectives or sales hype.
4. Never say “the reference shows,” “pictured,” “this image,” “as seen,”
   “ask for the full-length view” or other photo-audit language.
5. Do not invent materials, durability, fit, size ranges, bundled accessories,
   care instructions, country of origin or stock availability.
6. Keep uncertain details in the private stock register or the product's
   internal review workflow. Confirm them with the owner separately.
7. Preserve the owner's custom description if they have edited a product.
   Only replace text that still exactly matches the original seed wording.

`src/catalog/maknoon-copy.js` is the current 36-product copy register and
contains the guarded wording updates for catalogues previously saved in D1.
The checks in `tests/maknoon-copy.test.js` enforce full coverage, uniqueness
and protection of merchant-written descriptions.
