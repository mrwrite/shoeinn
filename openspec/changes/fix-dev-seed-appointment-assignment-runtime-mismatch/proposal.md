# Fix Dev Seed Appointment Assignment Runtime Mismatch

## Executive Assessment

`POST /dev/seed` is still failing after the assignment refactor because the repo has one remaining runtime drift surface: the tracked packaged copy under `apps/api/build/lib` still uses the pre-refactor `AppointmentAssignment` shape with `company_id`.

The source application code and Alembic revisions already converge on the intended schema:

- `id`
- `appointment_id`
- `user_id`
- `assigned_at`
- `unassigned_at`
- `is_active`

But the packaged runtime copy still defines and inserts `company_id`, which recreates the exact `UndefinedColumn` failure when that stale code path is used.

## Problem

The assignment refactor was only partially propagated. The active source model and seed logic were updated, but the tracked packaged runtime copy still contains:

- an `AppointmentAssignment` ORM model with `company_id`
- route code that inserts `AppointmentAssignment(..., company_id=...)`
- query code that filters on `AppointmentAssignment.company_id`

That means the repo is still internally inconsistent even though the main source tree looks correct.

## Goals

- Reconcile the tracked runtime package with the intended final schema.
- Make `/dev/seed` safe on a fresh migrated database.
- Keep claim, assign, reassign, and tracking flows aligned with the no-`company_id` assignment design.
- Keep the fix narrow and avoid unrelated packaging or deployment refactors.

## Non-Goals

- Redesigning company membership validation.
- Refactoring unrelated build or release processes.
- Changing owner/provider product behavior beyond the assignment schema contract.

## Proposed Fix

Standardize the tracked runtime package on the same final assignment shape already used by the source app and Alembic:

- remove `company_id` from `apps/api/build/lib/models/appointment_assignment.py`
- remove stale `company_id` assignment inserts from packaged route code
- replace packaged query scoping that relied on assignment-local `company_id` with appointment-based scoping
- document the runtime-package drift explicitly in OpenSpec so future schema refactors do not stop at the source tree

## Impact

- Fresh local bootstrap stays aligned with packaged runtime behavior.
- `POST /dev/seed` no longer risks hitting a stale `company_id` insert path.
- Assignment-backed owner/provider flows use one consistent schema contract across migration, source runtime, and packaged runtime.
