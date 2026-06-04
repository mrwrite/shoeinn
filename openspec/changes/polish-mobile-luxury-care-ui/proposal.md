## Why

The mobile app now supports the broader premium care marketplace model, but the presentation still carries mixed legacy styling, uneven card treatment, and a functional app feel that does not fully match a premium consumer service brand. A luxury care UI pass is needed so ShoeInn feels demo-ready, trustworthy, and visually competitive with polished marketplace and concierge apps.

## What Changes

- Refine the mobile design system around the uploaded luxury direction: warm off-white backgrounds, deep teal branding, muted gold accents, charcoal typography, soft elevation, rounded luxury cards, and modern iOS-style spacing.
- Upgrade reusable mobile primitives so cards, buttons, badges, bottom navigation, category chips, media placeholders, state surfaces, and timelines share one coherent premium language.
- Polish the priority customer marketplace path: login/demo login, home/category discovery, provider menu, service detail, booking steps, review/pay, payment result, appointments, and customer appointment tracking.
- Polish operational surfaces without making them decorative: provider dashboard/detail/status actions and company admin dashboard/detail/assignment surfaces should be clearer, denser, and more controlled.
- Add or improve local placeholder image/media surfaces for company, category, service, appointment, and rewards-style cards where real imagery is unavailable.
- Preserve existing category marketplace behavior, booking/payment API contracts, navigation intent, websocket/live refresh behavior, and role-based flows.
- Keep ShoeInn as the master brand and keep light mode forced for this phase.
- Defer real production photography, animation-heavy interactions, backend feature changes, and paid asset dependencies.

## Capabilities

### New Capabilities

- `mobile-luxury-care-ui-experience`: Defines the luxury mobile visual system, reusable UI treatment, priority screen polish, accessibility expectations, and validation requirements for the premium care marketplace UI.

### Modified Capabilities

- None.

## Impact

- Mobile theme tokens in `apps/mobile/src/theme/theme.ts`.
- Shared UI components under `apps/mobile/src/components/ui/` and active reusable components under `apps/mobile/src/components/`.
- Navigation styling in `apps/mobile/src/navigation/RootTabs.tsx`.
- Active customer screens under `apps/mobile/src/screens/auth`, `apps/mobile/src/screens/home`, `apps/mobile/src/screens/appointments`, and `apps/mobile/src/screens/customer`.
- Active provider and owner/admin screens under `apps/mobile/src/screens/provider` and `apps/mobile/src/screens/owner`.
- Product copy in `apps/mobile/src/content/brandCopy.ts` only where needed to support premium care marketplace language.
- Mobile tests for reusable presentation logic, category marketplace rendering, navigation labels, cards, state handling, and non-brittle screen behavior.
- No required backend, database, payment service, seed, or API contract changes.
