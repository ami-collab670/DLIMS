#!/usr/bin/env bash
# build.sh — Render.com Build Script for LSIMS
# This runs automatically on every deploy.
# Render Build Command: ./build.sh

set -o errexit  # Exit on any error

echo ">>> Installing dependencies..."
pip install -r requirements.txt

echo ">>> Collecting static files (Swagger UI CSS, admin assets)..."
python manage.py collectstatic --no-input

echo ">>> Running database migrations..."
python manage.py migrate --no-input

echo ">>> Build complete!"
