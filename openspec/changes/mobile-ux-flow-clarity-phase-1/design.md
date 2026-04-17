# Design

## Overview

This phase implements the highest-value clarity improvements from `mobile-ux-flow-clarity-improvements` using the active mobile appointment flows that are already mounted under `RootTabs`.

The design stays incremental:

- reuse the existing screens,
- reuse current API contracts where possible,
- preserve existing provider and customer functionality,
- and improve understanding through hierarchy, labeling, and feedback instead of a broad visual redesign.

## Active Surface Boundaries

Implementation applies only to the active mobile flow:

- `RootTabs -> ProviderTab -> ProviderDashboardScreen`
- `RootTabs -> ProviderTab -> ProviderAppointmentDetailScreen`
- `RootTabs -> AppointmentsTab -> AppointmentListScreen -> customer/AppointmentDetailScreen`

Legacy or overlapping screens such as `CustomerStack`, `customer/MyAppointmentsScreen.tsx`, `appointments/AppointmentDetailScreen.tsx`, and `company/*` should not receive new UX behavior as part of this change unless needed to remove a direct active-flow dependency.

## Current Problems To Solve

### Provider detail

- The provider detail screen places details first and status actions last, which hides the recommended next step below supporting information.
- Status transitions are rendered as a flat button list, making likely next actions and edge actions feel equally important.
- Claim and assignment understanding depends on request behavior rather than explicit product-state mapping.

### Customer detail

- The customer detail screen leads with overview and sometimes proof content before clearly answering "what is happening now?" and "who is handling this?"
- Provider assignment failure and unassigned states are conflated.
- The timeline does not need a full redesign in this phase, but the screen hierarchy should stop forcing users through secondary content before primary status information.

### Provider dashboard feedback

- Claim outcomes currently rely on alerts, which are transient and disconnected from ongoing screen state.
- The active list/card flow needs inline messaging for success, no-longer-available, and retryable failure outcomes.

### Navigation/type ownership

- The active customer detail screen is mounted from `RootTabs`, but its props are typed from `CustomerStack`.
- This is not a direct runtime bug, but it keeps the active flow coupled to a legacy stack abstraction and makes future changes harder to scope.

## Interaction Model

### Provider detail target structure

```text
+----------------------------------+
| Service name                     |
| Current state summary            |
| Primary next action              |
+----------------------------------+
| Assignment                       |
| Explicit assignment state        |
| Optional claim / claim message   |
+----------------------------------+
| Other updates                    |
| Secondary status transitions     |
+----------------------------------+
| Travel / logistics               |
+----------------------------------+
| Secondary details                |
+----------------------------------+
```

Key rules:

- show the current state and recommended next action before the rest of the detail content,
- derive one recommended next action from the current appointment status when possible,
- keep other status transitions available but visually secondary,
- and keep ready-photo guidance visible near the relevant action.

### Customer detail target structure

```text
+----------------------------------+
| Service                          |
| Current status                   |
| What happens next                |
+----------------------------------+
| Provider                         |
| Assigned / unassigned / issue    |
+----------------------------------+
| Travel or progress content       |
+----------------------------------+
| Proof content when relevant      |
+----------------------------------+
| Secondary appointment details    |
+----------------------------------+
```

Key rules:

- make status summary and provider state appear above secondary details,
- distinguish `not yet assigned` from `unable to load provider status`,
- keep the existing timeline data, but let it appear after the top-level summary and provider state.

## State Model

### Provider assignment states

- `assigned_to_me`
- `assigned_to_other`
- `unassigned`
- `assignment_unavailable`

These states must be derived intentionally from query results, not shown as raw fetch behavior. A `404` may map to `unassigned`, but the mapping must happen in screen logic and the UI must show product language only.

### Customer assignment states

- `assigned`
- `unassigned`
- `assignment_unavailable`

Customer detail should never show `Not yet assigned` solely because the assignment request failed.

### Claim feedback states

Provider dashboard and provider detail should support inline feedback for:

- claim succeeded and the appointment is now assigned to the provider,
- claim conflict or no-longer-available outcome,
- retryable claim failure.

These messages should appear inline within the active screen surface and clear naturally when the underlying state refreshes or the user changes context.

## Navigation and Typing Direction

Phase 1 should move active customer detail typing toward navigation types owned by the active flow rather than `CustomerStack`.

Acceptable implementation options:

- define the appointment-detail params in shared active navigation types and update the active screen to use them,
- or otherwise remove the active screen's direct type dependency on `CustomerStack` without changing legacy flow behavior.

This is intentionally a limited cleanup, not a navigation rewrite.

## Risks

- Over-aggressive action pruning could accidentally remove provider capabilities, so secondary updates must stay available.
- Claim feedback can become stale if not tied to refreshed query data.
- Type cleanup must not break existing navigation param compatibility for the active stack.

## Validation

Implementation should verify:

- providers can identify the current job state and primary next step near the top of detail,
- providers can still access all existing status updates,
- customers see current status and provider state before secondary details,
- assignment fetch failures are distinct from true unassigned states,
- claim outcomes are visible inline in the active provider flow,
- and the active customer detail screen no longer depends directly on `CustomerStack` types.
