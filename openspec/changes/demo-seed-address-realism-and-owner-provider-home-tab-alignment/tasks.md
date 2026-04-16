# Tasks

## 1. OpenSpec artifacts

- [x] Document the demo seed address realism and Home-tab alignment change.
- [x] Capture requirements for deterministic local addresses and role-aware Home behavior.

## 2. Backend seed realism

- [x] Add deterministic local address pools for Pelham, Helena, and Alabaster in the active `/dev/seed` path.
- [x] Update seeded companies to store complete believable addresses that match their city and state.
- [x] Update seeded appointments to store complete believable addresses with stable variety across the demo story.
- [x] Add backend regression coverage that proves seeded addresses are complete and city-aligned.

## 3. Mobile Home alignment

- [x] Update the active `RootTabs` flow so `provider` and `company_admin` see the operational dashboard on `Home`.
- [x] Remove the separate `Control` tab for `provider` and `company_admin` without changing customer tabs.
- [x] Clean up navigation types or related wiring so the tab change does not leave stale assumptions behind.

## 4. Validation

- [x] Run backend validation for `/dev/seed?reset=true` and the new seed regression coverage.
- [x] Run mobile typecheck.
- [x] Verify provider, `company_admin`, and customer tab behavior against the new routing.
