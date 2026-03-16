# Mobile Visual Polish And State Feedback

## ADDED Requirements

### Requirement: Active provider dashboard feels operational and glanceable

The active provider dashboard SHALL provide a stronger operational summary and clearer list-state feedback without requiring backend changes.

#### Scenario: Provider sees a useful dashboard summary

- **GIVEN** a provider opens the active provider dashboard
- **WHEN** available or assigned jobs exist
- **THEN** the screen shows a summary strip or summary card near the top
- **AND** the summary helps the provider understand available work, assigned work, or the next notable operational cue from current data

#### Scenario: Provider dashboard supporting states feel intentional

- **GIVEN** the active provider dashboard is loading, empty, or unavailable
- **WHEN** the screen renders
- **THEN** the supporting state uses clear, user-friendly messaging
- **AND** the presentation feels intentional rather than generic fallback UI

### Requirement: Appointment cards emphasize identity, timing, location, and action state

The active appointment cards used in the provider dashboard SHALL make job identity, timing, location, and actionability easier to scan through hierarchy and visual grouping.

#### Scenario: Provider scans an actionable job card quickly

- **GIVEN** a provider views a claimable job in the active dashboard
- **WHEN** the card is rendered
- **THEN** the card clearly communicates what the job is, when it is, where it is, and that it can be acted on
- **AND** the CTA and helper text support confident action

#### Scenario: Provider distinguishes owned work from claimable work

- **GIVEN** a provider moves between available and my-job lists
- **WHEN** cards are rendered in each context
- **THEN** the card treatment communicates the difference between claimable work and work already assigned to the provider

### Requirement: Customer progress visuals emphasize current state most strongly

The active customer appointment detail screen SHALL present progress so the current state is visually dominant, completed states are reassuring but secondary, upcoming states are visibly upcoming, and terminal states are distinct.

#### Scenario: Customer sees current progress most clearly

- **GIVEN** a customer opens appointment detail for an active appointment
- **WHEN** the progress timeline is rendered
- **THEN** the current state has the strongest visual emphasis
- **AND** completed and upcoming states are distinguishable but less dominant

#### Scenario: Terminal states feel final

- **GIVEN** an appointment reaches a terminal state such as `completed` or `cancelled`
- **WHEN** the timeline is rendered
- **THEN** the terminal state is visually distinct from normal in-progress steps

### Requirement: Touched active screens make the next best action obvious

The active provider dashboard and customer detail surfaces touched by this change SHALL use primary and secondary action styling that makes the next best action visually obvious.

#### Scenario: Primary action stands out from supporting controls

- **GIVEN** a touched active screen contains one main action and supporting controls
- **WHEN** the screen renders
- **THEN** the primary action has stronger emphasis than the supporting controls
- **AND** secondary actions remain available but visually quieter

### Requirement: Change remains in the active RootTabs-based flow

This change SHALL only modify the active RootTabs-based provider and appointment flow.

#### Scenario: Legacy screens remain untouched

- **GIVEN** overlapping or legacy mobile screens still exist in the repository
- **WHEN** this polish change is implemented
- **THEN** only active RootTabs-based screens and shared primitives used by them are modified
- **AND** legacy/orphaned stacks are not extended
