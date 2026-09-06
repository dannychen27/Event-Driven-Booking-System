# Event-Driven Booking System

## Overview

A full-stack event booking system built with React, NestJS, and PostgreSQL.

I built this project as an event-driven booking system for managing users, 
venues, events, and bookings. I was inspired by the admin system I 
debugged during my Sky View Suites internship in summer 2022.

The system currently uses React, NestJS, and PostgreSQL.
Future phases will introduce Kafka, notification services, 
analytics services, Docker, and Kubernetes.

The system allows users to:
- browse events and venues
- book events
- view booking history
- cancel their bookings

The backend enforces booking constraints such as:
- duplicate bookings
- schedule conflicts
- event capacity 
- cancellation authorization
- protection against double-booking through database transactions and row-level locking

The project is being developed incrementally, with automated frontend, backend, integration, and end-to-end tests.


## Features

I have implemented the following features in the current Phase 1 release:

- [x] **Event and venue browsing** — browse available events and their associated venues
- [x] **Event availability** — view the remaining capacity for an event
- [x] **Booking management** — create and cancel event bookings
- [x] **Booking history** — view a user's previous and current bookings
- [x] **Booking validation** — prevent duplicate bookings, schedule conflicts, and bookings that exceed event capacity

- [x] **Client-side form validation** — validate booking input before submitting requests
- [ ] **Responsive user interface** — support common desktop and mobile layouts

- [x] **REST API integration** — connect the frontend to the backend through REST endpoints

- [ ] **Cancellation authorization** — restrict users to cancelling their own bookings
- [x] **Transactional booking protection** — use database transactions and row-level locking to protect against double-booking

- [x] **Automated testing** — test the frontend, backend, integration workflows, and end-to-end application flows


## Tech Stack

### Current

- **Frontend:** React, TypeScript, Vite
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL
- **Database tooling:** Prisma, node-postgres
- **Testing:** Vitest, Jest, Supertest


### Planned

- **Event streaming:** Apache Kafka
- **Systems language:** C++
- **Containerization:** Docker
- **Orchestration:** Kubernetes


## Project Structure

```text
Event-Driven Booking System/
├── frontend/
│   └── src/
│       ├── api/                    # Backend API clients
│       ├── components/             # Reusable React components
│       ├── pages/                  # Application pages
│       ├── styles/                 # Component and page styling
│       ├── types/                  # TypeScript domain types
│       └── utils/                  # Shared frontend utilities
│
├── backend/
│   └── src/
│       ├── bookings/               # Booking module and business logic
│       ├── database/               # PostgreSQL database connection
│       ├── events/                 # Event module and business logic
│       └── venues/                 # Venue module and business logic
│
├── prisma/
│   └── schema.prisma               # Prisma database schema
│
├── tests/
│   ├── backend/                    # Backend unit and API tests
│   ├── frontend/                   # Frontend component and page tests
│   ├── integration/                # Backend integration tests
│   ├── end-to-end/                 # End-to-end application tests
│   ├── mocks/                      # Shared test mocks
│   └── utils/                      # Shared test utilities
│
├── 0. documentation/               # Architecture and technology documentation
├── 1. api endpoints/               # API specifications and design documentation
├── 2. data model/                  # Database schema, setup, seeds, and design
│
├── .env.example                    # Example environment configuration
├── package.json                    # Root project scripts and dependencies
├── prisma.config.ts                # Prisma configuration
└── README.md                       # Project documentation
```

I organize the project into separate **frontend**, **backend**, and **test** layers.

I built the frontend with React and TypeScript, while the backend uses NestJS and PostgreSQL.

I organize automated tests by scope, including unit, integration, and end-to-end tests.

I keep additional development documentation in the numbered documentation directories, covering API design, data modeling, architecture, technology choices, and project planning.


## Prerequisites

Before running the project, I require the following software:

* **Node.js 20.19.0 or later**: required by Prisma 7 and Vite 8.
* **npm**: used to install dependencies and run the project scripts.
* **PostgreSQL**: used as the application's relational database.
* **Git**: used to clone the repository and manage the project source code.

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

Run the shell script from the "2. data model" directory:

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

```
npm test
```

## Run Specific Test Suites

| Test suite | Command |
| --- | --- |
| Backend | `npm run test:backend` |
| Frontend | `npm run test:frontend` |
| Integration | `npm run test:integration` |
| End-to-end | `npm run test:e2e` |

The integration and end-to-end test commands automatically set 
up the `booking_system_test` database before running their 
respective test suites.


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

I structure the application as a layered, event-driven system with separate frontend, backend, and database components.

### Why Event-Driven Architecture?

I plan to introduce event-driven architecture to decouple booking operations 
from downstream services.

For example, when a booking is created, the booking service could publish a 
`booking.created` event to Kafka. Separate notification and analytics services 
could consume that event independently without requiring the booking service to 
directly call each service.

This would allow the system to add downstream functionality without tightly 
coupling it to the core booking workflow.


### Frontend

I built the frontend with React and TypeScript using Vite.

The frontend communicates with the backend through REST API requests and provides the user interface for browsing events and venues, creating bookings, and viewing booking history.


### Backend

I built the backend with NestJS and organize it into feature-based modules:

- **Events**: event retrieval and availability
- **Venues**: venue retrieval
- **Bookings**: booking creation, cancellation, and booking history
- **Database**: PostgreSQL database connection and access

The backend contains the application's business logic and exposes the REST API used by the frontend.


### Database

I use PostgreSQL to persist users, venues, events, and bookings.

The database schema enforces data integrity through primary keys, foreign keys, constraints, and indexes.

### Request Flow

A typical request follows this flow:

```text
React Frontend
      │
      ▼
REST API
      │
      ▼
NestJS Controllers
      │
      ▼
NestJS Services
      │
      ▼
PostgreSQL
```

The backend services validate requests and apply business rules before reading from or writing to the database.


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

### Phase 2 — Make It Distributed

**Goal:** Introduce Kafka and event-driven communication.

```text
        Booking Service
             │
             │ booking.created
             ▼
           Kafka
       ↙         ↘
Notifications  Analytics
```

Planned work:

- [ ] Publish `booking.created` events
- [ ] Publish `booking.cancelled` events
- [ ] Implement Kafka producers and consumers
- [ ] Build the notification consumer
- [ ] Build the analytics consumer
- [ ] Implement retries
- [ ] Implement idempotent event processing
- [ ] Handle consumer failures

### Phase 3 — Make It Look Professional

**Goal:** Containerize and deploy the distributed system while improving reliability and observability.

```text
              Kubernetes
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
      API    Notification  Analytics
       │
       ▼
   PostgreSQL
       │
       ▼
     Kafka
```

Planned work:

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
