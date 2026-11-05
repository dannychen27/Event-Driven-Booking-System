#!/usr/bin/env bash

# Count test declarations and source lines across the repository's test files.
# Supports macOS Bash 3.2+.

set -u
set -o pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_ROOT="$PROJECT_ROOT/0. tests"
COUNTER_SCRIPT="$SCRIPT_DIR/count-test-declarations.cjs"

SELF_TESTS_RUN=0
SELF_TESTS_FAILED=0

WORK_DIR=""

# ---------------------------------------------------------------------------
# General helpers
# ---------------------------------------------------------------------------

print_section() {
    printf "\n=== %s ===\n" "$1"
}

print_error() {
    printf "Error: %s\n" "$1" >&2
}

cleanup() {
    if [ -n "$WORK_DIR" ] && [ -d "$WORK_DIR" ]; then
        rm -rf "$WORK_DIR"
    fi
}

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

get_relative_path() {
    local file="$1"

    printf '%s\n' "${file#"$TEST_ROOT"/}"
}

get_category() {
    local relative_path="$1"

    printf '%s\n' "${relative_path%%/*}"
}

count_tests() {
    local file="$1"

    node "$COUNTER_SCRIPT" "$file"
}

count_lines() {
    local file="$1"

    wc -l < "$file" | tr -d '[:space:]'
}

is_non_negative_integer() {
    case "$1" in
        ''|*[!0-9]*)
            return 1
            ;;
        *)
            return 0
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Environment validation
# ---------------------------------------------------------------------------

validate_environment() {
    if [ ! -d "$TEST_ROOT" ]; then
        print_error "Test directory not found: $TEST_ROOT"
        return 1
    fi

    if [ ! -f "$COUNTER_SCRIPT" ]; then
        print_error "AST counter not found: $COUNTER_SCRIPT"
        return 1
    fi

    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js is required but was not found."
        return 1
    fi

    return 0
}

validate_arguments() {
    case "${1:-}" in
        "")
            return 0
            ;;
        --self-test)
            return 0
            ;;
        *)
            print_error "Usage: $0 [--self-test]"
            return 1
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Self-test helpers
# ---------------------------------------------------------------------------

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

create_self_test_fixtures() {
    local temp_dir="$1"
    local sample_file="$temp_dir/path with spaces/sample.test.ts"
    local empty_file="$temp_dir/empty.test.ts"

    mkdir -p "$(dirname "$sample_file")" || return 1

    cat > "$sample_file" <<'TESTS'
// it("commented out test", () => {});

const singleQuoted = 'test("string false positive", () => {})';
const templateQuoted = `it("template false positive", () => {})`;

describe("sample", () => {
    it("counts a regular test", () => {});

    test.each([1, 2])("counts a parameterized declaration", () => {});

    it.skip("counts a skipped test", () => {});

    it.only.concurrent("counts chained modifiers", () => {});

    it.concurrent.each([1, 2])("counts concurrent parameterized tests", () => {});

    it.each([1, 2]).skip("counts parameterized skipped tests", () => {});

    someObject.it("does not count unrelated object methods", () => {});
});
TESTS

    : > "$empty_file"

    printf '%s\n' "$sample_file"
}

test_declaration_counting() {
    local sample_file="$1"
    local empty_file="$2"

    assert_equal "6" "$(count_tests "$sample_file")" \
        "Counts regular, parameterized, and modified test declarations"

    assert_equal "0" "$(count_tests "$empty_file")" \
        "Returns zero for a file without test declarations"
}

test_shell_case_counting() {
    local temp_dir="$1"
    local shell_file="$temp_dir/shell.test.sh"

    cat > "$shell_file" <<'SHELL'
#!/bin/bash

# TEST CASE: first scenario
run_first_test

# TEST CASE: second scenario
run_second_test

echo "# TEST CASE: this is only a string"
SHELL

    assert_equal "2" "$(count_tests "$shell_file")" \
        "Counts explicitly marked shell test cases"
}

test_file_recognition() {
    local result

    if is_test_file "database-setup-safety.test.sh"; then result="yes"; else result="no"; fi
    assert_equal "yes" "$result" "Recognizes .test.sh files"

    if is_test_file "example.test.ts"; then result="yes"; else result="no"; fi
    assert_equal "yes" "$result" "Recognizes .test.ts files"

    if is_test_file "example.spec.tsx"; then result="yes"; else result="no"; fi
    assert_equal "yes" "$result" "Recognizes .spec.tsx files"

    if is_test_file "example.cy.ts"; then result="yes"; else result="no"; fi
    assert_equal "yes" "$result" "Recognizes .cy.ts files"

    if is_test_file "jest.e2e.config.js"; then result="yes"; else result="no"; fi
    assert_equal "no" "$result" "Excludes Jest configuration files"
}

test_malformed_source_reports_parse_error() {
    local temp_dir="$1"
    local malformed_file="$temp_dir/malformed.test.ts"
    local output
    local exit_code
    local result

    cat > "$malformed_file" <<'TESTS'
describe("malformed test", () => {
    it("has invalid syntax", () => {
        const value =
    });
});
TESTS

    output=$(node "$COUNTER_SCRIPT" "$malformed_file" 2>&1)
    exit_code=$?

    if [ "$exit_code" -ne 0 ]; then
        result="yes"
    else
        result="no"
    fi

    assert_equal "yes" "$result" \
        "Rejects malformed TypeScript"

    case "$output" in
        *"Unable to parse test file"*)
            result="yes"
            ;;
        *)
            result="no"
            ;;
    esac

    assert_equal "yes" "$result" \
        "Reports a TypeScript parse error"

    case "$output" in
        *"$malformed_file"*)
            result="yes"
            ;;
        *)
            result="no"
            ;;
    esac

    assert_equal "yes" "$result" \
        "Identifies the malformed source file"

    if [[ "$output" =~ [0-9]+:[0-9]+ ]]; then
        result="yes"
    else
        result="no"
    fi

    assert_equal "yes" "$result" \
        "Includes a line and column location"
}

run_self_tests() {
    local temp_dir
    local sample_file
    local empty_file

    temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/count-tests.XXXXXX") || return 1

    sample_file=$(create_self_test_fixtures "$temp_dir") || {
        rm -rf "$temp_dir"
        return 1
    }

    empty_file="$temp_dir/empty.test.ts"

    print_section "Utility self-tests"

    test_declaration_counting "$sample_file" "$empty_file"
    test_shell_case_counting "$temp_dir"
    test_file_recognition
    test_malformed_source_reports_parse_error "$temp_dir"

    rm -rf "$temp_dir"

    printf "\nSelf-tests: %s passed, %s failed\n" \
        "$((SELF_TESTS_RUN - SELF_TESTS_FAILED))" \
        "$SELF_TESTS_FAILED"

    [ "$SELF_TESTS_FAILED" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Inventory collection
# ---------------------------------------------------------------------------

create_work_directory() {
    WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/test-inventory.XXXXXX")
}

collect_ast_counts() {
    local output_file="$1"

    # Feed all discovered paths to one Node.js process.
    find "$TEST_ROOT" -type f -print0 |
        node "$COUNTER_SCRIPT" > "$output_file"
}

append_test_record() {
    local count="$1"
    local file="$2"
    local relative_path
    local category
    local lines
    local test_type="AST"

    if ! is_non_negative_integer "$count"; then
        print_error "Invalid test count '$count' for: $file"
        return 1
    fi

    relative_path=$(get_relative_path "$file")
    category=$(get_category "$relative_path")
    lines=$(count_lines "$file")

    case "$file" in
        *.sh)
            test_type="Shell"
            ;;
    esac

    printf "%s\t%s\t%s\t%s\t%s\n" \
        "$count" "$lines" "$category" "$relative_path" "$test_type"
}

build_inventory_records() {
    local count_records="$1"
    local records="$2"
    local count
    local file
    local record

    while IFS= read -r -d '' count &&
          IFS= read -r -d '' file; do

        record=$(append_test_record "$count" "$file") || return 1

        printf '%s\n' "$record" >> "$records"

    done < "$count_records"
}

generate_inventory() {
    local records="$1"
    local count_records="$2"

    if ! collect_ast_counts "$count_records"; then
        print_error "AST counting failed. Aborting report."
        return 1
    fi

    if ! build_inventory_records "$count_records" "$records"; then
        print_error "Failed to build test inventory."
        return 1
    fi
}

# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

print_file_report() {
    local records="$1"

    print_section "Test counts by file"

    if [ -s "$records" ]; then
        awk -F '\t' '{
            printf "%4d tests | %4d lines | %s\n", $1, $2, $4
        }' "$records" | sort -nr
    else
        printf "No test files found.\n"
    fi
}

print_category_report() {
    local records="$1"
    local category_dir
    local category

    print_section "Test counts by category"

    # Include directories even when they contain zero test files.
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
}

print_overall_report() {
    local records="$1"

    print_section "Overall totals"

    awk -F '\t' '
        {
            files++
            total += $1
            lines += $2

            if ($5 == "Shell") {
                shell_cases += $1
            } else {
                ast_declarations += $1
            }
        }
        END {
            printf "Test files: %d\n", files
            printf "AST declarations: %d\n", ast_declarations
            printf "Shell test cases: %d\n", shell_cases
            printf "Total test cases: %d\n", total
            printf "Source lines: %d\n", lines
        }
    ' "$records"
}

print_inventory_notes() {
    printf "\nNote: TypeScript/JavaScript tests are counted using AST declarations.\n"
    printf "Parameterized declarations such as it.each([...]) count once.\n"
    printf "Shell tests are counted using explicit '# TEST CASE:' markers.\n"
    printf "Shell assertions within a test case are not counted as separate test cases.\n"
}

print_inventory_report() {
    local records="$1"

    print_file_report "$records"
    print_category_report "$records"
    print_overall_report "$records"
    print_inventory_notes
}

# ---------------------------------------------------------------------------
# Main execution
# ---------------------------------------------------------------------------

main() {
    local records
    local count_records

    if ! validate_arguments "${1:-}"; then
        return 1
    fi

    if ! validate_environment; then
        return 1
    fi

    if ! run_self_tests; then
        print_error "Utility self-tests failed. Aborting report."
        return 1
    fi

    if [ "${1:-}" = "--self-test" ]; then
        return 0
    fi

    if ! create_work_directory; then
        print_error "Unable to create temporary working directory."
        return 1
    fi

    records="$WORK_DIR/test-counts.tsv"
    count_records="$WORK_DIR/test-counts-ast.bin"

    if ! generate_inventory "$records" "$count_records"; then
        return 1
    fi

    print_inventory_report "$records"
}

trap cleanup EXIT

main "$@"
