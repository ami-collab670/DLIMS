#!/usr/bin/env bash
# Repo-root Render build entrypoint when Root Directory is not set in dashboard.
set -o errexit
cd "$(dirname "$0")/LSIMS-Backend/LSIMS-main"
exec ./build.sh
