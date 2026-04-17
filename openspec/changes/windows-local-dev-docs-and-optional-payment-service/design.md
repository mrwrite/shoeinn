# Design

## Overview

This is a documentation-only change. It aligns the written setup instructions with the repository's active runtime code paths and the actual Windows PowerShell commands that work in this repo.

## Active Runtime Surfaces

- Backend API: `apps/api/app/main.py`
- Mobile app: `apps/mobile/App.tsx`
- Optional payment service: `apps/payment/app/main.py`

## Documentation Strategy

### Root README

The root README should become the primary onboarding guide for:

- repo structure and active apps
- Windows PowerShell local startup order
- Postgres startup via `apps/api/docker-compose.yml`
- backend and mobile commands
- optional notification worker
- `EXPO_PUBLIC_API_URL` values by target device type
- concise validation checklist for provider claiming and assignment

It should also explicitly say that the repo is not started as one root-level application.

### apps/api README

The API README should become a narrower service-level guide for:

- Windows virtualenv activation
- dependency install path from the repo root requirements plus editable install
- `.env` behavior when the API runs on the Windows host and Postgres runs in Docker
- migrations
- API startup
- focused test command for the claiming/assignment change

### apps/payment docs

`apps/payment` is currently underdocumented and has no README. A short README is justified because:

- the service exists as a separate runtime surface,
- its environment variables are not described anywhere else,
- the main API treats it as optional unless `PAYMENT_SERVICE_BASE_URL` is configured.

The new `apps/payment/README.md` should stay intentionally small and clearly state:

- this service is optional for most local development,
- it is only needed for payment-specific flows,
- when unset, the main API uses stub payment behavior and the payment sync worker does not start,
- minimum known local startup example based on checked-in code only.

## Known Documentation Corrections

- remove or clarify broken `make`-first guidance for Windows
- replace Unix `source .venv/bin/activate` examples with PowerShell commands
- correct the requirements install path because `apps/api/requirements.txt` does not exist
- clarify `.env.example` uses `db` for Docker-network use, while Windows host + Docker Postgres should use `localhost`
- clarify that the notification worker is manual and the payment sync worker is conditional

## Validation Coverage

The docs should include a short, ordered checklist covering:

- focused backend tests
- API startup
- demo seed
- mobile startup with the correct `EXPO_PUBLIC_API_URL`
- claim, duplicate-claim conflict, reassignment rules, assigned provider display, and status timeline
