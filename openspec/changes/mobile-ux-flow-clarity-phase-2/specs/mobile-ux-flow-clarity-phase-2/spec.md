# Mobile UX Flow Clarity Phase 2

## ADDED Requirements

### Requirement: Customer timeline distinguishes current, completed, upcoming, and terminal progress states

The active customer appointment detail screen SHALL communicate appointment progress with distinct visual treatments for the current step, completed steps, upcoming steps, and terminal states.

#### Scenario: Customer identifies the current step at a glance

- **GIVEN** a customer opens an appointment with an active non-terminal status
- **WHEN** the status timeline is rendered
- **THEN** the current step is visually distinct from completed and upcoming steps
- **AND** the screen indicates that the highlighted step is the current stage

#### Scenario: Customer distinguishes completed and upcoming steps

- **GIVEN** a customer opens an appointment with a multi-step progress path
- **WHEN** the timeline is rendered
- **THEN** previously reached steps are visually distinct from future steps
- **AND** future steps do not appear completed

#### Scenario: Terminal states are treated as final outcomes

- **GIVEN** an appointment is `completed` or `cancelled`
- **WHEN** the timeline is rendered
- **THEN** the terminal state is presented as a final outcome
- **AND** ordinary future progress steps are not emphasized as if they are still expected

### Requirement: Provider dashboard is easier to scan and compare

The active provider dashboard SHALL make it easier for providers to distinguish between available and claimed jobs and scan the list quickly.

#### Scenario: Provider sees tab context with counts or summary cues

- **GIVEN** a provider opens the active dashboard
- **WHEN** available and/or claimed jobs exist
- **THEN** the dashboard shows clear context for each tab such as counts, summaries, or equivalent glanceable cues
- **AND** the provider can distinguish `Available jobs` from `My jobs` without relying on the tab labels alone

#### Scenario: Provider can scan key job information in priority order

- **GIVEN** a provider views the dashboard list
- **WHEN** a job card is rendered
- **THEN** the card makes the job identity, timing, location, and action state easy to scan
- **AND** the provider can tell more quickly whether the job is actionable

### Requirement: Active provider and customer supporting states feel intentional

The active provider dashboard and customer appointment detail screen SHALL use more deliberate loading, empty, and error states than generic fallback messaging alone.

#### Scenario: Provider dashboard empty and error states are contextual

- **GIVEN** the provider opens either dashboard tab
- **WHEN** the list is loading, empty, or failed to load
- **THEN** the screen shows contextual copy for that specific list state
- **AND** the user is given an appropriate retry or next-step cue when relevant

#### Scenario: Customer detail remains understandable during partial data delay

- **GIVEN** the customer appointment detail has loaded the appointment but some supporting data is still loading or unavailable
- **WHEN** the screen renders
- **THEN** the customer still sees a coherent status summary
- **AND** supporting state messages explain what is loading or unavailable without collapsing the whole screen into a generic failure

### Requirement: Phase 2 remains in the active RootTabs-based flow

Phase 2 SHALL implement UX improvements only in the active `RootTabs`-based provider and appointment flows.

#### Scenario: Legacy stacks remain untouched

- **GIVEN** the repository contains overlapping or legacy mobile screens
- **WHEN** phase-2 implementation is applied
- **THEN** only the active `RootTabs` provider and appointment flows receive the new UX behavior
- **AND** legacy/orphaned screens are not extended to carry the new phase-2 behavior
