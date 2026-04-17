# Real Routable Demo Seed Addresses For Map Reliability

## Executive Assessment

The current Shelby County demo seed is geographically coherent, but it still uses invented addresses. That is good enough for story consistency and not good enough for route rendering. Demo map providers need real, routable addresses if owner and provider travel views are going to draw lines reliably.

This change keeps the existing Pelham, Helena, and Alabaster demo story, but replaces all current demo seed addresses with a curated, deterministic pool of real local addresses that common map providers can geocode.

## Problem

`/dev/seed` currently creates complete addresses for demo companies, the main demo customer, and seeded appointments, but those addresses are synthetic. That weakens route and travel demos because:

- route requests can fail or snap unpredictably when an address is not geocodable
- map previews and travel overlays become unreliable during owner and provider demos
- repeated resets do not guarantee route-safe destinations even though the local market story is stable

## Goals

- Replace all active demo seed addresses with real routable addresses in Pelham, Helena, and Alabaster.
- Keep the address data deterministic across resets.
- Preserve the current demo account structure, seeded companies, and appointment status story.
- Keep the change limited to the dev seed path and related backend validation.

## Non-Goals

- Adding live geocoding, map lookups, or network dependencies to `/dev/seed`.
- Changing mobile navigation, appointment workflows, or provider status behavior.
- Expanding the seed market beyond the existing Shelby County demo cluster.

## Proposed Fix

- Replace the current fake address pools in `apps/api/app/routers/dev_seed.py` with curated real local addresses.
- Use two deterministic pools:
  - company HQ addresses
  - customer/job/appointment addresses
- Keep one fixed default address for the main seeded customer and rotate seeded appointments through the curated job-address pool.
- Update `apps/api/tests/test_dev_seed.py` to assert exact address coverage and cluster alignment.

## Impact

- Route and map demos should become materially more reliable because seeded destinations are real addresses.
- Demo resets remain stable and repeatable.
- The scope stays narrow and low-risk because the runtime change is isolated to `/dev/seed` and its tests.
