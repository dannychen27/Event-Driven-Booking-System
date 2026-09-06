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



