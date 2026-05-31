## ADDED Requirements

### Requirement: Customer appointment list refreshes after service-mode booking changes
The mobile app SHALL refresh the customer appointment list after service-mode booking creation and payment state changes.

#### Scenario: Booking creation invalidates list
- **WHEN** Place Booking creates a service-mode appointment
- **THEN** the customer appointment list query is invalidated or refetched using the same key used by the Appointments tab

#### Scenario: Payment return invalidates list
- **WHEN** the customer returns from Stripe Checkout or views a payment result
- **THEN** customer appointment list data is invalidated or refetched

#### Scenario: Payment actions invalidate list
- **WHEN** the customer checks payment status or cancels an unpaid booking
- **THEN** customer appointment list and detail data are invalidated or refetched

### Requirement: Appointments tab refetches on focus
The Appointments tab SHALL refetch customer appointment data whenever the tab receives focus.

#### Scenario: User opens Appointments after consecutive bookings
- **WHEN** the customer completes one booking flow, completes another booking flow, and then taps Appointments
- **THEN** the Appointments tab refetches and displays all appointments returned by the backend

### Requirement: Customer appointment list includes service-mode payment states
The backend and mobile list SHALL include customer service-mode appointments in pending-payment and paid states.

#### Scenario: Consecutive service-mode bookings are listed
- **WHEN** a customer creates two consecutive service-mode bookings
- **THEN** the customer appointments endpoint returns both appointments with appointment id, payment mode, payment status, checkout URL when available, and payment message when relevant

#### Scenario: Payment state remains visible
- **WHEN** the Appointments tab renders pending, paid, or failed service-mode appointments
- **THEN** each item displays a clear payment state such as Payment pending, Complete payment, Paid, or Payment failed
