#!/bin/sh
set -eu

# Use positional args with sensible defaults to avoid unset dereferences
# (portable POSIX sh: avoid `pipefail` and preserve `set -u` by providing defaults)
host="${1:-mysql_db}"
port="${2:-3306}"

log() { printf '%s %s\n' "$(date --iso-8601=seconds 2>/dev/null || date)" "$*"; }

log "Waiting for MySQL at ${host}:${port}..."
while ! nc -z "${host}" "${port}" >/dev/null 2>&1; do
  log "Waiting for MySQL at ${host}:${port}..."
  sleep 2
done

log "MySQL is ready, initializing database..."

# sequelize-cli flags to avoid needing a .sequelizerc file
# (the server package uses "type": "module" which conflicts with CJS .sequelizerc)
SEQ_OPTS="--config node_modules/@tombolo/db/config/config.cjs --migrations-path node_modules/@tombolo/db/migrations --seeders-path node_modules/@tombolo/db/seeders --models-path node_modules/@tombolo/db/models"

if command -v sequelize >/dev/null 2>&1; then
  if ! sequelize db:create ${SEQ_OPTS} >/dev/null 2>&1; then
    log "sequelize db:create returned non-zero (continuing)"
  fi

  log "Running migrations..."
  sequelize db:migrate ${SEQ_OPTS} || log "migrations failed"

  log "Running seeds..."
  sequelize db:seed:all ${SEQ_OPTS} || log "seeds failed"
else
  log "sequelize not found in PATH; skipping migrations/seeds"
fi

# Ensure mounted log directory exists and is writable (for application logs)
mkdir -p /app/logs
chmod 0755 /app/logs || true
chown -R $(id -u 2>/dev/null || 0):$(id -g 2>/dev/null || 0) /app/logs || true

# Do NOT configure PM2 to write logs into the mounted folder and do NOT
# install or configure pm2-logrotate here. PM2 will use its default
# internal log handling (not persisted to the host) to avoid duplicating
# application file-based logs.

if command -v pm2-runtime >/dev/null 2>&1; then
  log "Starting pm2-runtime (logging/logrotate disabled)"
  exec pm2-runtime start process.yml
else
  log "pm2-runtime not found; attempting fallback start"
  if [ -f /app/dist/server.js ]; then
    exec node /app/dist/server.js
  else
    log "No start command found; exiting"
    exit 1
  fi
fi