#!/bin/bash
set -e

CMS_ADMIN_EMAIL="${CMS_ADMIN_EMAIL:-cms@gie.com}"
CMS_ADMIN_PASSWORD="${CMS_ADMIN_PASSWORD:-seedpass!}"

until pg_isready -h "${DATABASE_HOST:-db}" -U "${DATABASE_USERNAME:-lsims}" -q; do
  echo "[cms] Waiting for Postgres..."
  sleep 1
done

DB_EXISTS=$(PGPASSWORD="${DATABASE_PASSWORD}" psql \
  -h "${DATABASE_HOST}" \
  -U "${DATABASE_USERNAME}" \
  -d postgres \
  -tAc "SELECT 1 FROM pg_database WHERE datname='${DATABASE_NAME}'")

if [ "$DB_EXISTS" != "1" ]; then
  echo "[cms] Creating database ${DATABASE_NAME}..."
  PGPASSWORD="${DATABASE_PASSWORD}" psql \
    -h "${DATABASE_HOST}" \
    -U "${DATABASE_USERNAME}" \
    -d postgres \
    -c "CREATE DATABASE \"${DATABASE_NAME}\";"
fi

echo "[cms] Ensuring Strapi admin user..."
npm run strapi -- admin:create-user \
  --firstname=CMS \
  --lastname=Admin \
  --email="${CMS_ADMIN_EMAIL}" \
  --password="${CMS_ADMIN_PASSWORD}" || true

echo "[cms] Starting Strapi (production)..."
exec npm run start
