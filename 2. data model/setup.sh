#!/bin/bash

set -euo pipefail

EXPECTED_DB_NAME="booking_system"

if [[ "${DB_NAME:-}" != "$EXPECTED_DB_NAME" ]]; then
  echo "ERROR: Refusing to reset database." >&2
  echo "Set DB_NAME=booking_system explicitly to proceed." >&2
  exit 1
fi


dropdb --if-exists "$DB_NAME"
createdb "$DB_NAME"

psql "$DB_NAME" -f "schema.sql"
psql "$DB_NAME" -f "indices/indices.sql"
psql "$DB_NAME" -f "seed data/seed.sql"

echo "Development database ready."
