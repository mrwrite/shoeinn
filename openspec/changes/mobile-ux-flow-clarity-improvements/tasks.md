# Tasks

## 1. Audit alignment and active-surface cleanup

- [ ] Confirm the active appointment surfaces remain `RootTabs -> AppointmentStack -> customer/AppointmentDetailScreen` and `RootTabs -> ProviderStack -> provider/*`.
- [ ] Document duplicate or legacy appointment screens that should not receive new UX wiring during follow-up implementation.
- [ ] Identify shared UI patterns that should be standardized across the active appointment list and detail screens.

## 2. Provider dashboard clarity

- [ ] Redesign the provider dashboard information hierarchy so `Available Jobs` and `My Jobs` are visually distinguishable beyond tab labels alone.
- [ ] Define card-level content and copy rules for claimable, claimed, and unavailable jobs.
- [ ] Replace alert-only claim outcomes with inline success, conflict, and unavailable-state messaging.
- [ ] Ensure claim actions are presented with deliberate affordance and not as accidental high-frequency taps.

## 3. Provider detail action hierarchy

- [ ] Restructure provider appointment detail around current state, assignment state, and the primary next action.
- [ ] Replace the equal-weight status button wall with a progressive action model that highlights the recommended next update.
- [ ] Define explicit UI states for unassigned, assigned-to-me, assigned-to-other, and reassignment-available conditions.
- [ ] Surface ready-photo requirements before the provider attempts the ready transition.

## 4. Reassignment clarity

- [ ] Define how non-admin providers are informed that reassignment is handled elsewhere.
- [ ] Define a separate administrative interaction pattern for company-admin reassignment that is distinct from normal job progress updates.
- [ ] Define conflict-state copy for claim races and reassignment failures so users understand what changed.

## 5. Customer detail hierarchy and timeline

- [ ] Reorder the customer appointment detail screen so current status and provider assignment appear before secondary details.
- [ ] Redesign the status timeline to distinguish current step, completed history, future steps, and exceptional terminal states.
- [ ] Define separate copy and presentation for `no provider assigned yet` versus `provider state unavailable`.
- [ ] Move customer self-information lower in the hierarchy or collapse it behind a secondary details section.
- [ ] Define proof-of-completion and travel-map placement rules so they support, rather than compete with, current status messaging.

## 6. Consistency and ergonomics

- [ ] Align active appointment screens to shared spacing, typography, card, and button patterns from the current mobile design system.
- [ ] Review long rows, stacked buttons, and scroll depth for one-handed mobile ergonomics.
- [ ] Define sticky or near-bottom action placement for the most important provider actions where scroll distance currently hides them.

## 7. Validation

- [ ] Test provider flows for claim clarity, next-step recognition, and conflict comprehension.
- [ ] Test customer flows for status comprehension, provider-assignment clarity, and error-state comprehension.
- [ ] Verify no follow-up implementation extends legacy screen families instead of the active `RootTabs` flow.
