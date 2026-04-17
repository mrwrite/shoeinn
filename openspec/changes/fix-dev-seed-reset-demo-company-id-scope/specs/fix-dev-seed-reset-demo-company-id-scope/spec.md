# Spec

## ADDED Requirements

### Requirement: Dev seed reset shall initialize demo company ids before cleanup uses them

The system SHALL define demo reset identifiers before any reset-time cleanup references them.

#### Scenario: Reset seed deletes demo notification children

- **WHEN** `POST /dev/seed?reset=true` runs
- **THEN** notification child cleanup executes only after `demo_company_ids` has been computed
- **AND** the request does not fail with `UnboundLocalError`

### Requirement: Seed reset shall preserve current demo story

The system SHALL keep the active Helena, Pelham, and Alabaster seed story and address realism intact while fixing reset scope.

#### Scenario: Reset reseeds demo data

- **WHEN** the seed is reset
- **THEN** the current seeded companies, appointments, and realistic city-aligned addresses are recreated successfully
