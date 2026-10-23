#!/bin/bash

# Compatible with the default macOS Bash 3.2.
set -u

# ---------- Initialization ----------

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

LOG_ROOT="$ROOT_DIR/test-logs"
MODE="${1:-all}"
FAILED=0
SUMMARY=""

initialize_run() {
    # Generate date and time components from one timestamp.
    RUN_STAMP="$(python3 -c 'from datetime import datetime; now = datetime.now(); print(now.strftime("%m-%d-%Y|%I-%M-%S-") + f"{now.microsecond // 1000:03d}" + now.strftime("%p"))')" || return 1

    RUN_DATE="${RUN_STAMP%%|*}"
    RUN_TIME="${RUN_STAMP#*|}"

    LOG_DIR="$LOG_ROOT/$RUN_DATE/$RUN_TIME"

    case "$MODE" in
        all) REPORT_LOG="$LOG_DIR/comprehensive.txt" ;;
        frontend|backend|e2e|integration|lint|build|coverage)
            REPORT_LOG="$LOG_DIR/$MODE.txt"
            ;;
        *)
            echo "Unknown verification mode: $MODE"
            echo "Choose: all, frontend, backend, e2e, integration, lint, build, coverage"
            return 2
            ;;
    esac

    mkdir -p "$LOG_DIR" || return 1
}

validate_script() {
    if ! bash -n "$ROOT_DIR/scripts/verify-logs.sh"; then
        echo "ERROR: verify-logs.sh contains a shell syntax error."
        return 2
    fi
}

write_report_header() {
    MODE_UPPER="$(printf '%s' "$MODE" | tr '[:lower:]' '[:upper:]')"

    {
        echo "============================================================"
        echo "EVENT-DRIVEN BOOKING SYSTEM - $MODE_UPPER VERIFICATION"
        echo "Started: $(date)"
        echo "============================================================"
    } | tee "$REPORT_LOG"
}

# ---------- Verification runner ----------

run_step() {
    label="$1"
    shift

    {
        echo
        echo "------------------------------------------------------------"
        echo "$label"
        echo "Command: $*"
        echo "Started: $(date)"
        echo "------------------------------------------------------------"
    } | tee -a "$REPORT_LOG"

    "$@" 2>&1 | tee -a "$REPORT_LOG"
    exit_code=${PIPESTATUS[0]}

    record_result "$label" "$exit_code"
}

record_result() {
    label="$1"
    exit_code="$2"

    if [ "$exit_code" -eq 0 ]; then
        result="$label: PASS (exit code 0)"
    else
        result="$label: FAIL (exit code $exit_code)"
        FAILED=1
    fi

    SUMMARY="${SUMMARY}${result}"$'\n'

    {
        echo
        echo "RESULT: $result"
        echo "Finished: $(date)"
    } | tee -a "$REPORT_LOG"
}

run_verification() {
    case "$MODE" in
        all)
            run_step "Backend lint" npm run lint:backend
            run_step "Frontend lint" npm run lint:frontend
            run_step "Backend tests" npm run test:backend
            run_step "Frontend tests" npm run test:frontend
            run_step "E2E tests" npm run test:e2e
            run_step "Integration tests" npm run test:integration
            run_step "Backend build" npm run build:backend
            run_step "Frontend build" npm run build:frontend
            ;;
        frontend)
            run_step "Frontend tests" npm run test:frontend
            ;;
        backend)
            run_step "Backend tests" npm run test:backend
            ;;
        e2e)
            run_step "E2E tests" npm run test:e2e
            ;;
        integration)
            run_step "Integration tests" npm run test:integration
            ;;
        lint)
            run_step "Backend lint" npm run lint:backend
            run_step "Frontend lint" npm run lint:frontend
            ;;
        build)
            run_step "Backend build" npm run build:backend
            run_step "Frontend build" npm run build:frontend
            ;;
        coverage)
            run_step "Backend coverage" npm run coverage:backend
            run_step "Frontend coverage" npm run coverage:frontend
            ;;
    esac
}

write_final_summary() {
    {
        echo
        echo "============================================================"
        echo "FINAL SUMMARY"
        echo "============================================================"
        printf '%s' "$SUMMARY"

        if [ "$FAILED" -eq 0 ]; then
            echo
            echo "OVERALL RESULT: PASS"
        else
            echo
            echo "OVERALL RESULT: FAIL"
        fi

        echo "Finished: $(date)"
        echo "Report: $REPORT_LOG"
    } | tee -a "$REPORT_LOG"
}

# ---------- Main ----------

validate_script || exit $?

initialize_run || exit $?

write_report_header
run_verification
write_final_summary

exit "$FAILED"
