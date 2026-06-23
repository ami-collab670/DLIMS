#!/usr/bin/env bash
# Stop LSIMS dev stack.
# Usage (from repo root):
#   ./scripts/stop.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

init_repo_root "$SCRIPT_DIR"

echo "Stopping stack..."
compose down
