# Design

## Overview

This change improves the customer notification center through mobile-side grouping and coalescing only. The backend remains unchanged in the first slice. Existing notification records, ordering, unread state, and APIs continue to work exactly as they do now; the client derives a grouped presentation on top.

## Grouping Strategy

### Chosen: mobile-only grouping

The first slice should group notifications in the mobile query/presentation layer rather than at the backend because:

- the current API already returns the raw ordered records needed for grouping,
- unread/read behavior already exists and should not be destabilized,
- grouping policy is still product-facing and may evolve quickly,
- and changing storage or server query semantics would introduce unnecessary risk.

### Group key

Group by `appointment_id` when present. Notifications without an appointment stay as standalone items.

Within each appointment group:

- sort newest first,
- choose the latest notification as the primary visible update,
- and keep older notifications available in a subdued secondary stack.

## Coalescing Strategy

### Updates that remain distinct as latest highlights

These updates should retain high prominence when they are the latest item in a group:

- `APPOINTMENT_PROVIDER_ASSIGNED`
- `APPOINTMENT_PROVIDER_REASSIGNED`
- `APPOINTMENT_STATUS_CHANGED` when `new_status` is `ready`
- `APPOINTMENT_STATUS_CHANGED` when `new_status` is `out_for_delivery`
- `APPOINTMENT_STATUS_CHANGED` when `new_status` is `delivered`
- `APPOINTMENT_CONFIRMED`

### Updates that should be softened

Lower-value or more repetitive notifications should still exist but have reduced prominence when older than the latest update:

- repeated `APPOINTMENT_STATUS_CHANGED` entries for intermediate states
- repeated milestone/status items for the same appointment once a newer higher-value item exists

The first slice does not delete or hide these records. It only changes how older updates are rendered.

### Presentation rule

For each appointment group:

- show one primary card section for the latest notification,
- show up to a small number of older updates inline in a subdued stack,
- collapse any remaining older items behind a short summary count if needed.

This creates calmness without implying information was dropped.

## Mobile UX

### Inbox layout

Render the customer inbox as a list of grouped appointment cards instead of raw notification rows.

Each group card includes:

- appointment-level context header
- latest update title/detail/time
- unread state for the group when any contained item is unread
- subdued older-update rows
- one tap target that still opens appointment detail

Notifications without an appointment id render as standalone cards using the current row treatment.

### Visual tone

- the latest update gets the strongest styling,
- older updates use muted text and lighter surfaces,
- unread state is applied at the group level,
- and the overall card remains compact and easy to scan.

### Read behavior

Keep current semantics:

- tapping a grouped appointment card acknowledges only the latest unread notification that the user interacted with in this first slice,
- older unread notifications are not bulk-marked automatically,
- and the group unread visual state remains driven by whether any contained notification is unread.

This avoids surprising backend changes while still making the UI calmer.

## Detail Alignment

The appointment detail “recent update” surface should continue to use the latest notification for that appointment. The grouped inbox does not change that logic; it simply makes the same latest item more obvious at the inbox level.

## Risks

- Group-level unread styling can make a group look unread even when only an older item is unread. That is acceptable for the first slice because it preserves trust better than accidentally hiding unread state.
- Coalescing is presentation-only, so counts and copy must avoid implying records were deleted or suppressed.

## Validation

This change should validate:

- notifications are grouped by appointment in the inbox,
- the latest notification for an appointment is visually primary,
- older updates are softened but still visible,
- standalone notifications still render correctly,
- and appointment detail continues to show the latest relevant update consistently.
