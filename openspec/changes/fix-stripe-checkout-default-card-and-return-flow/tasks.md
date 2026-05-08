# Tasks

## 1. Stripe Customer identity

- [x] 1.1 Add narrow Stripe Customer persistence in `apps/payment`.
- [x] 1.2 Reuse that Stripe Customer during Checkout Session creation when ShoeInn has a customer email.
- [x] 1.3 Enable the closest Stripe-supported saved payment method behavior and document the remaining Checkout limitation.

## 2. Hosted return flow

- [x] 2.1 Make hosted success/cancel URLs carry booking and session context.
- [x] 2.2 Upgrade the API payment return page so it can reopen ShoeInn through an explicit app-return URL with browser fallback.
- [x] 2.3 Add mobile payment-return handling that routes to the appointment detail screen and refreshes payment state.

## 3. Validation and docs

- [x] 3.1 Add focused payment-service and API tests for customer reuse, return URLs, and payment-return behavior.
- [x] 3.2 Update env examples and docs for `PAYMENT_RETURN_APP_URL`, Expo Go/dev build differences, and Stripe CLI forwarding.
- [x] 3.3 Run the requested backend tests and mobile typecheck, then summarize remaining production-payment limitations.
