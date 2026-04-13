# Notification Inbox Archive And Retention

## Summary

Add a lightweight archive action for grouped customer notification cards and a simple client-side retention layer so older, less relevant notifications stop crowding the default inbox without introducing deletion, folders, or backend complexity.

## Problem

The customer inbox now supports grouping, read-state actions, filtering, priority-aware presentation, and live updates. That helps a lot in the short term, but over time the inbox will still accumulate more appointment groups than customers want to scan repeatedly.

Customers need a way to clear older resolved notification groups out of the default view without losing history entirely. They also need a gentler way to keep very old, already-read groups from dominating the main inbox.

## Goals

- Let customers archive grouped notification cards by appointment group.
- Hide archived groups from the default inbox view.
- Add a simple client-side retention rule for older read groups so the inbox stays easier to scan.
- Preserve compatibility with grouped notifications, read-state behavior, filtering, and live refresh.
- Keep the first slice mobile-only and low-risk.

## Non-Goals

- Permanent deletion of notifications.
- Adding folders, labels, or a multi-view inbox management system.
- Introducing backend-driven retention rules in the first slice.
- Changing backend notification schemas or APIs unless later justified.
- Adding pagination.

## Proposed Approach

- Add a local archive state keyed by grouped notification identity, centered on appointment groups.
- Keep archive behavior client-side for the first slice so no backend changes are required.
- Hide archived groups from the default inbox presentation while leaving underlying notification data untouched.
- Add a small client-side retention rule for old read groups, such as hiding or de-emphasizing groups older than a threshold once they are fully read.
- Keep unread and high-priority active groups visible and unaffected by retention.

## Impact

- Customers can reduce inbox clutter without destroying history.
- The default inbox stays calmer as notification volume grows.
- The change remains easy to roll out because it layers on top of the current grouped mobile inbox rather than altering backend behavior.
