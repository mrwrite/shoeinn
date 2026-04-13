# Customer Notification Center And Live Status Surface

## Summary

Add a customer-facing in-app notification center to the active RootTabs mobile flow and strengthen the customer appointment detail surface with clearer live-update messaging, using the existing notification records, acknowledgement behavior, and websocket-driven invalidation path wherever possible.

## Problem

The customer appointment detail flow is materially better than before, and the app now invalidates customer data quickly when live appointment events happen. But customers still lack a clear inbox for understanding what changed over time:

- assignment and status changes happen, but there is no dedicated customer notification center to review them,
- there is no strong customer entry point or unread signal for recent live updates,
- the detail screen shows current state well but does not explicitly connect that state to recent notifications,
- and customers can miss important milestones such as provider assignment, reassignment, `ready`, `out_for_delivery`, and `delivered` unless they happen to be on the right screen at the right moment.

## Goals

- Add a customer-facing in-app notification center in the active mobile flow.
- Provide a clear customer entry point and unread signal.
- Map backend notification kinds into calm, customer-readable copy.
- Reuse existing backend notification models/routes/ack behavior where possible.
- Keep customer appointment detail and notifications aligned rather than duplicative.
- Reuse the existing websocket + polling fallback model for timely refresh.

## Non-Goals

- Reworking provider/admin notification flows beyond the minimum shared backend extension needed for customers.
- Introducing a large design-system rewrite or a new messaging architecture.
- Building notification grouping, pagination, preferences, or push deep-link routing in this change.
- Expanding work into legacy or orphaned mobile stacks.

## Proposed Approach

- Extend the existing notification list and acknowledgement behavior to customers through `/me`-scoped routes.
- Add a customer notification center screen inside the active appointments flow.
- Add a customer-visible unread badge/entry point from the appointments tab and screen header.
- Map known backend notification kinds and payloads into concise title/detail/timestamp rows with read state.
- Add a small “recent update” surface on customer appointment detail using the same notification query for that appointment.
- Update the live websocket invalidation hook so customer notification queries refresh immediately on assignment and status events.

## Impact

- Customers should understand what changed more quickly and with less ambiguity.
- Assignment and milestone updates become visible both in context on the detail screen and in a dedicated inbox.
- The app should feel calmer and more trustworthy without a large product redesign.
