# Design

## Context

ShoeInn already has a meaningful payment foundation:

- `apps/api` owns appointment creation and stores shadow payment fields on `Appointment`.
- `apps/payment` is a separate Stripe-capable service that can create checkout sessions, persist payment records, and process Stripe webhooks.
- `apps/api/app/workers/payment_sync.py` polls `apps/payment` and reconciles payment state back into appointment records when `PAYMENT_MODE=service`.
- `PAYMENT_MODE=mock` already exists as the explicit fallback mode, and `PAYMENT_MODE=service` already routes checkout creation through `apps/payment`.

The missing part is the demo-quality real-payment flow. The current service-mode path can create a real checkout URL, but the customer journey after opening Stripe Checkout is still weak:

- success and cancel return URLs are not strongly validated or documented for real demo use,
- the mobile app opens checkout but does not provide a deliberate service-mode “return and verify” experience,
- the app relies mostly on polling and background sync without a clear user-facing payment step,
- and there is no focused unpaid-booking cancel path for a customer who abandons or cancels checkout.

That means the repo already contains the right core architecture for a small real-payment demo, but the experience needs a narrow layer of intent and reliability.

## Goals / Non-Goals

**Goals:**

- Use the existing `apps/payment` service as the real payment path for demos.
- Preserve `PAYMENT_MODE=mock` as explicit fallback behavior.
- Make `PAYMENT_MODE=service` feel intentional and trustworthy in the mobile booking flow.
- Ensure payment success can be reflected coherently in appointment state without building a full payment platform.
- Handle checkout open, return/verification, and unpaid cancel paths cleanly enough for live demos.
- Fail clearly when real-payment mode is misconfigured.

**Non-Goals:**

- Building marketplace payouts, split payments, or provider settlements.
- Implementing a full refund/dispute/operator backoffice in `apps/api`.
- Replacing the existing payment service with a new direct-Stripe integration in `apps/api`.
- Designing a full browser/app deep-link callback platform.

## Decisions

### 1. Use `apps/payment` plus Stripe Checkout as the single real demo payment path

Decision:

- Treat `PAYMENT_MODE=service` as “Stripe Checkout Lite” backed by `apps/payment`.
- Keep `apps/api` responsible for appointment creation and appointment payment shadow fields.

Rationale:

- This reuses the strongest existing foundation instead of duplicating payment logic.
- `apps/payment` already supports checkout-session creation and webhook-based status changes.
- The API already knows how to reconcile those statuses back into appointments.

Alternatives considered:

- Move Stripe checkout directly into `apps/api`.
  - Rejected because it duplicates existing service behavior and increases risk.
- Build on payment intents instead of checkout sessions.
  - Rejected because hosted Checkout is narrower and safer for demos.

### 2. Add an explicit service-mode payment follow-up experience in mobile

Decision:

- After service-mode appointment confirmation, the mobile flow will present a deliberate payment step with:
  - an “Open secure checkout” action,
  - a “Check payment status” action,
  - and a “Cancel booking” action for unpaid appointments.

Rationale:

- The customer needs a clear way to continue after leaving Stripe Checkout.
- This avoids dead-end or opaque background waiting.
- It is narrower and less fragile than building full deep-link return handling.

Alternatives considered:

- Rely entirely on automatic background polling after opening checkout.
  - Rejected because browser/app transitions are too ambiguous in live demos.
- Build deep-link callbacks immediately.
  - Rejected because it adds more moving parts than needed for the first real slice.

### 3. Add a narrow synchronous payment refresh path in `apps/api`

Decision:

- Add an appointment-scoped payment refresh action in `apps/api` for service mode.
- The mobile app will use it to re-check payment status on demand after checkout.

Rationale:

- The existing background sync worker is helpful, but manual refresh gives deterministic demo control.
- It reduces the chance that a successful Stripe payment still looks pending in the app during a live walkthrough.

Alternatives considered:

- Depend only on the background payment sync worker.
  - Rejected because it adds timing ambiguity in the demo.

### 4. Add an unpaid-booking cancel path instead of leaving partial service-mode appointments hanging

Decision:

- Add a narrow customer-facing cancel action for unpaid service-mode appointments.

Rationale:

- Cancelled checkout should not leave the user stuck with an unexplained requested/pending appointment.
- This creates a clean cancel story without pretending to have full payment lifecycle management.

Alternatives considered:

- Let unpaid bookings expire only through existing hold expiry behavior.
  - Rejected because it is too slow and confusing for a demo.

### 5. Validate service-mode return URLs and document API-hosted return pages

Decision:

- Add lightweight API-hosted success/cancel return pages for browser UX.
- In service mode, fail clearly if checkout success/cancel URLs are still placeholder defaults.

Rationale:

- A customer returning from Stripe should see an intentional ShoeInn page, not `example.com`.
- Clear misconfiguration failure is safer than a misleading half-configured real-payment demo.

Alternatives considered:

- Keep example URLs and rely on operator explanation.
  - Rejected because it undermines trust in the real-payment demo path.

## Risks / Trade-offs

- [Risk] Service mode still depends on Stripe webhook delivery to `apps/payment`. → Mitigation: keep the sync worker, add manual refresh in the app/API, and document webhook setup as part of service-mode demo prep.
- [Risk] Without full deep-linking, users still leave the app for Checkout. → Mitigation: make the return flow explicit with app-side refresh and API-hosted browser return pages.
- [Risk] Unpaid cancellation uses a simple booking-state rule rather than a rich payment domain model. → Mitigation: scope it strictly to unpaid requested service-mode appointments.
- [Risk] Real-payment setup is more fragile than mock mode. → Mitigation: preserve `PAYMENT_MODE=mock` as explicit backup and make service misconfiguration fail early.

## Migration Plan

1. Keep `apps/payment` as the Stripe integration surface.
2. Tighten `PAYMENT_MODE=service` validation in `apps/api`.
3. Add narrow API routes for payment refresh, unpaid cancel, and simple payment return pages.
4. Update the mobile booking flow to show explicit service-mode payment actions.
5. Add focused backend tests for service-mode booking confirmation, refresh, and cancel behavior.
6. Update payment docs and env examples for real-demo setup, including return URLs and webhook expectations.

Rollback:

- Switch back to `PAYMENT_MODE=mock` and stop using the service-mode UI/actions.
- The change is additive around the existing payment foundation, so rollback is operationally simple.

## Open Questions

- None for the first slice. The single best immediate strategy is hosted Stripe Checkout through `apps/payment`, plus explicit service-mode follow-up UX and clear config validation.
