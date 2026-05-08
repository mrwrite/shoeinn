# Fix Stripe Checkout Default Card And Return Flow

## Why

The demo-ready real payment path now creates successful Stripe payments, but the hosted Checkout experience still feels incomplete:

- Checkout Sessions are created without a Stripe Customer, so saved/default card reuse is unavailable.
- Hosted success and cancel returns land on a static browser page, which leaves Cash App Pay and bank-style redirect flows stranded outside the ShoeInn app.

This change hardens those two user-facing gaps without expanding into full production payment-method management.

## What Changes

- Persist and reuse Stripe Customer identity in `apps/payment` when ShoeInn has a customer email.
- Create Checkout Sessions against that Stripe Customer and enable Stripe-supported saved payment method behavior where Checkout allows it.
- Make API-hosted success/cancel return pages parameterized with booking/session context and capable of reopening ShoeInn through a configured app-return URL.
- Add mobile deep-link handling for payment returns so the app lands on the appointment detail flow and refreshes payment state after return.
- Keep manual payment refresh, webhook support, and mock mode intact.

## Impact

- `apps/payment` models, router, Stripe client, and tests.
- `apps/api` payment gateway, return route, env docs, and tests.
- `apps/mobile` deep-link handling and appointment payment-return UX.
