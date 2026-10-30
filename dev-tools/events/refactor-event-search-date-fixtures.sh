```bash
cat > repair-event-search-date-fixtures.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

ROOT="0. tests/backend"
FIXTURE="$ROOT/fixtures/eventSearchFixtures.ts"

printf '\n=== Verify existing fixture ===\n'
if [[ ! -f "$FIXTURE" ]]; then
  echo "ERROR: Fixture file not found: $FIXTURE" >&2
  exit 1
fi
cat "$FIXTURE"

FILES=(
  "$ROOT/events/event-queries/searchEvents.test.ts"
  "$ROOT/events/natural-language-search/naturalLanguageSearchService.test.ts"
  "$ROOT/events/natural-language-search/validateNaturalLanguageSearchPlan.test.ts"
  "$ROOT/events/natural-language-search/validateSearchFilters.test.ts"
)

for file in "${FILES[@]}"; do
  if [[ ! -f "$file" ]] || ! grep -q 'SEARCH_START_BOUNDARY' "$file"; then
    echo "ERROR: Missing file or expected fixture import: $file" >&2
    exit 1
  fi
done

printf '\n=== Back up test files ===\n'
BACKUP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/event-search-fixtures.XXXXXX")"
for file in "${FILES[@]}"; do
  cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
done
printf 'Backups: %s\n' "$BACKUP_DIR"

printf '\n=== Replace date literals ===\n'
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
    text = path.read_text()
    for literal, constant in replacements.items():
        text = text.replace(literal, constant)
    path.write_text(text)
    print(f"Updated: {path}")
PY

printf '\n=== Remaining timestamp literals ===\n'
grep -n -E \
  '2026-10-24T00:00:00Z|2026-10-26T00:00:00Z|2026-10-27T00:00:00Z' \
  "${FILES[@]}" || true

printf '\n=== Review diff ===\n'
git --no-pager diff -- "${FILES[@]}"

printf '\n=== Complete ===\n'
printf 'Review the diff and check for unused imports before running tests.\n'
BASH

chmod +x repair-event-search-date-fixtures.sh
./repair-event-search-date-fixtures.sh
```