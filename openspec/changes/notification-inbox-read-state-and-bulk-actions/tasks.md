# Tasks

## 1. OpenSpec artifacts

- [x] Create proposal, design, spec, and tasks for `notification-inbox-read-state-and-bulk-actions`.
- [x] Record the first-slice group read behavior and lightweight bulk action scope.

## 2. Backend

- [x] Add an additive customer notification `mark all read` endpoint.
- [x] Add focused backend coverage for bulk acknowledgment behavior.

## 3. Mobile grouped read behavior

- [x] Add grouped unread helpers for marking a whole appointment group read.
- [x] Change grouped card taps to acknowledge the full unread group before deep-link navigation.
- [x] Add a calm group-level `Mark read` action.

## 4. Mobile bulk actions

- [x] Add an inbox-wide `Mark all read` action in the customer notification center.
- [x] Keep grouped unread/read visuals aligned with the new read behavior.

## 5. Verification

- [x] Run focused backend/mobile validation where straightforward.
- [x] Run mobile typecheck.
- [x] Summarize shipped behavior and deferred follow-up work.
