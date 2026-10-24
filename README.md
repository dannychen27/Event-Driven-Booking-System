# Event-Driven Booking System

## Overview

A full-stack event booking system for managing users, venues, events, and 
bookings, built with React, NestJS, and PostgreSQL.

I built this project to explore the design and implementation of a booking 
system from the ground up. I was inspired by the admin system I debugged 
during my Sky View Suites full-stack development internship in summer 2022.

The current implementation uses a layered architecture with React, NestJS, 
and PostgreSQL. In future phases, I plan to introduce Kafka, a notification 
consumer, a C++ analytics consumer, Docker, and Kubernetes to evolve the 
system into a distributed, event-driven architecture.

The system allows users to:
- browse events and venues
- book an event
- view booking history
- cancel their bookings

The backend enforces booking constraints such as:
- duplicate bookings
- schedule conflicts
- event capacity 
- cancellation authorization
- protection against double-booking through database transactions and row-level locking

The project is being developed incrementally, with automated frontend, backend, integration, and end-to-end tests.


## Quick Start

### Prerequisites

- Node.js 20.19.0 or later
- npm
- PostgreSQL

### 1. Install dependencies

From the project root:

```bash
npm install
npm install --prefix "4. backend"
npm install --prefix "3. frontend"
```

### 2. Configure the environment

```bash
cp .env.example .env
```

Update `.env` with your local PostgreSQL connection settings.
Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` 
as appropriate for your setup.

To use AI-powered natural-language search, configure `GEMINI_API_KEY`.

### 3. Initialize the database

Ensure PostgreSQL is running, then create the application database:

```bash
createdb booking_system
```

From the project root, create the tables, indexes, and seed data:

```bash
psql -d booking_system -f "2. data model/schema.sql"
psql -d booking_system -f "2. data model/indices/indices.sql"
psql -d booking_system -f "2. data model/seed data/seed.sql"
```

These commands initialize the demo database without running the SQL constraint-test scripts.
See `2. data model/` for the full database setup and constraint tests.


### 4. Start the application

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

- [x] **Cancellation authorization**: restrict users to cancelling their own bookings
- [x] **Transactional booking protection**: use database transactions and row-level locking to protect against double-booking

- [x] **Automated testing**: test the frontend, backend, integration workflows, and end-to-end application flows

**AI integration note:** Natural-language search uses Gemini to interpret queries and rank candidate events.
It requires a valid `GEMINI_API_KEY` and depends on the availability of the external Gemini service.
Live integration has not yet been reliably verified end to end; AI search may return `503 Service Unavailable` 
when the service is unavailable.


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


## Prerequisites

Before running the project, I require the following software:

- **Node.js 20.19.0 or later**: required by Prisma 7 and Vite 8.
- **npm**: used to install dependencies and run the project scripts.
- **PostgreSQL**: used as the application's relational database.
- **Git**: used to clone the repository and manage the project source code.

I recommend using an active LTS version of Node.js, such as Node.js 22.x.
Prisma currently recommends Node.js 22.x for Prisma 7.


## Installation

Clone the repository and navigate to the project directory:

```bash
git clone <repository-url>
cd <project-directory>
```

Install the root project dependencies:

```bash
npm install
```

Install the frontend dependencies:

```bash
cd "3. frontend"
npm install
cd ..
```

Install the backend dependencies:

```bash
cd "4. backend"
npm install
cd ..
```

After installation, configure the environment variables and database before running the application.


## Environment Configuration

I use environment variables to configure the PostgreSQL database connection.

Copy the example environment file:

```bash
cp .env.example .env
```

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


I keep `.env` out of version control and use `.env.example` as the template for local configuration.


## Database Setup

I use PostgreSQL as the application's relational database.

The database setup files are located in `2. data model/`:

- `setup.sh` — database setup script
- `setup.sql` — database setup SQL
- `schema.sql` — database schema
- `seed data/seed.sql` — test and development seed data
- `reset.sql` — database reset script

### Option 1: Using `setup.sh`

Run the shell script from the `2. data model` directory:

```bash
cd "2. data model"
./setup.sh
```

### Option 2: Manually through `psql`

Start PostgreSQL:
```bash
psql
```

Create and connect to the application database:
```sql
CREATE DATABASE booking_system;
\c booking_system
```

Load the database schema and seed data:
```text
\i schema.sql
\i "seed data/seed.sql"
```

### Connecting to the Database Later

```bash
psql booking_system
```

### Viewing Tables

List the tables in the database with:
```text
\dt
```

After the database has been initialized, the application can connect to PostgreSQL 
using the credentials configured in `.env`.


## Running the Application

I run the frontend and backend separately during development.


### Start the Backend

From the project root, run:

```bash
npm run start --prefix "4. backend"
```

For development mode with automatic reload:

```bash
npm run start:dev --prefix "4. backend"
```

The backend runs on `http://localhost:3000`.


### Start the Frontend

From the project root, run:

```bash
npm run dev --prefix "3. frontend"
```

The frontend runs on the URL provided by Vite,
typically `http://localhost:5173`.

Once both servers are running, open the frontend URL in 
a browser to use the application.


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

#### Backend

| Metric | Coverage |
|---|---:|
| Statements | 91.63% |
| Branches | 87.70% |
| Functions | 87.03% |
| Lines | 90.39% |

- **Test suites:** 17/17 passed
- **Tests:** 75/75 passed

#### Frontend

| Metric | Coverage |
|---|---:|
| Statements | 93.20% |
| Branches | 87.20% |
| Functions | 90.90% |
| Lines | 93.16% |

- **Test files:** 11/11 passed
- **Tests:** 52/52 passed

Coverage is reported by Jest for the backend and Vitest with the V8 coverage 
provider for the frontend. Aggregate figures include test-support files and 
other files included by each coverage configuration.

**Detailed HTML reports:** [Backend](YOUR_BACKEND_REPORT_URL) · [Frontend](YOUR_FRONTEND_REPORT_URL)


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


## API Endpoints

I expose the application's functionality through a REST API implemented with NestJS.

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


## Architecture

The application currently uses a layered full-stack architecture:
a React frontend communicates with a NestJS backend through a REST API, and 
the backend accesses PostgreSQL to retrieve and persist application data. 

NOTE: I plan to add event-driven processing with Kafka in a future phase.


### Frontend

I built the frontend with React and TypeScript using Vite.
The frontend provides the user interface for browsing events and venues, 
creating bookings, checking event availability, and viewing booking history.
It also communicates with the backend through REST API requests.


### Backend

I built the backend with NestJS and organized it into feature-based modules:

- **Events**: event retrieval, availability, and natural-language search
- **Venues**: venue retrieval
- **Bookings**: booking creation, cancellation, and booking history
- **Database**: PostgreSQL database connection and access

The backend:
- exposes the REST API that the frontend also uses,
- validates requests,
- applies business rules, and
- coordinates database operations.


### Database

I use PostgreSQL to store users, venues, events, and bookings.
The database schema uses primary keys, foreign keys, constraints, and indexes to 
support data integrity.
Booking operations also use database transactions and row-level locking to 
protect against double-booking and conflicting operations.

### Request Flow

A typical request follows this flow:

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
- Then the backend returns the result through the controller to the frontend.


### Why Event-Driven Architecture?

The planned event-driven architecture aims to decouple booking operations from 
downstream services.

For example, when a booking is created, the booking service could publish a
`booking.created` event to Kafka. Separate notification and analytics services
could consume that event independently without requiring the booking service to
directly call each service.

This would allow the system to add downstream functionality without tightly
coupling it to the core booking workflow.


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

- Authentication and authorization are not yet implemented at the application level
- Kafka-based event processing is planned for Phase 2
- The current deployment workflow is intended for local development
