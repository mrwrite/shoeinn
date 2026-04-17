# Mobile Typecheck And Navigation Debt Cleanup

## Summary

Clean up the mobile app’s current TypeScript and navigation debt so app-wide `tsc --noEmit` becomes substantially cleaner and ideally passes. This change focuses on low-risk fixes for shared navigation typing, test globals/config, and a small set of known blocking files.

## Problem

Recent feature work has kept touched files type-safe, but app-wide mobile typechecking still fails because of older issues:

- active and near-active customer screens still depend on `CustomerStack`-local param types rather than shared navigation types,
- `Text.tsx` has low-level typing issues that pollute typecheck output,
- `CompanyPickerScreen.tsx` and `CompanyServicesScreen.tsx` carry React Query and navigation typing debt,
- test files are missing Jest global/type support for the current TypeScript configuration,
- and there is no normalized mobile typecheck script to serve as a consistent regression gate.

## Goals

- Make `apps/mobile` typecheck substantially cleaner and ideally green.
- Centralize shared navigation param typing where the repo already supports it.
- Remove active-flow dependence on legacy `CustomerStack` typing where practical.
- Fix low-risk test typing/config blockers without rewriting tests.
- Add or normalize a mobile typecheck script for repeatable verification.

## Non-Goals

- Redesigning mobile flows or adding new product behavior.
- Refactoring legacy stacks beyond what is required for shared typing cleanup.
- Broad state/store changes unrelated to typecheck stability.
- Reworking tests beyond minimal typing/config fixes.

## Scope

### In scope

- `apps/mobile/src/navigation/*`
- `apps/mobile/src/navigation/types.ts`
- `apps/mobile/App.test.tsx`
- `apps/mobile/src/__tests__/*`
- `apps/mobile/src/components/ui/Text.tsx`
- `apps/mobile/src/screens/customer/CompanyServicesScreen.tsx`
- `apps/mobile/src/screens/customer/CompanyPickerScreen.tsx`
- `apps/mobile/package.json`
- `apps/mobile/tsconfig.json`
- minimal local typing setup files required to stabilize typecheck

### Out of scope

- broad UI/product changes
- backend or API changes
- large navigation rewrites

## Proposed Approach

- Move customer-flow param-list ownership into shared navigation types and have `CustomerStack` consume those shared types rather than define a competing source of truth.
- Update the identified customer screens to import shared navigation types and use properly typed navigation calls.
- Fix the low-risk `Text.tsx` type issues directly.
- Add minimal local Jest globals/type declarations and normalize typecheck configuration/scripts.
- Run the app-wide mobile typecheck and only widen fixes if the remaining blockers are clearly low-risk.

## Impact

- Mobile engineers should get a cleaner, more trustworthy `tsc --noEmit` signal.
- Active-flow screens should be less coupled to older stack-local type definitions.
- Future mobile changes should require less defensive typing cleanup before shipping.
