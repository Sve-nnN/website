#!/usr/bin/env bash
# Idempotent deploy script — run this by SSH on the real Hostinger server,
# from the repo root. Pulls latest code, installs deps, builds the
# standalone Next/Payload server, and reloads it under PM2 without downtime.
#
# Usage: bash scripts/deploy.sh
set -euo pipefail

echo "==> Detecting current branch"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "    branch: ${BRANCH}"

echo "==> Pulling latest changes"
git pull origin "${BRANCH}"

echo "==> Installing dependencies (npm ci — full install, next build needs devDependencies like typescript)"
npm ci

echo "==> Building (payload migrate + generate:importmap + generate:types + next build)"
npm run build

echo "==> Starting or reloading PM2 process (zero-downtime reload if already running)"
pm2 startOrReload ecosystem.config.cjs --env production

echo "==> Persisting PM2 process list (survives reboot once 'pm2 startup' has been run once)"
pm2 save

echo "==> Deploy complete"
