# Mobile UX Flow Clarity Phase 1

## Summary

Implement a first, incremental pass of the mobile UX clarity recommendations for the active appointment flows. This phase focuses on improving screen hierarchy, assignment-state clarity, and inline interaction feedback in the active `RootTabs` provider and customer appointment experiences without changing backend contracts or performing a broad visual redesign.

## Problem

The current active mobile appointment flows make users work too hard to understand system state and next steps.

Observed issues in the active code path:

- provider appointment detail presents details, assignment state, and status updates as separate cards without making the recommended next action obvious,
- provider and customer detail screens infer product state from request failures or `404` semantics instead of presenting explicit assignment states,
- customer appointment detail places details and proof content ahead of the user's primary questions about current status and assigned provider,
- provider claim and conflict outcomes are surfaced primarily as alerts instead of inline stateful feedback,
- and active screens still have a type/navigation dependency on `CustomerStack` types even though the active customer flow is mounted from `RootTabs`.

## Goals

- Rework active provider detail around current state, primary next action, and secondary supporting information.
- Make assignment states explicit on both provider and customer detail screens.
- Move current status and assigned-provider information above the fold on customer appointment detail.
- Replace alert-only claim/conflict feedback with inline messaging in the active provider flow.
- Keep all implementation inside the active `RootTabs` mobile flow and avoid extending legacy stacks.

## Non-Goals

- Redesigning the entire mobile visual language.
- Introducing new backend APIs or changing existing response contracts unless unavoidable.
- Reworking legacy or orphaned appointment stacks into first-class flows.
- Changing unrelated booking, payments, authentication, or admin surfaces.

## Scope

### In scope

- `apps/mobile/src/screens/provider/ProviderDashboardScreen.tsx`
- `apps/mobile/src/screens/provider/ProviderAppointmentDetailScreen.tsx`
- `apps/mobile/src/screens/customer/AppointmentDetailScreen.tsx`
- `apps/mobile/src/components/AppointmentCard.tsx`
- `apps/mobile/src/navigation/RootTabs.tsx`
- active shared navigation/type/UI/state files used by those screens

### Out of scope

- `apps/mobile/src/screens/company/*`
- `apps/mobile/src/navigation/CustomerStack.tsx` behavior changes beyond removing active-flow dependency pressure
- legacy/orphaned appointment flows except where they need to be avoided or documented

## Proposed Approach

- Keep the current active screens and existing data-fetching contracts, but reorganize the provider and customer detail layouts for clarity.
- Introduce deliberate assignment-state handling that distinguishes unassigned, assigned, and unavailable/error conditions without exposing transport semantics directly to users.
- Move claim success/conflict/unavailable feedback into inline, screen-level messaging that updates with query state.
- Isolate active navigation types from legacy `CustomerStack` type ownership where needed so the active flow can evolve independently.

## Impact

- Providers should see what state an appointment is in and what they should do next without scanning a wall of equal-weight actions.
- Customers should see current status and provider assignment immediately when opening appointment detail.
- Claiming behavior should feel like an understandable state change instead of a generic alert outcome.
- The active mobile flow should be easier to maintain because it no longer depends on legacy stack typing for core screens.
