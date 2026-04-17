# Tasks

## 1. OpenSpec artifacts

- [x] Create proposal, design, spec, and tasks for `customer-notification-center-and-live-status-surface`.
- [x] Record the first-slice placement, unread behavior, and live-refresh approach.

## 2. Backend customer notification routes

- [x] Reuse the existing notification model and schema for customer list and ack routes.
- [x] Add the minimum `/me` notification endpoints needed for the active customer flow.
- [x] Add focused backend coverage for customer notification list and acknowledgement behavior.

## 3. Mobile notification center

- [x] Add a customer notification center screen inside the active appointments flow.
- [x] Add a clear customer entry point and unread badge/count signal.
- [x] Map backend notification kinds and payloads into readable customer UI copy.

## 4. Detail/live integration

- [x] Surface the latest relevant notification context on customer appointment detail.
- [x] Invalidate customer notification queries from the existing websocket live hook.
- [x] Preserve websocket plus polling fallback behavior.

## 5. Verification

- [x] Run focused backend validation.
- [x] Run mobile typecheck.
- [x] Summarize shipped behavior and deferred follow-up work.
