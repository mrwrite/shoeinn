# Notification Inbox Grouping And Coalescing

## Summary

Reduce customer inbox noise by grouping related notifications per appointment in the mobile inbox and coalescing lower-value repeated updates into a calmer, easier-to-scan presentation, while preserving the existing notification records, unread/read behavior, and tap-to-detail flow.

## Problem

The customer notification center now works, but as appointments accumulate updates it can start to feel repetitive:

- multiple notifications for the same appointment appear as flat repeated rows,
- the latest meaningful update is not visually separated from older less-important ones,
- repeated status updates can make the inbox feel noisy even when nothing is broken,
- and the inbox can start to feel more spammy than premium despite the underlying information being correct.

The next step should improve presentation and calmness without introducing a full messaging system or hiding important state unfairly.

## Goals

- Group related notifications by appointment in the customer inbox.
- Make the latest relevant update visually obvious.
- Reduce the prominence of older or lower-value repeated status updates.
- Keep tap-to-detail behavior intact.
- Preserve the current backend notification records and unread/read semantics.

## Non-Goals

- Rewriting notification storage or introducing a backend conversation/thread model.
- Changing push routing, notification preferences, or the underlying delivery pipeline.
- Hiding high-value customer updates such as provider assignment, reassignment, `ready`, `out_for_delivery`, or `delivered`.
- Redesigning the entire customer inbox or profile experience.

## Proposed Approach

- Keep grouping and coalescing in the mobile query/presentation layer only for the first slice.
- Group notifications by `appointment_id` when present.
- Render one compact appointment group card with:
  - the latest highlighted update,
  - a subdued list of older updates for that appointment,
  - and a count or summary for additional updates when helpful.
- Keep high-value updates visually distinct in the group.
- Soften lower-value or repeated status updates by moving them into the older-updates stack instead of showing them as separate top-level cards.

## Impact

- The inbox should feel calmer and more premium as updates accumulate.
- Customers should still understand what changed most recently for each appointment.
- The appointment detail “recent update” surface can stay aligned with the grouped inbox by continuing to reflect the latest relevant notification for that appointment.
