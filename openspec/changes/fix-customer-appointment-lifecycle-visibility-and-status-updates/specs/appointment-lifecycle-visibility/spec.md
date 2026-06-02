# Appointment Lifecycle Visibility

## ADDED Requirements

### Requirement: Customer appointment reads preserve ownership across active lifecycle changes

The system SHALL return customer-owned appointments from customer appointment read flows based on appointment ownership, not provider assignment or fulfillment status.

#### Scenario: Customer list includes appointment after provider claim

- **GIVEN** a customer owns an appointment
- **AND** a provider claims the appointment
- **WHEN** the customer requests their appointment list
- **THEN** the appointment is returned in the list
- **AND** provider assignment state does not remove the appointment from the customer response

#### Scenario: Customer list includes appointment after provider status update

- **GIVEN** a customer owns an appointment
- **AND** a provider changes the appointment status to an active lifecycle status such as `en_route_pickup`, `picked_up`, `cleaning`, `ready`, `out_for_delivery`, `delivered`, or `completed`
- **WHEN** the customer requests their appointment list
- **THEN** the appointment is returned in the list with the latest status

#### Scenario: Customer ownership authorizes detail access

- **GIVEN** a customer owns an appointment
- **WHEN** the customer requests appointment detail for that appointment
- **THEN** access is allowed regardless of active provider assignment
- **AND** access is not granted to other customers who do not own the appointment

### Requirement: Provider claim preserves customer ownership

The system SHALL keep customer ownership fields intact when provider claim or reassignment commands update assignment state.

#### Scenario: Claim does not change customer ownership

- **GIVEN** a customer owns a confirmed unassigned appointment
- **WHEN** an eligible provider claims the appointment
- **THEN** an active assignment is created for the provider
- **AND** the appointment remains owned by the original customer
- **AND** the customer can still read the appointment through customer list and detail flows

#### Scenario: Assignment changes do not affect customer visibility

- **GIVEN** a customer owns an appointment with an active provider assignment
- **WHEN** the appointment is reassigned to another provider
- **THEN** the appointment remains owned by the original customer
- **AND** the customer can still read the appointment through customer list and detail flows

### Requirement: Provider status updates notify the customer and publish live status events

The system SHALL create customer-facing notification and live event side effects when a provider updates appointment status.

#### Scenario: Provider status update creates customer notification

- **GIVEN** a provider is authorized to update an appointment status
- **WHEN** the provider changes the appointment status
- **THEN** the system creates a customer-facing `APPOINTMENT_STATUS_CHANGED` notification
- **AND** the notification payload includes the appointment id, previous status when known, and new status
- **AND** the notification is available through the customer notification surface

#### Scenario: Provider status update publishes live status event

- **GIVEN** a provider is authorized to update an appointment status
- **WHEN** the provider changes the appointment status
- **THEN** the system publishes an `appointment_status_changed` live event to the customer
- **AND** the event payload includes `appointment_id`, `status`, `previous_status` when known, and `actor_role`

#### Scenario: Status history remains queryable

- **GIVEN** a provider changes an appointment status
- **WHEN** appointment events are requested for that appointment
- **THEN** the status change is represented in the appointment event history
- **AND** the event history reflects the updated status

### Requirement: Customer mobile state refreshes on live appointment status events

The mobile app SHALL update customer appointment list, detail, timeline, assignment, and notification state when it receives a live appointment event for a customer appointment.

#### Scenario: Live status event updates visible customer list item

- **GIVEN** a customer is viewing the Appointments list
- **AND** the list contains an appointment
- **WHEN** the app receives an `appointment_status_changed` event for that appointment
- **THEN** the visible list item updates to the event status promptly
- **AND** the customer appointment list query is invalidated or refetched

#### Scenario: Live status event refreshes customer appointment detail

- **GIVEN** a customer is viewing appointment detail
- **WHEN** the app receives an `appointment_status_changed` event for that appointment
- **THEN** the appointment detail query is invalidated or refetched
- **AND** the appointment events query is invalidated or refetched
- **AND** the latest status can be displayed without a manual refresh

#### Scenario: Live assignment event refreshes customer appointment state

- **GIVEN** a customer is logged in
- **WHEN** the app receives an assignment live event for the customer's appointment
- **THEN** the customer appointment list query is invalidated or refetched
- **AND** the appointment assignment query for that appointment is invalidated or refetched

### Requirement: Customer notification updates stay on notification surfaces

The mobile app SHALL surface customer status-update notifications through notification UI and SHALL NOT use notification unread count as the Appointments tab badge.

#### Scenario: Status update refreshes notification count on notification surface

- **GIVEN** a customer is logged in
- **WHEN** the app receives a live status event for the customer's appointment
- **THEN** the customer notification query is invalidated or refetched
- **AND** notification unread count can update on notification entry points such as the bell or notification center

#### Scenario: Appointments tab badge does not use notification count

- **GIVEN** a customer has unread notifications
- **WHEN** the customer views the bottom tab navigation
- **THEN** the Appointments tab does not display the unread notification count as a tab badge
- **AND** the unread count remains available only on notification surfaces

### Requirement: Provider and company admin appointment views remain correct

The system SHALL preserve existing provider and company admin appointment list semantics while fixing customer appointment visibility.

#### Scenario: Provider open list excludes claimed appointments

- **GIVEN** an appointment has been claimed by a provider
- **WHEN** another provider requests the open appointments list
- **THEN** the claimed appointment is not returned as an unassigned open appointment

#### Scenario: Provider my list includes claimed appointment after status update

- **GIVEN** a provider has claimed an appointment
- **WHEN** the provider updates the appointment status
- **THEN** the appointment remains available in the provider's claimed or my appointments flow with the latest status

#### Scenario: Company admin can still see company appointments

- **GIVEN** a company admin belongs to the appointment's company
- **WHEN** provider assignment or status changes occur
- **THEN** the company admin appointment view still includes the appointment with current assignment and status information
