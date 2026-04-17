# Windows Local Dev Docs And Optional Payment Service

## ADDED Requirements

### Requirement: Windows PowerShell local setup documentation matches active runtime paths

The repository SHALL document a Windows PowerShell local workflow based on the active runtime surfaces in `apps/api`, `apps/mobile`, and optional `apps/payment`.

#### Scenario: Root docs describe the real startup order

- **GIVEN** a developer is onboarding on Windows PowerShell
- **WHEN** they read the root README
- **THEN** they can identify the required startup order for Postgres, the backend API, and the mobile app
- **AND** the docs do not imply the repo runs as one root-level application

### Requirement: Backend docs use valid Windows commands and paths

The repository SHALL document valid Windows PowerShell backend commands for virtualenv activation, dependency installation, migrations, API startup, and focused tests.

#### Scenario: Backend docs avoid nonexistent requirements paths

- **GIVEN** a developer follows the backend README
- **WHEN** they install dependencies
- **THEN** the instructions do not reference a nonexistent `apps/api/requirements.txt`

#### Scenario: Backend docs describe host Docker Postgres correctly

- **GIVEN** Postgres runs in Docker and the API runs on the Windows host
- **WHEN** a developer configures `.env`
- **THEN** the docs explain that `localhost` should be used instead of the Docker-network hostname `db`

### Requirement: Payment service docs describe optional behavior clearly

The repository SHALL state that `apps/payment` is optional for most local development flows and document the minimum known startup behavior from checked-in code.

#### Scenario: Developer understands optional payment service

- **GIVEN** a developer is only validating provider appointment claiming and assignment
- **WHEN** they read the docs
- **THEN** they understand that `apps/payment` is not required for that workflow
- **AND** they understand that the payment sync worker only starts when `PAYMENT_SERVICE_BASE_URL` is configured

### Requirement: Docs include a local validation checklist for provider claiming and assignment

The repository SHALL include a concise local validation checklist for the provider appointment claiming and assignment change.

#### Scenario: Developer validates the change locally

- **GIVEN** a developer has started the documented local services
- **WHEN** they follow the validation checklist
- **THEN** they can verify claim, duplicate claim conflict, reassignment rules, assigned provider display, and status timeline behavior
