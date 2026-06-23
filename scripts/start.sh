#!/usr/bin/env bash
# Start LSIMS dev stack in foreground (live logs). Ctrl+C stops containers.
# Usage (from repo root):
#   ./scripts/start.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

init_repo_root "$SCRIPT_DIR"

print_dev_urls
echo ""
echo "Starting stack (Ctrl+C to stop)..."
compose up --build
