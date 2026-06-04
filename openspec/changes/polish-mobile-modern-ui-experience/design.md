## Context

ShoeInn’s Expo mobile app now has functioning customer, provider, company admin, appointment, notification, and payment flows. The current UI uses shared theme tokens and some reusable UI primitives, but presentation varies across older and newer screens, with mixed card styles, generic state handling, uneven typography hierarchy, and inconsistent visual emphasis.

This change is a cross-cutting mobile polish pass across `apps/mobile`. It should make the active demo experience feel like a premium service marketplace while preserving current backend contracts, payment behavior, navigation intent, websocket refresh behavior, and role-based flows.

## Goals / Non-Goals

**Goals:**

- Establish a cohesive Pinterest-inspired light visual direction using soft surfaces, peacock/teal accents, gold CTAs, modern cards, subtle shadows, and stronger type hierarchy.
- Centralize reusable UI building blocks so screen polish does not create one-off style drift.
- Polish priority customer screens: login/demo login, discovery/home, company/service detail, booking steps, review/pay, payment result, appointments, appointment detail/tracking timeline, and notifications.
- Polish provider and company admin screens: dashboards, job cards, appointment detail, status actions, and notification/admin surfaces.
- Improve touch targets, spacing, badge language, loading/empty/error states, and demo-readiness on Android and iOS.
- Keep light mode forced and avoid fragile animation-heavy implementation.

**Non-Goals:**

- Adding backend features, changing API payload contracts, or changing payment service behavior.
- Introducing a new navigation architecture or replacing the active `RootTabs` app model.
- Building new complex animation systems or gesture-heavy interactions.
- Rebranding beyond the existing ShoeInn peacock/teal/gold direction.
- Solving remote push notification limitations in Expo Go.

## Decisions

- Build polish from the theme outward.

  Start with `src/theme/theme.ts` so color, typography, spacing, radius, and shadow/elevation changes are available to every screen. Existing theme names can remain for compatibility, but the palette should gain clearer surface layers such as app background, card background, warm surface, accent surface, divider, success/status tones, and gold CTA treatment.

  Alternative considered: restyle each screen independently. That would move quickly at first but make the app harder to keep consistent as more screens are polished.

- Create small reusable primitives instead of a large design-system rewrite.

  Add or improve focused components for section headers, marketplace cards, status badges, timeline rows, empty states, loading states, error states, action panels, and photo/media placeholders. Keep `Button`, `Card`, `Text`, `ScreenContainer`, `AppointmentCard`, `OwnerJobCard`, and related components compatible with current callers.

  Alternative considered: replace all UI primitives in one pass. That is higher risk and could break screens that currently rely on subtle style or layout behavior.

- Treat active demo flows as the implementation boundary.

  Prioritize screens reachable from the current auth gate and `RootTabs`: login, active customer home/booking/appointments/notifications, provider dashboard/detail, owner/company admin dashboard/detail, and profile notification entry points. Legacy or duplicate screen families should only be touched if the active flow imports them or if shared component changes naturally improve them.

  Alternative considered: polish every screen file regardless of reachability. That would increase scope and risk without improving the demo path proportionally.

- Use photo-forward cards with graceful fallbacks.

  Company and service cards should support large image/thumbnail areas and feel marketplace-like. Where real photos are not available, use polished branded placeholders, restrained iconography, or gradient-free surface treatments based on service/company data.

  Alternative considered: block polish until all companies and services have production image assets. That would stall the UI improvement and is unnecessary for demo readiness.

- Preserve operational clarity in provider/admin surfaces.

  Provider and company admin screens should feel more utilitarian than customer marketplace screens: denser but still polished, with clear status badges, action hierarchy, job ownership cues, and predictable status actions. Gold should be reserved for primary customer CTAs and high-value actions; operational actions should usually use peacock/teal or neutral treatments.

  Alternative considered: apply the same marketplace card style everywhere. That could make operational screens decorative and harder to scan.

- Standardize state feedback.

  Loading, empty, and error states should use consistent reusable presentation, clear role-specific copy, and practical actions such as retry or navigate back. State surfaces should not create separate floating-card layouts inside already-carded content.

  Alternative considered: leave state handling per-screen. This preserves current behavior but misses one of the easiest ways to make the app feel demo-ready.

- Keep accessibility pragmatic and testable.

  Touch targets should be at least 44px where practical, text should not overflow compact controls, status badges should not rely on color alone, and contrast should be validated for the updated palette. The work should avoid tiny icon-only controls unless they have obvious meaning and accessible labels.

  Alternative considered: defer accessibility until after visual polish. That risks shipping a polished-looking app that is harder to use in real demos.

## Phased Implementation Plan

### Phase 1: Design System Foundation

- Update `theme.ts` palette, surface layers, typography scale, radii, spacing, shadows/elevation, and status tones.
- Review `Text`, `Button`, `Card`, `ScreenContainer`, and common layout primitives for compatibility and touch target defaults.
- Add shared state and badge primitives needed by later phases.

### Phase 2: Marketplace Customer Surfaces

- Polish login and demo login selector.
- Polish customer home/company discovery and company/service detail with photo-forward cards and cleaner hierarchy.
- Polish booking date/time/confirm/review-pay/payment-result screens while preserving payment flow behavior.

### Phase 3: Customer Appointment And Notification Surfaces

- Polish appointments list and appointment cards.
- Polish appointment detail, tracking map area, status timeline, assignment/update surfaces, and notification center.
- Keep live update and query invalidation behavior intact.

### Phase 4: Provider And Admin Operational Surfaces

- Polish provider dashboard, provider detail, status action panels, and operational job cards.
- Polish company admin/owner dashboard and appointment detail with clearer assignment/status controls and denser scan-friendly hierarchy.
- Keep provider/admin API usage and role behavior unchanged.

### Phase 5: Accessibility And Demo QA

- Verify touch targets, text overflow, loading/empty/error states, Android/iOS layout, service-mode payment path, mock mode path, role switching, and Mt. Juliet demo data.
- Fix regressions found during QA before considering the change complete.

## Risks / Trade-offs

- [Risk] Broad UI polish can become an unbounded redesign. -> Mitigation: implement in phases, stay within active demo flows, and keep backend/API behavior unchanged.
- [Risk] Shared component changes can unintentionally alter legacy screens. -> Mitigation: preserve component props, test active flows, and manually review affected legacy imports before finalizing.
- [Risk] Photo-forward cards may look incomplete without real image data. -> Mitigation: support polished placeholders and make image fields optional.
- [Risk] Gold CTAs can become overused. -> Mitigation: reserve gold for primary conversion or high-value actions and use peacock/teal/neutral for operational controls.
- [Risk] Soft surfaces can reduce contrast. -> Mitigation: validate text and badge contrast and avoid low-contrast status-only color treatments.
- [Risk] Layout improvements could break smaller Android screens. -> Mitigation: test compact viewport sizing, long strings, and scroll behavior during final QA.

## Migration Plan

No backend migration is required. Implementation can ship as a mobile-only update. If EAS or production mobile config changes are needed, they should be handled separately from this polish unless directly required for the demo QA pass.

Rollback is a normal mobile code rollback. Because API contracts are preserved, backend rollback should not be necessary.

## Open Questions

- Which company/service images should be used for demo-ready photo-forward cards if no backend image URLs are present?
- Should provider/company admin use the same card radius/elevation as customer marketplace cards, or a slightly tighter operational variant?
- Should this polish target only the current `RootTabs` app path, or also clean older duplicate screen files for consistency after the active path is complete?
