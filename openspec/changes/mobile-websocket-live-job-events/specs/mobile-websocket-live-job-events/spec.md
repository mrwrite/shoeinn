# Mobile Websocket Live Job Events

## ADDED Requirements

### Requirement: Active mobile flows receive live appointment events over a websocket channel

The system SHALL provide an authenticated websocket channel for logged-in active mobile users so provider and customer RootTabs flows can react to high-value appointment changes without waiting only for polling.

#### Scenario: Logged-in mobile user establishes live channel

- **GIVEN** a mobile user is authenticated with an existing API access token
- **WHEN** the app opens the live events connection
- **THEN** the API accepts an authenticated websocket connection for that user
- **AND** the connection remains available for live appointment events until it closes or auth becomes invalid

#### Scenario: Existing polling remains available when live channel is absent

- **GIVEN** a mobile screen already uses focused polling and query invalidation
- **WHEN** the websocket is disconnected or unavailable
- **THEN** the mobile flow continues to function with the existing polling-based refresh behavior

### Requirement: Provider assignment changes publish live events

The system SHALL publish live assignment events for active company-side and customer-side mobile flows when an appointment is claimed or reassigned.

#### Scenario: Provider claim updates active provider job visibility

- **GIVEN** a confirmed unassigned appointment is claimed by a provider
- **WHEN** the claim commit succeeds
- **THEN** a live assignment event is published for the appointment’s company users
- **AND** active provider job-list queries can refresh so other providers stop seeing the job as claimable quickly
- **AND** the claiming provider can see the job appear in `My Jobs` quickly

#### Scenario: Reassignment updates provider and customer active detail

- **GIVEN** an appointment is reassigned to a different provider
- **WHEN** the reassignment commit succeeds
- **THEN** a live assignment event is published for relevant company users
- **AND** a live assignment event is published for the appointment’s customer when applicable
- **AND** active detail screens can refresh assigned-provider state quickly

### Requirement: Appointment status transitions publish live events

The system SHALL publish live events for high-value appointment status transitions used by the active provider and customer mobile flows.

#### Scenario: Provider status update refreshes active detail screens

- **GIVEN** a provider updates an appointment to a new operational status
- **WHEN** the status transition commit succeeds
- **THEN** a live status event is published for relevant company-side and customer-side recipients
- **AND** the affected appointment detail and timeline queries can refresh promptly

#### Scenario: Ready-with-photo transition publishes live status update

- **GIVEN** an assigned provider marks an appointment as `ready` with a finished photo
- **WHEN** the ready transition commit succeeds
- **THEN** a live status event is published for relevant recipients
- **AND** the customer detail flow can refresh status, events, and finished-photo state quickly

### Requirement: Active mobile clients use live events to invalidate current query data

The system SHALL use live event payloads to invalidate the existing React Query caches that power the active RootTabs provider and customer screens.

#### Scenario: Provider active screens invalidate relevant caches on live event

- **GIVEN** a logged-in provider or company-side user receives a live assignment or status event
- **WHEN** the event references an appointment that may affect active job or detail screens
- **THEN** the app invalidates the relevant provider open, provider my-jobs, and appointment detail queries

#### Scenario: Customer active screens invalidate relevant caches on live event

- **GIVEN** a logged-in customer receives a live assignment or status event for one of their appointments
- **WHEN** the event is processed
- **THEN** the app invalidates the customer appointment list, appointment detail, assignment, and events queries for that appointment

## MODIFIED Requirements

### Requirement: Active mobile flows are the source of truth for live job updates

The system SHALL add live job updates only to the active RootTabs-based provider and customer mobile flows unless a direct dependency must be touched.

#### Scenario: Live update wiring stays inside active mobile surfaces

- **GIVEN** multiple mobile screen families still exist in the repository
- **WHEN** live websocket job events are introduced
- **THEN** the active RootTabs provider and customer flows receive the new wiring
- **AND** legacy or orphaned mobile stacks are not expanded as part of this change
