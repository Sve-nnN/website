# Phase 50: Gate de Cierre de Monetización - Research

**Researched:** 2026-09-10
**Domain:** Regression measurement + affiliate-compliance crawling (no new product code)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
Ninguna sección `## Decisions` explícita en 50-CONTEXT.md más allá de lo declarado en Claude's Discretion.

### Claude's Discretion
Toda la fase es Claude's Discretion en cuanto a mecánica de medición (scripts a reusar de Phase 45/32/36, formato del reporte final) — los criterios de éxito ya están completamente fijados y son numéricos/verificables por el ROADMAP, no hay grey area de producto que discutir con Juan.

### Deferred Ideas (OUT OF SCOPE)
Ninguna — última fase del milestone.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GATE-01 | Paridad verificada contra el baseline: sin caída de más de 5 puntos de performance, sin cruce de banda de CWV, no más de 5 KB de JS de cliente agregado, delta de CLS 0.00 | Ver "Re-measurement Procedure" y "Bundle-Size Measurement" abajo |
| GATE-02 | Cero anchors a dominios de afiliado sin `sponsored`; disclosure precede al primer anchor de afiliado en orden del DOM; ambos locales resuelven a un destino no vacío y distinto; grep confirma `overrideAccess: false` en todo `payload.find(` | Ver "Affiliate-Rendering Surfaces" y "Grep/Crawl Strategy for GATE-02" abajo |
</phase_requirements>

## Summary

Phase 50 es una fase de medición pura: no escribe código de producto, solo repite el procedimiento de la Phase 45 contra las mismas 14 rutas y diffea, y crawlea las superficies de afiliación construidas en las Phases 46-49 contra un set de aserciones ya fijadas en el ROADMAP. Todos los scripts necesarios ya existen en el repo (`scripts/lighthouse-mobile.mjs`, `scripts/capture-service-page-snapshot.mjs`, `scripts/capture-head-links-snapshot.mjs`) y aceptan `--routes`/`--routes-only` con la lista completa de 14 rutas — no hace falta escribir ningún capturador nuevo.

El hallazgo más importante de esta investigación es que el criterio "≤5 KB de JS de cliente en todo el milestone" **no se puede responder con un diff de commits contra `.next/static`**: el historial entre el commit de inicio de Phase 44 (`60700ac`) y HEAD contiene 209 commits, y la gran mayoría (auditoría SEO, rediseño de home, rebuild del blog, fixes de performance/a11y) son trabajo concurrente no relacionado con el milestone de monetización — un diff de bundle a través de ese rango mide todo ese ruido, no el aporte de las Phases 46-49. La respuesta correcta y verificable es estructural: cada componente construido en 46-49 (`AffiliateLink`, `AffiliateDisclosure`/`AffiliateDisclosureFrame`, `ToolCard`, `GearCard`, `AffiliateInlineCard`, `AuditorHighlight`/`AuditorCallout`, `EmailCaptureCard`, el handler de `/go/[slug]`) es un React Server Component puro — ninguno lleva la directiva `'use client'` — y los dos únicos client-side primitives que consume `EmailCaptureCard` (`Input`/`Button` de `@/components/ui`) ya estaban en el bundle desde Phase 5 (`ContactFormBlock` los usa). El JS de cliente agregado por el milestone es, por construcción, 0 KB — verificable con un grep, no con un build diff.

Para GATE-02, las cinco superficies de afiliación (AffiliateLink directo en `/go/`, `ToolCard`/`GearCard` en `/stack`, `AffiliateInlineCard` en posts, `AuditorHighlight`/`AuditorCallout` como excepción intencional sin `rel=sponsored`, `EmailCaptureCard` como control negativo) ya están confirmadas por lectura de código: `AffiliateLink` emite `rel="sponsored nofollow noopener"` incondicionalmente y es el único componente que lo hace; `AuditorHighlight`/`AuditorCallout` usan una etiqueta `<a>` plana con `rel="noopener"` (nunca `AffiliateLink`), haciendo la distinción "producto propio, sin sponsored" trivialmente testeable por grep de nombre de componente; el disclosure precede al primer anchor de afiliado en el orden del DOM en ambas superficies donde aplica (`/stack` vía `ToolStackComponent`, posts vía `blog/[category]/[slug]/page.tsx`). Falta únicamente la verificación en runtime (crawl HTML real) porque lectura de código no sustituye la verificación exigida por 50-CONTEXT.md ("verificado sobre HTML renderizado real, nunca por lectura de código").

**Primary recommendation:** Reusar los tres scripts de Phase 45 sin modificarlos, correr contra producción viva (`https://juan-tech.com`, mismo patrón que Phase 45 — no hay build local que compare contra Dokploy), y resolver el criterio de JS de cliente por auditoría estructural (grep de `'use client'` en los archivos nuevos de 46-49) en vez de un diff de bundle contaminado por 200+ commits no relacionados.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Re-medición de Lighthouse/CWV | Browser (lab, Chrome-for-Testing) | — | Lighthouse corre un navegador real contra la URL de producción; no hay componente de servidor propio en esta fase |
| Re-captura de H1/JSON-LD/canonical/hreflang | API/Backend (fetch HTML servido) | — | Los scripts hacen `fetch()` contra el HTML ya renderizado por el servidor Next.js en Dokploy |
| Medición de JS de cliente agregado | Browser/Build output | Código fuente (auditoría estática) | El bundle final vive en `.next/static`, pero la fuente de verdad confiable en este caso es el árbol de componentes (ausencia de `'use client'`), no un diff de artefactos de build contaminado |
| Crawl de superficies de afiliación (`rel`, orden del disclosure, `/go/`) | Browser (HTML renderizado) | API/Backend (`/go/[slug]` responde 302/404) | Las aserciones son sobre el DOM servido y sobre el comportamiento HTTP del route handler, ambos verificables con `curl`/`fetch`, sin necesidad de un navegador con JS habilitado |
| `overrideAccess`/colecciones fuera de sitemap y MCP | Database/Storage (Local API de Payload) | — | Es una propiedad de las queries a Postgres vía la Local API, verificable por lectura de código (`src/lib/cache.ts`, `src/lib/sitemap-data.ts`, `src/payload.config.ts`), no por crawl HTTP |

## Standard Stack

No se instala ningún paquete nuevo en esta fase — es 100% reuso de la infraestructura de medición ya presente en el repo.

### Core (ya instalado, verificado en `package.json` / registry)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lighthouse` | 13.4.1 [VERIFIED: npm registry] | Motor de auditoría Lighthouse, invocado vía su Node API desde `scripts/lighthouse-mobile.mjs` | Ya usado en Phases 11/25/28/32/36/45; mismo runner para mantener la serie comparable |
| `chrome-launcher` | 1.2.1 [VERIFIED: npm registry] | Lanza el binario de Chrome-for-Testing para Lighthouse | Dependencia de `lighthouse-mobile.mjs`, sin alternativa a evaluar |
| `@puppeteer/browsers` | ya en `package.json` (no se tocó) | Descarga/cachea el binario de Chrome-for-Testing en `.lighthouse-chrome/` | Mismo mecanismo que Phase 45 usó sin fricción |
| Node.js | v24.13.0 [VERIFIED: `node --version` local] | Runtime para correr los tres scripts `.mjs` | Ya es el runtime del proyecto; ningún script de esta fase requiere una versión mínima distinta |

### Instalación
Ninguna — no hay `npm install` en esta fase.

## Package Legitimacy Audit

No aplica. Esta fase no instala paquetes externos nuevos.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────┐
                         │  https://juan-tech.com (Dokploy)│
                         │  servidor Next.js standalone  │
                         └───────────────┬──────────────┘
                                         │ HTTP (14 rutas fijas)
              ┌──────────────────────────┼───────────────────────────┐
              │                          │                           │
   ┌──────────▼─────────┐    ┌───────────▼──────────┐    ┌───────────▼───────────┐
   │ lighthouse-mobile.mjs│    │capture-service-page-  │    │capture-head-links-    │
   │ (Chrome-for-Testing) │    │snapshot.mjs (fetch+   │    │snapshot.mjs (fetch+   │
   │ → performance/LCP/   │    │regex H1+JSON-LD)      │    │regex canonical+       │
   │   CLS/TBT por ruta   │    │                       │    │hreflang)              │
   └──────────┬───────────┘    └───────────┬───────────┘    └───────────┬───────────┘
              │                            │                            │
              └──────────────┬─────────────┴──────────────┬─────────────┘
                              ▼                            ▼
                  diff programático contra           50-REGRESSION-DIFF.md
                  lh-phase45-baseline.json /          (veredicto GATE-01)
                  45-baseline-content.json /
                  45-baseline-headlinks.json

   ┌───────────────────────────────────────────────────────────────────────┐
   │  Crawl de afiliación (GATE-02) — HTTP directo, sin navegador          │
   │                                                                        │
   │  curl /stack (es+en)  ──► grep <a rel="sponsored...">  vs  disclosure │
   │  curl /blog/.../<post-con-inline> (es+en) ──► mismo grep + orden DOM  │
   │  curl /go/<slug-activo>  ──► 302 a destino admin-autorado, nunca 404  │
   │  curl /go/<slug-amazon-o-inexistente> ──► 404 idéntico (no enumerable)│
   │  grep en fuente: payload.find( + overrideAccess: false                │
   │  grep en fuente: SITEMAP_COLLECTIONS / mcpPlugin collection map       │
   └───────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

No hay estructura de carpetas nueva. Los artefactos de esta fase van a `.planning/phases/50-gate-de-cierre-de-monetizaci-n/`, mismo patrón que `45-baseline-de-regresi-n/` y `36-regression-gate/`:

```
.planning/phases/50-gate-de-cierre-de-monetizaci-n/
├── lh-phase50-run1.json / run2.json / run3.json     # + escalados si spread > 15 (precedente Phase 45)
├── lh-phase50-baseline.json                          # mediana, mismo shape que lh-phase45-baseline.json
├── 50-post-content.json                              # H1/JSON-LD, mismo shape que 45-baseline-content.json
├── 50-post-headlinks.json                             # canonical/hreflang, mismo shape que 45-baseline-headlinks.json
├── 50-affiliate-crawl.json                            # nuevo — hallazgos crudos del crawl GATE-02 (ver más abajo)
└── 50-REGRESSION-DIFF.md                              # veredicto final GATE-01 + GATE-02, mismo formato que 36-REGRESSION-DIFF.md
```

### Pattern 1: Re-measurement Procedure (GATE-01)

**What:** Repetir exactamente el procedimiento de Phase 45 contra las mismas 14 rutas, contra producción viva (no build local — Phase 45 ya estableció ese precedente porque el sitio real corre en Dokploy, no en esta laptop).

**When to use:** Única vez, al final del milestone, antes de cerrar.

**Comandos exactos (adaptar `--out`/rutas del ejemplo de Phase 45):**
```bash
# Lighthouse — 3 corridas base, escalar a 5 si el spread de performance > 15
# puntos en alguna ruta (regla ya aplicada en Phase 45 a 10/14 rutas)
node scripts/lighthouse-mobile.mjs --base-url https://juan-tech.com \
  --out .planning/phases/50-gate-de-cierre-de-monetizaci-n/lh-phase50-run1.json \
  --routes-only /,/en,/servicios/seo-technical-audit,/servicios/seo-consulting,/servicios/fullstack-development,/servicios/ai-seo-geo,/en/services/seo-technical-audit,/en/services/seo-consulting,/en/services/fullstack-development,/en/services/ai-seo-geo,/seo-tecnico-madrid,/seo-tecnico-lima,/en/seo-tecnico-madrid,/en/seo-tecnico-lima
# repetir con run2.json, run3.json (y run4/run5-escalated.json solo para rutas con spread > 15)

# H1 + JSON-LD (mismo script y mismas 14 rutas que generó 45-baseline-content.json)
node scripts/capture-service-page-snapshot.mjs --base-url https://juan-tech.com \
  --routes "/,/en,/servicios/seo-technical-audit,/servicios/seo-consulting,/servicios/fullstack-development,/servicios/ai-seo-geo,/en/services/seo-technical-audit,/en/services/seo-consulting,/en/services/fullstack-development,/en/services/ai-seo-geo,/seo-tecnico-madrid,/seo-tecnico-lima,/en/seo-tecnico-madrid,/en/seo-tecnico-lima" \
  --out .planning/phases/50-gate-de-cierre-de-monetizaci-n/50-post-content.json

# Canonical + hreflang (mismo script hermano que generó 45-baseline-headlinks.json)
node scripts/capture-head-links-snapshot.mjs --base-url https://juan-tech.com \
  --routes "/,/en,/servicios/seo-technical-audit,/servicios/seo-consulting,/servicios/fullstack-development,/servicios/ai-seo-geo,/en/services/seo-technical-audit,/en/services/seo-consulting,/en/services/fullstack-development,/en/services/ai-seo-geo,/seo-tecnico-madrid,/seo-tecnico-lima,/en/seo-tecnico-madrid,/en/seo-tecnico-lima" \
  --out .planning/phases/50-gate-de-cierre-de-monetizaci-n/50-post-headlinks.json
```

**Umbral de diff (idéntico al de Phase 36, per ROADMAP Phase 50 goal):** flag si `performance` cae más de 5 puntos vs. `lh-phase45-baseline.json`, o si LCP/CLS/TBT cruza a una banda peor. Bandas: LCP good ≤2500ms / needs-improvement ≤4000ms / poor por encima; CLS good ≤0.1 / needs-improvement ≤0.25 / poor por encima; TBT good ≤200ms / needs-improvement ≤600ms / poor por encima. **CLS delta específico exigido por GATE-01: 0.00** — el baseline ya tiene CLS=0 (good) en las 14 rutas, así que este criterio es más estricto que el umbral de banda genérico: cualquier CLS post-milestone distinto de 0 en cualquiera de las 14 rutas es un FAIL de GATE-01, aunque siga dentro de la banda "good" (≤0.1).

**Advertencia de Phase 45 (aplica igual acá):** contención de CPU local produjo spreads de performance > 15 puntos en 10/14 rutas durante Phase 45. Si Phase 50 ve un salto de 20+ puntos en una sola ruta, descartar contención de CPU (2-3 corridas limpias aisladas, precedente Phase 28/36) antes de leerlo como regresión real.

### Pattern 2: JS de cliente agregado — auditoría estructural, no bundle diff

**What:** Confirmar que ningún componente construido en Phases 46-49 agrega `'use client'`, en vez de diffear `.next/static` entre commits.

**Why not a commit-range bundle diff (verified this session):** `git diff --stat 60700ac 15b1027 -- src/` (Phase-44-start → Phase-45-close, ambos con `git diff` vacío documentado sobre `src/` en sus propios verdicts) devuelve **102 archivos cambiados, 192.301 inserciones** — contradice la premisa de que ese rango está "limpio". La causa real: `git log --oneline 60700ac..HEAD` tiene **209 commits**, y una mayoría no pertenece al milestone de monetización — incluye la auditoría SEO completa (`fix(seo)`/`docs(seo)`, ~90 commits), el rebuild del blog (`feat(blog): rebuild the blog as a library`), el rediseño de home (`feat(home): rebuild the home page around code as the proof`), fixes de performance/a11y no relacionados (`perf(seo): run the hero shader on desktop only`, `fix(a11y): blog categories are navigation, not a tablist`), y trabajo de infraestructura de scripts (`chore(db)`, `chore(neon)`). Diffear `.next/static` sobre ese rango mediría todo ese trabajo, no el aporte real de las Phases 46-49 — el resultado sería inútil para el criterio de la fase.

**Verified this session — cero componentes cliente en las superficies de afiliación:**
```bash
grep -rl "use client" \
  src/components/AffiliateLink.tsx \
  src/components/AffiliateDisclosure.tsx \
  src/components/AffiliateDisclosureFrame.tsx \
  src/components/ToolCard.tsx \
  src/components/GearCard.tsx \
  src/components/AffiliateInlineCard.tsx \
  src/blocks/AuditorHighlight/Component.tsx \
  src/blocks/AuditorCallout/Component.tsx \
  src/blocks/EmailCaptureBlock/Component.tsx \
  "src/app/go/[slug]/route.ts"
# → sin salida (ninguno de los 10 archivos lleva la directiva)
```
`[VERIFIED: src/components/AffiliateLink.tsx, src/components/AffiliateDisclosure.tsx, src/components/AffiliateDisclosureFrame.tsx, src/components/ToolCard.tsx, src/components/GearCard.tsx, src/components/AffiliateInlineCard.tsx, src/blocks/AuditorHighlight/Component.tsx, src/blocks/AuditorCallout/Component.tsx, src/blocks/EmailCaptureBlock/Component.tsx, src/app/go/[slug]/route.ts]` — grep corrido esta sesión, cero coincidencias de `'use client'` en los 10 archivos.

`EmailCaptureCard` (el único de los diez con un `<form>` interactivo) usa `Input`/`Button` de `@/components/ui/{input,button}.tsx` — ninguno de los dos lleva `'use client'` tampoco `[VERIFIED: src/components/ui/input.tsx, src/components/ui/button.tsx]` — y ambos ya estaban en el árbol de importaciones de `src/blocks/ContactFormBlock/Component.tsx` (Phase 5, anterior al milestone), así que no hay bundle-splitting nuevo que atribuirle al milestone.

**Recomendación de tarea para el planner:** correr el grep de arriba como paso de verificación (no como medición de bytes), y documentar el resultado como "0 KB de JS de cliente agregado, por construcción — verificado por ausencia de `'use client'` en los 10 archivos nuevos, no por diff de bundle" en `50-REGRESSION-DIFF.md`. Si Juan pide igual un número de bytes concreto, la única forma honesta de obtenerlo es un build local (`npm run build`) en HEAD y comparar el tamaño total de `.next/static/chunks` contra un build del mismo HEAD con los 10 archivos de afiliación git-stash-eados — no contra un commit histórico distante.

### Pattern 3: Grep/Crawl Strategy for GATE-02

**What:** Verificación runtime (HTML real, nunca lectura de código sola) de las 5 aserciones de GATE-02.

**Superficies a crawlear (confirmado por lectura de código esta sesión, pendiente de verificación runtime en la fase):**

| Superficie | Componente | `rel` esperado | Disclosure antes en DOM |
|---|---|---|---|
| `/stack` (es+en) | `ToolCard` (vía `AffiliateLink`) | `sponsored nofollow noopener` | Sí — `AffiliateDisclosureFrame` se renderiza en `ToolStackComponent` antes del `.map()` de `categoryGroups` [VERIFIED: src/blocks/ToolStack/Component.tsx:46] `<AffiliateDisclosureFrame hasAmazonLinks locale={locale} />` en línea 46, antes del loop de `categoryGroups` en línea 49 |
| `/stack` (es+en) | `GearCard` (vía `AffiliateLink`) | `sponsored nofollow noopener` | Sí — mismo `AffiliateDisclosureFrame` de arriba, antes de la sección Gear (línea 65) |
| Posts con bloque inline (es+en) | `AffiliateInlineCard` (vía `AffiliateLink`) | `sponsored nofollow noopener` | Sí — `AffiliateDisclosureFrame` se renderiza antes del `<article id="post-body">` que contiene el `RichTextRenderer` [VERIFIED: src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx:314-327] bloque `{postHasAffiliateInline(doc.content) && (<Container className="py-4"><AffiliateDisclosureFrame .../></Container>)}` en líneas 314-321, seguido por `<article id="post-body">` recién en línea 327 |
| `/go/[slug]` | route handler, redirect 302 directo | N/A (no es un anchor, es un redirect HTTP) | N/A |
| Home (`AuditorHighlight` block) | `<a rel="noopener">` plano, NO `AffiliateLink` | **NO debe llevar `sponsored`** (producto propio) | N/A — no es afiliado |
| Landing "Auditoría SEO Técnica" (`AuditorCallout`) | `<a>` vía `StackHighlightCallout`, NO `AffiliateLink` | **NO debe llevar `sponsored`** (producto propio) | N/A — no es afiliado |
| Posts con `EmailCaptureCard` | `<a href={privacyHref}>` a `/privacy`, sin `AffiliateLink` | N/A — no es afiliado, control negativo | N/A |

**Comandos de crawl (adaptar dominio/slugs reales al momento de ejecutar la fase):**
```bash
# 1. Cero anchors de afiliado sin sponsored, en cada superficie
curl -s https://juan-tech.com/stack | grep -oE '<a [^>]*href="[^"]*"[^>]*>' \
  | grep -v 'rel="sponsored nofollow noopener"' | grep -iE 'amazon|hostinger|kinsta|dinorank|digitalocean|dataforseo|cloudinary|resend|ahrefs'
# (sin salida esperada — cualquier anchor a un dominio de programa de afiliado
# sin el rel exacto es un FAIL)

# 2. Disclosure precede al primer anchor de afiliado — orden de aparición en
# el HTML crudo (offset de string, no requiere parser DOM)
curl -s https://juan-tech.com/stack > /tmp/stack.html
node -e "
const html = require('fs').readFileSync('/tmp/stack.html', 'utf8');
const discloseIdx = html.search(/role=\"note\"/);
const firstAffiliateIdx = html.search(/rel=\"sponsored nofollow noopener\"/);
if (discloseIdx === -1 || firstAffiliateIdx === -1) { console.error('missing disclosure or affiliate anchor'); process.exit(1); }
console.log(discloseIdx < firstAffiliateIdx ? 'PASS: disclosure precedes first affiliate anchor' : 'FAIL: order violated');
"

# 3. Cero links de Amazon por /go/ — enumerar todo doc de affiliate-links con
# program=amazon y confirmar que /go/<su-slug> NO resuelve (404, igual que un
# slug inexistente) — el contrato de Phase 46/47 es que Amazon nunca pasa por
# /go/, así que un doc con program=amazon jamás debería tener `active:true`
# resuelto vía ese route. Verificar contra la Local API real (requiere acceso
# admin) o, más simple en runtime: para cada slug conocido de programa
# amazon, `curl -I https://juan-tech.com/go/<slug>` debe dar 404, nunca 302.

# 4. Paridad de locales — cada slug activo debe resolver a un destino no
# vacío y DISTINTO entre es/en donde el programa lo amerite (comparar
# Location header)
curl -sI https://juan-tech.com/go/<slug> | grep -i location
curl -sI https://juan-tech.com/en/go/<slug> | grep -i location   # OJO: /go/ NO está bajo [locale] (confirmar en la fase si existe variante /en/go/ o si el mismo /go/<slug> sirve ambos locales — el handler resuelve con locale='es' fijo, ver Pitfall 1 abajo)

# 5. AuditorHighlight/AuditorCallout NO llevan sponsored (control negativo)
curl -s https://juan-tech.com/ | grep -A2 -B2 'auditor.juan-tech.com' | grep -c 'rel="sponsored'
# esperado: 0

# 6. overrideAccess:false en cada payload.find/findByID/findGlobal nuevo
grep -n "payload\.find(\|payload\.findByID(\|payload\.findGlobal(" src/lib/cache.ts | wc -l
grep -c "overrideAccess: false" src/lib/cache.ts
# los dos números no tienen que ser iguales (hay findGlobal con exención
# documentada para featured-content, ver Pitfall 3), pero cada llamada SIN
# overrideAccess:false debe tener un comentario de exención inmediato arriba

# 7. subscribers/affiliate-clicks/lead-magnets fuera de sitemap y MCP
grep -n "SITEMAP_COLLECTIONS" -A 8 src/lib/sitemap-data.ts | grep -iE "subscribers|affiliate-clicks|lead-magnets"
# esperado: sin salida
sed -n '/mcpPlugin(/,/^    }),$/p' src/payload.config.ts | grep -iE "subscribers|affiliate-clicks|lead-magnets"
# esperado: sin salida
```

**Pitfall crítico a resolver DURANTE la fase (no en research):** `/go/[slug]/route.ts` está en `src/app/go/[slug]/route.ts`, **fuera** del segmento `[locale]` — no hay prefijo de locale en la URL del redirect en sí. El handler resuelve `getCachedAffiliateLinks('es')` con locale fijo en el código (comentario explícito: "Locale fijo a propósito... el locale del visitante no cambia qué documento resuelve"). Esto significa que **la aserción de "paridad de locales" para `/go/` no aplica de la forma habitual** (misma URL sirve a ambos locales, sin variante `/en/go/`) — el planner debe verificar esto releyendo `47-CONTEXT.md`/`47-RESEARCH.md` antes de escribir un test que asuma una ruta `/en/go/<slug>` inexistente. La paridad de locales de GATE-02 aplica más bien a: (a) `destinations[]` dentro de un doc de `affiliate-links` (¿hay más de un `marketplace` con URLs distintas?), y (b) el copy del disclosure (`AffiliateDisclosure` sí toma `locale` y sí varía por idioma vía `messages/{es,en}.json`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Re-medición de Lighthouse | Un script nuevo de captura | `scripts/lighthouse-mobile.mjs` sin modificar | Ya acepta `--routes-only` con lista arbitraria; escribir uno nuevo rompería la comparabilidad byte a byte de la serie 32→36→45→50 |
| Captura de H1/JSON-LD | Un parser HTML nuevo | `scripts/capture-service-page-snapshot.mjs` sin modificar | Mismo motivo — es el ancla de la serie desde Phase 25 |
| Captura de canonical/hreflang | Extender el script de arriba | `scripts/capture-head-links-snapshot.mjs` (script hermano ya existente) | Ya resuelto en Phase 45 con la misma discusión (sibling vs. extend); no reabrir esa decisión |
| Medición de bytes de JS de cliente | Un bundle analyzer nuevo o webpack-bundle-analyzer | Grep de `'use client'` sobre los archivos nuevos de 46-49 | El bundle diff histórico está contaminado (ver Pattern 2); la auditoría estructural es más simple y más correcta para este caso específico (10 archivos, cero client components) |
| Diff de commits del milestone | Asumir que `60700ac..HEAD` = "el milestone" | Filtrar por mensajes de commit `(4[6-9]` / `(48\.5` / `(50` cuando se necesite aislar trabajo real de monetización | El rango crudo mezcla 209 commits de trabajo no relacionado (auditoría SEO, rediseño de home, rebuild de blog) |

**Key insight:** Esta fase no necesita ninguna herramienta nueva — el riesgo real no es técnico sino de alcance: confundir "el rango de commits desde que empezó el milestone" con "los cambios que hizo el milestone" al medir JS de cliente, porque en este repo (a diferencia de un repo con una rama de feature aislada) el trabajo de monetización se intercaló con una auditoría SEO completa y dos rediseños de UI en la misma rama principal.

## Common Pitfalls

### Pitfall 1: Confundir el rango de commits del milestone con "todo lo que cambió en ese tiempo"
**What goes wrong:** Diffear `.next/static` o `git diff` entre el commit de inicio de Phase 44 y HEAD para medir "lo que agregó el milestone" da un resultado contaminado por ~200 commits no relacionados.
**Why it happens:** El repo no usa una rama de feature aislada para el milestone; todo el trabajo (monetización + auditoría SEO paralela + rediseños) vive en la misma línea de commits secuenciales.
**How to avoid:** Usar auditoría estructural (grep de `'use client'`) para el criterio de JS de cliente, y filtrar `git log` por mensajes de commit `(46-`/`(47-`/`(48-`/`(48.5`/`(49-` cuando se necesite aislar cambios reales del milestone para cualquier otro propósito.
**Warning signs:** Un diff de bundle que reporta cientos de KB de diferencia cuando la auditoría de código muestra cero componentes cliente nuevos — la discrepancia es la señal de contaminación, no de un error de medición.

### Pitfall 2: Regex de hreflang sin flag `i`
**What goes wrong:** Producción emite el atributo como `hrefLang` (camelCase, por cómo React serializa props de DOM), y una regex sin el flag `i` devuelve cero resultados en las 14 rutas.
**Why it happens:** Ya documentado en el propio `capture-head-links-snapshot.mjs` (comentario "OJO" en el archivo) — HTML es case-insensitive para nombres de atributo, pero una regex literal no lo es.
**How to avoid:** El script ya tiene el flag `i` — no tocarlo. Si se escribe cualquier grep/regex ad-hoc adicional en esta fase (p. ej. para el crawl de GATE-02), replicar el mismo flag.
**Warning signs:** Un "0 resultados" sospechosamente limpio en una ruta donde se sabe que el HTML tiene el atributo.

### Pitfall 3: Confundir una exención documentada de `overrideAccess:false` con un gap real
**What goes wrong:** `getCachedFeaturedContent` en `src/lib/cache.ts` NO tiene `overrideAccess: false` — a diferencia de cada otro fetcher del archivo — y un grep ingenuo (`grep -c "overrideAccess: false"` vs. contar `payload.find`) lo marcaría como un falso positivo de "gap de seguridad".
**Why it happens:** Es una exención real y documentada: `featured-content` es un global sin `versions`/drafts, así que no hay estado borrador que filtrar, y el `access` por defecto de Payload para globals sin bloque `access` explícito ya deniega lectura no autenticada (confirmado en el propio comentario del código: rompió Home en producción con 500 hasta que se quitó el `overrideAccess:false`).
**How to avoid:** Al hacer el grep de GATE-02 (comando 6 de la Pattern 3), leer el comentario inmediatamente arriba de cada `payload.find*` sin `overrideAccess:false` antes de marcarlo como fallo — debe decir explícitamente por qué está exento.
**Warning signs:** Un conteo de "N llamadas a find, pero solo N-1 tienen overrideAccess:false" sin haber leído el comentario de la que falta.

### Pitfall 4: Leer contención de CPU local como regresión real
**What goes wrong:** Phase 45 vio spreads de performance > 15 puntos en 10/14 rutas por contención de CPU en la laptop, no por el servidor — el TTFB medido por curl fue estable (0.71-0.92s) mientras el performance score de Lighthouse saltaba.
**Why it happens:** Lighthouse corre en la misma máquina que hace otras cosas durante la captura; el runner de Chrome-for-Testing es sensible a contención de CPU/GC pauses.
**How to avoid:** Si una ruta muestra un salto de 20+ puntos en una sola corrida, reproducir con 2-3 corridas limpias aisladas (Phase 28/36 precedent) antes de concluir regresión real. `caffeinate -u` durante toda la captura para evitar que la pantalla se duerma y afecte el scheduling.
**Warning signs:** Un solo run con TBT/performance muy fuera de línea mientras el resto del cluster de corridas está apretado.

### Pitfall 5: Leer los 2 hallazgos ya documentados de Phase 45 como regresiones nuevas
**What goes wrong:** `/en` muestra el H1 en español (bug pre-existente, no del milestone) y la canibalización `/blog/pilas-y-colas` vs. su canónica sigue viva (tampoco del milestone).
**Why it happens:** Ambos están documentados en `45-REGRESSION-BASELINE.md` como "estado de base, no defecto de esta fase" — si Phase 50 los redescubre sin cruzar contra ese documento, los reportaría como regresiones nuevas introducidas por 46-49.
**How to avoid:** Cruzar cualquier hallazgo de contenido contra la sección "Hallazgo real" de `45-REGRESSION-BASELINE.md` antes de calificarlo de regresión.
**Warning signs:** Un "nuevo" hallazgo sobre `/en` o sobre canibalización de blog que en realidad ya estaba en el baseline.

## Code Examples

Ver "Pattern 3: Grep/Crawl Strategy for GATE-02" arriba — contiene los 7 comandos ejecutables completos para las aserciones de GATE-02, y "Pattern 1"/"Pattern 2" para GATE-01.

## State of the Art

No aplica — esta fase no introduce tecnología nueva, reusa exactamente el stack de medición de Phases 32/36/45.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | El comando de crawl para "cero links de Amazon por /go/" asume que se puede enumerar los docs de `affiliate-links` con `program=amazon` vía admin o Local API durante la fase — esta research no tuvo acceso a la base de datos real para confirmar si existe algún doc así hoy | Pattern 3, comando 3 | Si no hay acceso admin durante la fase, el planner debe usar el fallback: si no hay ningún slug conocido de programa Amazon, la aserción se satisface vacuamente (no hay nada que crawlear) — documentar explícitamente, no omitir el chequeo |
| A2 | Se asume que "el commit de inicio de Phase 44" (`60700ac`) es el ancla correcta para "el milestone completo" per el ROADMAP, aunque el `git diff` real entre ese commit y el cierre de Phase 45 no está vacío en `src/` (contradice la afirmación textual de `45-REGRESSION-BASELINE.md` de que "ningún componente, contenido ni schema se modificó" en Phase 44-45) | Pattern 2 | Si el planner necesita un ancla de commit exacta para cualquier otro propósito (no solo bundle-size), debe re-verificar contra `git log` en el momento, no asumir que `60700ac` sigue siendo válido tras más commits |
| A3 | Se asume que no existe todavía ningún post publicado con el bloque `affiliate-inline` insertado — no se verificó contra la base de datos real si al menos un post en producción hoy dispara la condición `postHasAffiliateInline(doc.content)` para poder crawlear la ruta 2 de Pattern 3 (orden del disclosure) contra un post real | Pattern 3 | Si ningún post real lo usa, el planner debe usar `/stack` como la única superficie verificable para la aserción de orden del disclosure, y flaggear la cobertura de posts como no verificable hasta que exista contenido real |

## Open Questions

1. **¿Existe hoy al menos un doc de `affiliate-links` con `program: 'amazon'` y `active: true`?**
   - What we know: el campo `program` acepta `'amazon'` como opción válida en el schema; `GearCard` renderiza Amazon directo (nunca via `affiliate-links`/`/go/`); `ToolCard` sí podría en teoría referenciar un doc de programa Amazon si un editor lo creara.
   - What's unclear: si ya existe un doc así en la base real, y si tiene un `slug` resoluble por `/go/`.
   - Recommendation: la Task 1 de la fase debe empezar por consultar la Local API (o el admin) por `affiliate-links` con `program: 'amazon'` antes de escribir la aserción "cero links de Amazon por /go/" — si existe uno, la aserción falla automáticamente y es un hallazgo real, no un falso negativo del research.

2. **¿Hay al menos un post publicado con el bloque `affiliate-inline`, para poder crawlear el orden del disclosure en esa superficie contra HTML real?**
   - What we know: el componente y el escaneo (`post-affiliate-scan.ts`) están completos y probados por Phase 48-03; el propio código admite explícitamente que "hoy ningún post de esta fase" usa la variante Amazon del bloque.
   - What's unclear: si algún editor ya insertó el bloque en al menos un post real desde entonces.
   - Recommendation: si no hay ninguno, documentar la superficie como "sin contenido real que crawlear — verificado por lectura de código únicamente" en vez de fabricar un post de prueba (fuera de alcance de una fase de gate puro).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Correr los 3 scripts `.mjs` | ✓ | v24.13.0 | — |
| `lighthouse` (npm, ya instalado) | `lighthouse-mobile.mjs` | ✓ | 13.4.1 | — |
| `chrome-launcher` (npm, ya instalado) | `lighthouse-mobile.mjs` | ✓ | 1.2.1 | — |
| Chrome-for-Testing binario | Lighthouse | ✓ (cacheado en `.lighthouse-chrome/` desde Phase 45, o se descarga solo) | — | — |
| Acceso de red a `https://juan-tech.com` | Los 3 scripts de captura + crawl de GATE-02 | Se asume ✓ (sitio en producción vía Dokploy) | — | — |
| Acceso admin/Local API a Payload en producción (para enumerar `affiliate-links`) | Open Question 1 y 2 | No verificado esta sesión | — | Si no hay acceso, documentar como no verificable y avanzar con lo crawleable por HTTP público |
| Herramientas MCP `gsc-juan-*` (Search Console) | Fuera de alcance de GATE-01/02 per ROADMAP — Phase 50 no repite la captura de GSC, solo Lighthouse/CWV + afiliación | N/A | — | — |

**Missing dependencies with no fallback:** ninguno identificado que bloquee la fase.

**Missing dependencies with fallback:** acceso admin a `affiliate-links` (Open Questions 1/2) — fallback es documentar explícitamente la falta de cobertura en vez de bloquear el gate.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V4 Access Control | yes | `overrideAccess: false` explícito en cada fetcher de `src/lib/cache.ts` (o exención documentada) — ya implementado en Phases 43/46, esta fase solo re-confirma por grep |
| V5 Input Validation | no (no hay input nuevo del usuario en esta fase) | — |
| V6 Cryptography | no | — |

### Known Threat Patterns for este stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Enumeración de slugs de afiliado inactivos vía `/go/[slug]` | Information Disclosure | Ya mitigado en Phase 47: slug inexistente y slug inactivo devuelven la misma respuesta 404 genérica — esta fase solo verifica que sigue siendo cierto en producción |
| Fuga de metadatos internos (`cookieWindowDays`/`commissionNote`) vía API pública | Information Disclosure | Ya mitigado en Phase 46 con `FieldAccess` gateado por `Boolean(user)` — fuera del alcance de re-verificación de esta fase (no listado en GATE-01/02), pero se puede incluir como chequeo adicional de bajo costo si el planner quiere reforzar el gate |
| Colecciones de datos privados (`subscribers`, `affiliate-clicks`, `lead-magnets`) expuestas vía sitemap o MCP | Information Disclosure | Ya mitigado por diseño — excluidas explícitamente de `SITEMAP_COLLECTIONS` y del mapa de colecciones de `mcpPlugin`; esta fase re-confirma por grep (comando 7, Pattern 3) |

## Sources

### Primary (HIGH confidence)
- Lectura directa de código esta sesión: `src/components/AffiliateLink.tsx`, `src/components/AffiliateDisclosure.tsx`, `src/components/AffiliateDisclosureFrame.tsx`, `src/components/ToolCard.tsx`, `src/components/GearCard.tsx`, `src/components/AffiliateInlineCard.tsx`, `src/blocks/ToolStack/Component.tsx`, `src/blocks/AuditorHighlight/Component.tsx`, `src/blocks/AuditorCallout/Component.tsx`, `src/blocks/EmailCaptureBlock/Component.tsx`, `src/app/go/[slug]/route.ts`, `src/lib/affiliate.ts`, `src/lib/affiliate-cta.ts`, `src/lib/post-affiliate-scan.ts`, `src/lib/cache.ts`, `src/lib/sitemap-data.ts`, `src/payload.config.ts`, `src/collections/AffiliateLinks/index.ts`, `src/collections/AffiliateClicks/index.ts`, `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx`, `src/app/(frontend)/[locale]/stack/page.tsx`
- `.planning/phases/45-baseline-de-regresi-n/45-REGRESSION-BASELINE.md` — baseline real contra el que compara esta fase
- `.planning/milestones/v1.7-phases/36-regression-gate/36-REGRESSION-DIFF.md` y `36-01-PLAN.md` — precedente de formato de reporte y umbral de diff
- `scripts/lighthouse-mobile.mjs`, `scripts/capture-service-page-snapshot.mjs`, `scripts/capture-head-links-snapshot.mjs` — leídos completos o parcialmente esta sesión
- `git log`/`git diff` corridos esta sesión contra el repo real (no asumidos) — confirmaron el hallazgo de contaminación del rango de commits

### Secondary (MEDIUM confidence)
- Ninguna

### Tertiary (LOW confidence)
- Ninguna

## Metadata

**Confidence breakdown:**
- Standard stack (reuso de scripts): HIGH — cero paquetes nuevos, todo verificado contra el repo real
- Arquitectura de crawl GATE-02: HIGH — cada superficie leída directamente en código esta sesión
- Estrategia de JS de cliente: HIGH — verificado por grep real, no asumido; la limitación (bundle diff contaminado) también verificada con `git log`/`git diff` reales
- Pitfalls: HIGH — 4 de 5 extraídos directamente de documentos de fases anteriores (45/36/28) con evidencia citada, 1 (overrideAccess exención) verificado por lectura de código esta sesión

**Research date:** 2026-09-10
**Valid until:** Esta fase debe ejecutarse pronto (es el cierre del milestone) — si pasan más de 7 días, re-verificar que no haya nuevos commits fuera de scope que sigan contaminando cualquier intento de bundle diff, y re-confirmar que `affiliate-links` no ganó un doc `program: 'amazon'` activo en el ínterin (Open Question 1).
