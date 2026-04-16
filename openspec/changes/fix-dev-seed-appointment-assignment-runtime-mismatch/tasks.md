# Tasks

## 1. Artifact and runtime reconciliation

- [x] Document the remaining runtime-package drift in OpenSpec artifacts.
- [x] Align the tracked packaged `AppointmentAssignment` model with the final no-`company_id` schema.

## 2. Route fixes

- [x] Remove stale packaged assignment inserts that still pass `company_id`.
- [x] Replace packaged company scoping that still depends on `AppointmentAssignment.company_id`.

## 3. Validation

- [x] Run focused backend tests for assignment behavior.
- [ ] Verify fresh migration success on a clean database.
- [ ] Verify `POST /dev/seed` succeeds without an `UndefinedColumn` error.
