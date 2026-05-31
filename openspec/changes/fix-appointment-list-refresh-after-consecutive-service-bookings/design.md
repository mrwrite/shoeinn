## Context

Service-mode bookings create appointments before Stripe Checkout completion. The Appointments tab is the recovery surface for pending payments and the confirmation surface after successful payment. Consecutive bookings can expose stale React Query cache, focus/refetch gaps, or backend filtering issues that are less visible in a single booking flow.

## Goals / Non-Goals

**Goals:**
- Make the customer Appointments tab reliably show all customer-created service-mode appointments after consecutive booking flows.
- Refetch appointment list data when the Appointments tab becomes active.
- Invalidate consistent customer appointment query keys after booking creation and payment state mutations.
- Prove the backend returns consecutive pending/paid service-mode appointments.
- Preserve mock mode and existing Stripe Checkout launch behavior.

**Non-Goals:**
- Full card management.
- Refunds, payouts, disputes, or settlement.
- Reworking navigation architecture beyond the cache/refetch paths needed for appointment visibility.

## Decisions

- Use a centralized query-key helper for customer appointment list data to avoid invalidating a different key than the one used by the list.
- Treat focus refetch as a necessary safety net because payment flows leave and re-enter the app and users can create bookings back-to-back.
- Keep appointment visibility controlled by the backend endpoint and avoid mobile-side filtering that hides pending-payment service-mode appointments.
- Preserve detail-screen recovery actions as the fallback if checkout is cancelled or payment remains pending.

## Risks / Trade-offs

- Additional focus refetches can add network calls, but the Appointments tab is a correctness-critical recovery surface.
- Query invalidation alone may not cover all app-return paths, so focus refetch is intentionally redundant.
