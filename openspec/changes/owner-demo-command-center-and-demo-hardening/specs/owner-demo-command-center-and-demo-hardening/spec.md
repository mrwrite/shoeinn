# Owner Demo Command Center And Demo Hardening

## ADDED Requirements

### Requirement: The active mobile app shall provide a distinct cleaner-owner command center for company admins

The system SHALL give `company_admin` users an owner-oriented operating surface in the active `AuthGate -> RootTabs` mobile flow rather than routing them only through the provider execution experience.

#### Scenario: Company admin opens the active jobs tab

- **GIVEN** a logged-in user has role `company_admin`
- **WHEN** the user enters the active jobs flow
- **THEN** the app shows an owner-oriented command center
- **AND** the surface summarizes company work instead of only the provider's personal queue

#### Scenario: Owner flow avoids inactive stacks

- **GIVEN** inactive or legacy company/admin stacks still exist in the repository
- **WHEN** owner demo work is implemented
- **THEN** the active `RootTabs` path receives the new wiring
- **AND** inactive `CompanyStack` and `AdminStack` paths are not expanded as the primary owner experience

### Requirement: Cleaner owners can understand daily work coverage at a glance

The system SHALL present company-admin users with a segmented view of operational work that makes assignment coverage and progress obvious during a live demo.

#### Scenario: Owner sees unassigned and in-progress work separately

- **GIVEN** a company has a mix of confirmed unassigned appointments and assigned live appointments
- **WHEN** the owner opens the command center
- **THEN** the UI separates at least unassigned work from assigned or in-progress work
- **AND** each segment shows a clear count or summary cue

#### Scenario: Owner can identify who owns a live job

- **GIVEN** an appointment has an active assignment
- **WHEN** the owner views the command center or job detail
- **THEN** the current provider display name is visible
- **AND** the current appointment status is visible in business-readable language

### Requirement: Cleaner owners can intervene in assignment from the active flow

The system SHALL let a company admin reach reassignment controls and team visibility from the active owner demo flow.

#### Scenario: Owner opens a job that already has a provider

- **GIVEN** a company-admin user is viewing an assigned appointment
- **WHEN** the owner opens the appointment detail from the active owner flow
- **THEN** the UI shows the assigned provider
- **AND** the owner can access reassignment controls using the existing company-admin authorization model

#### Scenario: Owner can inspect available team members

- **GIVEN** a company-admin user needs to understand who can take work
- **WHEN** the owner opens the team surface from the active flow
- **THEN** the app shows company users relevant to dispatch and job ownership

### Requirement: The repository shall support a deterministic local-demo scenario for cleaner-owner conversations

The system SHALL provide seeded demo data and reset behavior that support a polished local owner demo without ad hoc manual data preparation.

#### Scenario: Demo seed creates a local cleaner story

- **GIVEN** a developer or operator resets demo data
- **WHEN** the demo seed flow runs
- **THEN** it creates a cleaner-owner-ready scenario with locally relevant branding and geography
- **AND** it includes multiple appointments across meaningful statuses
- **AND** it includes company-admin, provider, and customer accounts for the walkthrough

#### Scenario: Demo seed supports the full pitch narrative

- **GIVEN** the seeded demo state is loaded
- **WHEN** the presenter walks through booking, owner oversight, provider action, and customer updates
- **THEN** each role has a coherent next step without requiring manual database edits

### Requirement: Demo-critical messaging shall match actual runtime behavior

The system SHALL avoid demo copy that overstates or misrepresents what the local runtime is doing.

#### Scenario: Payment behavior is explained accurately in the demo flow

- **GIVEN** the payment service is unset and stub behavior is active
- **WHEN** the customer reaches booking confirmation
- **THEN** the UI and demo notes do not imply a real production payment handoff
- **AND** the flow remains credible to a business owner

#### Scenario: Hardware-dependent capabilities are optional for the baseline demo

- **GIVEN** push notifications or photo capture may depend on physical-device setup
- **WHEN** the baseline owner demo is prepared
- **THEN** the core product story remains complete without requiring those capabilities to succeed live

## MODIFIED Requirements

### Requirement: Active mobile flows remain the source of truth for demo-readiness work

The system SHALL prioritize active mobile and backend runtime paths for demo-readiness improvements unless a legacy dependency must be migrated.

#### Scenario: Demo-readiness work favors active paths over duplicate surfaces

- **GIVEN** duplicate or legacy screens and stacks exist in the repository
- **WHEN** demo-readiness work is implemented
- **THEN** the work targets `apps/api` active routers and the `RootTabs` mobile flow
- **AND** duplicate legacy surfaces are not treated as the primary demo integration surface
