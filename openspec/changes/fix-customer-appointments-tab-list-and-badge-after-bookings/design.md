## Context

The Appointments tab uses a nested stack so payment return flows and notification/deep-link flows can open appointment detail directly. React Navigation preserves nested stack state, so after opening `AppointmentDetail`, tapping the same tab can keep showing `AppointmentDetail` instead of returning to `AppointmentList`.

Appointment list data was recently made refresh-safe through centralized query keys and focus refetch. This change focuses on the remaining navigation entry-point bug and incorrect badge source.

## Goals / Non-Goals

**Goals:**
- Tapping the customer Appointments tab always returns the nested appointment stack to `AppointmentList`.
- Preserve explicit detail navigation from payment return, notifications, deep links, and appointment cards.
- Keep appointment list query invalidation/refetch behavior intact.
- Remove notification unread count from the Appointments tab badge.

**Non-Goals:**
- Backend appointment list changes unless data is missing.
- Redesigning tab navigation or route names outside customer appointments.
- Changing owner/provider tabs.
- Reworking notification surfaces.

## Decisions

- Handle the tab press at the root tab level and reset/navigate the nested Appointments stack to `AppointmentList`.
- Use this only for direct tab presses, not programmatic navigation that intentionally targets `AppointmentDetail`.
- Prefer no Appointments tab badge over a misleading notification badge. Notification counts remain on the notification/bell surface.
- Keep focus refetch on `AppointmentListScreen` as the data freshness safety net once the tab returns to list.

## Risks / Trade-offs

- Resetting stack on every Appointments tab press means a customer currently viewing detail can quickly return to the list by tapping the tab. This matches the requested list-entry behavior.
- Removing the badge loses a generic attention cue, but avoids showing notification state as appointment count.
