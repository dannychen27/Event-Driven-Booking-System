#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMP_DIR="$(mktemp -d)"
MOCK_BIN="$TEMP_DIR/bin"
COMMAND_LOG="$TEMP_DIR/commands.log"
STDOUT_LOG="$TEMP_DIR/stdout.log"
STDERR_LOG="$TEMP_DIR/stderr.log"

trap 'rm -rf "$TEMP_DIR"' EXIT

mkdir -p "$MOCK_BIN"
touch "$COMMAND_LOG"

export COMMAND_LOG
export PATH="$MOCK_BIN:$PATH"

# ============================================================
# MOCK DATABASE COMMANDS
# ============================================================

for command in dropdb createdb psql; do
  cat > "$MOCK_BIN/$command" <<'MOCK'
#!/bin/bash

printf '%s' "$(basename "$0")" >> "$COMMAND_LOG"

for arg in "$@"; do
  printf ' <%s>' "$arg" >> "$COMMAND_LOG"
done

printf '\n' >> "$COMMAND_LOG"

if [[ "${MOCK_FAIL_COMMAND:-}" == "$(basename "$0")" ]]; then
  echo "Simulated $(basename "$0") failure" >&2
  exit 1
fi
MOCK

  chmod +x "$MOCK_BIN/$command"
done

E2E_SCRIPT="$PROJECT_ROOT/0. tests/end-to-end/setup-e2e-db.sh"
DEV_SCRIPT="$PROJECT_ROOT/2. data model/setup.sh"

# ============================================================
# TEST STATE
# ============================================================

PASS_COUNT=0
FAIL_COUNT=0
COMMAND_STATUS=0

# ============================================================
# REPORTING HELPERS
# ============================================================

pass() {
  echo "PASS: $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "FAIL: $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

print_summary() {
  echo
  echo "===== RESULTS ====="
  echo "Passed: $PASS_COUNT"
  echo "Failed: $FAIL_COUNT"
}

# ============================================================
# COMMAND EXECUTION HELPERS
# ============================================================

reset_logs() {
  : > "$COMMAND_LOG"
  : > "$STDOUT_LOG"
  : > "$STDERR_LOG"
}

run_command() {
  if "$@" >"$STDOUT_LOG" 2>"$STDERR_LOG"; then
    COMMAND_STATUS=0
  else
    COMMAND_STATUS=$?
  fi
}

run_command_with_failure() {
  local failing_command="$1"
  shift

  MOCK_FAIL_COMMAND="$failing_command" run_command "$@"
}

# ============================================================
# ASSERTION HELPERS
# ============================================================

assert_exit_code() {
  local description="$1"
  local expected="$2"
  local actual="$3"

  if [[ "$actual" -eq "$expected" ]]; then
    pass "$description"
  else
    fail "$description (expected exit $expected, got $actual)"
  fi
}

assert_output_contains() {
  local description="$1"
  local file="$2"
  local expected="$3"

  if grep -Fq -- "$expected" "$file"; then
    pass "$description"
  else
    fail "$description (expected output to contain: $expected)"
  fi
}

assert_output_not_contains() {
  local description="$1"
  local file="$2"
  local unexpected="$3"

  if grep -Fq -- "$unexpected" "$file"; then
    fail "$description (unexpected output: $unexpected)"
  else
    pass "$description"
  fi
}

assert_log_empty() {
  local description="$1"

  if [[ ! -s "$COMMAND_LOG" ]]; then
    pass "$description"
  else
    fail "$description (database commands were invoked)"
    cat "$COMMAND_LOG"
  fi
}

assert_log_equals() {
  local description="$1"
  local expected="$2"

  if diff -u <(printf '%s\n' "$expected") "$COMMAND_LOG"; then
    pass "$description"
  else
    fail "$description (command log did not match)"
  fi
}

assert_log_contains() {
  local description="$1"
  local expected="$2"

  if grep -Fq -- "$expected" "$COMMAND_LOG"; then
    pass "$description"
  else
    fail "$description (command log did not contain: $expected)"
  fi
}

assert_log_line_count() {
  local description="$1"
  local expected="$2"
  local actual

  actual="$(wc -l < "$COMMAND_LOG" | tr -d ' ')"

  if [[ "$actual" -eq "$expected" ]]; then
    pass "$description"
  else
    fail "$description (expected $expected commands, got $actual)"
  fi
}


assert_log_command_order() {
  local description="$1"
  shift

  local previous_line=0
  local command
  local current_line

  for command in "$@"; do
    current_line="$(
      awk \
        -v command="$command" \
        -v previous_line="$previous_line" \
        'NR > previous_line && $0 ~ ("^" command " ") {
          print NR
          exit
        }' \
        "$COMMAND_LOG"
    )"

    if [[ -z "$current_line" ]]; then
      fail "$description (missing or incorrectly ordered command: $command)"
      return
    fi

    previous_line="$current_line"
  done

  pass "$description"
}

# ============================================================
# HIGH-LEVEL DATABASE SAFETY ASSERTIONS
# ============================================================

assert_rejected() {
  local description="$1"
  local expected_message="$2"
  shift 2

  reset_logs
  run_command "$@"

  assert_exit_code "$description: exits unsuccessfully" 0 "$((COMMAND_STATUS == 0 ? 1 : 0))"
  assert_log_empty "$description: invokes no database commands"
  assert_output_contains "$description: reports rejection" "$STDERR_LOG" "$expected_message"
}

assert_allowed() {
  local description="$1"
  local expected_commands="$2"
  shift 2

  reset_logs
  run_command "$@"

  assert_exit_code "$description: exits successfully" 0 "$COMMAND_STATUS"
  assert_log_equals "$description: executes expected commands" "$expected_commands"
}

assert_command_failure_stops_setup() {
  local description="$1"
  local failing_command="$2"
  local expected_commands="$3"
  shift 3

  reset_logs
  run_command_with_failure "$failing_command" "$@"

  assert_exit_code "$description: exits unsuccessfully" 1 "$((COMMAND_STATUS == 0 ? 0 : 1))"
  assert_log_equals "$description: stops at failed command" "$expected_commands"
  assert_output_contains "$description: reports simulated failure" "$STDERR_LOG" \
    "Simulated $failing_command failure"
}

# ============================================================
# E2E DATABASE SAFETY TESTS
# ============================================================

echo "===== E2E DATABASE SAFETY ====="

# TEST CASE: E2E setup rejects missing DB_NAME
assert_rejected \
  "E2E setup rejects missing DB_NAME" \
  "DB_NAME must be explicitly set" \
  env -u DB_NAME bash "$E2E_SCRIPT"

# TEST CASE: E2E setup rejects development database
assert_rejected \
  "E2E setup rejects development database" \
  "Refusing to reset unexpected database" \
  env DB_NAME=booking_system bash "$E2E_SCRIPT"

E2E_EXPECTED="$(cat <<EXPECTED
psql <--host=localhost> <--port=5432> <--dbname=postgres> <--set=ON_ERROR_STOP=1> <--command=SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'booking_system_test' AND pid <> pg_backend_pid();>
dropdb <--if-exists> <--host=localhost> <--port=5432> <booking_system_test>
createdb <--host=localhost> <--port=5432> <booking_system_test>
psql <--host=localhost> <--port=5432> <--dbname=booking_system_test> <--set=ON_ERROR_STOP=1> <--file=$PROJECT_ROOT/2. data model/schema.sql>
psql <--host=localhost> <--port=5432> <--dbname=booking_system_test> <--set=ON_ERROR_STOP=1> <--file=$PROJECT_ROOT/2. data model/indices/indices.sql>
psql <--host=localhost> <--port=5432> <--dbname=booking_system_test> <--set=ON_ERROR_STOP=1> <--file=$PROJECT_ROOT/0. tests/end-to-end/seed-e2e-db.sql>
EXPECTED
)"

# TEST CASE: E2E setup accepts designated test database
assert_allowed \
  "E2E setup accepts designated test database" \
  "$E2E_EXPECTED" \
  env DB_NAME=booking_system_test bash "$E2E_SCRIPT"

# TEST CASE: E2E setup stops when dropdb fails
assert_log_line_count \
  "E2E setup invokes exactly six database commands" \
  6

assert_log_command_order \
  "E2E setup follows reset, schema, indexes, and seed order" \
  psql dropdb createdb psql psql psql

assert_command_failure_stops_setup \
  "E2E setup stops when dropdb fails" \
  dropdb \
  "$(cat <<'EXPECTED'
psql <--host=localhost> <--port=5432> <--dbname=postgres> <--set=ON_ERROR_STOP=1> <--command=SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'booking_system_test' AND pid <> pg_backend_pid();>
dropdb <--if-exists> <--host=localhost> <--port=5432> <booking_system_test>
EXPECTED
)" \
  env DB_NAME=booking_system_test bash "$E2E_SCRIPT"

# ============================================================
# DEVELOPMENT DATABASE SAFETY TESTS
# ============================================================

echo
echo "===== DEVELOPMENT DATABASE SAFETY ====="

# TEST CASE: Development setup rejects missing DB_NAME
assert_rejected \
  "Development setup rejects missing DB_NAME" \
  "Set DB_NAME=booking_system explicitly" \
  env -u DB_NAME bash "$DEV_SCRIPT"

# TEST CASE: Development setup rejects test database
assert_rejected \
  "Development setup rejects test database" \
  "Refusing to reset database" \
  env DB_NAME=booking_system_test bash "$DEV_SCRIPT"

DEV_EXPECTED="$(cat <<'EXPECTED'
dropdb <--if-exists> <booking_system>
createdb <booking_system>
psql <booking_system> <-f> <schema.sql>
psql <booking_system> <-f> <indices/indices.sql>
psql <booking_system> <-f> <seed data/seed.sql>
EXPECTED
)"

# TEST CASE: Development setup accepts designated development database
assert_allowed \
  "Development setup accepts designated development database" \
  "$DEV_EXPECTED" \
  env DB_NAME=booking_system bash "$DEV_SCRIPT"

assert_log_line_count \
  "Development setup invokes exactly five database commands" \
  5

assert_log_command_order \
  "Development setup follows reset, schema, indexes, and seed order" \
  dropdb createdb psql psql psql

# TEST CASE: Development setup stops when dropdb fails
assert_command_failure_stops_setup \
  "Development setup stops when dropdb fails" \
  dropdb \
  "dropdb <--if-exists> <booking_system>" \
  env DB_NAME=booking_system bash "$DEV_SCRIPT"

# ============================================================
# FINAL SUMMARY
# ============================================================

print_summary

if (( FAIL_COUNT > 0 )); then
  exit 1
fi

echo "All database safety tests passed."
