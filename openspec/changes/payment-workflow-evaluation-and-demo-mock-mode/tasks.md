# Tasks

## 1. Payment mode contract

- [x] 1.1 Add explicit API payment mode configuration with support for `mock`, `service`, and legacy `stub` alias handling.
- [x] 1.2 Refactor the API payment gateway and booking confirmation flow to branch on explicit payment mode instead of inferring stub behavior from a missing service URL.
- [x] 1.3 Ensure mock mode produces coherent appointment payment state without checkout URLs or ambiguous pending-payment records.

## 2. API and mobile clarity

- [x] 2.1 Extend appointment API responses with additive payment mode and human-readable payment messaging fields.
- [x] 2.2 Update the active mobile booking and confirmation screens to make mock-mode payment explicit and avoid dead-end checkout or polling behavior.
- [x] 2.3 Keep service-backed payment handoff behavior intact for future real payment integration when `PAYMENT_MODE=service`.

## 3. Documentation and validation

- [x] 3.1 Update payment-related env examples and docs to recommend explicit mock mode for demos and staging while keeping `apps/payment` optional.
- [x] 3.2 Add focused backend tests covering mock-mode booking confirmation and payment-state coherence.
- [x] 3.3 Run relevant backend tests and the mobile typecheck, then summarize the remaining backlog for real payment hardening.

## 4. Service-mode Stripe Checkout reconciliation hardening

- [x] 4.1 Reconcile live Stripe Checkout Session state during service-mode payment refresh so `payment_status=paid` maps to internal `succeeded` even when webhooks are unavailable.
- [x] 4.2 Keep open unpaid checkout sessions non-terminal and map expired checkout sessions to failed payment state without regressing mock mode.
- [x] 4.3 Add focused tests and local Stripe CLI webhook-forwarding notes for the hardened service-mode flow.
