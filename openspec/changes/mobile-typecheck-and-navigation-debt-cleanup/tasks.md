# Tasks

## 1. Shared navigation typing cleanup

- [x] Move customer-flow param-list ownership into shared navigation types.
- [x] Update `CustomerStack` and identified customer screens to consume shared navigation types.
- [x] Reduce direct screen dependence on stack-local `CustomerStack` typing.

## 2. Low-risk mobile typecheck blockers

- [x] Fix `apps/mobile/src/components/ui/Text.tsx` typing issues.
- [x] Fix `CompanyPickerScreen.tsx` and `CompanyServicesScreen.tsx` typing issues without changing behavior.
- [x] Fix any nearby low-risk typing issues needed to make `tsc --noEmit` meaningful.

## 3. Test typing and config cleanup

- [x] Add minimal local Jest/test global typing support for the mobile app.
- [x] Normalize mobile typecheck config if needed.
- [x] Add or normalize a mobile `typecheck` script in `apps/mobile/package.json`.

## 4. Verification

- [x] Run `cmd /c .\node_modules\.bin\tsc.cmd --noEmit` in `apps/mobile`.
- [x] Confirm whether app-wide mobile typecheck passes.
- [x] Capture any remaining debt explicitly if full pass is not achieved.
