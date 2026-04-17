# Design

## Overview

This change adds the first customer-facing notification center to the active RootTabs mobile flow and connects it to the existing live-update architecture. The design intentionally stays narrow:

- reuse the existing `notifications` table and read/ack model,
- expose customer notification list and acknowledgement under `/me`,
- add one customer notification center screen in the active appointments flow,
- add unread badge and entry points in the current navigation,
- and keep live refresh driven by websocket-triggered query invalidation plus existing focused polling.

## Backend Design

### Reuse existing notification model

The backend already stores customer-facing in-app notifications and tracks `read_at`. The first slice should not introduce a new notification storage model.

### Customer routes

Add customer-scoped routes under `/me`:

- `GET /me/notifications`
- `POST /me/notifications/{notification_id}/ack`

These mirror the existing company-side behavior, but authorize access using the current customer identity and the notification target.

### Serialization

Reuse `NotificationRead`. No new schema is needed for the first slice because mobile can derive display copy from `kind` and `payload`.

### Backend changes out of scope

- unread-count endpoint
- bulk acknowledgement
- notification grouping
- server-side presentation copy

The client can compute unread count from the fetched list for now.

## Mobile Design

### Navigation placement

The notification center belongs in the active customer appointments flow because it is directly tied to appointment progress and live service updates.

Implementation:

- add a `CustomerNotifications` screen to the active appointments stack,
- add a header action on `AppointmentListScreen`,
- add a badge on the customer appointments tab for unread count,
- and add a secondary entry point from profile if useful later, but keep the first slice centered on appointments.

This keeps the feature close to the customer’s existing operational surface.

### Notification query model

Use a dedicated React Query key:

- `["me", "notifications"]`

This query powers:

- the notification center list,
- the unread tab badge,
- and the “recent update” card on appointment detail.

### Notification row structure

Each row should show:

- title
- short detail
- relative time or localized timestamp
- unread/read visual state

Rows should feel concise and operational rather than chat-like.

### Customer-readable copy

Map existing backend kinds into simple UI copy:

- `APPOINTMENT_PROVIDER_ASSIGNED`: provider assigned
- `APPOINTMENT_PROVIDER_REASSIGNED`: provider changed
- `APPOINTMENT_STATUS_CHANGED`: appointment milestone updated
- `APPOINTMENT_CONFIRMED`: appointment confirmed
- payment-related kinds remain secondary and can use a generic fallback if they appear

The detail line should use payload fields such as `new_provider_name`, `old_provider_name`, `old_status`, and `new_status` when present.

### Appointment detail alignment

Customer appointment detail should show a small “Recent update” surface when a relevant notification exists for that appointment. This surface should:

- reuse the same notification query,
- highlight the latest unread or latest relevant notification,
- avoid duplicating the entire inbox,
- and keep the detail screen aligned with the notification center.

### Read state

For the first slice:

- entering the notification center does not auto-mark everything read,
- tapping a notification row acknowledges that one notification,
- acknowledged rows refresh to a read state,
- and the unread badge updates from the same query.

This is the smallest correct behavior that preserves intent and avoids surprise.

### Live refresh behavior

The existing websocket invalidation hook should also invalidate `["me", "notifications"]` for customers on assignment and status events.

The notification center screen should also use focus-aware refresh so:

- new notifications show up if the socket was missed,
- acknowledgement results stay current,
- and the feature remains resilient.

## Risks

- The backend currently stores raw kinds/payloads, so client-side copy mapping must be kept coherent and conservative.
- Some status-change notifications may feel repetitive if the UI shows every transition equally; the first slice should emphasize clarity and brevity over visual noise.
- Badge count is derived client-side from the list, which is acceptable now but may need optimization later.

## Validation

This change should validate:

- customer notification routes return only the current customer’s in-app notifications,
- customer ack updates `read_at`,
- the appointments tab badge updates from unread notifications,
- the notification center renders readable customer copy,
- websocket-driven events invalidate customer notification queries,
- and appointment detail surfaces the latest relevant notification without replacing the existing timeline.
