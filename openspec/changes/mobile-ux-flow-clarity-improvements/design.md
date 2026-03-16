# Design

## Overview

This change does not implement UI. It captures a UX/UI audit of the active mobile appointment flows and turns that audit into an incremental design plan.

The design goal is clarity, not reinvention:

- make the next action obvious for providers,
- make the current state obvious for customers,
- and make active screens consistently reflect backend truth without leaking transport-level details like `404` semantics into the user experience.

## Active Flow Context

The active mobile surfaces in scope are:

- provider dashboard: `apps/mobile/src/screens/provider/ProviderDashboardScreen.tsx`
- provider appointment detail: `apps/mobile/src/screens/provider/ProviderAppointmentDetailScreen.tsx`
- customer appointment list: `apps/mobile/src/screens/appointments/AppointmentListScreen.tsx`
- customer appointment detail: `apps/mobile/src/screens/customer/AppointmentDetailScreen.tsx`

Relevant duplicated or overlapping surfaces that should stay out of primary wiring but must inform the audit:

- `apps/mobile/src/screens/company/*`
- `apps/mobile/src/screens/customer/MyAppointmentsScreen.tsx`
- `apps/mobile/src/screens/appointments/AppointmentDetailScreen.tsx`
- `apps/mobile/src/navigation/CustomerStack.tsx`

## Journey Map

### Provider journey today

```text
Provider tab
   |
   v
+------------------+
| Available Jobs   |<------------------+
| My Jobs          |                   |
+------------------+                   |
   |                                   |
   | tap card or claim from card       |
   v                                   |
+---------------------------+          |
| Provider appointment      |          |
| detail                    |          |
| - assignment              |          |
| - status buttons          |----------+
| - ready photo modal       |
+---------------------------+
```

Main clarity gaps:

- the list allows claiming before enough detail is visible,
- the detail screen mixes primary actions, advanced actions, and informational state at the same visual weight,
- and reassignment capability exists in backend scope but has no intentional mobile-state presentation.

### Customer journey today

```text
Appointments tab
   |
   v
+------------------+
| Appointment list |
+------------------+
   |
   v
+----------------------------------+
| Customer appointment detail      |
| - map sometimes                  |
| - overview card                  |
| - finished photo sometimes       |
| - self/contact details           |
| - status timeline                |
| - provider assignment            |
+----------------------------------+
```

Main clarity gaps:

- the screen leads with content blocks rather than the user's main question,
- the status timeline communicates completion history weakly and future expectation almost not at all,
- and assignment or missing-assignment states are easy to miss.

## Audit Findings

## 1. Provider dashboard flow

### Findings

- The dashboard uses two tabs, but the distinction between "Available Jobs" and "My Jobs" relies mostly on labels rather than stronger structural cues such as counts, section summaries, or card-level status messaging.
- Available cards expose a primary `Claim appointment` action directly in the list, which makes accidental commitment possible before the provider sees enough detail.
- The active provider card currently injects placeholder customer information instead of using the available appointment fields consistently, which weakens trust in the list and makes cards feel generic.
- Claim success and claim conflict outcomes are not explained in-flow; errors are only surfaced as alerts.
- Empty states tell the user little about why the list is empty or what changed since the previous state.

### Incremental design direction

- Keep the two-tab structure, but add explicit tab counts and one-line state summaries.
- Make the card tap the primary affordance on available jobs, and demote inline claim to a secondary action or remove it from the list entirely.
- Use card badges to distinguish `Available to claim`, `Assigned to you`, and `Assigned to another provider` states where applicable.
- Replace alert-only outcomes with inline banners or transient confirmations tied to the screen state.

## 2. Provider appointment detail

### Findings

- The screen shows assignment, details, map, and a long list of status actions without indicating the primary next step.
- All status options are rendered as equal-weight buttons, which makes irreversible or unlikely actions feel as safe and likely as the recommended next state.
- The UI does not explain why an action is unavailable or inappropriate for the current appointment state.
- Claim state is inferred from assignment fetch behavior, which makes "unassigned" a transport-derived UI state rather than a deliberate product state.
- The "ready with photo" requirement is only explained after the full status list and only when the user reaches the relevant button.
- There is no mobile-specific pattern for company-admin reassignment visibility, even if the backend supports it.

### Incremental design direction

- Introduce a top-level "Current state" section with one primary next action and supporting context.
- Replace the flat status-button wall with a progressive pattern:
  - primary next action,
  - secondary "other updates" section,
  - and gated advanced actions where needed.
- Represent assignment with explicit state cards:
  - `Unassigned`,
  - `Assigned to you`,
  - `Assigned to another provider`,
  - `Reassignment available to company admin`.
- Surface ready-photo requirements before the user commits to the ready transition.
- Prefer inline helper copy over modal-only explanation for permission and state constraints.

## 3. Provider claim and reassignment flows

### Findings

- Claiming is visible in both the dashboard card and detail screen, but neither surface explains the consequence of claiming or what changes after success.
- Reassignment exists as a backend capability, but the active provider flow does not make it clear whether reassignment is impossible, unavailable to this user, or simply not yet surfaced.
- Conflict handling is product-significant for claiming, but today it behaves like a generic error instead of a state transition such as "another provider claimed this job first."

### Incremental design direction

- Treat claim as a state transition with explicit before/after messaging:
  - before: `Available to claim`
  - success: `Assigned to you`
  - lost race: `No longer available`
- Add role-aware copy for reassignment:
  - providers should see that reassignment is handled by company admins,
  - company admins should see that reassignment is an administrative action, not a normal status update.
- Keep reassignment visually separate from standard progress updates.

## 4. Customer appointment detail and timeline

### Findings

- The customer screen currently puts overview, photo, personal details, timeline, and assignment in an order that does not consistently prioritize "Where is my order now?" and "Who is handling it?"
- The details section repeats customer information back to the customer, pushing more useful state lower on the screen.
- The status timeline marks reached states but does not clearly separate:
  - current stage,
  - completed stages,
  - future stages,
  - and exceptional terminal states like `cancelled`.
- Assignment errors are treated similarly to "not yet assigned," which can mislead users during outages or failed fetches.
- The screen uses a different visual/component style than other active screens, making it feel like a separate product surface.

### Incremental design direction

- Reorder the screen around a clearer hierarchy:
  1. current status summary,
  2. provider assignment,
  3. travel/progress content,
  4. proof-of-completion content,
  5. secondary appointment details.
- Redesign the timeline into a current-step component plus a lighter full-history list.
- Make `No provider assigned yet` distinct from `Unable to load provider status`.
- Collapse customer self-details by default or move them lower in the screen.
- Align typography, spacing, and component usage with the active design system used by `ScreenContainer`, `Text`, `Card`, and `Button`.

## 5. Cross-flow consistency

### Findings

- The repository contains multiple appointment detail and provider dashboard variants with overlapping responsibilities.
- The active customer detail screen is mounted in `RootTabs`, but its typing still references `CustomerStack`, which is a maintainability signal that active and legacy boundaries are blurred.
- Active screens mix design-system components and raw `react-native` primitives in ways that change spacing, text rhythm, and hierarchy from screen to screen.

### Incremental design direction

- Treat `RootTabs` flows as the sole source of truth for active UX improvements.
- Normalize shared appointment patterns across active screens:
  - status badge language,
  - section order,
  - empty/error/loading treatment,
  - and action-button hierarchy.
- Capture duplicated screen families as migration debt in tasks instead of extending them further.

## Design Principles

- Primary action first: every detail screen should make the most likely next action or next expected state obvious near the top.
- Explicit system state: loading, unavailable, unassigned, conflict, and completed states must be distinct in copy and presentation.
- Role clarity: provider screens should emphasize actions; customer screens should emphasize tracking and reassurance.
- Incremental reuse: prefer reordering, relabeling, and reusing existing data over introducing new workflow branches.
- Thumb-friendly ergonomics: critical actions should not require long scrolls past dense content blocks.

## Recommended Interaction Model

### Provider detail target structure

```text
+----------------------------------+
| Job title                        |
| Current state badge              |
| Primary next action              |
+----------------------------------+
| Assignment state                 |
| - assigned to you / available    |
| - reassignment note if relevant  |
+----------------------------------+
| Progress                         |
| - next status action             |
| - other updates                  |
+----------------------------------+
| Route / travel / logistics       |
+----------------------------------+
| Secondary details                |
+----------------------------------+
```

### Customer detail target structure

```text
+----------------------------------+
| Service                          |
| Current status                   |
| What happens next                |
+----------------------------------+
| Provider                         |
| - assigned / pending / issue     |
+----------------------------------+
| Travel or timeline               |
+----------------------------------+
| Ready photo / proof              |
+----------------------------------+
| Appointment details              |
+----------------------------------+
```

## Risks

- If implementation starts from the duplicate legacy screens, the UX will diverge further.
- If transport details like `404` continue leaking directly into UI decisions, system state messaging will remain fragile.
- If the provider flow keeps all status transitions visually equivalent, providers will continue to face unnecessary choice overload.

## Validation Focus

Future implementation should validate:

- providers can tell at a glance whether a job is claimable or already theirs,
- providers can identify the recommended next step without parsing every status button,
- customers can find current status and provider assignment above the fold,
- users can distinguish unassigned, unavailable, and failed-to-load states,
- and active screens present a visibly consistent hierarchy and interaction language.
