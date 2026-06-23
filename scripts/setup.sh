#!/usr/bin/env bash
# First-time LSIMS bootstrap: pull images, build, start stack, seed roles, create admin.
# Usage (from repo root):
#   Mac/Linux: ./scripts/setup.sh
#   Windows:   .\scripts\setup.ps1   OR   .\scripts\setup.bat

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

init_repo_root "$SCRIPT_DIR"

echo ">>> Pulling Docker images..."
compose pull

echo ">>> Building containers..."
compose build

echo ">>> Starting stack in background..."
compose up -d

wait_for_backend 120

echo ">>> Seeding roles..."
seed_roles

echo ">>> Creating default admin user..."
create_default_admin

print_dev_urls
echo ""
echo "Setup complete. Run ./scripts/start.sh for daily development (foreground logs)."
