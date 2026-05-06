## ADDED Requirements

### Requirement: The system shall provide a real hosted checkout flow in service mode
The system SHALL support a real customer payment handoff in `PAYMENT_MODE=service` using the existing payment service and hosted checkout session flow.

#### Scenario: Customer confirms an appointment in service mode
- **WHEN** a customer confirms an appointment hold while `PAYMENT_MODE=service`
- **THEN** the API creates an appointment with coherent payment metadata
- **AND** the response includes a real checkout URL for the hosted payment step
- **AND** the appointment is not silently auto-confirmed before payment succeeds

#### Scenario: Service mode is misconfigured
- **WHEN** `PAYMENT_MODE=service` is enabled without the required payment service or non-placeholder return URLs
- **THEN** appointment confirmation fails clearly
- **AND** the system does not silently fall back to mock behavior

### Requirement: Customers shall have an intentional post-checkout verification path
The system SHALL let customers continue the booking flow after opening hosted checkout without relying on ambiguous background behavior.

#### Scenario: Customer returns after completing checkout
- **WHEN** the customer returns from hosted checkout and requests a payment refresh
- **THEN** the API re-checks payment status using the existing payment foundation
- **AND** a successful payment is reflected coherently on the appointment

#### Scenario: Customer returns before payment succeeds
- **WHEN** the customer requests a payment refresh before payment has completed
- **THEN** the appointment remains in a coherent unpaid state
- **AND** the app can continue showing next-step guidance instead of a broken or terminal state

### Requirement: Customers shall be able to cancel an unpaid service-mode booking cleanly
The system SHALL provide a narrow cancel path for unpaid service-mode appointments so checkout cancellation does not leave ambiguous partial bookings.

#### Scenario: Customer cancels an unpaid service-mode appointment
- **WHEN** a customer cancels a service-mode appointment whose payment has not succeeded
- **THEN** the appointment transitions to a cancelled state
- **AND** the payment metadata no longer presents an active checkout handoff

#### Scenario: Paid appointments cannot be cancelled through the unpaid cancel path
- **WHEN** the customer attempts to use the unpaid cancel path after payment has already succeeded
- **THEN** the API rejects the request
- **AND** the appointment remains coherent

### Requirement: Mobile service-mode payment UX shall be explicit and trustworthy
The system SHALL present service-mode payment as a deliberate step, not a hidden browser jump or indefinite wait.

#### Scenario: Mobile app receives a service-mode checkout response
- **WHEN** the app receives an appointment response with `payment_mode=service` and a checkout URL
- **THEN** the app shows explicit payment actions and messaging
- **AND** the customer can open checkout, refresh payment status, or cancel the unpaid booking

#### Scenario: Mobile app remains compatible with mock mode
- **WHEN** the app receives an appointment response with `payment_mode=mock`
- **THEN** the existing explicit mock-mode flow remains available as fallback
- **AND** the app does not force real-payment behavior

### Requirement: Demo documentation shall distinguish real-demo mode from fallback mode
The repository SHALL document the smallest supported real-payment demo setup and what remains intentionally deferred.

#### Scenario: Operator prepares a real-payment demo
- **WHEN** a developer or operator follows the payment setup docs
- **THEN** the docs explain how to run `PAYMENT_MODE=service` with the payment service, Stripe configuration, and return URLs
- **AND** the docs explain that mock mode remains the backup option

#### Scenario: Operator reviews deferred scope
- **WHEN** the payment foundation documentation is read
- **THEN** it clearly states that payouts, refunds, disputes, and broader production hardening are not part of the first real-demo slice
