#!/usr/bin/env bash
# Ejecuta un script de scripts/db/ contra la Postgres de producción vía túnel.
#
#   ./scripts/db/run-tunneled.sh scripts/db/04-which-database.ts [args...]
#
# Requiere el túnel abierto (./scripts/db/tunnel.sh en otra terminal) y un
# `.env` en la raíz del repo (PAYLOAD_SECRET y demás). La credencial de la base
# se saca del contenedor en vivo y nunca se escribe en disco.
set -euo pipefail
SSH_KEY="${SSH_KEY:-$HOME/.ssh/sapling_ed25519}"
VPS="${VPS:-juan@116.203.79.125}"
LOCAL_PORT="${LOCAL_PORT:-15432}"
APP_FILTER="${APP_FILTER:-app-program-online-alarm}"
HOST=127.0.0.1
[ $# -ge 1 ] || { echo "uso: $0 scripts/db/<script>.ts [args]" >&2; exit 2; }
nc -z "$HOST" "$LOCAL_PORT" 2>/dev/null || { echo "No hay túnel en ${HOST}:${LOCAL_PORT}. Corre ./scripts/db/tunnel.sh" >&2; exit 1; }
URI=$(ssh -i "$SSH_KEY" "$VPS" "CID=\$(sudo docker ps --filter name=${APP_FILTER} -q | head -1); sudo docker exec \"\$CID\" printenv DATABASE_URI")
[ -n "$URI" ] || { echo "No se pudo leer DATABASE_URI del contenedor" >&2; exit 1; }
export DATABASE_URI="${URI/@shared-postgres:5432\/juantech/@${HOST}:${LOCAL_PORT}/juantech?sslmode=disable}"
exec node --env-file=.env node_modules/.bin/tsx "$@"
