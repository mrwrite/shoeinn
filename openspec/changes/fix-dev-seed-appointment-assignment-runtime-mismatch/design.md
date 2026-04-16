# Design

## Overview

This change closes the remaining assignment refactor gap by reconciling the tracked packaged runtime copy under `apps/api/build/lib` with the final no-`company_id` `appointment_assignments` schema.

## Root Cause

The original refactor correctly changed the primary source tree and migration history, but the tracked packaged runtime copy remained on the old contract:

- `AppointmentAssignment` still declared `company_id`
- packaged runtime routes still inserted `company_id`
- one packaged query still filtered on `AppointmentAssignment.company_id`

That leaves the repo with two competing assignment contracts. If the stale packaged runtime is used, `/dev/seed` and assignment flows still attempt inserts against a column that no longer exists in Postgres.

## Final Schema Shape

`appointment_assignments` remains:

- `id UUID primary key`
- `appointment_id UUID fk appointments.id`
- `user_id UUID fk users.id`
- `assigned_at timestamptz not null`
- `unassigned_at timestamptz null`
- `is_active boolean not null`

The unique active-assignment-per-appointment index remains unchanged.

## Why `company_id` Must Stay Removed

- the appointment already owns company scoping
- membership validation already happens through `company_users`
- the stale `company_id` duplication is the direct source of the runtime failure
- keeping it out avoids another integrity surface drifting again

## Runtime Reconciliation

### Packaged ORM

Update the tracked packaged `AppointmentAssignment` model to match the source model:

- remove `company_id`
- point `user_id` at `users.id`

### Packaged Routes

Update the tracked packaged routes to:

- stop inserting `company_id` when creating assignments
- scope company access through `Appointment.company_id`

This preserves the intended business rule without reintroducing schema duplication.

## Validation

- focused assignment tests still pass
- fresh migration path succeeds
- `/dev/seed` succeeds against a fresh database

## Follow-up That Can Wait

- deciding whether `apps/api/build/lib` should remain tracked at all
- tightening the release/build workflow so packaged runtime copies are regenerated or excluded automatically
