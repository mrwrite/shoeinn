# Customer Notification Center And Live Status Surface

## ADDED Requirements

### Requirement: Customers can review in-app appointment notifications in the active mobile flow

The system SHALL provide a customer-facing in-app notification center inside the active RootTabs-based mobile experience.

#### Scenario: Customer opens notification center from appointments flow

- **GIVEN** a logged-in customer is using the active mobile flow
- **WHEN** the customer opens the notification center entry point
- **THEN** the app shows a list of that customer’s in-app notifications
- **AND** each item shows readable summary information about the update

#### Scenario: Notification center shows read and unread state

- **GIVEN** the customer has a mix of acknowledged and unacknowledged notifications
- **WHEN** the notification list is rendered
- **THEN** unread notifications are visually distinct from read notifications
- **AND** each notification shows a clear timestamp or relative recency cue

### Requirement: Customers can acknowledge their in-app notifications

The system SHALL let customers acknowledge their own in-app notifications using the existing notification read model.

#### Scenario: Customer acknowledges notification

- **GIVEN** a customer notification has not yet been acknowledged
- **WHEN** the customer opens or taps that notification in the notification center
- **THEN** the app sends an acknowledgement for that notification
- **AND** the notification becomes read in subsequent responses

#### Scenario: Customer cannot access another user’s notification

- **GIVEN** a notification targets a different customer or a company-side user
- **WHEN** the current customer requests or acknowledges that notification
- **THEN** access is rejected

### Requirement: Customer appointment updates use calm, customer-readable notification copy

The system SHALL map existing backend notification kinds and payloads into concise, customer-readable titles and details in the mobile notification center.

#### Scenario: Provider assignment notification is readable

- **GIVEN** the customer receives an assignment notification
- **WHEN** the notification is displayed in the app
- **THEN** the title clearly indicates that a provider was assigned or changed
- **AND** the detail uses provider display names when available

#### Scenario: Status milestone notification is readable

- **GIVEN** the customer receives a status-change notification
- **WHEN** the notification is displayed in the app
- **THEN** the title and detail clearly communicate the new milestone such as `ready`, `out_for_delivery`, or `delivered`

### Requirement: Customer live updates refresh both inbox and detail surfaces

The system SHALL refresh customer notification and appointment detail queries promptly when live assignment or status events occur.

#### Scenario: Live event refreshes customer notification center

- **GIVEN** a customer is logged in and the app receives a live assignment or status event for that customer’s appointment
- **WHEN** the event is processed
- **THEN** the customer notification query is invalidated or refreshed
- **AND** the notification center can show the new update promptly

#### Scenario: Appointment detail shows the latest relevant notification context

- **GIVEN** a customer is viewing appointment detail and relevant notifications exist for that appointment
- **WHEN** the detail screen renders
- **THEN** it shows a concise recent-update surface aligned with the inbox
- **AND** the existing appointment timeline remains the primary progress view

## MODIFIED Requirements

### Requirement: Active customer RootTabs flow is the source of truth for notification-center work

The system SHALL add the customer notification center and related live status surfaces only to the active RootTabs-based customer mobile flow unless a direct dependency must be touched.

#### Scenario: Notification-center work avoids legacy customer stacks

- **GIVEN** legacy or overlapping customer surfaces may still exist in the repository
- **WHEN** the notification center change is implemented
- **THEN** the active RootTabs appointments/customer flow receives the new wiring
- **AND** legacy or orphaned stacks are not expanded as part of this change
