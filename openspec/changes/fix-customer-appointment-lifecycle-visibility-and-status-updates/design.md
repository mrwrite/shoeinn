## Context

Customer appointment visibility is split across backend customer reads in `apps/api/app/routers/appointments.py`, provider/company commands in `apps/api/app/routers/company_ops.py`, notification creation in `apps/api/app/services/notifications.py`, live websocket fanout in `apps/api/app/services/live_events.py`, and active mobile appointment screens under `apps/mobile/src/screens/appointments` and `apps/mobile/src/screens/customer`.

The current customer list route uses customer email matching and excludes `cancelled` and `completed`. Provider claim and reassignment flows already preserve assignment history and notify customers. Provider status update flows already record appointment events, enqueue customer status notifications, and publish live status events, but the event contract needs to include actor role and the mobile customer list/detail state must stay coherent when those events arrive.

## Goals / Non-Goals

**Goals:**

- Return customer-owned appointments throughout the active lifecycle after provider claim and status changes.
- Keep provider assignment fields independent from customer ownership and customer read authorization.
- Ensure provider status updates create a customer-visible status notification and websocket event.
- Ensure customer live events invalidate and/or immediately update appointment list, appointment detail, assignment, timeline, and notification queries.
- Keep notification counts on notification surfaces and keep the Appointments tab badge free of notification count.
- Preserve provider open/my job lists and company admin appointment visibility.

**Non-Goals:**

- Redesigning the appointment lifecycle state machine.
- Adding new appointment tables or a new notification storage model.
- Changing provider claim eligibility or company admin reassignment policy except where regressions are found.
- Reworking inactive legacy mobile stacks that are outside the active `RootTabs` flow.
- Hiding historical appointments unless a caller explicitly requests a historical/archive filter.

## Decisions

- Anchor customer appointment reads to customer ownership, not assignment state.

  The customer list and detail authorization should use `appointment.customer_id == current_user.id` when the appointment has a customer user id. A compatible fallback may keep email matching for older rows that do not yet have `customer_id`, but provider assignment, active assignment existence, and provider status must not be part of the customer ownership predicate. This directly prevents a claimed appointment from disappearing because ownership and fulfillment are separate concepts.

  Alternative considered: broaden the current email predicate only. That is less robust because staging and seeded data can drift on email casing or missing email fields, and it does not express the actual ownership contract.

- Treat active lifecycle statuses as customer-visible by default.

  Customer list filtering should not exclude `requested`, `pending_payment`, `payment_failed`, `confirmed`, `en_route_pickup`, `picked_up`, `cleaning`, `ready`, `out_for_delivery`, `delivered`, or `completed` unless the request explicitly asks for historical filtering. The only unconditional exclusions should be records that are deleted/archived by an explicit data model, and cancellation should remain visible unless the product intentionally asks for cancelled appointments to be hidden.

  Alternative considered: keep excluding `completed` to make the default list "active only". That conflicts with the requested full lifecycle visibility and makes status changes look like data loss.

- Keep provider claim as an assignment-only side effect.

  Provider claim, reassignment, and active assignment writes in `company_ops.py` should create or update `AppointmentAssignment` rows, assignment events, assignment notifications, and assignment live events without clearing or changing appointment customer ownership. The implementation should add regression tests around claim and status transitions rather than introduce a new claim path.

  Alternative considered: duplicate customer notification or list repair logic in the claim endpoint. That would hide the root issue and risk inconsistent behavior across claim, reassignment, and future assignment commands.

- Centralize provider status update side effects in the existing status command path.

  When a provider changes status, the command should capture `previous_status`, update `Appointment.status`, append an appointment status event, enqueue an `APPOINTMENT_STATUS_CHANGED` customer notification, and call live event publication after the database state is flushed. Notification payloads should include both `old_status` and `new_status`; live payloads should include `appointment_id`, `status`, `previous_status`, and `actor_role`.

  Alternative considered: rely only on websocket invalidation with no notification row. That would leave the notification center and unread counts stale when the customer is offline or misses the socket event.

- Extend the live status event contract additively.

  `publish_status_changed` should accept actor context or an actor role string and add `actor_role` to the payload. Existing fields and event type names should remain stable so current clients continue to parse `appointment_status_changed` events. Customer delivery should continue targeting the resolved customer user id plus company users where appropriate.

  Alternative considered: create a new event type for provider status updates. That would split the mobile invalidation logic without adding useful semantics for this fix.

- Use React Query cache updates plus invalidation for customer live events.

  `useLiveAppointmentEvents` should keep invalidating `customerAppointmentsQueryKey`, `appointmentQueryKey(appointmentId)`, `appointmentAssignmentQueryKey(appointmentId)`, `appointmentEventsQueryKey(appointmentId)`, and the customer notifications query for customer status and assignment events. For `appointment_status_changed`, it should also opportunistically update cached customer list/detail items for the matching `appointment_id` with the received `status` so visible screens change immediately while refetch confirms the full server state.

  Alternative considered: refetch only. Refetch is correct but can look stale until the network returns, which misses the expected immediate visible update.

- Keep notification count scoped to notification UI.

  The active `RootTabs` Appointments tab should not use notification count as a tab badge. Notification count may remain on the bell/header notification entry and notification center surfaces. This preserves prior tab-badge correction while still making customer status notifications visible.

  Alternative considered: show unread notification count on both the tab and bell. That repeats notification state on an appointment navigation target and can be mistaken for appointment count.

## Risks / Trade-offs

- [Risk] Older appointments may not have `customer_id`. -> Mitigation: support a limited email fallback while preferring `customer_id`, and add tests for the owned-row path.
- [Risk] Returning completed and cancelled appointments may increase list length. -> Mitigation: order consistently by appointment time and leave explicit historical filtering as a future product option if needed.
- [Risk] Immediate cache patching can diverge from server data if payloads are incomplete. -> Mitigation: patch only the status field for the matching appointment id, then invalidate/refetch the canonical queries.
- [Risk] Customer and provider/company live event audiences overlap. -> Mitigation: keep role-specific mobile invalidation branches and test provider/company lists after status updates.
- [Risk] Status notification fanout could duplicate existing payment-driven status notifications. -> Mitigation: only assert provider status update commands create the provider-originated status notification and avoid adding duplicate notifications in read/list code.

## Migration Plan

No database migration is expected unless implementation discovers missing `customer_id` data on appointment rows. Deploy backend and mobile changes together when possible because the backend event payload gains fields and the mobile event handler consumes them additively.

Rollback is straightforward: mobile cache patching can be removed without server changes, and the backend list filter can be reverted independently. If reverting backend status side effects, keep existing notification/live event contracts intact for other active changes.

## Open Questions

- Should cancelled appointments remain visible in the default customer Appointments list, or should they require an explicit historical filter? The stated lifecycle list names do not include cancelled, but the ownership rule says only archived/deleted should be excluded.
- Does staging data consistently populate `appointment.customer_id`, or should this change include a one-time data repair for customer-owned appointments created before that field was populated?
