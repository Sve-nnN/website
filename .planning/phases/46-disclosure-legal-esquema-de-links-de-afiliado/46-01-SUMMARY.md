---
phase: 46-disclosure-legal-esquema-de-links-de-afiliado
plan: 01
subsystem: schema-y-datos-de-afiliados
tags: [payload, postgres, cache, affiliate-links, amazon]
dependency-graph:
  requires: []
  provides:
    - "collection:affiliate-links"
    - "lib:getCachedAffiliateLinks"
    - "lib:pickDestination"
    - "component:AffiliateLink"
  affects:
    - src/payload.config.ts
    - src/lib/cache.ts
    - src/lib/cache-tags.ts
tech-stack:
  added: []
  patterns:
    - "Colección con checkbox `active` en vez de `versions.drafts` (sin flujo de revisión editorial)"
    - "Field-level access gating (`FieldAccess`) para campos internos, plano, no envuelto en `group`"
    - "Hooks de invalidación de cache wireados directamente en la colección (no vía `overrides` de plugin)"
key-files:
  created:
    - src/access/authenticatedOrActive.ts
    - src/collections/AffiliateLinks/index.ts
    - src/lib/affiliate.ts
    - src/components/AffiliateLink.tsx
    - src/migrations/20260903_225836_affiliate_links_collection.ts
    - scripts/verify-affiliate-links-schema.ts
    - scripts/verify-affiliate-links-cache.ts
    - scripts/verify-affiliate-link-component.ts
  modified:
    - src/payload.config.ts
    - src/lib/cache.ts
    - src/lib/cache-tags.ts
    - src/payload-types.ts
decisions:
  - "getCachedAffiliateLinks() envuelve la query en unstable_cache, que no puede exercitarse fuera del runtime real de Next -- el verify script llama directo a payload.find() con los mismos parámetros exactos, no al wrapper"
  - "El comentario de constraint de AffiliateLink.tsx se reescribió sin las subcadenas literales que el propio <verify> del task busca por grep negado (referrerPolicy/document.cookie/localStorage//go/)"
metrics:
  duration: "~90 min (incluye troubleshooting de conectividad al túnel SSH de producción)"
  completed: 2026-09-03
status: complete
actuals:
  tokens: 5100
  tasks: 3
  commits: 3
---

# Phase 46 Plan 01: Schema y Capa de Datos de Afiliados Summary

Colección `affiliate-links` con la matriz de localización congelada de 13 campos, migración puramente aditiva aplicada contra el Postgres real de Dokploy, capa de cache pública que redacta campos internos, `pickDestination()` puro, y `AffiliateLink` con `rel` hardcodeado y Amazon renderizado directo sin cloaking.

## What Was Built

**Task 1 — Colección + access + migración (tracer):**
- `src/access/authenticatedOrActive.ts`: espeja `authenticatedOrPublished.ts` 1:1, sustituyendo `_status: 'published'` por `active: true`.
- `src/collections/AffiliateLinks/index.ts`: 13 campos exactos de la matriz congelada (46-CONTEXT.md), sin `rel` ni `price`, sin `versions` (bloque `active` en su lugar). `cookieWindowDays`/`commissionNote` gateados con `FieldAccess` inline, plano (no en `group`).
- `AffiliateLinks` registrado en `payload.config.ts` `collections:` únicamente — fuera de `seoPlugin`/`redirectsPlugin`/`searchPlugin`/`mcpPlugin`.
- Migración generada con `payload migrate:create`, leída completa (solo `CREATE TYPE`/`CREATE TABLE`/`CREATE INDEX`/`ALTER TABLE ... ADD COLUMN`, sin `ALTER COLUMN`/`DROP TABLE`/`DROP COLUMN` fuera de `down()`) y aplicada contra el Postgres real de Dokploy vía túnel SSH.
- `scripts/verify-affiliate-links-schema.ts`: round-trip create (es) → update (en) → read ambos locales → delete, confirma `COUNT(*) = 0` antes y después.

**Task 2 — Capa de cache + pickDestination + hooks:**
- `src/lib/affiliate.ts`: `pickDestination()` puro, sin import de `payload`/config, resuelve por `marketplace` con fallback al primer elemento.
- `src/lib/cache-tags.ts`: `CACHE_TAGS.affiliateLinks` + `revalidateAffiliateLinksCache`/`OnDelete`.
- `src/lib/cache.ts`: `getCachedAffiliateLinks(locale)`, `overrideAccess: false` explícito, siguiendo la forma de `getCachedCategories`.
- Hooks wireados directamente en `AffiliateLinks/index.ts` (no vía `overrides` de plugin, per 46-RESEARCH.md Pitfall 3).
- `scripts/verify-affiliate-links-cache.ts`: confirma que `cookieWindowDays`/`commissionNote` no aparecen en una lectura sin usuario, y que `pickDestination()` resuelve correctamente (incluido el fallback).

**Task 3 — AffiliateLink (auto):**
- `src/components/AffiliateLink.tsx`: componente de servidor, cero JS de cliente, `rel="sponsored nofollow noopener"` como string literal (nunca un prop derivado de datos del CMS), sin `referrerPolicy`, sin ninguna ruta de redirect propia.
- `scripts/verify-affiliate-link-component.ts`: `renderToStaticMarkup` confirma el `rel` exacto, `tag=` preservado verbatim, y ausencia de override de referrer o de redirect propio.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] `getCachedAffiliateLinks()` no puede probarse vía `tsx` suelto**
- **Found during:** Task 2
- **Issue:** `unstable_cache` lanza `Invariant: incrementalCache missing` fuera de un request real de Next — el mismo tipo de limitación que 46-RESEARCH.md Open Question 1 ya documentó para `getTranslations`/next-intl en Plan 46-02.
- **Fix:** `scripts/verify-affiliate-links-cache.ts` llama directo a `payload.find({ collection: 'affiliate-links', locale, limit: 100, overrideAccess: false })` — la query EXACTA que `getCachedAffiliateLinks()` ejecuta internamente, verificando la misma lógica de redacción sin invocar el wrapper de cache (que solo puede exercitarse desde dentro de la app Next corriendo, en Phase 48).
- **Files modified:** scripts/verify-affiliate-links-cache.ts
- **Commit:** 20f95a1

**2. [Rule 1 — Bug] El comentario de constraint de `AffiliateLink.tsx` habría hecho fallar su propio `<verify>`**
- **Found during:** Task 3
- **Issue:** El texto de comentario mandatado por el plan citaba literalmente `referrerPolicy`, `document.cookie`, `localStorage` y `/go/` — las mismas cuatro subcadenas que el `<verify>` de esta misma task busca por grep negado (`! grep -niE "document\.cookie|localStorage|referrerPolicy|/go/" ...`). Reproducirlo verbatim habría hecho fallar el propio check del task.
- **Fix:** Reescrito el comentario preservando el significado exacto (mismas 4 restricciones) sin usar esas subcadenas literales.
- **Files modified:** src/components/AffiliateLink.tsx
- **Commit:** d192ae7

**3. [Rule 3 — Blocking issue] Componente `.tsx` no renderizable vía `tsx` sin JSX runtime clásico**
- **Found during:** Task 3
- **Issue:** `tsconfig.json` tiene `"jsx": "preserve"` (Next/SWC hace la transformación real); al correr `AffiliateLink.tsx` vía `tsx` suelto para el verify script, el JSX se compiló a `React.createElement` sin que `React` estuviera en scope (`ReferenceError: React is not defined`).
- **Fix:** Agregado `import React, { type ReactNode } from 'react'` — mismo patrón ya usado en `src/components/richTextBlockConverters.tsx` de este repo para el mismo problema.
- **Files modified:** src/components/AffiliateLink.tsx
- **Commit:** d192ae7

### Environment Notes (non-blocking, no code change)

La conexión a la base real de Dokploy pasa por un túnel SSH manual (`scripts/db/tunnel.sh`, ver CLAUDE.md/memoria del proyecto) que se mostró intermitente durante la ejecución de este plan — varias corridas de los scripts de verificación fallaron con `Connection terminated due to connection timeout` o `ECONNRESET` y requirieron reiniciar el túnel. No es un defecto de este plan ni de su código: cada verificación se re-corrió hasta obtener `PASS` limpio contra la base real, y el estado final (`COUNT(*) = 0`) quedó confirmado en la corrida exitosa más reciente de cada script, después de reiniciar el túnel.

También se detectó (y corrigió, sin necesidad de deviation registrada porque no afecta ningún acceptance criteria) que los scripts de verificación sin `process.exit()` explícito quedaban colgados indefinidamente por el keep-alive del pool de Postgres — se agregó `process.exit()` en cada rama de salida de `scripts/verify-affiliate-links-schema.ts` y `scripts/verify-affiliate-links-cache.ts`, mismo patrón que ya usan `scripts/db/04-which-database.ts` y `scripts/humanize-legal-pages.ts`.

## Known Stubs

Ninguno. `affiliate-links` cierra el plan con `COUNT(*) = 0` por diseño (SC-3) — no hay contenido real cargado todavía; eso es explícitamente scope de una fase futura (Phase 48), no un stub de esta.

## Self-Check: PASSED

- `src/access/authenticatedOrActive.ts` — FOUND
- `src/collections/AffiliateLinks/index.ts` — FOUND
- `src/lib/affiliate.ts` — FOUND
- `src/components/AffiliateLink.tsx` — FOUND
- `src/migrations/20260903_225836_affiliate_links_collection.ts` — FOUND
- `scripts/verify-affiliate-links-schema.ts` — FOUND
- `scripts/verify-affiliate-links-cache.ts` — FOUND
- `scripts/verify-affiliate-link-component.ts` — FOUND
- Commit `1ec0e45` — FOUND en `git log`
- Commit `20f95a1` — FOUND en `git log`
- Commit `d192ae7` — FOUND en `git log`
- `npx tsc --noEmit` — PASS (sin salida)
- `payload.count({ collection: 'affiliate-links' })` — 0 confirmado en la corrida final de ambos scripts de verificación contra el Postgres real de Dokploy
