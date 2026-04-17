# Tasks

## 1. OpenSpec artifacts

- [x] Create proposal, design, spec, and tasks for `notification-inbox-filters-and-priority-segmentation`.
- [x] Record the mobile-only boundary and compatibility requirements with the current grouped inbox.

## 2. Mobile filtering

- [x] Add a minimal `All` / `Unread` filter state to the customer notification center.
- [x] Apply filtering after existing notification grouping so unread group semantics remain correct.
- [x] Add an appropriate empty state for the `Unread` view.

## 3. Priority-aware presentation

- [x] Add a small mobile helper for classifying high-priority latest updates.
- [x] Update grouped card UI so high-value latest updates stand out and lower-value updates remain calmer.
- [x] Preserve current grouped tap, read-state, and deep-link behavior.

## 4. Verification

- [x] Run focused mobile validation where straightforward.
- [x] Run mobile typecheck.
- [x] Summarize shipped behavior and deferred follow-up work.
