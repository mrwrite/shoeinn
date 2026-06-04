# Premium Care Marketplace QA Checklist

Use this checklist before archiving `evolve-to-premium-care-marketplace` and before building the next demo APK.

## Environment Prep

- [x] Start Postgres/API with the expected payment mode for the run.
- [x] Seed Shelby County: `POST /dev/seed?reset=true`.
- [x] Seed Mt. Juliet: `POST /dev/seed?reset=true&demo_market=mt_juliet`.
- [x] Confirm `GET /care-categories` returns active categories for shoes, laundry, dry cleaning, handbags/leather, rugs/textiles, and alterations.
- [x] Confirm `GET /services?category_slug=<slug>` returns at least one service for each required category in both demo markets.

## Customer Smoke Test

- [x] Sign in with the default customer demo login.
- [x] Confirm the home screen uses broad premium care language, not shoe-only marketplace positioning.
- [x] Confirm category chips/cards render with stable names and selected state.
- [x] Select each required category and confirm provider/service cards filter or show a useful empty state.
- [x] Simulate category API failure or offline mode and confirm existing discovery still renders without crashing.
- [x] Book a shoe-category service through hold, confirm, Review & Pay, and payment result.
- [x] Book a non-shoe service, preferably laundry or dry cleaning, through the same flow.
- [x] Confirm payment summary uses the selected service/category context and no shoe-only copy for non-shoe services.
- [x] Confirm payment return/refresh can recover a pending service-mode payment.
- [x] Open Appointments and confirm shoe and non-shoe appointments remain visible after provider claim/status changes.
- [x] Open appointment detail and confirm service/category, timeline, payment state, pickup/drop-off, and tracking sections render.
- [x] Confirm notification surfaces show appointment updates and unread/read state without affecting the Appointments tab badge.

## Provider Smoke Test

- [x] Sign in with the provider demo login for Shelby County.
- [x] Confirm available/open jobs include mixed-category service names and category context.
- [x] Claim a confirmed job and confirm it moves to the provider active/claimed surface.
- [x] Update status to en route pickup, picked up, in care, ready where supported, out for delivery, delivered/completed.
- [x] Confirm status buttons disable while submitting and no double-submit behavior is visible.
- [x] Confirm map/tracking sections do not crash when coordinates are missing.
- [x] Repeat a provider smoke path for Mt. Juliet after reseeding that market.

## Company Admin Smoke Test

- [x] Sign in with the company admin demo login.
- [x] Confirm dashboard/queues show mixed-category jobs, assignment state, provider names, and lifecycle status.
- [x] Assign an unassigned job to a provider.
- [x] Open appointment detail and confirm category context, timeline/status, and payment state are visible.
- [x] Confirm live updates refresh admin views after provider status changes.
- [x] Confirm provider category metadata is informational only and does not block assignment/claim behavior.

## Notification And Live Event Smoke Test

- [x] Connect a customer session and provider/admin session.
- [x] Have the provider claim a job and update status.
- [x] Confirm the customer receives the existing assignment/status notification behavior.
- [x] Confirm live event payloads include appointment id, status, previous status when available, actor role, service name, and category fields.
- [x] Confirm non-shoe notification copy does not imply shoes unless the category is shoes.

## Visual Copy Review

- [x] Review first-viewport mobile copy for login, customer home, provider menu, service detail, booking, payment result, appointments, provider dashboard, owner dashboard, and notifications.
- [x] Confirm `ShoeInn` reads as the master brand while the product promise communicates premium local care.
- [x] Confirm shoe-specific service names remain only where the service/category is actually shoes.
- [x] Capture any legacy or unreachable screen copy cleanup needed before a public demo.

## Manual QA Run - 2026-06-03

Local services:
- API: `http://localhost:8002` in `service` payment mode.
- Payment service: `http://localhost:8001`.
- Postgres: Docker container `api-db-1`.

Customer QA result: pass.
- Shelby County and Mt. Juliet demo customer logins succeeded.
- `GET /care-categories` returned all six required categories.
- Service and company filters returned category-specific results for shoes, laundry, dry cleaning, handbags/leather, rugs/textiles, and alterations in both markets.
- Invalid category filters returned empty result sets for the mobile empty-state path.
- Shoe and laundry bookings completed hold/confirm in service payment mode in both markets.
- Payment refresh returned the pending service-mode appointment without losing category metadata.
- Customer appointment list/detail returned shoe and non-shoe appointments with service/category metadata.
- Mobile tests covered category chips/cards, API failure fallback, selected-category filtering, payment summary category display, appointment copy, and notification copy.

Provider QA result: pass.
- Shelby County and Mt. Juliet provider logins succeeded.
- Provider open queue returned mixed-category jobs with category metadata.
- Claim flow succeeded and the claimed job appeared in the provider active list.
- Status updates succeeded for en route pickup, picked up, in care, ready with image upload, out for delivery, delivered, and completed.
- Tracking endpoint returned safely with missing coordinates (`latest_location: null`).
- Customer notifications were created after claim/status changes.

Company admin QA result: pass.
- Shelby County and Mt. Juliet company admin logins succeeded.
- Admin queues returned mixed-category jobs with provider/assignment/status metadata.
- Separate admin assignment smoke assigned an unassigned confirmed job to a provider in both markets.
- Assigned jobs remained visible as assigned in the admin queue.
- Provider category metadata remained informational and did not block claim/assignment.

Validation run:
- `apps/mobile`: `npm run typecheck` passed.
- `apps/mobile`: `npm test -- --runInBand` passed, 12 suites / 35 tests.
- `apps/api`: `.venv\Scripts\python.exe -m pytest -q` passed, 77 tests.
- `openspec validate evolve-to-premium-care-marketplace --strict` passed.

Notes:
- Checkout completion through hosted Stripe was not performed; the verified local payment path is service-mode checkout creation plus payment refresh returning the pending appointment. Full paid checkout still requires a real Stripe checkout/webhook session.

## Deferred Product Decisions

- App rename or sub-brand decision after multi-category demo feedback.
- Category-specific intake for laundry quantity, rug size, garment counts, leather condition, and alterations measurements.
- Category-specific pricing beyond flat service pricing.
- Provider category eligibility enforcement in claim/assignment flows.
- Category-specific lifecycle states beyond the current appointment statuses.
- Refunds, payouts, marketplace ranking, and search/recommendation tuning.
