# Tasks

## 1. OpenSpec artifacts

- [x] Create proposal, design, spec, and tasks for `mobile-websocket-live-job-events`.
- [x] Record the transport decision and phased rollout boundaries for this repo.

## 2. Backend live event transport

- [x] Add a small authenticated FastAPI websocket endpoint for live mobile events.
- [x] Add minimum in-memory live event publishing infrastructure without a broader event-bus rewrite.
- [x] Publish live events from provider claim, reassignment, and appointment status transition paths after successful commits.

## 3. Mobile live subscription

- [x] Add a small app-level websocket subscription hook for authenticated mobile users.
- [x] Invalidate active provider/customer React Query caches when live events arrive.
- [x] Preserve current focused polling behavior as fallback.

## 4. Active flow integration

- [x] Keep changes within the active RootTabs provider/customer flows and small shared helpers.
- [x] Ensure provider dashboard, provider appointment detail, and customer appointment detail benefit from the new event-driven invalidation path.

## 5. Verification

- [x] Add focused backend coverage for live event publishing or delivery behavior where straightforward.
- [x] Run focused API tests and mobile typecheck.
- [x] Summarize what is implemented now and what remains deferred for later phases.
