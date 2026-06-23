#!/usr/bin/env bash
# Follow LSIMS container logs.
# Usage (from repo root):
#   ./scripts/logs.sh
#   ./scripts/logs.sh backend

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

init_repo_root "$SCRIPT_DIR"

compose logs -f "$@"
