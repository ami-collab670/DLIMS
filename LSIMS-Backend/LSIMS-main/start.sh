#!/usr/bin/env bash
# Runtime bootstrap for Render — runs before gunicorn when DATABASE_URL is live.
set -o errexit

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

echo ">>> Starting gunicorn..."
exec gunicorn lsims_project.wsgi:application --bind "0.0.0.0:${PORT:-8000}"
