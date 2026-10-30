
#!/usr/bin/env bash
set -euo pipefail

# AI assistance disclosure:
# Developed and refined with AI assistance. The author reviewed the
# implementation and verified its behavior with built-in and manual tests.

# Read-only backend test refactoring candidate analyzer.
# Usage:
#   bash refactor-test-candidates.sh
#   bash refactor-test-candidates.sh "0. tests/backend"
#   bash refactor-test-candidates.sh "/absolute/path/to/backend/tests"
#   bash refactor-test-candidates.sh --self-test

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

resolve_backend_root() {
  local requested_path="$1"

  if [[ "$requested_path" != /* ]]; then
    requested_path="$REPO_ROOT/$requested_path"
  fi

  printf '%s\n' "$requested_path"
}

if [[ "${1:-}" == "--self-test" ]]; then
  printf '\n=== Shell Path Self-Tests ===\n'

  TEST_ROOT="$(mktemp -d)"
  trap 'rm -rf "$TEST_ROOT"' EXIT

  mkdir -p "$TEST_ROOT/0. tests/backend"

  DEFAULT_ROOT="$(resolve_backend_root "0. tests/backend")"
  EXPECTED_DEFAULT="$REPO_ROOT/0. tests/backend"

  if [[ "$DEFAULT_ROOT" == "$EXPECTED_DEFAULT" ]]; then
    printf 'PASS: Default path resolves from repository root.\n'
  else
    printf 'FAIL: Default path resolution.\n' >&2
    exit 1
  fi

  RELATIVE_ROOT="$(resolve_backend_root "0. tests/backend")"

  if [[ "$RELATIVE_ROOT" == "$DEFAULT_ROOT" ]]; then
    printf 'PASS: Explicit relative path resolves from repository root.\n'
  else
    printf 'FAIL: Explicit relative path resolution.\n' >&2
    exit 1
  fi

  ABSOLUTE_ROOT="$(resolve_backend_root "$TEST_ROOT/0. tests/backend")"

  if [[ "$ABSOLUTE_ROOT" == "$TEST_ROOT/0. tests/backend" ]]; then
    printf 'PASS: Absolute paths remain unchanged.\n'
  else
    printf 'FAIL: Absolute path resolution.\n' >&2
    exit 1
  fi

  INVALID_ROOT="$(resolve_backend_root "$TEST_ROOT/does-not-exist")"

  if [[ ! -d "$INVALID_ROOT" ]]; then
    printf 'PASS: Nonexistent directories are rejected.\n'
  else
    printf 'FAIL: Invalid directory unexpectedly exists.\n' >&2
    exit 1
  fi

  printf '\nAll shell path tests passed.\n'
  exit 0
fi

if [[ $# -ge 1 ]]; then
  BACKEND_ROOT="$(resolve_backend_root "$1")"
else
  BACKEND_ROOT="$(resolve_backend_root "0. tests/backend")"
fi

if [[ ! -d "$BACKEND_ROOT" ]]; then
  printf 'ERROR: Backend test directory not found:\n%s\n' "$BACKEND_ROOT" >&2
  printf 'Usage: bash refactor-test-candidates.sh "0. tests/backend"\n' >&2
  exit 1
fi

export BACKEND_ROOT

printf '\n=== Backend Test Refactoring Audit ===\n'

python3 - <<'PY'
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


# ---------------------------------------------------------------------
# 1. Repeated literals
# ---------------------------------------------------------------------

# Each value maps to file -> unique line numbers. Only report values
# occurring in at least two distinct files.
literal_occurrences = defaultdict(lambda: defaultdict(set))

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

# Heuristic string-literal scanner; not a complete TypeScript parser.
string_re = re.compile(
    r"""(?P<quote>['"`])(?P<value>(?:\\.|(?!\1).)*?)(?P=quote)"""
)

for path in files:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

    for index, line in enumerate(lines):
        stripped = line.strip()

        if re.match(r"^(?:import|export)\b", stripped):
            continue
        if re.match(r"^(?:describe|it|test)(?:\.\w+)?\s*\(", stripped):
            continue
        if stripped.startswith(("//", "/*", "*", "*/")):
            continue

        for match in string_re.finditer(line):
            value = match.group("value")
            quote = match.group("quote")

            if quote == "`" and "${" in value:
                continue
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
            if not any(character.isalnum() for character in value):
                continue

            literal_occurrences[value][relative(path)].add(index + 1)


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
    if len(locations) >= 2:
        categories[literal_category(value)].append((value, locations))

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
            print(
                f"    {filename}: lines "
                f"{', '.join(map(str, sorted(line_numbers)))}"
            )


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

# Heuristic scanner for simple object-literal blocks.
# Braces inside strings and comments are ignored.
# Nested objects can still produce overlapping candidate shapes.


def scan_braces(line, state):
    """Return code brace events while tracking strings and block comments."""
    events = []
    index = 0

    while index < len(line):
        if state["block_comment"]:
            end = line.find("*/", index)
            if end == -1:
                return events

            state["block_comment"] = False
            index = end + 2
            continue

        quote = state["quote"]

        if quote:
            if line[index] == "\\":
                index += 2
                continue

            if line[index] == quote:
                state["quote"] = None

            index += 1
            continue

        if line.startswith("//", index):
            break

        if line.startswith("/*", index):
            state["block_comment"] = True
            index += 2
            continue

        character = line[index]

        if character in ("'", '"', "`"):
            state["quote"] = character
        elif character in ("{", "}"):
            events.append((index, character))

        index += 1

    # Ordinary single/double-quoted strings should not span lines.
    if state["quote"] in ("'", '"'):
        state["quote"] = None

    return events


def run_scanner_self_tests():
    """Exercise brace scanning against representative regression cases."""
    test_cases = [
        (
            "braces inside single-quoted strings",
            """const value = '{ ignored }';""",
            [],
        ),
        (
            "braces inside double-quoted strings",
            """const value = "{ ignored }";""",
            [],
        ),
        (
            "braces inside template strings",
            """const value = ` { ignored } `;""",
            [],
        ),
        (
            "braces inside line comments",
            "const value = 1; // { ignored }",
            [],
        ),
        (
            "braces inside block comments",
            "/* { ignored } */ const value = 1;",
            [],
        ),
    ]

    for name, source, expected in test_cases:
        state = {"quote": None, "block_comment": False}
        actual = scan_braces(source, state)

        if actual != expected:
            raise AssertionError(
                f"{name}: expected {expected!r}, got {actual!r}"
            )

        print(f"  PASS: {name}")

    # Verify that actual object braces are detected at their source offsets.
    source = "const value = { id: 1 };"
    state = {"quote": None, "block_comment": False}

    expected = [
        (index, character)
        for index, character in enumerate(source)
        if character in ("{", "}")
    ]

    actual = scan_braces(source, state)

    if actual != expected:
        raise AssertionError(
            f"simple object: expected {expected!r}, got {actual!r}"
        )

    print("  PASS: simple object braces detected")

    # Verify nested object braces balance.
    source = "const value = { nested: { id: 1 } };"
    state = {"quote": None, "block_comment": False}
    events = scan_braces(source, state)

    depth = 0
    for _, event in events:
        depth += 1 if event == "{" else -1

    if depth != 0:
        raise AssertionError(
            f"Nested braces did not balance: final depth {depth}"
        )

    if depth < 0:
        raise AssertionError("Nested braces closed before opening.")

    print("  PASS: nested braces balance correctly")

    # Verify that block-comment state persists across lines.
    state = {"quote": None, "block_comment": False}

    first = scan_braces("/* comment starts {", state)
    second = scan_braces("still a comment } */", state)

    if first or second or state["block_comment"]:
        raise AssertionError("Multiline block comment was not ignored.")

    print("  PASS: multiline block comments")


print("\n=== Brace Scanner Self-Tests ===")
run_scanner_self_tests()


shape_occurrences = defaultdict(list)
property_re = re.compile(r"^\s*([A-Za-z_$][\w$]*)\s*:")

for path in files:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    stack = []
    state = {
        "quote": None,
        "block_comment": False,
    }

    for index, line in enumerate(lines):
        events = scan_braces(line, state)

        property_match = property_re.match(line)
        if property_match:
            for candidate in stack:
                candidate["keys"].add(property_match.group(1))

        for position, event in events:
            if event == "{":
                prefix = line[:position]

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
                        "depth": 0,
                    })

                for candidate in stack:
                    candidate["depth"] += 1

            else:
                for candidate in stack:
                    candidate["depth"] -= 1

                completed = [
                    candidate
                    for candidate in stack
                    if candidate["depth"] <= 0
                ]

                for candidate in completed:
                    keys = candidate["keys"]

                    if len(keys) >= 3:
                        shape = tuple(sorted(keys))
                        shape_occurrences[shape].append(
                            (relative(path), candidate["start"])
                        )

                    stack.remove(candidate)

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
