

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
