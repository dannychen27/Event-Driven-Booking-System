# Real-Time Availability — Design Notes

**Status:** Assessment complete; reliability hardening is the next milestone  
**Last reviewed:** November 3, 2026

## 1. Current state

The project is a NestJS modular monolith backed by PostgreSQL. Booking creation and cancellation use database transactions through a shared `pg.Pool` service.

What already works:

- **Capacity protection:** Booking creation locks the event row with `SELECT ... FOR UPDATE`, then checks the booking count before inserting.
- **Duplicate protection:** The service checks for duplicates, and the database enforces `UNIQUE (user_id, event_id)`.
- **Relational integrity:** Primary keys, foreign keys, and checks enforce valid references, positive event capacity, and valid event time ranges.
- **Availability:** `GET /events/:id/availability` calculates `capacity - confirmed bookings` directly from PostgreSQL. There is no separate counter to synchronize.
- **Concurrency coverage:** A real-PostgreSQL integration test verifies that only one of two simultaneous requests can book an event with capacity one.
- **AI discovery:** Gemini-powered natural-language event search is already implemented as an initial feature.

The SQL schema is currently authoritative. The Prisma schema has no models.

## 2. Known issues

These are risks identified during code review; they have not yet been reproduced as failures.

- **Concurrent schedule conflicts:** Two simultaneous bookings by the same user for different, overlapping events may both pass the schedule check because they lock different event rows.
- **Concurrent cancellation:** Two requests can read the same booking before either deletes it. The second delete may affect zero rows, but the service does not currently handle that result explicitly.
- **Test database safety:** The database service defaults to `booking_system` when `DB_NAME` is missing. Directly running tests without explicit configuration could target the development database. The E2E setup script also drops and recreates its test database.
- **Database setup consistency:** `setup.sh` and `setup.sql` do different things. The former omits indexes; neither inspected setup path applies the migration directory.

## 3. Next milestone: reliability hardening

Before adding new availability features:

1. Add a real-database test for simultaneous overlapping bookings by one user.
2. Add a real-database test for simultaneous cancellation of the same booking.
3. Define and implement deliberate behavior when a cancellation finds that the booking has already been deleted.
4. Consider consolidating the availability existence check and aggregate into one query.
5. Require explicit test database configuration and reject unexpected database names in destructive test setup.
6. Establish one documented database setup and migration workflow.

**Done means:** The concurrency behavior is covered by PostgreSQL integration tests, destructive test setup is guarded, and the database workflow is clear. No broad rewrite is needed.

## 4. Future direction

- **Temporary holds:** Extend capacity accounting to include active, unexpired holds. Define expiration, confirmation, cancellation, and retry behavior before implementation.
- **Event-driven workflows:** Consider a transactional outbox when a concrete consumer—such as notifications or analytics—needs reliable post-commit events.
- **AI discovery:** Continue independently with semantic retrieval, search-quality evaluation, ranking, and eventually personalization.

These are staged directions, not work to start simultaneously.

## 5. Design principles

- Keep PostgreSQL as the source of truth for bookings, holds, and capacity.
- Test concurrency against real PostgreSQL; mocks cannot prove locking behavior.
- Preserve correctness before optimizing performance.
- Measure query performance before adding indexes, caches, or denormalized counters.
- Add infrastructure only when a demonstrated requirement justifies it.
- Keep AI discovery loosely coupled to transactional booking operations.

**Bottom line:** The project already has a solid transactional booking foundation.
Harden its edge cases first, then build temporary holds on top of the existing 
PostgreSQL design.

No Redis, Kafka, or microservice extraction is justified for the immediate milestone.
