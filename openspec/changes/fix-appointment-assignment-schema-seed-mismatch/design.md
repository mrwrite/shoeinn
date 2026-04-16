# Design

## Overview

This change fixes a backend contract mismatch around `appointment_assignments`. The source of truth should be a single active assignment record keyed by appointment and provider user, with company ownership inferred from the appointment.

## Root Cause

The table definition drifted across layers:

- Alembic created `appointment_assignments` without `company_id`.
- The ORM model still declares `company_id`.
- Runtime code and seed logic still insert `company_id`.
- Some query paths also filter by `AppointmentAssignment.company_id` instead of joining to `Appointment.company_id`.

This can remain hidden in SQLite tests that use `Base.metadata.create_all`, but it breaks on a real Postgres database migrated through Alembic.

## Final Schema Shape

`appointment_assignments` should contain:

- `id UUID primary key`
- `appointment_id UUID fk appointments.id`
- `user_id UUID fk users.id`
- `assigned_at timestamptz not null`
- `unassigned_at timestamptz null`
- `is_active boolean not null`

It should retain the unique active-assignment-per-appointment index on `appointment_id WHERE is_active`.

## Why `company_id` Should Not Remain

- The appointment already carries the authoritative company relationship.
- Provider membership is already validated through `company_users`.
- Duplicating `company_id` on assignments creates another integrity surface that can drift.
- The current failure is caused by exactly that duplication drifting out of sync.

## Migration Strategy

For this repo stage, the simplest safe path is to make the Alembic revision define the same final table shape that runtime code expects on a fresh database:

- replace the old `company_user_id` assignment column with `user_id`
- do not define `company_id`

This keeps fresh migrations, ORM metadata, and runtime inserts aligned.

## Runtime Changes

### ORM

- Remove `company_id` from `AppointmentAssignment`.
- Keep `user_id` as the assigned provider reference.

### API and seed logic

- Remove all `company_id=` inserts into `AppointmentAssignment`.
- Replace assignment cleanup or filtering that relied on `AppointmentAssignment.company_id` with joins through `Appointment`.
- Keep existing permission checks based on `Appointment.company_id` and `CompanyUser`.

### Tests

- Update fixtures and helper inserts to stop passing `company_id` when creating assignments.
- Preserve coverage for claim, assign, reassign, tracking, and owner/company listing behavior.

## Risks

- Any remaining route or helper using `AppointmentAssignment.company_id` will fail at runtime after the model fix.
- Existing local databases created from old metadata may need to be reset for full consistency.

## Validation

- Focused backend tests for assignment flows and tracking.
- Fresh Alembic migration on a clean database.
- `POST /dev/seed` succeeds after migration.
