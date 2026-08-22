# CHANGE LOG FOR PROJECT X
  Agent will update this as needed, inputing changes in the catagory below that suits the change best. You should copy / paste necessary changes to your latest release notes as needed. 



## Feature Updates

- 2026-08-22: Added the Phase 1 application foundation with React frontend shell, Express/Prisma commerce API, FastAPI AI health shell, PostgreSQL schema/migration, seeded fashion catalogue, and read-only catalogue browsing pages.
- 2026-08-22: Replaced static sample products with a sanitized CSV catalogue seed that imports 1,406 products across all five fashion departments using generated names, prices, sale prices, sizes, and stock.
- 2026-08-22: Updated the CSV seed to use the owner-approved CSV product image URLs so catalogue cards display product images instead of placeholders.
- 2026-08-22: Added Phase 2 catalogue search, DB-driven filters, strict sorting, product detail add-to-basket controls, basket management, customer auth, protected account profile, and saved UK addresses.
- 2026-08-22: Updated seeding to exclude innerwear from the customer catalogue and filter options, add deterministic fit attributes, and preserve 14 out-of-stock products for stock-state testing.
- 2026-08-22: Added explicit offline detection and customer-facing offline messages across the shopping flows.
- 2026-08-22: Replaced the development catalogue with the owner-approved Men/Women JSONL import, preserving approved product copy, GBP prices, development stock values, available sizes, and product imagery while removing Kids from the customer catalogue.
- 2026-08-22: Updated storefront identity to AVE across the header, footer, auth pages, homepage copy, and browser title using the supplied AVE logo asset.
- 2026-08-22: Added live image validation to the JSONL seed and catalogue API guards so products without working images are removed from the development catalogue and excluded from storefront listings, filters, product detail, and basket add flows.
- 2026-08-22: Added the AVE full-viewport video homepage hero, transparent-to-solid fixed header, responsive mobile drawer, and DB-driven homepage discovery controls for keyword, Occasion, Colour, and Size.
- 2026-08-22: Added deterministic product `usage` attributes to the approved JSONL seed and exposed them as real data-driven Occasion filter options across catalogue search and homepage discovery.
- 2026-08-22: Added the owner-provided Kids JSONL catalogue to the seed, created the Kids department with clean storefront categories, and added Kids to the header and homepage shopping shortcuts.
- 2026-08-22: Added Accessories as a top-level storefront department, moved relevant accessory products there during approved JSONL seeding, and added Accessories to header and homepage shopping shortcuts.
- 2026-08-22: Changed customer browsing so department pages are category-card hubs and dedicated category pages show only exact department/category products, with Kids removed from customer-facing navigation and route access.



## Backend Process Changes

- 2026-08-22: Added central API request logging, error handling, environment examples, local Postgres compose setup, and Phase 1 setup documentation.
- 2026-08-22: Added `Product.externalId` for idempotent local CSV seeding without exposing it through catalogue API responses.
- 2026-08-22: Added secure JWT cookie sessions, argon2 password hashing, stock-authoritative basket APIs, guest basket UUID handling, guest-to-customer basket merge, and single-default address handling.



## Bug Fixes

- 2026-08-22: Fixed homepage hero video playback by removing the optional WebM source when no local WebM file exists, leaving the real local MP4 source with poster fallback.
