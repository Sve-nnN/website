---
phase: 54-paginas-de-conversion-y-utilidad
plan: 07
subsystem: database
tags: [payload-migrate, shadow-content, verify-schema, dokploy, preview-deploy, smoke-test]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 02 (migracion phase54_shadow_content y globals), plan 04 (scripts 20, 21, 22 y 54-seed-lib), plan 06 (primitivas de conversion)
provides:
  - scripts/db/23-phase54-verify-schema.ts (lectura de solo lectura, modos --expect-seeded y --selftest)
  - evaluateShadowState en scripts/db/data/54-seed-lib.ts
  - base de produccion migrada y sembrada con el contenido sombra (home-page, about-page, clientes.onDark, media 67 a 79, logos del stack)
  - preview dev.juan-tech.com desplegado con el esquema nuevo (SHA 5fa327d) y verificado sin diferencias de estado frente a produccion
affects: [54-08, 54-09, 54-10, 54-11, 54-12, 54-13, 54-14, 54-15, 54-16, 56]

plan_head_before: 713f6c76401b1dfc95a2916a5240c0e41c84bf5a
actuals:
  tokens: 3600
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Orden fijo migrar, sembrar, empujar: el preview lee con un rol de solo SELECT y comparte filas con produccion"
    - "Verificacion de esquema como funcion pura (evaluateShadowState) con autoprueba sobre fixtures y un script de lectura delgado"

key-files:
  created:
    - scripts/db/23-phase54-verify-schema.ts
  modified:
    - scripts/db/data/54-seed-lib.ts
    - scripts/verify/54-seed-selftest.ts

key-decisions:
  - "La tarea 3 no agrego commits de codigo: el despliegue con el esquema nuevo no revelo fallos de build ni de tipos"
  - "El paso 11 (lectura con juantech_preview_ro) se sustituyo por la comprobacion del preview desplegado y de sus logs; queda un hueco documentado (ver Desviaciones)"

patterns-established:
  - "El ultimo elemento de deployments en application.one es el mas reciente"

requirements-completed: []

duration: tarea 1 en la sesion anterior; tareas 2 y 3 el 2026-11-08
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 07: Migracion, siembra sombra y despliegue de humo Summary

**Migracion aditiva phase54_shadow_content aplicada y contenido sombra sembrado en la base de produccion, con un script de verificacion de solo lectura y el preview desplegado (5fa327d) sin diferencias de estado frente a produccion en 169 URLs.**

## Performance

- **Tasks:** 3 de 3
- **Commits de codigo:** 1 (`5fa327d`), medido contra `plan_head_before`
- **Files:** 1 creado, 2 modificados

## Accomplishments

- **Tarea 1 (tracer):** `evaluateShadowState(state, { expectSeeded })` es una funcion pura. Sin `expectSeeded` solo exige que el esquema este aplicado. Con `expectSeeded` exige tagline y titulo del hero, 5 servicios, 4 pasos de proceso, 4 vitals, 5 FAQ, 3 pasos y 3 filas de contacto en la home, lead y 5 etapas en Sobre mi, algun cliente con `onDark` y alguna herramienta del stack con logo. `23-phase54-verify-schema.ts` solo lee, imprime el destino sin credenciales y traduce `permission denied` en una nota sobre la migracion y el rol dueño.
- **Tarea 2 (Juan, checkpoint humano):** evidencia en la seccion siguiente.
- **Tarea 3:** push de 21 commits locales (`9634775..5fa327d`) a `origin/feat/mui-redesign`, redeploy automatico de `juantech-preview` y humo completo.

## Evidencia de la Tarea 2 (ejecutada por Juan el 2026-11-08, 19:00 a 19:06, por el tunel a 127.0.0.1:15432/juantech con `juantech_user`)

| Paso | Resultado |
|------|-----------|
| `04-which-database.ts` | Host y base correctos. Valores testigo iguales a produccion en vivo (posts/tablas-hash y nextjs-seo EN). Unico error: lectura de `pages` por `logo_id` inexistente, esperado antes de migrar |
| `payload migrate` | Ejecuto solo `20261108_043335_phase54_shadow_content` (603 ms) |
| `23-phase54-verify-schema.ts` con esquema vacio | 4 PASS |
| Script 20 `--apply --db-checked` | Sembro `home-page` y `about-page` (ES releido sin diferencias). Marco `clientes #9 Wiñaypaq onDark=true`. `luxembourg-philharmonie` y `souma-hotel` sin coincidencia en clientes, no se tocan |
| Script 21 `--apply --db-checked --alts-confirmed` | Media #76 (about-hero), #77 (taller), #78 (escritorio convertido a WebP, 49.3 KB), #79 (retrato). `about-page hero.photo` y `home-page about.photos` releidos. Los alt los confirmo Juan al aprobar el comando y quedan marcados para revision final en la fase 56 |
| Script 22 `--apply --db-checked` | Media #67 a #75 (9 logos del stack). Guardia de diff OK, solo clave `logo`. EN escrito y releido, ES comparte el campo |
| `23 --expect-seeded` con usuario dueño | 16 PASS |
| Produccion en vivo tras migrar | `/`, `/en`, `/contact`, `/stack` y `sitemap.xml` responden 200; `sobre-mi` no esta en el sitemap live |
| Tunel | Cerrado por Juan |

## Verificacion de la Tarea 3 (contra https://dev.juan-tech.com, SHA 5fa327d)

- **Push:** `origin/feat/mui-redesign` = `HEAD` = `5fa327db44fe75b959a9d13642ccee4dd0a9efe9`. Solo esa rama; master no se tocó.
- **Deploy:** el deploy empezo solo (autoDeploy) 2 segundos despues del push y termino en `done` en unos 5 minutos. No hizo falta `application.deploy`.
- `54-notfound-status.mjs` (EXPECT_PREVIEW=1): 6 PASS, salida 0.
- `53-preview-contract.mjs`: todos PASS, salida 0 (robots noindex, sitemap/admin/api 404, home y /en con noindex).
- `53-shell-contract.mjs` (EXPECT_PREVIEW=1): PASS en `/` (es) y `/en`, salida 0.
- `53-crawl-parity.mjs`: 169 URLs revisadas, 0 diferencias, PASS.
- Produccion: home 200; `sobre-mi` aparece 0 veces en el sitemap live.
- Logs de la app del preview por la API de Dokploy (`readLogs`, tail 1000): 0 `permission denied`.
- Logs del contenedor por SSH (solo lectura, `docker logs --tail 5000`): 14 lineas, 0 `permission denied`, 0 `does not exist`, 0 errores.
- `df -h /` en el VPS: 75G, 52G usados, 21G libres, 72%.

## Task Commits

1. **Task 1 (tracer): script de lectura de verificacion y autoprueba** - `5fa327d` (feat)
2. **Task 2: checkpoint humano** - sin commit (operaciones sobre la base, ejecutadas por Juan)
3. **Task 3: push y despliegue de humo** - sin commit (no hubo cambios de codigo)

## Deviations from Plan

### 1. [Desviacion de verificacion] Paso 11 sustituido
- **Plan:** verificar `23 --expect-seeded` con el rol `juantech_preview_ro` por el tunel.
- **Real:** no se corrio. Se sustituyo por la comprobacion del preview desplegado y de los logs de su contenedor (0 `permission denied`).
- **Hueco que queda:** ninguna pagina de la rama consume todavia `home-page`, `about-page` ni `getCtaData` (`grep` en `src`: solo `cache.ts`, `cache-tags.ts`, `cta-data.ts` y los globals). El crawl de 169 URLs lee `clientes` y el doc `stack` (tablas que el rol ya podia leer, con columnas nuevas), pero NO ejercita `SELECT` sobre `home_page*` ni `about_page*`. Por eso el supuesto A7 (el rol del preview hereda SELECT sobre tablas creadas por `juantech_user`) sigue sin probarse de extremo a extremo. Se probara en cuanto el plan 54-08 o el 54-11 haga que una pagina lea esos globals; si aparece `permission denied` ahi, la causa es la de Pitfall 3 (privilegios por defecto) y se arregla con un `GRANT SELECT` por Juan.
- **Comprobacion directa posible:** `SELECT has_table_privilege('juantech_preview_ro','home_page','SELECT'), has_table_privilege('juantech_preview_ro','about_page','SELECT');` ejecutada por Juan como `juantech_user` por el tunel. Claude no la corrio (no toca la base ni abre el tunel).

### 2. [Sin cambio] Despliegue
- El plan preveia `WAIT_SECONDS=1200 54-notfound-status.mjs --wait`. Se espero con sondeo directo del estado del deploy en la API de Dokploy (el ultimo elemento de `deployments` es el mas reciente) y luego se corrieron los scripts sin `--wait`. El resultado es el mismo contrato.
- El DNS local resolvio `dev.juan-tech.com` sin problema; el `dnsfix.cjs` del scratchpad se cargo por precaucion y no cambio nada.

**Total:** 1 desviacion de verificacion con hueco documentado. Sin autocorrecciones de codigo.

## Authentication Gates

La Tarea 2 fue el gate humano previsto (acceso a la base por tunel). Juan lo completo; no hubo otros.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-54-25 a T-54-30: base confirmada antes de escribir, la migracion listo solo `phase54_shadow_content`, `sobre-mi` ausente del sitemap live, diff del script 22 limpio, sin credenciales en archivos ni en la salida. T-54-27 queda parcialmente mitigado (ver Desviacion 1).

## Supuesto A1 (planificador)

Master ignora las tablas nuevas y la fila `phase54_shadow_content` de `payload_migrations`. Evidencia: produccion en vivo (/, /en, /contact, /stack y sitemap) responde 200 despues de migrar. Queda pendiente la confirmacion explicita de Juan de que el despliegue de produccion en Dokploy no corre `payload migrate` al arrancar.

## Next Phase Readiness

- La base tiene el esquema y el contenido sombra; el preview esta desplegado con ese esquema y no cambia ningun estado de URL.
- Los planes de pagina (54-08 en adelante) ya pueden leer `home-page`, `about-page`, `clientes.onDark` y los logos del stack. El primer plan que lea los globals debe comprobar `permission denied` en los logs del preview.
- Los requisitos PAG-01, PAG-06, PAG-07 y PAG-08 siguen abiertos: este plan prepara datos y despliegue, las paginas llegan en los planes siguientes.
- Los alt de las fotos de Sobre mi quedan para revision final en la fase 56.

## Self-Check: PASSED
