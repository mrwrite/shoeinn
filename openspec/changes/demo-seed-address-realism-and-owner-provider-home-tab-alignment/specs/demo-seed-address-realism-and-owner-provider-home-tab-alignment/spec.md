# Spec

## ADDED Requirements

### Requirement: Dev seed shall create believable complete local addresses for the active Alabama demo story

The system SHALL populate seeded company and appointment address fields with believable fake addresses that stay inside the existing Helena, Pelham, and Alabaster story.

#### Scenario: Seed creates company addresses

- **WHEN** `POST /dev/seed?reset=true` runs
- **THEN** each seeded company has a complete address with `address_line1`, `city`, `state`, and `postal_code`
- **AND** the address city and state match the company's seeded city and state

#### Scenario: Seed creates appointment addresses

- **WHEN** `POST /dev/seed?reset=true` runs
- **THEN** each seeded appointment has a complete pickup or delivery address with `address_line1`, `city`, `state`, and `postal_code`
- **AND** the address stays aligned with the seeded company city and state story
- **AND** no external API or network dependency is required to generate the address

#### Scenario: Seed remains repeatable while avoiding repetitive addresses

- **WHEN** the demo seed is rerun
- **THEN** the chosen addresses remain deterministic enough for stable demos
- **AND** different seeded companies and appointments do not all reuse the same address

### Requirement: Operational roles shall land on the dashboard through Home in the active mobile shell

The system SHALL make `Home` the operational landing tab for `provider` and `company_admin` users in the active `RootTabs` flow.

#### Scenario: Provider opens Home

- **GIVEN** a logged-in user has role `provider`
- **WHEN** the user enters the root tab flow
- **THEN** `Home` shows the provider operational dashboard
- **AND** there is no separate `Control` tab

#### Scenario: Company admin opens Home

- **GIVEN** a logged-in user has role `company_admin`
- **WHEN** the user enters the root tab flow
- **THEN** `Home` shows the owner command center
- **AND** there is no separate `Control` tab

### Requirement: Customer navigation shall remain unchanged

The system SHALL preserve the existing customer tab layout and customer Home behavior while owner and provider Home are realigned.

#### Scenario: Customer enters the root tab flow

- **GIVEN** a logged-in user has role `customer`
- **WHEN** the user enters `RootTabs`
- **THEN** the customer still sees the existing customer tab structure
- **AND** customer `Home` continues to show the current customer discovery and booking flow

## MODIFIED Requirements

### Requirement: Demo-readiness work shall prefer active runtime surfaces

The system SHALL implement demo-readiness changes in the active backend seed path and active mobile tab shell rather than expanding inactive legacy stacks.

#### Scenario: Home alignment is implemented

- **WHEN** this change is applied
- **THEN** the wiring is updated in `apps/mobile/src/navigation/RootTabs.tsx`
- **AND** inactive legacy stacks are not revived as the main owner or provider experience
