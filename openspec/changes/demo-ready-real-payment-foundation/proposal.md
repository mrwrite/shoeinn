# Demo Ready Real Payment Foundation

## Why

ShoeInn already has real payment building blocks, but today the demo-safe path is still primarily `PAYMENT_MODE=mock`, which means the customer booking flow does not yet feel like a real trusted checkout experience. The repo needs the smallest real payment path that can be demoed end-to-end without overbuilding a production marketplace payment platform.

This change is needed now to convert the existing payment foundation into a narrow, credible live-demo payment workflow using real checkout infrastructure, while preserving mock mode as a deliberate fallback.

## What Changes

- Evaluate the current payment architecture across `apps/api`, `apps/payment`, mobile, tests, and docs to identify the smallest viable real payment path already supported by the repo.
- Implement a real demoable checkout path built on the existing payment service and API appointment payment fields.
- Keep `PAYMENT_MODE=mock` as an explicit fallback, and clarify `PAYMENT_MODE=service` as the intended real-payment mode.
- Tighten the API/mobile contract so service-mode payment states, success, and cancel behavior are understandable instead of ambiguous.
- Add the minimum backend and mobile changes needed so a customer can reach a real checkout step and see payment outcome reflected coherently in appointment state.
- Document what remains intentionally deferred, such as refunds, disputes, payout systems, and broader reconciliation hardening.

## Capabilities

### New Capabilities

- `demo-real-payment-checkout`: A narrow real-payment booking flow for demos, using the existing payment service and explicit payment modes while keeping appointment/payment state coherent.

### Modified Capabilities

- None.

## Impact

- Affected backend code in `apps/api/app/core`, `apps/api/app/routers`, `apps/api/app/services`, `apps/api/app/workers`, and focused tests.
- Affected payment-service code and docs in `apps/payment`.
- Affected mobile booking/payment screens and API types in `apps/mobile/src`.
- Affected payment-related env examples and documentation for local demo and staging setup.
