---
phase: 04-migraci-n-mongo-postgres
verified: 2026-07-10T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
gaps: []
deferred: []
notes_for_next_phase:
  - "4 medios (image-post1-2.webp, image-post2-2.webp, image-post3-2.webp, image-hero1-2.webp) quedaron sin migrar por DEPLOYMENT_DISABLED del sitio viejo -- Juan confirmó explícitamente en esta conversación aceptar la pérdida definitiva, sin buscar backup alternativo. No están referenciados por ningún documento migrado."
  - "4 documentos de prueba de fases 1-2 (authors.id=3 'Test Author X', posts.id=1 'test-post', case_studies.id=1 'test-case-study', redirects.id=1 '/legacy-test-url') fueron borrados de la DB real por decisión explícita de Juan en esta conversación, antes del inicio de Phase 5."
---

# Phase 4: Migración Mongo → Postgres Verification Report

**Phase Goal:** Todo el contenido real del sitio actual (posts, case studies, authors, testimonials, works/clientes, medios) existe en el nuevo backend Postgres con URLs idénticas a las actuales y relaciones preservadas, listo para renderizarse en las páginas públicas.
**Verified:** 2026-07-10
**Status:** passed
**Re-verification:** No — verificación inicial

## Goal Achievement

### Observable Truths

Verificado independientemente contra la base de datos Postgres real (Neon), no solo contra `verification-summary.json` (que es generado por el mismo pipeline que se está auditando).

| # | Truth (Success Criterion del ROADMAP) | Status | Evidence |
|---|---|---|---|
| 1 | Existe un inventario congelado de URLs vivas del sitio actual (crawleado desde sitemap/GSC) que sirve como contrato de verificación | ✓ VERIFIED (con nota de metodología) | `.planning/phases/04-migraci-n-mongo-postgres/URL-INVENTORY.json` existe, 152 URLs, `frozenAt: 2026-07-10T01:52:03.980Z`. **Nota:** no fue un crawl HTTP en vivo — el sitio viejo (`juan-tech.com`) devolvía HTTP 402/`DEPLOYMENT_DISABLED` para todas las rutas incluido `/sitemap.xml` al momento del freeze, documentado explícitamente en el propio archivo. El inventario se reconstruyó leyendo la lógica exacta de `sitemap.ts` + query directa al dump real de Mongo — método honesto y verificable, no un crawl real, pero equivalente en rigor dado el bloqueo externo. Verificado independientemente: 63 slugs únicos de posts, 5 de categories, 1 de authors en el inventario — el 100% resuelve verbatim contra la DB real (ver truth 3). |
| 2 | Script ETL standalone puebla Postgres: Media → Authors/Categories → Posts/CaseStudies/Testimonials/Clientes en ese orden, vía Local API (no SQL crudo); Works auditado, no migrado 1:1 | ✓ VERIFIED | 7 scripts en `scripts/migrate/steps/01-*` a `07-*` numerados en el orden mandatado. Cada uno usa `getPayload({config})` + `payload.create/update/find` (Local API), confirmado por lectura directa de código — cero queries SQL crudas. `src/collections/` no contiene colección `works`. `works-audit-report.json` es `[]` (0 documentos reales en Works, confirmado por checkpoint de Juan: "Perfecto, confirmo" en `04-07-SUMMARY.md`). |
| 3 | Cada documento migrado conserva su slug/URL verbatim del original | ✓ VERIFIED | Consulta directa a Postgres: 63/63 slugs de posts del inventario congelado resuelven verbatim en la tabla `posts` (0 faltantes). 5/5 categories y 1/1 authors resuelven verbatim (0 faltantes). Comparación hecha independientemente contra `URL-INVENTORY.json`, no contra el reporte narrativo. |
| 4 | Relaciones entre documentos migrados resuelven vía remap-table ObjectId→Postgres-ID | ✓ VERIFIED | `scripts/migrate/data/remap-table.json` tiene claves `media` (11), `authors` (1), `categories` (5), `testimonials` (1), `clientes` (6), `posts` (72). Consulta directa: `posts_rels` tiene 78 filas `categories_id` no nulas; `posts.author_id` no nulo en los 72 posts reales (0 nulos excluyendo el fixture de prueba); `clientes.logo_id` resuelve a IDs reales de media migrada (11-17) en los 6 clientes; `testimonials_locales` tiene `role`/`testimonial` poblados para ambos locales. |
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
| MIGR-05 | 04-02, 04-05, 04-06 | Medios re-subidos a Cloudinary + richText apuntando a nuevas URLs | ✓ SATISFIED (con gap conocido de 4/15 medios, ya aceptado) | 11 medios confirmados en Cloudinary real; gap de 4 medios documentado y sin referencias en contenido migrado |
| MIGR-06 | 04-08 | Redirects 301 para deltas intencionales | ✓ SATISFIED | 0 deltas reales → 0 redirects necesarios, código idempotente presente y no ejercitado por falta de casos |

No hay requisitos huérfanos: los 6 IDs de REQUIREMENTS.md mapeados a Phase 4 aparecen todos en al menos un plan.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `scripts/migrate/steps/03-testimonials-clientes.ts` | 64, 112-113 | `PLACEHOLDER = '(sin especificar)'` usado como fallback explícito para `role`/`company` faltantes | ℹ️ Info | Documentado como manejo intencional de datos incompletos del origen (must-have de 04-04: "reporta como pendiente de decisión, no lo omite en silencio"), no un placeholder de implementación pendiente. No aplica en la práctica — el único testimonial real tenía ambos campos completos. |
| `scripts/migrate/steps/02-authors-categories.ts` | 66-70, 132 | Comentarios explicando colisión de slug con fixtures de Phase 2 (`seed-phase2.ts`) | ℹ️ Info | Explicación de diseño (upsert-by-slug), no un TODO/FIXME pendiente. |
| N/A (dato en Postgres, no en código) | — | Documentos de prueba residuales de fases anteriores en la DB real: `authors.id=3` ("Test Author X"), `posts.id=1` ("test-post"), `case_studies.id=1` ("test-case-study"), `redirects.id=1` ("/legacy-test-url") — todos creados 2026-07-09, antes de que corriera la migración de fase 4 (2026-07-10) | ⚠️ Warning | No es un defecto del pipeline de migración de fase 4 (son fixtures de Phase 1/2 para validar el esquema), pero contaminan la base de datos que Phase 5 va a renderizar públicamente. Ver "Notes for Phase 5" abajo. |

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

Ninguno. Los 5 truths derivadas de los criterios de éxito del ROADMAP se verificaron de forma programática contra la base de datos Postgres real y contra Cloudinary real (ver Behavioral Spot-Checks). No quedan comportamientos visuales, de UX, o de integración externa pendientes de validación humana dentro del alcance de esta fase.

### Notes for Phase 5 (no bloqueantes, no gaps de esta fase)

**1. Los 4 medios irrecuperables** (ya revisado y aceptado con Juan, fuera de alcance de esta fase)
`image-post1-2.webp`, `image-post2-2.webp`, `image-post3-2.webp`, `image-hero1-2.webp` no se pudieron migrar porque `juan-tech.com` devuelve `DEPLOYMENT_DISABLED` (HTTP 402) y no hay fallback de disco. Verificación independiente de esta auditoría confirma que ninguno de estos 4 medios está referenciado por ningún documento migrado (posts, testimonials, clientes, authors) — son assets huérfanos, no bloquean ninguna página pública real. Sin acción pendiente para el cierre de fase 4.

**2. Fixtures de prueba residuales en la base de datos real** (hallazgo nuevo de esta verificación, no mencionado en el reporte narrativo original)
`authors.id=3` ("Test Author X"), `posts.id=1` ("test-post"), `case_studies.id=1` ("test-case-study") y `redirects.id=1` ("/legacy-test-url") fueron creados el 2026-07-09 (antes de que corriera la migración de fase 4 el 2026-07-10) por fixtures de validación de esquema de Phase 1/2 — no son producto del pipeline de migración auditado aquí y no afectan ninguno de los 5 criterios de éxito de esta fase. Se recomienda decidir su limpieza antes de Phase 5, ya que de lo contrario aparecerán junto al contenido real migrado en los listados públicos de blog/case-studies/autores.

### Gaps Summary

No hay gaps que bloqueen el objetivo de la fase. Las 5 truths derivadas de los criterios de éxito del ROADMAP están verificadas independientemente contra la base de datos Postgres real (no solo contra el reporte narrativo generado por el propio pipeline), incluyendo:

- 100% de los slugs congelados en `URL-INVENTORY.json` (posts, categories, authors) resuelven verbatim en la DB real — verificado con query directa, 0 discrepancias.
- Los medios migrados son subidas reales a Cloudinary (confirmado con HTTP 200 real contra un asset), no copias de URL.
- Las relaciones (post→autor, post→categoría, cliente→logo, testimonio→avatar) resuelven contra IDs reales de Postgres.
- El gap conocido y ya revisado con Juan (4/15 medios irrecuperables por `DEPLOYMENT_DISABLED` del sitio viejo) se confirma real, está bien documentado, y — hallazgo adicional de esta verificación — ninguno de esos 4 medios está referenciado por contenido migrado, por lo que su impacto práctico es menor al inicialmente estimado.
- El draft huérfano omitido y el cierre de la auditoría de Works en 0 (ambos ya revisados con Juan) se confirman consistentes con los datos reales.

Se identificó un hallazgo nuevo no mencionado en el reporte narrativo original: 4 documentos de prueba (fixtures de Phase 1/2, no de esta migración) siguen presentes en la base de datos real y se listarán junto al contenido migrado real si no se limpian antes de Phase 5. Se documenta como nota no bloqueante para Phase 5, no como gap de esta fase, porque no fue introducido por el pipeline de migración auditado aquí.

---

_Verified: 2026-07-10_
_Verifier: Claude (gsd-verifier)_
