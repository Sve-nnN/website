---
phase: 46-disclosure-legal-esquema-de-links-de-afiliado
plan: 02
subsystem: disclosure-legal
tags: [next-intl, payload, privacy, amazon-associates, legal]
dependency-graph:
  requires: []
  provides:
    - "component:AffiliateDisclosure"
    - "messages:affiliateDisclosure"
    - "content:pages/privacy (sections 7-8)"
  affects:
    - messages/es.json
    - messages/en.json
tech-stack:
  added: []
  patterns:
    - "Copy legal fuente en messages/{es,en}.json, nunca en el CMS"
    - "Ruta temporal bajo /api para probar un Server Component con next-intl real antes de que exista la página que lo monte"
    - "Script de contenido que reusa blockId/columnId entre locales al reescribir un richText de Payload (misma disciplina que scripts/humanize-legal-pages.ts)"
key-files:
  created:
    - src/components/AffiliateDisclosure.tsx
    - scripts/verify-affiliate-disclosure.ts
    - scripts/update-privacy-resend.ts
  modified:
    - messages/es.json
    - messages/en.json
decisions:
  - "Frase de Amazon en español aprobada por Juan: Opción A (literal) — 'Como Afiliado de Amazon, obtengo ingresos por las compras que califican.' — traducción fiel del inglés, no un texto oficial (no existe uno para esta cuenta US, per 46-RESEARCH.md Pitfall 2)"
  - "Ruta temporal de preview movida de src/app/api/_dev-preview/... a src/app/api/dev-preview-affiliate-disclosure/... porque Next.js trata cualquier segmento con prefijo _ como private folder, excluido del routing"
  - "El route handler de preview no puede usar renderToStaticMarkup (Next bloquea react-dom/server dentro del grafo de módulos de la app) — invoca el componente real y extrae texto de element.props.children en su lugar"
metrics:
  duration: "~45 min (Tasks 1, 3, 4; Task 2 fue un checkpoint humano)"
  completed: 2026-09-03
status: complete
actuals:
  tokens: 3030
  tasks: 4
  commits: 4
---

# Phase 46 Plan 02: Disclosure Legal Summary

Componente `AffiliateDisclosure` con copy bilingüe fuente en `messages/{es,en}.json` (nunca en el CMS), incluyendo la frase verbatim de Amazon en inglés y su traducción al español aprobada explícitamente por Juan; y `/privacy` actualizada en producción cubriendo el formulario de alta al correo, Resend como encargado del tratamiento, retención y proceso de baja.

## What Was Built

**Task 1 — AffiliateDisclosure de punta a punta (tracer):**
- `messages/en.json`: namespace `affiliateDisclosure` completo — `generalDisclosure` + `amazonDisclosure` verbatim (Sección 5, US Operating Agreement de Amazon).
- `messages/es.json`: namespace `affiliateDisclosure` con solo `generalDisclosure` (la clave `amazonDisclosure` se dejó pendiente a propósito del checkpoint de Task 2).
- `src/components/AffiliateDisclosure.tsx`: componente de servidor, `getTranslations(locale/namespace)`, cero JS de cliente, renderiza el disclosure general siempre y el de Amazon condicionado a `hasAmazonLinks`.
- Ruta temporal de preview (creada y luego borrada en Task 3) para probar el componente contra next-intl real, con el dev server corriendo, antes de que exista una página real que lo monte (Phase 48).
- `scripts/verify-affiliate-disclosure.ts`: documenta el contrato de verificación (no ejecutable vía `tsx` suelto — `getTranslations` necesita el runtime real de Next).

**Task 2 — Checkpoint humano (Amazon ES):**
- Presentadas 2 opciones de traducción fiel al español de la frase obligatoria en inglés (no existe una oficial para esta cuenta US, per 46-RESEARCH.md Pitfall 2).
- **Juan eligió Opción A (literal):** "Como Afiliado de Amazon, obtengo ingresos por las compras que califican."

**Task 3 — Escribir la frase ES aprobada + limpieza:**
- `messages/es.json`: `affiliateDisclosure.amazonDisclosure` = la Opción A aprobada, verbatim.
- Confirmado contra el dev server real: la ruta temporal renderiza la frase en español correctamente.
- Ruta temporal de preview borrada — cumplió su único propósito.

**Task 4 — /privacy: Resend, retención y proceso de baja (LEG-03):**
- `scripts/update-privacy-resend.ts`: reescribe `privacySections` (es/en) reusando VERBATIM las 6 secciones existentes (Payload reemplaza el árbol completo de `richText` en cada `update()`, omitirlas las habría borrado de producción) y agrega 2 secciones nuevas al final de cada locale:
  - ES: "7. Formulario de Alta al Correo" (qué se recopila, Resend como encargado del tratamiento) y "8. Retención y Baja" (12 meses, proceso de baja).
  - EN: "7. Newsletter Sign-up Form" y "8. Retention and Opt-Out" (mismo contenido en inglés).
- Corrido contra el Postgres real de Dokploy (confirmado con `scripts/db/04-which-database.ts` antes de escribir).
- Verificado por curl contra `https://juan-tech.com/privacy` y `/en/privacy` en vivo (tras esperar el TTL de 60s de `unstable_cache`): las 6 secciones originales siguen presentes verbatim en ambos locales, las 2 nuevas mencionan Resend, retención y proceso de baja.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] La ruta temporal de preview nunca se registraba (prefijo `_` = private folder de Next.js)**
- **Found during:** Task 1
- **Issue:** El plan ubicaba la ruta en `src/app/api/_dev-preview/affiliate-disclosure/route.ts`. Next.js App Router trata cualquier segmento de carpeta con prefijo `_` como "private folder", excluido del routing por completo — la ruta nunca se compilaba ni se registraba, y las requests caían al catch-all de Payload (`src/app/(payload)/api/[...slug]/route.ts`), devolviendo `{"message":"There was an error initializing Payload"}`.
- **Fix:** Ruta movida a `src/app/api/dev-preview-affiliate-disclosure/route.ts` (sin guion bajo), mismo propósito, verificado end-to-end contra el dev server real tras el cambio.
- **Files modified:** src/app/api/dev-preview-affiliate-disclosure/route.ts (creado con el nuevo nombre; el original nunca llegó a commitearse con el nombre viejo salvo en el primer commit, corregido en el mismo commit de Task 1)
- **Commit:** 5684d4a

**2. [Rule 3 — Blocking issue] `renderToStaticMarkup` no se puede importar dentro del grafo de módulos de la app**
- **Found during:** Task 1
- **Issue:** El plan pedía usar `renderToStaticMarkup` de `react-dom/server` dentro del route handler temporal. Next 15 bloquea a nivel de build cualquier import (aunque sea transitivo) de `react-dom/server` en código que forma parte del árbol de la app ("You're importing a component that imports react-dom/server. To fix it, render or return the content directly as a Server Component instead for perf and security.").
- **Fix:** El route handler invoca `AffiliateDisclosure` directamente (componente sin hooks, invocable como función) y extrae el texto de `element.props.children`, en vez de renderizar a HTML estático. Sigue exercitando `getTranslations`/next-intl de punta a punta contra el request real, que es el único propósito de esta ruta temporal — la mecánica de renderizado a HTML ya está cubierta por separado en Plan 46-01 (`AffiliateLink`, probado vía `renderToStaticMarkup` en un script `tsx` standalone, fuera del grafo de módulos de la app).
- **Files modified:** src/app/api/dev-preview-affiliate-disclosure/route.ts
- **Commit:** 5684d4a

### Environment Notes (non-blocking, no code change)

Igual que en Plan 46-01, la conexión a la base real de Dokploy (necesaria para Task 4) pasó por el túnel SSH manual (`scripts/db/tunnel.sh`), que volvió a mostrarse intermitente durante la ejecución y requirió un reinicio antes de correr `scripts/update-privacy-resend.ts` con éxito. No es un defecto de este plan.

**Nota sobre STATE.md/REQUIREMENTS.md (per instrucción explícita del orquestador):** este worktree fue creado antes de que se commitearan los artefactos de cierre de Phase 45 en el checkout principal, así que su copia local de esos dos archivos es más vieja que el estado real del proyecto. Por instrucción directa del orquestador, NO se tocaron ni se reintentaron los comandos `gsd-tools query state.*`/`requirements.*` para este plan — la reconciliación contra el STATE.md/REQUIREMENTS.md reales queda a cargo del orquestador después del merge. Decisiones/métricas a aplicar manualmente:
- Marcar completos: LEG-01, LEG-02, LEG-03, LEG-04 (Plan 46-02)
- Métrica: Phase 46 P02 | ~45min | 4 tasks | 5 files
- Decisión: `AffiliateDisclosure` con copy fuente en `messages/*.json`; frase de Amazon en español aprobada por Juan = Opción A ("Como Afiliado de Amazon, obtengo ingresos por las compras que califican."); `/privacy` y `/en/privacy` actualizadas en producción con 2 secciones nuevas (Resend/retención/baja), 6 secciones originales verificadas intactas contra el sitio real.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo fuera del `<threat_model>` del plan — la única superficie nueva (la ruta temporal de preview bajo `/api`) fue removida en Task 3, per T-46-07.

## Self-Check: PASSED

- `src/components/AffiliateDisclosure.tsx` — FOUND
- `scripts/verify-affiliate-disclosure.ts` — FOUND
- `scripts/update-privacy-resend.ts` — FOUND
- `src/app/api/dev-preview-affiliate-disclosure/route.ts` — CONFIRMED ABSENT (borrado en Task 3, como corresponde)
- Commit `5684d4a` — FOUND en `git log`
- Commit `97ceeb3` — FOUND en `git log`
- Commit `dc1e30c` — FOUND en `git log`
- `npx tsc --noEmit` — PASS (sin salida) tras cada task, incluido después de borrar la ruta temporal
- `messages/es.json`/`messages/en.json` — namespace `affiliateDisclosure` completo en ambos idiomas, confirmado por lectura directa
- `https://juan-tech.com/privacy` y `/en/privacy` — 200, 6 secciones originales + 2 nuevas confirmadas por curl contra el sitio real en vivo
