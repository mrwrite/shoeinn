## Why

The mobile app has the core booking, payment, appointment, provider, admin, and notification flows in place, but the experience needs a coherent premium visual system before demos and customer-facing validation. This change makes the app feel modern, trustworthy, and marketplace-ready without changing backend contracts.

## What Changes

- Refresh the mobile design system with a Pinterest-inspired light marketplace direction: soft white/cream surfaces, peacock/teal accents, gold highlight CTAs, stronger typography hierarchy, subtle elevation, and consistent spacing.
- Add reusable UI patterns for cards, badges, section headers, loading states, empty states, error states, timeline rows, action panels, and photo-forward company/service tiles.
- Polish the active customer flow across login/demo login, company discovery, service detail, booking steps, review/pay, payment result, appointments, appointment detail/tracking timeline, and notifications.
- Polish active provider and company admin operational screens, including dashboards, job cards, appointment detail, status actions, and notification surfaces.
- Improve touch target sizing, contrast, content hierarchy, and cross-platform layout resilience on Android and iOS.
- Preserve existing API contracts, navigation intent, payment behavior, websocket/live update behavior, and end-to-end flows.
- Keep light mode forced for now and avoid fragile animation-heavy behavior.

## Capabilities

### New Capabilities

- `mobile-modern-ui-experience`: Defines the polished mobile visual system, reusable UI components, customer/provider/admin screen polish, accessibility expectations, and demo QA requirements.

### Modified Capabilities

- None.

## Impact

- `apps/mobile/src/theme/theme.ts` and shared UI components under `apps/mobile/src/components` and `apps/mobile/src/components/ui`.
- Active mobile screens under `apps/mobile/src/screens/auth`, `apps/mobile/src/screens/home`, `apps/mobile/src/screens/customer`, `apps/mobile/src/screens/appointments`, `apps/mobile/src/screens/provider`, `apps/mobile/src/screens/owner`, and notification/profile surfaces where they are part of the active app flow.
- Mobile navigation styling in `apps/mobile/src/navigation` only as needed for polish and consistency.
- Mobile tests, snapshots or targeted unit tests where reusable presentation logic is introduced.
- No required backend API, schema, or payment-service changes.
