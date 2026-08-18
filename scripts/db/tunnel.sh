#!/usr/bin/env bash
# Abre un túnel SSH a la Postgres de producción para poder correr los scripts
# de contenido desde la laptop.
#
#   ./scripts/db/tunnel.sh
#
# Por qué hace falta: la base vive en el contenedor `shared-postgres` dentro de
# la red Docker de Dokploy, y su puerto 5432 NO está publicado. Eso es
# deliberado, no un descuido — es un requisito de seguridad del repo de
# infraestructura (DB-01, DB-02, SEC-01 en infra/db/RUNBOOK.md, que pide
# verificar con nmap que 5432 nunca aparezca `open` desde afuera).
#
# Por eso `shared-postgres` no resuelve desde la laptop: no es un host público,
# es un nombre de servicio interno de Docker. La forma correcta de llegar no es
# abrir el puerto, es tunelizarlo sobre SSH, que ya está abierto.
#
# El túnel queda en primer plano. Dejá esta terminal abierta y corré los
# scripts en otra.

set -euo pipefail

VPS="${VPS:-root@116.203.79.125}"
CONTAINER="${CONTAINER:-shared-postgres}"
LOCAL_PORT="${LOCAL_PORT:-15432}"

echo "Buscando la IP del contenedor ${CONTAINER} en ${VPS}..."

# El host del VPS sí rutea al bridge de Docker, así que el túnel apunta a la IP
# del contenedor. `shared-postgres` como nombre solo resuelve DENTRO de la red
# Docker, ni siquiera desde el host, así que usarlo en el -L no funcionaría.
CONTAINER_IP=$(ssh "$VPS" \
  "docker inspect -f '{{range \$k, \$v := .NetworkSettings.Networks}}{{\$v.IPAddress}} {{end}}' ${CONTAINER}" \
  | awk '{print $1}')

if [ -z "${CONTAINER_IP}" ]; then
  echo "ERROR: no se pudo obtener la IP de ${CONTAINER}." >&2
  echo "Verificá que el contenedor exista:  ssh ${VPS} 'docker ps | grep ${CONTAINER}'" >&2
  exit 1
fi

echo "IP del contenedor: ${CONTAINER_IP}"
echo
echo "Túnel abierto en localhost:${LOCAL_PORT} -> ${CONTAINER_IP}:5432"
echo
echo "En OTRA terminal, poné esto en el .env (mismo usuario/clave/base que"
echo "tiene la app en Dokploy, solo cambiando host y puerto):"
echo
echo "  DATABASE_URI=postgres://<usuario>:<clave>@localhost:${LOCAL_PORT}/juantech?sslmode=disable"
echo
echo "El sslmode=disable importa: la Postgres interna no hace TLS, y el driver"
echo "trata 'require' como 'verify-full', así que sin eso el handshake falla."
echo
echo "Ctrl-C para cerrar el túnel."
echo

exec ssh -N -L "${LOCAL_PORT}:${CONTAINER_IP}:5432" "$VPS"
