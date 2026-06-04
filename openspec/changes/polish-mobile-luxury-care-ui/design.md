## Context

ShoeInn has already moved from shoe-only positioning toward a premium multi-category care marketplace. The mobile app now has semantic theme tokens, shared UI components, category-led discovery, demo market selection, booking/payment flows, appointment tracking, provider operations, and owner/admin operations. The current visual system is functional and partially polished, but it still reads more like a lightweight business app than a premium consumer marketplace.

This change is a mobile-only visual and UX polish plan for `apps/mobile`. It should align the active app with the uploaded luxury design board direction while preserving API contracts, booking/payment behavior, category marketplace behavior, websocket/live updates, role routing, and ShoeInn branding.

## Goals / Non-Goals

**Goals:**

- Refine the mobile design language around warm cream surfaces, deep teal brand presence, muted gold accents, charcoal typography, rounded luxury cards, soft shadows, and large imagery/media areas.
- Make the customer marketplace path feel premium and consumer-oriented: login, home/category discovery, provider menu, service detail, booking, review/pay, payment result, appointments, and tracking.
- Keep provider and company admin screens polished but operationally clear, with stronger hierarchy, denser scan-friendly cards, and restrained accents.
- Improve the bottom tab bar so navigation feels more modern, polished, and iOS-like while remaining compatible with Android and Expo.
- Create reusable presentation primitives for luxury media cards, category cards/chips, booking step indicators, timeline presentation, rewards/membership card styling, and polished state surfaces.
- Preserve accessibility, readable contrast, long-name resilience, and touch targets of at least 44px where practical.

**Non-Goals:**

- Backend, database, payment service, seed, or API contract changes.
- Rebranding the app away from ShoeInn.
- Full navigation architecture replacement.
- New paid external asset dependencies.
- Production photography procurement or content pipeline changes.
- Animation-heavy redesigns, gesture-heavy interactions, or fragile platform-specific hacks.
- Enforcement of provider category capabilities or changes to assignment logic.

## Decisions

- Refine the existing theme instead of adding a parallel style system.

  `apps/mobile/src/theme/theme.ts` already has semantic tokens and compatibility aliases. The implementation should tune those tokens toward the luxury palette, add any missing semantic aliases, and keep existing names compatible. Target values should include deep teal `#0B5563` or `#0F5A6B`, luxury gold `#D6A73D` or `#D4A62A`, warm backgrounds `#FAF8F4` and `#F8F5EF`, charcoal `#1B1E24`, and muted gray `#6F7782`.

  Alternative considered: create a new theme object and migrate all screens at once. That increases risk and makes rollback harder.

- Treat imagery as a first-class surface with branded placeholders.

  Provider, service, category, appointment, and rewards cards should reserve large visual areas. When real URLs are unavailable, use local placeholder surfaces generated from category metadata, iconography, warm textures, layered card shapes, or bundled local assets if present. Placeholder treatment must feel intentional, not like missing content.

  Alternative considered: wait for production imagery. That would block the visual upgrade and is unnecessary for demo readiness.

- Keep customer surfaces more expressive and operational surfaces more restrained.

  Customer marketplace screens can use larger cards, lifestyle/media panels, gold primary CTAs, and more generous spacing. Provider and owner/admin screens should use the same tokens but tighter density, clearer status hierarchy, and teal/neutral primary actions except for truly high-value actions.

  Alternative considered: apply identical marketplace cards everywhere. That would reduce scan efficiency for provider/admin users.

- Build reusable primitives before migrating screens.

  The implementation should polish `AppScreen`, `AppCard`, `AppButton`, `StatusBadge`, `SectionHeader`, `EmptyState`, `LoadingState`, `AppointmentTimeline`, `ProviderCard`, `ServiceCard`, and bottom navigation styling before deep screen work. New components should be small and composable, such as `LuxuryMediaPanel`, `CategoryTile`, `BookingStepper`, `MetricCard`, and `MembershipCard` if they remove duplication.

  Alternative considered: screen-by-screen visual edits only. That risks inconsistent styling and fragile one-off layouts.

- Use bottom navigation polish without changing route behavior.

  `RootTabs.tsx` should keep current tab composition and role logic, but tab bar styling can be modernized with a warm elevated surface, rounded/floating treatment if safe with safe areas, improved active icon treatment, no notification count leakage into Appointments, and accessible labels.

  Alternative considered: replace bottom tabs with a custom navigator. That is out of scope and too risky for a polish pass.

- Keep booking and payment task clarity above visual decoration.

  Booking screens should gain a modern stepper, better date/time card selection, clear price summary, and polished review/pay hierarchy. Payment redirect and refresh behavior must remain untouched, and loading/processing states must communicate what is happening without changing payment logic.

  Alternative considered: redesign booking as a new flow. That would require contract and behavior changes outside this scope.

- Validate with tests plus targeted manual QA.

  Automated validation should cover typecheck, existing mobile tests, and any added tests for reusable presentation logic or non-brittle screen behavior. Manual QA should cover customer, provider, admin, category discovery, booking, payment return/refresh, appointment tracking, notifications, and compact Android layout.

## Risks / Trade-offs

- [Risk] The polish overlaps with the previous modern UI change. -> Mitigation: treat this as a stricter luxury refinement of the same mobile surface, reuse existing components, and avoid duplicating concepts.
- [Risk] Changing shared components can cause broad visual regressions. -> Mitigation: preserve props, migrate in phases, and test active role flows after each phase.
- [Risk] Warm low-contrast colors may reduce readability. -> Mitigation: keep charcoal text, validate contrast, and avoid using gold for body text.
- [Risk] Large visual cards may hurt small-screen density. -> Mitigation: use responsive constraints, compact variants for operational screens, and test long names and narrow devices.
- [Risk] Placeholder imagery could look generic. -> Mitigation: make placeholders category-aware, branded, and visually intentional until real assets are available.
- [Risk] Bottom navigation floating treatment can conflict with safe areas. -> Mitigation: preserve `useSafeAreaInsets`, test Android/iOS safe areas, and fall back to elevated flat treatment if needed.

## Migration Plan

Implementation can ship as a mobile-only update. Start with token/component changes, then migrate screens in phases. Existing backend and payment services do not need deployment changes.

Rollback is a standard mobile code rollback. Because API contracts and persisted data are unchanged, backend rollback is not required.

## Open Questions

- Should bundled local placeholder imagery be generated/added for the demo, or should Phase 1 use code-driven branded media panels only?
- Should ShoeInn introduce a small rewards/membership card on Profile during this polish, or only restyle existing profile/rewards-like surfaces already present?
- Should provider/admin screens use fully floating bottom navigation treatment, or a simpler elevated tab bar to preserve operational density?
