#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMP_DIR="$(mktemp -d)"
COMMAND_LOG="$TEMP_DIR/commands.log"

trap 'rm -rf "$TEMP_DIR"' EXIT

MOCK_BIN="$TEMP_DIR/bin"
mkdir -p "$MOCK_BIN"
touch "$COMMAND_LOG"

export COMMAND_LOG
export PATH="$MOCK_BIN:$PATH"

# Mock PostgreSQL commands. These only record invocations.
for command in dropdb createdb psql; do
  cat > "$MOCK_BIN/$command" <<'MOCK'
#!/bin/bash
printf '%s %s\n' "$(basename "$0")" "$*" >> "$COMMAND_LOG"
MOCK
  chmod +x "$MOCK_BIN/$command"
done

E2E_SCRIPT="$PROJECT_ROOT/0. tests/end-to-end/setup-e2e-db.sh"
DEV_SCRIPT="$PROJECT_ROOT/2. data model/setup.sh"

PASS_COUNT=0

assert_rejected() {
  local description="$1"
  shift

  if "$@" >/dev/null 2>&1; then
    echo "FAIL: $description"
    exit 1
  fi

  if [[ -s "$COMMAND_LOG" ]]; then
    echo "FAIL: $description invoked a database command"
    exit 1
  fi

  echo "PASS: $description"
  PASS_COUNT=$((PASS_COUNT + 1))
}

assert_allowed() {
  local description="$1"
  shift

  if ! "$@" >/dev/null 2>&1; then
    echo "FAIL: $description"
    exit 1
  fi

  if [[ ! -s "$COMMAND_LOG" ]]; then
    echo "FAIL: $description did not invoke mocked database commands"
    exit 1
  fi

  echo "PASS: $description"
  PASS_COUNT=$((PASS_COUNT + 1))
  : > "$COMMAND_LOG"
}

echo "===== E2E DATABASE SAFETY ====="

assert_rejected \
  "E2E setup rejects missing DB_NAME" \
  env -u DB_NAME bash "$E2E_SCRIPT"

assert_rejected \
  "E2E setup rejects development database" \
  env DB_NAME=booking_system bash "$E2E_SCRIPT"

assert_allowed \
  "E2E setup accepts designated test database (mocked)" \
  env DB_NAME=booking_system_test bash "$E2E_SCRIPT"

echo
echo "===== DEVELOPMENT DATABASE SAFETY ====="

assert_rejected \
  "Development setup rejects missing DB_NAME" \
  env -u DB_NAME bash "$DEV_SCRIPT"

assert_rejected \
  "Development setup rejects test database" \
  env DB_NAME=booking_system_test bash "$DEV_SCRIPT"

assert_allowed \
  "Development setup accepts designated development database (mocked)" \
  env DB_NAME=booking_system bash "$DEV_SCRIPT"

echo
echo "All $PASS_COUNT database safety tests passed."
