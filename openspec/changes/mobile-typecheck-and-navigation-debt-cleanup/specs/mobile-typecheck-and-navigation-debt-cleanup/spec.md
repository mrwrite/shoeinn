# Mobile Typecheck And Navigation Debt Cleanup

## ADDED Requirements

### Requirement: Shared navigation types own reusable mobile param lists

The mobile app SHALL define reusable navigation param-list types in shared navigation typing rather than requiring customer screens to import stack-local param-list definitions.

#### Scenario: Customer screens consume shared navigation types

- **GIVEN** a customer screen needs navigation param types
- **WHEN** the screen imports its navigation typings
- **THEN** it uses shared navigation types
- **AND** it does not depend on `CustomerStack.tsx` as the primary type source

#### Scenario: CustomerStack consumes shared param-list types

- **GIVEN** the legacy customer stack still exists
- **WHEN** it defines its navigator
- **THEN** it consumes shared param-list types rather than maintaining a separate conflicting source of truth

### Requirement: Known low-risk mobile typecheck blockers are resolved

The mobile app SHALL resolve the identified low-risk typecheck blockers in shared UI and customer support screens.

#### Scenario: Shared text component typechecks cleanly

- **GIVEN** the shared mobile `Text` component is compiled with TypeScript
- **WHEN** the app is typechecked
- **THEN** the component’s font-weight and variant typing is accepted without unsafe broad casts

#### Scenario: Company picker and services screens typecheck cleanly

- **GIVEN** `CompanyPickerScreen.tsx` and `CompanyServicesScreen.tsx` are typechecked
- **WHEN** the app-wide mobile typecheck runs
- **THEN** those screens no longer fail due to navigation or query typing issues

### Requirement: Mobile test files have working TypeScript global support

The mobile app SHALL provide minimal Jest/test typing support so test files do not pollute the app-wide typecheck signal.

#### Scenario: Test globals are recognized during typecheck

- **GIVEN** mobile test files use `describe`, `it`, `expect`, and `jest`
- **WHEN** `tsc --noEmit` runs in `apps/mobile`
- **THEN** those globals are recognized by TypeScript

### Requirement: Mobile app exposes a repeatable typecheck regression gate

The mobile app SHALL expose a standard package script or equivalent configuration for running app-wide mobile typecheck.

#### Scenario: Mobile typecheck can be run via package script

- **GIVEN** an engineer wants to verify mobile typing stability
- **WHEN** they inspect or run the mobile package scripts
- **THEN** a `typecheck` script or equivalent standardized command exists for app-wide mobile typechecking
