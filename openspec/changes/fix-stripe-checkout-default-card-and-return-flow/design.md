# Design

## Decisions

### 1. Persist Stripe Customer identity in the payment service

- Add a small `payment_customers` table keyed by tenant plus normalized customer email.
- Store the Stripe Customer id on both the reusable mapping row and each payment row for traceability.
- Create a Stripe Customer lazily when Checkout is requested for a known email that lacks a mapping.

Rationale:

- ShoeInn currently has no persisted Stripe Customer id anywhere.
- Reusing a Stripe Customer is the minimum requirement for Checkout to surface saved payment methods.

### 2. Implement the closest Stripe-supported saved-card behavior

- Pass `customer` when available on Checkout Session creation.
- Enable `saved_payment_method_options.payment_method_save`.
- Allow redisplay filters for saved methods.

Rationale:

- Stripe Checkout `payment` mode does not let ShoeInn force an arbitrary default card.
- The closest correct behavior is to reuse the Stripe Customer and let Checkout prefill eligible saved cards.

### 3. Keep hosted Checkout returns on an API page, then reopen the app

- Keep `PAYMENT_CHECKOUT_SUCCESS_URL` and `PAYMENT_CHECKOUT_CANCEL_URL` as explicit browser URLs.
- Append booking ID, return status, and `{CHECKOUT_SESSION_ID}` to those URLs.
- Add optional `PAYMENT_RETURN_APP_URL` for reopening the app from the API-hosted return page.

Rationale:

- Redirect-based methods such as Cash App Pay and bank flows already depend on browser/app switching.
- An API page can render a clear fallback and also attempt a deep-link/open-app handoff.

### 4. Handle payment-return URLs inside the mobile shell

- Register a stable app scheme for dev builds.
- Listen for incoming `payment-return` URLs.
- Navigate to the customer appointment detail screen and auto-refresh payment state once.

Rationale:

- The booking flow already has a reliable authenticated appointment detail screen with payment actions.
- Reusing that screen preserves manual refresh fallback and avoids adding a bespoke confirmation route.

## Risks

- Expo Go does not provide the same stable custom-scheme behavior as a dev build or standalone app.
  Mitigation: document `PAYMENT_RETURN_APP_URL` as either a custom scheme or an explicit `exp://.../--/payment-return` URL.
- Stripe Checkout `payment` mode may still prefill the newest eligible card rather than a user-chosen "default card."
  Mitigation: document that limitation and implement the closest Stripe-supported behavior.
