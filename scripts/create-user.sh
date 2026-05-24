#!/usr/bin/env bash
# Create or update an LSIMS user via Docker (no local Python required).
# Usage (from repo root):
#   ./scripts/create-user.sh --email admin@ministry.gov --password AdminPass123! --role admin

set -euo pipefail

find_repo_root() {
  local dir
  dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  while [[ -n "$dir" && "$dir" != "/" ]]; do
    if [[ -f "$dir/docker-compose.yml" ]]; then
      printf '%s\n' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is not installed or not on PATH." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "error: docker compose is not available." >&2
  exit 1
fi

repo_root="$(find_repo_root)" || {
  echo "error: could not find docker-compose.yml. Run this script from the repository." >&2
  exit 1
}

cd "$repo_root"

if [[ -z "$(docker compose ps -q backend 2>/dev/null || true)" ]]; then
  echo "error: backend container is not running. Start the stack first: docker compose up -d" >&2
  exit 1
fi

if [[ -z "$(docker compose ps --status running -q backend 2>/dev/null || true)" ]]; then
  echo "error: backend container is not running. Start the stack first: docker compose up -d" >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  docker compose exec backend python manage.py create_user --help
  exit $?
fi

docker compose exec backend python manage.py create_user "$@"
