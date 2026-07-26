#!/usr/bin/env bash
# Populate Strapi CMS with demo content.
# Usage: ./scripts/seed-cms.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

init_repo_root "$SCRIPT_DIR"
require_backend_running
wait_for_cms

echo ">>> Seeding CMS content..."
seed_cms
echo "CMS seed complete."
