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
