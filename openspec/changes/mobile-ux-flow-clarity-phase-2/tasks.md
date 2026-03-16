# Tasks

## 1. Customer timeline clarity

- [x] Redesign the active customer timeline rows to distinguish current, completed, upcoming, and terminal states.
- [x] Preserve existing event/status behavior while improving glanceable progress comprehension.
- [x] Ensure terminal states such as `completed` and `cancelled` read as final states rather than ordinary future steps.

## 2. Provider dashboard scannability

- [x] Add clearer tab labels, counts, or summaries for `Available jobs` and `My jobs`.
- [x] Improve the active provider dashboard loading, empty, and error states with more intentional copy and hierarchy.
- [x] Keep all provider dashboard work inside the active `RootTabs` provider flow.

## 3. Provider card hierarchy

- [x] Strengthen `AppointmentCard` hierarchy so service, time, location, and action state are easier to scan.
- [x] Make claimability or action state clearer using existing API data only.
- [x] Support an unavailable/claimed-by-someone-else treatment only if current active data already supports it.

## 4. Customer detail supporting states

- [x] Improve customer detail loading and fallback messaging so the screen remains understandable when data is still loading or partially unavailable.
- [x] Keep current status and provider-summary hierarchy introduced in phase 1 intact.

## 5. Verification

- [x] Run a focused TypeScript check for `apps/mobile`.
- [x] Verify no legacy navigation/screens are touched.
- [x] Capture any active-flow type or navigation debt discovered without expanding scope into a large refactor.
