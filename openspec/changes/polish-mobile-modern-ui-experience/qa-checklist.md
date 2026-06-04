# Mobile Polish QA Checklist

Use this checklist for the final demo pass before building the next APK. Keep testing on the active polished tab flows first; older duplicate routes can be checked only if they are intentionally exposed.

## Customer Smoke Test

- Sign in with the Mt. Juliet customer demo login.
- Confirm the home/discovery screen loads company cards with readable names, locations, and CTAs.
- Open a company/service detail and verify long service/company names wrap without overlapping buttons or badges.
- Start a booking, select date/time, review the summary, and confirm primary controls remain at least 44px high.
- Open Appointments, then appointment detail, and verify status badges, timeline steps, map/photo fallbacks, and notification links render cleanly.
- Open Notifications and verify loading, empty/read/unread, filter, mark-read, and archive states are visually distinct.

## Provider Smoke Test

- Sign in with the Mt. Juliet provider demo login.
- Review Available Jobs and My Jobs tabs at narrow Android width.
- Claim one available job and verify the tapped card disables while submitting and shows the pending state.
- Open the claimed appointment detail and progress through supported status actions.
- Confirm the map section shows a useful fallback when location or route data is missing.
- Confirm live status updates still reach the customer appointment detail/list.

## Company Admin Smoke Test

- Sign in with the Mt. Juliet company admin/owner demo login.
- Review dashboard summary cards for today, active, unassigned, completed, and payment/revenue context where present.
- Open appointment queue/detail and verify customer, service, provider, payment, and status information is scannable.
- Assign or change provider where supported and confirm action buttons disable while submitting.
- Confirm filters and selected provider states have accessible labels and selected/disabled state.

## Payment Smoke Test

- Complete a customer booking through Review & Pay in service payment mode.
- Verify pending, success, cancel, and failure result states remain visually clear without changing redirect behavior.
- Confirm payment status badges appear on appointment list/detail where payment state is present.
- Confirm notification count stays on notification surfaces and does not drive the Appointments tab badge.

## Android Build/Install Smoke Test

- Run mobile typecheck before building.
- Install the APK on the target Android device.
- Confirm Expo notifications limitation is understood if testing in Expo Go; use a development build/APK for notification behavior.
- Test login, booking, payment redirect return, provider claim/status, owner assignment, map rendering, and notifications on device.

## iPhone Prep Notes

- Validate the app at common iPhone widths before TestFlight or dev-client testing.
- Confirm light mode remains forced and system dark mode does not invert token assumptions.
- Recheck safe-area spacing around headers, bottom tabs, payment redirects, and modal photo preview.
- Use a development build for push/notification behavior rather than relying on Expo Go.

## Known Follow-Ups Outside Phase 6

- Some legacy duplicate screens still contain pre-polish hardcoded colors and older component patterns; they should be retired or migrated if they become reachable again.
- This checklist does not replace real device manual QA for maps, notifications, push permissions, and external payment redirects.
