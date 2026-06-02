## 1. Backend Investigation And Tests

- [x] 1.1 Inspect customer appointment list/detail filters in `apps/api/app/routers/appointments.py` and confirm whether current ownership checks use `customer_id`, email fallback, or status exclusions.
- [x] 1.2 Inspect provider claim, reassignment, and status update flows in `apps/api/app/routers/company_ops.py` for customer ownership preservation and status side effects.
- [x] 1.3 Add backend regression coverage proving customer appointment list includes a customer-owned appointment after provider claim.
- [x] 1.4 Add backend regression coverage proving customer appointment list includes a customer-owned appointment after provider status update to an active lifecycle status.
- [x] 1.5 Add backend regression coverage proving provider status update creates a customer status notification and publishes or records the expected live status event payload fields.
- [x] 1.6 Add backend regression coverage proving provider open/my lists and company admin appointment view remain correct after claim and status update.

## 2. Backend Implementation

- [x] 2.1 Update customer appointment list filtering to prefer `Appointment.customer_id == current_user.id`, keep only necessary legacy email fallback, and avoid excluding claimed or active lifecycle statuses by default.
- [x] 2.2 Update customer appointment detail/read authorization to use the same customer ownership semantics and preserve access after assignment/status changes.
- [x] 2.3 Verify provider claim and reassignment commands preserve appointment customer ownership and do not modify ownership fields.
- [x] 2.4 Update provider status update side effects to consistently capture `previous_status`, append appointment status history, enqueue `APPOINTMENT_STATUS_CHANGED` for the customer, and publish a live status event.
- [x] 2.5 Extend live status event publication to include `actor_role` while preserving existing `appointment_status_changed`, `appointment_id`, `status`, and `previous_status` fields.
- [x] 2.6 Run targeted backend tests for appointment listing, assignment claiming, status updates, customer notifications, and provider/company admin views.

## 3. Mobile Investigation And Tests

- [x] 3.1 Inspect active mobile appointment list/detail query usage, local filtering, focus refresh, websocket handling, notification query invalidation, and Appointments tab badge behavior.
- [x] 3.2 Add mobile test coverage proving a customer appointment list item is not dropped when an appointment status live event is processed.
- [x] 3.3 Add mobile test coverage proving a websocket status update invalidates or refetches customer appointment list/detail and notification queries.
- [x] 3.4 Add mobile test coverage proving notification unread count remains on notification surfaces and is not used as the Appointments tab badge.

## 4. Mobile Implementation

- [x] 4.1 Update `useLiveAppointmentEvents` to handle status events by invalidating customer appointment list, appointment detail, appointment events, assignment, and customer notification queries.
- [x] 4.2 Update `useLiveAppointmentEvents` to optimistically patch cached customer appointment list/detail status for matching `appointment_id` when `appointment_status_changed` includes a status.
- [x] 4.3 Ensure active customer appointment list/detail screens do not locally filter out claimed or active lifecycle appointments returned by the backend.
- [x] 4.4 Confirm the active `RootTabs` Appointments tab has no notification-count badge while notification buttons/surfaces still show unread notification count.
- [x] 4.5 Run mobile typecheck and targeted tests for appointment list/detail live event handling and notification badge behavior.

## 5. Validation

- [x] 5.1 Run backend test suite or targeted backend tests covering this change.
- [x] 5.2 Run mobile typecheck/tests covering this change.
- [x] 5.3 Run `openspec validate fix-customer-appointment-lifecycle-visibility-and-status-updates --strict`.
- [x] 5.4 Review changed files for unintended edits to legacy mobile stacks or unrelated provider/company admin behavior.
