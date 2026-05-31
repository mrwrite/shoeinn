## ADDED Requirements

### Requirement: Service-mode booking opens checkout immediately
When a customer selects secure checkout in service payment mode and taps Place Booking, the mobile app SHALL open the returned Stripe Checkout URL immediately after appointment confirmation succeeds.

#### Scenario: Checkout URL returned
- **WHEN** the customer places a booking with secure checkout selected and the confirm response includes `payment_checkout_url`
- **THEN** the mobile app opens that URL and preserves the created appointment id for recovery

#### Scenario: Checkout URL missing
- **WHEN** the customer places a service-mode booking with secure checkout selected and the confirm response does not include `payment_checkout_url`
- **THEN** the mobile app shows a clear error and does not silently navigate away from the payment flow

### Requirement: Pending-payment bookings remain visible
Customer appointment listing SHALL include service-mode appointments while payment is pending or unpaid.

#### Scenario: Pending booking listed
- **WHEN** a customer creates an appointment that has `payment_status` pending
- **THEN** the customer appointments list includes the appointment with visible pending-payment state

#### Scenario: Payment state visible
- **WHEN** the customer views the appointments list
- **THEN** each service-mode appointment displays a clear payment state such as pending, failed, paid, or cancelled

### Requirement: Pending-payment detail provides recovery actions
The customer appointment detail screen SHALL provide recovery actions for unpaid service-mode appointments.

#### Scenario: Continue checkout
- **WHEN** a customer opens a pending-payment appointment detail and a checkout URL exists
- **THEN** the detail screen shows an Open secure checkout action

#### Scenario: Refresh or cancel unpaid booking
- **WHEN** a customer opens a pending-payment appointment detail
- **THEN** the detail screen shows Check payment status and Cancel unpaid booking actions

### Requirement: Appointment payment changes refresh customer appointment data
Mobile appointment queries SHALL be invalidated or refetched after booking creation, payment refresh, payment cancellation, and payment return handling.

#### Scenario: Booking creation refreshes list
- **WHEN** Place Booking creates an appointment
- **THEN** the customer appointments list query is invalidated or refetched before the user relies on that list

#### Scenario: Payment mutation refreshes list
- **WHEN** payment status is refreshed, cancelled, or returned from checkout
- **THEN** customer appointment list and detail data are invalidated or refetched

### Requirement: Backend exposes service-mode payment state
The booking API SHALL expose service-mode payment state needed by the mobile recovery flow.

#### Scenario: Confirm response includes checkout data
- **WHEN** an appointment is confirmed in service payment mode
- **THEN** the response includes appointment id, payment status, payment mode, checkout URL when available, and a payment message when relevant

#### Scenario: Customer list includes pending payment appointments
- **WHEN** a customer lists their appointments
- **THEN** pending-payment appointments are returned unless explicitly cancelled
