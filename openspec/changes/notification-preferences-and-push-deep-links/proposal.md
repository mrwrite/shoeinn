# Notification Preferences And Push Deep Links

## Summary

Extend the customer notification center into a fuller delivery experience by adding push-notification support for high-value customer updates, deep links into the active customer appointment detail flow, and a narrow customer notification preference model that keeps push useful instead of noisy.

## Problem

The app now has a customer in-app notification center and live-refresh behavior, but the delivery experience still stops at the inbox:

- customers do not yet have a reliable push path for the most important appointment updates,
- tapping a push notification does not route the user into the correct active customer screen,
- in-app notification taps work but are not yet shared with push handling as one navigation model,
- and there is no customer preference model to control whether assignment changes or milestone pushes should reach the device.

The next step should improve delivery and navigation without expanding into a broad notification-settings system.

## Goals

- Add push delivery for the highest-value customer appointment notifications.
- Add a robust, low-risk deep-link path into active customer appointment detail.
- Add a first-slice customer notification preference model.
- Keep the in-app notification center as the source of truth and push as an additional delivery channel.
- Reuse the current Expo push registration, notification payload, and mobile RootTabs flow.

## Non-Goals

- Building a full notification settings platform or per-event customization matrix.
- Rewriting mobile navigation around generic URL linking.
- Adding background routing into legacy or orphaned screens.
- Grouping, deduplicating, or redesigning the entire notification center.

## Proposed Approach

- Keep in-app notification records unchanged as the canonical user-facing record.
- Gate customer push creation with a small preference model stored on the user record.
- Restrict first-slice customer push delivery to:
  - provider assigned
  - provider changed
  - appointment confirmed
  - ready
  - out for delivery
  - delivered
- Add destination metadata to notification payloads so both push taps and inbox taps can navigate through the same helper into `AppointmentDetail`.
- Add a small customer settings surface in Profile for:
  - all customer push notifications on/off
  - assignment change push on/off
  - appointment milestone push on/off

## Impact

- Customers can receive the most meaningful updates even when not sitting in the app.
- Tapping those updates takes them to the right active appointment detail screen.
- Push stays useful because the first preference slice limits noise and preserves customer control.
