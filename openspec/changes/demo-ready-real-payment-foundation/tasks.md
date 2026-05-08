# Tasks

## 1. Service-mode backend foundation

- [x] 1.1 Tighten `PAYMENT_MODE=service` validation so real checkout mode fails clearly when the payment service or return URLs are not configured for demos.
- [x] 1.2 Add narrow appointment payment actions for service mode, including on-demand payment refresh and clean unpaid cancellation.
- [x] 1.3 Add lightweight API-hosted payment return pages or equivalent service-mode browser UX support for checkout success/cancel.

## 2. Mobile real-payment flow

- [x] 2.1 Update the active booking flow so service mode presents explicit payment actions instead of only opening checkout and waiting ambiguously.
- [x] 2.2 Ensure customers can open checkout, verify payment completion, and cancel unpaid bookings from the active mobile path.
- [x] 2.3 Preserve the existing explicit mock-mode path as fallback without hidden fallback behavior.

## 3. Validation and documentation

- [x] 3.1 Add focused backend tests for service-mode confirmation, payment refresh, and unpaid cancel behavior using the existing payment foundation.
- [x] 3.2 Update payment-related docs and env examples for the smallest supported real-demo payment setup and what remains deferred.
- [x] 3.3 Run relevant backend payment tests and mobile typecheck, then summarize the real payment slice and remaining hardening work.
