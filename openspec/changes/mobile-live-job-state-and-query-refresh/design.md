# Design

## Overview

This change adds lightweight live-state behavior to the active mobile flow using existing React Query primitives and navigation focus awareness. The goal is not full real-time sync, but noticeably better freshness for active operational screens.

## Active Flow Boundary

Implementation remains limited to the active RootTabs-based mobile flow:

- provider dashboard
- provider appointment detail
- customer appointment detail

No legacy/orphaned screens should gain new refresh behavior.

## Design Principles

- Prefer React Query invalidation and `refetch` over new transport layers.
- Poll only when the screen is focused and the entity is still operationally active.
- Keep intervals modest so the UX improves without excessive network churn.
- Reuse existing query keys and API functions.
- Keep follow-up real-time transport work explicitly deferred.

## Refresh Model

### Shared behavior

Introduce a small helper hook for focus-aware refresh:

- refetch once when a screen becomes focused,
- optionally continue polling while the screen stays focused,
- and stop polling when the screen blurs or when the screen’s state no longer needs live updates.

This keeps refresh behavior consistent without duplicating interval logic in every screen.

### Provider dashboard

Dashboard refresh should cover:

- focus return to the screen,
- successful claim actions,
- and light periodic refresh while focused.

Both `["provider", "open"]` and `["provider", "my"]` should stay reasonably fresh so the tabs reflect current operational state even if changes happened elsewhere while the user was away.

### Provider appointment detail

Provider detail should feel current by:

- refetching assignment state on focus,
- polling while the appointment is focused and not terminal,
- invalidating the related provider lists after successful claim or status changes,
- and refreshing those related queries so a return to the dashboard reflects the latest state.

Because this screen still relies partly on route params and local status state, list-cache freshness matters for cross-screen consistency.

### Customer appointment detail

Customer detail should poll only while the appointment is active:

- appointment summary/details,
- assignment state,
- events/timeline data.

Terminal appointments such as `completed` or `cancelled` should stop polling. The customer should still get a refetch on focus return.

## Polling Strategy

Recommended intervals:

- provider dashboard: moderate polling, e.g. around 20-30 seconds while focused
- provider detail: moderate polling, e.g. around 10-15 seconds while focused and active
- customer detail: moderate polling, e.g. around 10-15 seconds while focused and active

These values are deliberately conservative. The change should improve perceived freshness without simulating real-time streaming.

## Invalidation Strategy

After provider actions:

- invalidate and, where useful, immediately refetch provider open and my-job lists,
- invalidate appointment assignment and appointment detail/event queries for the affected appointment,
- keep query-key usage aligned with current active flow patterns.

## Deferred Follow-Up

Future WebSocket or SSE work remains out of scope. This change should explicitly leave that as a later evolution once the app has squeezed the practical value out of query invalidation and focused polling.

## Risks

- Over-polling could create unnecessary network traffic if not gated by focus and active states.
- Provider detail still has some route-param-driven state, so list/query invalidation must be used carefully to avoid drift.
- Shared helper logic must stay minimal so it does not become an accidental second query abstraction.

## Validation

Implementation should verify:

- provider dashboard refreshes on focus and after claim actions,
- provider detail reflects assignment/status changes more proactively,
- customer detail updates status and assignment more proactively for active appointments,
- polling stops for terminal states or unfocused screens,
- and no legacy flows are modified.
