# Mobile UX Flow Clarity Phase 1

## ADDED Requirements

### Requirement: Provider detail emphasizes the current state and primary next action

The active mobile provider appointment detail screen SHALL present the current appointment state and the recommended next provider action before secondary supporting information.

#### Scenario: Provider sees the current state before supporting details

- **GIVEN** a provider opens an appointment in the active provider flow
- **WHEN** the detail screen renders
- **THEN** the current appointment state is visible near the top of the screen
- **AND** this state appears before secondary details and lower-priority controls

#### Scenario: Provider sees a primary next action and secondary updates

- **GIVEN** a provider opens an appointment with available status transitions
- **WHEN** the screen determines a recommended operational next step
- **THEN** the recommended next step is presented as the primary action
- **AND** other status updates remain available as secondary actions

#### Scenario: Ready-photo guidance is shown near the ready action

- **GIVEN** a provider can move an appointment to `ready`
- **WHEN** the screen presents that transition
- **THEN** the screen explains that a finished photo is required near the relevant action
- **AND** the provider can still complete the existing ready-photo flow

### Requirement: Active detail screens use explicit assignment-state mapping

The active provider and customer appointment detail screens SHALL present explicit assignment product states rather than inferring customer- or provider-facing meaning directly from fetch failures.

#### Scenario: Provider detail distinguishes assignment states explicitly

- **GIVEN** a provider opens appointment detail
- **WHEN** assignment data indicates the appointment is assigned to the provider, assigned to another provider, unassigned, or unavailable
- **THEN** the screen shows one of those explicit assignment states
- **AND** the provider is not required to infer meaning from `404` responses or generic request failures

#### Scenario: Customer detail distinguishes unassigned from unavailable

- **GIVEN** a customer opens appointment detail
- **WHEN** provider assignment data is not yet present
- **THEN** the screen shows an explicit unassigned state only when that state is known

- **GIVEN** a customer opens appointment detail
- **WHEN** provider assignment data cannot be loaded reliably
- **THEN** the screen shows a distinct unavailable or retryable provider-state message

### Requirement: Customer detail prioritizes current status and assigned provider

The active customer appointment detail screen SHALL show current status and provider assignment before travel, proof, and secondary appointment details.

#### Scenario: Customer sees primary status information above the fold

- **GIVEN** a customer opens appointment detail in the active appointment flow
- **WHEN** the screen loads successfully
- **THEN** the current status summary appears before travel, proof, and secondary details
- **AND** provider state appears near the top of the screen

#### Scenario: Existing supporting features remain available

- **GIVEN** a customer opens an appointment with travel, proof photo, or timeline data
- **WHEN** the screen renders
- **THEN** those features remain available in the detail experience
- **AND** they appear below the primary status and provider-summary content

### Requirement: Active provider claim outcomes are shown inline

The active provider flow SHALL surface claim outcomes as inline stateful feedback instead of relying only on alerts.

#### Scenario: Claim success is shown inline

- **GIVEN** a provider claims an available appointment from the active provider flow
- **WHEN** the claim succeeds
- **THEN** the active screen shows inline feedback that the appointment is now assigned to the provider

#### Scenario: Claim conflict is shown as no longer available

- **GIVEN** a provider attempts to claim an appointment that is claimed by another provider first
- **WHEN** the claim request returns a conflict or no-longer-available outcome
- **THEN** the active screen shows inline feedback that the appointment is no longer available
- **AND** the message is more specific than a generic failure alert

#### Scenario: Retryable failures are shown inline

- **GIVEN** a provider attempts to claim an appointment and the request fails for a retryable reason
- **WHEN** the active screen processes the failure
- **THEN** the active screen shows inline retryable failure messaging
- **AND** existing refresh behavior remains available

### Requirement: Phase 1 stays in the active RootTabs-based flow

This change SHALL implement phase-1 UX improvements only in the active `RootTabs`-based appointment and provider flows.

#### Scenario: Active flow owns the implementation

- **GIVEN** the repository contains legacy or overlapping appointment stacks
- **WHEN** phase-1 UX improvements are implemented
- **THEN** the active `RootTabs` provider and appointment flows receive the changes
- **AND** legacy/orphaned stacks are not extended to carry the new behavior

#### Scenario: Active customer detail is not coupled to legacy stack typing

- **GIVEN** the active customer appointment detail screen is mounted from the active appointment stack
- **WHEN** phase-1 work updates typing or navigation references
- **THEN** the active screen no longer depends directly on `CustomerStack` types for its primary navigation contract
