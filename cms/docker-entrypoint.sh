#!/bin/sh
set -e

# #region agent log
agent_log() {
  node -e "
    fetch('http://host.docker.internal:7840/ingest/133e5be4-3aa4-440f-8689-c818d8f44f13',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Debug-Session-Id':'870467'},
      body:JSON.stringify({
        sessionId:'870467',
        location:'cms/docker-entrypoint.sh',
        message:process.argv[1],
        data:JSON.parse(process.argv[2]||'{}'),
        hypothesisId:process.argv[3],
        timestamp:Date.now(),
        runId:'post-fix'
      })
    }).catch(()=>{});
  " "$1" "$2" "$3" 2>/dev/null || true
}
# #endregion

agent_log "CMS entrypoint started" "{}" "H2"

until pg_isready -h "${DATABASE_HOST:-db}" -U "${DATABASE_USERNAME:-lsims}" -q; do
  sleep 1
done

DB_EXISTS=$(PGPASSWORD="${DATABASE_PASSWORD}" psql \
  -h "${DATABASE_HOST}" \
  -U "${DATABASE_USERNAME}" \
  -d postgres \
  -tAc "SELECT 1 FROM pg_database WHERE datname='${DATABASE_NAME}'")

agent_log "Checked cms database" "{\"exists\":\"${DB_EXISTS}\"}" "H2"

if [ "$DB_EXISTS" != "1" ]; then
  PGPASSWORD="${DATABASE_PASSWORD}" psql \
    -h "${DATABASE_HOST}" \
    -U "${DATABASE_USERNAME}" \
    -d postgres \
    -c "CREATE DATABASE \"${DATABASE_NAME}\";"
  agent_log "Created cms database" "{\"name\":\"${DATABASE_NAME}\"}" "H2"
fi

if [ -f dist/config/database.js ] && head -n 5 dist/config/database.js | grep -q '^#'; then
  rm -rf dist
  agent_log "Removed stale dist with invalid config" "{}" "H1"
fi

RELATION_TYPES="node_modules/@strapi/types/dist/schema/attribute/definitions/relation.d.ts"
RELATION_LINES=0
if [ -f "$RELATION_TYPES" ]; then
  RELATION_LINES=$(wc -l < "$RELATION_TYPES")
fi
agent_log "node_modules health check" "{\"relationLines\":$RELATION_LINES}" "H5"

if [ ! -d build ] || [ ! -f build/index.html ]; then
  agent_log "Building Strapi (first run, may take several minutes)" "{}" "H3"
  npm run build
  agent_log "Strapi build finished" "{}" "H3"
fi

agent_log "Starting Strapi" "{}" "H1"

exec npm run start
