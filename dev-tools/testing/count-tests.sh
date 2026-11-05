#!/usr/bin/env bash

# Count test declarations and source lines across the repository's test files.
# Supports macOS Bash 3.2+.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_ROOT="$PROJECT_ROOT/0. tests"

TEST_DECLARATION_REGEX='(^|[^[:alnum:]_$])(it|test)(\.(each|only|skip|todo|concurrent|failing))*[[:space:]]*\('

is_test_file() {
    case "$1" in
        *.test.*|*.spec.*|*.e2e.test.*|*.e2e.spec.*|*.cy.*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

count_tests() {
    local file="$1"
    local count

    count=$(
        grep -Eo "$TEST_DECLARATION_REGEX" "$file" 2>/dev/null |
            wc -l |
            tr -d '[:space:]'
    )

    printf '%s' "${count:-0}"
}

count_lines() {
    wc -l < "$1" | tr -d '[:space:]'
}

SELF_TESTS_RUN=0
SELF_TESTS_FAILED=0

assert_equal() {
    local expected="$1"
    local actual="$2"
    local description="$3"

    SELF_TESTS_RUN=$((SELF_TESTS_RUN + 1))

    if [ "$expected" = "$actual" ]; then
        printf "  PASS: %s\n" "$description"
    else
        printf "  FAIL: %s (expected %s, got %s)\n" \
            "$description" "$expected" "$actual"
        SELF_TESTS_FAILED=$((SELF_TESTS_FAILED + 1))
    fi
}

run_self_tests() {
    local temp_dir
    local sample_file
    local empty_file

    temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/count-tests.XXXXXX") || return 1

    sample_file="$temp_dir/path with spaces/sample.test.ts"
    empty_file="$temp_dir/empty.test.ts"

    mkdir -p "$(dirname "$sample_file")"

    cat > "$sample_file" <<'TESTS'
describe("sample", () => {
    it("counts a regular test", () => {});
    test.each([1, 2])("counts a parameterized declaration", () => {});
    it.skip("counts a skipped test declaration", () => {});
});
TESTS

    : > "$empty_file"

    printf "\n=== Utility self-tests ===\n"

    assert_equal "3" "$(count_tests "$sample_file")" \
        "Counts it, test.each, and it.skip declarations"

    assert_equal "0" "$(count_tests "$empty_file")" \
        "Returns zero for a file without test declarations"

    if is_test_file "example.test.ts"; then result="yes"; else result="no"; fi
    assert_equal "yes" "$result" "Recognizes .test.ts files"

    if is_test_file "example.spec.tsx"; then result="yes"; else result="no"; fi
    assert_equal "yes" "$result" "Recognizes .spec.tsx files"

    if is_test_file "example.cy.ts"; then result="yes"; else result="no"; fi
    assert_equal "yes" "$result" "Recognizes .cy.ts files"

    if is_test_file "jest.e2e.config.js"; then result="yes"; else result="no"; fi
    assert_equal "no" "$result" "Excludes Jest configuration files"

    rm -rf "$temp_dir"

    printf "\nSelf-tests: %s passed, %s failed\n" \
        "$((SELF_TESTS_RUN - SELF_TESTS_FAILED))" "$SELF_TESTS_FAILED"

    [ "$SELF_TESTS_FAILED" -eq 0 ]
}

if [ "${1:-}" = "--self-test" ]; then
    run_self_tests
    exit $?
fi

if [ "$#" -gt 0 ]; then
    printf "Usage: %s [--self-test]\n" "$0" >&2
    exit 1
fi

if [ ! -d "$TEST_ROOT" ]; then
    printf "Error: Test directory not found: %s\n" "$TEST_ROOT" >&2
    exit 1
fi

# Run the built-in checks before generating the report.
if ! run_self_tests; then
    printf "\nError: Utility self-tests failed. Aborting report.\n" >&2
    exit 1
fi

records=$(mktemp "${TMPDIR:-/tmp}/test-counts.XXXXXX") || exit 1
trap 'rm -f "$records"' EXIT

# Store: declaration count, line count, category, file path.
while IFS= read -r -d '' file; do
    if is_test_file "$file"; then
        relative="${file#"$TEST_ROOT"/}"
        category="${relative%%/*}"
        count=$(count_tests "$file")
        lines=$(count_lines "$file")

        printf "%s\t%s\t%s\t%s\n" \
            "$count" "$lines" "$category" "$relative" >> "$records"
    fi
done < <(find "$TEST_ROOT" -type f -print0)

printf "\n=== Test counts by file ===\n"

if [ -s "$records" ]; then
    awk -F '\t' '{
        printf "%4d tests | %4d lines | %s\n", $1, $2, $4
    }' "$records" | sort -nr
else
    printf "No test files found.\n"
fi

printf "\n=== Test counts by category ===\n"

# Include directories even when they currently contain zero test files.
for category_dir in "$TEST_ROOT"/*; do
    [ -d "$category_dir" ] || continue

    category="${category_dir##*/}"

    awk -F '\t' -v category="$category" '
        $3 == category {
            files++
            tests += $1
            lines += $2
        }
        END {
            printf "%-16s %3d files | %4d tests | %5d lines\n",
                category, files, tests, lines
        }
    ' "$records"
done | sort

printf "\n=== Overall totals ===\n"

awk -F '\t' '
    {
        files++
        tests += $1
        lines += $2
    }
    END {
        printf "Test files: %d\n", files
        printf "Test declarations: %d\n", tests
        printf "Source lines: %d\n", lines
    }
' "$records"

printf "\nNote: Counts are test declarations, not expanded runtime cases.\n"
printf "For example, it.each([...]) counts as one declaration.\n"
