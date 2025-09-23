# CQRS and Availability Projection

The booking flow now follows a simple Command/Query Responsibility Segregation pattern:

* **Command side** – `/appointments` receives booking requests. The handler places (or reuses) an `appointment_holds` row scoped to `company_id`, `service_id`, and `start_time_utc`. It keeps the write inside a single transaction, verifies that an appointment for the same slot does not already exist, and promotes the hold into a confirmed appointment. A unique index on `appointments(company_id, start_time_utc)` protects against double-booking at the database level.
* **Read side** – confirmed appointments are projected into the `available_slots` read store. Each write sets `is_available` to `false` and stamps `last_booked_at`. Mobile clients can query `/slots` to retrieve available times quickly without replaying command-side logic.
* **Consistency** – any transient hold failures or uniqueness violations bubble up as `409` responses. Tests simulate dueling customers to ensure optimistic concurrency works and that expired holds are cleared before a follow-up booking succeeds.

Expired holds are deleted by a background thread started in `app/main.py`. The job polls `appointment_holds` on a configurable cadence (`HOLD_CLEANUP_INTERVAL_SECONDS`) so inventory is released automatically if a client abandons checkout. For deterministic validation you can call `app.utils.holds.clear_expired_holds()` directly in scripts or tests.

When introducing new consumers, project their booking events into `available_slots` rather than hitting transactional tables directly. This keeps read latency low while letting the command side evolve independently.
