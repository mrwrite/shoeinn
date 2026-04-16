# Spec

## ADDED Requirements

### Requirement: Dev seed shall use real routable addresses for the Shelby County demo market

The system SHALL populate the active dev seed with curated real addresses that common map providers can geocode for the existing Pelham, Helena, and Alabaster demo story.

#### Scenario: Seed creates routable company addresses

- **WHEN** `POST /dev/seed?reset=true` runs
- **THEN** each seeded demo company has a complete address with `address_line1`, `city`, `state`, and `postal_code`
- **AND** the address comes from the curated deterministic company pool
- **AND** the address remains within Pelham, Helena, or Alabaster

#### Scenario: Seed creates routable customer and appointment addresses

- **WHEN** `POST /dev/seed?reset=true` runs
- **THEN** the main seeded customer has a complete default address from the curated deterministic customer/job pool
- **AND** each seeded appointment address comes from the curated deterministic customer/job pool
- **AND** those addresses remain within the intended Shelby County demo cluster
- **AND** no external API or runtime geocoding call is required to generate them

#### Scenario: Seed remains deterministic across resets

- **WHEN** the demo seed is rerun with `reset=true`
- **THEN** the same seeded companies, customer, and appointments receive the same address selections
- **AND** the demo account structure and seeded story remain unchanged

## MODIFIED Requirements

### Requirement: Demo seed realism shall support route and map reliability on the active backend seed path

The system SHALL prefer real routable local addresses over fabricated addresses when seeding the active demo market.

#### Scenario: Route-safe demo addresses are seeded

- **WHEN** the backend demo seed is applied
- **THEN** `apps/api/app/routers/dev_seed.py` stores curated real addresses for seeded demo entities
- **AND** `apps/api/tests/test_dev_seed.py` verifies the curated address coverage
