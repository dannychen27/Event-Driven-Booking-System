# Event-Driven Booking System

[![Coverage Reports](https://github.com/dannychen27/Event-Driven-Booking-System/actions/workflows/coverage-pages.yml/badge.svg)](https://github.com/dannychen27/Event-Driven-Booking-System/actions/workflows/coverage-pages.yml)

## Overview

A full-stack event booking system built with React, NestJS, and PostgreSQL.
The project explores the design of a booking platform, from database constraints
and transaction safety to frontend/backend integration and automated testing.

This project was inspired by an admin system I debugged during my
summer 2022 full-stack development internship at Sky View Suites.

### Current Features
- Browse events and venues.
- Book events and view booking history.
- Cancel bookings with booking-ownership checks.
- Enforce booking constraints, including duplicate-booking prevention, schedule-conflict checks, and event-capacity limits.
- Protect against concurrent overbooking using database transactions and row-level locking.
- Search events using natural-language queries powered by Gemini.

The current implementation uses a layered application architecture.
Future phases may introduce Kafka-based event processing, notification and
C++ analytics consumers, Docker, and Kubernetes to evolve the system toward
a distributed architecture.

## Technology Stack

### Current

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL |
| Database Tooling | Prisma, node-postgres |
| Testing | Vitest, Jest, Supertest, Testing Library |


### Planned

| Layer | Technologies |
| --- | --- |
| Event streaming | Apache Kafka |
| Systems language | C++ |
| Containerization | Docker |
| Orchestration | Kubernetes |


## Quick Start

### Prerequisites

Before running the project, I require the following software:
- **Node.js 20.19.0 or later**: required by Prisma 7 and Vite 8.
- **npm**: used to install dependencies and run the project scripts.
- **PostgreSQL**: used as the application's relational database.
- **Git**: used to clone the repository and manage the project source code.

I recommend using an active LTS version of Node.js, such as Node.js 22.x.
Prisma currently recommends Node.js 22.x for Prisma 7.

### 1. Install dependencies

Start from a fresh `git checkout`:
```bash
git clone <repository-url>
cd <project-directory>
```

From the project root, install frontend and backend dependencies:

```bash
npm install
npm install --prefix "4. backend"
npm install --prefix "3. frontend"
```

After installation, configure the environment variables and
database before running the application.

### 2. Configure the environment variables

Copy the example environment file:
```bash
cp .env.example .env
```

Update `.env` with your local PostgreSQL connection settings.
Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
as appropriate for your setup.

To use AI-powered natural-language search, configure `GEMINI_API_KEY`.


Then update `.env` with the PostgreSQL credentials for your local database:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=booking_system
DB_USER=<your-postgresql-username>
DB_PASSWORD=<your-postgresql-password>
```

The environment variables control the following database connection settings:
| Variable | Description | Default |
| --- | --- | --- |
| `DB_HOST` | PostgreSQL server host | `localhost` |
| `DB_PORT` | PostgreSQL server port | `5432` |
| `DB_NAME` | Application database name | `booking_system` |
| `DB_USER` | PostgreSQL username | — |
| `DB_PASSWORD` | PostgreSQL password | — |

### 3. Initialize the database

Ensure PostgreSQL is running, then follow the [Database Setup](#database-setup) instructions below.

For a quick local setup, the `setup.sh` script recreates `booking_system` and loads the schema and seed data.
**It deletes existing data in that database**, so use it only when you intend to reset it.

### 4. Start the application

I run the frontend and backend separately during development.

In one terminal, start the backend:

```bash
npm run start:dev --prefix "4. backend"
```

In another terminal, start the frontend:

```bash
npm run dev --prefix "3. frontend"
```

Open the frontend URL printed by Vite in your terminal (typically `http://localhost:5173`).
The backend runs on `http://localhost:3000` by default.


## Features

- [x] **Event and venue browsing**: browse available events and their associated venues
- [x] **Event availability**: view the remaining capacity for an event
- [x] **Natural-language event search**: search for events using natural-language queries, with supported filters for keywords and date ranges; requires a configured `GEMINI_API_KEY`.
- [x] **Booking management**: create and cancel event bookings
- [x] **Booking history**: view a user's previous and current bookings
- [x] **Booking validation**: prevent duplicate bookings, schedule conflicts, and bookings that exceed event capacity

- [x] **Client-side form validation**: validate booking input before submitting requests
- [ ] **Responsive user interface**: support common desktop and mobile layouts

- [x] **REST API integration**: connect the frontend to the backend through REST endpoints

- [x] **Booking ownership validation**: check that a booking belongs to the specified user before allowing cancellation
- [x] **Transactional booking protection**: use database transactions and row-level locking to protect against double-booking

- [x] **Automated testing**: test the frontend, backend, integration workflows, and end-to-end application flows

**AI integration note:** Natural-language search uses Gemini to interpret queries and rank candidate events.
It requires a valid `GEMINI_API_KEY` and depends on the availability of the external Gemini service.
Live integration has not yet been reliably verified end to end; AI search may return `503 Service Unavailable`
when the service is unavailable.


## Architecture

The application currently uses a layered full-stack architecture:
a React frontend communicates with a NestJS backend through a REST API,
and the backend retrieves and persists data in PostgreSQL.

Kafka-based event-driven processing is planned for a future phase
and is not part of the current request flow.

### Frontend

The frontend uses React, TypeScript, and Vite to provide the user interface
for browsing events and venues, creating bookings, checking event availability,
and viewing booking history.
It also communicates with the backend through REST API requests.


### Backend

The NestJS backend is organized into feature-based modules:

- **Events**: Event retrieval, availability, and natural-language search
- **Venues**: Venue retrieval
- **Bookings**: Booking creation, cancellation, and booking history
- **Database**: PostgreSQL database connection and access

The backend exposes the REST API, validates requests, applies business rules,
and coordinates database operations.


### Database

PostgreSQL stores users, venues, events, and bookings.
Primary keys, foreign keys, constraints, and indexes support data integrity.
Booking operations use database transactions and row-level locking to help
prevent conflicting operations and concurrent overbooking.

### Request Flow

A typical request follows this path:

```text
React Frontend
      │
      ▼
REST API Request
      │
      ▼
NestJS Controller
      │
      ▼
NestJS Service
      │
      ▼
PostgreSQL
      │
      ▼
Response to Frontend
```

- The controller receives the request and delegates processing to the appropriate service.
- The service applies business rules and coordinates database operations, such as reading from and writing to the database.
- The controller then returns the backend response to the frontend.


### Why Event-Driven Architecture?

The planned event-driven architecture aims to decouple booking operations from
downstream services.

For example, after a booking is created, the booking service could publish a
`booking.created` event to Kafka.
Independent notification and analytics services could process that event
without requiring the booking service to call each consumer service directly.

This would make it easier to add downstream functionality while keeping the
core booking workflow less tightly coupled.


## Project Structure

```text
Event-Driven Booking System/
├── 0. documentation/               # Architecture and technology documentation
├── 0. tests/
│   ├── backend/                    # Backend unit and API tests
│   ├── frontend/                   # Frontend component and page tests
│   ├── integration/                # Backend integration tests
│   ├── end-to-end/                 # End-to-end application tests
│   ├── mocks/                      # Shared test mocks
│   └── utils/                      # Shared test utilities
├── 1. api endpoints/               # API specifications and design documentation
├── 2. data model/                  # Database schema, setup, seeds, and design
├── 3. frontend/
│   └── src/
│       ├── api/                    # Backend API clients
│       ├── components/             # Reusable React components
│       ├── pages/                  # Application pages
│       ├── styles/                 # Component and page styling
│       ├── types/                  # TypeScript domain types
│       └── utils/                  # Shared frontend utilities
├── 4. backend/
│   └── src/
│       ├── bookings/               # Booking module and business logic
│       ├── database/               # PostgreSQL database connection
│       ├── events/                 # Event module and business logic
│       └── venues/                 # Venue module and business logic
├── for the resume/                 # Resume-related project materials
├── instructions/                   # Project instructions
├── prisma/                         # Prisma-related project files
├── scheduling/                     # Scheduling-related project materials
├── scripts/                        # Verification and development scripts
│   └── verify-logs.sh              # Validates test, lint, build, and coverage logs
├── test-logs/                      # Test and verification logs
├── .env.example                    # Example environment configuration
├── package.json                    # Root project scripts and dependencies
├── package-lock.json               # Root npm dependency lockfile
├── prisma.config.ts                # Prisma configuration
├── skills-lock.json                # Skills dependency lockfile
├── tsconfig.json                   # Root TypeScript configuration
├── tsconfig.test.json              # TypeScript configuration for tests
└── README.md                       # Project documentation
```

I organize the project into separate **frontend**, **backend**, and **test** layers.

I built the frontend with React and TypeScript, while the backend uses NestJS and PostgreSQL.

I organize automated tests by scope, including unit, integration, and end-to-end tests.

I keep additional development documentation in the numbered documentation directories, covering API design, data modeling, architecture, technology choices, and project planning.

## API Endpoints

The application exposes its functionality through a REST API implemented with NestJS.

### User Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/users/:id/bookings` | Retrieve a user's booking history |

### Event Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/events` | Retrieve all events |
| `GET` | `/events/:id` | Retrieve a specific event |
| `GET` | `/events/:id/availability` | Retrieve event availability |
| `POST` | `/events/:id/book` | Create a booking for an event |
| `POST` | `/events/natural-language-search` | Search for events using a natural-language query (requires a configured Gemini API key) |

**How AI search works:** Describe what kind of event you're looking for in natural language.
Gemini interprets your request, identifies event preferences and date constraints, and ranks candidate events by relevance.
Events outside the requested date range are filtered out before ranking, and irrelevant events may be excluded.

This feature requires a valid `GEMINI_API_KEY` and an available Gemini service.
Temporary service failures may result in a `503 Service Unavailable` response.

Natural-language search accepts a JSON body containing a non-empty `query` string of up to 500 characters.

Example request body:

```json
{
  "query": "Find networking events before November 1"
}
```

The endpoint returns a `400 Bad Request` if:
- `query` is missing,
- `query` is empty,
- `query` is not a string, or
- `query` is longer than 500 characters.

### Venue Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/venues` | Retrieve all venues |
| `GET` | `/venues/:id` | Retrieve a specific venue |

### Booking Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `DELETE` | `/bookings/:id` | Cancel a booking |


## Database Setup

- `setup.sh` — drops and recreates `booking_system`, then loads the schema and seed data. It does not create indexes or run constraint tests.
- `setup.sql` — loads the schema, indexes, seed data, and constraint tests into an existing database.
- `schema.sql` — defines the database schema.
- `seed data/seed.sql` — provides seed data for development and testing.
- `reset.sql` — drops the application tables, then reruns `setup.sql` to restore the schema, indexes, seed data, and constraint tests. It does not drop or recreate the database itself.

### Option 1: Using `setup.sh`

Run the shell script from the `2. data model` directory:

```bash
cd "2. data model"
./setup.sh
```

**Warning:** This script drops and recreates `booking_system`, deleting its existing data.
Use it only when you intend to reset that database.


### Option 2: Manually through `psql`

Run the following commands from the project root to switch to the database directory before starting `psql`:
```bash
cd "2. data model"
```

Start PostgreSQL:
```bash
psql
```

Create the application database and connect to it.
If `booking_system` already exists, skip the `CREATE DATABASE` command and
connect to the existing database instead:
```sql
CREATE DATABASE booking_system;
\c booking_system
```

**Warning:** These commands are intended for a fresh development or test database.
If `booking_system` already contains data, use a separate test database rather
than rerunning the setup scripts against it.

Load the schema, indexes, seed data, and constraint tests:
```text
\i setup.sql
```

Note: The constraint-test scripts perform database operations to
verify constraint enforcement.
Run them only in a development or test database, not against
production data.

### Connecting to the Database Later

```bash
psql booking_system
```

### Viewing Tables

List the tables in the database with:
```text
\dt
```

After initialization, configure the database connection variables in `.env` so the backend can connect to PostgreSQL.


## Testing

I organize automated tests into four categories:

- **Backend tests**: unit and API tests for backend services and endpoints
- **Frontend tests**: component and page tests using Vitest
- **Integration tests**: tests backend services against a test PostgreSQL database
- **End-to-end tests**: tests complete application workflows against a test PostgreSQL database

### Run All Tests

Run the complete test suite from the project root:

```bash
npm test
```

### Run Specific Test Suites

| Test suite | Command |
| --- | --- |
| Backend | `npm run test:backend` |
| Frontend | `npm run test:frontend` |
| Integration | `npm run test:integration` |
| End-to-end | `npm run test:e2e` |

The integration and end-to-end test commands automatically set
up the `booking_system_test` database before running their
respective test suites.


### Test Coverage

Run all backend and frontend coverage reports from the project root:

```
npm run coverage
```

This runs the backend Jest coverage suite followed by the frontend
Vitest coverage suite.

View the latest published reports:
- [Backend coverage](https://dannychen27.github.io/Event-Driven-Booking-System/backend/)
- [Frontend coverage](https://dannychen27.github.io/Event-Driven-Booking-System/frontend/)
- [GitHub Actions runs](https://github.com/dannychen27/Event-Driven-Booking-System/actions/workflows/coverage-pages.yml)

#### Backend

| Metric | Coverage |
|---|---:|
| Statements | 93.73% |
| Branches | 92.38% |
| Functions | 89.55% |
| Lines | 92.95% |

- **Test suites:** 18/18 passed
- **Tests:** 112/112 passed

#### Frontend

| Metric | Coverage |
|---|---:|
| Statements | 96.69% |
| Branches | 85.82% |
| Functions | 93.75% |
| Lines | 96.66% |

- **Test files:** 12/12 passed
- **Tests:** 76/76 passed

#### Integration

- **Test suites:** 1/1 passed
- **Tests:** 3/3 passed

#### End-to-End (E2E)

- **Test suites:** 3/3 passed
- **Tests:** 14/14 passed


Coverage is reported by Jest for the backend and Vitest with the V8 coverage
provider for the frontend. Aggregate figures include test-support files and
other files included by each coverage configuration.


## Linting

I use ESLint to check the frontend and backend code.

Run linting for the entire project from the project root:

```bash
npm run lint
```

### Run Specific Linters

| Target | Command |
| --- | --- |
| Backend | `npm run lint:backend` |
| Frontend | `npm run lint:frontend` |


## Building

I use the root build script to build both the backend and frontend:

```bash
npm run build
```

### Build Specific Projects

| Target | Command |
| --- | --- |
| Backend | `npm run build:backend` |
| Frontend | `npm run build:frontend` |


## Project Roadmap

I plan to develop the project in three major phases, with each phase building on the previous one.

### Phase 1 — Make the Booking System Work

**Goal:** Build the core booking system with React, a REST API, and PostgreSQL.

- [x] Establish users
- [x] Establish events and venues
- [x] Implement event availability
- [x] Implement booking creation and cancellation
- [x] Implement booking history
- [x] Add transactional protection against double-booking
- [x] Build the basic frontend

### Phase 1 Follow-up — AI-Powered Natural-Language Event Search

The core search feature is implemented, but improvements to date interpretation,
provider error handling, and rate limiting remain.

- [ ] **Improve relative-date interpretation**
  - [ ] Provide the current date and an explicit timezone to the AI interpreter.
  - [ ] Ensure queries such as "this weekend" produce appropriate `startAfter` and `startBefore` filters.
  - [ ] Add tests for relative-date interpretation and timezone boundaries.
  - [x] Test date-filter validation, including invalid dates and reversed date ranges.

- [ ] **Harden AI provider error handling**
  - [x] Detect a missing API key and throw a clear error.
  - [x] Map a provider `503` failure to a `ServiceUnavailableException`.
  - [x] Return a generic client-facing message for the handled `503` failure.
  - [ ] Return an appropriate, actionable client-facing error for missing API-key configuration.
  - [ ] Normalize other upstream provider failures into appropriate HTTP responses.
  - [ ] Retain useful server-side diagnostics without exposing internal provider details to clients.
  - [x] Test missing API-key handling.
  - [x] Test the handled 503 provider-failure scenario.
  - [ ] Add tests for other provider failures and client-facing error messages.

- [ ] **Add rate limiting to the AI search endpoint**
  - [ ] Protect `POST /events/natural-language-search` against excessive requests.
  - [ ] Return an appropriate HTTP response when the rate limit is exceeded.
  - [ ] Add tests for rate-limit behavior.

- [ ] **Verify live Gemini integration**
  - [ ] Confirm the configured Gemini model responds successfully using the free-tier configuration.
  - [ ] Test a representative natural-language query end to end.
  - [ ] Verify that provider failures produce the expected client-facing error response.


### Phase 2 — Make It Distributed

**Goal:** Introduce Kafka and event-driven communication.

```text
        Booking Service
             │
             │ booking.created
             │ booking.cancelled
             │
             ▼
           Kafka
       ↙         ↘
Notifications   C++ Analytics
   Consumer        Consumer
```

### Planned Work

- [ ] Publish `booking.created` events
- [ ] Publish `booking.cancelled` events
- [ ] Implement Kafka producers and consumers
- [ ] Build the notification consumer
- [ ] Build the C++ analytics consumer
- [ ] Implement retries
- [ ] Implement idempotent event processing
- [ ] Handle consumer failures
- [ ] Implement authentication and broader authorization

### Phase 3 — Make It Look Professional

**Goal:** Containerize and deploy the distributed system while improving reliability and observability.

```text
                    Kubernetes
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
       API        Notification      C++ Analytics
        │             Consumer          Consumer
        │                ▲                ▲
        │                │                │
        │             ┌──┴────────────────┴──┐
        │             │        Kafka          │
        │             └──────────▲────────────┘
        │                        │
        ▼                        │
    PostgreSQL                   │
        ▲                        │
        └──────── Booking Service┘
```

### Planned Work

- [ ] Add responsive user interface
- [ ] Add Docker Compose
- [ ] Add Kubernetes manifests
- [ ] Add health checks
- [ ] Add structured logging
- [ ] Expand API and integration tests
- [ ] Add CI/CD
- [ ] Add load and failure tests
- [ ] Add an architecture diagram
- [ ] Expand project documentation


I intend to stop once these phases are complete rather than continuously
adding infrastructure and services beyond the project's core goals.


## Known Limitations

- Live Gemini integration is not yet verified end to end.
During development, requests returned 503 UNAVAILABLE from the provider.
Successful live operation remains unverified.

### Development Dependency Audit

- `npm audit --prefix "4. backend" --omit=dev` reports zero vulnerabilities in production dependencies.
- The full backend dependency audit reports 20 moderate findings associated with a known `sprintf-js` vulnerability in the Jest testing and coverage dependency chain.
- The remaining findings are in development dependencies. The suggested automatic remediation involves a potentially breaking `ts-jest` downgrade, so it has not been applied.
- Backend and frontend tests, end-to-end tests, integration tests, linting, and production builds pass with the current dependency versions.

- Authentication is not implemented.
The booking service checks that the supplied user ID owns a booking before cancellation, but requests do not establish that the caller is actually that user.
- Kafka-based event processing is planned for Phase 2.
- The current deployment workflow is intended for local development.
