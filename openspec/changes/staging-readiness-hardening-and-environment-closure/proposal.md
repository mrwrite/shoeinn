# Staging Readiness Hardening And Environment Closure

## Executive Assessment

The system is **partially staging-ready**, not fully staging-ready.

The active product flows are strong enough to justify a staging environment, but the repo is not yet packaged as a reliable, repeatable staging system. Today it is still optimized for local development and guided demos more than for shared, production-like staging use.

## Current Readiness Verdict

### What is staging-ready enough

- The FastAPI API boots cleanly when the database is migrated.
- The active mobile flow, owner command center, customer flow, and provider flow are coherent enough to exercise in staging.
- The migration graph currently resolves to a single head.
- Demo seed/reset exists and is useful for staging walkthroughs.

### What is not staging-ready enough

- Background processing is not packaged as a clear staged deployment topology.
- Live websocket delivery is process-local and will not scale or behave predictably across multiple app instances.
- Health/readiness checks are too shallow to trust for staged rollout or monitoring.
- Payment service deployment is under-specified and behaves more like an optional local sidecar than a staging-grade dependency.
- Mobile staging environment configuration and build/distribution guidance are incomplete.
- Repo docs and scripts still leave too many brittle manual steps for a shared environment refresh.

## Why This Matters

Staging is only valuable if it behaves closely enough to a real shared environment that the team can trust it for:

- realistic internal validation,
- owner/customer/provider demo rehearsals,
- pilot readiness checks,
- and release confidence.

Right now the repo can be made to work in staging, but it would still be easy to deploy it in a way that is fragile, inconsistent, or subtly misleading.

## Top Risks

- Websocket live updates become unreliable once API instances scale beyond one process because event fanout is in-memory only.
- Notification delivery requires a separate worker but staging setup does not define it as a first-class service.
- API `/health` only returns a static `{"status":"ok"}` and does not validate database connectivity, migration state, or dependency readiness.
- Payment integration is split across a stub mode in the API and a separate service that has no migration story, no health endpoint, and only minimal setup docs.
- Mobile staging usage lacks a clear build/distribution path for Expo Go vs preview/dev-client vs internal staging builds.
- Seed/reset is suitable for demos but is still exposed as a dev route and not yet packaged with staging guardrails or environment-specific behavior.

## Goal

Define the exact hardening work required to make ShoeInn trustworthy in a stable staging environment for realistic end-to-end testing and demos.

## Non-Goals

- Production-grade scale architecture.
- Full security hardening for public internet exposure.
- Large redesign of customer/provider/owner product flows.
- Replacing intentionally acceptable staging stubs with full production integrations where stub behavior is good enough.

## Decisive Recommendation

The single highest-leverage next change is:

**package staging as an explicit multi-service environment with dependency-aware readiness, worker process closure, and environment-specific mobile/API configuration.**

That means one tightly related change set covering:

- real readiness checks,
- explicit API + notification-worker + database (+ optional payment) staging topology,
- staging docs/scripts/env templates,
- and mobile staging API/build configuration.

Without that closure, every other staging improvement remains fragile.
