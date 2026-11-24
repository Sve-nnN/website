---
phase: 47-ruta-go-fix-de-middleware-registro-de-clics
verified: 2026-09-04T00:00:00Z
status: passed
score: 5/5 must-haves verified at code level
behavior_unverified: 4
overrides_applied: 0
human_verification:
  - test: "Correr scripts/verify-go-route.ts contra el dev server real conectado al Postgres real de Dokploy (vía scripts/db/tunnel.sh) y confirmar PASS."
    expected: "302 con Location exacto + Cache-Control:no-store para el slug activo; ?to= ignorado; inactivo e inexistente devuelven 404 con el mismo body; /go pelado 404; las 5 rutas control responden 200; /golang-para-seo sigue 404; robots.txt contiene Disallow:/go."
    why_human: "Requiere el túnel SSH a la base de datos de producción (shared-postgres en Dokploy), explícitamente bloqueado en este entorno de verificación (sandbox). No se puede levantar el dev server contra datos reales sin él."
  - test: "Correr scripts/verify-affiliate-clicks-schema.ts contra Dokploy y confirmar PASS (incluye el intento de update() rechazado)."
    expected: "count()=0 antes/después del round-trip; update() con overrideAccess:false lanza/rechaza."
    why_human: "Mismo bloqueo de túnel SSH — no se puede ejecutar Local API contra el Postgres real desde este entorno."
  - test: "Correr scripts/verify-affiliate-clicks-write.ts con GO_CLICK_THROTTLE_WINDOW_MS=60000 GO_CLICK_THROTTLE_MAX_HITS=2 y confirmar PASS (2 clics normales escriben 2 filas; el 3ro throttled y un UA de bot no escriben fila, ambos con 302 correcto)."
    expected: "count(affiliate-clicks where slug=...) llega a 2 y se estabiliza ahí pese a 2 requests adicionales."
    why_human: "Requiere dev server + Postgres real vía túnel SSH + timing real de after(); no reproducible sin la base de datos de producción (no hay entorno de staging)."
  - test: "Confirmar que la migración 20260904_175022_affiliate_clicks_collection.ts efectivamente se aplicó contra el Postgres real de Dokploy (tabla affiliate_clicks existe en la base viva)."
    expected: "La tabla existe en la base de producción, con las columnas/índices exactos del archivo de migración."
    why_human: "Solo se puede confirmar consultando la base real vía túnel SSH, bloqueado en este entorno. El archivo de migración está registrado en src/migrations/index.ts y su up() es puramente aditivo (verificado), pero su aplicación efectiva contra la base viva no se puede re-probar desde acá."
---

# Phase 47: Ruta /go + Fix de Middleware + Registro de Clics — Verification Report

**Phase Goal:** Un clic en un link de afiliado no-Amazon llega a destino — `/go/[slug]` devuelve 302 con `no-store` leyendo el destino exclusivamente del documento autorizado en el admin, el matcher del middleware deja de tragarse `/go`, robots.txt lo bloquea, y el clic queda registrado sin pesar en la respuesta.
**Verified:** 2026-09-04
**Status:** human_needed
**Re-verification:** No — initial verification
**Branch verified:** `docs/seo-handoff` (commits `a206986`, `f7630ca`, `5a4481d` — no mergeados a `master` todavía, mismo patrón que Phase 46; no bloquea esta verificación)

## Método

Toda la evidencia de este reporte proviene de lectura directa del código en disco, del archivo de migración generado, de `git log`/`git show` sobre los 3 commits de task, de una prueba independiente y determinística de la semántica del regex del matcher (ejecutada por este verificador, no tomada del SUMMARY), de `npx tsc --noEmit`, de un grep de deuda técnica, y de un `curl` público a `https://juan-tech.com/robots.txt` (no requiere DB). **No se intentó el túnel SSH a la base de datos de producción** (`scripts/db/tunnel.sh`) — está explícitamente fuera de los límites de este entorno de verificación. Por lo tanto, ningún resultado de los 3 scripts de verificación (`verify-go-route.ts`, `verify-affiliate-clicks-schema.ts`, `verify-affiliate-clicks-write.ts`) reportado como `PASS` en 47-01-SUMMARY.md fue re-ejecutado ni confirmado de forma independiente — se tratan como pendientes de confirmación humana, no como verificados.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `go/` está insertado en la alternancia real del matcher, `api`/`admin` intactos | ✓ VERIFIED | `src/middleware.ts:154` — grep directo confirma `admin|go/|_next` consecutivos; prueba de regex independiente (ver abajo) confirma que `/gobierno`, `/administracion`, `/apitools` mantienen su comportamiento pre-fix (nada tocado en `api`/`admin`) y que `/go/notion`/`/go/` quedan excluidos mientras `/golang-para-seo` sigue pasando por next-intl igual que antes |
| 2 | El route handler nunca lee `?to=`/`searchParams`, y un slug inexistente vs. inactivo son indistinguibles | ✓ VERIFIED (código) / ⚠️ comportamiento en runtime no re-ejecutado | `src/app/go/[slug]/route.ts` no referencia `request.nextUrl.searchParams` en ningún punto ejecutable (solo aparece en un comentario, línea 22); `getCachedAffiliateLinks('es')` usa `overrideAccess:false`, y `src/access/authenticatedOrActive.ts` filtra la query a `active:true` para requests no autenticados — así que un slug inactivo NUNCA aparece en `docs`, y el mismo `if (!doc \|\| !doc.active)` cubre ambos casos con el mismo `return new NextResponse('Not Found', {status:404})`. Estructuralmente es un único camino de código, no dos ramas que coincidan por casualidad |
| 3 | `robots.ts` incluye `Disallow: /go` | ✓ VERIFIED | `src/app/robots.ts:10` — `disallow: ['/admin', '/api', '/go']`. Nota: `curl https://juan-tech.com/robots.txt` en vivo todavía NO muestra `/go` porque esta fase vive en `docs/seo-handoff`, sin mergear a `master` (mismo patrón que Phase 46) — no es un gap del código, es un estado de despliegue pendiente |
| 4 | `affiliate-clicks` es append-only estructural (no por convención) y la migración es puramente aditiva | ✓ VERIFIED | `src/collections/AffiliateClicks/index.ts` — `create: () => false, update: () => false` en el objeto `access`, no un comentario; `src/migrations/20260904_175022_affiliate_clicks_collection.ts` `up()` contiene solo `CREATE TABLE`, `ALTER TABLE ... ADD COLUMN`, `CREATE INDEX`, `ALTER TABLE ... ADD CONSTRAINT` — cero `ALTER COLUMN`/`DROP` fuera de `down()`; migración registrada en `src/migrations/index.ts`; tipo `AffiliateClick` presente en `src/payload-types.ts` |
| 5 | Bot-detection/throttle solo suprimen la escritura del clic, nunca el redirect | ✓ VERIFIED | `src/app/go/[slug]/route.ts` construye `response` (302) antes de evaluar `shouldLog`; el `after(...)` que escribe a `affiliate-clicks` está envuelto en `if (shouldLog)`, pero el `return response` final es incondicional y ocurre siempre después — no existe ninguna rama de código que omita el `return response` |

**Score:** 5/5 truths verificadas a nivel de código y control de flujo. 4 de esas 5 (todas menos la #3, que es puramente estática) tienen un componente de comportamiento en runtime (302 real, escritura real vía `after()`, throttle real bajo carga, migración aplicada contra la base real) que **no fue re-ejecutado por este verificador** — ver Human Verification abajo.

### Prueba independiente del matcher (no tomada del SUMMARY)

Se extrajo el string literal exacto de `export const config = { matcher: [...] }` de `src/middleware.ts` y se evaluó como `RegExp` real en Node, contra 16 casos (rutas control, decoys, `go/*`, `api`/`admin` y sus prefijos-trampa, assets estáticos):

```
/en                  passes-through-to-next-intl= true   OK
/servicios           passes-through-to-next-intl= true   OK
/en/services         passes-through-to-next-intl= true   OK
/blog                passes-through-to-next-intl= true   OK
/golang-para-seo     passes-through-to-next-intl= true   OK   (decoy, no debe ser tragado)
/go/notion           passes-through-to-next-intl= false  OK   (excluido — nunca entra a next-intl)
/go/                 passes-through-to-next-intl= false  OK
/gobierno            passes-through-to-next-intl= true   OK   (bug de prefijo NO reintroducido)
/admin               passes-through-to-next-intl= false  OK
/administracion      passes-through-to-next-intl= false  OK   (bug latente preexistente, sin tocar — correcto, fuera de alcance)
/api                 passes-through-to-next-intl= false  OK
/apitools             passes-through-to-next-intl= false  OK
/robots.txt          passes-through-to-next-intl= false  OK
/sitemap.xml          passes-through-to-next-intl= false  OK
/sitemap.html         passes-through-to-next-intl= false  OK
/llms.txt             passes-through-to-next-intl= false  OK
/favicon.ico          passes-through-to-next-intl= false  OK
ALL_OK
```

Esto confirma mecánicamente GO-02 sin necesitar un dev server: `/go/*` queda fuera de `createIntlMiddleware`/el fetch loopback a `/api/redirects-lookup`, las rutas control no cambian, el decoy no es tragado, y `api`/`admin` no fueron tocados (su bug de prefijo preexistente sigue ahí, tal como el CONTEXT.md decidió dejarlo).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/middleware.ts` | `go/` insertado tras `admin`, resto intacto | ✓ VERIFIED | Confirmado por lectura + prueba de regex independiente |
| `src/app/go/[slug]/route.ts` | Route handler runtime Node | ✓ VERIFIED | `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, lógica completa presente |
| `src/app/robots.ts` | `Disallow: /go` | ✓ VERIFIED | Línea 10 |
| `src/collections/AffiliateClicks/index.ts` | Colección append-only | ✓ VERIFIED | `create`/`update` en `() => false` |
| `src/migrations/20260904_175022_affiliate_clicks_collection.ts` | Migración aditiva | ✓ VERIFIED (contenido) / ⚠️ aplicación contra Dokploy no confirmable por mí | `up()` solo CREATE/ALTER ADD/ADD CONSTRAINT; registrada en `src/migrations/index.ts` |
| `src/lib/bot-detection.ts` | `isBotUserAgent()` | ✓ VERIFIED | Regex + UA vacío tratado como bot |
| `src/lib/ip-throttle.ts` | `createIpThrottle()`/`extractClientIp()` | ✓ VERIFIED | Misma forma que `contact.ts` (Map + ventana), `contact.ts` sin tocar |
| `scripts/verify-go-route.ts` | Script e2e real | ✓ VERIFIED (sustancia) | 133 líneas, checks reales, no stub — no re-ejecutado |
| `scripts/verify-affiliate-clicks-schema.ts` | Script e2e real | ✓ VERIFIED (sustancia) | 78 líneas, incluye prueba de rechazo de `update()` — no re-ejecutado |
| `scripts/verify-affiliate-clicks-write.ts` | Script e2e real | ✓ VERIFIED (sustancia) | 152 líneas, throttle determinístico + poll — no re-ejecutado |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/middleware.ts` matcher | `/go/[slug]` route handler | Exclusión `go/` en el negative lookahead | ✓ WIRED | Confirmado por prueba de regex — `/go/*` nunca ejecuta `middleware()`/`createIntlMiddleware` |
| `/go/[slug]/route.ts` | `getCachedAffiliateLinks()`+`pickDestination()` (Phase 46, sin modificar) | Import directo | ✓ WIRED | `src/lib/cache.ts`/`src/lib/affiliate.ts` no modificados por esta fase (confirmado leyendo ambos archivos) |
| `/go/[slug]/route.ts` | `payload.create({collection:'affiliate-clicks'})` | `after()` | ✓ WIRED (código) | Import de `after` desde `next/server` confirmado real (`typeof next/server.after === 'function'` en Next 15.4.11 instalado) |
| `bot-detection.ts`+`ip-throttle.ts` | Gate de `after()`, nunca del `return response` | Control de flujo | ✓ WIRED | `response` se construye antes del `if (shouldLog)`; `return response` es incondicional |
| `payload.config.ts` | `AffiliateClicks` | `collections: [...]` | ✓ WIRED | Registrada únicamente en `collections:`, no en `seoPlugin`/`redirectsPlugin`/`searchPlugin`/`mcpPlugin` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| GO-01 | 47-01 | `/go/[slug]` 302 no-store, destino exclusivo del admin, sin `?to=` | ✓ SATISFIED (código); comportamiento runtime pendiente de confirmación humana | Ver Truth #2 |
| GO-02 | 47-01 | Matcher excluye `go/` con barra, ancla de segmento, sin tocar `api`/`admin` | ✓ SATISFIED | Ver Truth #1 + prueba de regex |
| GO-03 | 47-01 | `robots.ts` con `Disallow: /go` | ✓ SATISFIED | Ver Truth #3 |
| GO-04 | 47-01 | `affiliate-clicks` append-only vía `after()`, descarte de bots/throttle | ✓ SATISFIED (código); comportamiento runtime pendiente de confirmación humana | Ver Truth #4 y #5 |

Sin requirements huérfanos — REQUIREMENTS.md solo mapea GO-01..04 a Phase 47 y los 4 están cubiertos por 47-01-PLAN.md.

### Anti-Patterns Found

Ninguno. Grep de `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|placeholder|coming soon|not yet implemented` sobre los 6 archivos de producto de esta fase: cero resultados. `npx tsc --noEmit` limpio.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Semántica del matcher (16 casos, incluye decoy + `api`/`admin` sin tocar) | Script Node que evalúa el `RegExp` real extraído del archivo | `ALL_OK` | ✓ PASS |
| `after` es una función real exportada por `next/server` en la versión instalada | `node -e "require('next/server').after"` | `function` | ✓ PASS |
| `robots.txt` en producción viva | `curl https://juan-tech.com/robots.txt` | Todavía sin `/go` (código no mergeado a `master`) | ? SKIP — informativo, no es gap de código |
| `tsc --noEmit` | `npx tsc --noEmit` | Sin salida (limpio) | ✓ PASS |
| E2E completo (`verify-go-route.ts`, `verify-affiliate-clicks-schema.ts`, `verify-affiliate-clicks-write.ts`) contra dev server + Postgres real de Dokploy | — | No ejecutado | ? SKIP — requiere túnel SSH bloqueado en este entorno |

### Human Verification Required

Ver también el bloque `human_verification` en el frontmatter (los mismos 4 ítems, en formato estructurado).

#### 1. Ejecutar `scripts/verify-go-route.ts` contra el dev server real + Dokploy

**Test:** Levantar el túnel SSH (`scripts/db/tunnel.sh`), confirmar la base con `scripts/db/04-which-database.ts`, levantar `npm run dev`, correr `node --env-file=.env node_modules/.bin/tsx scripts/verify-go-route.ts`.
**Expected:** `PASS` — 302+Location+no-store para slug activo, `?to=` ignorado, 404 idéntico para inactivo/inexistente, `/go` pelado 404, 5 rutas control en 200, decoy en 404, `robots.txt` con `/go`.
**Why human:** Túnel SSH a la base de datos de producción, explícitamente bloqueado en este entorno de verificación.

#### 2. Ejecutar `scripts/verify-affiliate-clicks-schema.ts`

**Test:** Mismo entorno que el ítem 1, correr el script.
**Expected:** `PASS` — round-trip limpio y `update()` con `overrideAccess:false` rechazado.
**Why human:** Mismo bloqueo de túnel SSH.

#### 3. Ejecutar `scripts/verify-affiliate-clicks-write.ts` con throttle determinístico

**Test:** `GO_CLICK_THROTTLE_WINDOW_MS=60000 GO_CLICK_THROTTLE_MAX_HITS=2 npm run dev`, luego correr el script.
**Expected:** `PASS` — 2 clics normales escriben 2 filas, el 3ro (throttled) y un UA de bot no escriben fila, los 4 reciben 302 correcto.
**Why human:** Requiere timing real de `after()` bajo un dev server conectado a Postgres real vía túnel SSH — no reproducible sin la base de producción (no existe staging).

#### 4. Confirmar que la migración se aplicó efectivamente contra Dokploy

**Test:** Vía el túnel, consultar `information_schema.tables` o `\d affiliate_clicks` en el Postgres real.
**Expected:** La tabla `affiliate_clicks` existe con las columnas/índices exactos del archivo de migración.
**Why human:** Solo verificable consultando la base viva; el archivo de migración en sí ya fue confirmado aditivo-only y registrado correctamente en `src/migrations/index.ts`.

### Gaps Summary

No se encontraron gaps de código. Los 5 truths derivados de los 4 success criteria del ROADMAP y de GO-01..04 están implementados correctamente a nivel de código, control de flujo y schema — confirmado por lectura directa, una prueba de regex independiente (no tomada del SUMMARY), lectura completa de la migración, y `tsc --noEmit` limpio. Ningún artefacto es un stub, ningún link está huérfano, y no hay marcadores de deuda técnica.

Lo que este verificador **no pudo confirmar de forma independiente** — y por lo tanto no cuenta como verificado solo porque 47-01-SUMMARY.md lo declare `PASS` — es el comportamiento en runtime contra la base de datos real de Dokploy: la ejecución efectiva de los 3 scripts de verificación (`verify-go-route.ts`, `verify-affiliate-clicks-schema.ts`, `verify-affiliate-clicks-write.ts`) y la aplicación real de la migración contra esa base. El túnel SSH necesario para eso está fuera de los límites de este entorno de verificación por diseño. Estos 4 puntos quedan como verificación humana pendiente, no como fallas.

Nota adicional (no es un gap): el código de esta fase vive en `docs/seo-handoff` y no está mergeado a `master` — `https://juan-tech.com/robots.txt` en vivo todavía no muestra `Disallow: /go`. Esto replica el patrón ya usado al cerrar Phase 46 (verificación en la rama, decisión de merge diferida a Juan) y no bloquea esta verificación de fase.

---

*Verified: 2026-09-04*
*Verifier: Claude (gsd-verifier)*
