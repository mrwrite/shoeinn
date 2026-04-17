# Design

## Overview

This is a staging-readiness evaluation artifact, not an implementation spec for a single code bug. The repo already supports credible local usage, but staging introduces a different standard:

- repeatable deployment,
- realistic shared-environment behavior,
- operational clarity,
- and integration reliability across app boundaries.

The evaluation therefore focuses on active runtime paths only.

## Active Runtime Surfaces Evaluated

### API

- `apps/api/app/main.py`
- `apps/api/app/core/*`
- `apps/api/app/routers/*`
- `apps/api/app/services/*`
- `apps/api/app/workers/*`
- `apps/api/alembic/*`

### Mobile

- `apps/mobile/App.tsx`
- `apps/mobile/app.config.ts`
- `apps/mobile/src/api/*`
- `apps/mobile/src/navigation/*`
- `apps/mobile/src/hooks/*`

### Payment

- `apps/payment/app/*`

### Docs and operational setup

- root `README.md`
- `apps/api/README.md`
- `apps/mobile/README.md`
- `apps/payment/README.md`
- `apps/api/docker-compose.yml`
- `.github/workflows/api-ci.yml`

## Repo-Grounded Findings

### 1. Backend/API is not yet packaged as a staging service set

The API process starts the payment sync worker in-process, but the notification worker is manual and not part of app startup. The current setup therefore has no single authoritative staging topology that answers:

- which processes must run,
- in what order,
- with which env vars,
- and with which health checks.

The repo also contains configuration flags like `enable_notification_dispatcher` and `db_auto_create` that are not fully expressed as a staging contract.

### 2. Readiness and observability are too weak

`/health` is static and does not validate:

- database connectivity,
- migration state,
- notification outbox readiness,
- payment service reachability,
- or websocket/live-event viability.

This is acceptable for local dev but weak for staging, where health checks are part of rollout safety.

### 3. Live events are single-process only

`app/services/live_events.py` keeps websocket connections and fanout in process memory. This means:

- one API instance can push to its own sockets,
- but multiple API instances will not share live events,
- so staging behavior becomes inconsistent once the deployment grows beyond a single process.

This is one of the most important staging-specific gaps because local demos can hide it.

### 4. Migration state is usable but the history is fragile

The current graph resolves to one head, but the Alembic history shows repeated branchpoints and merge migrations. That is survivable, but it increases the importance of:

- disciplined fresh-database checks,
- upgrade testing in CI,
- and explicit staging reset/bootstrap workflows.

Recent assignment work also showed that “fresh DB works” and “already-migrated DB upgrades cleanly” are separate concerns. Staging should explicitly validate both.

### 5. Payment service is not staging-packaged

The API supports stub payment behavior when `PAYMENT_SERVICE_BASE_URL` is unset. That is acceptable for staging if clearly intentional.

But if real payment-service integration is desired in staging, the current payment service is under-specified:

- no Alembic migration system,
- startup relies on `Base.metadata.create_all`,
- no health endpoint,
- no deployment docs beyond local notes,
- no CI workflow at the repo level for staging expectations,
- and no clear webhook/public callback story.

This makes the payment service either:

- a deliberate non-goal for staging, or
- a P0/P1 hardening target if realistic payment flows matter in staging.

### 6. Mobile staging config is improved but not fully packaged

The mobile app now resolves API URLs more safely for local Expo use, but staging still lacks:

- explicit staging env templates,
- documented staging build mode,
- clear EAS/dev-client/Expo Go guidance for internal testers,
- and environment-specific push/deep-link expectations.

There is also no `eas.json` in the active mobile app, which makes preview/staging build profiles unclear.

### 7. Sensitive/local assumptions remain in repo state

The committed `apps/mobile/.env` includes a Google Maps API key. Even if this is only for local usage, it is a staging-readiness smell because it shows environment handling is not yet cleanly separated from checked-in repo state.

### 8. Docs still reflect local-demo assumptions

The docs are strongest for Windows local development. They are not yet equally strong for:

- staging bootstrap,
- environment variable inventory,
- required services by mode,
- mobile distribution strategy,
- seed/reset policy in staging,
- and rollout validation.

Some docs also contradict runtime behavior, such as the CQRS note that hold cleanup starts automatically while the current API startup only starts the payment sync worker.

## Product And Demo Implications In Staging

### Acceptable staging shortcuts

- Stub payment behavior is acceptable in staging if the UI and docs clearly say payment is simulated.
- Seed/reset routes are acceptable in staging if restricted and intentionally labeled as demo/test tooling.
- Expo push can remain a staging integration rather than full production push hardening.

### Unacceptable staging fragility

- Shared staging where notifications silently require a forgotten manual worker.
- Shared staging where live updates only work when traffic happens to hit the same API instance.
- Shared staging with ambiguous mobile API endpoints or undocumented build paths.
- Shared staging with no reliable health/readiness signal.

## Best Next Change

The best next change is a single staging-closure change set:

- define a supported staging topology,
- add dependency-aware readiness endpoints,
- make worker services explicit,
- add staging env templates and docs,
- package seed/reset behavior for staging,
- and define mobile staging connection/build rules.

This is better than implementing isolated fixes because it turns staging from “possible” into “operationally coherent.”
