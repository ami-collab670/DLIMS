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

# Create admin superuser automatically if env vars are set
# Requires: CREATE_SUPERUSER=1, DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_PASSWORD
if [ "$CREATE_SUPERUSER" ]; then
  echo ">>> Creating superuser..."
  python manage.py createsuperuser --no-input || true
fi

echo ">>> Build complete!"
