# Notification Inbox Read State And Bulk Actions

## ADDED Requirements

### Requirement: Grouped inbox cards expose trustworthy group read behavior

The system SHALL treat grouped appointment cards as read-state containers in the active customer notification center.

#### Scenario: Group unread state rolls up from child notifications

- **GIVEN** a grouped appointment card contains one or more unread notifications
- **WHEN** the customer opens the notification center
- **THEN** the grouped card appears unread

#### Scenario: Opening a grouped card clears the group

- **GIVEN** a grouped appointment card contains unread notifications
- **WHEN** the customer taps the grouped appointment card to open detail
- **THEN** all unread notifications in that group are acknowledged
- **AND** the customer is navigated to the relevant appointment detail screen

### Requirement: Customer inbox supports lightweight bulk read actions

The system SHALL provide low-clutter bulk actions that help customers clear notification noise without redesigning the inbox.

#### Scenario: Customer marks a group as read

- **GIVEN** a grouped appointment card contains unread notifications
- **WHEN** the customer uses the group-level mark-read action
- **THEN** all unread notifications in that group are acknowledged
- **AND** the customer remains in the inbox

#### Scenario: Customer marks the inbox as read

- **GIVEN** the customer has unread in-app notifications
- **WHEN** the customer uses the inbox-wide mark-all-read action
- **THEN** all unread in-app notifications for that customer are acknowledged

### Requirement: Bulk read behavior reuses additive customer notification APIs

The system SHALL preserve the existing notification record model while supporting inbox-wide bulk acknowledgment for the active customer flow.

#### Scenario: Mark all read uses an additive endpoint

- **GIVEN** the customer notification center needs a mark-all-read action
- **WHEN** the feature is implemented
- **THEN** the backend exposes an additive customer endpoint for bulk acknowledgment
- **AND** existing list and single-ack routes remain compatible

### Requirement: Appointment detail remains aligned with inbox read state

The system SHALL keep appointment detail recent-update emphasis aligned with grouped inbox read state.

#### Scenario: Read state change is reflected in recent update styling

- **GIVEN** a recent update is shown on appointment detail for an appointment group
- **WHEN** that group's notifications are marked read
- **THEN** the same latest notification remains visible
- **AND** its unread emphasis is removed on the next refresh

## MODIFIED Requirements

### Requirement: Customer notification inbox work stays inside the active RootTabs flow

The system SHALL add grouped read-state and bulk-action behavior only to the active RootTabs-based customer notification center and related detail surface unless a direct dependency must be touched.

#### Scenario: Read-state refinement avoids legacy stacks

- **GIVEN** legacy or overlapping customer flows may still exist
- **WHEN** grouped read-state behavior and bulk actions are implemented
- **THEN** the active customer notification center receives the new behavior
- **AND** legacy or orphaned stacks are not expanded
