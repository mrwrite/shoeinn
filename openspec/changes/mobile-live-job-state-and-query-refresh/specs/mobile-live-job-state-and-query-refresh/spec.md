# Mobile Live Job State And Query Refresh

## ADDED Requirements

### Requirement: Active provider dashboard refreshes when it matters

The active provider dashboard SHALL refresh job-list state on important lifecycle events using the existing React Query setup.

#### Scenario: Dashboard refreshes on focus return

- **GIVEN** a provider leaves and returns to the active provider dashboard
- **WHEN** the dashboard regains focus
- **THEN** the available-jobs and my-jobs queries are refreshed

#### Scenario: Dashboard updates immediately after claim success

- **GIVEN** a provider successfully claims a job from the active dashboard
- **WHEN** the claim succeeds
- **THEN** both the available-jobs and my-jobs queries are invalidated or refetched promptly
- **AND** the updated job state becomes visible without relying on a manual refresh

### Requirement: Provider appointment detail feels current while active

The active provider appointment detail screen SHALL use focus-aware refresh and targeted polling so assignment and related active job state feel current while the appointment is active.

#### Scenario: Provider detail refreshes while focused and active

- **GIVEN** a provider is viewing an active appointment detail screen
- **WHEN** the screen is focused
- **THEN** the screen refreshes relevant assignment or related job state on a reasonable interval

#### Scenario: Provider detail action invalidation propagates to active screens

- **GIVEN** a provider claims or updates an appointment from detail
- **WHEN** the action succeeds
- **THEN** the relevant provider dashboard and appointment queries are invalidated or refetched promptly

### Requirement: Customer appointment detail refreshes proactively for active appointments

The active customer appointment detail screen SHALL refresh appointment, provider-assignment, and progress-event state more proactively while the appointment is active.

#### Scenario: Customer detail polls while appointment is active

- **GIVEN** a customer is viewing an appointment that is not yet in a terminal state
- **WHEN** the screen is focused
- **THEN** the appointment, assignment, and events queries refresh on a reasonable interval

#### Scenario: Customer detail stops active polling for terminal appointments

- **GIVEN** an appointment reaches `completed` or `cancelled`
- **WHEN** the detail screen is focused
- **THEN** aggressive polling stops
- **AND** the screen still refreshes on focus return as needed

### Requirement: Change remains within the active mobile flow and current query model

This change SHALL stay within the active RootTabs-based mobile flow and use the existing React Query query model.

#### Scenario: No legacy flow expansion

- **GIVEN** legacy or overlapping mobile flows still exist
- **WHEN** this change is implemented
- **THEN** only active RootTabs-based screens and shared helpers used by them are modified

#### Scenario: Real-time transport remains deferred

- **GIVEN** future real-time transport options such as WebSockets or SSE may be valuable
- **WHEN** this change is implemented
- **THEN** the implementation uses invalidation, refetch, and focused polling only
- **AND** transport-based real-time work remains deferred to a later phase
