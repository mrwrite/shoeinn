# Mobile Modern UI Experience

## ADDED Requirements

### Requirement: Mobile design system supports a premium light marketplace style

The mobile app SHALL provide a cohesive light-mode visual system for premium service marketplace screens using reusable theme tokens and shared primitives.

#### Scenario: Theme exposes cohesive polish tokens

- **WHEN** the mobile theme is updated
- **THEN** it includes compatible tokens for soft app backgrounds, card surfaces, warm/cream surfaces, peacock/teal primary accents, gold highlight actions, text hierarchy, dividers, status tones, spacing, radii, and shadows/elevation
- **AND** existing consumers of the current theme remain compatible

#### Scenario: Shared primitives preserve consistency

- **WHEN** screens need cards, buttons, section headers, badges, loading states, empty states, error states, or timeline rows
- **THEN** the implementation uses shared reusable components where practical
- **AND** screen-local styling does not duplicate major presentation patterns unnecessarily

### Requirement: Customer marketplace surfaces feel photo-forward and trustworthy

The active customer discovery, company, service, and booking surfaces SHALL present a modern marketplace experience with clear hierarchy, polished cards, and trustworthy calls to action.

#### Scenario: Customer discovery shows polished company and service cards

- **WHEN** a customer views company discovery or service browsing screens
- **THEN** companies and services are presented with photo-forward or branded-placeholder cards
- **AND** each card clearly communicates name, location or category context, service value, and primary action

#### Scenario: Service detail and booking flow preserve task clarity

- **WHEN** a customer moves through service detail, booking date/time, confirmation, review/pay, and payment result screens
- **THEN** each screen has a clear title hierarchy, obvious primary action, restrained secondary actions, and consistent state feedback
- **AND** existing booking and payment API flows remain unchanged

### Requirement: Customer appointment and notification surfaces communicate progress clearly

The active customer appointment, tracking, timeline, and notification surfaces SHALL make appointment progress and updates easy to scan.

#### Scenario: Appointment list cards remain visible and scan-friendly

- **WHEN** a customer views the Appointments list
- **THEN** each appointment card uses consistent spacing, status badge treatment, service/time/location hierarchy, and a touch target suitable for mobile interaction
- **AND** loading, empty, and error states use polished reusable state components

#### Scenario: Appointment detail timeline communicates status meaning

- **WHEN** a customer views appointment detail
- **THEN** the current, completed, upcoming, and terminal states are visually distinct
- **AND** status labels do not rely on color alone
- **AND** tracking, assignment, recent update, and action surfaces remain understandable on compact screens

#### Scenario: Notification center remains operationally clear

- **WHEN** a customer views notifications
- **THEN** notification groups, unread state, timestamps, priority labels, and appointment links use consistent card, badge, and typography treatments
- **AND** notification counts remain on notification surfaces rather than becoming appointment tab counts

### Requirement: Provider operational surfaces are polished without losing density

The active provider dashboard and appointment detail screens SHALL use scan-friendly operational layouts with modern styling and clear status actions.

#### Scenario: Provider dashboard supports rapid job scanning

- **WHEN** a provider views available and assigned jobs
- **THEN** dashboard summaries, tab counts, job cards, status badges, time/location blocks, and claim/action controls are visually organized for quick scanning
- **AND** the screen remains usable when lists are loading, empty, or in error states

#### Scenario: Provider detail action hierarchy is clear

- **WHEN** a provider views appointment detail or status actions
- **THEN** primary next actions are visually dominant, secondary actions are quieter, status transitions are clearly labeled, and touch targets are at least 44px where practical
- **AND** existing status update and claim API behavior remains unchanged

### Requirement: Company admin surfaces feel demo-ready and controllable

The active company admin or owner surfaces SHALL provide polished operational overview cards, assignment/status context, and consistent action affordances.

#### Scenario: Admin dashboard presents company jobs clearly

- **WHEN** a company admin views the dashboard
- **THEN** job groups, owner summary content, assignment state, provider names, status badges, and next actions are easy to scan
- **AND** visual treatment is consistent with provider operational surfaces

#### Scenario: Admin appointment detail preserves control clarity

- **WHEN** a company admin views or manages appointment detail
- **THEN** assignment, reassignment, status, customer, and service information use a clear hierarchy
- **AND** admin actions remain distinct from customer marketplace CTAs

### Requirement: Loading, empty, and error states are consistent and helpful

The mobile app SHALL use consistent polished state presentations for loading, empty, and error cases across priority customer, provider, admin, and notification screens.

#### Scenario: Loading states feel intentional

- **WHEN** a priority screen is waiting for data
- **THEN** it shows consistent loading presentation with suitable spacing, accessible labels or text, and no layout-breaking placeholder content

#### Scenario: Empty and error states provide next steps

- **WHEN** a priority screen has no data or encounters an error
- **THEN** it shows role-appropriate copy and a practical action such as retry, browse services, return home, or refresh

### Requirement: Mobile polish respects accessibility and platform constraints

The mobile app SHALL maintain Android and iOS compatibility, light-mode behavior, readable contrast, and practical touch-target sizing during the polish pass.

#### Scenario: Touch targets and text remain usable

- **WHEN** priority screens are rendered on compact mobile viewports
- **THEN** interactive controls are at least 44px where practical
- **AND** text does not overflow buttons, badges, cards, or timeline rows

#### Scenario: Visual polish avoids fragile behavior

- **WHEN** the polished app is tested on Android and iOS paths
- **THEN** it does not require fragile animations, backend contract changes, or platform-specific hacks to keep core flows usable

### Requirement: Final demo QA validates all priority roles and flows

The implementation SHALL include a final demo QA pass covering customer, provider, company admin, booking, payment, appointment, and notification flows.

#### Scenario: Customer demo path passes

- **WHEN** the Mt. Juliet or equivalent demo data is used
- **THEN** a customer can log in, browse companies/services, book a service, review/pay, view payment result, see appointments, open appointment detail, and review notifications without visual or flow regressions

#### Scenario: Provider and admin demo paths pass

- **WHEN** provider and company admin demo accounts are used
- **THEN** provider dashboard/detail/status flows and company admin dashboard/detail/assignment flows remain usable and visually consistent

#### Scenario: Validation commands pass

- **WHEN** implementation is complete
- **THEN** mobile typecheck and relevant mobile tests pass
- **AND** OpenSpec strict validation for this change passes
