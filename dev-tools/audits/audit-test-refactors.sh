#!/usr/bin/env bash
set -euo pipefail

# Read-only backend test refactoring audit.
# Run from any directory; the backend root is the directory containing this script.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR"
if [[ ! -d "$ROOT/bookings" && -d "$ROOT/0. tests/backend/bookings" ]]; then
  ROOT="$ROOT/0. tests/backend"
fi

printf '\n=== Backend test refactoring audit ===\n'
printf 'Backend root: %s\n' "$ROOT"

python3 - "$ROOT" <<'PY'
from collections import defaultdict
from pathlib import Path
import re
import sys

ROOT = Path(sys.argv[1])
SCAN_DIRS = ("bookings", "events", "venues")
TEST_PATTERN = re.compile(r"\.(?:test|spec)\.tsx?$")
TIMESTAMP = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
IMPORT_LINE = re.compile(r"^\s*import\b|^\s*export\b.*\bfrom\s*['\"]", re.M)
DECLARATION = re.compile(r"^\s*(?:export\s+)?(?:interface|type)\s+(\w+)", re.M)
SETUP = re.compile(r"\b(?:beforeEach|beforeAll|afterEach|afterAll)\s*\(")
MOCK_SETUP = re.compile(r"\b(?:mockResolvedValueOnce|mockResolvedValue|mockReturnValueOnce|mockReturnValue|mockImplementationOnce|mockImplementation)\s*\(")

# Values that are too generic to be useful as extraction candidates.
GENERIC = {
    "GET", "POST", "PUT", "PATCH", "DELETE", "OK", "true", "false",
    "null", "undefined", "json", "application/json", "Content-Type",
    "coffee", "event", "events", "user", "users", "booking", "bookings",
}
MIN_LITERAL_LENGTH = 5


def files_to_scan():
    files = []
    for directory in SCAN_DIRS:
        base = ROOT / directory
        if base.exists():
            files.extend(
                p for p in base.rglob("*")
                if p.is_file() and TEST_PATTERN.search(p.name)
            )
    return sorted(files)


def line_for(source, pos):
    return source.count("\n", 0, pos) + 1


def unique_locations(locations):
    # One entry per file, retaining every matching line number.
    by_file = defaultdict(list)
    for path, line in locations:
        if line not in by_file[path]:
            by_file[path].append(line)
    return by_file


def main():
    files = files_to_scan()
    print(f"Test files scanned: {len(files)}")

    values = defaultdict(list)
    types = defaultdict(list)
    setup_findings = []
    all_type_names = set()

    # This deliberately ignores imports and test descriptions. It extracts
    # quoted literals only from non-import, non-test-title lines.
    literal_re = re.compile(r"""(["'`])((?:\\.|(?!\1).){5,}?)\1""")

    for path in files:
        source = path.read_text(encoding="utf-8")
        relative = path.relative_to(ROOT)
        lines = source.splitlines()

        for match in DECLARATION.finditer(source):
            name = match.group(1)
            all_type_names.add(name)
            types[name].append((str(relative), line_for(source, match.start())))

        setup_lines = []
        mock_lines = []
        for i, line in enumerate(lines, start=1):
            stripped = line.strip()
            if not stripped or stripped.startswith(("//", "*", "/*")):
                continue
            if re.match(r"^(?:import|export)\b", stripped):
                continue
            if re.match(r"^(?:describe|it|test)\s*\(", stripped):
                continue

            if SETUP.search(line):
                setup_lines.append(i)
            if MOCK_SETUP.search(line):
                mock_lines.append(i)

            for match in literal_re.finditer(line):
                value = match.group(2)
                if not value or value.isspace():
                    continue
                if value.strip() != value:
                    continue
                if len(value) < MIN_LITERAL_LENGTH or value in GENERIC:
                    continue
                # Skip probable test descriptions and assertion-message text.
                if re.search(r"\b(?:describe|it|test)\s*\(", line):
                    continue
                # Ignore import-like paths, SQL fragments, and regex-only snippets.
                if value.startswith((".", "/", "@")) and ("/" in value or value.startswith("@")):
                    continue
                if value.startswith(("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "FROM ", "JOIN ")):
                    continue
                if re.fullmatch(r"[\\d\s.*+?^${}()|[\]-]+", value):
                    continue

                category = (
                    "timestamps" if TIMESTAMP.fullmatch(value)
                    else "likely fixture values" if (
                        EMAIL.fullmatch(value)
                        or value in {"Toronto", "Central Park"}
                        or re.search(r"\b(?:Meetup|Conference|Yoga|Coffee|Venue|Event)\b", value)
                        or re.search(r"\b(?:not found|test-api-key|not JSON)\b", value, re.I)
                    )
                    else "other repeated literals"
                )
                values[(category, value)].append((str(relative), i))

        if setup_lines or mock_lines:
            setup_findings.append(
                (str(relative), setup_lines, mock_lines)
            )

    print("\n=== 1. Repeated literals by category ===")
    order = ("timestamps", "likely fixture values", "other repeated literals")
    any_values = False
    for category in order:
        matches = []
        for (cat, value), locations in values.items():
            by_file = unique_locations(locations)
            if cat == category and len(by_file) >= 2:
                matches.append((value, by_file))
        if not matches:
            continue
        any_values = True
        print(f"\n-- {category} --")
        for value, by_file in sorted(matches, key=lambda item: item[0].lower()):
            print(f"  {value!r}")
            for file, line_numbers in sorted(by_file.items()):
                joined = ", ".join(map(str, sorted(line_numbers)))
                print(f"    {file}: lines {joined}")
    if not any_values:
        print("  No repeated literal candidates found.")

    print("\n=== 2. Type/interface declarations ===")
    if types:
        for name, locations in sorted(types.items()):
            print(f"  {name}")
            for file, line in locations:
                print(f"    {file}:{line}")
        print("  Review repeated names and similar definitions manually; this script does not compare type structure.")
    else:
        print("  No type/interface declarations found in scanned test files.")
    print("  Note: identical names are reported as candidates, not proof of duplicate definitions.")

    print("\n=== 3. Setup and mock patterns ===")
    if setup_findings:
        for file, setup_lines, mock_lines in setup_findings:
            print(f"  {file}")
            if setup_lines:
                print("    setup hooks: lines " + ", ".join(map(str, setup_lines)))
            if mock_lines:
                print("    mock setup: lines " + ", ".join(map(str, mock_lines)))
    else:
        print("  No setup/mock patterns found.")

    print("\n=== 4. Safety ===")
    print("Read-only audit: no project files were modified.")
    print("Heuristic results require manual review; object-shape similarity is not analyzed.")


main()
PY
