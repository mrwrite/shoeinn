# Demo Seed Address Realism And Owner Provider Home Tab Alignment

## Executive Assessment

The app is already demoable for Helena, Pelham, and Alabaster cleaner conversations, but two details still weaken the first impression:

- seeded companies and appointments use repetitive, locality-light address data
- provider and owner users still reach the operational dashboard through a separate `Control` tab instead of landing on it immediately

These are narrow demo-readiness issues, not architectural gaps. The highest-value fix is to make the seeded local story feel more believable and to make the active mobile landing experience immediately operational for `provider` and `company_admin` users.

## Problem

### Seed credibility gap

`/dev/seed` already creates the right city and company story, but the seeded company and appointment address fields are too sparse and repetitive for a live demo. This hurts:

- owner trust when reviewing jobs
- provider job-card credibility
- customer detail and travel-map surfaces that expect complete address fields

### Navigation mismatch

In the active `RootTabs` flow, the operational dashboards live in a separate `Control` tab while `Home` still points at the customer-style discovery stack. That is the wrong landing experience for local owner/provider demos because:

- the most important operational screen is not first
- the navigation implies an unnecessary split between "Home" and "work"
- the `Control` label adds friction during role switching

## Goals

- Make seeded company and appointment addresses look believable within the existing Pelham, Helena, and Alabaster story.
- Keep seed output deterministic enough that repeated demo resets remain stable.
- Route `provider` users to the provider dashboard on `Home`.
- Route `company_admin` users to the owner command center on `Home`.
- Remove the separate `Control` tab for provider and owner roles.
- Keep customer tab layout and customer home behavior unchanged.

## Non-Goals

- Adding geocoding, external map APIs, or network-based address generation.
- Redesigning customer navigation.
- Reviving inactive legacy stacks such as `CompanyStack`.
- Refactoring unrelated demo seed content beyond address realism.

## Proposed Fix

### Seed data

- Add small local address pools keyed by city and state in `apps/api/app/routers/dev_seed.py`.
- Assign complete company mailing addresses from those pools.
- Assign complete pickup and delivery addresses to seeded appointments using deterministic rotation based on company and appointment order.
- Keep the current Pelham, Helena, and Alabaster narrative and appointment status mix intact.

### Mobile navigation

- Make `HomeTab` role-aware in `apps/mobile/src/navigation/RootTabs.tsx`.
- For `provider` and `company_admin`, render the existing provider stack from `Home`.
- Remove the extra operational `Control` tab for those roles.
- Leave customer tabs and customer `Home` untouched.

## Impact

- Local cleaner demos look materially more credible without increasing setup complexity.
- Provider and owner users land directly on the screen that matters most after login.
- Customer flows remain stable.
