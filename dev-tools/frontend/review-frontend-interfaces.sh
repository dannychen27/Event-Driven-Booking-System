#!/usr/bin/env bash
set -euo pipefail

# Find interface declarations in the frontend source for manual review.
# Run: bash dev-tools/frontend/review-frontend-interfaces.sh
#
# AI assistance disclosure:
# Developed and refined with AI assistance. The author reviewed
# the implementation and verified its behavior.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND="$REPO_ROOT/3. frontend/src"

if [[ ! -d "$FRONTEND" ]]; then
  printf 'ERROR: Frontend source directory not found: %s\n' "$FRONTEND" >&2
  exit 1
fi

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
