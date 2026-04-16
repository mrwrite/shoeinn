# Tasks

## 1. OpenSpec artifacts

- [x] Document the routable demo seed address change with a focused proposal.
- [x] Capture the backend-only design and requirements for deterministic real local addresses.

## 2. Backend implementation

- [x] Replace the active demo company address pool with curated real routable Pelham, Helena, and Alabaster addresses.
- [x] Replace the active demo customer and appointment address pool with curated real routable Shelby County addresses.
- [x] Preserve deterministic rotation, the fixed demo customer home address, and `reset=true` behavior.

## 3. Backend validation

- [x] Update dev-seed backend tests to assert exact curated address coverage and cluster alignment.
- [x] Run backend validation for `POST /dev/seed?reset=true` through `apps/api/tests/test_dev_seed.py`.
- [x] Review the codebase for map/travel backend tests that depend on seeded address values and confirm no further backend test changes are required.
