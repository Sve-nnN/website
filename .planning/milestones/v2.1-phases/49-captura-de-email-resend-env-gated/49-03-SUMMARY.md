---
phase: 49-captura-de-email-resend-env-gated
plan: 03
subsystem: performance
tags: [nextjs, lighthouse, payload, cloudinary, dynamic-rendering, verification]

requires:
  - phase: 49-captura-de-email-resend-env-gated
    plan: 01
    provides: mecanismo de doble opt-in a descarga firmada probado de punta a punta, helpers puros secure-download.ts/download-token.ts
  - phase: 49-captura-de-email-resend-env-gated
    plan: 02
    provides: EmailCaptureBlock insertado en el post real technical-seo-checklist (es+en), factory buildRichTextConverters leyendo searchParams
provides:
  - Gate empírico de Lighthouse (GATE-01) sobre la ruta de post con el bloque, comparando URL plana vs ?subscribed=pending
  - Fix real de un 500 en producción (DYNAMIC_SERVER_USAGE) causado por combinar revalidate fijo con lectura de searchParams
  - Verificación final de fase: MAIL-01..05 ejercidos como una sola cadena sobre el sistema completo y descubrible
  - Reconfirmación de T-49-03 (PDFs privados) y T-49-07 (subscribers/lead-magnets fuera de sitemap/mcpPlugin) contra el estado final de archivos
affects: [50-gate-de-cierre-de-monetizaci-n]

actuals:
  tokens: 9007
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "export const dynamic = 'force-dynamic' explícito en una página que lee searchParams incondicionalmente, en vez de un revalidate numérico (ambos son incompatibles bajo el fallback ISR de Next.js — revienta con DynamicServerError/DYNAMIC_SERVER_USAGE en producción real, no solo en teoría)"
    - "Gate de Lighthouse (a)-vs-(b) sobre la MISMA ruta y el MISMO build local (mediana de 3, escalado a 5 si spread>15, mismo patrón que 45-02-PLAN.md) cuando no existe una ruta comparable en el baseline previo de la fase — la comparación válida es el delta medible, no forzar un archivo-contra-archivo que no aplica"
    - "Verificación de cadena completa sobre la superficie final (Playwright real en el post real → ruta de confirm real → descarga firmada real) en vez de replicar cada pieza por separado vía Local API, reservando el proceso hijo aislado solo para la rama que es imposible ejercer contra el servidor real (MAIL-04, env ya fijado al arrancar el proceso)"

key-files:
  created:
    - scripts/verify-phase49-lighthouse.ts
    - scripts/verify-phase49-phase-close.ts
    - .planning/phases/49-captura-de-email-resend-env-gated/lh-phase49-post-capture.json
  modified:
    - "src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx"

key-decisions:
  - "Phase 45 no tiene ninguna ruta de post en su baseline de 14 rutas (Home, /en, 8 landings de servicio, 4 geo) — no existe una 'ruta de post comparable' literal contra la cual diffear archivo-contra-archivo. En vez de fabricar una comparación inválida (local vs producción, ruta distinta), el gate estricto de GATE-01 se aplicó al delta (a) URL plana vs (b) ?subscribed=pending sobre la MISMA ruta y el MISMO build — la comparación explícitamente pedida por el <action> del plan — y los números absolutos de (a) se reportaron solo como contexto frente al rango de Phase 45, documentado así en el propio script y en este SUMMARY."
  - "EN se corrió con el mismo protocolo de mediana-de-3 que ES (no un chequeo puntual de 1 corrida): una primera corrida única mostró una caída de 25 puntos que resultó ser ruido de contención de CPU (exactamente el patrón que 45-02-PLAN.md ya documentó) — con mediana de 3 el resultado real fue estable y sin regresión."

patterns-established:
  - "Antes de aceptar un delta de Lighthouse como señal real, correr al menos 3 lecturas y comparar el spread — una sola corrida en esta misma sesión mostró una caída de 25 puntos que era enteramente ruido"

requirements-completed: [MAIL-01]

coverage:
  - id: D1
    description: "Lighthouse (a) URL plana vs (b) ?subscribed=pending sobre technical-seo-checklist (es+en), mediana de 3 (escalado a 5 si spread>15), aplicando el bar de GATE-01 (perf drop <=5, sin cruce de banda CWV, delta CLS 0.00) — PASS en ambos locales"
    requirement: "MAIL-01"
    verification:
      - kind: integration
        ref: "scripts/verify-phase49-lighthouse.ts contra build de producción real local (npm run build + npm run start), sentinel LIGHTHOUSE_PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "Fix real (Rule 1): revalidate=60 fijo era incompatible con leer searchParams -> DynamicServerError/DYNAMIC_SERVER_USAGE, la página devolvía 500 en TODAS las rutas de post en producción real antes del fix"
    verification:
      - kind: integration
        ref: "curl directo contra node .next/standalone/server.js y npm run start, antes (500) y después (200) del fix"
        status: pass
    human_judgment: false
  - id: D3
    description: "MAIL-01..05 verificados como una sola cadena sobre el sistema final y descubrible: formulario real (Playwright) -> Server Action real -> /api/newsletter/confirm real -> /blog/confirm real -> descarga firmada real; MAIL-04 vía proceso hijo aislado; MAIL-05 reconfirmado por grep"
    requirement: "MAIL-01"
    verification:
      - kind: e2e
        ref: "scripts/verify-phase49-phase-close.ts contra dev server real conectado a Dokploy, sentinels MAIL01_OK..MAIL05_OK"
        status: pass
    human_judgment: false
  - id: D4
    description: "T-49-03 (re-cierre): los 2 public_id reales de Cloudinary (es/en) siguen devolviendo 401 sin firma"
    verification:
      - kind: integration
        ref: "scripts/verify-phase49-phase-close.ts, sentinel CLOUDINARY_PRIVATE_OK"
        status: pass
    human_judgment: false
  - id: D5
    description: "T-49-07 (re-cierre): subscribers/lead-magnets confirmados fuera de SITEMAP_COLLECTIONS y del mapa de mcpPlugin, grep directo sobre el estado final de sitemap-data.ts y payload.config.ts"
    verification:
      - kind: unit
        ref: "scripts/verify-phase49-phase-close.ts sentinel SITEMAP_MCP_EXCLUSION_OK; grep -A3/-A15 del <verify> del plan también PASS"
        status: pass
    human_judgment: false

duration: 75min
completed: 2026-09-08
status: complete
---

# Phase 49 Plan 03: Lighthouse regression gate + cierre final de fase Summary

**Gate empírico de Lighthouse confirmó que leer `searchParams` en `blog/[category]/[slug]/page.tsx` no degrada el rendimiento del post real más allá del bar de GATE-01 — pero el build de producción reveló un 500 real (no solo un riesgo de performance) causado por combinar `revalidate` fijo con esa misma lectura, corregido con `dynamic = 'force-dynamic'`; los 5 requirements de la fase (MAIL-01..05) quedaron verificados como una sola cadena sobre el sistema completo y descubrible, cerrando la Phase 49.**

## Performance

- **Duration:** ~75 min
- **Started:** 2026-09-07T23:00:00-05:00 (aprox., tras cargar contexto y actualizar el worktree)
- **Completed:** 2026-09-08T00:18:56-05:00
- **Tasks:** 2/2 completadas
- **Files modified:** 5 (3 creados, 1 modificado, más el artefacto de captura)

## Accomplishments

- Confirmado el objetivo central de la fase: leer `searchParams` en la página de post (para el estado pending/already/error del `EmailCaptureBlock`, Plan 49-02) no degrada Lighthouse/CWV más allá del bar de GATE-01. Comparación (a) URL plana vs (b) `?subscribed=pending` sobre `technical-seo-checklist` (es+en), mediana de 3 corridas contra un build de producción local real — sin caída de performance > 5 puntos, sin cruce de banda de CWV, delta de CLS 0.00, en ambos locales.
- Encontrado y corregido un bug real de producción (Rule 1), no solo un riesgo de performance: `export const revalidate = 60` combinado con la lectura incondicional de `searchParams` (Plan 49-02) hace que Next.js tire `DynamicServerError`/digest `DYNAMIC_SERVER_USAGE` al intentar generar la ruta en el fallback ISR — la página devolvía **500 en absolutamente todas las rutas de post** en un build de producción real (`node .next/standalone/server.js` y `npm run start`), confirmado antes y después del fix. Corregido reemplazando el TTL fijo por `export const dynamic = 'force-dynamic'`, explícito y sin ambigüedad; `getCachedPost()` sigue cacheando la lectura de Postgres vía `unstable_cache` sin importar la clasificación de la ruta.
- Verificación final de fase: los 5 requirements (MAIL-01..05) re-verificados como **una sola cadena** sobre la superficie final y descubrible — formulario real (Playwright) en el post real → Server Action real → `/api/newsletter/confirm` real → `/blog/confirm` real → descarga firmada real de un PDF real (70011 bytes) — a diferencia de 49-01, que replicaba la escritura inicial vía Local API por no poder invocar la Server Action fuera de un request de Next.
- Camino degradado (MAIL-04) reconfirmado vía el mismo patrón de proceso hijo aislado que estableció 49-01 (necesario: el servidor real de esta verificación ya corre con `RESEND_API_KEY` real, así que la rama "no configurado" solo es ejercible en un proceso con su propio `env`).
- Reconfirmado T-49-03 (los 2 `public_id` reales de Cloudinary, es/en, siguen devolviendo 401 sin firma) y T-49-07 (`subscribers`/`lead-magnets` fuera de `SITEMAP_COLLECTIONS` y del mapa de colecciones de `mcpPlugin`, por grep directo sobre el estado final de los archivos, no asumido heredado de 49-01).

## Task Commits

Each task was committed atomically:

1. **Task 1: Lighthouse antes/después sobre la ruta de post con el bloque, contra el baseline de Phase 45** - `9390f22` (feat)
2. **Task 2: Verificación final de fase — MAIL-01..05 contra el sistema completo + cierre de accesos** - `0c488c9` (test)

## Files Created/Modified

- `scripts/verify-phase49-lighthouse.ts` - Gate de Lighthouse (a) vs (b), mediana de 3/5, bar de GATE-01, artefacto de evidencia
- `scripts/verify-phase49-phase-close.ts` - Cadena completa MAIL-01..05 sobre el sistema final + T-49-03/T-49-07 re-cierre
- `.planning/phases/49-captura-de-email-resend-env-gated/lh-phase49-post-capture.json` - Evidencia cruda de las 4 medianas (ES a/b, EN a/b)
- `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx` - `revalidate` fijo reemplazado por `dynamic = 'force-dynamic'` (fix real, ver Deviations)

## Decisions Made

- **Gap real entre el plan y el baseline de Phase 45:** el `<action>` del Task 1 pedía comparar contra "los números que Phase 45 registró para una ruta de post comparable" — pero las 14 rutas del baseline de Phase 45 (Home, `/en`, 8 landings de servicio, 4 geo) no incluyen ninguna ruta de post. Fabricar una comparación contra una ruta distinta habría sido además metodológicamente inválida por partida doble (ruta distinta + producción live vs build local). Se aplicó el bar estricto de GATE-01 al delta que el propio `<action>` sí describe explícitamente y que SÍ es válido apples-to-apples: (a) URL plana vs (b) `?subscribed=pending`, misma ruta, mismo build. Los números absolutos de (a) se reportan como contexto frente al rango de Phase 45, no como gate. Documentado en el propio script (`verify-phase49-lighthouse.ts`) y aquí para que Phase 50 no lo lea como un hueco silencioso.
- **EN promovido a mediana de 3** (no un chequeo puntual de 1 corrida como se planeó inicialmente en el script): la primera corrida única de EN mostró una caída de 25 puntos de performance y un salto de TBT de 83ms a 944ms — alarmante a primera vista, pero exactamente el patrón de ruido por contención de CPU que 45-02-PLAN.md ya documentó (spreads de hasta 25 puntos entre corridas de la MISMA ruta). Con mediana de 3, el resultado real fue estable (80→81, sin regresión). Dado que este es el gate de mayor riesgo de toda la fase, no se aceptó el número de una sola corrida sin más evidencia.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `revalidate` fijo + `searchParams` = 500 real en producción (`DYNAMIC_SERVER_USAGE`)**
- **Found during:** Task 1, primer intento de correr el `<verify>` (build de producción + `npm run start`/`node .next/standalone/server.js`)
- **Issue:** `blog/[category]/[slug]/page.tsx` (Plan 49-02) lee `searchParams` incondicionalmente, pero conservaba `export const revalidate = 60` de su diseño ISR original (Plan 45/SEO-06). Next.js marca esa combinación como contradictoria: al intentar generar la ruta en el fallback ISR (primera visita a un path no listado en `generateStaticParams`), leer `searchParams` ahí dispara `DynamicServerError`/digest `DYNAMIC_SERVER_USAGE`. La página devolvía **500 en absolutamente todas las rutas de post** (`/blog/tech-seo/technical-seo-checklist`, con o sin `?subscribed=`, y también `/en/...`), confirmado con dos runtimes distintos (`node .next/standalone/server.js` y `npm run start`).
- **Fix:** Quitar solo `revalidate` no alcanzó (seguía fallando, porque `generateStaticParams` devolviendo `[]` + `dynamicParams` default seguía intentando tratar la ruta como candidata a generación estática). Se reemplazó por `export const dynamic = 'force-dynamic'` explícito, que le dice a Next que la ruta nunca es candidata a generación estática/ISR — coincide además, mejor que antes, con la garantía original del comentario (build de Dokploy sin red hacia `shared-postgres`: con `force-dynamic` ninguna página de esta ruta se toca durante `next build`).
- **Files modified:** `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx`
- **Verification:** `curl` directo a 3 URLs (ES plana, ES con `?subscribed=pending`, EN plana) contra 2 runtimes de producción distintos — 500 antes del fix, 200 después en las 3; contenido verificado (form presente en la variante plana, ausente y reemplazado por el estado pending en la variante con parámetro, igual que 49-02 ya había verificado con Playwright); `npx tsc --noEmit` limpio.
- **Committed in:** `9390f22` (Task 1)

---

**Total deviations:** 1 auto-fix (Rule 1, bug real bloqueante — no un ajuste de performance)
**Impact on plan:** Sin este fix, Task 1 no podía siquiera correr Lighthouse (la ruta devolvía 500 antes de que cualquier medición fuera posible), y el post real con el bloque de captura de email habría estado roto en producción. El fix no cambia el comportamiento especificado por 49-01/49-02, solo corrige la clasificación de render de la ruta para que la lectura de `searchParams` (ya aprobada por el UI-SPEC) funcione sin reventar.

## Issues Encountered

- **Worktree branchado desde una base desactualizada (mismo patrón que 49-01/49-02):** el worktree de este agente arrancó de nuevo en `a1f1cb0` (merge-base con `docs/seo-handoff`), sin el trabajo de 49-01/49-02 encima. Resuelto con fast-forward (`git merge docs/seo-handoff --no-edit`, puntero puro, sin commit de merge) antes de leer el plan a fondo.
- **Worktree sin `.env` ni `node_modules`:** a diferencia de la sesión de 49-01 (que reutilizó un worktree ya provisto), este arrancó limpio. Resuelto copiando `.env` desde el checkout compartido (`cp`, nunca `Write`/`Edit` sobre un archivo con secretos) y con `npm install` (revirtiendo el ruido de metadata `peer: true` en `package-lock.json` antes de comitear, mismo hallazgo que 49-02).
- **Túnel SSH/relay `pg-relay-tmp` inestable repetidas veces** (mismo patrón que 49-01/49-02, advertido explícitamente por el orquestador): el relay `socat` en el VPS dejó de aceptar conexiones nuevas varias veces durante la sesión, incluso con el proceso SSH local todavía "vivo" — el dev server local queda entonces con un pool de conexiones a Postgres apuntando a un relay muerto y sigue fallando (500 intermitentes con `timeout exceeded when trying to connect`) hasta que se **reinicia el propio proceso Node**, no solo el túnel. Resuelto recreando el relay (`docker rm -f` + relanzar) y, cuando eso no alcanzaba, matando y relanzando también el dev/prod server para que abriera un pool nuevo contra el relay vivo. Una corrida de `verify-phase49-phase-close.ts` falló una vez con `/blog/confirm respondió 500` por contención de conexión bajo compilación concurrente de Next (exactamente la advertencia del orquestador) — confirmado transitorio con un `curl` de retry directo, y el script completo pasó limpio en el siguiente intento.

## User Setup Required

None - no external service configuration required (`RESEND_API_KEY`/Cloudinary ya estaban configurados por Juan antes de esta fase).

## Next Phase Readiness

- **Phase 49 queda cerrada, 3/3 plans ejecutados.** Los 5 requirements de la fase (MAIL-01..05) están verificados con evidencia automatizada contra el sistema completo: bloque de captura inline sin JS de cliente, doble opt-in propio, entrega vía URL firmada de Cloudinary con expiración corta, degradación limpia sin `RESEND_API_KEY`, y helpers de seguridad completamente separados de la lógica de suscripción.
- **Phase 50 (Gate de Cierre de Monetización)** puede arrancar: el hallazgo de esta fase más relevante para su propio gate es que la ruta `blog/[category]/[slug]` ahora es explícitamente `dynamic = 'force-dynamic'` (antes ISR con `revalidate=60`) — Phase 50 debe leer esa ruta específica como dinámica por diseño al comparar contra el baseline de Phase 45 (que no midió ninguna ruta de post), no como una regresión de clasificación.
- `lh-phase49-post-capture.json` queda como evidencia cruda para cualquier auditoría futura de esta comparación puntual — no es el archivo contra el que Phase 50 diffea (ese sigue siendo `lh-phase45-baseline.json`, que no tiene ruta de post).
- Los suscriptores de prueba de este plan (`phase49-03-close-happy@example.invalid`, `phase49-03-close-degraded@example.invalid`) fueron limpiados por el propio script de verificación — no quedan filas de prueba en `subscribers`.

---
*Phase: 49-captura-de-email-resend-env-gated*
*Completed: 2026-09-08*

## Self-Check: PASSED

Los 3 archivos declarados como creados existen en disco (`scripts/verify-phase49-lighthouse.ts`, `scripts/verify-phase49-phase-close.ts`, `.planning/phases/49-captura-de-email-resend-env-gated/lh-phase49-post-capture.json`); ambos commits de task (`9390f22`, `0c488c9`) confirmados presentes en `git log`.
