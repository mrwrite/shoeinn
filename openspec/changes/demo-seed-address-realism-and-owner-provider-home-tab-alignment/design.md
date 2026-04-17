# Design

## Overview

This change improves demo readiness in two narrow places:

1. seeded addresses become believable and complete for the existing Alabama demo story
2. `provider` and `company_admin` users land on the operational dashboard through `Home`, with no separate `Control` tab

The implementation should stay on the active runtime paths:

- backend seed logic in `apps/api/app/routers/dev_seed.py`
- active mobile navigation in `apps/mobile/src/navigation/RootTabs.tsx`

## Repo-Grounded Findings

### Seed path

`/dev/seed` already owns the active demo story:

- seeded companies: Pelham, Helena, Alabaster
- seeded staff accounts
- seeded appointments across confirmed, en route, cleaning, ready, and completed

The current seed logic sets company `city`, `state`, and `postal_code`, but it does not populate realistic address lines for companies or appointments. Appointment rows are created with `address_line1`, `address_line2`, `city`, `state`, and `postal_code` left empty even though mobile detail and travel views already read them.

### Mobile navigation

`RootTabs.tsx` is the active authenticated shell. Today it always renders:

- `HomeTab` -> customer `HomeNavigator`
- `ProviderTab` -> operational provider stack for provider and owner roles
- customer `AppointmentsTab`
- `ProfileTab`

The existing provider stack already switches between:

- `ProviderDashboardScreen` for `provider`
- `OwnerDashboardScreen` for `company_admin`

That means the operational Home change does not require new dashboard screens. It only requires routing the right roles to the existing provider stack through `HomeTab` and removing the duplicate tab.

## Seed Address Design

### Address source

Use small local address pools keyed by `(city, state)` with complete safe fake addresses:

- `address_line1`
- optional `address_line2`
- `city`
- `state`
- `postal_code`

These addresses should be believable but obviously synthetic enough to avoid real-customer dependence. No network calls, geocoding, or randomized APIs are needed.

### Determinism

Seed reruns should remain demo-stable. Use deterministic rotation instead of nondeterministic randomness:

- each company receives a fixed address from its city pool
- each appointment receives an address selected by company plus appointment sequence

This preserves variety while keeping resets predictable.

### Story alignment

- company addresses must remain in the seeded company city and state
- appointment addresses must stay within the same city and state story as the company
- address fields must be complete enough for customer detail and travel views to render destination labels cleanly

## Mobile Navigation Design

### Role-aware Home

`HomeTab` becomes role-aware:

- `customer` -> existing `HomeNavigator`
- `provider` -> existing `ProviderNavigator`
- `company_admin` -> existing `ProviderNavigator` with owner dashboard inside

This keeps customer behavior unchanged while making provider and owner Home immediately operational.

### Control tab removal

Remove the separate operational tab for `provider` and `company_admin`.

Implications:

- no duplicate operational destination in the tab bar
- simpler first-run demo story after login
- no new screen logic, because provider and owner detail flows already live in `ProviderNavigator`

### Navigation safety

`ProviderTab` is only referenced from `RootTabs` types today. Customer flows navigate to `HomeTab` and `AppointmentsTab`, not `ProviderTab`. The change therefore only needs:

- `RootTabs.tsx` updates
- navigation type cleanup in `types.ts`

No customer deep-link behavior should change.

## Validation Plan

### Backend

- `POST /dev/seed?reset=true` succeeds
- seeded `Company` rows contain complete believable addresses in Pelham, Helena, or Alabaster
- seeded `Appointment` rows contain complete believable addresses aligned to the intended city and state

### Mobile

- provider role sees provider dashboard on `Home`
- `company_admin` role sees owner command center on `Home`
- neither role sees a `Control` tab
- customer role still sees the existing customer tab layout unchanged
- mobile typecheck passes

## Risks

- Over-randomizing addresses would make the demo feel inconsistent between resets.
- Routing operational roles through `Home` without removing `ProviderTab` would create duplicate tabs and confusion.
- Accidentally changing customer `Home` would broaden scope beyond the stated goal.
