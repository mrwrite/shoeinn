# Design

## Overview

This phase extends the active mobile UX clarity work with incremental improvements focused on at-a-glance comprehension. It reuses the existing data model and current mobile theme rather than introducing new backend or navigation architecture.

## Active Flow Boundaries

Implementation remains limited to:

- `RootTabs -> ProviderTab -> ProviderDashboardScreen`
- `RootTabs -> AppointmentsTab -> customer/AppointmentDetailScreen`

No new UX behavior should be added to legacy/orphaned screens. Any type or navigation debt discovered in the active path may be called out, but phase 2 should not expand into a large refactor.

## Phase-2 Problems

### Customer progress visibility

- The existing customer timeline marks reached steps but does not explain which step is current versus merely completed.
- Future stages are visually close to unreached history rather than clearly presented as upcoming.
- Terminal states such as `cancelled` and `completed` should feel final rather than just another row in the normal progress path.

### Provider dashboard scannability

- The dashboard tabs lack counts and do not summarize what the list means.
- Cards require too much reading to answer the provider's first questions.
- Claimability is visible, but not strongly encoded as a state in the card hierarchy.

### Intentional supporting states

- Loading, empty, and error states are functional but generic.
- The screens should tell the user what the state means and what to do next instead of only saying that something failed or nothing exists.

## Interaction Model

### Customer timeline

The timeline should distinguish four categories:

- `current`: the current active state
- `completed`: previously reached states before the current state
- `upcoming`: expected future states not yet reached
- `terminal`: final paths such as `completed` or `cancelled`

Recommended treatment:

- current row has the strongest emphasis and supportive copy such as `Current step`,
- completed rows remain visible but visually quieter than the current row,
- upcoming rows are outlined or muted to indicate future expectation,
- terminal states are visually separated from normal linear progression when applicable.

The timeline can stay in the same customer detail screen, but its rows should communicate meaning at a glance rather than merely active/not-active.

### Provider dashboard

The dashboard should support quick scanning through:

- tab labels with counts,
- a one-line tab summary that changes with the active list,
- a stronger card information hierarchy,
- claimability badges or state labels using existing available fields,
- and more intentional empty/loading/error copy.

### Appointment card hierarchy

Each provider card should answer, in order:

1. what job is this?
2. when is it?
3. where is it?
4. can I act on it?

This implies:

- service name should stay visually primary,
- time and location should read as a compact schedule block rather than scattered metadata,
- action state should be clearly labeled,
- claim action should remain available in the active provider list but be supported by clearer context.

## State Handling

### Provider dashboard list states

- `loading_available`
- `loading_my`
- `empty_available`
- `empty_my`
- `error_available`
- `error_my`

Each should have copy tied to the specific tab context.

### Customer detail supporting states

- `loading_appointment`
- `appointment_missing`
- `loading_events`
- `timeline_ready`
- `assignment_unavailable`

Customer detail should keep the current summary usable even if events or assignment data are delayed or unavailable.

## Risks

- Stronger visual separation in the timeline must still respect the existing theme and not feel like a redesign from another app.
- Dashboard counts and summaries must stay consistent with query state to avoid eroding trust.
- If current data cannot support an explicit unavailable/claimed-by-other badge in dashboard lists, the design should degrade gracefully rather than invent unsupported states.

## Validation

Implementation should verify:

- providers can distinguish available and claimed job lists quickly,
- provider cards answer job/time/location/action questions with less scanning effort,
- customer timeline clearly communicates current/completed/upcoming/terminal meaning,
- loading/empty/error states feel deliberate and informative,
- and no legacy stacks or screens are modified to carry the new behavior.
