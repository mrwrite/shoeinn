# Design

## Overview

This change is an engineering-stability pass rather than a feature change. It reduces maintenance friction by consolidating navigation typing and resolving known low-risk TypeScript blockers in the mobile app.

## Principles

- Prefer central shared types over stack-local duplicates.
- Keep behavioral risk low.
- Fix the smallest correct surface for each typecheck issue.
- Avoid turning a typing cleanup into a navigation rewrite.

## Navigation Typing Direction

### Shared type ownership

`apps/mobile/src/navigation/types.ts` should become the source of truth for shared mobile navigation param lists that are referenced across screens.

This includes:

- the active RootTabs stacks already defined there,
- and customer booking/customer legacy flow param lists that are still used by customer screens.

`CustomerStack.tsx` should consume shared param-list types instead of defining its own separate type source.

### Legacy boundary handling

Legacy/orphaned stacks do not need to be expanded or productized. The goal is only to stop customer screens from importing a stack-local type when a shared navigation-types file can own it safely.

## Typecheck Cleanup Areas

### `Text.tsx`

The current component uses a `Record<Props["weight"], string>` pattern that is too loose for React Native’s `fontWeight` typing. This should be replaced with an explicit weight type and a `TextStyle["fontWeight"]` map.

### `CompanyPickerScreen.tsx`

The `useQuery` call currently passes `listCompanies` directly even though the function signature accepts optional params, which conflicts with React Query’s query function expectations. Wrap the call explicitly and keep the screen behavior unchanged.

The error-state FlatList placeholder should be simplified to avoid type noise from an invalid empty list/render combination.

### `CompanyServicesScreen.tsx`

The screen currently relies on untyped `useNavigation()` plus route names cast from `CustomerStackParamList`. This should move to a properly typed navigation instance backed by shared navigation param types.

### Tests and config

The app currently lacks working Jest globals for TypeScript typechecking. The lowest-risk fix is:

- add a local declaration file for the commonly used Jest globals/mocks,
- normalize `tsconfig.json`,
- and add a `typecheck` package script for repeatable verification.

This is preferred over rewriting tests.

## Risks

- Shared navigation typing changes could accidentally widen scope if too many screens are moved at once. Keep the cleanup targeted.
- Test-global declarations should remain minimal and not mask application-code issues.
- `tsconfig` changes should be conservative and not hide legitimate app typing problems beyond the intended scope.

## Validation

Implementation should verify:

- app-wide `tsc --noEmit` in `apps/mobile` is significantly cleaner and ideally passes,
- `CustomerStack` no longer owns the only definition of customer-flow param types,
- the known blocking files typecheck cleanly,
- and active RootTabs behavior remains unchanged.
