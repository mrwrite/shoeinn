# Mobile UX Flow Clarity Improvements

## ADDED Requirements

### Requirement: Provider dashboard clearly distinguishes available work from claimed work

The mobile app SHALL present the active provider dashboard so providers can immediately tell which appointments are available to claim, which appointments belong to them, and what tapping or claiming will do.

#### Scenario: Provider can distinguish dashboard tabs at a glance

- **GIVEN** a provider opens the active provider dashboard
- **WHEN** both available and claimed appointments exist
- **THEN** the dashboard shows separate, clearly labeled states for available work and claimed work
- **AND** each state includes enough summary context that the provider does not need to inspect every card to understand the difference

#### Scenario: Claimable cards communicate claim intent clearly

- **GIVEN** a provider views a claimable appointment in the dashboard
- **WHEN** the card is rendered
- **THEN** the card identifies the appointment as available to claim
- **AND** the card makes the main interaction pattern clear before the provider commits to claiming

#### Scenario: Claim conflict is shown as a state change

- **GIVEN** a provider attempts to claim an appointment that another provider claims first
- **WHEN** the claim request fails with a conflict or no-longer-available result
- **THEN** the dashboard communicates that the appointment is no longer available
- **AND** the message is more specific than a generic failure state

### Requirement: Provider detail emphasizes the current state and next action

The mobile app SHALL structure the active provider appointment detail screen around the current assignment state, the current appointment state, and the recommended next provider action.

#### Scenario: Provider sees the primary next action first

- **GIVEN** a provider opens an appointment detail screen
- **WHEN** the appointment has a clear next operational step
- **THEN** the screen shows that next action near the top of the detail view
- **AND** secondary or less-likely state changes are visually subordinate

#### Scenario: Provider understands assignment state without interpreting transport errors

- **GIVEN** a provider opens an appointment detail screen
- **WHEN** the appointment is unassigned, assigned to the provider, or assigned to another provider
- **THEN** the screen presents those as explicit product states
- **AND** the provider is not required to infer meaning from loading or request-failure behavior

#### Scenario: Ready-photo requirement is visible before transition

- **GIVEN** a provider is approaching the `ready` transition
- **WHEN** the screen presents the action
- **THEN** the UI explains that a finished-photo is required before or at the point of action
- **AND** the requirement is not hidden only in secondary copy after a dense control list

### Requirement: Provider claim and reassignment actions are role-specific and explicit

The mobile app SHALL make provider self-claim and company-admin reassignment feel like distinct actions with distinct permissions and outcomes.

#### Scenario: Standard provider sees reassignment as unavailable to their role

- **GIVEN** a non-admin provider opens an appointment that is assigned to another provider or needs reassignment
- **WHEN** the screen presents assignment state
- **THEN** the UI indicates that reassignment is handled by a company admin or separate administrative action
- **AND** reassignment is not presented as a normal provider status update

#### Scenario: Company admin sees reassignment separated from progress updates

- **GIVEN** a company admin opens an appointment detail experience that supports reassignment
- **WHEN** reassignment is available
- **THEN** the UI presents reassignment separately from standard status-progress controls
- **AND** the reassignment action is labeled as an assignment-management action rather than a progress update

### Requirement: Customer appointment detail prioritizes status and provider clarity

The mobile app SHALL structure customer appointment detail so customers can quickly understand current appointment status, assigned-provider state, and what happens next.

#### Scenario: Customer sees current status and next expectation above secondary details

- **GIVEN** a customer opens appointment detail
- **WHEN** the screen loads successfully
- **THEN** the current appointment status is visible before secondary details like self-contact information
- **AND** the screen provides enough context for the customer to understand what happens next

#### Scenario: Customer sees provider state distinctly from provider-state fetch failure

- **GIVEN** a customer opens appointment detail
- **WHEN** the provider is not yet assigned
- **THEN** the screen shows a deliberate unassigned state

- **GIVEN** a customer opens appointment detail
- **WHEN** provider assignment data cannot be loaded
- **THEN** the screen shows a distinct unavailable or retryable state
- **AND** the customer is not told that no provider is assigned unless that state is known

#### Scenario: Customer timeline distinguishes current, completed, and future stages

- **GIVEN** a customer opens appointment detail
- **WHEN** appointment progress is displayed
- **THEN** the UI distinguishes the current stage from completed stages
- **AND** future stages are visually different from completed stages
- **AND** exceptional terminal states such as cancellation are not presented like ordinary progress steps

### Requirement: Active appointment surfaces use consistent hierarchy and component language

The mobile app SHALL apply shared hierarchy, state messaging, and interaction patterns across the active appointment list and detail flows.

#### Scenario: Active screens share state treatment

- **GIVEN** a user moves between active provider and customer appointment screens
- **WHEN** the UI presents loading, empty, success, unassigned, conflict, or error states
- **THEN** those states use consistent interaction and copy patterns within the active design system

#### Scenario: Active flows remain the source of truth

- **GIVEN** duplicate or legacy appointment screens exist in the repository
- **WHEN** UX improvements are implemented from this change
- **THEN** the active `RootTabs` appointment and provider flows receive the updates
- **AND** duplicate legacy screens are not extended as the primary implementation surface
