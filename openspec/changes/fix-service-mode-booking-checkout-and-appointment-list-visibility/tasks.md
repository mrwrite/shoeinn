## 1. Investigation And Backend Contract

- [x] 1.1 Trace mobile Place Booking behavior for secure checkout selection, checkout URL handling, appointment id preservation, and navigation.
- [x] 1.2 Verify API service-mode confirm response fields and customer appointment list behavior for pending-payment appointments.
- [x] 1.3 Add or adjust backend tests for service-mode checkout URL, pending appointment list visibility, and unpaid booking cancellation.

## 2. Mobile Checkout Launch

- [x] 2.1 Update Review & Pay booking success handling to open `payment_checkout_url` immediately for secure-checkout service-mode bookings.
- [x] 2.2 Show a clear service-mode error when secure checkout was selected but no checkout URL is returned.
- [x] 2.3 Preserve appointment id/payment state through confirmation and return/recovery navigation.

## 3. Mobile Appointment Visibility And Recovery

- [x] 3.1 Ensure customer appointment list includes and labels pending, failed, paid, and cancelled payment states.
- [x] 3.2 Ensure pending-payment appointment detail exposes Open secure checkout, Check payment status, and Cancel unpaid booking actions.
- [x] 3.3 Invalidate/refetch appointment list/detail queries after booking creation, payment refresh, payment cancellation, and payment return handling.

## 4. Validation

- [x] 4.1 Run focused backend payment/hold/customer appointment tests.
- [x] 4.2 Run mobile typecheck.
- [x] 4.3 Document manual service-mode demo validation steps and final behavior.
