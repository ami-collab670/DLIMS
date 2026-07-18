#!/bin/sh
set -e

until pg_isready -h "${DATABASE_HOST:-db}" -U "${DATABASE_USERNAME:-lsims}" -q; do
  sleep 1
done

DB_EXISTS=$(PGPASSWORD="${DATABASE_PASSWORD}" psql \
  -h "${DATABASE_HOST}" \
  -U "${DATABASE_USERNAME}" \
  -d postgres \
  -tAc "SELECT 1 FROM pg_database WHERE datname='${DATABASE_NAME}'")

if [ "$DB_EXISTS" != "1" ]; then
  PGPASSWORD="${DATABASE_PASSWORD}" psql \
    -h "${DATABASE_HOST}" \
    -U "${DATABASE_USERNAME}" \
    -d postgres \
    -c "CREATE DATABASE \"${DATABASE_NAME}\";"
fi

if [ -f dist/config/database.js ] && head -n 5 dist/config/database.js | grep -q '^#'; then
  rm -rf dist
fi

# Docker dev runs Strapi in develop mode so src/index.js bootstrap is loaded directly.
echo "[cms] Starting Strapi (develop)..."
exec npm run develop
