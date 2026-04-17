# Mobile Live Job State And Query Refresh

## Summary

Improve the active mobile provider and customer flows so job state changes feel more timely and operationally current through better React Query invalidation, focus-aware refetch behavior, and targeted polling on active screens.

## Problem

The active mobile flows are clearer and more polished than before, but they still depend too much on manual navigation and occasional refreshes for state propagation:

- provider dashboard updates after local actions, but it should also refresh more deliberately when the user returns to it,
- provider appointment detail updates local status for in-screen actions, but assignment and related job-list state can still feel stale,
- customer appointment detail shows better progress and assignment UI, but changes from provider actions can still arrive later than users expect,
- and the current query setup does not consistently treat focused active screens as live operational surfaces.

## Goals

- Make the active provider dashboard refresh appropriately after claims and when returning to the screen.
- Make provider appointment detail feel current without depending on manual refresh.
- Make customer appointment detail update more proactively during active appointments.
- Add focus-aware or state-aware polling using the existing React Query setup.
- Tighten invalidation so successful actions propagate immediately to the right active screens.

## Non-Goals

- Introducing WebSockets, SSE, or push infrastructure in this change.
- Refactoring the backend or changing API contracts unless absolutely necessary.
- Expanding refresh behavior into legacy or orphaned flows.
- Rewriting the app’s query layer or replacing current React Query patterns.

## Scope

### In scope

- `apps/mobile/src/screens/provider/ProviderDashboardScreen.tsx`
- `apps/mobile/src/screens/provider/ProviderAppointmentDetailScreen.tsx`
- `apps/mobile/src/screens/customer/AppointmentDetailScreen.tsx`
- active shared query/focus hooks used by those screens

### Out of scope

- legacy/inactive screen families
- backend real-time transport work
- large query architecture changes

## Proposed Approach

- Add a small reusable active-screen refresh helper for focus-aware refetch and targeted polling.
- Use that helper on the provider dashboard to refetch `open` and `my` jobs on focus and on a reasonable cadence while the screen is active.
- Improve provider appointment detail by polling relevant assignment/list state only while the screen is focused and the job is still operationally active.
- Improve customer appointment detail by polling appointment, assignment, and events data while the appointment is active and the screen is focused.
- Tighten invalidation after provider actions so related active queries are refreshed immediately.

## Impact

- Providers should see new claims and status changes reflected more quickly in the dashboard and detail flows.
- Customers should see status and provider-assignment changes closer to when they actually happen.
- The app should feel more “live” without requiring a heavier backend real-time solution yet.
