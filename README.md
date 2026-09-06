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

```
git clone <repository-url>
cd <project-directory>
```

Install the root project dependencies:

```
npm install
```

Install the frontend dependencies:

```
cd "3. frontend"
npm install
cd ..
```

Install the backend dependencies:

```
cd "4. backend"
npm install
cd ..
```

After installation, configure the environment variables and database before running the application.


## Environment Configuration

I use environment variables to configure the PostgreSQL database connection.

Copy the example environment file:

```
cp .env.example .env
```

Then update `.env` with the PostgreSQL credentials for your local database:

```
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



