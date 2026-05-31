## Context

The service payment mode confirms appointments through the booking API and creates a Stripe Checkout session through `apps/payment`. The confirm response can contain `payment_checkout_url`, `payment_status`, `payment_mode`, and a payment message, but the mobile booking flow must explicitly open the URL and keep the appointment recoverable when the user cancels or abandons checkout.

The customer appointments list and detail screens are the recovery surface. They must include pending-payment appointments and expose actions to open checkout, refresh payment status, or cancel an unpaid booking.

## Goals / Non-Goals

**Goals:**
- Open Stripe Checkout immediately after Place Booking succeeds for secure-checkout payment selection.
- Keep pending-payment service-mode appointments visible in the customer appointment list.
- Make payment status and recovery actions obvious from list and detail surfaces.
- Keep cache invalidation aligned after booking, refresh, cancel, and return.
- Preserve mock-mode booking behavior.

**Non-Goals:**
- Full card management.
- Refunds, disputes, payouts, settlement, or backoffice reconciliation.
- New payment providers.
- Database schema changes unless an existing endpoint is filtering out required rows.

## Decisions

- Treat the confirm response as the source of truth for initial checkout launch. If service mode returns `payment_checkout_url`, mobile opens it immediately when secure checkout was selected.
- Keep manual checkout opening on appointment detail as fallback and recovery path. This covers cancelled browser sessions, failed deep links, or users leaving Checkout.
- List pending-payment appointments in the same appointment list with visible payment state rather than hiding them behind a separate surface. This keeps the demo path simple and prevents bookings from feeling lost.
- Invalidate/refetch customer appointment queries after booking creation and payment status mutations. This avoids relying on navigation remount behavior.
- Prefer endpoint/test fixes over mobile-side filtering if pending-payment appointments are missing from `/appointments/mine`.

## Risks / Trade-offs

- Browser checkout launch can fail on some platforms -> keep the detail-screen fallback and show a clear error when launch or URL generation fails.
- Pending-payment appointments may look like active work before payment is complete -> label payment state clearly and keep service-mode actions attached.
- Query invalidation requires consistent query keys -> centralize around existing mobile query keys rather than adding parallel cache names.
