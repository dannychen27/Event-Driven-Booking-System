#!/usr/bin/env python3
"""Read-only audit of TypeScript backend tests for refactoring opportunities."""

from collections import defaultdict
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
SCAN_DIRS = ("bookings", "events", "venues")
TEST_PATTERN = re.compile(r"\.(?:test|spec)\.tsx?$")

# Potentially useful literal values; common trivial values are excluded.
LITERAL_PATTERN = re.compile(
    r"""(?P<quote>["'`])(?P<value>[^"'`\n]{3,})(?P=quote)"""
)

TYPE_PATTERN = re.compile(
    r"^\s*(?:export\s+)?(?:interface|type)\s+(\w+)",
    re.MULTILINE,
)

FUNCTION_PATTERN = re.compile(
    r"^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)",
    re.MULTILINE,
)

MOCK_PATTERN = re.compile(
    r"\b(?:beforeEach|beforeAll|mockResolvedValueOnce|mockReturnValueOnce)\b"
)

IGNORE_VALUES = {
    "GET", "POST", "PUT", "PATCH", "DELETE",
    "application/json", "Content-Type",
}


def collect_test_files():
    files = []
    for directory in SCAN_DIRS:
        base = ROOT / directory
        if base.exists():
            files.extend(
                path for path in base.rglob("*")
                if path.is_file() and TEST_PATTERN.search(path.name)
            )
    return sorted(files)


def line_number(source, position):
    return source.count("\n", 0, position) + 1


def main():
    files = collect_test_files()

    if not files:
        print(f"No test files found under: {', '.join(SCAN_DIRS)}")
        return

    print(f"Backend root: {ROOT}")
    print(f"Test files scanned: {len(files)}")

    literal_locations = defaultdict(list)
    type_locations = defaultdict(list)
    function_locations = defaultdict(list)
    reports = []

    for path in files:
        source = path.read_text(encoding="utf-8")
        relative = path.relative_to(ROOT)

        for match in LITERAL_PATTERN.finditer(source):
            value = match.group("value")
            if value not in IGNORE_VALUES:
                literal_locations[value].append(
                    (relative, line_number(source, match.start()))
                )

        for match in TYPE_PATTERN.finditer(source):
            type_locations[match.group(1)].append(
                (relative, line_number(source, match.start()))
            )

        for match in FUNCTION_PATTERN.finditer(source):
            function_locations[match.group(1)].append(
                (relative, line_number(source, match.start()))
            )

        if len(source.splitlines()) >= 150:
            reports.append(
                f"  Review long test file ({len(source.splitlines())} lines): "
                f"{relative}"
            )

        if MOCK_PATTERN.search(source):
            reports.append(f"  Review repeated setup/mock patterns: {relative}")

    print("\n=== 1. Repeated string literals across files ===")
    found = False
    for value, locations in sorted(literal_locations.items()):
        unique_files = {str(path) for path, _ in locations}
        if len(unique_files) >= 2:
            found = True
            print(f"\n  {value!r} ({len(unique_files)} files)")
            for path, line in locations:
                print(f"    {path}:{line}")
    if not found:
        print("  No cross-file repeated string literals found.")

    print("\n=== 2. Repeated type/interface names ===")
    found = False
    for name, locations in sorted(type_locations.items()):
        if len(locations) >= 2:
            found = True
            print(f"\n  {name}")
            for path, line in locations:
                print(f"    {path}:{line}")
    if not found:
        print("  No repeated type/interface names found.")

    print("\n=== 3. Repeated function names ===")
    found = False
    for name, locations in sorted(function_locations.items()):
        if len(locations) >= 2:
            found = True
            print(f"\n  {name}")
            for path, line in locations:
                print(f"    {path}:{line}")
    if not found:
        print("  No repeated function names found.")

    print("\n=== 4. Files worth a manual look ===")
    if reports:
        for report in reports:
            print(report)
    else:
        print("  No long files or setup/mock patterns flagged.")

    print("\nAudit complete. No files were modified.")
    print("Note: findings are heuristics, not automatic extraction recommendations.")


if __name__ == "__main__":
    main()
