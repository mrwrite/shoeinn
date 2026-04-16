# Fix Appointment Assignment Schema Seed Mismatch

## Executive Assessment

`/dev/seed` is failing because `appointment_assignments` no longer matches itself across Alembic, the SQLAlchemy model, and runtime insert paths. The app can still pass SQLite-backed tests when tables are created from models, but a fresh Postgres database created from Alembic does not align with the runtime ORM shape.

This is a schema contract bug, not a seed-only bug. The smallest correct fix is to make `appointment_assignments` consistently represent an active assignment as:

- `id`
- `appointment_id`
- `user_id`
- `assigned_at`
- `unassigned_at`
- `is_active`

Company scoping should come from `appointments.company_id` and membership checks in application logic, not from a duplicated `appointment_assignments.company_id`.

## Problem

The current repo has drifted in two ways:

- the Alembic history does not define the same columns as the ORM model,
- and runtime paths still try to insert or filter on `AppointmentAssignment.company_id`.

That mismatch breaks fresh-database workflows, including:

- `alembic upgrade heads`
- `POST /dev/seed`
- owner/company assignment flows that rely on seeded assignments

## Goals

- Reconcile the Alembic definition, ORM model, runtime code, and tests for `appointment_assignments`.
- Make `/dev/seed` succeed on a fresh migrated database.
- Preserve the business rule that assignment ownership is a user assignment scoped by the appointment's company.
- Keep the fix narrow and avoid unrelated refactors.

## Non-Goals

- Redesigning company membership or permission models.
- Refactoring unrelated tracking or notification tables.
- Broad changes to owner dashboard behavior beyond what is needed to restore consistent assignment data.

## Proposed Fix

Standardize `appointment_assignments` on a single runtime shape with no `company_id` column. Update route queries and seed cleanup to derive company scoping through joins to `appointments`, and keep provider/company validation in route logic through `company_users`.

## Impact

- Fresh-database local demo setup becomes reliable again.
- `/dev/seed` works without manual schema patching.
- Assignment creation, claim, reassign, and owner flows stop depending on stale schema assumptions.
