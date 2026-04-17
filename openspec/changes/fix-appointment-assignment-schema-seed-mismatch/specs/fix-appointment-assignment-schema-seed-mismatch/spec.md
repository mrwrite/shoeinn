# Spec

## ADDED Requirements

### Requirement: Appointment assignment schema must be internally consistent

The backend SHALL define `appointment_assignments` consistently across Alembic, ORM, runtime code, and tests.

#### Scenario: Fresh database matches runtime model

- **WHEN** a developer runs `alembic upgrade heads` on a clean database
- **THEN** the resulting `appointment_assignments` table contains `appointment_id`, `user_id`, `assigned_at`, `unassigned_at`, and `is_active`
- **AND** it does not require a `company_id` column for runtime inserts

### Requirement: Assignment company scoping must derive from the appointment

The backend SHALL enforce assignment company ownership through `appointments.company_id` and membership validation rather than a duplicated assignment-local company column.

#### Scenario: Company routes scope assignments through appointment ownership

- **WHEN** company or provider routes read or mutate active assignments
- **THEN** they validate access using the appointment's `company_id`
- **AND** they do not rely on `appointment_assignments.company_id`

### Requirement: Demo seed must work on a freshly migrated database

The backend SHALL allow `/dev/seed` to complete successfully on a clean database created from Alembic migrations.

#### Scenario: Demo seed inserts assignments without stale company columns

- **WHEN** `POST /dev/seed` runs after a fresh migration
- **THEN** seeded `AppointmentAssignment` rows insert successfully using the reconciled schema
- **AND** owner/provider demo flows can read those assignments without schema errors
