# Payment Workflow Evaluation And Demo Mock Mode

## Why

ShoeInn is currently demoable only because the main API silently falls back to stub payment behavior when `PAYMENT_SERVICE_BASE_URL` is unset. That keeps booking unblocked, but it leaves the real payment architecture ambiguous across API, mobile, and the optional Stripe payment service, which is risky for cleaner-owner demos and staging.

This change is needed now to turn that implicit behavior into an explicit, deterministic, demo-safe payment mode, while documenting what actually exists in the repo and what still remains for later real payment integration.

## What Changes

- Evaluate and document the current payment workflow across `apps/api`, `apps/mobile`, and `apps/payment`, including what currently works, what is incomplete, and what is misleading for demos.
- Introduce explicit payment mode configuration in the main API so demo/staging behavior is intentional instead of inferred from a missing payment service URL.
- Implement a demo-safe mock payment path that preserves the booking flow without requiring `apps/payment` or real Stripe setup.
- Expose payment mode and payment-state messaging in API responses so clients can explain simulated payment behavior clearly.
- Update active mobile booking and confirmation surfaces to make mock/demo payment behavior explicit and avoid dead-end checkout behavior.
- Tighten documentation and validation around local/staging payment expectations, especially that the separate payment service remains optional for demos.
- Add focused backend tests for the configured demo payment mode and keep existing service-backed payment integration paths intact for future hardening.

## Capabilities

### New Capabilities

- `payment-demo-mode`: Explicit, config-driven payment behavior for demo/staging booking flows, including mock-mode API/mobile clarity and repo-grounded payment workflow expectations.

### Modified Capabilities

- None.

## Impact

- Affected backend code in `apps/api/app/core`, `apps/api/app/routers`, `apps/api/app/services`, `apps/api/app/schemas`, and payment-related tests.
- Affected mobile code in `apps/mobile/src/api`, `apps/mobile/src/types`, and active booking/confirmation screens.
- Affected documentation in payment-related README/staging files and API env examples.
- `apps/payment` remains available for later real integration, but this change makes it clearly optional for demo/local flows.
