---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
plan: 02
subsystem: infra
tags: [preview, noindex, robots, middleware, next-config, rewrites, server-actions, readonly]

requires:
  - phase: 53-01
    provides: rama feat/mui-redesign y layout de (frontend) con proveedores MUI
provides:
  - isPreviewReadonly() leida en runtime (src/lib/preview.ts)
  - noindex por X-Robots-Tag (config y middleware), meta robots y robots.txt sin sitemap
  - 404 plano para /admin, /api (salvo redirects-lookup y newsletter) y sitemaps via /preview-blocked
  - seis rutas que escriben inertes con PREVIEW_READONLY=true
  - scripts de contrato (53-preview-contract.mjs) y de auditoria de compuertas (53-write-gates.mjs)
affects: [53-06, 54, 55, 56, 57]

plan_head_before: 5717b0bd15184fc566c77ea0a50638383047dabf

actuals:
  tokens: 7300
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Bandera de preview leida en runtime con process.env (nunca NEXT_PUBLIC_*), modulo sin imports para que cargue en Edge"
    - "Rewrites beforeFiles hacia una ruta estatica de primer nivel que responde 404 (evita el 500 de SEO-39)"
    - "Compuerta isPreviewReadonly() despues de validar y antes de la primera escritura, auditada por script"

key-files:
  created:
    - src/lib/preview.ts
    - src/app/preview-blocked/route.ts
    - scripts/verify/53-preview-contract.mjs
    - scripts/verify/53-write-gates.mjs
  modified:
    - src/app/robots.ts
    - src/middleware.ts
    - next.config.mjs
    - "src/app/go/[slug]/route.ts"
    - src/app/actions/subscribe.tsx
    - src/app/actions/subscribe-lead-magnet.tsx
    - src/app/actions/contact.ts
    - src/app/api/newsletter/confirm/route.ts
    - src/app/api/newsletter/unsubscribe/route.ts
    - "src/app/(frontend)/[locale]/layout.tsx"

key-decisions:
  - "Sin PREVIEW_READONLY todo queda como antes: headers() sin X-Robots-Tag, rewrites() vacio, robots.txt con su cuerpo, middleware con el mismo handle"
  - "El bloque export const config de middleware.ts queda identico a HEAD (md5 921ab917...)"
  - "NEXT_PUBLIC_SERVER_URL no se toca: los canonicals del preview siguen apuntando a produccion (se fija en Dokploy, plan 06)"

patterns-established:
  - "El supuesto A4 de RESEARCH se cumple: Next 15.4.11 acepta la regla /api/:path((?!redirects-lookup(?:/|$)|newsletter(?:/|$)).+) y deja pasar las dos rutas permitidas"

requirements-completed: []
requirements-advanced: [BASE-01]

coverage:
  - id: D1
    description: "Con la bandera, /robots.txt da Disallow: / sin Sitemap y con x-robots-tag noindex; /sitemap.xml y /sitemap.html dan 404"
    requirement: BASE-01
    verification:
      - kind: integration
        ref: "node scripts/verify/53-preview-contract.mjs --spawn (servidor standalone real, PREVIEW_READONLY=true), 14 PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "/admin, /admin/login, /api/users y /api/graphql dan 404; /api/redirects-lookup y /api/newsletter/confirm siguen vivos"
    requirement: BASE-01
    verification:
      - kind: integration
        ref: "53-preview-contract.mjs --spawn"
        status: pass
    human_judgment: false
  - id: D3
    description: "Produccion intacta sin la bandera: next.config sin X-Robots-Tag ni rewrites, mismas cabeceras, matcher del middleware identico a HEAD"
    requirement: BASE-01
    verification:
      - kind: other
        ref: "53-preview-contract.mjs --config-check (13 PASS) y md5 del bloque export const config de middleware.ts igual a HEAD"
        status: pass
    human_judgment: false
  - id: D4
    description: "Las seis rutas que escriben cortan antes de cualquier create, update, sendEmail o find (lead magnet)"
    requirement: BASE-01
    verification:
      - kind: other
        ref: "node scripts/verify/53-write-gates.mjs -> OK; control negativo: sin la compuerta en contact.ts imprime FAIL y sale con 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "Meta robots noindex, nofollow en el HTML de paginas reales y primer enlace /go/ de /stack con 302 o 307"
    requirement: BASE-01
    verification: []
    human_judgment: false
    rationale: "Esas paginas leen Postgres y este plan no corre contra ninguna base. El contrato ya tiene las comprobaciones (modo sin SKIP_DB_PAGES); se ejecutan contra dev.juan-tech.com en el plan 06."

duration: 30min
completed: 2026-11-07
status: complete
---

# Phase 53 Plan 02: Preview de solo lectura en codigo Summary

**Bandera PREVIEW_READONLY leida en runtime que aplica noindex (cabecera y meta), robots.txt sin sitemap, 404 en admin, api y sitemaps, y deja inertes las seis rutas que escriben, sin tocar el comportamiento de produccion.**

## Performance

- **Duration:** aprox. 30 min
- **Started:** 2026-11-07T16:05:00Z (aprox.)
- **Completed:** 2026-11-07T16:42:00Z
- **Tasks:** 3 (Task 1 tracer, Tasks 2 y 3 auto)
- **Files modified:** 14

## Accomplishments

- `isPreviewReadonly()` sin imports, leida de `process.env` en cada llamada, usable desde Edge, server actions, route handlers y `robots.ts`.
- Las tres capas de gating: codigo en runtime, middleware con `X-Robots-Tag` y `next.config.mjs` con la cabecera y las rewrites `beforeFiles` hacia `/preview-blocked`.
- El tracer se verifico de punta a punta con un servidor standalone real (`npm run build` con la bandera y `--spawn`): 14 comprobaciones PASS.
- Seis escrituras inertes con el mismo exito visible que el camino real (sin la palabra "simulado"): `/go` redirige sin registrar clic, `subscribe` devuelve `success`, el lead magnet redirige a `?subscribed=pending`, el contacto a `?sent=true`, confirm y unsubscribe a `/blog?newsletter=...` sin consultar la base.
- `53-write-gates.mjs` protege contra escrituras futuras sin compuerta (recorre `go`, `actions` y `api/newsletter`).

## Task Commits

1. **Task 1: Camino minimo noindex y 404 (tracer)** - `a39ec1a` (feat)
2. **Task 2: Seis escrituras inertes y auditoria de compuertas** - `078fc9e` (feat)
3. **Task 3: metadata robots noindex condicional** - `f6316a4` (feat)

**Plan metadata:** commit docs de cierre (ver el log de la rama)

## Files Created/Modified

- `src/lib/preview.ts` - `isPreviewReadonly()`
- `src/app/preview-blocked/route.ts` - 404 plano para GET, POST, PUT, PATCH, DELETE y HEAD
- `src/app/robots.ts` - `force-dynamic` y rama `Disallow: /` sin sitemap
- `src/middleware.ts` - `handle` (cuerpo original) y nuevo `middleware` que agrega `X-Robots-Tag`; `config` sin cambios
- `next.config.mjs` - `isPreview`, cabecera condicional y `rewrites()` con `beforeFiles`
- `src/app/go/[slug]/route.ts`, `src/app/actions/{subscribe,subscribe-lead-magnet,contact}`, `src/app/api/newsletter/{confirm,unsubscribe}/route.ts` - compuertas
- `src/app/(frontend)/[locale]/layout.tsx` - `robots: { index: false, follow: false }` condicional
- `scripts/verify/53-preview-contract.mjs`, `scripts/verify/53-write-gates.mjs` - verificacion

## Decisions Made

- Sin la bandera, produccion queda igual. El script `--config-check` lo prueba comparando las cabeceras con y sin bandera.
- `NEXT_PUBLIC_SERVER_URL` no se toca en el codigo. En Dokploy se fija a `https://juan-tech.com` (plan 06) para que los canonicals no cambien.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Peticion directa a /preview-blocked respondia 308 en vez de 404**
- **Found during:** Task 1, primera corrida de `--spawn`
- **Issue:** `/preview-blocked` entra por el matcher del middleware (no esta en la lista de exclusion). next-intl lo reescribia a `/es/preview-blocked` y la respuesta era una redireccion 308. Las rewrites del preview no pasan por el middleware, asi que `/admin` y `/api/*` ya daban 404; solo fallaba el acceso directo, que el contrato exige como 404.
- **Fix:** en el envoltorio `middleware`, con la bandera activa, `/preview-blocked` se deja pasar con `NextResponse.next()` para que responda su 404. No se toco el bloque `export const config` (la restriccion del plan). Sin la bandera, `middleware` llama a `handle` sin ningun cambio.
- **Files modified:** `src/middleware.ts`
- **Verification:** `--spawn` pasa los 14 checks; md5 del bloque `export const config` igual a HEAD
- **Commit:** `a39ec1a`

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** ninguno sobre el alcance ni sobre produccion.

## Auth Gates

Ninguno.

## Verification Results

| Comprobacion | Resultado |
|---|---|
| `node scripts/verify/53-preview-contract.mjs --config-check` | 13 PASS, exit 0 |
| `npm run build` con `PREVIEW_READONLY=true` y variables ficticias (3 veces, la ultima con todos los cambios) | exit 0; Next 15.4.11 acepta la regla de rewrite con lookahead (supuesto A4 confirmado) |
| `node scripts/verify/53-preview-contract.mjs --spawn` | 14 PASS (robots, sitemaps, admin, api, preview-blocked, redirects-lookup y newsletter vivos), exit 0 |
| `node scripts/verify/53-write-gates.mjs` | `OK`; con la compuerta quitada de contact.ts imprime `FAIL ... no llama isPreviewReadonly()` y sale con 1 |
| `npx tsc --noEmit` | exit 0 |
| md5 del bloque `export const config` de `middleware.ts` | igual a HEAD (`921ab9174c4aff2fa36ad6a4a7d6e3a2`) |
| `node scripts/verify/53-layer-check.mjs` (regresion del plan 01) | OK |

## Deferred

- Meta robots `noindex, nofollow` en el HTML de paginas reales, x-robots-tag en `/` y `/en`, y el 302 de `/go/` desde `/stack`: requieren paginas que leen Postgres. El modo sin `SKIP_DB_PAGES` ya las comprueba; se corre contra `dev.juan-tech.com` en el plan 06. En el build local solo se prerrenderiza `_not-found.html`, que lleva su propio `noindex`.
- `PREVIEW_READONLY=true` debe existir al construir en Dokploy (RESEARCH A3/Pitfall 5); la verificacion del plan 06 con `curl` lo confirma.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno. Las rutas nuevas (`/preview-blocked`) solo devuelven 404 y no leen datos.

## Issues Encountered

BASE-01 no se marca completo: `requirements mark-complete` lo marco y se revirtio, porque el preview en `dev.juan-tech.com` con el rol Postgres de solo lectura llega con el plan 06. Este plan aporta la parte de codigo.


`state.update-progress` y `roadmap.update-plan-progress` no actualizan los contadores (aviso del plan anterior); se marca la lista de control de ROADMAP.md a mano.

## Next Phase Readiness

- Listo para el plan 06 (Dokploy y rol Postgres de solo lectura): el codigo ya respeta la bandera. Faltan `PREVIEW_READONLY=true` y `NEXT_PUBLIC_SERVER_URL` en el entorno, y correr el contrato contra `BASE_URL`.

## Self-Check: PASSED

- Archivos creados presentes: `src/lib/preview.ts`, `src/app/preview-blocked/route.ts`, `scripts/verify/53-preview-contract.mjs`, `scripts/verify/53-write-gates.mjs`.
- Commits `a39ec1a`, `078fc9e` y `f6316a4` presentes en `feat/mui-redesign`.
