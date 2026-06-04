# Mobile Luxury Care UI Experience

## ADDED Requirements

### Requirement: Mobile theme supports the luxury care marketplace palette

The mobile app SHALL provide a cohesive light-mode luxury palette and token set for premium care marketplace screens.

#### Scenario: Theme exposes luxury semantic tokens

- **WHEN** the mobile theme is updated
- **THEN** it provides semantic tokens for warm background, elevated surface, card surface, deep teal primary, muted gold accent, charcoal text, muted gray text, border, divider, status colors, radii, spacing, typography, and shadows
- **AND** existing mobile theme consumers remain compatible

#### Scenario: Palette remains accessible

- **WHEN** screens use the luxury palette
- **THEN** primary text, secondary text, buttons, badges, and important state labels remain readable on warm off-white and card surfaces
- **AND** gold accents are not used as the only carrier of critical text meaning

### Requirement: Shared UI primitives express a luxury marketplace style

The mobile app SHALL use reusable primitives for polished cards, buttons, state surfaces, media placeholders, badges, section headers, and timeline displays.

#### Scenario: Components centralize visual patterns

- **WHEN** priority screens need cards, buttons, badges, loading states, empty states, error states, media placeholders, category chips, or timeline rows
- **THEN** they use shared components where practical
- **AND** screen-local styling does not duplicate major luxury presentation patterns unnecessarily

#### Scenario: Touch targets remain usable

- **WHEN** shared buttons, cards, chips, tab items, and action controls are rendered
- **THEN** primary tappable controls are at least 44px tall where practical
- **AND** disabled controls have a visually distinct disabled state

### Requirement: Customer discovery feels like a premium care marketplace

The active customer home, category discovery, provider menu, and service cards SHALL feel photo-forward, polished, and category-aware.

#### Scenario: Home displays luxury category discovery

- **WHEN** a customer opens the home screen
- **THEN** the screen presents warm marketplace styling, deep teal brand presence, elegant category cards or chips, and the headline "What needs care today?" or equivalent premium care copy
- **AND** existing category filtering behavior remains unchanged

#### Scenario: Provider and service cards support premium media treatment

- **WHEN** provider or service cards render with category metadata
- **THEN** they show a large image or polished category-aware placeholder surface
- **AND** they clearly show provider/service name, category context, location or service details, price where available, and a clear primary action

#### Scenario: Category fallback remains resilient

- **WHEN** care categories fail to load or a selected category has no results
- **THEN** the screen shows an existing functional fallback or a polished empty state
- **AND** the home screen remains usable for unfiltered discovery

### Requirement: Booking and payment screens use polished task-focused presentation

The active service detail, booking date, booking time, confirm, review/pay, and payment result screens SHALL use modern booking hierarchy while preserving behavior.

#### Scenario: Booking flow shows modern progression

- **WHEN** a customer moves through booking steps
- **THEN** the screens show a clear step/progress treatment, polished selection cards, readable service summary, and obvious primary CTA placement
- **AND** navigation and booking API behavior remain unchanged

#### Scenario: Review and payment remain contract-compatible

- **WHEN** a customer reviews and pays for a care appointment
- **THEN** the price/payment summary uses luxury card styling and clear hierarchy
- **AND** Stripe/payment redirect, refresh, cancel, and result behavior remain unchanged

### Requirement: Appointment and notification surfaces communicate premium care progress

The active appointment list, appointment detail, tracking timeline, and notifications SHALL use polished care-neutral language and luxury card/timeline treatment.

#### Scenario: Appointment list cards are polished and scannable

- **WHEN** a customer views appointments
- **THEN** each appointment card communicates provider/company, service, time, category or care context, status, and payment context where available
- **AND** the card remains visible through the existing appointment lifecycle behavior

#### Scenario: Appointment detail timeline feels like order tracking

- **WHEN** a customer opens appointment detail
- **THEN** the detail screen presents a premium summary card, consistent status badge, tracking timeline, pickup/drop-off details, and payment/support surfaces where already supported
- **AND** timeline states do not rely on color alone

#### Scenario: Notifications remain lightweight and useful

- **WHEN** notifications render
- **THEN** unread/read state, timestamp, priority, appointment context, and empty/loading/error states use consistent polished presentation
- **AND** notification counts remain scoped to notification surfaces rather than the Appointments tab

### Requirement: Provider and company admin surfaces remain operational and polished

The provider and company admin screens SHALL use the luxury system in a denser operational form without changing API behavior.

#### Scenario: Provider job flow remains clear

- **WHEN** a provider views the dashboard, opens a job, claims a job, or updates status
- **THEN** cards, status badges, map sections, timeline context, and action controls use polished styling
- **AND** claim, status update, websocket/live update, and map behavior remain unchanged

#### Scenario: Company admin operations remain controllable

- **WHEN** a company admin views dashboard metrics, appointment queues, appointment detail, or provider assignment controls
- **THEN** the UI clearly shows what needs attention, assignment state, status, payment context where available, and next actions
- **AND** assignment and status API behavior remain unchanged

### Requirement: Bottom navigation and profile surfaces feel modern and accessible

The active bottom navigation and profile/rewards-style surfaces SHALL align with the luxury marketplace direction while preserving route behavior.

#### Scenario: Bottom tabs keep route behavior

- **WHEN** the bottom tab navigator is restyled
- **THEN** tab role visibility, labels, icons, appointments tab reset behavior, and profile/notification access remain unchanged
- **AND** the visual treatment uses warm elevated surfaces, clear active state, safe-area-aware spacing, and accessible tab labels

#### Scenario: Profile and rewards surfaces use premium card styling

- **WHEN** profile, account, or rewards/membership-like surfaces render
- **THEN** they use the shared luxury card, button, typography, and state treatment
- **AND** the implementation does not require new backend rewards features

### Requirement: Validation covers visual polish without brittle integration dependencies

The implementation SHALL include automated and manual validation appropriate for a mobile UI polish pass.

#### Scenario: Automated validation passes

- **WHEN** implementation is complete
- **THEN** mobile typecheck passes
- **AND** mobile tests pass
- **AND** OpenSpec strict validation for this change passes

#### Scenario: Manual QA covers active demo flows

- **WHEN** manual QA is performed
- **THEN** customer, provider, company admin, category discovery, booking, payment return/refresh, appointment tracking, notifications, and compact mobile layouts are checked
- **AND** any remaining risks or deferred items are documented before archive
