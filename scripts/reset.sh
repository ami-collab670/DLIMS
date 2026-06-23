#!/usr/bin/env bash
# Remove LSIMS containers and volumes (wipes database). Requires --yes.
# Usage (from repo root):
#   ./scripts/reset.sh --yes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

confirmed=false
for arg in "$@"; do
  if [[ "$arg" == "--yes" ]]; then
    confirmed=true
  fi
done

if [[ "$confirmed" != true ]]; then
  echo "error: this removes all containers and volumes (database will be wiped)." >&2
  echo "Re-run with --yes to confirm: ./scripts/reset.sh --yes" >&2
  exit 1
fi

init_repo_root "$SCRIPT_DIR"

echo "Removing stack and volumes..."
compose down -v
echo "Reset complete. Run ./scripts/setup.sh to bootstrap again."
