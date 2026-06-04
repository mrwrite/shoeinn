## Why

ShoeInn is currently positioned and seeded as a premium shoe-care marketplace, but the core product opportunity is broader: customers want trusted local pickup, care, and delivery for high-value personal and household items such as shoes, laundry, dry cleaning, handbags, leather, rugs, textiles, and alterations. Staying shoe-only limits provider inventory, repeat-use frequency, basket size, demo storytelling, and the platform's ability to become a premium local care marketplace.

The current codebase is already partly generic (`companies`, `services`, `appointments`, `payment`, `notifications`, `assignment`, and `tracking`), so the best next move is a brownfield, additive category evolution rather than a destructive rewrite. Shoe-care must remain fully supported while the marketplace gains explicit category metadata, category-neutral language, and demo data that proves the broader model.

## What Changes

- Add an explicit care-category capability so services and providers can be represented across shoes, laundry, dry cleaning, handbags/leather, rugs/textiles, alterations, and future care categories.
- Keep existing shoe-care booking, payment, appointment, assignment, live update, and notification flows working while adding category context to their responses and screens.
- Preserve the current `Service`, `Company`, and `Appointment` concepts where practical; introduce category fields/tables and join relationships additively.
- Update user-facing language from shoe-specific terminology toward premium care marketplace terminology:
  - `shoe provider` -> `care provider`
  - `shoe service` -> `care service`
  - `sneaker cleaning` -> category-specific service copy
  - `booking` -> `care appointment` or `care order` depending on surface
- Keep "ShoeInn" as the likely master brand for now, but reposition it as "premium local care" or "care for what you wear and carry" rather than rename it in the first implementation slice.
- Add category browsing/filtering to the customer home and provider/service discovery experience without breaking existing company and service routes.
- Extend both Mt. Juliet and Shelby County seed/demo data to include at least shoes, laundry, dry cleaning, handbags/leather, and rugs/textiles.
- Update payment summaries, appointment timelines, notification copy, provider dashboards, and admin queues so labels do not imply shoes when the service is not shoe-related.
- Add tests for category-backed services, category filters, provider-category relationships, service booking compatibility, payment summaries, and category-neutral appointment tracking.
- Defer destructive naming migrations, marketplace search ranking, inventory-specific item intake, payouts, refunds, advanced category-specific workflows, and a public rebrand until the additive category foundation proves stable.

## Capabilities

### New Capabilities

- `premium-care-marketplace-categories`: Defines category-aware marketplace behavior for providers, services, customer discovery, booking/payment, appointment tracking, notifications, and demo data.

### Modified Capabilities

- None. There are no permanent baseline specs under `openspec/specs/` to modify; this change introduces a new capability spec while preserving existing behavior from active change-local specs.

## Impact

- Backend models and migrations:
  - Additive category model, service-to-category association, and provider/company category capability representation.
  - Optional denormalized category snapshots on appointments only if needed for historical display stability.
  - No destructive renames of `Service`, `Company`, `Appointment`, or existing status/payment enums in this planning phase.
- Backend APIs:
  - Extend `/services`, `/companies`, appointment list/detail, company/provider appointment queues, and quote responses with additive category metadata.
  - Add category list/filter endpoints or query parameters while preserving current API contracts for existing mobile callers.
- Mobile app:
  - Update active RootTabs customer discovery, provider menu, service detail, booking, review/pay, payment result, appointments, appointment detail, provider dashboard/detail, owner dashboard/detail, notifications, and shared components to use category-neutral labels.
  - Add category browse/filter UI to the home screen and service cards where data supports it.
- Seed/demo data:
  - Update `apps/api/app/routers/dev_seed.py` and `apps/api/scripts/seed_services.py` to seed multi-category care services and providers.
  - Keep both configured demo markets, `mt_juliet` and `shelby`, representative of the broader care marketplace.
  - Keep existing demo logins and shoe-care examples.
- Payment and checkout:
  - Preserve existing quote, payment mode, checkout URL, refresh, and unpaid cancel behavior.
  - Ensure summary line items use care-service names and category labels instead of shoe-specific assumptions.
- Tests:
  - Backend tests for category CRUD/seed/query behavior and compatibility with booking/payment/appointments.
  - Mobile tests/typecheck for category data shapes, discovery filters, service cards, payment summary, and category-neutral notifications/timelines.
- Risks:
  - Brand ambiguity if "ShoeInn" remains while categories expand too far.
  - Existing status enum values such as `cleaning`, `ready`, pickup/delivery route language, and ready-photo behavior are generic enough for many cleaning categories but may not fit alterations or specialty repairs.
  - Provider assignment currently operates at company membership level; category-specific provider eligibility needs careful additive rules to avoid blocking existing dispatch.
  - Some older duplicate mobile screens still contain shoe-specific copy and hardcoded flows; active routes should be migrated first, then legacy surfaces retired or updated.
