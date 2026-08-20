#!/usr/bin/env bash
# Levanta `next dev` apuntando a la Postgres de producción a través del túnel.
#
#   ./scripts/db/dev-tunneled.sh
#
# Por qué existe: `DATABASE_URI` en `.env` es
# `postgresql://...@shared-postgres:5432/juantech`, y `shared-postgres` es un
# nombre de servicio interno de la red Docker de Dokploy. Desde la laptop no
# resuelve, así que `npm run dev` a secas falla con:
#
#   Error: cannot connect to Postgres: getaddrinfo ENOTFOUND shared-postgres
#
# Eso NO es un problema del código ni del sitio: es que el proceso está
# buscando una base que solo existe dentro del VPS. La forma de llegar es el
# túnel (./scripts/db/tunnel.sh) más esta URI reescrita a la punta local.
#
# Node no deja que un `.env` pise una variable ya exportada en el shell, así
# que exportar DATABASE_URI acá y cargar `.env` después es seguro: el resto de
# las variables (PAYLOAD_SECRET, CLOUDINARY_*, RESEND_*) siguen viniendo del
# archivo, y solo la base cambia de destino.

set -euo pipefail

SSH_KEY="${SSH_KEY:-$HOME/.ssh/sapling_ed25519}"
VPS="${VPS:-juan@116.203.79.125}"
LOCAL_PORT="${LOCAL_PORT:-15432}"
APP_FILTER="${APP_FILTER:-app-program-online-alarm}"

# 127.0.0.1 y no `localhost`: en esta Mac `localhost` resuelve primero a ::1
# (IPv6) y el túnel escucha en IPv4, así que el nombre da ECONNREFUSED contra
# ::1 mientras el puerto está perfectamente abierto. Costó un rato descubrirlo.
HOST=127.0.0.1

if ! nc -z "$HOST" "$LOCAL_PORT" 2>/dev/null; then
  echo "ERROR: no hay nada escuchando en ${HOST}:${LOCAL_PORT}." >&2
  echo "Abrí el túnel primero, en otra terminal:" >&2
  echo "    ./scripts/db/tunnel.sh" >&2
  exit 1
fi

echo "Túnel detectado en ${HOST}:${LOCAL_PORT}. Buscando la credencial en vivo..."

# La contraseña rota independientemente de este script, así que se saca del
# contenedor cada vez y nunca se escribe en disco.
PROD_URI=$("${SSH_KEY:+ssh}" -i "$SSH_KEY" "$VPS" "
  CID=\$(sudo docker ps --filter name=${APP_FILTER} -q | head -1)
  sudo docker exec \"\$CID\" printenv DATABASE_URI
")

if [ -z "${PROD_URI}" ]; then
  echo "ERROR: no se pudo leer DATABASE_URI del contenedor." >&2
  exit 1
fi

export DATABASE_URI="${PROD_URI/@shared-postgres:5432\/juantech/@${HOST}:${LOCAL_PORT}/juantech?sslmode=disable}"

echo "Apuntando a ${HOST}:${LOCAL_PORT}/juantech (producción, vía túnel)."
echo "OJO: es la base real. Lo que edites en /admin se publica de verdad."
echo

exec npm run dev
