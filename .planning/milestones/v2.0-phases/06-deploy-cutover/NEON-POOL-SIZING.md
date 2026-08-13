# Neon Postgres Pool Sizing

## Estado actual (hallazgo, antes de decidir)

`src/payload.config.ts` hoy configura el pool de `postgresAdapter` así:

```js
db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URI },
  push: false,
})
```

Sin `max` explícito — el default de `pg`/Drizzle es 10 conexiones.

**Hallazgo clave:** `DATABASE_URI` es hoy la connection string **UNPOOLED** (directa) de Neon, y se usa para dos propósitos distintos:
1. `payload migrate` / `payload migrate:create` — requiere la string unpooled porque la pooled (`-pooler`, vía PgBouncer) rompe los prepared statements que Drizzle usa para migraciones.
2. El proceso runtime en producción (frontend + admin de Payload sirviendo tráfico real) — usa la misma string, lo cual **no es necesariamente correcto**: Neon documenta límites de conexión directa (unpooled) sensiblemente más bajos que los límites de conexión pooled (vía PgBouncer), precisamente porque el pooler multiplexa muchas conexiones lógicas de la app sobre un número menor de conexiones físicas a Postgres.

El número exacto de conexiones que el plan Neon de Juan permite (unpooled y pooled) no estaba confirmado al escribir este documento — se confirma en la Task 2 (decision checkpoint) de este plan.

## Baseline (pool default, sin `max` explícito)

Corrida real de `scripts/verify-db-pool.ts` contra la DB real de Neon, concurrencia 10 (default del script), usando la connection string UNPOOLED actual:

```
Firing 10 concurrent queries across [pages, posts, authors, case-studies]...

10/10 queries succeeded (concurrency=10)
```

10/10 sin fallos — el pool default (10) no tuvo problema con 10 queries concurrentes contra la string unpooled en este momento de bajo tráfico. Esto no descarta el riesgo real: bajo tráfico real simultáneo de admin + frontend + un deploy corriendo `payload migrate` en paralelo, 10 conexiones directas pueden acercarse al límite real de Neon dependiendo del plan contratado — de ahí la necesidad de fijar `max` explícito y confirmarlo contra el límite real (Task 2/3).

## Dos opciones a decidir con Juan (Task 2)

**Opción A — single-unpooled:** mantener una sola `DATABASE_URI` unpooled también en runtime.
- Pros: cero cambios de config además de `pool.max`; menos superficie de error.
- Contras: el límite de conexiones directas de Neon suele ser bajo (puede rondar decenas incluso en planes pagos); un proceso PM2 con `pool.max` alto + `payload migrate` corriendo en paralelo durante un deploy podría agotarlo bajo tráfico real.

**Opción B — split-pooled-migrate:** separar `DATABASE_URI` (pooled, runtime) de `DATABASE_URI_MIGRATE` (unpooled, solo `migrate`/`migrate:create`).
- Pros: sigue la recomendación oficial de Neon; el proceso de producción usa el pooler (soporta muchas más conexiones concurrentes); reduce el riesgo real de DEPLOY-03.
- Contras: requiere una env var adicional en el servidor y ajustar `payload.config.ts` para leer una u otra según el comando (`migrate` vs runtime normal) — a evaluar si Payload ofrece un hook limpio para esa diferenciación sin código frágil.

## Decisión (pendiente — Task 2)

<!-- Se completa tras la decisión de Juan en el checkpoint de la Task 2 -->

- Límite real de conexiones Neon confirmado por Juan: **PENDIENTE**
- Opción elegida: **PENDIENTE**
- `pool.max` final: **PENDIENTE**
- Resultado de la re-verificación (`verify-db-pool.ts` con `POOL_TEST_CONCURRENCY` = `pool.max`): **PENDIENTE**
