#!/usr/bin/env bash
set -euo pipefail

ROOT="0. tests/backend"
FIXTURE="$ROOT/fixtures/eventSearchFixtures.ts"

printf '\n=== Verify existing fixture ===\n'
if [[ ! -f "$FIXTURE" ]]; then
  echo "ERROR: Fixture not found: $FIXTURE" >&2
  exit 1
fi
cat "$FIXTURE"

FILES=(
  "$ROOT/events/event-queries/searchEvents.test.ts"
  "$ROOT/events/natural-language-search/naturalLanguageSearchService.test.ts"
  "$ROOT/events/natural-language-search/validateNaturalLanguageSearchPlan.test.ts"
  "$ROOT/events/natural-language-search/validateSearchFilters.test.ts"
)

printf '\n=== Verify target files and imports ===\n'
for file in "${FILES[@]}"; do
  if [[ ! -f "$file" ]] || ! grep -q 'SEARCH_START_BOUNDARY' "$file"; then
    echo "ERROR: Missing target file or expected fixture import: $file" >&2
    exit 1
  fi
  printf 'OK: %s\n' "$file"
done

printf '\n=== Back up target files ===\n'
BACKUP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/event-search-fixtures.XXXXXX")"
for file in "${FILES[@]}"; do
  cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
done
printf 'Backups saved to: %s\n' "$BACKUP_DIR"

printf '\n=== Replace repeated timestamp literals ===\n'
python3 - "${FILES[@]}" <<'PY'
from pathlib import Path
import sys

replacements = {
    '"2026-10-24T00:00:00Z"': "SEARCH_START_BOUNDARY",
    "'2026-10-24T00:00:00Z'": "SEARCH_START_BOUNDARY",
    '"2026-10-26T00:00:00Z"': "SEARCH_END_BOUNDARY",
    "'2026-10-26T00:00:00Z'": "SEARCH_END_BOUNDARY",
    '"2026-10-27T00:00:00Z"': "SEARCH_LATER_BOUNDARY",
    "'2026-10-27T00:00:00Z'": "SEARCH_LATER_BOUNDARY",
}

for filename in sys.argv[1:]:
    path = Path(filename)
    content = path.read_text()
    for literal, constant in replacements.items():
        content = content.replace(literal, constant)
    path.write_text(content)
    print(f"Updated: {path}")
PY

printf '\n=== Check remaining timestamp literals ===\n'
if grep -n -E \
  '2026-10-24T00:00:00Z|2026-10-26T00:00:00Z|2026-10-27T00:00:00Z' \
  "${FILES[@]}"; then
  echo "Review the remaining matches above."
else
  echo "No matching timestamp literals remain in the four target files."
fi

printf '\n=== Review test-file diff ===\n'
git --no-pager diff -- "${FILES[@]}"

printf '\n=== Finished editing; tests not run ===\n'
echo "Review the diff and check for unused fixture imports before testing."
