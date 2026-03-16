# Windows Local Dev Docs And Optional Payment Service

## Summary

Update the repository documentation to describe the actual Windows PowerShell local development workflow for the active runtime surfaces in `apps/api`, `apps/mobile`, and optional `apps/payment`.

## Problem

The current docs are inconsistent and partly stale:

- root and backend docs imply `make`-driven workflows that are not reliable on this Windows setup,
- some instructions reference a nonexistent `apps/api/requirements.txt`,
- PowerShell users are shown Unix activation commands,
- `apps/payment` is present but underdocumented,
- the active mobile API base URL behavior depends on `EXPO_PUBLIC_API_URL`, but the docs do not explain platform-specific values clearly.

## Goals

- document the actual Windows PowerShell startup flow for Postgres, `apps/api`, and `apps/mobile`
- clarify that the repo is not run as one root-level app
- fix dependency install, venv activation, migrations, and API startup instructions
- explain that `apps/payment` is optional for most local development and underdocumented today
- add a concise validation checklist for provider appointment claiming and assignment

## Non-Goals

- changing application runtime behavior
- introducing new developer tooling
- rewriting legacy/orphaned app flows

## Scope

- root `README.md`
- `apps/api/README.md`
- `apps/payment/README.md` if justified as the smallest clear fix

## Impact

- Windows PowerShell onboarding becomes accurate
- developers can start the active backend/mobile stack without guessing
- optional payment-service behavior is clear instead of implicit
