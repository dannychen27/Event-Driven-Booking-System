# Event-Driven Booking System

## Overview

A full-stack event booking system built with React, NestJS, and PostgreSQL.

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

The project is being developed incrementally, with automated frontend, backend, integration, and end-to-end tests.


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

```
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


## Database Setup

### Option 1: Using setup.sh

Run this shell script from the "2. data model" folder:

```bash
./setup.sh
```

### Option 2: Manually through psql

Start PostgreSQL:
```
psql
```

Inside PostgreSQL:
```
CREATE DATABASE booking_system;
\c booking_system

-- Load schema:
\i schema.sql
\i "seed data/seed.sql"
```

### Connecting to the database later

```
psql booking_system
```

### Viewing tables
```
\dt
```


