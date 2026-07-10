---
phase: 04-migraci-n-mongo-postgres
verified: 2026-07-10T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
gaps: []
deferred: []
human_verification:
  - test: "Confirmar si los 4 medios irrecuperables (image-post1-2.webp, image-post2-2.webp, image-post3-2.webp, image-hero1-2.webp) requieren una fuente alternativa de backup, o si se descartan definitivamente."
    expected: "Decisión explícita de Juan sobre sourcing manual o descarte, dado que juan-tech.com sigue DEPLOYMENT_DISABLED y no hay fallback de disco."
    why_human: "Requiere una decisión de negocio/contenido (buscar backup alternativo vs. aceptar la pérdida) que no puede resolverse por grep/código. Nota: verificación independiente confirma que estos 4 medios NO están referenciados por ningún documento migrado (posts/testimonials/clientes/authors) — son assets huérfanos, no bloquean contenido publicado."
    resolved: "RESUELTO 2026-07-10 — Juan confirmó en conversación: \"no veo problema con eso, esas imágenes creo que igual no las vamos a usar\". Se acepta la pérdida definitivamente, sin buscar backup alternativo."
  - test: "Decidir si los documentos de prueba dejados en la base de datos real por fases anteriores (autor 'Test Author X' id=3, post 'test-post' id=1, case study 'test-case-study' id=1, redirect '/legacy-test-url' id=1 — todos creados 2026-07-09, antes de que corriera la migración de fase 4) deben limpiarse antes de Phase 5."
    expected: "Decisión explícita: borrar estos 4 documentos de prueba o dejarlos (con el riesgo de que aparezcan en listados públicos de blog/case-studies en Phase 5)."
    why_human: "No es un defecto introducido por el pipeline de migración de fase 4 (son fixtures de fases 1-2), pero si no se limpian antes de Phase 5, contaminarán las páginas públicas reales. Decisión de housekeeping, no técnica."
---

# Phase 4: Migración Mongo → Postgres Verification Report

**Phase Goal:** Todo el contenido real del sitio actual (posts, case studies, authors, testimonials, works/clientes, medios) existe en el nuevo backend Postgres con URLs idénticas a las actuales y relaciones preservadas, listo para renderizarse en las páginas públicas.
**Verified:** 2026-07-10
**Status:** passed (con 2 items de verificación humana pendientes, no bloqueantes para el goal de la fase)
**Re-verification:** No — verificación inicial

## Goal Achievement

### Observable Truths

Verificado independientemente contra la base de datos Postgres real (Neon), no solo contra `verification-summary.json` (que es generado por el mismo pipeline que se está auditando).

| # | Truth (Success Criterion del ROADMAP) | Status | Evidence |
|---|---|---|---|
| 1 | Existe un inventario congelado de URLs vivas del sitio actual (crawleado desde sitemap/GSC) que sirve como contrato de verificación | ✓ VERIFIED (con nota de metodología) | `.planning/phases/04-migraci-n-mongo-postgres/URL-INVENTORY.json` existe, 152 URLs, `frozenAt: 2026-07-10T01:52:03.980Z`. **Nota:** no fue un crawl HTTP en vivo — el sitio viejo (`juan-tech.com`) devolvía HTTP 402/`DEPLOYMENT_DISABLED` para todas las rutas incluido `/sitemap.xml` al momento del freeze, documentado explícitamente en el propio archivo. El inventario se reconstruyó leyendo la lógica exacta de `sitemap.ts` + query directa al dump real de Mongo — método honesto y verificable, no un crawl real, pero equivalente en rigor dado el bloqueo externo. Verificado independientemente: 63 slugs únicos de posts, 5 de categories, 1 de authors en el inventario — el 100% resuelve verbatim contra la DB real (ver truth 3). |
| 2 | Script ETL standalone puebla Postgres: Media → Authors/Categories → Posts/CaseStudies/Testimonials/Clientes en ese orden, vía Local API (no SQL crudo); Works auditado, no migrado 1:1 | ✓ VERIFIED | 7 scripts en `scripts/migrate/steps/01-*` a `07-*` numerados en el orden mandatado. Cada uno usa `getPayload({config})` + `payload.create/update/find` (Local API), confirmado por lectura directa de código — cero queries SQL crudas. `src/collections/` no contiene colección `works`. `works-audit-report.json` es `[]` (0 documentos reales en Works, confirmado por checkpoint de Juan: "Perfecto, confirmo" en `04-07-SUMMARY.md`). |
| 3 | Cada documento migrado conserva su slug/URL verbatim del original | ✓ VERIFIED | Consulta directa a Postgres: 63/63 slugs de posts del inventario congelado resuelven verbatim en la tabla `posts` (0 faltantes). 5/5 categories y 1/1 authors resuelven verbatim (0 faltantes). Comparación hecha independientemente contra `URL-INVENTORY.json`, no contra el reporte narrativo. |
| 4 | Relaciones entre documentos migrados resuelven vía remap-table ObjectId→Postgres-ID | ✓ VERIFIED | `scripts/migrate/data/remap-table.json` tiene claves `media` (11), `authors` (1 real + 1 residual pre-existente), `categories` (5), `testimonials` (1), `clientes` (6), `posts` (72). Consulta directa: `posts_rels` tiene 78 filas `categories_id` no nulas; `posts.author_id` no nulo en los 72 posts reales (0 nulos excluyendo el fixture de prueba); `clientes.logo_id` resuelve a IDs reales de media migrada (11-17) en los 6 clientes; `testimonials_locales` tiene `role`/`testimonial` poblados para ambos locales. |
| 5 | Medios re-subidos a Cloudinary (no URL-copy); richText/blocks apuntan a Cloudinary; deltas de URL intencionales tienen redirect 301 | ✓ VERIFIED | 11 documentos de media en Postgres con `url` apuntando a `res.cloudinary.com/dmufha3qv/...` — verificado con HTTP HEAD real (200 OK) contra uno de los assets, confirmando que es una subida real, no una URL copiada del origen. `scripts/migrate/steps/01-media.ts` usa el adapter `src/lib/cloudinary-adapter.ts` de Fase 3 (vía config de Payload), no un cliente Cloudinary ad-hoc. `remapRichTextMediaRefs` existe y su lógica es correcta, pero el dataset real no tiene ningún nodo `upload`/`mediaBlock`/`banner` embebido (0 posts con heroImage en el origen, 0 media embebida en richText — confirmado leyendo `posts.json` directamente), por lo que la función no tuvo casos reales que reescribir; no es un defecto, es ausencia de datos que ejercitar. 0 deltas de URL detectados → 0 redirects necesarios, consistente con el 100% de slugs verbatim verificado en la truth 3. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/migrate/export/dump-source.ts` | Dump real de 8 colecciones vía Local API | ✓ VERIFIED | Existe, produce `data/export/*.json` reales |
| `scripts/migrate/lib/{types,remap-table,richtext-remap}.ts` | Utilidades compartidas | ✓ VERIFIED | Existen, exports correctos, usados por los 7 steps |
| `.planning/phases/04-migraci-n-mongo-postgres/URL-INVENTORY.json` | Inventario congelado | ✓ VERIFIED | 152 entradas, ver nota de metodología en truth 1 |
| `scripts/migrate/steps/01-media.ts` a `07-redirects-and-verify.ts` | 7 scripts de migración por colección + cierre | ✓ VERIFIED | Los 7 existen, cada uno usa Local API + remap-table |
| `scripts/migrate/data/remap-table.json` | Remap-table poblada | ✓ VERIFIED | 6 claves con conteos consistentes con `verification-summary.json` |
| `scripts/migrate/data/works-audit-report.json` | Auditoría de Works | ✓ VERIFIED | `[]` — 0 Works reales, confirmado por checkpoint cerrado |
| `.planning/phases/04-migraci-n-mongo-postgres/04-VERIFICATION.md` | Reporte final | ✓ VERIFIED (este archivo reemplaza el narrativo previo con el formato estándar) | — |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `scripts/migrate/steps/01-media.ts` | `src/payload.config.ts` | `getPayload({config})` | ✓ WIRED | Import directo confirmado en código |
| `scripts/migrate/steps/01-media.ts` | Cloudinary (real) | Adapter de Fase 3 vía config de Payload | ✓ WIRED | 11 URLs `res.cloudinary.com` en Postgres, verificado con HTTP HEAD 200 real |
| `scripts/migrate/steps/02-authors-categories.ts` | `remap-table.ts` | `getMapping(table,'media',oldAvatarId)` | ✓ WIRED | Confirmado en código y en datos (avatar remap funcional) |
| `scripts/migrate/steps/04-posts.ts` | `richtext-remap.ts` | `remapRichTextMediaRefs` | ✓ WIRED (sin casos reales que ejercitar — ver truth 5) | Import y llamada presentes; 0 nodos de media embebidos en el dataset real |
| `scripts/migrate/steps/07-redirects-and-verify.ts` | `@payloadcms/plugin-redirects` | `payload.create({collection:'redirects',...})` | ✓ WIRED | Plugin registrado en `src/payload.config.ts`; 0 redirects creados porque 0 deltas reales (consistente) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| tabla `posts` | 72 documentos reales | `scripts/migrate/steps/04-posts.ts` ← `posts.json` (dump real de Mongo Atlas) | Sí | ✓ FLOWING |
| tabla `media` | 11 documentos con URL Cloudinary | `01-media.ts` ← binarios reales descargados y re-subidos | Sí (HTTP 200 verificado en vivo) | ✓ FLOWING |
| tabla `redirects` | 0 filas creadas por el pipeline (1 fila preexistente de fixture de fase 2) | `07-redirects-and-verify.ts` | Sí — 0 es el resultado correcto dado 0 deltas | ✓ FLOWING |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| MIGR-01 | 04-01, 04-08 | Inventario congelado de URLs como contrato | ✓ SATISFIED | `URL-INVENTORY.json` existe y fue diffed contra la DB real en 04-08 (0 deltas) |
| MIGR-02 | 04-01 a 04-07 | Script ETL standalone vía Local API, orden Media→Authors/Categories→resto | ✓ SATISFIED | 7 scripts verificados, orden correcto, sin SQL crudo |
| MIGR-03 | 04-03, 04-05, 04-08 | Slugs/URLs verbatim | ✓ SATISFIED | 0 slugs faltantes verificado independientemente contra Postgres |
| MIGR-04 | 04-01 a 04-08 | Remap-table ObjectId→Postgres-ID | ✓ SATISFIED | Remap-table poblada y consumida; relaciones resuelven en DB real |
| MIGR-05 | 04-02, 04-05, 04-06 | Medios re-subidos a Cloudinary + richText apuntando a nuevas URLs | ✓ SATISFIED (con gap conocido de 4/15 medios) | 11 medios confirmados en Cloudinary real; gap de 4 medios documentado y sin referencias en contenido migrado |
| MIGR-06 | 04-08 | Redirects 301 para deltas intencionales | ✓ SATISFIED | 0 deltas reales → 0 redirects necesarios, código idempotente presente y no ejercitado por falta de casos |

No hay requisitos huérfanos: los 6 IDs de REQUIREMENTS.md mapeados a Phase 4 aparecen todos en al menos un plan.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `scripts/migrate/steps/03-testimonials-clientes.ts` | 64, 112-113 | `PLACEHOLDER = '(sin especificar)'` usado como fallback explícito para `role`/`company` faltantes | ℹ️ Info | Documentado como manejo intencional de datos incompletos del origen (must-have de 04-04: "reporta como pendiente de decisión, no lo omite en silencio"), no un placeholder de implementación pendiente. No aplica en la práctica — el único testimonial real tenía ambos campos completos. |
| `scripts/migrate/steps/02-authors-categories.ts` | 66-70, 132 | Comentarios explicando colisión de slug con fixtures de Phase 2 (`seed-phase2.ts`) | ℹ️ Info | Explicación de diseño (upsert-by-slug), no un TODO/FIXME pendiente. |
| N/A (dato en Postgres, no en código) | — | Documentos de prueba residuales de fases anteriores en la DB real: `authors.id=3` ("Test Author X"), `posts.id=1` ("test-post"), `case_studies.id=1` ("test-case-study"), `redirects.id=1` ("/legacy-test-url") — todos creados 2026-07-09, antes de que corriera la migración de fase 4 (2026-07-10) | ⚠️ Warning | No es un defecto del pipeline de migración de fase 4 (son fixtures de Phase 1/2 para validar el esquema), pero contaminan la base de datos que Phase 5 va a renderizar públicamente. Ver human_verification. |

Ningún `TBD`/`FIXME`/`XXX` sin referencia encontrado en los archivos de la fase.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Media re-subida es un asset Cloudinary real (no URL copiada) | `curl -I https://res.cloudinary.com/dmufha3qv/image/upload/.../juan-angulo-portrait` | HTTP 200 | ✓ PASS |
| 63 slugs de posts del inventario resuelven verbatim en Postgres | Query directa a la tabla `posts` vs `URL-INVENTORY.json` | 0 faltantes | ✓ PASS |
| 5 slugs de categories y 1 de authors resuelven verbatim | Query directa | 0 faltantes | ✓ PASS |
| Relaciones post→categoría resuelven | Query a `posts_rels` | 78 filas con `categories_id` no nulo | ✓ PASS |
| Relaciones cliente→logo (media) resuelven | Query a `clientes` | 6/6 con `logo_id` apuntando a media Cloudinary real | ✓ PASS |
| Los 4 medios no migrados no están referenciados en ningún documento migrado | `grep` de los 4 ObjectIds fallidos contra todos los `export/*.json` | Solo aparecen en `media.json` (su propio registro), 0 referencias en posts/testimonials/clientes/authors | ✓ PASS |

### Probe Execution

No se encontraron probes formales (`scripts/*/tests/probe-*.sh`) para esta fase — la verificación de comportamiento se hizo mediante queries directas a Postgres real y una llamada HTTP real a Cloudinary (ver Behavioral Spot-Checks). SKIPPED (no hay probes declarados en PLAN/SUMMARY de esta fase).

### Human Verification Required

#### 1. Decisión sobre los 4 medios irrecuperables — ✓ RESUELTO

**Test:** Evaluar si vale la pena buscar los archivos originales de `image-post1-2.webp`, `image-post2-2.webp`, `image-post3-2.webp`, `image-hero1-2.webp` en otra fuente de backup (no `juan-tech.com`, que sigue `DEPLOYMENT_DISABLED`).
**Expected:** Decisión explícita: buscar backup alternativo o aceptar la pérdida definitivamente.
**Why human:** Decisión de negocio/contenido fuera del alcance de este pipeline. Nota tranquilizadora: verificación independiente confirma que estos 4 assets NO están referenciados por ningún documento migrado — no bloquean ninguna página pública real hoy.
**Resuelto 2026-07-10:** Juan confirmó en conversación: "no veo problema con eso, esas imágenes creo que igual no las vamos a usar" — se acepta la pérdida definitivamente, sin backup alternativo.

#### 2. Limpieza de fixtures de prueba en la base de datos real

**Test:** Revisar si `authors.id=3` ("Test Author X"), `posts.id=1` ("test-post"), `case_studies.id=1` ("test-case-study") y `redirects.id=1` ("/legacy-test-url") deben eliminarse antes de Phase 5.
**Expected:** Decisión explícita de limpieza o de dejarlos (con el riesgo de que aparezcan listados en páginas públicas reales de blog/case-studies/autores en Phase 5).
**Why human:** No es un defecto de fase 4 (son residuos de fases 1-2), pero afecta directamente lo que Phase 5 va a renderizar como "todo el contenido real". Decisión de housekeeping que requiere criterio de Juan, no verificable por grep.

### Gaps Summary

No hay gaps que bloqueen el objetivo de la fase. Las 5 truths derivadas de los criterios de éxito del ROADMAP están verificadas independientemente contra la base de datos Postgres real (no solo contra el reporte narrativo generado por el propio pipeline), incluyendo:

- 100% de los slugs congelados en `URL-INVENTORY.json` (posts, categories, authors) resuelven verbatim en la DB real — verificado con query directa, 0 discrepancias.
- Los medios migrados son subidas reales a Cloudinary (confirmado con HTTP 200 real contra un asset), no copias de URL.
- Las relaciones (post→autor, post→categoría, cliente→logo, testimonio→avatar) resuelven contra IDs reales de Postgres.
- El gap conocido y ya revisado con Juan (4/15 medios irrecuperables por `DEPLOYMENT_DISABLED` del sitio viejo) se confirma real, está bien documentado, y — hallazgo adicional de esta verificación — ninguno de esos 4 medios está referenciado por contenido migrado, por lo que su impacto práctico es menor al inicialmente estimado.
- El draft huérfano omitido y el cierre de la auditoría de Works en 0 (ambos ya revisados con Juan) se confirman consistentes con los datos reales.

Se identificó un hallazgo nuevo no mencionado en el reporte narrativo original: 4 documentos de prueba (fixtures de Phase 1/2, no de esta migración) siguen presentes en la base de datos real y se listarán junto al contenido migrado real si no se limpian antes de Phase 5. Se documenta como ítem de verificación humana, no como gap de esta fase, porque no fue introducido por el pipeline de migración auditado aquí.

### Addendum (2026-07-10, post-verificación): lógica de fallback de heroImage para Phase 5

Juan aclaró en conversación una pieza de contexto de diseño que faltaba en el reporte original: el hecho de que **0 de los 73 posts reales tengan `heroImage`** no es un vacío de datos a rellenar — es el comportamiento original e intencional del sitio viejo.

`JuanPortfolio/src/heros/PostHero/index.tsx` nunca persiste un `heroImage` de reemplazo en la base de datos. Cuando `post.heroImage` es null, el componente calcula en el momento del render (`getFallbackBySlug(slug)`, definido en `JuanPortfolio/src/constants/fallbackImages.ts`) un fallback determinístico — hash simple del slug módulo 53 — contra un pool fijo de 53 imágenes ya subidas a Cloudinary bajo `portfolio/fallback-image-1.avif` … `portfolio/fallback-image-53.avif` (mismo cloud `dmufha3qv` usado por Phase 3/4). Verificado en esta sesión: los 53 assets existen y responden HTTP 200 real en Cloudinary.

**Implicación para Phase 5:** no hay que migrar ni rellenar `heroImage` para estos posts — hay que **replicar esta misma lógica de fallback determinístico por slug** (o una equivalente) en el componente de Post Hero del sitio nuevo, apuntando al mismo pool de 53 imágenes ya existente en Cloudinary. Esto no es un gap de Phase 4; es una nota de diseño heredada correctamente por la migración (los datos migrados reflejan fielmente que el campo estaba vacío en el origen).

---

_Verified: 2026-07-10_
_Verifier: Claude (gsd-verifier)_
_Addendum: Claude (executor), post-verificación, con aclaración directa de Juan_
