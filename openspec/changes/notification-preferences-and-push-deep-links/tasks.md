# Tasks

## 1. OpenSpec artifacts

- [x] Create proposal, design, spec, and tasks for `notification-preferences-and-push-deep-links`.
- [x] Record the first-slice push triggers, deep-link path, and preference boundaries.

## 2. Backend push and preference slice

- [x] Add the minimum customer notification preference model and `/me` preference routes.
- [x] Gate customer push delivery to the selected high-value assignment and milestone updates.
- [x] Add destination metadata to customer notification payloads for appointment-detail deep links.
- [x] Add focused backend coverage for preference updates and push gating behavior.

## 3. Mobile deep links and push handling

- [x] Add a shared customer notification navigation helper for appointment-detail destinations.
- [x] Route in-app notification taps through the shared destination helper.
- [x] Handle push notification taps and cold-open responses with the same destination helper.

## 4. Mobile preferences UI

- [x] Add a narrow customer notification preference section in the active profile flow.
- [x] Keep push token registration behavior aligned with the master push preference.
- [x] Preserve the current in-app notification center and websocket refresh behavior.

## 5. Verification

- [x] Run focused backend validation.
- [x] Run mobile typecheck.
- [x] Summarize shipped behavior and deferred follow-up work.
