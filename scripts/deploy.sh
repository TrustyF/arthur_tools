#!/bin/bash
# Run on thinkguy (~/arthur_tools) to deploy whatever's on origin/main.
# Not triggered automatically; you run it when you want to deploy.
#
# git reset --hard rather than git pull: always converges to exactly what's on
# GitHub, never conflicts. Uncommitted changes in this checkout get wiped, but
# ignored files (.env, public/houdini-icons) are left alone.
set -euo pipefail
cd "$(dirname "$0")/.."

git fetch origin main
git reset --hard origin/main

# .env's COMPOSE_FILE layers docker-compose.prod.yml on top.
sudo docker compose build migrate app
sudo docker compose up -d
