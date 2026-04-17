# Fix Appointment Location Update Schema Runtime Mismatch

## Executive Assessment

`GET /appointments/{id}/provider-location` currently fails in Postgres because the runtime expects `appointment_location_updates.user_id` while the historical migration path created a different column name. This is a narrow schema/runtime drift issue, not a product design problem.

The smallest correct fix is to align the database schema with the current ORM and route logic, then add a focused regression test so provider-location reads stay stable.

## Problem

- `apps/api/app/models/appointment_location_update.py` defines `user_id`
- runtime code in tracking and provider-location flows reads and writes `user_id`
- the original tracking migration created `company_user_id` instead
- no later migration reconciled that mismatch for `appointment_location_updates`

As a result, SQLite tests pass from metadata creation while migrated Postgres environments can fail with `UndefinedColumn` when the ORM queries `user_id`.

## Goals

- Determine and enforce the intended final schema for `appointment_location_updates`
- Reconcile Alembic history, ORM model, and route logic
- Restore `GET /appointments/{id}/provider-location`
- Keep the change narrow and safe

## Non-Goals

- Refactoring unrelated appointment, assignment, or tracking behavior
- Reworking customer/provider authorization logic
- Broad schema cleanup outside `appointment_location_updates`

## Proposed Fix

- Keep `user_id` as the intended final column name because the ORM, write path, and tests already use it
- Add a compatibility migration that renames `company_user_id` to `user_id` when needed and ensures the expected foreign keys/index shape remains valid
- Add a focused regression test that exercises the customer provider-location read against seeded location updates

## Impact

- Migrated Postgres databases will match the runtime model again
- Provider-location reads stop failing with a 500
- The change stays isolated to one model/table family and related tests
