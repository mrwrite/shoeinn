# Phase 1 Terminology And Brand Audit

## Scope Reviewed

- Active mobile customer, provider, company admin, appointment, payment, notification, profile, and shared component paths under `apps/mobile/src`.
- Backend user-facing copy and model descriptions under `apps/api/app`, plus seed scripts and tests under `apps/api`.
- Docs and OpenSpec artifacts for brand, demo seed, and payment-return language.

## Terminology Map

- Shoe provider -> care provider
- Shoe service -> care service
- Sneaker cleaning -> category-specific shoe service copy only
- Booking -> care appointment or care order in broad user-facing surfaces
- Cleaning -> in care where a category-neutral status label is safer
- Ready photo or finished-shoes photo -> completion photo
- Your shoes -> your items
- ShoeInn -> remains the master brand

## Safe Phase 1 Changes Made

- Centralized broad mobile brand copy in `apps/mobile/src/content/brandCopy.ts`.
- Updated login hero positioning from shoe-only care to premium care, pickup, and delivery.
- Updated active customer home/discovery title from "Book premium shoe care" to "Book premium care services".
- Updated active discovery subtitle and search placeholder to care-provider/care-service language.
- Updated provider ready-photo prompt to "completion photo".
- Updated API `Service` docstring from sneaker service to care service.
- Updated payment return fallback copy from booking-only language to care appointment language while preserving the ShoeInn brand and redirect behavior.

## Terms Kept Intentionally

- `ShoeInn` remains in app branding, API title, URI schemes, package names, demo emails, database names, deployment URLs, tests, and docs.
- Existing service names such as "White Pair Recovery", "Premium Restore", and other shoe-specific seeded service names remain unchanged until Phase 5 seed implementation.
- Backend model and route names such as `Service`, `Appointment`, `provider`, `/services`, and `/appointments` remain unchanged.
- Payment query parameter names such as `booking_id` remain unchanged for compatibility.
- Status enum values such as `cleaning` and `ready` remain unchanged until a later category/lifecycle design requires more than label changes.

## Deferred To Later Phases

- Phase 2: category model, service category association, provider/company category metadata, migrations, and backfill.
- Phase 3: category API fields and filters.
- Phase 4: full category browsing UI and category-aware cards.
- Phase 5: actual Mt. Juliet and Shelby County multi-category seed data.
- Phase 6: category-aware backend/mobile test expansion.

## Remaining Audit Findings

- `apps/api/app/routers/dev_seed.py` and `apps/api/scripts/seed_services.py` still seed shoe-focused or shoe-adjacent service names; this is expected until Phase 5.
- Some legacy mobile screens outside the active polished RootTabs flow still contain older shoe/service copy and hardcoded presentation patterns. They should be retired or migrated when confirming reachable routes.
- Documentation still contains `ShoeInn` as brand/deployment identity and demo account domain. That should remain until a formal app rename decision is made.
- Shelby County and Mt. Juliet are both explicitly required in the OpenSpec plan for future multi-category seed coverage.
