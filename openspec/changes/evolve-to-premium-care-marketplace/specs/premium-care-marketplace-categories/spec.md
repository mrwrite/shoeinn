## ADDED Requirements

### Requirement: Marketplace exposes active care categories

The system SHALL expose active care categories as first-class marketplace data with stable slugs, display names, and ordering metadata.

#### Scenario: Customer loads category entry points

- **WHEN** the mobile app requests active care categories
- **THEN** the API returns active categories including at least shoes, laundry, dry cleaning, handbags/leather, and rugs/textiles
- **AND** each category includes a stable slug and customer-facing name

#### Scenario: Existing shoe services are backfilled

- **WHEN** the category migration is applied to an existing database
- **THEN** existing active services remain bookable
- **AND** services without an explicit category are associated with the shoes category or an equivalent legacy shoe-care category

### Requirement: Services carry category metadata

The system SHALL associate each bookable care service with category metadata without removing existing service fields or breaking current service consumers.

#### Scenario: Service list includes category context

- **WHEN** a client requests services
- **THEN** each service response includes the existing service fields
- **AND** each service response includes additive category fields such as category id, slug, and name when available

#### Scenario: Services can be filtered by category

- **WHEN** a client requests services for a category
- **THEN** the API returns active services in that category
- **AND** existing company filters continue to work with or without the category filter

#### Scenario: Shoe-care service contract remains compatible

- **WHEN** an existing client ignores category fields and books a shoe-care service by service id
- **THEN** hold creation, quote creation, appointment confirmation, and payment behavior remain compatible with the current contract

### Requirement: Providers and companies can represent category capability

The system SHALL represent which care categories a company offers and which categories a provider can handle without blocking existing provider workflows by default.

#### Scenario: Company category capability is discoverable

- **WHEN** a customer views companies or providers in discovery
- **THEN** the response can include category metadata for categories offered by each company
- **AND** category filters can return companies that offer at least one active service in the requested category

#### Scenario: Provider category capability is additive

- **WHEN** provider capability metadata is introduced
- **THEN** existing company/provider membership remains valid
- **AND** providers without explicit category metadata do not lose access to current assigned or claimable shoe-care appointments during migration

#### Scenario: Admin views category context for work

- **WHEN** a company admin views appointment queues or provider assignment surfaces
- **THEN** each appointment can show the care category associated with its service
- **AND** assignment behavior remains compatible with existing provider/company permissions

### Requirement: Customer discovery supports category-led care browsing

The mobile app SHALL support category-led discovery while preserving the existing company/provider and service browsing flow.

#### Scenario: Home screen shows care categories

- **WHEN** a customer opens the home screen
- **THEN** the screen presents premium care category entry points
- **AND** the copy describes broad local care rather than shoe-only care

#### Scenario: Category selection filters providers and services

- **WHEN** a customer selects a care category
- **THEN** provider and service cards reflect the selected category where data exists
- **AND** clearing the category returns to the broader provider/service marketplace view

#### Scenario: Service cards are category-neutral

- **WHEN** a service card represents a non-shoe service
- **THEN** the card copy and metadata do not imply sneakers or shoes
- **AND** shoe-specific copy only appears for shoe-category services where appropriate

### Requirement: Booking and payment remain category-neutral

The booking, quote, checkout, payment result, and appointment-payment recovery flows SHALL work for non-shoe care services without changing the existing payment API contract.

#### Scenario: Customer books a non-shoe care service

- **WHEN** a customer selects a non-shoe care service and completes booking
- **THEN** the system creates a hold and appointment for that service
- **AND** the appointment uses the same payment mode, checkout, refresh, and unpaid cancel behavior as shoe-care appointments

#### Scenario: Payment summary uses service and category context

- **WHEN** a customer reviews payment for a care service
- **THEN** the payment summary uses the selected service name and category context
- **AND** line items do not use shoe-only wording for non-shoe categories

#### Scenario: Payment result is not shoe-specific

- **WHEN** a customer returns from checkout for any care category
- **THEN** the payment result screen communicates booking/payment status without shoe-only copy

### Requirement: Appointment lifecycle language is category-neutral

The system SHALL preserve existing appointment statuses while presenting category-neutral customer, provider, and admin language for non-shoe categories.

#### Scenario: Customer appointment list shows category context

- **WHEN** a customer views appointments across multiple care categories
- **THEN** each appointment card shows the service name, category context when available, date/time, status, and payment state
- **AND** non-shoe appointments remain visible throughout the existing active lifecycle

#### Scenario: Appointment timeline uses neutral labels

- **WHEN** an appointment timeline is shown for a non-shoe service
- **THEN** status labels and next-step copy use neutral terms such as items, in care, ready for return, pickup, delivery, and completion
- **AND** shoe-only language appears only when the selected category is shoes and the copy is intentionally category-specific

#### Scenario: Ready photo becomes completion photo

- **WHEN** a provider uploads or a customer views the existing ready photo for any category
- **THEN** the user-facing label describes it as a completion or finished-care photo
- **AND** backend storage and existing `ready_photo_url` contract remain compatible

### Requirement: Notifications and live events remain category compatible

The notification and live event system SHALL continue to deliver appointment updates for all care categories using the existing event infrastructure.

#### Scenario: Status update notification for non-shoe service

- **WHEN** a provider updates status for a non-shoe appointment
- **THEN** the customer receives the existing notification/live event behavior
- **AND** notification copy does not imply shoes unless the category is shoes

#### Scenario: Live event payload remains backward compatible

- **WHEN** a live appointment event is published after category support is added
- **THEN** existing required event fields remain present
- **AND** additive category fields may be included without breaking existing clients

### Requirement: Demo seed data represents a multi-category care marketplace

The demo seed system SHALL include credible multi-category care providers and services while preserving the existing shoe-care demo path.

#### Scenario: Mt. Juliet seed includes required care categories

- **WHEN** the Mt. Juliet demo seed is run
- **THEN** demo data includes active services for at least shoes, laundry, dry cleaning, handbags/leather, and rugs/textiles
- **AND** demo companies and service names clearly communicate category coverage

#### Scenario: Shelby County seed includes required care categories

- **WHEN** the Shelby County demo seed is run
- **THEN** demo data includes active services for at least shoes, laundry, dry cleaning, handbags/leather, and rugs/textiles
- **AND** demo companies and service names clearly communicate category coverage for the Shelby County market

#### Scenario: Demo accounts remain usable

- **WHEN** a customer, provider, or company admin signs in with existing demo accounts
- **THEN** the user can complete the same core demo flows
- **AND** at least one seeded shoe-care booking still works end to end

### Requirement: Backward compatibility is preserved during category rollout

The category rollout SHALL be additive and compatible with existing shoe-care data, API clients, tests, and demos.

#### Scenario: Existing API requests continue to work

- **WHEN** an existing client calls service, company, hold, quote, confirm, appointment, payment, assignment, status, notification, or live-event endpoints without category parameters
- **THEN** the endpoint behavior remains compatible with the current contract

#### Scenario: Existing shoe-care tests remain valid

- **WHEN** backend and mobile tests for existing shoe-care booking, payment, appointment visibility, provider assignment, status updates, notifications, and live events run
- **THEN** those tests continue to pass or are updated only for additive category fields and category-neutral copy
