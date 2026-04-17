# Tasks

## 1. Shared focus-aware refresh behavior

- [x] Add a small reusable helper for focus-aware refetch and optional polling in active screens.
- [x] Keep the helper aligned with the existing React Query and active-navigation patterns.

## 2. Provider dashboard refresh

- [x] Refetch available and my-job queries when the provider dashboard regains focus.
- [x] Add reasonable focused polling for dashboard job lists.
- [x] Tighten claim-related invalidation/refetch so both tabs update immediately after success.

## 3. Provider appointment detail refresh

- [x] Add focus-aware refresh for provider assignment and related active job state.
- [x] Poll only while the provider detail screen is focused and the appointment is still active.
- [x] Tighten invalidation/refetch after claim and status-update actions.

## 4. Customer appointment detail refresh

- [x] Add focus-aware refresh for appointment, assignment, and events queries.
- [x] Poll only while the customer detail screen is focused and the appointment is still active.
- [x] Stop aggressive refresh behavior for terminal appointments.

## 5. Verification

- [x] Run a focused mobile typecheck.
- [x] Verify no legacy/orphaned screens are touched.
- [x] Call out deferred WebSocket/SSE evolution and any remaining real-time debt.
