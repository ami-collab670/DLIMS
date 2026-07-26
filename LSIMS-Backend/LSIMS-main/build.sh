#!/usr/bin/env bash
# build.sh — Render.com Build Script for LSIMS
# Build phase only — no DB calls (Postgres may not be ready during build).

set -o errexit

echo ">>> Installing dependencies..."
pip install -r requirements.txt

echo ">>> Collecting static files (Swagger UI CSS, admin assets)..."
python manage.py collectstatic --no-input

echo ">>> Build complete!"
