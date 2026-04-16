# Tasks

## 1. Active owner demo flow

- [x] Update the active `RootTabs` flow so `company_admin` users land in an owner-oriented jobs experience rather than the same provider-centric queue used by staff.
- [x] Build an owner command center screen in the active mobile path that segments work into at least unassigned, active/in-progress, and ready-for-delivery states.
- [x] Ensure each owner job card shows scheduled time, service, customer context, current status, and assigned-provider state in business-readable language.

## 2. Owner controls and team visibility

- [x] Reuse existing backend reassignment capabilities and expose them through the active owner detail flow.
- [x] Add owner-facing team visibility using existing company-user routes, focused on who can take work and who currently owns live jobs.
- [x] Keep global-admin placeholder screens out of scope and avoid wiring new work into inactive `AdminStack` or `CompanyStack` paths.

## 3. Backend contract alignment

- [x] Review `company_ops.py` and related schemas to ensure owner screens can retrieve all jobs, assignment state, and provider display names without screen-level guesswork.
- [x] Add only minimal additive backend response fields needed for owner segmentation or intervention cues.
- [x] Preserve current customer/provider flows while extending company-admin readability.

## 4. Demo seed and staging package

- [x] Replace or extend `/dev/seed` with a deterministic Helena/Pelham-area demo scenario, including local cleaner branding, staff, and staged appointments across multiple statuses.
- [x] Include at least one walkthrough-ready path for booking, owner oversight, provider action, and customer notification follow-up.
- [x] Document role logins, reset steps, and expected demo sequence in repo docs or demo notes.

## 5. Demo hardening and clarity

- [x] Align booking and payment copy with actual stub behavior so the demo does not overpromise or create confusion.
- [x] Audit active screens for dev-oriented language, weak empty states, or confusing role mismatches that would hurt cleaner-owner trust.
- [x] Keep push notifications, ready-photo capture, and physical-device-only capabilities as optional bonus demo moments, not hard prerequisites.

## 6. Validation

- [x] Run backend tests covering assignment, customer notifications, tracking, and booking confirmation after the change.
- [x] Run mobile typecheck and verify the active owner, provider, and customer flows.
- [ ] Validate the end-to-end owner demo script from seeded state on local infrastructure before considering the change complete.
