#!/usr/bin/env bash
set -euo pipefail

# scripts/collect_test_artifacts.sh
# Runs the Django test suite and collects basic artifacts into ./test-artifacts/
# Usage: ./scripts/collect_test_artifacts.sh

ARTIFACTS_DIR="./test-artifacts"
mkdir -p "$ARTIFACTS_DIR"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
LOG="$ARTIFACTS_DIR/test-run-$TIMESTAMP.log"

echo "Starting test run at $TIMESTAMP" | tee -a "$LOG"

# Helper to safe-run and tee output to both console and log
run_and_log() {
  echo "\n>>> $*" | tee -a "$LOG"
  "$@" 2>&1 | tee -a "$LOG"
}

# If a docker-compose file exists, prefer running tests inside the compose environment
if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
  echo "Detected docker-compose file. Bringing up services..." | tee -a "$LOG"
  run_and_log docker compose up -d --build

  # Assumes the backend service is named 'backend' per DEMO.md. Adjust if different.
  echo "Running manage.py test in backend container (service name: backend)..." | tee -a "$LOG"
  run_and_log docker compose exec backend python manage.py test | tee -a "$LOG"

  # Collect backend logs and compose state
  docker compose logs backend > "$ARTIFACTS_DIR/backend-logs-$TIMESTAMP.txt" 2>&1 || true
  docker compose ps > "$ARTIFACTS_DIR/docker-compose-ps-$TIMESTAMP.txt" 2>&1 || true

  # If a sqlite DB file exists at repo root, copy it
  if [ -f db.sqlite3 ]; then
    cp db.sqlite3 "$ARTIFACTS_DIR/db.sqlite3.$TIMESTAMP" || true
  fi

  echo "Docker-compose test run finished. Artifacts in $ARTIFACTS_DIR" | tee -a "$LOG"
  exit 0
fi

# Otherwise run tests locally in a virtualenv
PYTHON=${PYTHON:-python3}
if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "Python not found: $PYTHON" | tee -a "$LOG"
  exit 2
fi

VENV_DIR=".venv_test_artifacts"
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtualenv in $VENV_DIR" | tee -a "$LOG"
  $PYTHON -m venv "$VENV_DIR"
fi

# shellcheck source=/dev/null
source "$VENV_DIR/bin/activate"

echo "Upgrading pip and installing requirements (if present)..." | tee -a "$LOG"
python -m pip install --upgrade pip setuptools wheel 2>&1 | tee -a "$LOG"
if [ -f requirements.txt ]; then
  python -m pip install -r requirements.txt 2>&1 | tee -a "$LOG"
fi

# Run migrations so tests run against up-to-date schema
echo "Running migrations..." | tee -a "$LOG"
python manage.py migrate --noinput 2>&1 | tee -a "$LOG"

# Run the Django test suite and capture output
TEST_OUTPUT_FILE="$ARTIFACTS_DIR/test-output-$TIMESTAMP.txt"
echo "Running Django test suite..." | tee -a "$LOG"
if python manage.py test 2>&1 | tee -a "$LOG" > "$TEST_OUTPUT_FILE"; then
  echo "Tests finished (check $TEST_OUTPUT_FILE)" | tee -a "$LOG"
else
  echo "Tests completed with failures (see $TEST_OUTPUT_FILE)" | tee -a "$LOG"
fi

# Copy raw log
cp "$LOG" "$ARTIFACTS_DIR/raw-test-log-$TIMESTAMP.txt" || true

# If using sqlite, copy DB file
if [ -f db.sqlite3 ]; then
  cp db.sqlite3 "$ARTIFACTS_DIR/db.sqlite3.$TIMESTAMP" || true
fi

# Gather git metadata
git rev-parse --abbrev-ref HEAD > "$ARTIFACTS_DIR/git-branch-$TIMESTAMP.txt" 2>/dev/null || true
git rev-parse HEAD > "$ARTIFACTS_DIR/git-commit-$TIMESTAMP.txt" 2>/dev/null || true
git status --porcelain > "$ARTIFACTS_DIR/git-status-$TIMESTAMP.txt" 2>/dev/null || true

echo "Artifacts collected in $ARTIFACTS_DIR" | tee -a "$LOG"
exit 0
