#!/usr/bin/env bash
# Repo-root Render start entrypoint when Root Directory is not set in dashboard.
set -o errexit
cd "$(dirname "$0")/LSIMS-Backend/LSIMS-main"
exec bash start.sh
