## 1. Investigation

- [x] 1.1 Trace customer appointment query keys, invalidation paths, and focus behavior in mobile.
- [x] 1.2 Verify backend customer appointment listing includes consecutive service-mode bookings.
- [x] 1.3 Check payment return, refresh, cancel, and booking creation paths for stale or mismatched cache invalidation.

## 2. Backend Coverage

- [x] 2.1 Add or update backend tests proving two consecutive service-mode bookings appear in the customer appointments endpoint with payment fields.
- [x] 2.2 Fix the customer appointment list endpoint if pending or paid service-mode appointments are filtered out.

## 3. Mobile Refresh And Visibility

- [x] 3.1 Centralize or align customer appointment query keys.
- [x] 3.2 Ensure booking creation invalidates/refetches the customer appointments list.
- [x] 3.3 Ensure payment return, payment refresh, and unpaid cancellation invalidate/refetch customer appointments.
- [x] 3.4 Ensure the Appointments tab refetches on focus.
- [x] 3.5 Preserve pending/paid/failed payment labels and detail recovery actions.

## 4. Validation

- [x] 4.1 Run focused backend tests for consecutive service-mode appointment list visibility.
- [x] 4.2 Run mobile typecheck.
- [x] 4.3 Summarize root cause, changed files, final cache/refetch behavior, and validation results.
