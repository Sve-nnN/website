# Constancia del respaldo de la base juantech (plan 57-10, tarea 1)

Tomado el 2026-11-24 a las 13:49 UTC (08:50 hora local de la laptop). Solo lectura: `pg_dump` no modifica la base. Esta constancia no contiene credenciales ni cadenas de conexión.

## El archivo

| Dato | Valor |
|---|---|
| Nombre | `respaldo-juantech-20261124.dump` |
| Ubicación | `~/respaldo-juantech-20261124.dump` en la laptop de Juan, **fuera del repo y sin commit** (permisos 600) |
| Tamaño | 16.467.370 bytes (16 MB comprimido; la base pesa 79 MB) |
| sha256 | `1b51473a7733b273b02cd74d9acc4a619ccfafbb3ec20e7a84e93431e9e8f4e1` |
| Formato | custom (`pg_dump -Fc`), compresión gzip, versión de volcado 1.16-0 |
| Servidor y cliente | PostgreSQL 17.10, volcado con el `pg_dump` 17.10 del propio contenedor (sin desajuste de versión) |

## Verificación con `pg_restore --list`

- 3.691 entradas de contenido (TOC de 3.696 líneas con cabecera), 345 de ellas `TABLE DATA`.
- Contiene las tablas de Payload esperadas: `posts`, `pages`, `case_studies`, `websites` y `media`, cada una con su entrada `TABLE DATA`.
- Conteo de filas leído del propio volcado, igual al de la base viva: `posts` 76, `media` 61, `case_studies` 7. La base viva reporta además `websites` 6.
- La base viva tiene 345 tablas en `public`, el mismo número que las entradas `TABLE DATA`.

## Cómo se confirmó que es la base correcta (incidente del 2026-08-17)

`04-which-database.ts` necesita un túnel con credenciales y no se corrió; se reprodujo su comprobación de forma equivalente y sin credenciales:

1. Traefik enruta `juan-tech.com` al contenedor `app-program-online-alarm-1ewbq3`, y el preview `dev.juan-tech.com` al contenedor `juantech-preview-o247wi`.
2. Los dos contenedores traen `DATABASE_URI` con host `shared-postgres`, puerto `5432`, base `/juantech` (solo se imprimió host, puerto y base). No es la Neon vieja.
3. La base volcada es `juantech` dentro de `shared-postgres` (Postgres 17.10, en `dokploy-network`, `Up 3 months (healthy)`).
4. Valor testigo: el título EN de `nextjs-seo` en la base ("Next.js SEO Best Practices for Optimal Visibility") es idéntico al H1 que sirve producción en vivo en `/en/blog/tech-seo/nextjs-seo`. El sitemap de producción tiene 166 URLs.
5. Último cambio en `posts`: 2026-11-17, coherente con el trabajo de las fases 54 a 56.

**Observación:** el preview y producción comparten esta misma base `juantech`. No es nuevo ni un riesgo del respaldo, pero conviene tenerlo presente para el cargador de 57-12.

## Cómo se hizo (desviación del plan, ver SUMMARY)

El plan pedía que Juan lo hiciera con el túnel y `DATABASE_URI`. Se hizo sin túnel ni relay: una orden SSH de un solo disparo con la llave `sapling_ed25519` ejecutó `pg_dump -Fc` dentro del contenedor `shared-postgres` por el socket local y la salida se guardó en la laptop. No se tecleó, guardó ni imprimió ninguna credencial. Ningún proceso queda escuchando.

## Respaldo nativo en Dokploy: NO

- Dokploy no tiene a `shared-postgres` como servicio Postgres con respaldos: `project.all` no lista ningún Postgres en ningún proyecto, y `destination.all` solo trae un destino (`cloudflare-r2`, bucket `sapling-backups`) sin respaldo asociado a esta base.
- En el VPS existe `infra/backup/backup-postgres.sh` (volcado a R2 vía rclone), pero la única línea de cron instalada cubre la base `smoketest`, no `juantech`. Además esa línea está mal formada (lleva el usuario `root` dentro de la crontab de root) y el log `/var/log/backup-postgres.log` solo repite `root: not found`: **no corre**.
- Conclusión: antes de este volcado no había ningún respaldo de `juantech`, ni nativo ni por cron. Este archivo es el único respaldo.

## Riesgos y siguientes pasos que decide Juan

1. El volcado vive en un solo disco local. Si quieres una segunda copia, súbela al bucket `sapling-backups` de R2 (no se hizo: es una escritura a un servicio externo).
2. Programar un respaldo diario de `juantech` y arreglar la crontab (quitar `root` de la línea) es una escritura en el VPS y no entra en este plan.
3. Para restaurar: `pg_restore --clean --if-exists -d <base destino> ~/respaldo-juantech-20261124.dump`, solo contra una base vacía o con aprobación nombrada (la restauración sobreescribe).
