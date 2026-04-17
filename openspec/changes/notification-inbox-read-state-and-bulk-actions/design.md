# Design

## Overview

This change refines the existing grouped customer inbox rather than replacing it. The grouped card remains the primary model. Read semantics become group-aware on the client, and one additive backend endpoint supports inbox-wide bulk acknowledgment.

## Read-State Strategy

### Group unread state

A grouped appointment card is unread when any notification in the group has `read_at == null`.

This keeps unread state conservative and trustworthy.

### Group card tap behavior

Tapping a grouped appointment card should:

1. acknowledge all unread notifications in that group,
2. refresh the inbox cache,
3. then navigate to the appointment detail screen.

This is the smallest predictable behavior because the user interacted with the whole grouped card, not just one child update.

### Child item behavior

If older child items are individually visible, they remain informational in the first slice. They do not need separate tap targets or custom read flows yet. This avoids making the calm grouped card feel busy.

## Bulk Actions

### Group action

Each unread grouped card gets a subdued `Mark read` action in the footer. That action acknowledges all unread notifications in the group without navigating away.

### Inbox-wide action

The inbox header gets a single `Mark all read` action when any unread notifications exist.

This is intentionally the only inbox-wide bulk action in the first slice.

## Backend/API

### Existing routes reused

- `POST /me/notifications/{notification_id}/ack` stays as-is for individual acknowledgments.
- `GET /me/notifications` stays as the source of raw notification records.

### New route

Add:

- `POST /me/notifications/ack-all`

Behavior:

- marks all unread in-app notifications for the authenticated customer as read,
- sets `read_at` for each unread record,
- fills `delivered`, `delivered_at`, and `status` if needed for consistency with the single-ack route,
- returns a compact summary such as `{"updated": <count>}`.

This is additive and low-risk. It avoids client-side fan-out for the most common bulk action.

## Mobile UX

### Inbox presentation

Keep the grouped appointment-card layout. Add:

- a header action for `Mark all read`,
- clearer unread counts on grouped cards,
- a footer `Mark read` action for unread groups,
- and group tap behavior that clears the entire group before opening detail.

### Visual tone

Actions should stay calm:

- text-button style instead of heavy buttons,
- no destructive language,
- and no edit mode or selection mode.

## Detail Alignment

The appointment detail recent-update card should continue to show the latest notification for that appointment. Once a group is marked read, that recent-update surface should naturally lose its unread emphasis because it reads from the same underlying notification records.

## Risks

- Group tap now acknowledges more records than before. That is intentional and should match customer expectations better because the interaction target is the whole appointment card.
- `Mark all read` is one-way. That is acceptable because the repo already models read as one-way and does not support unread restoration.

## Validation

Validate:

- group unread state reflects any unread child,
- tapping an unread group marks all unread children in that group as read,
- `Mark read` on a group clears that group without navigation,
- `Mark all read` clears all unread customer inbox notifications,
- and appointment detail recent-update styling stays aligned after read state changes.
