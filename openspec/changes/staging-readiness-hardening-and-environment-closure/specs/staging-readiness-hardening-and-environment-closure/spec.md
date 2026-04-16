# Spec

## ADDED Requirements

### Requirement: ShoeInn staging must have an explicit supported deployment topology

The system SHALL document and support a staging topology that defines which services and worker processes are required for a valid staging environment.

#### Scenario: Staging operator provisions the environment

- **WHEN** an operator prepares staging
- **THEN** the repo defines the required runtime services and their startup order
- **AND** the operator can tell which dependencies are mandatory, optional, or stubbed

### Requirement: API readiness must validate real dependencies

The API SHALL expose readiness checks that reflect actual staging viability, not only process liveness.

#### Scenario: Staging readiness probe runs

- **WHEN** a readiness endpoint is called
- **THEN** it verifies database connectivity and other required dependencies for the configured mode
- **AND** it fails when critical staging dependencies are unavailable

### Requirement: Staging data flows must be reproducible

The system SHALL support reproducible database bootstrap, migration, and seed/reset behavior for staging.

#### Scenario: Fresh staging environment is created

- **WHEN** the staging database is empty
- **THEN** migrations can be applied cleanly
- **AND** the environment can be seeded into a known test/demo state

#### Scenario: Existing staging environment is upgraded

- **WHEN** a staging database already exists
- **THEN** upgrade migrations can be applied cleanly without relying on manual schema repair

### Requirement: Shared staging behavior must be realistic enough for end-to-end validation

The system SHALL define which integrations behave realistically in staging and which are intentionally stubbed.

#### Scenario: Internal team uses staging for demos and testing

- **WHEN** users exercise owner, provider, and customer flows
- **THEN** the environment behaves consistently enough for meaningful validation
- **AND** any intentionally simulated behavior is clearly documented and labeled

### Requirement: Mobile staging configuration must be explicit

The mobile app SHALL support a documented staging configuration and distribution path for internal testing and demos.

#### Scenario: Tester installs and connects to staging

- **WHEN** an internal tester uses the mobile app against staging
- **THEN** the API endpoint, auth behavior, push expectations, and deep-link behavior are documented
- **AND** the tester does not rely on local-only Expo assumptions to reach staging
