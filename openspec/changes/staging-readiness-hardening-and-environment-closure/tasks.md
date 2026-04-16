# Tasks

## 1. Staging topology and environment closure

- [x] Define the supported staging service topology for API, database, notification worker, and optional payment service.
- [x] Add environment templates and docs that clearly separate local, staging, and optional-integrations behavior.
- [x] Document required staging secrets, optional secrets, and acceptable stub modes.

## 2. Readiness and operational hardening

- [x] Replace the current shallow API health check with dependency-aware health/readiness endpoints.
- [x] Add startup/runbook guidance for worker processes and service ordering.
- [ ] Define log/monitoring expectations for staging validation.

## 3. Migration and data safety

- [ ] Add a documented fresh-database bootstrap flow for staging.
- [ ] Add an upgrade-path validation flow for already-migrated databases.
- [ ] Define staging seed/reset policy, access, and expected demo/test behavior.

## 4. Live updates and integration reliability

- [ ] Decide whether staging will remain single-instance for live events or whether websocket fanout must move to a shared transport.
- [ ] Define acceptable staging behavior for payment integration, push delivery, and deep links.
- [ ] Add clear mobile staging configuration/build guidance for internal testers and demos.

## 5. Validation gate

- [x] Define the staging-ready checklist covering migrations, startup, seed/reset, auth, owner/provider/customer flows, websocket behavior, notifications, and payment expectations.
