#!/usr/bin/env bash
set -euo pipefail

# Read-only backend test refactoring candidate analyzer.
# Usage:
#   bash refactor-test-candidates.sh
#   bash refactor-test-candidates.sh "0. tests/backend"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -ge 1 ]]; then
  BACKEND_ROOT="$1"
  if [[ "$BACKEND_ROOT" != /* ]]; then
    BACKEND_ROOT="$SCRIPT_DIR/$BACKEND_ROOT"
  fi
else
  BACKEND_ROOT="$SCRIPT_DIR/0. tests/backend"
fi

if [[ ! -d "$BACKEND_ROOT" ]]; then
  printf 'ERROR: Backend test directory not found:\n%s\n' "$BACKEND_ROOT" >&2
  printf 'Usage: bash refactor-test-candidates.sh "0. tests/backend"\n' >&2
  exit 1
fi

export BACKEND_ROOT

printf '\n=== Backend Test Refactoring Audit ===\n'
python3 - <<'PY'
import ast
import os
import re
from collections import defaultdict
from pathlib import Path

root = Path(os.environ["BACKEND_ROOT"]).resolve()

# Limit the audit to the principal backend test areas.
scan_dirs = [
    root / "bookings",
    root / "events",
    root / "venues",
]

files = []
for directory in scan_dirs:
    if directory.is_dir():
        files.extend(directory.rglob("*.test.ts"))

files = sorted(set(files))

print(f"Backend root: {root}")
print(f"Test files scanned: {len(files)}")
print("Mode: read-only; no project files are modified.")

if not files:
    print("\nNo *.test.ts files found in bookings/, events/, or venues/.")
    raise SystemExit(0)


def relative(path):
    return str(path.relative_to(root))


def line_number(lines, index):
    return index + 1


# ---------------------------------------------------------------------
# 1. Repeated literals
# ---------------------------------------------------------------------

# Each value maps to file -> line numbers. Only report values occurring
# in at least two distinct files, to emphasize cross-file reuse.
literal_occurrences = defaultdict(lambda: defaultdict(list))

timestamp_re = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$"
)

path_like_re = re.compile(
    r"^(?:\.{0,2}/|@/|src/|dist/|node_modules/|https?://)"
)

sql_like_re = re.compile(
    r"\b(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE TABLE)\b",
    re.IGNORECASE,
)

generic_values = {
    "true", "false", "null", "undefined", "string", "number",
    "object", "function", "default", "success", "error",
    "GET", "POST", "PUT", "PATCH", "DELETE",
}

# Capture quoted string literals. This intentionally remains heuristic;
# it does not attempt to parse all TypeScript syntax.
string_re = re.compile(
    r"""(?P<quote>['"`])(?P<value>(?:\\.|(?!\1).)*?)(?P=quote)"""
)

for path in files:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

    for index, line in enumerate(lines):
        stripped = line.strip()

        # Ignore test names, imports, exports, and comments.
        if re.match(r"^(?:import|export)\b", stripped):
            continue
        if re.match(r"^(?:describe|it|test)(?:\.\w+)?\s*\(", stripped):
            continue
        if stripped.startswith(("//", "/*", "*", "*/")):
            continue

        # Remove inline comments approximately, without trying to parse
        # comment markers inside every possible string form.
        for match in string_re.finditer(line):
            value = match.group("value")
            quote = match.group("quote")

            # Template strings containing interpolation are dynamic.
            if quote == "`" and "${" in value:
                continue

            # Ignore escaped/multiline-like or malformed values.
            if not value or not value.strip():
                continue
            if len(value) < 5:
                continue
            if value != value.strip():
                continue
            if value.lower() in generic_values:
                continue
            if path_like_re.search(value):
                continue
            if sql_like_re.search(value):
                continue
            if value.startswith("^") or value.endswith("$"):
                continue

            # Ignore values that are essentially whitespace.
            if not any(character.isalnum() for character in value):
                continue

            # Store each literal at most once per line/file.
            literal_occurrences[value][relative(path)].append(index + 1)


def literal_category(value):
    if timestamp_re.fullmatch(value):
        return "timestamps"

    if (
        value.startswith("test-")
        or value in {
            "Coffee Meetup",
            "Outdoor Yoga",
            "Central Park",
            "Meet and Greet",
            "Moss Park Espresso",
        }
        or re.search(r"\b(?:not found|not JSON)\b", value, re.IGNORECASE)
    ):
        return "likely fixture values"

    return "other repeated literals"


categories = defaultdict(list)

for value, locations in literal_occurrences.items():
    # Require cross-file repetition, not just many occurrences in one file.
    if len(locations) < 2:
        continue

    category = literal_category(value)
    categories[category].append((value, locations))

print("\n=== 1. Repeated literals ===")

for category in (
    "timestamps",
    "likely fixture values",
    "other repeated literals",
):
    print(f"\n-- {category} --")
    entries = sorted(categories.get(category, []), key=lambda item: item[0])

    if not entries:
        print("  None found.")
        continue

    for value, locations in entries:
        print(f"  {value!r}")
        for filename, line_numbers in sorted(locations.items()):
            unique_lines = sorted(set(line_numbers))
            print(f"    {filename}: lines {', '.join(map(str, unique_lines))}")


# ---------------------------------------------------------------------
# 2. Type and interface declarations
# ---------------------------------------------------------------------

type_declarations = defaultdict(lambda: defaultdict(list))

type_re = re.compile(
    r"^\s*(?:export\s+)?(?:declare\s+)?"
    r"(?:type|interface)\s+([A-Za-z_$][\w$]*)\b"
)

for path in files:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

    for index, line in enumerate(lines):
        match = type_re.match(line)
        if match:
            name = match.group(1)
            kind = "interface" if re.search(r"\binterface\b", line) else "type"
            type_declarations[name][relative(path)].append(
                (index + 1, kind)
            )

print("\n=== 2. Type/interface declarations ===")

if not type_declarations:
    print("  No type/interface declarations found in scanned test files.")
else:
    for name, locations in sorted(type_declarations.items()):
        print(f"  {name}")
        for filename, declarations in sorted(locations.items()):
            for lineno, kind in declarations:
                print(f"    {filename}:{lineno} ({kind})")

    duplicate_names = {
        name: locations
        for name, locations in type_declarations.items()
        if len(locations) > 1
    }

    print("\n  Names declared in multiple files:")
    if not duplicate_names:
        print("    None found.")
    else:
        for name, locations in sorted(duplicate_names.items()):
            print(f"    {name}: {', '.join(sorted(locations))}")

print(
    "  Note: declarations are reported as candidates, not proof "
    "that their definitions are interchangeable."
)


# ---------------------------------------------------------------------
# 3. Repeated object-literal key shapes
# ---------------------------------------------------------------------

# A heuristic scanner for simple object literal blocks. It collects
# property names from lines like "id: 1," and reports matching key sets.
# It does not rewrite or modify code.
shape_occurrences = defaultdict(list)

property_re = re.compile(
    r"^\s*([A-Za-z_$][\w$]*)\s*:"
)

for path in files:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    stack = []

    for index, line in enumerate(lines):
        # Start a candidate object at a line containing a standalone "{"
        # or a common object initializer / return-object pattern.
        if "{" in line:
            prefix, _, _ = line.partition("{")
            if (
                not prefix.strip()
                or re.search(
                    r"(?:=\s*|return\s+|=>\s*|:\s*)$",
                    prefix,
                )
            ):
                stack.append({
                    "start": index + 1,
                    "keys": set(),
                    "depth": 1,
                })

        # Record property names in all currently open candidates.
        property_match = property_re.match(line)
        if property_match:
            for candidate in stack:
                candidate["keys"].add(property_match.group(1))

        # Update approximate brace depth. This is deliberately
        # conservative and ignores braces inside quoted strings.
        # False positives are acceptable for an audit report.
        opens = line.count("{")
        closes = line.count("}")

        for candidate in stack:
            candidate["depth"] += opens - closes

        completed = [c for c in stack if c["depth"] <= 0]
        for candidate in completed:
            keys = candidate["keys"]
            if len(keys) >= 3:
                shape = tuple(sorted(keys))
                shape_occurrences[shape].append(
                    (relative(path), candidate["start"])
                )
            stack.remove(candidate)

    # Report unclosed candidates only if they have a useful key set.
    for candidate in stack:
        if len(candidate["keys"]) >= 3:
            shape = tuple(sorted(candidate["keys"]))
            shape_occurrences[shape].append(
                (relative(path), candidate["start"])
            )

print("\n=== 3. Repeated object-literal key shapes ===")

repeated_shapes = [
    (shape, locations)
    for shape, locations in shape_occurrences.items()
    if len(locations) >= 2
]

if not repeated_shapes:
    print("  No repeated object shapes detected by the heuristic scanner.")
else:
    repeated_shapes.sort(
        key=lambda item: (-len(item[1]), item[0])
    )

    for shape, locations in repeated_shapes[:50]:
        print(f"  Keys: {', '.join(shape)}")
        for filename, lineno in sorted(locations):
            print(f"    {filename}:{lineno}")

    if len(repeated_shapes) > 50:
        print(f"  ... {len(repeated_shapes) - 50} additional shapes omitted.")

print(
    "  Note: similar keys do not prove that objects have the same "
    "meaning or should become one fixture."
)


# ---------------------------------------------------------------------
# 4. Setup hooks and mock patterns
# ---------------------------------------------------------------------

setup_re = re.compile(
    r"\b(?:beforeEach|beforeAll|afterEach|afterAll)\s*\("
)
mock_re = re.compile(
    r"\b(?:jest\.mock|jest\.fn|jest\.spyOn|mockResolvedValue|"
    r"mockRejectedValue|mockImplementation|mockReturnValue|"
    r"mockResolvedValueOnce|mockRejectedValueOnce)\b"
)

print("\n=== 4. Setup and mock patterns ===")

any_patterns = False

for path in files:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    setup_lines = []
    mock_lines = []

    for index, line in enumerate(lines):
        if setup_re.search(line):
            setup_lines.append(index + 1)
        if mock_re.search(line):
            mock_lines.append(index + 1)

    if setup_lines or mock_lines:
        any_patterns = True
        print(f"  {relative(path)}")
        if setup_lines:
            print(f"    setup hooks: lines {', '.join(map(str, setup_lines))}")
        if mock_lines:
            print(f"    mock patterns: lines {', '.join(map(str, mock_lines))}")

if not any_patterns:
    print("  No setup hooks or mock patterns found.")


# ---------------------------------------------------------------------
# 5. Safety summary
# ---------------------------------------------------------------------

print("\n=== 5. Safety ===")
print("Read-only audit: no project files were modified.")
print("All results are heuristic candidates requiring manual review.")
print("No imports, fixtures, types, or tests were automatically rewritten.")
print("\n=== Audit complete ===")
PY
