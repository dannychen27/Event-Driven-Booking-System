#!/bin/bash
set -euo pipefail

# Run from the repository root.
# Purpose: Find interface declarations in the frontend for review
# before converting object-shaped interfaces to type aliases.

FRONTEND="3. frontend/src"

printf '%s\n' "=== Interfaces in frontend source ==="

find "$FRONTEND" -type f \( -name '*.ts' -o -name '*.tsx' \) \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -not -name '*.d.ts' \
  -print0 |
while IFS= read -r -d '' file; do
  grep -n -E '^[[:space:]]*(export[[:space:]]+)?(declare[[:space:]]+)?interface[[:space:]]+' "$file" \
    && printf '  File: %s\n' "$file" || true
done

printf '\n%s\n' "=== No files were modified ==="
printf '%s\n' "Review the declarations before choosing which ones to convert."
