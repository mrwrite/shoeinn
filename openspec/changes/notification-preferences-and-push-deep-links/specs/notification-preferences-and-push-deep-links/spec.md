# Notification Preferences And Push Deep Links

## ADDED Requirements

### Requirement: Customer push delivery is gated to high-value appointment updates

The system SHALL send customer push notifications only for the selected high-value appointment updates in this first slice while keeping the in-app notification center as the canonical record.

#### Scenario: Assignment change triggers customer push when enabled

- **GIVEN** a customer has push enabled and a valid push token
- **WHEN** a provider is assigned or changed for the customer’s appointment
- **THEN** the system enqueues customer push delivery for that update
- **AND** the corresponding in-app notification remains available in the notification center

#### Scenario: Only selected milestone statuses trigger customer push

- **GIVEN** a customer has milestone push enabled
- **WHEN** an appointment status changes
- **THEN** push is sent for `confirmed`, `ready`, `out_for_delivery`, and `delivered`
- **AND** push is not required for lower-value intermediate statuses outside that subset

### Requirement: Customer push delivery respects customer notification preferences

The system SHALL let customers control the first-slice push categories for their own appointment updates.

#### Scenario: Customer disables all push notifications

- **GIVEN** a customer turns off the master push setting
- **WHEN** future customer notifications are generated
- **THEN** push delivery is not enqueued for that customer
- **AND** in-app notifications continue to be recorded

#### Scenario: Customer disables assignment pushes but keeps milestone pushes

- **GIVEN** a customer disables assignment push updates and keeps milestone push updates enabled
- **WHEN** a provider assignment change occurs
- **THEN** the in-app notification is still recorded
- **AND** no push notification is enqueued for that assignment change

### Requirement: Customer notifications deep-link into the active appointment detail flow

The system SHALL route both push notifications and in-app notification taps into the active RootTabs customer appointment detail screen when an appointment destination is available.

#### Scenario: Push tap opens customer appointment detail

- **GIVEN** a push notification payload references a customer appointment detail destination
- **WHEN** the customer taps the push notification
- **THEN** the app opens the active customer appointment detail screen for that appointment

#### Scenario: In-app notification tap uses the same destination model

- **GIVEN** a notification center item references a customer appointment detail destination
- **WHEN** the customer taps the item
- **THEN** the app navigates to the same active appointment detail screen using the shared destination flow

### Requirement: Customers can manage basic push preferences in the active profile flow

The system SHALL expose a small customer-facing notification preference surface in the active mobile profile flow.

#### Scenario: Customer views notification preferences

- **GIVEN** a logged-in customer opens profile
- **WHEN** the notification settings section is shown
- **THEN** the customer can see the current master push, assignment push, and milestone push preferences

#### Scenario: Customer updates notification preferences

- **GIVEN** a logged-in customer changes one or more notification preference toggles
- **WHEN** the change is saved
- **THEN** the updated preferences are persisted
- **AND** subsequent push delivery behavior follows the new settings

## MODIFIED Requirements

### Requirement: Customer notification delivery work stays inside the active RootTabs flow

The system SHALL add push deep links and customer notification preferences only to the active RootTabs-based customer mobile flow unless a direct dependency must be touched.

#### Scenario: Deep-link and preference wiring avoids legacy stacks

- **GIVEN** legacy or overlapping customer stacks may still exist
- **WHEN** customer push deep links and preferences are implemented
- **THEN** only the active RootTabs customer flow receives the new navigation wiring
- **AND** legacy or orphaned stacks are not expanded
