## Context

ShoeInn currently behaves as a premium shoe-care marketplace in branding, demo data, and parts of the mobile copy, but the technical core is broader than the original positioning:

- `apps/api` already uses generic `companies`, `services`, `appointments`, `appointment_holds`, `available_slots`, payment, notification, assignment, and tracking models.
- `Service` is generic in fields but its model docstring and seed data still describe sneaker services.
- `Company` is generic enough to represent care businesses, but provider capability is currently only modeled as company membership through `company_users`.
- `Appointment` is generic enough for pickup/drop-off care work, but timeline/status labels and ready-photo language assume cleaning and finished item photos.
- Payment quote and checkout are service-name driven and can support non-shoe services if service/category metadata is added.
- Active mobile routes under `RootTabs` already render generic provider/service/appointment cards after the polish work, but customer home copy still says "Book premium shoe care", search/default copy still includes sneaker/shoe assumptions in some shared or legacy screens, and demo login/seed stories use ShoeInn-specific email/name patterns.
- There are older duplicate mobile screens outside the active polished flow that still contain hardcoded shoe/service copy. The implementation should prioritize active routes and either migrate or retire legacy routes deliberately.

Stakeholders are customers booking premium local care, care providers doing pickup/status work, company admins managing operations, and operators using Mt. Juliet/Shelby County demo data. The planning constraint is brownfield-first: preserve shoe-care behavior and add category support without destructive migrations or premature rebranding.

## Goals / Non-Goals

**Goals:**

- Let the product represent multiple premium care categories while preserving existing shoe-care booking.
- Keep "ShoeInn" as the master brand for the first category expansion unless later validation shows the brand is too constraining.
- Introduce category metadata additively across backend models, API schemas, mobile types, service cards, provider cards, booking/payment summaries, appointment tracking, notifications, and seed data.
- Support providers and companies offering one or more care categories.
- Keep existing API contracts compatible by adding optional fields and filters rather than replacing core shapes.
- Make customer discovery category-led while retaining company/provider-led browsing.
- Keep payment, appointment lifecycle, assignment, live updates, and notification infrastructure intact.
- Document and test the transition so shoe-care remains the regression baseline.

**Non-Goals:**

- Rename the app, bundle id, database name, routes, or repository from ShoeInn in the first implementation.
- Rename `Service`, `Company`, or `Appointment` tables/classes destructively.
- Replace the current payment service, pricing model, provider assignment model, WebSocket infrastructure, notification outbox, or route tracking architecture.
- Add item-level intake forms, garment counts, stain metadata, repair workflows, alteration measurements, insurance/valuation, refunds, payouts, or marketplace search ranking in this change.
- Build category-specific operational lifecycles beyond the existing pickup, in-care, ready, delivery, and completed states.

## Decisions

### Decision 1: Keep ShoeInn as master brand, broaden positioning first

Recommendation: keep "ShoeInn" for now and reposition it as a premium local care marketplace. Use copy such as "Premium care for what you wear, carry, and keep" or "Book trusted local care" while keeping shoe care as the origin category.

Rationale:

- The current product and demo assets are already named ShoeInn.
- A rename would touch app config, payment return URLs, seed accounts, copy, deployment docs, and operator muscle memory without proving category demand.
- "ShoeInn" can remain a brand umbrella if the first viewport quickly communicates broader care categories.

Alternative considered: rebrand immediately to a category-neutral name. This is deferred because it increases migration and demo risk before category support exists.

### Decision 2: Add explicit `CareCategory` rather than encoding category in service names

Add a new category model with stable slugs and display metadata:

- `id`
- `slug` such as `shoes`, `laundry`, `dry-cleaning`, `handbags-leather`, `rugs-textiles`, `alterations`
- `name`
- `description`
- optional `sort_order`, `icon_key`, `hero_image_url`, `is_active`

Existing services should default to the `shoes` category during migration. Category names should be data, not enum-only code, so operators can add future categories without code changes.

Alternative considered: use a string column on `services` only. This is simpler but cannot represent provider/company category capabilities cleanly, cannot support category metadata, and makes future category management brittle.

### Decision 3: Use additive provider/company category relationships

Represent provider capability at two levels:

- Company offered categories: derived from active services or stored explicitly through `company_care_categories`.
- Individual provider capabilities: optional join table such as `provider_care_categories` linking `users` to categories for future dispatch filtering.

Initial implementation can derive company categories from services and seed provider categories additively. Provider eligibility should not block existing claims until the UI/admin assignment path is ready to manage capabilities. Once seeded and tested, open jobs can optionally include category metadata so providers understand the work before claiming.

Alternative considered: make provider category eligibility mandatory immediately. This is deferred because current assignment is company-membership based, and hard eligibility could break existing demos if provider capabilities are not seeded perfectly.

### Decision 4: Attach services to categories and include category snapshots in read models

Add `category_id` to `services` or a service-category join if multi-category services become necessary. For the first implementation, prefer one primary category per service:

- Most customer cards and filters need a single primary category.
- Cross-listed services can be duplicated or handled later with a join table if needed.
- Additive API fields can expose `category_id`, `category_slug`, `category_name`, and optional category display metadata.

Appointments should continue storing `service_id`. If historical category display must remain stable after service edits, add nullable snapshot columns such as `service_name_snapshot` and `category_name_snapshot` later. For the first category implementation, reading through `Service` is acceptable because current appointments already depend on service lookup for `service_name`.

Alternative considered: rename `appointments` to `orders` or add a separate `orders` table. This is rejected for now; existing lifecycle, payment, assignment, and notification logic is appointment-based and can represent care appointments/orders with copy changes.

### Decision 5: Preserve payment mechanics, neutralize payment copy

Payment summary should continue to price by service. Quote responses should add optional category context but keep current line item structure:

- `service_base` line remains the selected care service.
- "Service fee" is already category-neutral.
- "Pickup & delivery fee" remains valid for pickup/delivery care.

Mobile copy should use "care appointment", "care order", or "booking" contextually and avoid "shoes" unless the selected category is shoes.

Alternative considered: category-specific pricing plugins. This is deferred until item counts, subscriptions, per-pound laundry, rug square footage, alterations, or repair complexity are modeled.

### Decision 6: Make customer home category-led, then provider/service-led

Mobile home should show category entry points first, then trusted providers/services:

1. Header/brand positioning: "Book premium local care".
2. Category chips/cards: Shoes, Laundry, Dry Cleaning, Handbags & Leather, Rugs & Textiles, Alterations.
3. Provider/service lists filtered by selected category.
4. Existing provider menu route remains, but it should show category badges and category-grouped services.

The active booking path should continue to start from a selected service. It should receive category fields via `Service` type and use those fields in copy/badges.

Alternative considered: build a separate category detail stack first. This is optional; filters on existing home/provider/service routes are lower risk.

### Decision 7: Use category-neutral appointment tracking with category-specific detail copy where available

Keep current statuses:

- `requested`
- `pending_payment`
- `confirmed`
- `en_route_pickup`
- `picked_up`
- `cleaning`
- `ready`
- `out_for_delivery`
- `delivered`
- `completed`
- `cancelled`

UI labels can remain understandable if translated to neutral wording:

- `cleaning` -> "In care" by default, or "Cleaning" for cleaning categories.
- `ready` -> "Ready for return".
- `ready_photo_url` -> "Completion photo" in UI, not "finished shoes photo".
- "Your items" instead of "your shoes".

Alternative considered: add category-specific lifecycle enums now. This is deferred because it would ripple through provider actions, tests, notifications, live events, and appointment filtering.

### Decision 8: Keep API backward compatible through additive fields and filters

Existing mobile callers should continue working if they ignore category fields. API updates should be additive:

- `GET /categories` or `GET /care-categories`
- `GET /services?company_id=&category_slug=`
- `GET /companies?category_slug=`
- appointment list/detail returns optional service category fields
- provider/admin appointment list returns optional category fields
- quote response returns optional category fields

Avoid changing existing required request fields in holds, confirmation, payment refresh, cancellation, status update, or assignment endpoints.

## Migration Plan

1. Add category tables/columns in a non-destructive Alembic migration.
2. Seed baseline categories.
3. Backfill existing services to `shoes`.
4. Expose category metadata in API responses while keeping old fields.
5. Update mobile TypeScript types to make category fields optional.
6. Update active mobile screens to use category-neutral copy and category filters.
7. Expand both Mt. Juliet and Shelby County demo seed data to include multi-category providers/services.
8. Add tests for category support and regression tests for existing shoe-care flow.
9. Validate with OpenSpec, backend tests, mobile typecheck/tests, and manual demo smoke.

Rollback strategy:

- Because the model changes are additive, rollback can hide category UI and ignore category fields while leaving database columns/tables in place.
- If category migration creates bad seed data, reset demo seed data rather than rolling back production schema.
- Existing shoe-care services remain valid because they are backfilled to the `shoes` category.

## Risks / Trade-offs

- [Risk] The ShoeInn name may feel shoe-only after categories expand. -> Mitigation: broaden first-viewport copy and category visuals before deciding on a rename.
- [Risk] Provider capability filtering can block jobs incorrectly. -> Mitigation: start as informative metadata, then enforce only after admin/provider management exists.
- [Risk] Existing status names are cleaning-oriented. -> Mitigation: neutralize UI labels and defer lifecycle enum changes.
- [Risk] Category-specific pricing needs are more complex than flat service pricing. -> Mitigation: keep flat services first, defer per-pound/per-item/square-foot pricing.
- [Risk] Legacy mobile screens may keep shoe-only copy. -> Mitigation: migrate active routes first and add a follow-up task to retire or update duplicate screens.
- [Risk] Category joins can introduce N+1 query regressions. -> Mitigation: use explicit joins/selectin loading in list endpoints and cover high-traffic routes with tests.
- [Risk] Demo data may become confusing if every company offers every category. -> Mitigation: seed focused providers with credible category mixes and clear names in both Mt. Juliet and Shelby County.

## Testing Strategy

- Backend:
  - category seed/backfill tests
  - Mt. Juliet and Shelby County multi-category seed tests
  - service list and company list category filter tests
  - booking hold/confirm tests for shoe and non-shoe services
  - payment quote/checkout tests for non-shoe services
  - customer/provider/admin appointment list tests including category metadata
  - notification/live event regression tests confirming category changes do not alter lifecycle delivery
- Mobile:
  - typecheck category fields on `Service`, `Company`, `Appointment`, `ProviderAppointment`, and quote types
  - service/category filter helper tests
  - booking checkout tests for category-neutral copy/data
  - appointment timeline/status label tests for neutral labels
  - smoke tests for customer, provider, and admin demo flows
- OpenSpec:
  - `openspec validate evolve-to-premium-care-marketplace --strict`

## Open Questions

- Should the public category endpoint be `/categories`, `/care-categories`, or nested under `/services/categories`?
- Should provider category capability be enforced in claim/assignment flows in the first implementation or only displayed?
- Should `Service.slug` remain globally unique, or should category expansion move toward company-scoped slugs?
- Should "appointment" remain the backend term while mobile uses "care order" in customer surfaces?
- How much category-specific intake is needed for laundry quantity, rug size, alterations, and handbag/leather condition before real launch?
- Should demo providers be single-category specialists or multi-category care shops, and should that mix differ between Mt. Juliet and Shelby County?
