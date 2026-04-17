# Design

## Overview

This change formalizes provider appointment claiming as an assignment workflow built on top of the existing appointment, assignment, event, and notification infrastructure. It avoids introducing parallel logic and instead tightens behavior around already present backend routes and active mobile screens.

## Current Architecture Context

### Active backend components

- Provider/company operations live in `apps/api/app/routers/company_ops.py`.
- Customer appointment detail and assignment reads live in `apps/api/app/routers/appointments.py`.
- Assignment persistence lives in `apps/api/app/models/appointment_assignment.py`.
- Appointment history uses `apps/api/app/models/appointment_event.py`.
- Customer and company notifications are produced through `apps/api/app/services/notifications.py`.

### Active mobile surfaces

The active navigation path is:

- `AuthGate -> AppStack -> RootTabs`
- Active provider flow:
  - `src/screens/provider/ProviderDashboardScreen.tsx`
  - `src/screens/provider/ProviderAppointmentDetailScreen.tsx`
- Active customer flow:
  - `src/screens/appointments/AppointmentListScreen.tsx`
  - `src/screens/customer/AppointmentDetailScreen.tsx`

### Legacy or orphaned mobile surfaces

These files exist but are not part of the active `RootTabs` app path and should not receive new wiring for this change:

- `src/navigation/CustomerStack.tsx`
- `src/navigation/CompanyStack.tsx`
- `src/navigation/AdminStack.tsx`
- `src/screens/company/*`
- several older `src/screens/customer/*` booking screens that are not entered from `RootTabs`

If any legacy dependency is discovered during implementation, it should be migrated into the active flow instead of duplicating logic there.

## Functional Design

### 1. Claimable appointment list

Providers should continue using the existing company operations route that exposes claimable appointments for the provider's company membership. The list criteria are:

- appointment belongs to the provider's company,
- appointment status is `confirmed`,
- appointment has no active assignment.

This is already aligned with the `company_ops.py` open-appointments behavior and should remain the source of truth.

### 2. Claim action creates an active self-assignment

When a provider claims an appointment:

- the backend creates a new `AppointmentAssignment` row,
- the row is active and points to the claiming provider and company,
- duplicate active assignments remain blocked,
- the appointment stays in the provider's company scope,
- the assignment becomes visible through the existing assignment read endpoints.

The implementation should reuse the existing claim endpoint and database model rather than introducing a second assignment path.

### 2a. Reassignment authorization

Reassignment is more sensitive than first-time claim and should not be available to every provider.

Authorization policy:

- `provider` users may only claim an unassigned, confirmed appointment for themselves,
- `company` users may not gain a second parallel assignment path through this change,
- `company_admin` users for the owning company are the only role in scope that may reassign an already assigned appointment,
- global `admin` users are out of scope for direct reassignment in this change unless they act through explicit future admin tooling.

This keeps provider self-claim simple and constrains reassignment authority to company-local operational admins.

### 2b. Concurrent claim behavior

The system must preserve a single active assignment when two providers attempt to claim the same confirmed appointment at the same time.

Expected behavior:

- the first successful transaction wins,
- only one active `AppointmentAssignment` may exist for the appointment,
- the losing claim receives a conflict response,
- no duplicate assignment notifications are emitted.

Implementation should rely on the existing locking and integrity protections already present in the claim path and tighten response semantics where necessary.

### 3. Claimed appointments flow

Claimed appointments should continue to come from existing provider/company operations query behavior and appear in the active provider "my jobs" flow in `RootTabs`.

The active mobile provider dashboard already separates:

- available jobs,
- my jobs.

This change makes that split the explicit supported pattern and ensures the backing API contract is sufficient for the active screen.

### 4. Customer appointment detail

Customer appointment detail should reflect:

- current appointment status,
- assigned provider identity when an active assignment exists,
- no assigned-provider state when no active assignment exists.

The customer screen should use the existing appointment detail and assignment read APIs rather than introducing a new aggregate endpoint unless implementation reveals a material gap.

#### Assignment-read contract decision

To minimize surface-area change and preserve compatibility with active mobile code, customer assignment reads will keep the current "no active assignment" behavior as a `404` response rather than switching to a nullable success payload.

This means:

- assigned case: `GET /appointments/{appointment_id}/assignment` returns `200` with assignment data,
- unassigned case: the endpoint returns `404` with "No provider assigned",
- customer UI continues treating `404` as the explicit unassigned state.

#### Customer-visible provider identity

Customers should only see a minimal provider-facing identity field:

- `provider_name`

Customers should not receive provider email, phone number, or internal user identifiers beyond what is already needed for the assignment object. The intended display value is a customer-safe display name derived from the provider's profile, not a broader staff directory payload.

### 5. Claim and reassignment notifications

Customers need assignment awareness, not just status awareness.

The notification behavior should add a new assignment-oriented event flow:

- when an appointment is claimed for the first time, notify the customer that a provider has been assigned,
- when an appointment is reassigned, notify the customer that the provider changed.

Delivery channels:

- always enqueue in-app notification,
- enqueue push notification when the customer has push tokens,
- preserve existing outbox-based delivery patterns.

Notification generation should stay in the existing notification service layer instead of being embedded directly into routers.

#### Assignment event and notification shape

Assignment changes should produce both an appointment-history event and customer notification payloads with explicit old/new assignment identity.

Appointment event names:

- `assignment_claimed`
- `assignment_reassigned`

Appointment event payload shape:

```json
{
  "assignment_id": "UUID",
  "old_provider_user_id": "UUID or null",
  "old_provider_name": "string or null",
  "new_provider_user_id": "UUID",
  "new_provider_name": "string"
}
```

Customer notification kinds:

- `APPOINTMENT_PROVIDER_ASSIGNED`
- `APPOINTMENT_PROVIDER_REASSIGNED`

Notification payload shape:

```json
{
  "appointment_id": "UUID",
  "old_provider_name": "string or null",
  "new_provider_name": "string",
  "assignment_action": "claimed or reassigned"
}
```

## Data Model Changes

No new core table is required.

Expected reuse:

- `appointments`
- `appointment_assignments`
- `appointment_events`
- `notifications`
- `notification_outbox`

Potential minimal schema change:

- none, if assignment claim/reassignment can be represented with current models and notification payload JSON,
- otherwise only additive metadata fields in event payloads, not a new assignment table.

## API Contract Changes

### Reused contracts

- `GET /company/appointments/open`
- `GET /company/appointments/my`
- `POST /company/appointments/{appointment_id}/claim`
- `GET /appointments/{appointment_id}/assignment`
- `GET /appointments/{appointment_id}/assignment/company`

### Possible additive contract changes

- include enough assignment metadata in provider list responses if the active screen needs it and it is not already available,
- standardize customer-facing assignment response semantics so "no assignment" is represented predictably,
- no duplicate mobile client wrappers outside `src/api/http.ts`.

## Backend Changes

- Reuse and tighten the existing claim endpoint as the single command for provider self-assignment.
- Add explicit reassignment authorization limited to `company_admin` users within the appointment's company if reassignment is implemented in this change.
- Return a conflict outcome for losing concurrent claims while preserving one active assignment.
- Ensure appointment claim or reassignment emits an `AppointmentEvent` entry describing assignment changes.
- Add notification-service helpers or kinds for assignment claim and reassignment using the current outbox-based pattern.
- Keep authorization tied to company membership and existing role guards.

## Mobile Changes

- Keep provider claiming in `src/screens/provider/ProviderDashboardScreen.tsx` and `src/screens/provider/ProviderAppointmentDetailScreen.tsx`.
- Keep customer assignment visibility in `src/screens/customer/AppointmentDetailScreen.tsx`.
- Reuse `src/api/http.ts` for any required API additions.
- Do not wire new functionality into legacy navigation stacks.

## Risks

- There are two families of provider/customer screens in the repo; implementation could accidentally modify inactive ones.
- Current assignment read behavior includes 404-based "no provider assigned" semantics, which mobile code already interprets. Contract changes must preserve or intentionally replace that behavior.
- Notification changes must avoid duplicating customer notifications already emitted for status transitions.

## Rollout Notes

- This change is additive and should be safe behind existing role guards.
- Regression coverage should focus on claim eligibility, duplicate claim prevention, assignment visibility, and customer notifications.
