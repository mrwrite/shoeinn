# Notification Inbox Filters And Priority Segmentation

## ADDED Requirements

### Requirement: Customer inbox supports lightweight group-level filtering

The system SHALL provide a lightweight filter in the active customer notification center that helps customers focus on unread grouped updates without changing backend APIs.

#### Scenario: Customer views all grouped notifications

- **GIVEN** the customer opens the notification center
- **WHEN** the `All` filter is selected
- **THEN** all grouped and standalone notifications are shown using the existing grouping model

#### Scenario: Customer views only unread grouped notifications

- **GIVEN** the customer has a mix of read and unread grouped notifications
- **WHEN** the `Unread` filter is selected
- **THEN** only grouped or standalone notifications with unread state are shown
- **AND** group unread state is determined by whether any child notification is unread

### Requirement: Customer inbox visually distinguishes high-priority latest updates

The system SHALL make high-value grouped updates more visually prominent without hiding lower-value updates.

#### Scenario: High-priority latest update stands out

- **GIVEN** a grouped appointment card has a latest notification representing provider assignment, provider reassignment, `ready`, `out_for_delivery`, or `delivered`
- **WHEN** the inbox renders the grouped card
- **THEN** that grouped card uses stronger visual emphasis for the latest update than a lower-priority grouped card

#### Scenario: Lower-value updates remain visible

- **GIVEN** a grouped appointment card has lower-priority latest or older updates
- **WHEN** the inbox renders
- **THEN** those updates remain visible
- **AND** they use a calmer, de-emphasized presentation relative to higher-priority updates

### Requirement: Filtering and priority segmentation stay additive to current inbox behavior

The system SHALL implement filtering and priority-aware presentation without changing backend notification APIs, grouping semantics, or deep-link behavior.

#### Scenario: Existing customer inbox behaviors continue working

- **GIVEN** the customer uses filtering or views a high-priority grouped card
- **WHEN** they tap the grouped card or use current read actions
- **THEN** navigation, read-state updates, grouping, and live refresh continue to behave as before

## MODIFIED Requirements

### Requirement: Customer notification inbox work stays inside the active RootTabs flow

The system SHALL add filtering and priority segmentation only to the active RootTabs-based customer notification center and its supporting mobile helper logic unless a direct dependency must be touched.

#### Scenario: Filtered inbox avoids legacy stacks

- **GIVEN** legacy or overlapping customer flows may still exist
- **WHEN** the filter and priority-aware presentation are implemented
- **THEN** the active customer notification center receives the new behavior
- **AND** legacy or orphaned stacks are not expanded
