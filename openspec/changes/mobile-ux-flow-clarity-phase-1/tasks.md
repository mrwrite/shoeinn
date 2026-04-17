# Tasks

## 1. Active-flow typing and scope cleanup

- [ ] Confirm the active implementation path remains `RootTabs -> AppointmentStack -> customer/AppointmentDetailScreen` and `RootTabs -> ProviderStack -> provider/*`.
- [ ] Remove or reduce direct active-screen dependency on `CustomerStack` types without extending legacy stack behavior.
- [ ] Keep all phase-1 UX behavior inside the active `RootTabs` flow only.

## 2. Provider detail hierarchy

- [ ] Rework provider appointment detail so current state appears before supporting details.
- [ ] Add a primary next action treatment near the top of the provider detail screen.
- [ ] Keep remaining status transitions available as secondary updates.
- [ ] Keep ready-photo guidance visible near the relevant action.

## 3. Explicit assignment states

- [ ] Define explicit assignment-state mapping on provider detail for assigned-to-me, assigned-to-other, unassigned, and assignment-unavailable.
- [ ] Define explicit assignment-state mapping on customer detail for assigned, unassigned, and assignment-unavailable.
- [ ] Ensure product copy does not rely on exposing `404` or generic fetch-failure semantics.

## 4. Customer detail hierarchy

- [ ] Reorder customer appointment detail so current status and provider state appear above travel, proof, and secondary details.
- [ ] Preserve existing appointment, proof, and timeline functionality while improving hierarchy.

## 5. Inline provider claim feedback

- [ ] Replace alert-only claim/conflict outcomes in the active provider flow with inline state messaging.
- [ ] Support inline success, no-longer-available/conflict, and retryable failure feedback.
- [ ] Keep claim behavior consistent with existing API contracts and query invalidation.

## 6. Verification

- [ ] Verify provider detail still supports current status transitions and ready-photo flow.
- [ ] Verify customer detail still shows the expected travel/timeline/proof content when relevant.
- [ ] Run focused tests or checks for the touched screens if available.
