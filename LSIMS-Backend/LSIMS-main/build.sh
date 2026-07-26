#!/usr/bin/env bash
# build.sh — Render.com Build Script for LSIMS
# Build phase only — no DB calls (Postgres may not be ready during build).

set -o errexit

echo ">>> Installing dependencies..."
pip install -r requirements.txt

echo ">>> Collecting static files (Swagger UI CSS, admin assets)..."
python manage.py collectstatic --no-input

if [ -n "${DATABASE_URL:-}" ]; then
  echo ">>> Running database migrations..."
  python manage.py migrate --noinput

  echo ">>> Seeding roles..."
  python manage.py seed_roles

  echo ">>> Ensuring default admin user..."
  python manage.py create_user \
    --email "${LSIMS_ADMIN_EMAIL:-admin@gie.com}" \
    --password "${LSIMS_ADMIN_PASSWORD:-seedpass!}" \
    --role admin \
    --update || true
else
  echo ">>> DATABASE_URL not set during build; bootstrap deferred to start.sh"
fi

echo ">>> Build complete!"
