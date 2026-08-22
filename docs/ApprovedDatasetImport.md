# Approved Dataset Import Note

Date: 2026-08-22

The owner approved a one-time import exception for this project using these local source files:

`/home/worktual/Pictures/testing/zara_products.jsonl`

`/home/worktual/Downloads/kids_with_images.jsonl`

The repository copies used by the seed are:

`api/prisma/data/approved_products.jsonl`

`api/prisma/data/kids_with_images.jsonl`

Import boundaries:

- Import `MAN`, `WOMAN`, and `KIDS` source sections as AVE customer catalogue audiences: `Men`, `Women`, and `Kids`.
- Merchandise accessory-style products into the top-level AVE `Accessories` department when the source category/product type/name indicates bags, wallets, card holders, keyrings, socks, hats, beanies, belts, scarves, jewellery, sunglasses, or similar accessories.
- Kids rows may generate neutral AVE descriptions when the source row has no description because `Product.description` is required by the current schema.
- Kids raw category fragments are normalised into clean storefront categories and product types.
- Store the source `sku` only as `Product.externalId` for idempotent development seeding. Do not expose it through public product API responses.
- Keep approved source GBP prices, estimated stock by size, available sizes, and approved `static.zara.net` image URLs for this approved import. Men/Women source names and descriptions are preserved except for source-brand sanitisation; Kids rows use source names after sanitisation and generated neutral AVE descriptions when source descriptions are absent.
- During seeding, validate approved image URLs with live HTTP checks and keep only URLs that return a successful image response.
- Skip and remove any product row that has no working image URL after validation.
- Do not import or display the source `brand` field as storefront affiliation. Remove obvious source-brand/collaboration wording from customer-facing Kids names and categories.
- Use AVE as the only customer-facing fashion brand across the storefront.
- Imported stock values are development/demo inventory only and must not be treated as live retailer inventory.
