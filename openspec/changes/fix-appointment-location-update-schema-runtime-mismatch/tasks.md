# Tasks

## 1. OpenSpec artifacts

- [x] Document the appointment location update schema/runtime mismatch and narrow fix.
- [x] Capture the intended final schema and migration strategy.

## 2. Backend implementation

- [x] Add an Alembic compatibility migration that aligns legacy `company_user_id` schemas to `user_id`.
- [x] Keep the ORM and route logic consistent with the final schema.
- [x] Add or tighten focused tests for provider-location reads if needed.

## 3. Validation

- [x] Run focused backend tests for tracking/provider-location behavior.
- [x] Verify the provider-location route logic is consistent with the reconciled schema.
