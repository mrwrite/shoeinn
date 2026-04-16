# Design

## Overview

This change aligns `appointment_location_updates` to the runtime contract already assumed by the API. The active write path in `apps/api/app/routers/company_ops.py` stores `user_id`, and the active read paths in tracking/provider-location consume the same model. The migration history is the only inconsistent layer.

## Repo-Grounded Findings

- `apps/api/app/models/appointment_location_update.py` defines:
  - `appointment_id`
  - `company_id`
  - `user_id`
  - location fields and `recorded_at`
- `apps/api/app/routers/company_ops.py` writes `AppointmentLocationUpdate(user_id=current_user.id, company_id=appt.company_id, ...)`
- `apps/api/tests/test_tracking.py` creates rows with `user_id`
- the initial tracking migration `bf4bf39c2de6` created `company_user_id`, not `user_id`
- the later migration `3f2c7f8a9b10` added `company_id`, but did not rename `company_user_id`
- backend tests use metadata creation instead of migrated Alembic state, so the mismatch remained hidden

## Intended Final Schema

`appointment_location_updates` should contain:

- `id`
- `appointment_id`
- `company_id`
- `user_id`
- `lat`
- `lng`
- `heading`
- `speed`
- `accuracy`
- `recorded_at`

`user_id` remains the correct final column because it matches the ORM, write route, and tests. The table stores the provider user id directly, not a composite company-user key row id.

## Migration Strategy

Add a new compatibility migration that:

- inspects `appointment_location_updates`
- renames `company_user_id` to `user_id` if the old column exists and `user_id` does not
- preserves or restores the expected foreign key from `user_id` to `users.id`
- leaves already-correct databases unchanged

This avoids broad rewrites and safely handles both historical and current states.

## Test Strategy

- keep tracking tests green
- add a focused provider-location regression test if the current suite does not already capture the intended read behavior clearly enough
- run the tracking/provider-location test file after the change

## Risks

- historical databases may have differing FK names, so the migration should inspect and modify constraints defensively
- if a database somehow contains both `company_user_id` and `user_id`, the migration should avoid destructive guessing and only apply the rename in the clear one-column legacy case
