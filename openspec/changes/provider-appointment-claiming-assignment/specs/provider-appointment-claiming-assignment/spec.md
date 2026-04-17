# Provider Appointment Claiming Assignment

## ADDED Requirements

### Requirement: Providers can view claimable confirmed appointments for their company

The system SHALL allow a provider to retrieve claimable appointments for companies they belong to by reusing the existing provider/company operations flow.

#### Scenario: Provider sees claimable confirmed appointments

- **GIVEN** a user has role `provider`, `company`, or `company_admin`
- **AND** the user is linked to a company through `company_users`
- **AND** an appointment for that company is in `confirmed` status
- **AND** the appointment has no active assignment
- **WHEN** the provider requests the claimable appointments flow
- **THEN** the appointment is returned in the claimable list

#### Scenario: Provider does not see unclaimable appointments

- **GIVEN** an appointment is already actively assigned or is not in `confirmed` status
- **WHEN** a provider requests the claimable appointments flow
- **THEN** that appointment is not returned as claimable

### Requirement: Providers can claim an appointment for themselves

The system SHALL let an eligible provider claim an appointment and create an active self-assignment using the existing company operations route and appointment assignment model.

#### Scenario: Claim creates active assignment

- **GIVEN** a provider belongs to the company that owns a confirmed unassigned appointment
- **WHEN** the provider claims the appointment
- **THEN** an active `appointment_assignments` record is created for that provider
- **AND** the assignment is associated with the appointment and company

#### Scenario: Duplicate active claim is rejected

- **GIVEN** an appointment already has an active assignment
- **WHEN** another claim is attempted
- **THEN** the claim is rejected
- **AND** the existing assignment remains unchanged

#### Scenario: Concurrent claims resolve to one winner

- **GIVEN** two eligible providers attempt to claim the same confirmed unassigned appointment at nearly the same time
- **WHEN** both claim requests are processed concurrently
- **THEN** exactly one active assignment is created
- **AND** one request succeeds
- **AND** the losing request returns a conflict response
- **AND** customer assignment notifications are emitted only for the winning assignment

### Requirement: Only company admins may reassign an active provider assignment

The system SHALL restrict reassignment of an already assigned appointment to `company_admin` users of the appointment's company.

#### Scenario: Company admin reassigns appointment

- **GIVEN** an appointment already has an active provider assignment
- **AND** the acting user is a `company_admin` for the same company
- **WHEN** the acting user reassigns the appointment
- **THEN** the prior assignment is deactivated
- **AND** a new active assignment is created for the replacement provider

#### Scenario: Non-admin provider cannot reassign appointment

- **GIVEN** an appointment already has an active provider assignment
- **AND** the acting user is a `provider`
- **WHEN** the acting user attempts to reassign the appointment
- **THEN** the request is forbidden

### Requirement: Claimed appointments appear in the provider claimed flow

The system SHALL expose appointments actively assigned to a provider in the provider claimed or my-appointments flow.

#### Scenario: Claimed appointment appears in my appointments

- **GIVEN** a provider has successfully claimed an appointment
- **WHEN** the provider requests their claimed or my appointments list
- **THEN** the claimed appointment appears in that list

### Requirement: Customer appointment detail shows assignment and status

The system SHALL let customer appointment detail show both the current appointment status and the currently assigned provider when an active assignment exists.

#### Scenario: Customer sees assigned provider

- **GIVEN** a customer can access their appointment detail
- **AND** the appointment has an active provider assignment
- **WHEN** the customer opens appointment detail
- **THEN** the current appointment status is shown
- **AND** the assigned provider name is shown
- **AND** the customer does not receive provider email or phone details

#### Scenario: Customer sees unassigned state

- **GIVEN** a customer can access their appointment detail
- **AND** the appointment has no active provider assignment
- **WHEN** the customer opens appointment detail
- **THEN** the current appointment status is shown
- **AND** the customer sees that no provider is assigned yet
- **AND** the assignment read behavior preserves the existing `404` unassigned semantics

### Requirement: Customers are notified when assignment changes

The system SHALL notify customers when an appointment is claimed for the first time or reassigned, using the existing notification and outbox infrastructure.

#### Scenario: Customer receives notification when provider claims appointment

- **GIVEN** a confirmed appointment is claimed by a provider
- **WHEN** the assignment is created
- **THEN** the system enqueues a customer-facing assignment notification
- **AND** the notification is available for in-app delivery
- **AND** push delivery is attempted when the customer has push tokens
- **AND** the notification payload includes the new provider display name and assignment action

#### Scenario: Customer receives notification when provider assignment changes

- **GIVEN** an appointment already has an assigned provider
- **WHEN** the active assignment changes to a different provider
- **THEN** the system enqueues a customer-facing reassignment notification
- **AND** the notification payload identifies the assignment change
- **AND** the payload includes both old and new provider display names

### Requirement: Assignment history uses explicit claim and reassignment event names

The system SHALL record assignment changes with explicit appointment event names and structured payloads.

#### Scenario: Claim writes assignment event

- **GIVEN** an appointment is claimed by a provider
- **WHEN** the assignment is created
- **THEN** an `appointment_events` record is created with kind `assignment_claimed`
- **AND** its payload includes `assignment_id`, `old_provider_user_id`, `old_provider_name`, `new_provider_user_id`, and `new_provider_name`

#### Scenario: Reassignment writes assignment event

- **GIVEN** an appointment is reassigned to another provider
- **WHEN** the new active assignment is created
- **THEN** an `appointment_events` record is created with kind `assignment_reassigned`
- **AND** its payload includes both old and new provider identity fields

## MODIFIED Requirements

### Requirement: Active mobile flows are the source of truth for provider claiming UI

The system SHALL wire provider claiming and customer assignment visibility only into the active `RootTabs`-based mobile flow unless a legacy dependency must be migrated.

#### Scenario: New UI is wired only into active screens

- **GIVEN** both active and legacy mobile screens exist in the repository
- **WHEN** provider claiming and assignment visibility are implemented
- **THEN** the active `RootTabs` provider and customer screens receive the new wiring
- **AND** legacy/orphaned stacks are not used as the primary integration surface
