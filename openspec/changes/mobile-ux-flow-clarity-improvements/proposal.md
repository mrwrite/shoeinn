# Mobile UX Flow Clarity Improvements

## Summary

Audit the active mobile provider and customer appointment flows, identify usability and consistency issues, and define an incremental improvement plan for clearer hierarchy, clearer role-specific actions, and more explicit system-state communication.

## Problem

The active mobile app flow already contains the core provider and customer appointment journeys, but the UI currently makes those journeys harder to understand than necessary.

The main issues observed in the active screens are:

- provider list and detail screens split core actions across multiple surfaces without clearly explaining when each action is available,
- provider status controls present many equal-weight actions even when only one next step is likely appropriate,
- customer appointment detail mixes tracking, self-information, provider assignment, and proof-of-completion content without a strong hierarchy,
- system states such as unassigned, loading, conflict, and failed fetch are not consistently distinguished,
- active and legacy screen families still overlap enough to create implementation and product ambiguity,
- and mobile ergonomics suffer from dense button stacks, wide metadata rows, and missing sticky action patterns for important actions.

## Goals

- Identify the most important UX/UI issues in the active provider and customer appointment flows.
- Clarify the difference between provider actions and customer read-only tracking states.
- Define incremental layout and interaction improvements that reuse current routes, components, and backend contracts where possible.
- Standardize the way the app communicates loading, empty, unassigned, conflict, and error states.
- Reduce confusion caused by duplicated or partially overlapping mobile screen families.

## Non-Goals

- Implementing UI code in this change.
- Replacing the current design system or navigation architecture wholesale.
- Redesigning booking, payments, or authentication flows outside the screens touched by this audit.
- Creating a brand-new provider dispatch experience beyond incremental improvements to existing flows.

## Scope

### In scope

- `apps/mobile/src/screens/provider/ProviderDashboardScreen.tsx`
- `apps/mobile/src/screens/provider/ProviderAppointmentDetailScreen.tsx`
- `apps/mobile/src/screens/customer/AppointmentDetailScreen.tsx`
- `apps/mobile/src/screens/appointments/AppointmentListScreen.tsx`
- supporting components that materially affect hierarchy and interaction clarity in those flows
- documentation of legacy or duplicate screen overlap where it affects UX consistency

### Out of scope

- visual redesign of unrelated tabs or booking setup screens
- backend feature additions unrelated to communicating existing state more clearly
- changes to web or admin surfaces

## Proposed Approach

- Capture the audit findings in design artifacts tied to the active mobile flows.
- Define UX requirements for provider dashboard clarity, provider detail action gating, reassignment visibility, customer detail hierarchy, and status timeline behavior.
- Keep recommendations incremental by preferring:
  - stronger copy and section hierarchy,
  - better state labels and empty/error handling,
  - progressive disclosure of advanced actions,
  - and reuse of existing backend fields before requesting new API work.

## Impact

- Providers should understand what is available to claim, what is already theirs, and what action is expected next.
- Customers should understand the current appointment state, whether a provider is assigned, and what happens next without reading the entire screen.
- Future implementation work should be easier to scope because the active flow, desired UX states, and incremental priorities will be explicit.
