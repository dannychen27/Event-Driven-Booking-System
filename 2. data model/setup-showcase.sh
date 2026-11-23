#!/bin/bash

set -euo pipefail

EXPECTED_DB_NAME="booking_system_showcase"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${DB_NAME:-}" != "$EXPECTED_DB_NAME" ]]; then
  echo "ERROR: Refusing to create unexpected database." >&2
  echo "Set DB_NAME=booking_system_showcase explicitly to proceed." >&2
  exit 1
fi

cd "$SCRIPT_DIR"

createdb "$DB_NAME"

psql -X -v ON_ERROR_STOP=1 "$DB_NAME" -f "schema.sql"
psql -X -v ON_ERROR_STOP=1 "$DB_NAME" -f "indices/indices.sql"
psql -X -v ON_ERROR_STOP=1 "$DB_NAME" -f "seed data/showcase.sql"
psql -X -v ON_ERROR_STOP=1 "$DB_NAME" -f "seed data/showcase-bookings.sql"

echo "Showcase database ready."
