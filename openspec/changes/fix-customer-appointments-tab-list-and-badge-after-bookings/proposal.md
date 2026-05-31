## Why

After consecutive service-mode Stripe bookings, the customer Appointments tab can remain focused on the latest appointment detail screen inside its nested stack. This makes tapping the tab look like the list is missing until logout/login resets navigation state. The tab badge also appears to use notification unread count, which makes appointment navigation show notification state in the wrong place.

## What Changes

- Make the customer Appointments tab behave as a list entry point when tapped.
- Preserve intentional navigation to appointment detail from payment returns, notification/deep links, and list cards.
- Keep customer appointment query invalidation/refetch behavior aligned after booking/payment actions.
- Remove incorrect notification-driven badge state from the Appointments tab unless a trustworthy appointment-specific count exists.

## Capabilities

### New Capabilities
- `customer-appointments-tab-entry`: Covers customer Appointments tab stack reset/list entry behavior and badge correctness.

## Impact

- Mobile customer tab navigation, appointment stack behavior, payment-return navigation, and tab badge configuration.
- No backend changes expected unless investigation shows the endpoint is missing data.
- No owner/provider tab changes.
