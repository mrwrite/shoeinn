# Tasks

## 1. Artifact and schema reconciliation

- [x] Document the final `appointment_assignments` schema shape in OpenSpec artifacts.
- [x] Update Alembic and ORM definitions so `appointment_assignments` consistently uses `appointment_id + user_id` and excludes `company_id`.

## 2. Runtime and seed fixes

- [x] Remove stale `AppointmentAssignment.company_id` inserts and filters from runtime routes.
- [x] Update `/dev/seed` cleanup and assignment creation to scope by `appointments.company_id` instead of assignment-local company data.

## 3. Test alignment

- [x] Update focused backend tests and helpers to create assignments without `company_id`.
- [x] Preserve assignment, tracking, and owner/company route coverage after the schema reconciliation.

## 4. Validation

- [x] Run focused backend tests covering assignment behavior.
- [x] Verify a fresh migration path and `/dev/seed` success on a clean database.
