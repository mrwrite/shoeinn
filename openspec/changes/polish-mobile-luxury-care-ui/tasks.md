## 1. Theme/Design Token Audit

- [x] 1.1 Audit `apps/mobile/src/theme/theme.ts` against the luxury board palette and current token consumers.
- [x] 1.2 Refine semantic colors for warm background, elevated surface, card, deep teal primary, muted gold accent, charcoal text, muted gray text, border, divider, and status colors while preserving compatibility aliases.
- [x] 1.3 Tune typography hierarchy for display, h1, h2, h3, body, caption, button, overline, and compact metadata labels.
- [x] 1.4 Tune radii, spacing, shadow/elevation, and minimum touch target tokens for modern iOS-style spacing and Android compatibility.
- [x] 1.5 Document token usage comments where they help future screen migrations stay consistent.

## 2. Reusable UI Component Polish

- [x] 2.1 Polish `AppScreen`, `AppCard`, `AppButton`, `StatusBadge`, `SectionHeader`, `EmptyState`, and `LoadingState` to use the luxury token system consistently.
- [x] 2.2 Add or refine shared media placeholder treatment for category-aware provider, service, appointment, and rewards-style cards.
- [x] 2.3 Add or refine category tile/chip primitives for elegant marketplace discovery and selected-state treatment.
- [x] 2.4 Add or refine a booking stepper/progress primitive for date/time/confirm/review screens.
- [x] 2.5 Add or refine appointment timeline primitives for premium order-tracking presentation.
- [x] 2.6 Add accessibility labels, disabled states, and 44px touch target defaults where practical in shared primitives.
- [x] 2.7 Add focused tests for reusable presentation helpers that can be tested without a live backend.

## 3. Home/Discovery Redesign

- [x] 3.1 Polish `LoginScreen` and the demo login selector with warm surfaces, deep teal brand presence, gold primary CTA treatment, and clear demo account grouping.
- [x] 3.2 Redesign `HomeScreen` hero and category discovery section around "What needs care today?" with luxury category cards/chips and category-aware visual placeholders.
- [x] 3.3 Polish provider discovery cards so they feel photo-forward and premium while preserving category filtering, search, demo-market location behavior, and navigation.
- [x] 3.4 Preserve fallback behavior when categories fail to load and polish empty states for selected categories with no providers.
- [x] 3.5 Add or update mobile tests for category rendering, category fallback, selected category filtering, and provider card category metadata.

## 4. Provider/Service Detail Redesign

- [x] 4.1 Polish `ProviderMenuScreen` with provider hero treatment, category context, service grouping, and premium service list cards.
- [x] 4.2 Polish `ServiceDetailScreen` with large service media placeholder, service value hierarchy, category context, price/duration summary, and clear booking CTA.
- [x] 4.3 Ensure service cards preserve category-specific names, category metadata, service filtering, and existing navigation parameters.
- [x] 4.4 Add or update tests for service card category metadata and provider service filtering where current test infrastructure supports it.

## 5. Booking Flow Redesign

- [x] 5.1 Polish `BookingDateScreen` with modern stepper, date selection cards, state feedback, and clear primary CTA placement.
- [x] 5.2 Polish `BookingTimeScreen` with time slot cards, loading/empty/error treatment, and disabled states while preserving slot selection behavior.
- [x] 5.3 Polish `BookingConfirmScreen` with care-neutral summary copy, pickup/contact details, and task-focused hierarchy.
- [x] 5.4 Polish `BookingReviewPayScreen` with premium review card, price/payment summary, clear payment CTA, and existing Stripe redirect behavior unchanged.
- [x] 5.5 Polish `PaymentResultScreen` with success/pending/error visual states and existing refresh/return behavior unchanged.
- [x] 5.6 Add or update tests for non-brittle booking presentation helpers and preserved payment copy where practical.

## 6. Appointment/Tracking Redesign

- [x] 6.1 Polish `AppointmentListScreen` with luxury appointment cards showing company/provider, service, date/time, status, category or care context, and payment state where available.
- [x] 6.2 Polish `AppointmentDetailScreen` with hero summary card, status badge, tracking timeline, pickup/drop-off details, payment summary, and existing support/cancel action placement where available.
- [x] 6.3 Polish map/tracking sections so missing coordinates or images fail gracefully.
- [x] 6.4 Polish customer notifications with unread/read distinction, premium notification cards, and existing notification count behavior unchanged.
- [x] 6.5 Add or update tests for appointment/order category-neutral copy, status badge usage, notification states, and appointment list rendering where practical.

## 7. Profile/Rewards/Navigation Polish

- [x] 7.1 Polish `RootTabs.tsx` bottom navigation with warm elevated surface, clear active state, safe-area-aware spacing, accessible labels, and unchanged route behavior.
- [x] 7.2 Polish `ProfileScreen` and notification entry surfaces with premium account cards and rewards/membership-style styling without adding backend rewards features.
- [x] 7.3 Confirm Appointments tab badge behavior remains separate from notification counts.
- [x] 7.4 Add or update tests for navigation labels/options and profile notification entry behavior where practical.

## 8. Provider/Admin Operational Polish

- [x] 8.1 Polish `ProviderDashboardScreen` job lists with scan-friendly cards, status badges, customer/service/time/location hierarchy, and clear claim/continue CTAs.
- [x] 8.2 Polish `ProviderAppointmentDetailScreen` with operational hero, status action panel, timeline context, map card styling, disabled submit states, and existing status logic unchanged.
- [x] 8.3 Polish `OwnerDashboardScreen` summary cards, appointment queue, assignment context, status/payment context, and empty/loading/error states.
- [x] 8.4 Polish `OwnerAppointmentDetailScreen` assignment/status surfaces with clear action hierarchy and disabled submit states.
- [x] 8.5 Add or update tests for provider/admin card helpers and status/assignment presentation where practical.

## 9. Tests, Typecheck, QA

- [x] 9.1 Run `npm run typecheck` in `apps/mobile`.
- [x] 9.2 Run `npm test -- --runInBand` in `apps/mobile`.
- [x] 9.3 Run focused API tests only if implementation unexpectedly touches API-facing contracts.
- [x] 9.4 Run `openspec validate polish-mobile-luxury-care-ui --strict`.
- [x] 9.5 Add or update a QA checklist under the change folder covering customer, provider, company admin, category discovery, booking, payment return/refresh, appointment tracking, notifications, compact Android layout, and visual copy review.
- [ ] 9.6 Perform customer manual QA and document results.
- [ ] 9.7 Perform provider manual QA and document results.
- [ ] 9.8 Perform company admin manual QA and document results.
- [x] 9.9 Document remaining risks, deferred imagery/assets, and any follow-up polish recommendations before archive.
