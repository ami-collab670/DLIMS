#!/usr/bin/env bash
# Railway release / pre-deploy: migrations, roles, default admin for client demo.
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

echo ">>> Railway release complete."
