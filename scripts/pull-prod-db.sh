#!/bin/bash
# Run locally: replaces the local dev database with a copy of production.
# Only reads from thinkguy (pg_dump). The local database is dumped to backups/
# first, so `pg_restore` of that file undoes this.
set -euo pipefail
cd "$(dirname "$0")/.."

# Local credentials from .env, with docker-compose.yml's defaults.
set -a
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
set +a
LOCAL_USER=${POSTGRES_USER:-user}
LOCAL_DB=${POSTGRES_DB:-arthur_tools}

stamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p backups
prod_dump="backups/prod-$stamp.dump"
local_dump="backups/local-before-pull-$stamp.dump"

echo "Dumping production -> $prod_dump"
# Prod's user/db names come from thinkguy's own .env.
ssh thinkguy 'cd ~/arthur_tools && set -a && . ./.env && set +a &&
	sudo -n docker compose exec -T db pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
	>"$prod_dump"

echo "Backing up local database -> $local_dump"
docker compose exec -T db pg_dump -U "$LOCAL_USER" -Fc "$LOCAL_DB" >"$local_dump"

echo "Restoring production into local $LOCAL_DB"
# --no-owner/--no-privileges: prod's role name differs from the local one.
docker compose exec -T db pg_restore -U "$LOCAL_USER" -d "$LOCAL_DB" \
	--clean --if-exists --no-owner --no-privileges <"$prod_dump"

echo "Done. Undo with:"
echo "  docker compose exec -T db pg_restore -U $LOCAL_USER -d $LOCAL_DB --clean --if-exists --no-owner --no-privileges < $local_dump"
