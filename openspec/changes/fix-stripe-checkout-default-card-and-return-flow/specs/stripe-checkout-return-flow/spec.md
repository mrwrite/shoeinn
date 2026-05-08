## ADDED Requirements

### Requirement: Checkout Sessions shall reuse Stripe Customer identity when available
The payment service SHALL create Checkout Sessions against a persisted Stripe Customer when ShoeInn has a reusable customer identity for the booking.

#### Scenario: Customer email is known
- **WHEN** ShoeInn creates a Checkout Session for a booking with a customer email
- **THEN** the payment service persists or reuses a Stripe Customer id for that email within the tenant
- **AND** the Checkout Session is created with that Stripe Customer

#### Scenario: No reusable identity exists yet
- **WHEN** ShoeInn creates a Checkout Session for a booking with a customer email that has no local Stripe Customer mapping
- **THEN** the payment service creates a Stripe Customer and persists the mapping for future sessions

### Requirement: Checkout shall use the closest Stripe-supported saved card behavior
The payment service SHALL enable saved payment method behavior that Stripe Checkout supports without adding a full card-management product surface.

#### Scenario: Returning customer opens Checkout
- **WHEN** Checkout is created with a Stripe Customer that has eligible saved cards
- **THEN** Checkout may prefill or surface those saved cards according to Stripe's hosted Checkout rules
- **AND** ShoeInn SHALL not claim to force an arbitrary default card selection if Stripe Checkout does not support it

### Requirement: Hosted Checkout returns shall support reopening ShoeInn
The API SHALL expose browser-hosted success and cancel pages that carry enough context to reopen ShoeInn or provide a clear manual fallback.

#### Scenario: Successful payment returns through the hosted success page
- **WHEN** Stripe redirects a customer to the configured hosted success URL
- **THEN** the page includes the booking id and Checkout Session id context
- **AND** the page attempts to open ShoeInn through an explicit configured app-return URL when available

#### Scenario: App return is not configured
- **WHEN** the hosted success or cancel page has no configured app-return URL
- **THEN** the page still explains how to return to ShoeInn manually and continue with payment refresh

### Requirement: Mobile shall handle payment-return URLs without trapping the customer
The mobile app SHALL handle incoming payment-return URLs and land the user in a flow that can complete payment reconciliation.

#### Scenario: Successful payment return opens the app
- **WHEN** the app receives a `payment-return` URL with a booking id after Checkout success
- **THEN** the app navigates to the customer appointment detail flow for that booking
- **AND** it attempts to refresh payment state once automatically
- **AND** manual payment refresh remains available if the payment is still non-terminal

#### Scenario: Cancel return opens the app
- **WHEN** the app receives a `payment-return` URL after Checkout cancellation
- **THEN** the app lands the user in a payment-aware appointment flow without falsely marking the booking as paid
