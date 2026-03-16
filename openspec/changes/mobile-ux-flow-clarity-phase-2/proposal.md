# Mobile UX Flow Clarity Phase 2

## Summary

Implement the next incremental UX clarity improvements for the active mobile provider and customer appointment flows. This phase focuses on progress visibility, dashboard scannability, and more intentional loading, empty, and error states while staying inside the active `RootTabs`-based flow and reusing current API contracts.

## Problem

Phase 1 improved assignment-state clarity, provider detail hierarchy, customer detail hierarchy, and inline provider claim feedback. The remaining high-value issues in the active flow are:

- the customer timeline still treats all reached states similarly and does not clearly distinguish current, completed, upcoming, and terminal states,
- provider dashboard tabs still rely heavily on their labels and generic list cards instead of fast-scanning summaries, counts, and stronger card hierarchy,
- provider dashboard cards still make users parse too much to answer basic questions such as what the job is, when it is, where it is, and whether they can act on it,
- and active loading, empty, and error states still feel generic rather than intentionally tailored to provider and customer needs.

## Goals

- Make customer progress easier to understand at a glance.
- Make the active provider dashboard faster to scan and compare.
- Clarify whether a provider can act on a dashboard item using existing data.
- Improve trust with more intentional loading, empty, and error states.
- Keep all changes within the active `RootTabs` provider and appointment flows.

## Non-Goals

- Redesigning the entire app or replacing the design system.
- Adding backend fields unless absolutely necessary.
- Expanding work into legacy or orphaned navigation stacks.
- Reworking provider detail beyond what is needed to support dashboard and progress consistency.

## Scope

### In scope

- `apps/mobile/src/components/AppointmentCard.tsx`
- `apps/mobile/src/screens/provider/ProviderDashboardScreen.tsx`
- `apps/mobile/src/screens/customer/AppointmentDetailScreen.tsx`
- active shared UI/state/navigation files touched by those screens if needed

### Out of scope

- legacy appointment or customer stacks
- `apps/mobile/src/screens/company/*`
- broad navigation rewrites
- backend contract changes unless no reasonable UI-only approach exists

## Proposed Approach

- Redesign the customer status timeline into explicit current, completed, upcoming, and terminal visual treatments using existing status and event data.
- Add tab counts, summary copy, and clearer list-state affordances to the provider dashboard.
- Strengthen appointment card hierarchy so the most important scanning information is clearer and claimability is more explicit.
- Improve loading, empty, and error states with role-aware copy and more intentional layouts.

## Impact

- Customers should understand current progress and what comes next without mentally decoding the timeline.
- Providers should distinguish `Available jobs` from `My jobs` faster and scan each list more efficiently.
- The active flow should feel more trustworthy because state transitions and list states are communicated more deliberately.
