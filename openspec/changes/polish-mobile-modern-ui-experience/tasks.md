## 1. Design System Foundation

- [x] 1.1 Audit `apps/mobile/src/theme/theme.ts` and active mobile screens for repeated colors, spacing, typography, card, and badge styles.
- [x] 1.2 Update theme tokens for premium light mode surfaces, peacock/teal accents, gold CTA highlights, subtle borders, shadow/elevation, radius, and touch sizing.
- [x] 1.3 Add typography scale helpers or shared text variants for screen titles, section headers, body copy, metadata, status text, and button labels.
- [x] 1.4 Normalize navigation and screen background colors so customer, provider, and admin routes use the same light marketplace foundation.
- [x] 1.5 Document implementation boundaries for active mobile routes to avoid polishing deprecated or unreachable screens first.

## 2. Shared UI Components

- [x] 2.1 Create or refine reusable app button variants for primary, gold CTA, secondary, ghost, destructive, and disabled states with 44px minimum touch targets where practical.
- [x] 2.2 Create or refine reusable card components for marketplace cards, compact operational cards, elevated summary cards, and pressable list rows.
- [x] 2.3 Create or refine reusable status badge components for appointment, payment, provider, and notification states.
- [x] 2.4 Create or refine reusable section headers with optional actions and consistent spacing.
- [x] 2.5 Create or refine reusable loading, empty, and error state components with consistent layout, copy density, and retry affordances.
- [x] 2.6 Create or refine reusable timeline components for appointment tracking and provider status progression.

## 3. Customer Experience Polish

- [x] 3.1 Polish login and demo login selector screens with clearer hierarchy, premium surfaces, larger controls, and consistent role selection states.
- [x] 3.2 Polish customer company discovery/home with photo-forward company cards, trust metadata, clean search/filter affordances, and graceful image fallbacks.
- [x] 3.3 Polish company and service detail screens with stronger service hierarchy, pricing/duration clarity, and prominent booking CTA placement.
- [x] 3.4 Polish service booking flow screens with clearer step structure, selected-slot/service summaries, validation states, and accessible controls.
- [x] 3.5 Polish Review & Pay with a clear order summary, payment state messaging, gold primary CTA, and consistent error/retry handling.
- [x] 3.6 Polish payment result screens for success, pending, cancelled, and failure outcomes without changing payment API contracts.
- [x] 3.7 Polish customer appointments list with stable lifecycle status badges, compact appointment summaries, and consistent loading/empty/error states.
- [x] 3.8 Polish appointment detail and tracking timeline with clearer status progression, provider/company metadata, and customer-facing next steps.
- [x] 3.9 Polish notifications screen with notification-specific badges/count presentation and no Appointments tab notification-count coupling.

## 4. Provider Experience Polish

- [x] 4.1 Polish provider dashboard cards and queue/list states for scan-friendly appointment ownership, timing, customer, and status information.
- [x] 4.2 Polish provider appointment detail with clearer assignment, customer, address, service, and timeline sections.
- [x] 4.3 Polish provider status action controls with larger touch targets, clear enabled/disabled states, and confirmation/error feedback.
- [x] 4.4 Verify provider claim and status update flows still use existing API contracts and do not regress live customer updates.

## 5. Admin Experience Polish

- [x] 5.1 Polish company admin dashboard summaries, appointment/service/company cards, and operational empty states.
- [x] 5.2 Polish company admin appointment list/detail surfaces while preserving current filters, role permissions, and data contracts.
- [x] 5.3 Verify admin views remain dense enough for operations while matching the shared visual system.

## 6. Accessibility And Touch Targets

- [x] 6.1 Audit priority screens for controls below 44px target size and adjust hit slop, padding, or layout where practical.
- [x] 6.2 Audit status badges, CTAs, disabled states, and secondary text for contrast against white/cream surfaces.
- [x] 6.3 Add or improve accessibility labels, roles, and state text for icon-only buttons, segmented controls, status badges, timeline steps, and payment actions.
- [x] 6.4 Verify layouts at common Android and iOS mobile widths so text does not clip, overlap, or crowd important controls.

## 7. Final Demo QA Pass

- [x] 7.1 Run `openspec validate polish-mobile-modern-ui-experience --strict`.
- [x] 7.2 Run mobile typecheck and targeted mobile tests for screens/components touched by the polish pass.
- [ ] 7.3 Manually smoke test customer demo flow from login through discovery, booking, Review & Pay, payment result, appointment list/detail, and notifications.
- [ ] 7.4 Manually smoke test provider demo flow from login through dashboard, appointment detail, claim/status actions, and status feedback.
- [ ] 7.5 Manually smoke test company admin demo flow from login through dashboard, appointment views, and notification surfaces.
- [x] 7.6 Capture remaining polish gaps or follow-up work that is outside this change's no-backend-feature scope.
