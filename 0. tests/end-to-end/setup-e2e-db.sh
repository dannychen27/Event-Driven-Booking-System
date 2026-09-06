#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

DB_NAME="booking_system_test"
DB_HOST="localhost"
DB_PORT="5432"

echo "Setting up E2E database: $DB_NAME"

echo "Resetting E2E database: $DB_NAME"

psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --dbname="postgres" \
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

echo "Applying schema..."

psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --dbname="$DB_NAME" \
  --file="$PROJECT_ROOT/2. data model/schema.sql"

echo "E2E database schema applied."

echo "Seeding E2E database..."

psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --dbname="$DB_NAME" \
  --file="$PROJECT_ROOT/0. tests/end-to-end/seed-e2e-db.sql"

echo "E2E database ready."
