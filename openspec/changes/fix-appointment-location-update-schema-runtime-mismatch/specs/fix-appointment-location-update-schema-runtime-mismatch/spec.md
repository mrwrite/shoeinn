# Spec

## ADDED Requirements

### Requirement: Provider location reads shall use a schema-aligned appointment location update table

The system SHALL keep the migrated database schema for `appointment_location_updates` aligned with the runtime ORM and provider-location route.

#### Scenario: Historical tracking schema is upgraded

- **WHEN** Alembic upgrades a database that still has the legacy `company_user_id` column
- **THEN** the table is reconciled to the runtime column name `user_id`
- **AND** provider location updates remain associated to the provider user

#### Scenario: Provider location is read after schema alignment

- **WHEN** `GET /appointments/{appointment_id}/provider-location` is called for a customer-owned appointment with location updates
- **THEN** the route succeeds without a 500
- **AND** it returns the latest stored provider location

## MODIFIED Requirements

### Requirement: Tracking persistence shall store provider identity consistently

The system SHALL persist provider identity for appointment location updates in `user_id` consistently across the ORM, migrations, and route logic.

#### Scenario: Provider posts a travel update

- **WHEN** a provider posts a location update through the active tracking route
- **THEN** the row stores `user_id` and `company_id`
- **AND** later tracking/provider-location reads can query the same schema without migration drift
