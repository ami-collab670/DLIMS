#!/usr/bin/env bash
# Seed LSIMS demo data: CMS content, departments, staff, client service catalog, and workflows.
# Usage: ./scripts/seed-demo.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

init_repo_root "$SCRIPT_DIR"
require_backend_running
wait_for_cms

echo ""
echo "LSIMS demo seed"
echo "==============="

"$SCRIPT_DIR/seed-cms.sh"

SEED_ARGS=(
  -UseDemoFixtures
  -ReplaceCatalog
  -Departments 4
  -Clients 2
  -StaffPerRole 1
  -Jobs 2
  -SamplesPerJob 1
  -Complaints 1
  -Discounts 1
  -Notifications 2
)

if [[ "${1:-}" == "--dry-run" ]]; then
  SEED_ARGS+=(-DryRun)
fi

if command -v pwsh >/dev/null 2>&1; then
  pwsh -NoProfile -ExecutionPolicy Bypass -File "$SCRIPT_DIR/seed-api.ps1" "${SEED_ARGS[@]}"
elif command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$SCRIPT_DIR/seed-api.ps1" "${SEED_ARGS[@]}"
else
  echo "error: PowerShell (pwsh) is required to run seed-api.ps1 on this platform." >&2
  exit 1
fi
