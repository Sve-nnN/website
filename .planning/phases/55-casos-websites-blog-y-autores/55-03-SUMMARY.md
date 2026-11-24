---
phase: 55-casos-websites-blog-y-autores
plan: 03
subsystem: database
tags: [payload, migration, case-studies, lessons, additive, schema-verify]
requires:
  - phase: 55-01
    provides: patron de verificacion y tracer del preview
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: assertSafeTarget (54-seed-lib), patron de guardia 54-migration-additive y de script 23
provides:
  - campo lessons en CaseStudies (array con title y body localizados, entre results y conclusion)
  - migracion 20261109_044123_phase55_case_lessons (cuatro tablas nuevas, generada, SIN aplicar)
  - 55-migration-additive.mjs (guardia de lista cerrada con autoprueba)
  - 24-phase55-verify-schema.ts (solo lectura, assertSafeTarget antes de getPayload) y evaluateLessonsState
affects: [55-06, 55-07, 56]
tech-stack:
  added: []
  patterns:
    - "migrate:create con variables falsas de build (la conexion nunca se abre), sin cargar .env"
    - "Fixtures de esquema compartidos entre el selftest del script de base y el verificador"
key-files:
  created:
    - src/migrations/20261109_044123_phase55_case_lessons.ts
    - src/migrations/20261109_044123_phase55_case_lessons.json
    - scripts/verify/55-migration-additive.mjs
    - scripts/db/24-phase55-verify-schema.ts
    - scripts/db/data/55-schema-lib.ts
    - scripts/verify/55-schema-selftest.ts
  modified:
    - src/collections/CaseStudies/index.ts
    - src/migrations/index.ts
    - src/payload-types.ts
key-decisions:
  - "lessons es un array de title (text) y body (textarea), ambos localizados y required: evita inventar un delimitador dentro de un solo texto; cambiarlo despues cuesta otra migracion, asi que Juan lo revisa antes de 55-06"
  - "No se agrego GRANT SELECT: el supuesto A7 de 54-16 indica que el rol del preview lee tablas nuevas sin GRANT; el script 24 lo comprueba en 55-06 y, si falla, D-06 manda agregarlo en la migracion"
requirements-completed: []
duration: 15min
completed: 2026-11-09
status: complete
commits: 2
plan_head_before: 34830a26ed8d4c939551abaa1e5003a5cbe1ff36
actuals:
  tokens: 14000
  tasks: 2
  commits: 2
---

# Phase 55 Plan 03: Campo lessons y migracion aditiva Summary

Campo aditivo `lessons` de CaseStudies con su migracion generada (cuatro tablas nuevas, sin tocar nada existente), una guardia que prueba que solo crea esas cuatro tablas y un script de lectura que Juan correra con dos roles en 55-06.

## Que quedo hecho

- **Tarea 1 (tracer), commit 71d92b0:** campo `lessons` entre `results` y `conclusion` (solo 15 lineas agregadas, cero eliminadas). Migracion generada con `PAYLOAD_SECRET=build-only DATABASE_URI=postgresql://build:build@127.0.0.1:5432/build payload migrate:create phase55_case_lessons`, sin `.env`. Se leyo el SQL completo: cuatro `CREATE TABLE`, cuatro `ADD CONSTRAINT ... FOREIGN KEY` y seis indices, todos sobre las tablas nuevas; referencias solo a `case_studies` y `_case_studies_v`. `down` hace `DROP TABLE` de las cuatro (por diseno, no se revisa). La guardia no mostro deriva del snapshot.
- **Tarea 2, commit e85b9da:** tipos regenerados (el unico cambio en `payload-types.ts` son 17 lineas de `lessons`), `evaluateLessonsState` con fixtures, script 24 de solo lectura y `55-schema-selftest.ts`.

## Resultados de verificacion

| Comprobacion | Resultado |
|---|---|
| `node scripts/verify/55-migration-additive.mjs --selftest` | PASS (fixture valido y 7 defectuosos detectados: DROP COLUMN, ADD COLUMN sobre case_studies, CREATE TYPE, tabla ajena, TRUNCATE, REFERENCES ajena, tabla faltante) |
| `node scripts/verify/55-migration-additive.mjs` | PASS sobre `20261109_044123_phase55_case_lessons.ts` |
| `ls src/migrations \| grep -c phase55_case_lessons` | 2 (.ts y .json) |
| Cuerpo de `up`: DROP o TRUNCATE | ninguno; 4 `CREATE TABLE` |
| `git diff --stat` de CaseStudies | solo lineas agregadas (15+, 0-) |
| `generate:types` y `grep lessons src/payload-types.ts` | PASS |
| `npx tsc --noEmit` (variables falsas) | PASS, sin salida |
| `tsx scripts/db/24-phase55-verify-schema.ts --selftest` | PASS, exit 0 (4 casos) |
| `tsx scripts/verify/55-schema-selftest.ts` | PASS, exit 0 (12 comprobaciones, incluye rechazo de Neon, host desconocido y base distinta de juantech) |
| Script 24 con host no permitido | aborta antes de abrir Payload, exit 1 |
| `assertSafeTarget` antes de `getPayload` | si (lineas 71 y 79) |
| Sin escrituras ni `env-file` en el script 24 | si |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comentario del script 24 contenia la cadena `env-file`**
- **Found during:** Tarea 2 (criterio de aceptacion `! grep -q "env-file"`)
- **Fix:** se reformulo el comentario ("Nunca se carga el .env local"). Sin cambio de comportamiento.
- **Commit:** e85b9da

Nada mas. Lo demas se ejecuto como esta escrito.

## Nada aplicado, nada empujado

La migracion NO se aplico y no hay push. Los dos commits son locales. **No empujar** `feat/mui-redesign` con estos commits hasta que 55-06 confirme la migracion aplicada: el preview lee con `juantech_preview_ro` y un campo sin migrar rompe la pagina de caso (Pitfall 22).

## Nota sobre el conteo de commits

`commits: 2` cuenta solo los de este plan (71d92b0 y e85b9da). Otros ejecutores de la ola intercalaron commits de 55-04 y 55-05 en el mismo checkout, por eso `rev-list` desde `plan_head_before` daria un numero mayor.

## Elementos para la revision humana de Juan

1. **Forma de `lessons`:** `title` y `body` localizados y obligatorios por fila. Si prefieres un array de un solo `text` (como decia D-10 literalmente) hay que cambiarlo ANTES de 55-06, porque despues cuesta otra migracion.
2. **Comandos para 55-06** (con el tunel y las credenciales del rol, nunca `--env-file=.env`):
   - `node --env-file=<entorno del tunel> node_modules/.bin/tsx scripts/db/04-which-database.ts` (confirmar base)
   - `payload migrate` con `juantech_user`
   - `node_modules/.bin/tsx scripts/db/24-phase55-verify-schema.ts` con `DATABASE_URI` de `juantech_user` y luego con la de `juantech_preview_ro`; si el segundo da `permission denied`, agregar `GRANT SELECT` dentro de la migracion (D-06).
3. Hasta la fase 56 el campo queda vacio y el preview no muestra "Lecciones aprendidas" (D-10).

## Known Stubs

Ninguno. No se sembro ni se copio ninguna leccion del sandbox.

## Threat Flags

Ninguno nuevo. T-55-09 mitigado por la guardia con lista cerrada, T-55-10 por `assertSafeTarget` antes de `getPayload`, T-55-11 por el aviso `permission denied` de `evaluateLessonsState`, T-55-12 porque este plan no escribe contenido.

## Self-Check: PASSED

Archivos creados presentes y commits 71d92b0 y e85b9da presentes en `git log`.
