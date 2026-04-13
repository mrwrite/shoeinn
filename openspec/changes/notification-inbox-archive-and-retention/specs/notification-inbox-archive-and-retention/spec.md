# Notification Inbox Archive And Retention

## ADDED Requirements

### Requirement: Customer inbox supports lightweight group archiving

The system SHALL let customers archive grouped notification cards in the active customer inbox without deleting the underlying notifications.

#### Scenario: Customer archives a grouped appointment card

- **GIVEN** a grouped notification card is visible in the customer inbox
- **WHEN** the customer uses the archive action on that group
- **THEN** the grouped card is hidden from the default inbox view
- **AND** the underlying notifications remain intact

#### Scenario: Standalone notification can also be archived

- **GIVEN** a standalone notification without an appointment id is visible in the customer inbox
- **WHEN** the customer archives it
- **THEN** that standalone grouped item is hidden from the default inbox view

### Requirement: Archive state stays compatible with grouped read-state behavior

The system SHALL preserve current grouped read-state and navigation behavior for non-archived items.

#### Scenario: Archive does not change read-state semantics

- **GIVEN** a grouped notification card is archived
- **WHEN** the archive action completes
- **THEN** notification read/unread values remain unchanged
- **AND** grouping logic remains valid for the underlying records

### Requirement: Customer inbox applies a simple retention rule for older read groups

The system SHALL support a lightweight client-side retention model that reduces clutter from older fully read notification groups.

#### Scenario: Old read group is excluded from default view

- **GIVEN** a grouped notification card is fully read and older than the retention threshold
- **WHEN** the customer opens the default inbox view
- **THEN** that group is hidden or otherwise strongly de-prioritized in the default presentation

#### Scenario: Unread groups remain visible despite age

- **GIVEN** a grouped notification card contains at least one unread notification
- **WHEN** the customer opens the inbox
- **THEN** that group remains visible regardless of retention eligibility

### Requirement: Archive and retention remain mobile-only in the first slice

The system SHALL implement archive and retention behavior on the mobile client without requiring backend notification API changes in the initial version.

#### Scenario: Existing backend APIs remain unchanged

- **GIVEN** archive and retention behavior are added
- **WHEN** the feature is implemented
- **THEN** the mobile inbox derives archive and retention presentation from existing notification data
- **AND** backend notification APIs remain compatible

## MODIFIED Requirements

### Requirement: Customer notification inbox work stays inside the active RootTabs flow

The system SHALL add archive and retention behavior only to the active RootTabs-based customer notification center and its supporting mobile helper logic unless a direct dependency must be touched.

#### Scenario: Archive behavior avoids legacy stacks

- **GIVEN** legacy or overlapping customer flows may still exist
- **WHEN** archive and retention behavior are implemented
- **THEN** the active customer notification center receives the new behavior
- **AND** legacy or orphaned stacks are not expanded
