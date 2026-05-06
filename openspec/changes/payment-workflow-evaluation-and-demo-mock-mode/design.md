# Design

## Context

ShoeInn currently has a split payment architecture:

- `apps/api` owns appointment creation and stores shadow payment fields on `Appointment`.
- `apps/payment` is a separate Stripe-oriented service that can create checkout sessions and reconcile Stripe webhooks into payment records.
- `apps/api/app/workers/payment_sync.py` polls that separate service and updates appointment payment state when `PAYMENT_SERVICE_BASE_URL` is configured.
- When `PAYMENT_SERVICE_BASE_URL` is unset, `apps/api/app/services/payment_gateway.py` silently returns a local stub checkout record with `status="succeeded"` and an empty checkout URL.

That means the current intended architecture is "API-owned booking workflow with optional external payment orchestration", but the runtime contract is ambiguous:

- the API health endpoint reports `stub` or `service` by inference rather than explicit configuration,
- the booking confirm route auto-confirms appointments in the stub path,
- the mobile app still contains payment-polling and checkout-opening behavior that assumes a potential external handoff,
- docs describe the payment service as optional and underdocumented,
- and staging already declares payment should remain simulated for now.

Repo-grounded evaluation:

- What works today:
  - customer booking can complete end-to-end without `apps/payment`,
  - payment shadow fields are persisted on appointments,
  - the separate payment service has tested Stripe checkout/payment-intent/webhook behavior in isolation,
  - the API sync worker can reconcile external payment status if that service is actually configured.
- What is incomplete or fragile:
  - payment mode is implicit instead of explicit,
  - "stub" means immediate success with no customer-facing explanation,
  - mobile screens do not clearly explain when payment is simulated,
  - there is no single contract exposing payment mode and demo messaging to clients,
  - real service mode still depends on additional Stripe/webhook setup and is not demo-ready by default.
- What would confuse a cleaner-owner demo today:
  - no visible explanation that no real charge happened,
  - empty checkout URLs in stub mode look like a half-integrated checkout path,
  - the presence of `apps/payment` can imply real payment readiness beyond what the repo currently supports.

## Goals / Non-Goals

**Goals:**

- Make demo/staging payment behavior explicit and deterministic.
- Preserve the existing end-to-end booking flow for demos without requiring `apps/payment`.
- Expose enough API metadata for mobile to explain simulated payment behavior clearly.
- Keep the implementation narrow so later real payment-service integration still fits cleanly.
- Document the current architecture, current gaps, and the recommended demo strategy in OpenSpec artifacts and repo docs.

**Non-Goals:**

- Building a production-grade Stripe integration in `apps/api`.
- Replacing or deeply redesigning the separate `apps/payment` service.
- Introducing full webhook ingestion into the main API.
- Expanding payment support to refunds, disputes, settlement reporting, or invoicing in this change.

## Decisions

### 1. Introduce explicit API payment modes with `mock` as the demo-safe strategy

Decision:

- Add a first-class `PAYMENT_MODE` setting in `apps/api`.
- Support `mock` as the explicit demo/staging mode.
- Support `service` as the external payment-service mode.
- Accept `stub` as a compatibility alias that maps to `mock`.

Rationale:

- The current behavior already depends on a stub path, but it is triggered indirectly by a missing base URL.
- Cleaner-owner demos need deterministic behavior that operators can explain in one sentence.
- `mock` communicates intent better than `stub`, while keeping backward compatibility for existing staging notes.

Alternatives considered:

- Keep inferring mode from `PAYMENT_SERVICE_BASE_URL`.
  - Rejected because it preserves the ambiguity that caused the demo-readiness problem.
- Default to real service mode whenever a service URL exists.
  - Rejected because demos and staging should be able to pin mock behavior even if infrastructure exists.

### 2. Keep appointment payment state coherent by finalizing immediately in `mock` mode

Decision:

- In `mock` mode, appointment confirmation will create a synthetic payment record, set `payment_status=succeeded`, null out checkout URL, set received amount equal to expected amount, and advance the appointment to `confirmed`.

Rationale:

- The goal is not to simulate pending checkout UI; the goal is to keep the booking story moving without dead ends.
- Pending states without real checkout or webhook completion would create confusion and incomplete appointments during demos.
- This mirrors the repo's current successful stub shortcut while making it deliberate and explainable.

Alternatives considered:

- Simulate a pending checkout and require manual completion.
  - Rejected because it adds demo friction and produces ambiguous states.
- Return a fake checkout URL and still open it on mobile.
  - Rejected because it is misleading and unnecessary for local demos.

### 3. Expose payment-mode metadata directly on appointment responses

Decision:

- Add additive appointment response fields for payment mode and a customer-facing payment summary/message.

Rationale:

- The mobile app currently only sees status and optional checkout URL, which is not enough to explain demo behavior.
- The API already serializes appointment payment fields, so additive metadata is the smallest coherent contract change.

Alternatives considered:

- Add a separate payment-status endpoint for UI messaging.
  - Rejected because it increases complexity for a narrow demo-hardening change.
- Hardcode demo copy only in the mobile app.
  - Rejected because the API should remain the source of truth for payment mode.

### 4. In `service` mode, preserve the external payment-service contract and fail clearly if misconfigured

Decision:

- `service` mode will require `PAYMENT_SERVICE_BASE_URL` to be present.
- Checkout URL and polling behavior remain valid only in `service` mode.

Rationale:

- This preserves future real integration without broad rewrites.
- It also prevents the current accidental situation where "missing URL" silently changes product behavior.

Alternatives considered:

- Auto-fallback from `service` to `mock` on error.
  - Rejected because silent fallback would hide configuration mistakes and reintroduce ambiguity.

### 5. Treat `apps/payment` as optional for demo mode and document it that way

Decision:

- Demo/local/staging guidance will explicitly say `PAYMENT_MODE=mock` is the recommended current default.
- `apps/payment` remains available for later service-mode validation, but is not a demo prerequisite.

Rationale:

- This matches the actual state of the repo and the earlier staging decision that payment stays simulated for now.
- It reduces the chance that demo operators try to stand up Stripe/webhooks unnecessarily.

## Risks / Trade-offs

- [Risk] Existing environments may rely on the old inferred stub behavior. → Mitigation: accept `stub` as an alias, keep docs explicit, and retain service-mode integration unchanged.
- [Risk] Marking payment as succeeded in mock mode could be mistaken for real payment. → Mitigation: add explicit `payment_mode` and `payment_message` fields and show clear demo-mode labels in mobile UI.
- [Risk] Mobile may still attempt external checkout flows. → Mitigation: gate checkout opening and polling on service mode plus a real checkout URL.
- [Risk] Real payment-service mode is still under-specified beyond the narrow demo change. → Mitigation: capture a prioritized backlog in the final assessment and leave the service path structurally intact.

## Migration Plan

1. Add `PAYMENT_MODE` configuration and normalize legacy `stub` usage to `mock`.
2. Update the API payment gateway and appointment confirmation flow to branch on explicit mode.
3. Extend appointment schemas with additive payment metadata for UI clarity.
4. Update mobile booking/confirmation screens to explain mock mode and avoid dead-end checkout flows.
5. Update env examples and payment/staging docs to declare `mock` as the recommended demo strategy.
6. Add focused backend coverage for mock-mode confirmation behavior and run existing booking tests plus mobile typecheck.

Rollback:

- Revert the config and schema additions and return to URL-inferred stub behavior.
- Because the change is additive and keeps existing shadow payment fields, data rollback is not required.

## Open Questions

- None for this implementation pass. The decisive recommendation is to use explicit `mock` mode for demos until a fuller service/webhook rollout is intentionally prioritized.
