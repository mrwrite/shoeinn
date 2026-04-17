# Design

## Overview

This change stays entirely in the mobile customer inbox. The backend remains unchanged. The existing notification list query, grouping helpers, read-state model, WebSocket invalidation, polling fallback, push delivery, and deep-link behavior all continue to work as they do today.

## Filtering Strategy

### Chosen: client-side group-level filtering

Apply filtering after `groupCustomerNotifications(...)` returns grouped appointment cards. This is the safest option because:

- the existing API already returns the raw records needed,
- unread behavior is already defined at the group level,
- the new filter is presentational rather than data-model-driven,
- and keeping the logic in mobile avoids API changes and rollout risk.

### Filter options

Support exactly two states in the first slice:

- `All`
- `Unread`

`Unread` includes any grouped card where at least one child notification is unread. Standalone notifications follow the same rule.

### UI control

Use a compact segmented-control style row near the inbox header rather than tabs or a separate filter sheet. The control should feel lightweight and remain visible without dominating the screen.

## Priority Segmentation

### High-value updates

These updates should receive stronger visual emphasis when they are the latest notification in a group:

- `APPOINTMENT_PROVIDER_ASSIGNED`
- `APPOINTMENT_PROVIDER_REASSIGNED`
- `APPOINTMENT_STATUS_CHANGED` with `new_status=ready`
- `APPOINTMENT_STATUS_CHANGED` with `new_status=out_for_delivery`
- `APPOINTMENT_STATUS_CHANGED` with `new_status=delivered`

### Lower-value updates

Other updates remain visible but should use quieter treatment:

- subtler eyebrow/metadata treatment,
- less saturated accenting,
- and de-emphasis relative to the latest high-value update.

The first slice should not hide low-value updates or invent a larger priority taxonomy. It only improves contrast between more important and less important grouped updates.

### Implementation shape

Extend the existing mobile helper layer with a small priority classifier that returns presentation metadata for a notification or grouped card, for example:

- whether the latest notification is high priority,
- an accent token or style variant,
- and optional label text like `Assignment update` or `Delivery milestone`.

That keeps priority rules centralized and makes the screen component simpler.

## Mobile UX

### Inbox header

The inbox header should contain:

- title/subtitle,
- the existing `Mark all read` action when applicable,
- and the new `All` / `Unread` segmented filter.

### Grouped card presentation

Keep the grouped card structure introduced earlier. Enhance it with:

- stronger title/accent treatment for high-priority latest updates,
- calmer styling for lower-priority latest updates,
- and preserved unread/read visuals at the group level.

### Empty states

When `Unread` is selected and there are no unread groups, show a quiet empty state such as “You’re all caught up” rather than reusing the generic no-notifications state.

## Compatibility

This design remains compatible with:

- current `groupCustomerNotifications(...)` output,
- current group read behavior,
- current cache invalidation and polling fallback,
- and current navigation behavior on tap.

## Risks

- Too much visual emphasis could make the inbox feel louder, not calmer. The styling should therefore be restrained and driven mostly by accent color, eyebrow copy, and border/background intensity.
- Filtering after grouping means the raw unread count remains unchanged underneath, which is acceptable because the filter is a view control, not a new data model.

## Validation

Validate:

- `Unread` only shows groups with at least one unread child,
- switching filters does not break grouped tap/read behavior,
- high-priority latest updates are visually distinguishable from lower-priority ones,
- and existing navigation and grouping behavior remain unchanged.
