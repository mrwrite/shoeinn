# Design

## Overview

This change stays mobile-only in the first slice. The current backend notification list remains the source of truth for raw notification records, while the mobile inbox adds two presentation controls:

- local archive state for grouped cards,
- and a client-side retention layer for very old read groups.

## Archive Strategy

### Chosen: local archive state

The first slice should store archived state locally on device rather than in the backend because:

- archive is initially a personal inbox-management preference,
- the current backend model does not need to change to support it,
- rollout risk stays low,
- and the UX can be validated before deciding whether cross-device persistence is worth server support.

### Archive key

Archive by grouped card identity:

- prefer `appointment_id` for grouped appointment cards,
- fall back to a standalone notification key for non-appointment notifications.

The archive state should be stable enough for the current grouped inbox model without requiring schema changes.

### Archive behavior

- Archiving a grouped card hides it from the default inbox.
- Archiving does not delete notifications or change their read state.
- If a previously archived group receives a new unread notification, the group should become visible again in the default inbox so real-time updates are not accidentally hidden.

This last rule is important for trust.

## Retention Strategy

### Chosen: client-side hiding or soft de-prioritization for old read groups

The first slice should not introduce a user-facing retention settings system. Instead, it should apply one simple client-side rule to fully read groups older than a threshold, for example:

- consider groups with latest activity older than 30 days as retention-eligible,
- hide them from the default inbox view or place them after active items in a subdued section.

The smallest first slice is to hide retained groups from the default inbox alongside archived items while keeping the underlying data intact.

### Retention boundaries

- never auto-hide unread groups,
- never auto-hide groups with a recent high-priority unread update,
- and avoid changing read-state semantics.

## Inbox UX

### Default inbox

The default inbox should show:

- active non-archived groups,
- current filtering behavior such as `All` and `Unread`,
- and the existing read-state and deep-link actions.

Archived groups should be excluded by default.

Retention-eligible old read groups should also be excluded or softened depending on final implementation choice, with a bias toward the smallest calm behavior.

### Action affordance

Add a lightweight per-group archive action using the existing calm action pattern, not a swipe system or edit mode.

### Optional secondary access

If needed in the first slice, a simple local toggle such as `Show archived` can reveal archived groups. If that feels too large, the change may ship with archive-as-hide only and defer explicit archived browsing.

## Compatibility

This change must remain compatible with:

- grouped-by-appointment logic,
- group unread/read behavior,
- existing `All` / `Unread` filtering,
- current `Mark read` / `Mark all read` actions,
- and current live refresh behavior.

## Risks

- Local-only archive state will not sync across devices. That is acceptable for the first slice if clearly treated as a personal inbox-management preference.
- Auto-hiding old read groups can feel like missing history if overdone. The threshold and rules should therefore be conservative and never hide unread groups.

## Validation

Validate:

- a grouped card can be archived,
- archived cards no longer appear in the default inbox,
- archived state does not interfere with read-state/grouping behavior,
- and newly unread updates can bring an archived group back into view if that rule is implemented.
