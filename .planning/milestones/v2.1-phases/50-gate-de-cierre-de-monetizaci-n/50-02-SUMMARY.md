---
phase: 50-gate-de-cierre-de-monetizaci-n
plan: "02"
subsystem: monetization-gate-verification
tags: [gate, affiliate, compliance, verification, deployment-gap]
dependency-graph:
  requires: ["46", "47", "48", "48.5", "49"]
  provides:
    - "GATE-02 verdict: PASS"
    - "50-affiliate-crawl.json (raw crawl evidence)"
    - "50-gate02-findings.md (consolidated verdict, input for 50-03)"
  affects: []
tech-stack:
  added: []
  patterns:
    - "Local next build + next start tunneled to real prod Postgres, used as the crawl target instead of the live domain, when the code under test has not yet been deployed (precedent: Phase 48.5-03)"
key-files:
  created:
    - .planning/phases/50-gate-de-cierre-de-monetizaci-n/50-affiliate-crawl.json
    - .planning/phases/50-gate-de-cierre-de-monetizaci-n/50-gate02-findings.md
  modified: []
decisions:
  - "Crawl target switched from https://juan-tech.com to a local `next build && next start` tunneled to the real Dokploy Postgres, after confirming empirically that /stack and /go/[slug] 404 on production because docs/seo-handoff (106 commits of Phases 44-50 work) has never been merged to master, and Dokploy only builds from master"
metrics:
  duration: "~2h (incluye 2 caidas del tunel SSH bajo contencion de CPU + 1 build de produccion de ~10min)"
  completed: 2026-09-10
status: complete
actuals:
  tokens: 62000
  tasks: 3
  commits: 2
  plan_head_before: 6d8be9b98895348c14f038236be1e728d8448731
---

# Phase 50 Plan 02: GATE-02 (Afiliación) Summary

**Crawl real de HTML (rel=sponsored, orden de disclosure, /go/, paridad de locales, overrideAccess) sobre las 5 superficies de afiliación de Phases 46-49 — GATE-02: PASS, con un hallazgo crítico de alcance: el código nunca se desplegó a producción.**

## What Was Built

No se modificó código de producto (fase de medición pura, según lo esperado). Se crearon 2 artefactos de evidencia:

- **`50-affiliate-crawl.json`**: hallazgo crudo del crawl — resolución de las 2 Open Questions del research contra la Postgres real (0 docs `affiliate-links` con `program=amazon`; 1 post real con `affiliate-inline`, `guia-keyword-research`), crawl completo de `/stack` (es+en), `/go/<slug>` (los 6 slugs activos reales + 1 doc sin destinos + 1 slug inexistente), el post con `affiliate-inline` en ambos locales, el post con `EmailCaptureCard` (control negativo), y los 2 controles negativos de producto propio (`AuditorHighlight`/`AuditorCallout`).
- **`50-gate02-findings.md`**: veredicto consolidado, `GATE-02: PASS`, con las 5 aserciones documentadas una por una contra evidencia HTML/HTTP real, más el grep de `overrideAccess`/colecciones privadas.

## Hallazgo crítico (no bloqueante para el veredicto, pero central para el milestone)

**El código de Phases 46-49 nunca llegó a producción.** `curl https://juan-tech.com/stack` y `/go/dinorank` devuelven 404 real (no transitorio) porque el worktree de ejecución (rama `docs/seo-handoff`, con todo el trabajo del milestone v2.1) está **106 commits por delante de `master`**, y Dokploy solo construye/despliega desde `master`. La Postgres real SÍ tiene el schema y contenido (migraciones aplicadas vía túnel SSH independientemente del deploy del código) — confirmado `pages.stack` publicado, 7 docs reales en `affiliate-links`.

Este mismo problema ya se había encontrado y resuelto con el mismo patrón en Phase 48.5-03. Aplicando ese precedente (Rule 3 — blocking issue con fix ya establecido en este repo), el crawl se hizo contra `next build && next start` local (HEAD real de `docs/seo-handoff`) conectado a la Postgres real de Dokploy vía `scripts/db/tunnel.sh`, sirviendo en `localhost:3877`. Esto cumple el requisito de 50-CONTEXT.md ("verificado sobre HTML renderizado real, nunca por lectura de código") pero **no certifica lo que `juan-tech.com` sirve hoy** — certifica el código, pendiente de merge a `master`.

**Esto debe llegar a 50-03 y a Juan: el milestone v2.1 completo sigue sin desplegar.** Registrado en `.planning/WINDOWS.md` (id 9, kind=deviation, status=open) para que sea visible en el gate de `/gsd:ship`.

## Veredicto GATE-02: PASS (las 5 aserciones)

1. **Cero anchors sin `sponsored`**: 19/19 anchors de afiliado en `/stack` (es+en) con `rel="sponsored nofollow noopener"` exacto; 1/1 en el post con `affiliate-inline` (ambos locales). Controles negativos (`AuditorHighlight`, `AuditorCallout`, no-commission pick de GSC, `EmailCaptureCard`→`/privacy`) confirmados SIN `sponsored`.
2. **Disclosure antes en el DOM**: confirmado por offset de string en las 4 superficies donde ambos coexisten (`/stack` es/en, post con `affiliate-inline` es/en) — disclosure siempre antes que el primer anchor de afiliado.
3. **Cero Amazon por `/go/`**: satisfecho de forma vacua — 0 docs `affiliate-links` con `program='amazon'` existen; Amazon se renderiza siempre directo vía `GearCard`, nunca vía `/go/`.
4. **Paridad de locales por dato**: `/go/[slug]` vive fuera de `[locale]` (confirmado en 47-CONTEXT.md, sin variante `/en/go/`) — la paridad aplica a `destinations[]` por `marketplace` (confirmado: `dataforseo` 3 marketplaces, `dinorank` 2, todos con URLs distintas) y al copy de disclosure de Amazon (ES/EN confirmados distintos en `messages/*.json`).
5. **`overrideAccess`/colecciones privadas**: 12/13 llamadas en `src/lib/cache.ts` con `overrideAccess: false` explícito; la única excepción (`getCachedFeaturedContent`) tiene exención documentada y verificada (Pitfall 3 de 50-RESEARCH.md). `subscribers`/`affiliate-clicks`/`lead-magnets` confirmados ausentes de `SITEMAP_COLLECTIONS` y del mapa de colecciones de `mcpPlugin`.

## Hallazgo de higiene de datos (no bloqueante)

El doc `affiliate-links` `google-search-console` tiene `destinations: []` pese a `active: true`. No es un link roto real: se usa solo como `noCommissionPick` en `/stack`, cuyo `linkHref` está hardcodeado a `https://search.google.com/search-console` (bypassea `destinations[]` por completo). `/go/google-search-console` da 404 idéntico a un slug inexistente — comportamiento correcto, sin enumeración posible.

## Task Commits

1. **Task 1 (tracer) + Task 2 (escalación, consolidadas en un solo artefacto por eficiencia)**: `6f3e4b7` — content audit + crawl completo de `/stack` es+en, `/go/<slug>`, post con `affiliate-inline`, controles negativos
2. **Task 3**: `119376d` — grep de `overrideAccess`/colecciones privadas + veredicto final `GATE-02: PASS`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] Crawl target cambiado de `https://juan-tech.com` a build local tunneled**
- **Found during:** Task 1
- **Issue:** El plan asumía (basado en 50-RESEARCH.md) que el código de Phases 46-49 ya estaba en producción. `curl https://juan-tech.com/stack` devolvió 404 real, confirmado no-transitorio.
- **Fix:** `next build && next start` local contra la Postgres real vía túnel SSH, mismo patrón ya usado en Phase 48.5-03 para el mismo problema exacto.
- **Files modified:** ninguno (solo proceso de medición, sin cambio de código)
- **Documented:** `50-affiliate-crawl.json` (campo `meta`), `50-gate02-findings.md` (Hallazgo 0), `.planning/WINDOWS.md` (id 9)

**2. [Environment] Túnel SSH inestable bajo contención de CPU**
- **Found during:** Tasks 1-2
- **Issue:** El túnel se cayó 2 veces (`Connection terminated`, `ECONNREFUSED`) durante compilaciones pesadas, consistente con el riesgo operativo ya documentado en Phases 46/48.5. Contención de CPU agravada por el otro agente (Plan 50-01) corriendo Lighthouse en paralelo (load average ~10-12 observado).
- **Fix:** Túnel recreado desde cero cada vez (`scripts/db/tunnel.sh`), re-confirmado con `scripts/db/04-which-database.ts` antes de continuar. Cambio de `next dev` a `next build && next start` eliminó la fuente principal de flakiness (recompilaciones bajo contención de DB).

### Environment Notes (non-blocking, no code change)

`.env` de este worktree fue generado localmente (nunca copiado del `.env` real, que el guard de secretos del entorno de ejecución bloquea leer) — `PAYLOAD_SECRET` generado con `openssl rand -base64 32`, `DATABASE_URI` siempre exportado en vivo por sesión de shell desde la credencial obtenida vía `scripts/db/tunnel.sh` (nunca escrito a disco en texto plano). `node_modules` symlinkeado desde el checkout compartido (lockfiles idénticos).

**Worktree resincronizado por fast-forward.** El worktree fue creado desde un commit anterior a Phases 45-50 (`a1f1cb0`, 106 commits detrás de `docs/seo-handoff`). Confirmado que la rama del worktree no tenía commits propios y era ancestro directo, se hizo `git merge --ff-only docs/seo-handoff` — operación segura, sin pérdida de trabajo posible. Mismo patrón ya documentado en 48.5-01/02-SUMMARY.md.

## Known Stubs

Ninguno — no se produjo código de producto en esta fase.

## Self-Check: PASSED

- `.planning/phases/50-gate-de-cierre-de-monetizaci-n/50-affiliate-crawl.json` — FOUND
- `.planning/phases/50-gate-de-cierre-de-monetizaci-n/50-gate02-findings.md` — FOUND
- Commit `6f3e4b7` — FOUND en `git log`
- Commit `119376d` — FOUND en `git log`
- Servidor local (`next start -p 3877`) y túnel SSH cerrados limpiamente al finalizar

## Next Phase Readiness

`50-03` puede consumir `50-gate02-findings.md` directamente como input de su síntesis final. El hallazgo del deploy pendiente (Hallazgo 0) debe propagarse al veredicto de cierre del milestone — GATE-02 pasa técnicamente, pero `juan-tech.com` no sirve hoy ninguna de las superficies de Phases 46-49.
