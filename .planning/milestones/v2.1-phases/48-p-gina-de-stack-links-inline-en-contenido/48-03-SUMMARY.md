---
phase: 48-p-gina-de-stack-links-inline-en-contenido
plan: 03
subsystem: cms-frontend
tags: [payload, lexical, richtext, affiliate-links, nextjs, i18n]

requires:
  - phase: 46-disclosure-legal-esquema-de-links-de-afiliado
    provides: "affiliate-links collection, AffiliateLink leaf, AffiliateDisclosure component"
  - phase: 47-ruta-go-fix-de-middleware-registro-de-clics
    provides: "/go/[slug] redirect route (unchanged, consumed by this plan's CTA)"
  - phase: 48-p-gina-de-stack-links-inline-en-contenido
    provides: "affiliate-cta.ts (resolveAffiliateCta), AffiliateDisclosureFrame, doc affiliate-links slug=dinorank (Plan 48-01)"
provides:
  - "Bloque Lexical affiliate-inline registrado vía BlocksFeature en posts.content (cero migración)"
  - "AffiliateInlineCard.tsx, leaf sin hazard de TDZ/import circular"
  - "post-affiliate-scan.ts (findAffiliateInlineNodes/postHasAffiliateInline/postHasAmazonAffiliateInline), funciones puras"
  - "Disclosure auto-inyectado antes del cuerpo en blog/[category]/[slug]/page.tsx"
  - "Demo real: post guia-keyword-research (es+en) con el bloque inline de DinoRANK"
affects: ["49", "50"]

actuals:
  tokens: 7684
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Segundo consumidor de resolveAffiliateCta/AffiliateLink (el primero es ToolCard, Plan 48-01) — misma maquina de 3 estados (activo/pendiente/none) reutilizada desde un leaf de Lexical"
    - "Primer bloque de este repo registrado vía BlocksFeature real (code-block/faq de richTextBlockConverters.tsx son legado sin registro, leidos crudos del JSON migrado) -- payload-types.ts SI genera un tipo real (AffiliateInlineBlock) para este"
    - "Escaneo puro de content.root.children (mismo estilo que lexical-split.ts/affiliate.ts) para decidir UI derivada del richText sin queries extra"

key-files:
  created:
    - src/blocks/AffiliateInlineBlock/config.ts
    - src/components/AffiliateInlineCard.tsx
    - src/lib/post-affiliate-scan.ts
    - scripts/seed-phase48-inline-demo.ts
    - scripts/verify-affiliate-inline-block.ts
  modified:
    - src/collections/Posts/index.ts
    - src/components/richTextBlockConverters.tsx
    - "src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx"
    - src/payload-types.ts
    - "src/app/(payload)/admin/importMap.js"

key-decisions:
  - "AffiliateInlineCard NUNCA recibe locale como prop desde el converter (richTextConverters no tiene acceso a la request) -- resuelve el locale internamente vía getTranslations(namespace) sin locale explicito, igual patron que AffiliateDisclosure.tsx cuando no se le pasa locale"
  - "Candidato de la demo resultó genuino (no fue necesario el fallback de conveniencia): guia-keyword-research menciona keyword research de verdad, mencionar DinoRANK ahi es honesto"
  - "admin/importMap.js incluido en el commit de Task 2 (no Task 1): el dev server lo regeneró automáticamente al primer arranque con BlocksFeature registrado -- artefacto generado necesario para que el bloque sea seleccionable en el editor de admin, sin el cual el bloque existiría en schema pero no en la UI"

requirements-completed: [INL-01, INL-02]

coverage:
  - id: D1
    description: "Bloque Lexical affiliate-inline registrado en posts.content vía BlocksFeature, cero migración de Postgres"
    requirement: "INL-01"
    verification:
      - kind: integration
        ref: "npm run build (grep negativo de imports prohibidos + git diff --stat src/migrations/ vacío + payload-types.ts con AffiliateInlineBlock)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D2
    description: "AffiliateInlineCard nunca importa AffiliateDisclosure ni RichTextRenderer (evita el hazard de TDZ documentado)"
    requirement: "INL-01"
    verification:
      - kind: other
        ref: "grep -E negativo sobre las dos rutas de import + npm run build sin 'Cannot access ... before initialization'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Disclosure se inyecta automáticamente antes del primer link de afiliado, orden de DOM verificado por índices de string, sobre un post real y publicado"
    requirement: "INL-02"
    verification:
      - kind: e2e
        ref: "scripts/verify-affiliate-inline-block.ts contra dev server real + Postgres real de Dokploy (PASS) -- /blog/seo/guia-keyword-research y /en/blog/seo/guia-keyword-research"
        status: pass
    human_judgment: false
  - id: D4
    description: "Profundidad de población de fields.affiliateLink verificada empíricamente (no asumida) contra el post real a depth:2"
    requirement: "INL-02"
    verification:
      - kind: integration
        ref: "scripts/verify-affiliate-inline-block.ts:verifyPopulationDepth -- confirmó objeto poblado con program=dinorank a depth:2, sin necesidad de subir el depth de getCachedPost"
        status: pass
    human_judgment: false

duration: ~55min
completed: 2026-09-05
status: complete
---

# Phase 48 Plan 03: Bloque inline de afiliado en posts + disclosure auto-inyectado Summary

**Bloque Lexical `affiliate-inline` en `posts.content` (cero migración) que reutiliza `AffiliateLink`/`resolveAffiliateCta` de la página `/stack`, con un escaneo puro que inyecta el disclosure legal automáticamente antes del cuerpo de cualquier post que lo use — demostrado sobre un post real y publicado (`guia-keyword-research`, DinoRANK).**

## Performance

- **Duration:** ~55 min (incluye merge de base + lectura de contexto + 2 tasks + verificación contra Dokploy real)
- **Started:** 2026-09-05T~13:50Z
- **Completed:** 2026-09-05T14:15Z
- **Tasks:** 2
- **Files modified:** 10 (5 creados, 5 modificados, incluye `payload-types.ts` y `admin/importMap.js` regenerados)

## Nota de contexto previa a la ejecución

Este worktree fue creado desde `master` (commit `a1f1cb0`), ANTES de que el trabajo de las Phases 46-48 (incluyendo Plan 48-01, del que este plan depende explícitamente) aterrizara en `docs/seo-handoff`. Antes de tocar código se hizo `git merge docs/seo-handoff` (fast-forward limpio, sin conflictos) para traer esa base — sin eso, `src/lib/affiliate-cta.ts`, `AffiliateDisclosureFrame.tsx`, la colección `affiliate-links`, y las carpetas `.planning/phases/48-*` no habrían existido en este worktree.

## Accomplishments

- `src/blocks/AffiliateInlineBlock/config.ts`: `Block` de Payload, `slug: 'affiliate-inline'` (kebab-case, valor literal que Payload guarda en `fields.blockType`), un único campo `affiliateLink` (relationship a `affiliate-links`, `required: true`).
- `src/collections/Posts/index.ts`: `content` ahora usa `editor: lexicalEditor({ features: ({ rootFeatures }) => [...rootFeatures, BlocksFeature({ blocks: [AffiliateInlineBlock] })] })` — primer override de `content` en este archivo, ningún otro campo tocado.
- `src/components/AffiliateInlineCard.tsx`: leaf que resuelve el CTA vía la misma `resolveAffiliateCta` de `ToolCard` (Plan 48-01) — 3 estados (activo/pendiente/none), mismo `AffiliateLink` (mismo `rel="sponsored nofollow noopener"`). Confirmado por grep negativo y por `npm run build`: nunca importa `AffiliateDisclosure` ni `RichTextRenderer`.
- `src/components/richTextBlockConverters.tsx`: converter `'affiliate-inline'` agregado al objeto `blocks` existente (junto a `code-block`/`faq`), con nota en el docblock explicando que este SÍ es el primer bloque registrado vía `BlocksFeature` real de este repo.
- `src/lib/post-affiliate-scan.ts`: `findAffiliateInlineNodes`/`postHasAffiliateInline`/`postHasAmazonAffiliateInline`, funciones puras (sin import de `payload`), recorren `content.root.children` recursivamente, seguras ante cualquier forma inesperada del árbol (nunca crashean, devuelven `false`/`[]`).
- `blog/[category]/[slug]/page.tsx`: `AffiliateDisclosureFrame` se inyecta justo después de `ReadingProgress` y antes del `Container` del cuerpo, condicionado a `postHasAffiliateInline(doc.content)` — el escaneo cubre el documento ENTERO, no `body.before`/`body.after` recortados por `splitContentForOffer`.
- `payload generate:types` regenerado: `AffiliateInlineBlock` ahora existe en `payload-types.ts`; `git diff --stat src/migrations/` confirmado vacío (INL-01 no genera DDL, `posts.content` ya era `jsonb`).
- Demo real: `scripts/seed-phase48-inline-demo.ts` encontró un candidato GENUINO (no hizo falta el fallback de conveniencia) — `guia-keyword-research` ("Guía Maestra de Keyword Research 2026: Entidades y Clústeres"), y le insertó el bloque `affiliate-inline` (DinoRANK) en ambos locales, reusando el mismo `id` de bloque.
- `scripts/verify-affiliate-inline-block.ts` corrido contra el dev server real conectado al Postgres real de Dokploy (túnel SSH manual): `PASS` en ambos locales, `fields.affiliateLink` confirmado poblado como objeto (`program="dinorank"`) a `depth:2` sin necesidad de subir el depth.

## Task Commits

1. **Task 1: Bloque Lexical AffiliateInlineBlock + AffiliateInlineCard + registro en Posts.content** - `fb7de3e` (feat)
2. **Task 2: Escaneo puro del editor state, disclosure auto-inyectado, demo real** - `4db26d6` (feat)

## Files Created/Modified

- `src/blocks/AffiliateInlineBlock/config.ts` - Block de Payload, campo único `affiliateLink` required
- `src/components/AffiliateInlineCard.tsx` - leaf sin hazard de TDZ, 3 estados de CTA
- `src/components/richTextBlockConverters.tsx` - converter `'affiliate-inline'` registrado
- `src/collections/Posts/index.ts` - `BlocksFeature([AffiliateInlineBlock])` en `content`
- `src/lib/post-affiliate-scan.ts` - escaneo puro del editor state
- `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx` - `AffiliateDisclosureFrame` auto-inyectado
- `src/payload-types.ts` - `AffiliateInlineBlock` regenerado
- `src/app/(payload)/admin/importMap.js` - `BlocksFeatureClient` registrado (regenerado por el dev server)
- `scripts/seed-phase48-inline-demo.ts` - siembra el bloque inline en un post real
- `scripts/verify-affiliate-inline-block.ts` - verificación contra HTML servido real + Local API

## Decisions Made

- `AffiliateInlineCard` nunca recibe `locale` como prop desde el converter — lo resuelve internamente vía `getTranslations('stackPage')` sin locale explícito, mismo patrón ya usado por `AffiliateDisclosure.tsx` cuando no se le pasa locale (el request-scoped locale de next-intl resuelve solo).
- El post candidato de la demo resultó genuino (mención real de "keyword research") — no fue necesario invocar el fallback de conveniencia documentado en el plan.
- `admin/importMap.js` se incluyó en el commit del Task 2: el dev server lo regeneró automáticamente al detectar `BlocksFeature` nuevo (registra `BlocksFeatureClient` de `@payloadcms/richtext-lexical/client`), necesario para que el bloque sea seleccionable desde el editor de admin — sin este archivo el bloque existiría en schema pero no aparecería en la UI del editor.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree creado desde una base sin el trabajo de Phase 46-48**

- **Found during:** Carga inicial de contexto (antes de Task 1)
- **Issue:** El worktree asignado a este plan partía de `master` (`a1f1cb0`), sin el merge de `docs/seo-handoff` donde vive todo el trabajo previo de Phase 46-48 (incluyendo Plan 48-01, dependencia explícita de este plan). Sin ese código, `resolveAffiliateCta`, `AffiliateDisclosureFrame`, la colección `affiliate-links`, y las carpetas de planning de la Phase 48 no existían en este worktree.
- **Fix:** `git merge docs/seo-handoff` (fast-forward limpio, sin conflictos — el commit base del worktree era exactamente el merge-base).
- **Files modified:** ninguno directamente (merge trae 92 archivos de Phase 46-48-01, ya committeados en `docs/seo-handoff`)
- **Verificación:** `git log --oneline -3` confirmó el historial correcto tras el merge; todos los archivos referenciados por el plan (`affiliate-cta.ts`, `AffiliateDisclosureFrame.tsx`, etc.) presentes.
- **Commit:** ninguno nuevo — fast-forward, no genera commit propio.

**2. [Rule 3 - Blocking] node_modules ausente en el worktree**

- **Found during:** Intento de correr `payload generate:types` (Task 1)
- **Issue:** El worktree no tenía `node_modules/` instalado.
- **Fix:** `npm ci --no-audit --no-fund`.
- **Files modified:** ninguno (node_modules gitignored)
- **Verificación:** `payload`, `tsx`, `next` disponibles en `node_modules/.bin/` tras la instalación.
- **Commit:** N/A (no versionado)

**3. [Rule 3 - Blocking] `.env` ausente en el worktree (gitignored, no compartido entre worktrees)**

- **Found during:** Intento de correr `payload generate:types`/`npm run build` (Task 1)
- **Issue:** `.env` no existe en este worktree (correcto — está gitignored). `payload generate:types` y `npx tsc --noEmit` no necesitan conexión viva a Postgres (confirmado también por 48-01-SUMMARY.md), pero sí necesitan que `payload.config.ts` pueda construirse (requiere `DATABASE_URI`/`PAYLOAD_SECRET` presentes, aunque sea con un valor no funcional). `npm run build` además requirió `NEXT_PUBLIC_SERVER_URL` (chequeo real de producción en `sitemap-data.ts`, no relacionado con este plan).
- **Fix:** Variables de entorno placeholder pasadas inline (`DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL=https://juan-tech.com`) solo para los comandos de generación/build/tsc que no tocan datos reales.
- **Files modified:** ninguno
- **Verificación:** `payload generate:types`, `npx tsc --noEmit` y `npm run build` completaron limpios.
- **Commit:** N/A

**4. [Rule 3 - Blocking] Relay SSH compartido tumbado por otra sesión concurrente**

- **Found during:** Task 2, primer intento de conectar contra Dokploy vía túnel
- **Issue:** El primer túnel levantado (`./scripts/db/tunnel.sh`) se conectó correctamente, pero el relay Docker en el VPS (`pg-relay-tmp`) fue removido por el trap de limpieza de OTRA sesión concurrente (el nombre del relay es fijo y compartido — 48-02 corría en paralelo con su propio túnel). El primer intento de `04-which-database.ts` falló con `Connection terminated due to connection timeout`.
- **Fix:** Se mató el túnel local viejo y se relanzó `tunnel.sh` de cero inmediatamente antes de correr los scripts, minimizando la ventana de colisión.
- **Files modified:** ninguno
- **Verificación:** `04-which-database.ts` confirmó conexión exitosa contra la base real de Dokploy en el segundo intento (host/conteos coincidentes con producción en vivo).
- **Commit:** N/A
- **Nota para futuras fases:** si más planes de este milestone corren en paralelo y necesitan el túnel, considerar parametrizar `RELAY_NAME` por sesión en `scripts/db/tunnel.sh` para evitar que una sesión tumbe el relay de otra.

---

**Total deviations:** 4 auto-fixed (todos Rule 3 - Blocking, ninguno es un bug de producto)
**Impact on plan:** Ninguno afecta el código de negocio del plan (INL-01/INL-02). Todos son fricción de entorno (worktree desactualizado, dependencias, credenciales, infraestructura de túnel compartida) resuelta sin desviarse del alcance.

## Issues Encountered

Ninguno adicional a los documentados arriba.

## User Setup Required

None - no external service configuration required. El disclosure/CTA reutilizan infraestructura ya viva de Phase 46/47/48-01.

## Next Phase Readiness

- INL-01 e INL-02 completos y verificados de punta a punta contra Postgres real de Dokploy — Plan 48-03 no bloquea nada de Phase 48.5/49/50.
- El post `guia-keyword-research` queda en producción (Dokploy) con el bloque inline real en ambos locales — es contenido válido y publicado, no un artefacto de prueba a limpiar.
- Túnel SSH y dev server local cerrados al finalizar (confirmado: puerto 3000 libre, sin procesos `ssh -L :15432` propios corriendo).
- 48-02 (contenido de `/stack`, en paralelo) no tiene overlap de archivos con este plan — confirmado contra su `files_modified` en `48-02-PLAN.md`.

## Self-Check: PASSED

Los 5 archivos creados confirmados en disco (`FOUND`); ambos commits (`fb7de3e`, `4db26d6`) confirmados en `git log`.

---
*Phase: 48-p-gina-de-stack-links-inline-en-contenido*
*Completed: 2026-09-05*
