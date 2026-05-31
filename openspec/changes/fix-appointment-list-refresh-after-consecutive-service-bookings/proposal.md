## Why

Stripe Checkout now opens from service-mode Place Booking, but the customer Appointments tab can still show stale data after the customer completes consecutive booking/payment flows. This makes new appointments appear missing even when the backend created them.

## What Changes

- Ensure customer appointment queries use consistent keys and are invalidated/refetched after booking creation, payment return, payment refresh, and unpaid cancellation.
- Refetch the Appointments tab whenever it receives focus.
- Verify consecutive service-mode bookings are returned by the backend customer appointments endpoint.
- Keep pending-payment and paid service-mode appointments visible with clear payment labels.

## Capabilities

### New Capabilities
- `customer-appointment-list-refresh`: Covers reliable customer appointment list refresh/visibility after service-mode booking and payment state changes.

## Impact

- Mobile booking review/pay, payment result, appointment list, appointment detail, live appointment cache invalidation, and query keys.
- API customer appointment listing and focused backend tests around consecutive service-mode bookings.
- No changes to refunds, payouts, disputes, card management, or Stripe Checkout launch behavior.
