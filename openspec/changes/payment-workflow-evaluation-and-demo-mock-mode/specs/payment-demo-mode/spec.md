## ADDED Requirements

### Requirement: The API shall expose explicit payment operating modes
The system SHALL use an explicit payment operating mode for appointment booking flows instead of inferring simulated behavior only from the presence or absence of `PAYMENT_SERVICE_BASE_URL`.

#### Scenario: Mock mode is configured for demos
- **WHEN** `PAYMENT_MODE` is configured as `mock` or legacy `stub`
- **THEN** the API treats payment as simulated demo behavior
- **AND** the optional external payment service is not required for booking confirmation

#### Scenario: Service mode requires payment service configuration
- **WHEN** `PAYMENT_MODE` is configured as `service`
- **THEN** the API uses the external payment-service contract for checkout and payment reconciliation
- **AND** misconfiguration does not silently degrade into simulated payment behavior

### Requirement: Mock mode shall preserve a coherent end-to-end booking flow
The system SHALL let demo and staging users complete the booking flow in mock mode without ambiguous pending-payment states.

#### Scenario: Booking confirmation succeeds in mock mode
- **WHEN** a customer confirms an appointment hold while the API is running in mock mode
- **THEN** the appointment is returned with `payment_status` indicating success
- **AND** the appointment status advances to a confirmed booking state
- **AND** the payment checkout URL is absent because no external checkout is required

#### Scenario: Mock mode stores coherent payment details
- **WHEN** the API finalizes a booking in mock mode
- **THEN** the appointment stores a deterministic synthetic payment identifier
- **AND** the expected and received amounts remain internally consistent
- **AND** the API does not leave the appointment in a pending or partially-complete payment state

### Requirement: Appointment responses shall explain simulated payment behavior
The system SHALL provide additive appointment payment metadata that lets clients explain whether payment is mocked or service-backed.

#### Scenario: Client reads a mock-mode appointment
- **WHEN** a client reads an appointment created in mock mode
- **THEN** the response includes the active payment mode
- **AND** the response includes a human-readable message indicating that payment was simulated for demo or staging use

#### Scenario: Client reads a service-mode appointment
- **WHEN** a client reads an appointment created in service mode
- **THEN** the response includes the active payment mode
- **AND** the response remains compatible with checkout URL based flows when a payment handoff is actually required

### Requirement: Mobile booking UI shall avoid dead-end payment actions in mock mode
The system SHALL make simulated payment explicit in the active mobile booking flow and SHALL not present dead-end payment actions.

#### Scenario: Customer confirms booking in mock mode
- **WHEN** the mobile app receives an appointment response with payment mode `mock`
- **THEN** the app does not attempt to open an external checkout URL
- **AND** the app does not wait for payment polling to finish
- **AND** the confirmation UI clearly indicates that payment was simulated

#### Scenario: Customer confirms booking in service mode
- **WHEN** the mobile app receives an appointment response with payment mode `service` and a checkout URL
- **THEN** the app may continue the external checkout handoff and follow-up status checks
- **AND** the service-backed flow remains available for future real integration

### Requirement: Demo and staging documentation shall declare the recommended temporary payment strategy
The repository SHALL document that mock payment mode is the current recommended strategy for local demos and staging until real payment-service integration is intentionally hardened.

#### Scenario: Operator reads local or staging docs
- **WHEN** a developer or demo operator reviews payment-related setup documentation
- **THEN** the docs state that `PAYMENT_MODE=mock` is the recommended demo-safe configuration
- **AND** the docs state that `apps/payment` is optional for those flows

#### Scenario: Operator checks readiness
- **WHEN** the API readiness endpoint is called in a demo or staging environment
- **THEN** the response reports the active payment mode using the explicit payment-mode contract
- **AND** operators can distinguish simulated mode from service-backed mode without guessing from infrastructure
