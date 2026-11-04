#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

# Validate database before resetting E2E database.
DB_NAME="${DB_NAME:?DB_NAME must be explicitly set to booking_system_test}"

if [[ "$DB_NAME" != "booking_system_test" ]]; then
  echo "ERROR: Refusing to reset unexpected database: $DB_NAME" >&2
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Terminate existing connections before resetting the test database.
psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --dbname="postgres" \
  --set=ON_ERROR_STOP=1 \
  --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

dropdb \
  --if-exists \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  "$DB_NAME"

createdb \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  "$DB_NAME"

# Apply schema.
psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --dbname="$DB_NAME" \
  --set=ON_ERROR_STOP=1 \
  --file="$PROJECT_ROOT/2. data model/schema.sql"

# Apply indexes.
psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --dbname="$DB_NAME" \
  --set=ON_ERROR_STOP=1 \
  --file="$PROJECT_ROOT/2. data model/indices/indices.sql"

# Seed deterministic E2E data.
psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --dbname="$DB_NAME" \
  --set=ON_ERROR_STOP=1 \
  --file="$PROJECT_ROOT/0. tests/end-to-end/seed-e2e-db.sql"

echo "E2E database ready."
