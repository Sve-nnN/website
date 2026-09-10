---
phase: 47-ruta-go-fix-de-middleware-registro-de-clics
plan: 01
subsystem: routing
tags: [nextjs-middleware, route-handler, payload-collection, postgres-migration, rate-limiting]

requires:
  - phase: 46-disclosure-legal-esquema-de-links-de-afiliado
    provides: "colección affiliate-links, getCachedAffiliateLinks()/pickDestination(), matriz de localización congelada"
provides:
  - "ruta /go/[slug] funcional: 302 no-store leyendo el destino exclusivamente del admin"
  - "matcher de src/middleware.ts que ya no traga /go/*"
  - "robots.txt bloqueando /go"
  - "colección affiliate-clicks (append-only) + migración aplicada contra Dokploy"
  - "descarte de bots + throttle por IP wireados vía after()"
affects: ["48-pagina-de-stack-links-inline-en-contenido"]

actuals:
  tokens: 236686
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Route Handler runtime Node dedicado (src/app/go/[slug]/route.ts) para resolver un redirect leyendo Local API, siguiendo el patrón ya usado por newsletter/confirm y redirects-lookup"
    - "after() de next/server para escritura diferida post-respuesta (primer uso en el repo)"
    - "throttle por IP extraído a util reusable (src/lib/ip-throttle.ts) separado de la detección de bots (src/lib/bot-detection.ts), en vez de reusar el honeypot de contact.ts que no aplica a un GET"

key-files:
  created:
    - src/app/go/[slug]/route.ts
    - src/collections/AffiliateClicks/index.ts
    - src/lib/bot-detection.ts
    - src/lib/ip-throttle.ts
    - src/migrations/20260904_175022_affiliate_clicks_collection.ts
    - scripts/verify-go-route.ts
    - scripts/verify-affiliate-clicks-schema.ts
    - scripts/verify-affiliate-clicks-write.ts
  modified:
    - src/middleware.ts
    - src/app/robots.ts
    - src/payload.config.ts
    - src/payload-types.ts
    - src/migrations/index.ts

key-decisions:
  - "go/ (con barra) insertado en la alternancia real y actual del matcher (post-SEO-39), no en la versión genérica citada por el ROADMAP — evita reintroducir el bug de exclusión .*\\..* que SEO-39 ya corrigió"
  - "Detección de bots construida desde cero (regex de User-Agent) en vez de reusar contact.ts, que solo tiene un honeypot de formulario sin aplicación a un GET sin formulario — corrección a un supuesto incorrecto del CONTEXT.md, confirmada por RESEARCH.md Pitfall 2"
  - "marketplace='default' fijo al llamar pickDestination() — ambas ramas del fallback devuelven una URL admin-autorada, sin riesgo de seguridad, per RESEARCH.md Assumption A2"
  - "affiliate-clicks sin campo clickedAt (createdAt automático de Payload ya cumple esa función) y sin IP cruda persistida (solo vive en memoria del proceso para el throttle)"

requirements-completed: [GO-01, GO-02, GO-03, GO-04]

coverage:
  - id: D1
    description: "/go/[slug] responde 302 con Cache-Control:no-store leyendo el destino exclusivamente de affiliate-links; ?to= se ignora; slug inactivo e inexistente devuelven el mismo 404"
    requirement: "GO-01"
    verification:
      - kind: e2e
        ref: "scripts/verify-go-route.ts (dev server real + Postgres real de Dokploy)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Matcher de src/middleware.ts excluye go/ con barra (ancla de segmento); 5 rutas control + decoy /golang-para-seo sin cambio de comportamiento"
    requirement: "GO-02"
    verification:
      - kind: e2e
        ref: "scripts/verify-go-route.ts (matriz de curl contra /, /en, /servicios, /en/services, /blog, /golang-para-seo)"
        status: pass
    human_judgment: false
  - id: D3
    description: "robots.txt incluye Disallow: /go"
    requirement: "GO-03"
    verification:
      - kind: e2e
        ref: "scripts/verify-go-route.ts (fetch /robots.txt)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Clics reales registrados en affiliate-clicks append-only vía after(); bots y requests throttled reciben el 302 correcto sin dejar fila"
    requirement: "GO-04"
    verification:
      - kind: e2e
        ref: "scripts/verify-affiliate-clicks-write.ts (throttle determinístico GO_CLICK_THROTTLE_MAX_HITS=2)"
        status: pass
      - kind: integration
        ref: "scripts/verify-affiliate-clicks-schema.ts (round-trip + update() rechazado)"
        status: pass
    human_judgment: false

duration: 65min
completed: 2026-09-04
status: complete
---

# Phase 47 Plan 01: Ruta /go + Fix de Middleware + Registro de Clics Summary

**El matcher de `src/middleware.ts` ya no traga `/go/*`, la ruta `/go/[slug]` redirige 302 leyendo el destino exclusivamente del admin, y cada clic real queda registrado en `affiliate-clicks` vía `after()` con descarte de bots y throttle por IP — todo verificado contra el Postgres real de Dokploy.**

## Performance

- **Duration:** ~65 min (incluye reconstrucción del worktree, túnel SSH y npm install)
- **Started:** 2026-09-04T17:15:00Z (aprox.)
- **Completed:** 2026-09-04T18:11:34Z
- **Tasks:** 3/3
- **Files modified:** 13 (excluyendo el snapshot JSON auto-generado de la migración)

## Accomplishments

- `src/middleware.ts`: `go/` (con barra) insertado en la alternancia real del matcher (post-SEO-39), sin tocar `api`/`admin` (mismo bug latente, fuera de alcance a propósito)
- `src/app/go/[slug]/route.ts`: route handler nuevo, runtime Node, resuelve el destino exclusivamente vía `getCachedAffiliateLinks()`/`pickDestination()` (Phase 46), `302` con `Cache-Control: no-store`, `?to=` nunca se lee, slug inexistente e inactivo indistinguibles (mismo 404)
- `src/app/robots.ts`: `Disallow: /go` agregado
- `src/collections/AffiliateClicks/index.ts` + migración aplicada: colección append-only por access control (`create`/`update` en `() => false`), sin IP cruda persistida
- `src/lib/bot-detection.ts` + `src/lib/ip-throttle.ts`: heurística de bots por User-Agent (nueva, `[ASSUMED]`) y throttle por IP (misma forma que `contact.ts`, extraído a util), wireados en el route handler vía `after()` sin agregar latencia al 302

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix del matcher + route handler /go/[slug] + robots.ts** - `a206986` (feat)
2. **Task 2: Colección affiliate-clicks + migración aditiva contra Dokploy** - `f7630ca` (feat)
3. **Task 3: Descarte de bots + throttle por IP vía after()** - `5a4481d` (feat)

**Plan metadata:** (este commit, docs)

## Files Created/Modified

- `src/middleware.ts` - matcher corregido, `go/` insertado tras `admin`
- `src/app/go/[slug]/route.ts` - route handler runtime Node, GO-01 + GO-04
- `src/app/robots.ts` - `/go` agregado a `disallow`
- `src/collections/AffiliateClicks/index.ts` - colección append-only nueva
- `src/payload.config.ts` - `AffiliateClicks` registrada en `collections:`
- `src/migrations/20260904_175022_affiliate_clicks_collection.ts` - migración aditiva aplicada
- `src/payload-types.ts` - tipo `AffiliateClick` regenerado
- `src/lib/bot-detection.ts` - `isBotUserAgent()`
- `src/lib/ip-throttle.ts` - `createIpThrottle()`/`extractClientIp()`
- `scripts/verify-go-route.ts` - matriz curl GO-01/GO-02/GO-03
- `scripts/verify-affiliate-clicks-schema.ts` - round-trip + rechazo de `update()`
- `scripts/verify-affiliate-clicks-write.ts` - escritura vía `after()` con throttle determinístico

## Decisions Made

- `go/` insertado en la alternancia REAL del matcher (post-SEO-39), no en el ejemplo desactualizado citado por el ROADMAP — evita reintroducir el bug de exclusión genérica que SEO-39 ya corrigió (ver 47-RESEARCH.md Pitfall 1)
- Detección de bots construida desde cero, NO reusando `contact.ts` (que solo tiene un honeypot de formulario) — corrección de un supuesto incorrecto documentado en 47-RESEARCH.md Pitfall 2
- `marketplace='default'` fijo en `pickDestination()`: ambas ramas del fallback devuelven una URL admin-autorada, sin riesgo de open-redirect
- `affiliate-clicks` sin `clickedAt` (usa `createdAt` automático) y sin IP cruda persistida (la IP solo vive en memoria del proceso, para el throttle)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree desactualizado — faltaban 45/46/47 del historial**

- **Found during:** Carga inicial de contexto
- **Issue:** El worktree asignado (`worktree-agent-a00820a2b8008de5f`) estaba anclado en un commit (`a1f1cb0`) anterior a la creación del plan de la Fase 47 en `docs/seo-handoff` — faltaban las Fases 45, 46 y el propio `47-01-PLAN.md`.
- **Fix:** `git merge --ff-only ef291b8` (fast-forward puro, sin reescritura de historia, sin tocar ramas protegidas).
- **Verificación:** `git merge-base --is-ancestor` confirmó que era un fast-forward limpio antes de aplicarlo.

**2. [Rule 3 - Blocking] `.env` y `node_modules` ausentes en el worktree**

- **Found during:** Carga inicial de contexto
- **Issue:** El worktree es un checkout físico separado; `.env` (gitignored) y `node_modules` no se copian automáticamente.
- **Fix:** Copiado `.env` desde el checkout principal (mismo repositorio, mismas credenciales de producción, sin escribir nada nuevo); `npm install` con Node v20.20.0 (vía `nvm`, ya que el sistema traía v24 y el proyecto fija v22 en `.node-version`, más cercano a v20 disponible localmente que a v24).
- **Verificación:** `npx tsc --noEmit` limpio en cada task.

**3. [Rule 3 - Blocking] `DATABASE_URI` apunta a un host interno de Docker inalcanzable desde el sandbox**

- **Found during:** Confirmación de base de datos previa a la migración (paso obligatorio de CLAUDE.md)
- **Issue:** `DATABASE_URI` en `.env` apunta a `shared-postgres:5432`, alcanzable solo dentro de `dokploy-network` en el VPS — no directamente desde este entorno.
- **Fix:** Levantado el túnel SSH + relay `socat` documentado en `scripts/db/tunnel.sh` (mismo mecanismo, sin modificar el script), confirmado el target real con `scripts/db/04-which-database.ts` (conteos y valores testigo coinciden exactamente con producción en vivo), migración generada/aplicada a través del túnel, y `.env` restaurado a su valor original (`shared-postgres`) al finalizar — nunca se dejó apuntando al túnel.
- **Verificación:** `04-which-database.ts` confirmó host/conteos/valores testigo contra `https://juan-tech.com` en vivo antes de migrar.

**4. [Rule 1 - Bug de entorno de test, no de producto] Flakiness de `unstable_cache` en verificación cross-proceso**

- **Found during:** Task 3, primeras corridas de `scripts/verify-affiliate-clicks-write.ts`
- **Issue:** Los scripts de verificación (procesos `tsx` separados del dev server) escriben en `affiliate-links`/`affiliate-clicks` vía Local API; el hook `afterChange` intenta invalidar la cache (`revalidateTag`/`revalidatePath`), pero esas llamadas no tienen efecto fuera de un contexto de request real de Next — es un límite ya documentado en `src/lib/cache-tags.ts` y en el propio `46-...verify-affiliate-links-cache.ts`. Combinado con reusar el mismo dev server (y el mismo throttle por IP a nivel de módulo) entre corridas repetidas del script, esto producía falsos negativos.
- **Fix:** No es un bug de producto — el mecanismo de cache/invalidación funciona correctamente cuando la escritura ocurre desde dentro de la app real (panel de admin). Ajustada la disciplina de verificación: reiniciar el dev server (con `.next` limpio) antes de cada corrida aislada del script, y reemplazado un `wait()` fijo por un poll con timeout generoso (10s) para el conteo esperado, dando margen a la inicialización de Payload/pool dentro del primer `after()`.
- **Files modified:** `scripts/verify-affiliate-clicks-write.ts` (solo el script de verificación, no el código de producto)
- **Verificación:** Corrida limpia final (`.next` recién borrado, dev server recién iniciado, script corrido una sola vez) → `PASS`.

---

**Total deviations:** 4 auto-fixed (3 bloqueantes de entorno, 1 de disciplina de test) — ninguno tocó el alcance ni el diseño del producto entregado.
**Impact on plan:** Todas las desviaciones fueron necesarias para poder ejecutar el plan contra la única base de datos real que existe (sin sandbox). Cero scope creep sobre GO-01..04.

## Issues Encountered

- Un flake puntual de `500` en `/` durante la primera verificación de Task 1 (timeout de conexión Postgres en medio de una ráfaga de compilación en frío de Next dev, agravado por la latencia extra del túnel SSH+socat) — no reproducible en corridas subsiguientes con el servidor ya "tibio"; no relacionado con el fix del matcher (confirmado repitiendo la matriz de control dos veces limpio).

## User Setup Required

None - no se requiere configuración externa manual. La migración ya se aplicó contra Dokploy como parte de esta ejecución.

## Next Phase Readiness

- Phase 48 (`/stack` + links inline) puede arrancar: `/go/[slug]` ya redirige correctamente y `affiliate-clicks` ya registra clics — Phase 48 solo necesita renderizar el `href="/go/{slug}"`, sin tocar middleware ni schema.
- Ningún UI del sitio emite todavía un `href="/go/"` (a propósito, per el boundary de esta fase) — verificado únicamente por curl/fetch directo.
- `GO_CLICK_THROTTLE_WINDOW_MS`/`GO_CLICK_THROTTLE_MAX_HITS` quedan sin definir en `.env` de producción (caen a los defaults de 10 min / 20 hits), tal como está diseñado — no requiere acción de Juan.

---
*Phase: 47-ruta-go-fix-de-middleware-registro-de-clics*
*Completed: 2026-09-04*

## Self-Check: PASSED

Todos los archivos declarados (`src/middleware.ts`, `src/app/robots.ts`, `src/app/go/[slug]/route.ts`, `src/collections/AffiliateClicks/index.ts`, la migración, `src/lib/bot-detection.ts`, `src/lib/ip-throttle.ts`, los 3 scripts de verificación) existen en disco. Los 3 commits de task (`a206986`, `f7630ca`, `5a4481d`) existen en `git log`.
