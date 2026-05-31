## ADDED Requirements

### Requirement: Appointments tab is a list entry point
The customer Appointments tab SHALL show the appointment list when the customer taps the tab.

#### Scenario: Tab tapped while detail is active
- **WHEN** the Appointments tab nested stack is currently showing `AppointmentDetail`
- **AND** the customer taps the Appointments tab
- **THEN** the nested stack returns to `AppointmentList`

#### Scenario: Explicit detail navigation is preserved
- **WHEN** payment return, notification/deep-link handling, or an appointment list card explicitly navigates to `AppointmentDetail`
- **THEN** the app opens that appointment detail screen

### Requirement: Appointment list remains fresh after booking/payment events
The mobile app SHALL keep customer appointment list data invalidated or refetched after booking and payment state changes.

#### Scenario: User opens Appointments after consecutive bookings
- **WHEN** the customer completes two service-mode booking/payment flows
- **AND** taps Appointments
- **THEN** the appointment list is shown and refetched so both bookings are visible when returned by the API

### Requirement: Appointments tab badge is appointment-specific or absent
The Appointments tab SHALL NOT display notification unread count as its badge.

#### Scenario: Notifications exist
- **WHEN** the customer has unread notifications
- **THEN** notification count remains on notification surfaces
- **AND** the Appointments tab does not show that notification count
