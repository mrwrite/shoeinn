## 1. Audit And Terminology Cleanup

- [x] 1.1 Audit active `apps/mobile` customer, provider, admin, notification, appointment, payment, and profile routes for shoe-only copy and route assumptions.
- [x] 1.2 Audit legacy or duplicate mobile screens and document which should be migrated, retired, or left outside the active category rollout.
- [x] 1.3 Audit `apps/api` model docstrings, schema names, route descriptions, notification copy helpers, seed scripts, tests, and logs for sneaker/shoe-only wording.
- [x] 1.4 Create a terminology map for user-facing copy: care provider, care service, care category, care appointment/order, in care, ready for return, completion photo.
- [x] 1.5 Identify brand strings/constants and recommend which remain `ShoeInn` and which move to broader premium care positioning.

## 2. Data Model And Category Abstraction

- [x] 2.1 Add an additive `care_categories` model/table with slug, name, description, active state, display order, and optional display metadata.
- [x] 2.2 Add category association to services, defaulting existing services to the shoe-care category during migration.
- [x] 2.3 Add or derive company category capability from active services and expose a clear implementation path for optional explicit company-category rows.
- [x] 2.4 Add optional provider-category capability records without enforcing claim/assignment restrictions during the first rollout.
- [x] 2.5 Update SQLAlchemy exports/imports and Alembic migration ordering without renaming `Service`, `Company`, or `Appointment`.
- [x] 2.6 Backfill existing data safely and make downgrade/rollback behavior non-destructive where practical.

## 3. API Updates

- [x] 3.1 Add a read endpoint for active care categories.
- [x] 3.2 Extend service schemas and `/services` responses with optional category id, slug, name, and display metadata.
- [x] 3.3 Add category filtering to service listing while preserving existing `company_id` filtering.
- [x] 3.4 Extend company listing/detail responses with offered category metadata and category filtering based on active services.
- [x] 3.5 Extend appointment list/detail, provider queues, company admin queues, assignment surfaces, and quote responses with additive service category context where useful.
- [x] 3.6 Keep hold creation, appointment confirmation, payment refresh, unpaid cancellation, status update, assignment, notification, and live event request contracts backward compatible.
- [x] 3.7 Update notification copy helpers and live event payload builders to optionally include category context without requiring clients to consume it.

## 4. Mobile UI And Category Experience

- [x] 4.1 Update mobile TypeScript types and API helpers for care categories and optional category fields on services, companies, appointments, provider appointments, and quotes.
- [x] 4.2 Add category browse/filter UI to the active customer home screen while preserving provider/company browsing.
- [x] 4.3 Update provider/company cards to show offered care categories and avoid shoe-only copy.
- [x] 4.4 Update service cards, provider menu, service detail, booking date/time, booking confirm, Review & Pay, and payment result screens to use category-neutral language.
- [x] 4.5 Update customer appointment list/detail, timeline, tracking/map copy, payment panels, completion photo labels, and notification surfaces for category-neutral language.
- [x] 4.6 Update provider dashboard/detail/status-action surfaces to show category context while preserving existing claim/status behavior.
- [x] 4.7 Update company admin dashboard/detail/assignment surfaces to show category context and keep operational density.
- [x] 4.8 Keep light-mode polish and shared UI components intact while avoiding fragile category-specific animations or backend requirements.

## 5. Seed And Demo Data Updates

- [x] 5.1 Update `apps/api/app/routers/dev_seed.py` seed types to include category slugs for seeded services and provider/company capability metadata.
- [x] 5.2 Update Mt. Juliet demo companies and services to include shoes, laundry, dry cleaning, handbags/leather, and rugs/textiles.
- [x] 5.3 Update Shelby County demo companies and services to include shoes, laundry, dry cleaning, handbags/leather, and rugs/textiles.
- [x] 5.4 Preserve at least one complete shoe-care booking path in seeded appointments and available slots for each configured demo market.
- [x] 5.5 Add credible non-shoe seeded appointments across confirmed, en route, in care, ready, delivered/completed, and unassigned states in both Mt. Juliet and Shelby County.
- [x] 5.6 Update `apps/api/scripts/seed_services.py` default data so fresh local databases do not seed shoe-only services.
- [x] 5.7 Keep existing demo login emails/passwords usable and update visible story/copy metadata to reflect broader care categories.

## 6. Tests And Validation

- [x] 6.1 Add backend tests for category seed/backfill behavior and active category listing.
- [x] 6.2 Add backend tests for service and company category filters.
- [x] 6.3 Add backend tests proving shoe-care booking still works after category migration.
- [x] 6.4 Add backend tests proving non-shoe care services can be held, quoted, confirmed, paid/refreshed, listed, assigned, and status-updated.
- [x] 6.5 Add backend tests proving Mt. Juliet and Shelby County seeds both include the required multi-category service set.
- [x] 6.6 Add backend tests for appointment/provider/admin response category metadata and notification/live-event compatibility.
- [x] 6.7 Add or update mobile tests for category API helpers, category filters, service cards, payment summary display, appointment timeline labels, and notification copy.
- [x] 6.8 Run backend appointment/service/payment/notification/provider/admin tests.
- [x] 6.9 Run `npm run typecheck` and relevant mobile Jest tests in `apps/mobile`.
- [x] 6.10 Run `openspec validate evolve-to-premium-care-marketplace --strict`.

## 7. Polish And Follow-Up Work

- [x] 7.1 Run customer manual QA for category browsing, shoe-care booking, non-shoe booking, payment result, appointment list/detail, and notifications.
- [x] 7.2 Run provider manual QA for mixed-category available jobs, claim flow, status actions, map/tracking fallback, and completion photo upload.
- [x] 7.3 Run company admin manual QA for mixed-category dashboard, queue filters, provider assignment, and status visibility.
- [x] 7.4 Document deferred product work: app rename decision, category-specific intake, complex pricing, provider eligibility enforcement, category-specific lifecycles, refunds/payouts, and marketplace ranking.
- [x] 7.5 Review all active mobile first-viewport copy to ensure "ShoeInn" reads as a broader care marketplace rather than shoe-only marketplace.
- [x] 7.6 Capture any legacy screen cleanup needed before the next APK/demo build.
