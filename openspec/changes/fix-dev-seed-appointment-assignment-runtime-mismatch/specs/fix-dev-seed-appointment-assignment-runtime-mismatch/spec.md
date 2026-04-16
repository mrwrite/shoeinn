# Spec

## ADDED Requirements

### Requirement: Appointment assignment runtime code must match the migrated schema

The system SHALL use a single `appointment_assignments` runtime contract across migrations, ORM models, and packaged runtime code.

#### Scenario: Runtime creates an appointment assignment

- **WHEN** source or packaged runtime code creates an assignment
- **THEN** it writes `appointment_id`, `user_id`, `assigned_at`, `unassigned_at`, and `is_active`
- **AND** it does not write `company_id`

### Requirement: Company scoping for assignments must come from appointments and membership checks

The system SHALL derive assignment company access from `appointments.company_id` and provider membership validation.

#### Scenario: Company route lists claimed appointments

- **WHEN** a company-scoped route reads assignment-backed appointments
- **THEN** it scopes by `Appointment.company_id`
- **AND** it does not depend on `appointment_assignments.company_id`

### Requirement: Dev seed must work against a freshly migrated database

The system SHALL support `POST /dev/seed` on a fresh database created from Alembic migrations.

#### Scenario: Fresh bootstrap runs dev seed

- **WHEN** the database is created and migrated with `alembic upgrade heads`
- **THEN** `POST /dev/seed` succeeds
- **AND** no assignment insert references a missing `company_id` column
