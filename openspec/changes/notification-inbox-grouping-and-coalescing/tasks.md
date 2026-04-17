# Tasks

## 1. OpenSpec artifacts

- [x] Create proposal, design, spec, and tasks for `notification-inbox-grouping-and-coalescing`.
- [x] Record the mobile-only grouping/coalescing boundary and first-slice rules.

## 2. Grouping/coalescing helpers

- [x] Add small shared mobile helpers to group notifications by appointment and derive the latest versus older updates.
- [x] Define the first-slice coalescing rules for high-value versus softened updates.

## 3. Inbox UI

- [x] Update the customer notification center to render grouped appointment cards.
- [x] Keep standalone notifications rendering sensibly when no appointment id exists.
- [x] Preserve tap-to-detail behavior and existing read/ack flow.

## 4. Detail alignment

- [x] Keep the appointment detail recent-update surface aligned with the grouped inbox latest update.
- [x] Avoid contradictory latest-update logic between inbox and detail.

## 5. Verification

- [x] Run focused validation for notification inbox behavior where straightforward.
- [x] Run mobile typecheck.
- [x] Summarize shipped behavior and deferred follow-up work.
