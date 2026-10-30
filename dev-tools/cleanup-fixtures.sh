#!/bin/bash
set -euo pipefail

ROOT="0. tests"

if [[ ! -d "$ROOT" ]]; then
    echo "Error: '$ROOT' was not found. Run from the repository root."
    exit 1
fi

echo "===== 1. FIX SHARED FIXTURE IMPORT PATHS ====="

for file in \
    "$ROOT/frontend/fixtures/bookings/bookingFixtures.ts" \
    "$ROOT/backend/fixtures/bookings/bookingHistoryFixtures.ts"
do
    if [[ -f "$file" ]]; then
        perl -0pi -e \
          's{from ([\x27\x22])\.\./\.\./fixtures/bookings/bookingFixtures\1}{from $1../../../fixtures/bookings/bookingFixtures$1}g' \
          "$file"
        echo "Checked: $file"
    else
        echo "Not found (skipped): $file"
    fi
done

echo
echo "===== 2. FIXTURE FILE INVENTORY ====="
find "$ROOT" -type f -iname '*fixture*.ts' -print | sort

echo
echo "===== 3. FIXTURE IMPORTS ====="
grep -R -n -E 'from .*fixtures/|export \{' \
    "$ROOT" --include='*.ts' || true

echo
echo "===== 4. OLD FIXTURE PATH REFERENCES ====="
grep -R -n -E \
  'fixtures/(bookingHistoryFixtures|errorMessageFixtures|sharedTestFixtures|eventSearchFixtures|eventFixtures|venueFixtures|geminiClientConfigFixture|geminiTestConstants|bookingFixtures|bookingServiceFixtures)' \
  "$ROOT" --include='*.ts' || true

echo
echo "===== 5. BACKEND SCRIPTS ====="
if [[ -f "4. backend/package.json" ]]; then
    node -e "const p=require('./4. backend/package.json'); console.log(JSON.stringify(p.scripts,null,2))"
fi

echo
echo "===== 6. GIT STATUS ====="
git --no-pager status --short

echo
echo "Inspection finished."
