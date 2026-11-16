#!/bin/bash
# Run on thinkguy (~/arthur_tools) by the crontab, nightly. Dumps the `db`
# service and hands the dump to the `maintenance` service, which uploads it to
# the R2 backup bucket and prunes old ones (src/scripts/backup-database.ts).
# The local file only exists during the run; R2 holds the backups.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

POSTGRES_USER=$(grep '^POSTGRES_USER=' .env | cut -d= -f2-)
POSTGRES_DB=$(grep '^POSTGRES_DB=' .env | cut -d= -f2-)

mkdir -p backups
dump="backups/nightly-$(date -u +%Y%m%dT%H%M%SZ).dump"
trap 'rm -f "$dump"' EXIT

# Custom format (-Fc): compressed, and restores with pg_restore (see README).
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" >"$dump"
docker compose run --rm -T maintenance npm run --silent backup_database <"$dump"
