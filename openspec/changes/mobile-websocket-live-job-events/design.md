# Design

## Overview

This change adds a single authenticated live event channel for logged-in mobile users and uses it to drive React Query invalidation for the active RootTabs provider and customer surfaces. The design intentionally chooses a narrow, additive slice:

- one FastAPI WebSocket endpoint,
- one lightweight in-memory live event manager,
- a small set of event types for existing high-value appointment transitions,
- one mobile hook that translates events into targeted cache invalidation,
- and the existing focused polling retained as fallback.

## Architecture Choice

### Chosen: WebSocket plus polling fallback

This repo should start with WebSockets rather than SSE or push-triggered invalidation because:

- React Native already supports `WebSocket` directly, so the mobile client can stay dependency-light.
- FastAPI supports WebSockets cleanly in the same app process.
- The initial need is in-app active-screen freshness, not background delivery.
- The current code already has focused polling, so pairing events with polling gives a pragmatic safety net.

### Deferred: SSE

SSE is not the best fit for this codebase now because it adds a client-path decision the mobile app does not already use and does not provide a material benefit over WebSockets for this first slice.

### Deferred: Push-triggered invalidation

Push remains useful for later phases, but it should not be the primary live architecture for active in-app screens because it adds delivery and app-state complexity that is unnecessary for the current goal.

## Backend Design

### Live event manager

Add a small service module responsible for:

- accepting and tracking active websocket connections,
- indexing connections by user id and company id,
- publishing JSON events to matching recipients,
- pruning closed or failed sockets,
- and keeping the API code free of transport details.

The manager remains process-local and in-memory. That is acceptable for the current single-process development posture and first-slice rollout. Horizontal scale concerns are explicitly deferred.

### Authentication model

The websocket endpoint accepts the existing bearer token as a query parameter. The endpoint decodes the token with the current JWT helper, resolves the user, and, for company-side users, resolves the company relationship the same way existing routes do.

This keeps auth consistent with current API behavior and avoids introducing a second session mechanism.

### Event types

Start with two payload families:

- `assignment_changed`
- `appointment_status_changed`

Both payloads include:

- `appointment_id`
- `company_id` when present
- `event_kind`
- `occurred_at`

Assignment events additionally include:

- `assignment_action` such as `claimed` or `reassigned`
- previous and new provider identifiers and display names when available

Status events additionally include:

- `status`
- `previous_status`

### Event origin points

Publish after successful commit in the existing routes that already own these state transitions:

- provider claim in `company_ops.py`
- provider reassignment in `company_ops.py`
- provider status transitions in `company_ops.py`
- provider ready-with-photo transition in `company_ops.py`

The initial implementation does not add a general event publisher to every appointment path. It only covers the high-value flows already active in mobile.

### Recipient targeting

For company-side transitions:

- publish to all live company users for the appointment’s company so provider job-board visibility updates quickly,
- and publish to the affected customer when the appointment belongs to a customer account.

This is intentionally broader than screen-specific subscriptions. The mobile app already knows which screens are active and can decide which queries to invalidate.

## Mobile Design

### App-level subscription

Add a single hook mounted under the app’s `QueryClientProvider` that:

- opens a websocket when a logged-in user exists,
- reconnects with small backoff when the connection drops,
- closes on logout,
- and translates live events into targeted React Query invalidation.

The mobile client does not attempt optimistic state reconstruction from the event payload. It uses the payload only to decide which current queries should be refreshed.

### Query invalidation strategy

#### Provider/company users

On `assignment_changed`:

- invalidate `["provider", "open"]`
- invalidate `["provider", "my"]`
- invalidate `["appointment", appointmentId, "assignment"]`
- invalidate `["appointment", appointmentId, "events"]`

On `appointment_status_changed`:

- invalidate `["provider", "open"]`
- invalidate `["provider", "my"]`
- invalidate `["appointment", appointmentId]`
- invalidate `["appointment", appointmentId, "events"]`

#### Customer users

On either event family:

- invalidate `["appointments", "mine"]`
- invalidate `["appointment", appointmentId]`
- invalidate `["appointment", appointmentId, "assignment"]`
- invalidate `["appointment", appointmentId, "events"]`

### Polling fallback

The current focused polling helper remains in place. Live events improve freshness, but active screens still poll while focused so:

- missed events self-heal,
- dropped sockets do not break the user flow,
- and the rollout remains low risk.

## Risks

- The in-memory manager will not fan out across multiple API processes. That is acceptable for this phase but must be revisited before multi-instance deployment.
- Websocket auth currently depends on a query-string token, which is acceptable for this repo’s current architecture but should later move to a more durable handshake pattern if needed.
- Broad company-side fan-out may invalidate more caches than strictly necessary, but that tradeoff is appropriate for the smallest correct first slice.

## Validation

This change should validate:

- provider claim emits live invalidation to company-side clients,
- reassignment emits live invalidation to both company-side and customer clients,
- status changes emit live invalidation to relevant active detail screens,
- existing focused polling still works when no live event arrives,
- and the implementation stays within active RootTabs mobile surfaces.
