# Tasks

## 1. OpenSpec artifacts

- [x] Create proposal, design, spec, and tasks for `notification-inbox-archive-and-retention`.
- [x] Record the mobile-only archive and retention boundary for the first slice.

## 2. Mobile archive behavior

- [x] Add local archive state for grouped notification cards.
- [x] Add a calm per-group archive action in the customer inbox.
- [x] Hide archived groups from the default inbox view without affecting underlying notification records.

## 3. Mobile retention behavior

- [x] Add a simple client-side retention rule for older fully read groups.
- [x] Ensure unread groups remain visible regardless of retention eligibility.
- [x] Keep archive and retention compatible with current `All` / `Unread` filters.

## 4. Verification

- [x] Run focused mobile validation where straightforward.
- [x] Run mobile typecheck.
- [x] Summarize shipped behavior and deferred follow-up work.
