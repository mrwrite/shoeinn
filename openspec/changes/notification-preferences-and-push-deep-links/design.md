# Design

## Overview

This change layers push delivery and deep linking on top of the existing in-app customer notification center. The implementation remains intentionally narrow:

- the in-app notification record remains canonical,
- push is only an additional channel for selected customer notification kinds,
- deep linking targets only the active customer appointment detail route,
- and notification preferences are limited to a small set of customer push toggles.

## Push Strategy

### Chosen first-slice push triggers

Push should fire for the highest-value customer updates that benefit from out-of-app awareness:

- `APPOINTMENT_PROVIDER_ASSIGNED`
- `APPOINTMENT_PROVIDER_REASSIGNED`
- `APPOINTMENT_CONFIRMED`
- `APPOINTMENT_STATUS_CHANGED` only when the new status is one of:
  - `ready`
  - `out_for_delivery`
  - `delivered`

This excludes noisier intermediate states such as `picked_up` and `cleaning`.

### Source of truth

The in-app notification record remains the source of truth. Push uses the same payload family and points back into the same appointment detail flow.

### Preference gating

Push creation for customers is gated by three user-level booleans:

- `customer_push_enabled`
- `customer_push_assignment_updates`
- `customer_push_milestone_updates`

If global push is disabled, no customer push notifications are enqueued. If global push is enabled, assignment and milestone push routing is filtered by the narrower toggles.

## Backend Design

### User preference model

Add three nullable-false boolean fields to `users` with defaults of `true`:

- `customer_push_enabled`
- `customer_push_assignment_updates`
- `customer_push_milestone_updates`

These fields are customer-facing only for now, but keeping them on `users` avoids creating a new preferences table for the first slice.

### User routes

Extend `/me` support with:

- `GET /me/notification-preferences`
- `PATCH /me/notification-preferences`

These are customer-scoped and return only the small push preference object needed by the mobile UI.

### Notification payload metadata

Add destination metadata into customer notification payloads:

- `destination_screen: "AppointmentDetail"`
- `destination_appointment_id: <appointment_id>`

This gives the mobile app one predictable way to route both push taps and in-app notification taps.

### Push gating logic

Implement small helpers in `app/services/notifications.py` to decide whether customer push should be enqueued for a given notification kind and payload.

The helper should:

- resolve the customer user record,
- respect the three preference fields,
- allow assignment-change pushes through the assignment toggle,
- allow milestone pushes through the milestone toggle only for the chosen status subset,
- and suppress all customer push otherwise.

## Mobile Design

### Deep-link flow

Do not introduce a broad URL-linking system. Instead:

- add a navigation container ref for imperative navigation,
- add a shared helper that routes customer notifications to `AppointmentsTab -> AppointmentDetail`,
- and reuse that helper from both push tap handling and notification-center item taps.

This is the lowest-risk way to support deep-link behavior inside the current RootTabs app.

### Push handling

Enhance `usePushNotifications` to:

- respect customer push preferences before registering/unregistering the device token,
- listen for notification responses,
- read destination metadata from the notification payload,
- and navigate into the correct appointment detail screen when tapped.

Optionally, process the last notification response on app start so a cold-open tap lands correctly.

### Notification center alignment

Notification-center row taps should use the same navigation helper rather than duplicating appointment routing logic.

### Preferences UI

Add a calm, narrow profile section for customers only:

- master toggle for push notifications
- assignment update push toggle
- milestone push toggle

Keep the UI additive to the existing profile screen instead of creating a separate settings area.

## Risks

- Device token registration and local permission state can drift from server preference state; the first slice should prefer explicit unregister when the master push toggle is turned off.
- Push payload routing must stay limited to known active customer screens to avoid navigation regressions.
- Some existing pushes may already be emitted for statuses outside the desired subset; gating logic must be centralized so the rule is predictable.

## Validation

This change should validate:

- customer push gating respects preferences,
- push payloads include appointment-detail destination metadata,
- tapping a push notification navigates to the correct appointment detail screen,
- tapping an in-app notification uses the same routing path,
- and customer preferences can be read and updated from the active profile flow.
