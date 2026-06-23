#!/usr/bin/env bash
# Show LSIMS container status and dev URLs.
# Usage (from repo root):
#   ./scripts/status.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

init_repo_root "$SCRIPT_DIR"

compose ps
print_dev_urls
