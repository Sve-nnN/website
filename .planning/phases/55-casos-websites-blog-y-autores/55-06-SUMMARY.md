---
phase: 55-casos-websites-blog-y-autores
plan: 06
subsystem: database
tags: [payload, postgres, migration, additive, preview, dokploy, smoke-deploy]
requires:
  - phase: 55-casos-websites-blog-y-autores
    provides: migración 20261109_044123_phase55_case_lessons, guardia 55-migration-additive y script 24-phase55-verify-schema (plan 55-03)
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: método de lectura de logs del preview y supuesto A7 (plan 54-16)
provides:
  - Base de producción con las cuatro tablas de lessons de CaseStudies, aplicada por Juan con el usuario dueño
  - Supuesto A7 confirmado de nuevo para las tablas de lessons (el rol juantech_preview_ro las lee sin GRANT)
  - 55-pre-migrate-check.mjs, prechequeo local de solo lectura con autoprueba
  - Preview desplegado con el esquema nuevo (ba38df4) sin diferencias de estado frente a producción
affects: [55-09 (casos con lecciones), 55-13 (chequeo A7 final), 56 (carga de lecciones)]
tech-stack:
  added: []
  patterns:
    - "Migrar primero y desplegar después: el preview lee con rol de solo SELECT y comparte filas con producción"
    - "Esperar el despliegue por el estado de la API de Dokploy (done), no solo por el HTML servido"
key-files:
  created:
    - scripts/verify/55-pre-migrate-check.mjs
  modified:
    - scripts/verify/55-migration-additive.mjs
key-decisions:
  - "El despliegue se da por terminado cuando Dokploy marca done, no cuando 54-notfound-status --wait ve un cambio: el contenedor viejo seguía sirviendo y el script pasó en el primer intento"
  - "Los logs del preview se leen por application.readLogs de la API, sin SSH (la llave de Dokploy no entra al VPS); no se pidió df -h porque el plan no lo exige"
requirements-completed: []
duration: 55min
completed: 2026-11-10
status: complete
commits: 1
plan_head_before: 0ad5a3481f2abf814c850c52b0c2a4526427200b
actuals:
  tokens: 2900
  tasks: 3
  commits: 1
---

# Phase 55 Plan 06: Migración de lessons y despliegue de humo Summary

Migración aditiva phase55_case_lessons aplicada por Juan sobre la base compartida y verificada con los dos roles, y preview desplegado con el esquema nuevo (SHA ba38df4) con contratos en PASS, crawl de paridad sin diferencias frente a producción y cero permission denied en los logs.

## Qué quedó hecho

- **Tarea 1 (tracer), commit ba38df4:** `55-pre-migrate-check.mjs` importa `checkUpBody` y `extractUpBody` de `55-migration-additive.mjs`, exige exactamente las cuatro tablas (`case_studies_lessons`, `case_studies_lessons_locales`, `_case_studies_v_version_lessons`, `_case_studies_v_version_lessons_locales`), comprueba el registro en `src/migrations/index.ts`, el snapshot `.json` y que no haya otra migración sin aplicar después de `20261108_043335_phase54_shadow_content`. Trae `--selftest` y no usa `--env-file`. Para poder importarlo, `55-migration-additive.mjs` ahora ejecuta `main` y el selftest solo cuando corre como script.
- **Tarea 2 (checkpoint human-action, resuelto por Juan):** evidencia recibida, sin credenciales.
- **Tarea 3:** push de solo `feat/mui-redesign` (17 commits de las olas 1 y 2, de `49a143a` a `ba38df4`), espera del despliegue y batería contra el preview. Sin código nuevo, sin commit propio.

## Evidencia del checkpoint (Tarea 2)

| Paso | Evidencia aportada por Juan |
|---|---|
| Destino | Host 127.0.0.1, puerto 15432, base `juantech` (vía túnel) |
| Aplicar | `payload migrate` listó únicamente `20261109_044123_phase55_case_lessons` como migrada (457 ms) |
| Verificar con el dueño | `24-phase55-verify-schema.ts` con `juantech_user`: 7 PASS |
| Verificar con el rol del preview | `24-phase55-verify-schema.ts` con `juantech_preview_ro`: todo PASS, supuesto A7 confirmado, no hizo falta GRANT |

Claude no abrió el túnel ni tocó la base en ningún momento, y ningún comando de este plan usó `--env-file=.env`.

## Resultados de verificación (Tarea 3, contra el preview, contenedor posterior a las 04:27:06Z)

| Comprobación | Resultado |
|---|---|
| `55-pre-migrate-check.mjs --selftest` y corrida normal | PASS (cuatro tablas, registrada, snapshot, sin otra pendiente) |
| `54-notfound-status.mjs --wait` | PASS (pero ver desviación 1) |
| `54-notfound-status.mjs` tras el despliegue completo | 6 PASS (404 real y con shell) |
| `55-tracer-live.mjs` | PASS en `/websites` y `/en/websites` (6 tarjetas y 6 capturas, igual que producción) |
| `53-shell-contract.mjs` | PASS en `/` y `/en` |
| `53-crawl-parity.mjs` | 169 URLs revisadas, 0 diferencias, PASS |
| `55-page-contract.mjs --routes` con `/case-studies`, `/en/case-studies` y el caso `pittsburgh-criminal-defense-legal-content-seo` en ES y EN | 4 PASS, 0 FAIL (4 WARN de puntuación en encabezados, no bloquean; ya existían en el contenido de producción) |
| Producción `/` y `/en` | 200 y 200 |
| Logs del preview (`application.readLogs`, tail 1000) | 0 `permission denied`, 0 `does not exist`, 0 `lessons`; el contenedor tiene 12 líneas (arranque de Next y un aviso de SQLite experimental) |
| `git log origin/feat/mui-redesign -1` contra `HEAD` | Coinciden (ba38df4277aba50cc7e8f7ecd325bedcea35e57e) |

Las páginas de casos de éxito responden 200 en ES y EN sobre el preview con el esquema nuevo: Payload resuelve el campo `lessons` con las tablas nuevas y el rol de solo lectura, y los logs no muestran ningún error de permisos. El diff de datos de `case-studies` no se midió con una consulta (la migración es aditiva y la guardia la prueba), pero los siete casos siguen sirviendo desde producción sin cambios de estado.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `54-notfound-status.mjs --wait` dio PASS antes de que terminara el despliegue**
- **Found during:** Tarea 3
- **Issue:** el script reportó "despliegue nuevo visible tras 1 intento" 24 segundos después del push, mientras Dokploy seguía en `running` y el contenedor viejo aún servía. Este build tardó 10 minutos (04:16:57Z a 04:27:04Z) frente a unos 6 minutos de los anteriores.
- **Fix:** consulté `application.one` de Dokploy (ordenando los despliegues por `createdAt`, el más nuevo primero) hasta que el estado pasó a `done`, y solo entonces corrí la batería y leí los logs. Los resultados de la tabla son todos posteriores al reinicio del contenedor (primera línea de log a las 04:27:06Z).
- **Files modified:** ninguno
- **Commit:** n/a

### Decisiones dentro del margen del plan

- La lectura de logs usó la API de Dokploy (`application.readLogs`), el comando que el propio verify automatizado de la tarea fija, y no SSH. No se pidió `df -h /` del VPS porque la Tarea 3 no lo exige y la llave SSH de Dokploy no está aceptada en el VPS.
- `commits: 1` es el conteo medido contra el ledger (`0ad5a34..HEAD`): solo la Tarea 1 generó commit. La Tarea 2 es de Juan y la Tarea 3 fue un push.

## Elementos para la revisión humana de Juan

1. **Supuesto A3 del planificador:** guardar un caso en el admin de master, que no conoce `lessons`, podría perder filas de lecciones si las cargas en la fase 56 antes del corte. Conviene cargar las lecciones en el corte. La tabla ya existe y está vacía.
2. **Rollback:** `migrate:down` de esta migración contiene `DROP TABLE` y exige tu aprobación por nombre tras leer el SQL. Ninguna tarea de este plan lo necesita.
3. **Tiempo de build:** el despliegue tardó 10 minutos. Los siguientes planes que empujen deben esperar el estado `done` en Dokploy antes de verificar.
4. **Vista del preview:** en `https://dev.juan-tech.com/case-studies` y `/en/case-studies` los casos siguen con el diseño viejo; las vistas MUI llegan en 55-09.

## Known Stubs

Ninguno. Las tablas de lessons están vacías por diseño (D-10, sin siembra) hasta la fase 56.

## Threat Flags

Ninguno nuevo. T-55-19 (base equivocada) y T-55-20 (migraciones ajenas) mitigados con la evidencia de Juan (destino 127.0.0.1:15432/juantech y una sola migración listada), T-55-21 (rol del preview sin SELECT) descartado con la verificación del rol real y con los logs limpios, T-55-22 (credenciales) sin exposición: ninguna clave se imprimió, se pegó ni se guardó.

## Self-Check: PASSED

`scripts/verify/55-pre-migrate-check.mjs` existe, commit ba38df4 presente en `git log` y en `origin/feat/mui-redesign`, y la autoprueba y la corrida normal pasan.
