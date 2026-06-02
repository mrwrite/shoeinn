## Why

Customers can currently lose visibility into an appointment after a provider claims it and moves it through active statuses such as `en_route`. This breaks the customer booking lifecycle in staging because the Appointments tab no longer reflects customer-owned work and the customer does not receive live status or notification updates.

## What Changes

- Keep customer appointment list endpoints anchored to `appointment.customer_id == current_user.id` across the active lifecycle unless an appointment is explicitly archived, deleted, or intentionally requested through a historical filter.
- Preserve customer ownership when a provider claims an appointment or assignment/status fields change.
- Emit customer-targeted notification and live appointment status events when a provider updates appointment status.
- Include `appointment_id`, `status`, `previous_status` when available, and actor role in appointment status live event payloads.
- Update mobile appointment state handling so customer appointment lists/details refetch or update immediately after live status events.
- Keep notification counts scoped to notification surfaces and prevent the Appointments tab badge from using notification count.
- Preserve existing provider and company admin appointment views.

## Capabilities

### New Capabilities

- `appointment-lifecycle-visibility`: Defines customer appointment visibility across claimed and active lifecycle states, status update event semantics, customer notifications, and mobile appointment list/detail update behavior.

### Modified Capabilities

- None.

## Impact

- Backend appointment list endpoints and customer role filters.
- Backend provider claim and appointment status update endpoints.
- Backend notification, outbox, and live event publishing for appointment status changes.
- Mobile appointment list/detail fetching, local filtering, cache invalidation, WebSocket status event handling, notification count handling, and tab badge behavior.
- Regression coverage for customer, provider, and company admin appointment views.
