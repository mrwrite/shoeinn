# Mobile Websocket Live Job Events

## Summary

Introduce the smallest production-credible live-update path for the active mobile provider and customer flows by adding an authenticated FastAPI WebSocket channel that publishes high-value appointment events and lets the Expo app invalidate the right React Query caches immediately, while keeping focused polling as a fallback.

## Problem

The current RootTabs-based mobile flow feels more polished than before, but it still depends on focused polling and post-mutation invalidation for freshness. That leaves a noticeable lag in the highest-value dispatch moments:

- when one provider claims a job, other providers can still see it as claimable until their next refresh,
- the claiming provider can wait too long for that job to show up in `My Jobs`,
- customer appointment detail can lag behind provider assignment or status changes,
- and the app still feels request/response driven rather than event driven.

The next step should improve the product feel without forcing a broad backend rewrite or replacing the current REST and polling paths.

## Goals

- Add a minimal live event transport for active provider and customer mobile flows.
- Publish events for provider claims, reassignment, appointment status changes, and assignment visibility changes that affect active screens.
- Keep the implementation additive to the current FastAPI + Expo/React Native stack.
- Preserve existing focused polling as resilience fallback.
- Limit the scope to the active RootTabs-based mobile flow.

## Non-Goals

- Building a general-purpose event bus or message broker.
- Reworking legacy or orphaned mobile stacks.
- Replacing existing REST endpoints or removing query polling entirely.
- Expanding live transport to every appointment surface in one change.
- Building push-driven navigation or background wake-up flows.

## Option Evaluation

### FastAPI WebSockets

- Pros: supported directly by FastAPI and React Native, full duplex, no extra client dependency required in this repo, easy to grow from one channel to richer event types later.
- Cons: requires connection lifecycle management and lightweight auth handling.

### Server-Sent Events

- Pros: simpler one-way server stream on the backend.
- Cons: a weaker fit for Expo/React Native here because the app does not already use an SSE client path and React Native does not provide the same straightforward built-in support as `WebSocket`.

### Push-triggered invalidation hooks

- Pros: useful later for background wake-up and offline devices.
- Cons: much larger product and delivery surface, less appropriate for the currently active in-app screens, and already partially covered by existing notification infrastructure.

### Hybrid event + polling fallback

- Pros: best operational fit now because it keeps the new live path small and preserves the existing refresh safety net.
- Cons: still leaves some duplicate freshness mechanisms by design.

## Proposed Approach

- Use an authenticated app-level WebSocket connection as the first live transport.
- Add a very small backend live-events service with in-memory connection tracking and targeted publish helpers.
- Publish live events from existing claim, reassignment, and appointment status transition code paths after successful commits.
- Keep event payloads intentionally small and use them primarily to invalidate or refetch existing React Query caches.
- Retain focused polling on active screens so the app degrades gracefully if the socket drops or a client misses an event.

## Impact

- Providers should see job-board and my-job state update much closer to real time during claim and reassignment activity.
- Customers should see assignment and appointment-progress changes show up faster on active detail screens.
- The repo gains a low-risk live architecture starting point without committing to a broad backend event system yet.
