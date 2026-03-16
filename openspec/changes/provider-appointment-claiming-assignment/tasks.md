# Tasks

## 1. Backend assignment flow

- [ ] Review `company_ops.py` claim, open, and my-appointments queries against the new requirements and keep one source of truth for provider self-assignment.
- [ ] Confirm and implement reassignment authorization so only `company_admin` users can reassign an already assigned appointment.
- [ ] Make concurrent claims deterministic so exactly one assignment wins and the losing claim returns a conflict response.
- [ ] Ensure claim behavior records assignment changes in `appointment_events` without duplicating existing status event logic.
- [ ] Support customer notification enqueueing for first-time claim and reassignment using explicit assignment notification kinds and the existing outbox pattern.
- [ ] Verify customer assignment reads continue to work through `appointments.py` and preserve the current `404` no-assignment contract.

## 2. Backend contract and tests

- [ ] Document or add only minimal response-field changes needed by the active provider and customer screens, including customer-safe `provider_name`.
- [ ] Add or update API tests for claimable confirmed appointments, successful claim, concurrent-claim conflict behavior, reassignment authorization, claimed/my appointments visibility, customer assignment visibility, assignment event payloads, and assignment notification enqueueing.

## 3. Mobile active-flow wiring

- [ ] Confirm the active provider flow remains `RootTabs -> ProviderDashboard -> ProviderAppointmentDetail` and do not wire new behavior into legacy stacks.
- [ ] Update active provider screens to rely on the existing claimable and claimed appointment APIs through `src/api/http.ts`.
- [ ] Update the active customer appointment detail screen to display assigned provider and current status using existing appointment and assignment APIs.

## 4. Validation and cleanup boundaries

- [ ] Verify legacy/orphaned screens are not part of the change unless a dependency must be migrated.
- [ ] Validate push/in-app notification behavior for assignment events using existing notification infrastructure.
- [ ] Confirm no new duplicated logic is introduced in routers, models, notification helpers, or mobile HTTP clients.
