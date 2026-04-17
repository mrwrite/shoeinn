# Design

## Overview

This change is driven by a product-readiness finding, not a narrow bug. The repo already supports a live demo of booking, claiming, status progression, notifications, and live updates. The missing piece is a coherent owner-facing operating surface and a reliable demo package.

The design therefore centers on one principle:

- the app should let a cleaner owner understand the business value in under five minutes, without relying on developer explanation.

## Repo-Grounded Findings

### Active architecture

#### Backend

- Active runtime: `apps/api/app/main.py`
- Key owner/provider/customer routes:
  - `routers/appointments.py`
  - `routers/company_ops.py`
  - `routers/companies.py`
  - `routers/users.py`
  - `routers/live.py`
  - `routers/dev_seed.py`

#### Mobile

- Active app shell: `apps/mobile/App.tsx`
- Active navigation: `src/navigation/AuthGate.tsx -> AppStack.tsx -> RootTabs.tsx`
- Active customer surfaces:
  - `src/screens/home/*`
  - `src/screens/appointments/AppointmentListScreen.tsx`
  - `src/screens/appointments/AppointmentDetailScreen.tsx`
  - `src/screens/customer/CustomerNotificationsScreen.tsx`
- Active provider surfaces:
  - `src/screens/provider/ProviderDashboardScreen.tsx`
  - `src/screens/provider/ProviderAppointmentDetailScreen.tsx`

### Legacy or low-confidence surfaces

These exist in the repo but should not be treated as the primary demo path:

- `src/navigation/CompanyStack.tsx`
- `src/navigation/AdminStack.tsx`
- `src/navigation/CustomerStack.tsx`
- `src/screens/company/*`
- `src/screens/admin/*`

`src/screens/admin/AdminCompaniesScreen.tsx` and `AdminUsersScreen.tsx` are placeholder TODO screens. That is a clear signal that global admin is not the near-term owner demo surface.

### What is demoable today

- Customer can browse companies and services in the active Home flow.
- Customer can book and confirm an appointment.
- Provider/company user can view open jobs and claim them.
- Provider can progress status through the active detail screen.
- Customer can see appointment detail, timeline, assignment state, and notifications.
- Live events and polling fallback exist for appointment state updates.

### What is not persuasive enough today

- `company_admin` lacks a distinct owner-operating experience in the active app flow.
- Owner value is implied through provider screens rather than directly presented.
- Demo data is generic, non-local, and not aligned to the pitch audience.
- Setup still feels developer-operated rather than demo-packaged.

## Key Product Conclusion

The next change should not primarily be "more booking polish." It should be "show the cleaner owner how they would run the business."

That means the product needs a deliberate owner demo command center in the active flow.

## Proposed Solution

### 1. Add an active owner command center for `company_admin`

For `company_admin`, the active `RootTabs` experience should expose an owner-focused jobs surface instead of a provider-only queue.

Core owner views:

- Unassigned jobs
- Assigned / in progress jobs
- Needs attention jobs
- Team roster

This can remain mobile-first. The goal is not perfect operations software. The goal is a demo flow that clearly communicates control and oversight.

### 2. Make the owner dashboard answer the cleaner's core questions

On first load, the owner should be able to see:

- how many pickups are waiting to be assigned,
- which jobs are currently in motion,
- which provider owns each live job,
- where intervention is possible,
- and whether the customer communication loop is working.

Recommended information hierarchy:

- top summary metrics,
- segmented job lists,
- reassignment / open detail actions,
- team visibility,
- recent customer-impacting updates.

### 3. Keep the active backend routes and extend them only where necessary

The backend already has enough of the core model:

- `/company/appointments/open`
- `/company/appointments/my`
- `/company/appointments/all`
- `/company/appointments/{id}/reassign`
- `/company/users`
- `/company/appointments/{id}/tracking`

The command center should reuse these paths when possible. If contract changes are needed, they should be additive and designed around owner visibility:

- job segmentation metadata
- provider display names
- customer-safe status summaries
- concise exception cues for jobs that need intervention

### 4. Introduce local-demo seed scenarios

The seed story should be demo-scripted for local cleaner conversations:

- one Helena/Pelham-area cleaner brand
- one active day of realistic pickups and deliveries
- a small team roster
- at least one unassigned confirmed booking
- at least one claimed in-progress job
- at least one ready-for-delivery job
- customer notifications already populated for storytelling

The seed command should produce a consistent "demo starting state" every time.

### 5. Harden demo reliability

The repo should support a repeatable local demo checklist that minimizes awkward failure points.

Required hardening targets:

- seed/reset command gives a deterministic owner demo state
- active demo path works without touching inactive stacks
- booking/payment copy reflects stub behavior honestly
- push/photo hardware dependencies are optional, not required for the baseline demo
- validation checklist covers API, mobile, role logins, and live-update behavior

## Interaction Design

### Owner dashboard structure

Recommended active owner flow in `RootTabs`:

- `Jobs`
- `Profile`
- optional owner quick action entry points from the jobs screen itself

Within `Jobs` for `company_admin`:

- summary strip:
  - Unassigned
  - In progress
  - Ready for delivery
- segmented sections:
  - Needs assignment
  - Active today
  - Team
- each job card shows:
  - customer / service
  - scheduled time
  - current status
  - assigned provider or unassigned state
  - primary owner action

### Owner detail interaction

Opening a job should show:

- current state
- assigned provider
- reassignment control if relevant
- customer-visible milestones
- travel/tracking context when applicable

The screen should feel like owner oversight, not provider execution.

## Demo-Readiness Plan

### Product changes

1. Create active `company_admin` owner dashboard in `RootTabs`.
2. Add owner-specific job segmentation and quick action affordances.
3. Add clean reassignment entry points and team visibility.
4. Clarify booking/payment copy for demo-safe behavior.

### UX changes

1. Label flows in business language, not internal language.
2. Reduce dead-end or role-inappropriate screens.
3. Make empty/error states read like product UI, not developer fallback.

### Demo data and setup

1. Replace generic seed story with Helena/Pelham cleaner-oriented data.
2. Add resettable owner demo scenario with multiple roles and statuses.
3. Produce a concise demo checklist and login map.

### Reliability hardening

1. Validate backend tests covering claim, notifications, and tracking.
2. Validate mobile typecheck on the active app.
3. Provide a demo-day checklist for LAN URL, seed, and role logins.
4. Keep push/photo as bonus flows, not core-demo dependencies.

## Risks

- It is easy to accidentally invest in inactive stacks because similarly named screens still exist.
- A broad "owner dashboard" could sprawl; the implementation should stay focused on demo persuasion.
- Seed work can become fake-looking if it feels too synthetic or geographically irrelevant.
- Owner features that duplicate provider execution behavior will dilute the story.

## Rollout Strategy

### Phase 1

- Active owner dashboard
- segmented jobs
- reassignment controls
- local demo seed/reset
- demo-safe setup notes

### Phase 2

- stronger customer trust/polish cues
- richer owner summaries
- faster reset and role-switch tooling

## Why This Is The Best Next Change

The product already proves it can move an appointment through the system. What it does not yet prove is that a cleaner owner would feel in control of that system. Closing that gap is the highest-leverage move before real local pitching.
