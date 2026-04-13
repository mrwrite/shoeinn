# Notification Inbox Grouping And Coalescing

## ADDED Requirements

### Requirement: Customer inbox groups related updates by appointment

The system SHALL organize customer inbox notifications by appointment in the active RootTabs customer flow when an appointment id is available.

#### Scenario: Multiple notifications for one appointment appear as one grouped item

- **GIVEN** a customer has multiple notifications for the same appointment
- **WHEN** the notification center is rendered
- **THEN** those notifications appear as a grouped appointment item instead of separate top-level cards
- **AND** the latest notification is visually primary

#### Scenario: Notifications without appointment context remain standalone

- **GIVEN** a customer notification has no appointment id
- **WHEN** the notification center is rendered
- **THEN** that notification remains a standalone inbox item

### Requirement: Grouped inbox presentation coalesces lower-value repeated updates

The system SHALL reduce the visual prominence of older or lower-value repeated updates while preserving access to the underlying information.

#### Scenario: Latest high-value update stays prominent

- **GIVEN** an appointment has multiple notifications including a recent provider assignment, reassignment, `ready`, `out_for_delivery`, or `delivered` update
- **WHEN** the group is shown in the inbox
- **THEN** that latest high-value update is the primary visible update for the group

#### Scenario: Older repeated status updates are softened

- **GIVEN** an appointment group includes older repeated or lower-value status notifications
- **WHEN** the group is shown
- **THEN** those older notifications appear with reduced prominence or in a compact older-updates stack
- **AND** the system does not imply the older updates were deleted

### Requirement: Grouped inbox behavior stays aligned with customer appointment detail

The system SHALL keep the latest inbox update for an appointment aligned with the existing recent-update surface on appointment detail.

#### Scenario: Appointment detail reflects grouped inbox latest update

- **GIVEN** a grouped appointment item exists in the inbox
- **WHEN** the customer opens that appointment detail screen
- **THEN** the recent-update surface reflects the same latest relevant notification used by the grouped inbox

### Requirement: Grouping remains additive and preserves existing notification semantics

The system SHALL implement grouping and coalescing without changing existing backend notification records or unread/read storage semantics in the first slice.

#### Scenario: Backend notification records remain unchanged

- **GIVEN** notifications are grouped in the mobile inbox
- **WHEN** the feature is implemented
- **THEN** the backend notification list endpoint still returns the underlying notification records
- **AND** unread/read acknowledgment behavior remains compatible with the existing model

## MODIFIED Requirements

### Requirement: Customer notification inbox work stays inside the active RootTabs flow

The system SHALL add grouped inbox behavior only to the active RootTabs-based customer notification center and related detail surface unless a direct dependency must be touched.

#### Scenario: Grouped inbox avoids legacy customer stacks

- **GIVEN** legacy or overlapping customer flows may still exist
- **WHEN** grouped inbox behavior is implemented
- **THEN** the active customer notification center and detail surface receive the new grouping behavior
- **AND** legacy or orphaned stacks are not expanded
