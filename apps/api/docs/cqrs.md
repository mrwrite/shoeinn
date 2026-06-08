# CQRS and Availability Projection

The booking flow uses a simple Command/Query Responsibility Segregation pattern.

- **Command side** - `/appointments` receives booking requests. The handler places or reuses an `appointment_holds` row scoped to `company_id`, `service_id`, and `start_time_utc`. It keeps the write inside one transaction, verifies that an appointment for the same slot does not already exist, and promotes the hold into an appointment. A unique index on `appointments(company_id, start_time_utc)` protects against double-booking at the database level.
- **Read side** - confirmed appointments are projected into the `available_slots` read store. Each write sets `is_available=false` and stamps `last_booked_at`. Mobile clients query `/slots` for available times without replaying command-side logic.
- **Consistency** - transient hold failures or uniqueness violations bubble up as `409` responses. Tests simulate dueling customers to verify optimistic concurrency and expired-hold behavior.

Expired holds are cleared by explicit utility paths and tests, not by an automatically started worker in `app/main.py`. For deterministic validation or future worker wiring, call `app.utils.holds.clear_expired_holds()` directly. `HOLD_CLEANUP_INTERVAL_SECONDS` is reserved configuration for a future scheduled cleanup loop.

When introducing new read-side consumers, project booking events into `available_slots` rather than hitting transactional tables directly. This keeps read latency low while allowing the command side to evolve independently.
