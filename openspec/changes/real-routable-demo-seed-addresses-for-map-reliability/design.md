# Design

## Overview

This change replaces the current synthetic Alabama demo seed addresses with curated real addresses that are routable by common map providers. The implementation stays on the active backend seed path in `apps/api/app/routers/dev_seed.py` and the backend regression coverage in `apps/api/tests/test_dev_seed.py`.

## Repo-Grounded Findings

- `/dev/seed` already creates the active Shelby County demo story for Pelham, Helena, and Alabaster.
- The current seed now stores complete address fields for companies, the main customer, and appointments, but the values are fabricated.
- The map and travel surfaces read those stored appointment addresses directly, so the seed data is the right place to improve route reliability.
- Existing backend coverage already exercises `POST /dev/seed?reset=true` and checks for complete address data, but it does not prove the pool uses the intended curated real addresses.

## Address Design

### Deterministic pools

Use two curated pools only:

- `DEMO_COMPANY_ADDRESSES`
- `DEMO_CUSTOMER_JOB_ADDRESSES`

Each entry stores:

- `address_line1`
- optional `address_line2`
- `city`
- `state`
- `postal_code`

The company pool remains fixed by company name. The customer/job pool is a shared Shelby County set used for the main customer home address and appointment rotation.

### Address selection

- The main demo customer gets the first entry in the customer/job pool every reset.
- Appointments rotate deterministically by seeded company offset plus appointment sequence.
- Company addresses stay fixed per seeded demo company.

This preserves repeatability without introducing randomness or runtime lookups.

### Safety and demo quality

- Use real local addresses in Pelham, Helena, and Alabaster only.
- Prefer public or commercial addresses that are likely to remain routable and stable.
- Avoid PO boxes and obviously fake suite data.
- Do not call external APIs in the seed path.

## Test Design

Update backend coverage to prove:

- `POST /dev/seed?reset=true` still succeeds
- each seeded company uses the exact curated company pool
- the demo customer uses the fixed curated home address
- all seeded appointments use only addresses from the curated job pool
- all seeded addresses stay within the Pelham, Helena, and Alabaster cluster

No route-engine integration test is added here because the backend test suite does not currently own live map-provider validation.

## Risks

- Some real-world addresses may change geocoding quality over time across providers even if they are valid today.
- Reusing a very small pool can make demos feel repetitive, so the job pool should keep enough variety for the seeded appointment set.
- Accidentally widening scope into unrelated demo/navigation changes would make the change harder to verify, so this implementation must stay backend-only.
