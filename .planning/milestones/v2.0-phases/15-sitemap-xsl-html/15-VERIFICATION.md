---
phase: 15-sitemap-xsl-html
verified: 2026-07-11T20:45:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
---

# Phase 15: Sitemap XSL + HTML Verification Report

**Phase Goal:** El sitemap del sitio deja de ser XML crudo ilegible para cualquiera que lo abra directamente en el navegador, y gana una versión HTML navegable enlazada desde un nuevo link "Sitemap" en el footer.
**Verified:** 2026-07-11T20:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `sitemap.xml` es un route handler custom con processing instruction XSL, no el `MetadataRoute.Sitemap` nativo | ✓ VERIFIED | `src/app/sitemap.xml/route.ts` existe (nativo `src/app/sitemap.ts` fue eliminado, `grep` no encuentra referencias colgantes). `curl http://localhost:3000/sitemap.xml` devuelve `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>` como segunda línea, `content-type: application/xml; charset=utf-8` |
| 2 | `sitemap.xml` contiene URLs reales de la base de datos, no vacío/estático | ✓ VERIFIED | 74 `<loc>` entries en la respuesta en vivo, con `<lastmod>` real (`2026-07-12T00:15:20.274Z`) y alternates `hreflang="es"`/`hreflang="en"` poblados con URLs reales (páginas, blog, case studies, autores, categorías) |
| 3 | `sitemap.xsl` existe y se sirve correctamente, produciendo tabla legible al abrir `sitemap.xml` en el navegador | ✓ VERIFIED | `public/sitemap.xsl` existe, XSLT 1.0 válido con `xsl:template match="/"`, tabla con columnas URL/Last Modified/Language, paleta hardcoded según UI-SPEC. `curl -I http://localhost:3000/sitemap.xsl` → `200`, `Content-Type: application/xml` |
| 4 | `sitemap.html` renderiza contenido real agrupado por sección | ✓ VERIFIED | `src/app/sitemap.html/route.ts` existe. `curl http://localhost:3000/sitemap.html` → 5 `<h2>` (Pages/Blog/Case Studies/Authors/Categories), 74 `<li>` items con URLs reales y switcher de idioma EN·ES por item |
| 5 | `robots.txt` sigue referenciando `/sitemap.xml` sin regresión de Phase 2 | ✓ VERIFIED | `curl http://localhost:3000/robots.txt` → `Sitemap: http://localhost:3000/sitemap.xml` presente, `Disallow: /admin`, `/api` intactos |
| 6 | Footer tiene link "Sitemap" en ambos locales apuntando a `/sitemap.html` | ✓ VERIFIED | ES (`/`): `<a href="/sitemap.html">Sitemap</a>` presente en `legalLinks`, junto a `Privacidad`/`Términos` (backfill ES confirmado estable). EN (`/en`): `{"href":"/sitemap.html","children":"Sitemap"}` presente en el RSC payload del footer |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/sitemap-data.ts` | Query compartida `getSitemapEntries()` + `SITEMAP_GROUP_LABELS` | ✓ VERIFIED | Existe, consumido por ambas rutas |
| `src/app/sitemap.xml/route.ts` | Route handler custom con XSL PI | ✓ VERIFIED | Existe, reemplaza el `sitemap.ts` nativo (eliminado) |
| `public/sitemap.xsl` | Hoja de estilos XSLT 1.0 | ✓ VERIFIED | Existe, sirve tabla legible, paleta según spec |
| `src/app/sitemap.html/route.ts` | Route handler para página HTML navegable | ✓ VERIFIED | Existe, 5 secciones, omite grupos vacíos |
| `scripts/seed-phase15-sitemap-footer-link.ts` | Seed idempotente del link Sitemap en footer | ✓ VERIFIED | Existe, ejecutado contra DB real, verificado en vivo |
| Footer global (Payload, DB real) | Item "Sitemap" en `legalLinks` ES+EN | ✓ VERIFIED | Confirmado vía curl en ambos locales |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `sitemap.xml` route | `sitemap-data.ts` | `import { getSitemapEntries }` | WIRED | Usado y renderizado en el XML |
| `sitemap.html` route | `sitemap-data.ts` | `import { getSitemapEntries, SITEMAP_GROUP_LABELS }` | WIRED | Usado, agrupa por `entry.group`, renderiza 74 items |
| `sitemap.xml` | `sitemap.xsl` | `<?xml-stylesheet ... href="/sitemap.xsl"?>` | WIRED | PI presente en la respuesta real, archivo servido en `/sitemap.xsl` con 200 |
| Footer (`SiteFooter.tsx`) | Payload Footer global | `footer.legalLinks?.map(...)` | WIRED | Link "Sitemap" renderizado en ambos locales desde datos reales de DB |
| `robots.txt` | `sitemap.xml` | `sitemap: ${SITE_URL}/sitemap.xml` | WIRED | Sin regresión de Phase 2 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `sitemap.xml` route | `entries` | `getSitemapEntries()` → Payload query (5 colecciones, `_status: published`) | Sí — 74 URLs reales, `lastmod` con timestamps reales | ✓ FLOWING |
| `sitemap.html` route | `entries` (agrupado) | Mismo `getSitemapEntries()` | Sí — mismos 74 items agrupados en 5 secciones | ✓ FLOWING |
| `SiteFooter.tsx` | `footer.legalLinks` | Payload `getGlobal('header')`/`getGlobal('footer')` (ES/EN) | Sí — labels reales en ambos locales, incluyendo el nuevo item Sitemap | ✓ FLOWING |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| SITEMAP-01 | 15-01-PLAN.md | `sitemap.xml` recibe hoja de estilos XSL — tabla legible al abrir directamente | ✓ SATISFIED | PI XSL presente, `sitemap.xsl` sirve tabla válida y legible |
| SITEMAP-02 | 15-02-PLAN.md | `sitemap.html` navegable agrupado por sección, enlazado desde footer | ✓ SATISFIED | Ruta HTML funcional con 5 grupos + link real en footer ES/EN |

Nota: REQUIREMENTS.md SITEMAP-02 original asumía que "el footer ya tiene un link Sitemap" — el CONTEXT del phase documentó correctamente que esa asunción era falsa (venía del sitio de referencia viejo) y el link se agregó desde cero. Esto es una corrección documentada, no una desviación sin resolver.

### Anti-Patterns Found

Ninguno. No se encontraron marcadores `TODO`/`FIXME`/`XXX`/`placeholder` en los archivos creados por esta fase (`sitemap.xml/route.ts`, `sitemap.html/route.ts`, `sitemap.xsl`, `sitemap-data.ts`).

### Bug Fixes Verified (Rule 3 / adjacent findings)

| Bug | Global | Fix | Status | Evidence |
|-----|--------|-----|--------|----------|
| Footer ES `legalLinks`/`columns` con labels vacíos (bloqueaba escritura ES al global) | Footer | Backfill en `scripts/seed-phase15-sitemap-footer-link.ts`, confirmado por Juan antes de correr contra DB real | ✓ VERIFIED — STABLE | ES footer renderiza `Privacidad`/`Términos` correctamente en vivo; commit `8fa03ab` |
| Header ES `navItems[].link.label` vacíos (nav sin texto visible en ES) | Header | `scripts/fix-header-navitems-es-labels.ts`, ejecutado por Juan después del cierre de la fase, commit `52cb91e` | ✓ VERIFIED — STABLE | ES nav ahora renderiza `Blog`/`Casos de éxito`/`Autores`/`Contacto` en vivo contra `localhost:3000/`; EN nav (`Blog`/`Case Studies`/`Authors`/`Contact`) no se vio afectado |

Ambos fixes usan la misma técnica de backfill preservando `id`s de array, consistente con el patrón ya visto en Phases 5/13/14. Ambos verificados en vivo contra el servidor de desarrollo real (no solo revisión de código), y ambos son estables (sin regresión cruzada entre locales).

### Human Verification Required

Ninguno. Todos los truths se verificaron programáticamente contra el servidor de desarrollo real (curl contra `localhost:3000`), no solo lectura de código.

### Gaps Summary

Ningún gap. Los 6 truths se verificaron con evidencia en vivo. La nota menor detectada (tabla de progreso al final de ROADMAP.md aún muestra "15. Sitemap XSL + HTML | 0/TBD | Not planned" mientras la sección detallada de la fase 15 más arriba en el mismo archivo la marca como completa con ambos planes `[x]`) es un desajuste cosmético de sincronización en el documento de roadmap, no un gap funcional — no bloquea el goal de la fase.

---

_Verified: 2026-07-11T20:45:00Z_
_Verifier: Claude (gsd-verifier)_
