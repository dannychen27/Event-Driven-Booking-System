#!/bin/bash
set -euo pipefail


# TODO: Generalize this script into a reusable file-organization utility.
#
# Areas to improve:
#
# 1. Configuration
#    - Make ROOT, SOURCE, DEST, and FILES configurable.
#    - Separate the file-move configuration from the execution logic.
#
# 2. Validation
#    - Verify all source files exist before making changes.
#    - Prevent accidental overwrites or conflicting destinations.
#    - Consider validating the entire move plan before execution.
#
# 3. Execution
#    - Make file moves configurable rather than hardcoded.
#    - Consider supporting multiple source and destination directories.
#
# 4. Cleanup
#    - Remove old directories only when they are empty.
#    - Consider making directory cleanup optional.
#
# 5. Reporting
#    - Report planned moves before executing them.
#    - Summarize completed moves, skipped files, and errors.
#
# Future goal:
#    Separate configuration (what to move) from the engine
#    (validation, execution, cleanup, and reporting) so this
#    script can be reused for other file-organization tasks.

ROOT="0. tests/backend/events"
SOURCE="$ROOT/event-queries"
DEST="$ROOT/search"

FILES=(
  "getAllEvents.test.ts"
  "getAvailability.test.ts"
  "getEvent.test.ts"
  "searchEvents.test.ts"
)

# Validate the expected source files before making changes.
for file in "${FILES[@]}"; do
  if [[ ! -f "$SOURCE/$file" ]]; then
    echo "ERROR: Expected source file not found: $SOURCE/$file"
    exit 1
  fi
done

if [[ ! -f "$ROOT/searchEventsController.test.ts" ]]; then
  echo "ERROR: searchEventsController.test.ts not found in $ROOT"
  exit 1
fi

if [[ -e "$DEST" ]]; then
  echo "ERROR: Destination already exists: $DEST"
  echo "Inspect it before running this script again."
  exit 1
fi

echo "===== ORGANIZING EVENT TESTS ====="

mkdir -p "$DEST"

# Move general event-query tests into the events/ root.
for file in "${FILES[@]:0:3}"; do
  mv "$SOURCE/$file" "$ROOT/$file"
  echo "Moved: $file -> events/"
done

# Move search-specific tests into events/search/.
mv "$SOURCE/searchEvents.test.ts" "$DEST/searchEvents.test.ts"
mv "$ROOT/searchEventsController.test.ts" "$DEST/searchEventsController.test.ts"

echo "Moved: searchEvents.test.ts -> events/search/"
echo "Moved: searchEventsController.test.ts -> events/search/"

# Remove the old directory if it is now empty.
rmdir "$SOURCE"

echo
echo "===== RESULTING STRUCTURE ====="
find "$ROOT" -maxdepth 2 -type f -name '*.test.ts' | sort

echo
echo "===== COMPLETE ====="
