#!/usr/bin/env bash
# Daily PostgreSQL backup — schedule via cron: 0 2 * * * /path/to/backup-postgres.sh
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT="${BACKUP_DIR}/tracsopro_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" | gzip > "$OUTPUT"
echo "Backup written to $OUTPUT"

find "$BACKUP_DIR" -name 'tracsopro_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
