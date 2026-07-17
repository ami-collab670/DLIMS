#!/usr/bin/env bash
# Shared helpers for LSIMS Docker dev scripts (Mac / Linux / Git Bash).

set -euo pipefail

LSIMS_DEFAULT_ADMIN_EMAIL="${LSIMS_ADMIN_EMAIL:-admin@ministry.gov}"
LSIMS_DEFAULT_ADMIN_PASSWORD="${LSIMS_ADMIN_PASSWORD:-AdminPass123!}"

find_repo_root() {
  local dir="${1:?start directory required}"
  dir="$(cd "$dir" && pwd)"
  while [[ -n "$dir" && "$dir" != "/" ]]; do
    if [[ -f "$dir/docker-compose.yml" ]]; then
      printf '%s\n' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

require_docker() {
  # Deprecated alias — init_repo_root calls ensure_docker.
  ensure_docker
}

init_repo_root() {
  local script_dir="${1:?script directory required}"
  # shellcheck source=install-docker.sh
  source "$script_dir/lib/install-docker.sh"
  ensure_docker
  LSIMS_REPO_ROOT="$(find_repo_root "$script_dir")" || {
    echo "error: could not find docker-compose.yml. Run this script from the repository." >&2
    exit 1
  }
  cd "$LSIMS_REPO_ROOT"
}

compose() {
  docker compose "$@"
}

require_backend_running() {
  if [[ -z "$(compose ps -q backend 2>/dev/null || true)" ]]; then
    echo "error: backend container is not running. Start the stack first:" >&2
    echo "  ./scripts/setup.sh   (first time)" >&2
    echo "  ./scripts/start.sh   (daily dev)" >&2
    exit 1
  fi

  if [[ -z "$(compose ps --status running -q backend 2>/dev/null || true)" ]]; then
    echo "error: backend container is not running. Start the stack first:" >&2
    echo "  ./scripts/setup.sh   (first time)" >&2
    echo "  ./scripts/start.sh   (daily dev)" >&2
    exit 1
  fi
}

wait_for_backend() {
  local timeout="${1:-120}"
  local elapsed=0

  echo "Waiting for backend to be ready (timeout ${timeout}s)..."
  while ! compose exec -T backend python manage.py check >/dev/null 2>&1; do
    if (( elapsed >= timeout )); then
      echo "error: backend did not become ready within ${timeout}s." >&2
      echo "Check logs: ./scripts/logs.sh backend" >&2
      exit 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  echo "Backend is ready."
}

print_dev_urls() {
  cat <<EOF

LSIMS is running:
  Frontend:  http://localhost:5173
  CMS Admin: http://localhost:1337/admin
  API:       http://localhost:8000
  pgAdmin:   http://localhost:5050

Default login:
  Email:     ${LSIMS_DEFAULT_ADMIN_EMAIL}
  Password:  ${LSIMS_DEFAULT_ADMIN_PASSWORD}

Note: First frontend/cms start runs npm ci inside Docker and may take several minutes.
On first CMS visit, create a Strapi admin account at http://localhost:1337/admin
If the cms database is missing on an existing Postgres volume, run:
  CREATE DATABASE cms;
via pgAdmin, or reset with: docker compose down -v
EOF
}

seed_roles() {
  compose exec -T backend python manage.py seed_roles
}

create_default_admin() {
  compose exec -T backend python manage.py create_user \
    --email "$LSIMS_DEFAULT_ADMIN_EMAIL" \
    --password "$LSIMS_DEFAULT_ADMIN_PASSWORD" \
    --role admin
}
