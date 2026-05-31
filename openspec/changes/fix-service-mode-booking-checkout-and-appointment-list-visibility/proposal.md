## Why

Service-mode booking currently lets customers place a booking without reliably launching Stripe Checkout, and pending-payment bookings can appear to vanish from the appointments list. This breaks the demo-critical payment path and leaves users without a clear way to continue or recover payment.

## What Changes

- Launch Stripe Checkout immediately after a successful Place Booking action when the customer selected secure checkout and the API returns a checkout URL.
- Surface a clear error when service mode expects checkout but the confirm response does not include a checkout URL.
- Keep newly created pending-payment appointments visible in the customer appointments list.
- Show clear payment status affordances on list/detail screens for pending, failed, paid, and cancelled/unpaid states.
- Ensure booking creation, payment refresh, payment cancellation, and payment return flows invalidate/refetch customer appointment queries.
- Verify backend confirm and customer appointment endpoints expose service-mode payment state needed by the mobile UI.

## Capabilities

### New Capabilities
- `service-mode-booking-checkout-recovery`: Covers service-mode checkout launch, pending-payment appointment visibility, and customer recovery actions.

### Modified Capabilities

## Impact

- Mobile booking review/pay, confirmation, appointment list, appointment detail, navigation, appointment cache invalidation, and appointment payment types.
- API appointment confirmation, customer appointment listing, payment refresh/cancel behavior, and related tests.
- No full card management, refunds, payouts, disputes, or marketplace settlement changes.
