

## Database Setup

### Option 1: Using setup.sh

Run this shell script from the "2. data model" folder:

```bash
./setup.sh
```

### Option 2: Manually through psql

Start postgreSQL:
```
psql
```

Inside PostgreSQL:
```
CREATE DATABASE booking_system;
\c booking_system

-- load schema:
\i schema.sql
\i "seed data/seed.sql"
```

### Connecting to the database later

```
psql booking_system
```

### viewing tables
```
\dt
```
