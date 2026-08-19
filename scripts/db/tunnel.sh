#!/usr/bin/env bash
# Abre un túnel SSH a la Postgres de producción para poder correr los scripts
# de contenido (y levantar `next dev`) desde la laptop.
#
#   ./scripts/db/tunnel.sh
#
# Por qué hace falta: la base vive en el contenedor `shared-postgres` dentro de
# la red Docker de Dokploy, y su puerto 5432 NO está publicado. Eso es
# deliberado, no un descuido — es un requisito de seguridad del repo de
# infraestructura (DB-01, DB-02, SEC-01 en infra/db/RUNBOOK.md, que pide
# verificar con nmap que 5432 nunca aparezca `open` desde afuera).
#
# CORRECCIÓN (2026-08-19): la versión anterior de este script fallaba con
# `root@116.203.79.125: Permission denied (publickey)` y, aun con el usuario
# correcto, tampoco habría llegado a la base. Tenía tres cosas mal:
#
#   1. Usuario `root` y sin `-i`. La única llave que autentica en ese VPS es
#      `~/.ssh/sapling_ed25519`, con el usuario `juan`. Las otras dos llaves de
#      `~/.ssh/` dan `Permission denied (publickey)`.
#   2. `docker inspect` sin `sudo`. El usuario `juan` necesita sudo (que sí es
#      passwordless) para hablar con el daemon.
#   3. Tunelizaba contra la IP del contenedor. Eso funcionaría con un bridge
#      normal, pero esto es Docker Swarm: `shared-postgres` solo es alcanzable
#      POR NOMBRE desde dentro de `dokploy-network`, y su IP de overlay
#      timeoutea incluso desde el propio host del VPS.
#
# La forma que sí funciona son dos saltos: un contenedor socat efímero DENTRO
# de `dokploy-network` que publica el puerto en la loopback del VPS (nunca en
# 0.0.0.0), y encima el túnel SSH de la laptop hacia esa loopback.
#
# El túnel queda en primer plano. Dejá esta terminal abierta y corré los
# scripts en otra.

set -euo pipefail

SSH_KEY="${SSH_KEY:-$HOME/.ssh/sapling_ed25519}"
VPS="${VPS:-juan@116.203.79.125}"
CONTAINER="${CONTAINER:-shared-postgres}"
RELAY_NAME="${RELAY_NAME:-pg-relay-tmp}"
RELAY_PORT="${RELAY_PORT:-25432}"
LOCAL_PORT="${LOCAL_PORT:-15432}"

SSH=(ssh -i "$SSH_KEY" "$VPS")

if [ ! -f "$SSH_KEY" ]; then
  echo "ERROR: no existe la llave ${SSH_KEY}." >&2
  echo "Es la única de ~/.ssh/ que autentica en el VPS. Pasá otra con SSH_KEY=..." >&2
  exit 1
fi

cleanup() {
  echo
  echo "Cerrando el relay en el VPS..."
  "${SSH[@]}" "sudo docker rm -f ${RELAY_NAME} >/dev/null 2>&1 || true"
}
trap cleanup EXIT

echo "Levantando relay ${RELAY_NAME} en ${VPS} (red dokploy-network -> ${CONTAINER})..."

# `-p 127.0.0.1:...` es obligatorio: publicar en 0.0.0.0 dejaría la Postgres
# expuesta a internet, que es exactamente lo que SEC-01 prohíbe.
"${SSH[@]}" "
  sudo docker rm -f ${RELAY_NAME} >/dev/null 2>&1 || true
  sudo docker run -d --rm --name ${RELAY_NAME} --network dokploy-network \
    -p 127.0.0.1:${RELAY_PORT}:5432 \
    alpine/socat TCP-LISTEN:5432,fork,reuseaddr TCP:${CONTAINER}:5432 >/dev/null
" || {
  echo "ERROR: no se pudo levantar el relay." >&2
  echo "Verificá el acceso:  ssh -i ${SSH_KEY} ${VPS} 'sudo docker ps'" >&2
  exit 1
}

echo "Relay arriba en 127.0.0.1:${RELAY_PORT} (loopback del VPS)."
echo
echo "Túnel abierto en localhost:${LOCAL_PORT}"
echo
echo "La credencial se saca en vivo (rota independiente de este script):"
echo
echo "  ssh -i ${SSH_KEY} ${VPS} 'CID=\$(sudo docker ps --filter name=app-program-online-alarm -q); sudo docker exec \"\$CID\" printenv DATABASE_URI'"
echo
echo "y se usa exportándola, sin tocar el .env:"
echo
echo "  export DATABASE_URI='postgresql://juantech_user:<clave>@localhost:${LOCAL_PORT}/juantech?sslmode=disable'"
echo "  node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts"
echo
echo "El sslmode=disable importa: la Postgres interna no hace TLS, y el driver"
echo "trata 'require' como 'verify-full', así que sin eso el handshake falla y"
echo "parece un problema de red en vez de un mismatch de SSL."
echo
echo "Ctrl-C para cerrar el túnel (el relay se borra solo al salir)."
echo

ssh -i "$SSH_KEY" -N -L "${LOCAL_PORT}:127.0.0.1:${RELAY_PORT}" "$VPS"
