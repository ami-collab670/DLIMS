#!/usr/bin/env bash
# Create or update an LSIMS user via Docker (no local Python required).
# Usage (from repo root):
#   ./scripts/create-user.sh --email admin@ministry.gov --password AdminPass123! --role admin

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

init_repo_root "$SCRIPT_DIR"
require_backend_running

if [[ $# -eq 0 ]]; then
  compose exec backend python manage.py create_user --help
  exit $?
fi

compose exec backend python manage.py create_user "$@"
