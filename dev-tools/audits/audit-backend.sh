#!/usr/bin/env bash

# Backend organization audit for Event-Driven Booking System.
# Run from the repository root: bash audit-backend.sh
# Read-only for project files, except normal test-generated coverage artifacts.

set -u

ROOT="$(pwd)"
TEST_DIR="0. tests/backend"
BACKEND_DIR="4. backend"
MAX_TEST_LINES=250

if [[ ! -d "$TEST_DIR" || ! -d "$BACKEND_DIR" ]]; then
    printf 'ERROR: Run this script from the repository root.\n'
    printf 'Expected directories: "%s" and "%s"\n' "$TEST_DIR" "$BACKEND_DIR"
    exit 1
fi

section() {
    printf '\n\n==================================================\n'
    printf '%s\n' "$1"
    printf '==================================================\n'
}

section "1. GIT STATUS AND CHANGE SCOPE"
git status --short
printf '\nChanged file summary:\n'
git --no-pager diff --stat
printf '\nChanged paths:\n'
git --no-pager diff --name-status

section "2. TEST FILE INVENTORY AND NAMING"
find "$TEST_DIR" -type f -name '*.test.ts' | sort

printf '\nTest files with nonstandard names:\n'
find "$TEST_DIR" -type f -name '*.test.ts' | sort |
while IFS= read -r file; do
    name="${file##*/}"
    if [[ ! "$name" =~ ^[a-zA-Z][a-zA-Z0-9]*\.test\.ts$ ]]; then
        printf '  REVIEW: %s\n' "$file"
    fi
done

section "3. TEST OWNERSHIP: DESCRIBE / IT DECLARATIONS"
find "$TEST_DIR" -type f -name '*.test.ts' | sort |
while IFS= read -r file; do
    printf '\n--- %s ---\n' "$file"
    grep -nE '^[[:space:]]*(describe|it|test)(\.each)?[[:space:]]*\(' \
        "$file" || true
done

section "4. POTENTIALLY OVERSIZED TEST FILES"
printf 'Threshold: %s lines (review suggestion, not a hard limit)\n\n' \
    "$MAX_TEST_LINES"

find "$TEST_DIR" -type f -name '*.test.ts' | sort |
while IFS= read -r file; do
    lines="$(wc -l < "$file" | tr -d ' ')"
    if (( lines > MAX_TEST_LINES )); then
        printf 'REVIEW: %4s lines  %s\n' "$lines" "$file"
    fi
done

section "5. DELETED TEST FILES AND REMOVED TEST DECLARATIONS"
printf 'Deleted test files in the working-tree diff:\n'
git --no-pager diff --name-status -- "$TEST_DIR" |
    awk '$1 == "D" { print "  " $2 }'

printf '\nRemoved describe/it/test declarations in the working-tree diff:\n'
git --no-pager diff --unified=0 -- "$TEST_DIR" |
    grep -E '^-([[:space:]]*)(describe|it|test)(\.each)?[[:space:]]*\(' |
    sed 's/^-//' || true

printf '\nNOTE: Compare removed scenarios with remaining tests manually.\n'
printf 'Git cannot determine whether their assertions are equivalent.\n'

section "6. PRODUCTION MODULE STRUCTURE"
printf 'Backend source files:\n'
find "$BACKEND_DIR/src" -type f \
    \( -name '*.controller.ts' -o \
       -name '*.service.ts' -o \
       -name '*.module.ts' \) 2>/dev/null | sort

printf '\nControllers containing direct database references (review only):\n'
find "$BACKEND_DIR/src" -type f -name '*.controller.ts' 2>/dev/null |
while IFS= read -r file; do
    if grep -nE 'DatabaseService|\.query\(|\.transaction\(' "$file"; then
        printf '  FILE: %s\n' "$file"
    fi
done

printf '\nNOTE: Direct database access is a review signal, not automatically a bug.\n'

section "7. BACKEND TEST SUITE AND COVERAGE"
printf 'Running the full backend test suite...\n'
printf 'Command: (cd "%s" && npm run test -- --runInBand)\n\n' "$BACKEND_DIR"

(
    cd "$BACKEND_DIR" &&
    npm run test -- --runInBand
)
TEST_EXIT=$?

printf '\nBackend test exit code: %s\n' "$TEST_EXIT"

printf '\nCoverage summary files, if generated:\n'
for file in \
    "$BACKEND_DIR/coverage/coverage-summary.json" \
    "$BACKEND_DIR/coverage/lcov-report/index.html"
do
    if [[ -f "$file" ]]; then
        printf '  Found: %s\n' "$file"
    else
        printf '  Not found: %s\n' "$file"
    fi
done

if [[ -f "$BACKEND_DIR/coverage/coverage-summary.json" ]]; then
    printf '\nOverall coverage (statements, branches, functions, lines):\n'
    node -e '
      const fs = require("fs");
      const p = process.argv[1];
      const d = JSON.parse(fs.readFileSync(p, "utf8"));
      for (const k of ["statements", "branches", "functions", "lines"]) {
        const x = d.total?.[k];
        if (x) console.log(`${k}: ${x.covered}/${x.total} (${x.pct}%)`);
      }
    ' "$BACKEND_DIR/coverage/coverage-summary.json"
fi

section "8. FINAL DIFF REVIEW"
printf 'Remaining working-tree changes:\n'
git status --short

printf '\nReview the diff in GitHub Desktop before staging or committing.\n'
printf 'No files were staged, committed, or deleted by this script.\n'

section "AUDIT COMPLETE"
if (( TEST_EXIT != 0 )); then
    printf 'RESULT: Backend tests failed. Investigate before committing.\n'
    exit "$TEST_EXIT"
fi

printf 'RESULT: Backend tests passed. Review flagged items above manually.\n'
