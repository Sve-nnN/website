# Phase 31: Content Humanization — Posts & Case Studies + Verificación Final - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped — autonomous run, Phase 29/30 closed and approved by Juan)

<domain>
## Phase Boundary

El tramo de mayor volumen/visibilidad SEO (Posts y Case Studies) queda humanizado, cerrando formalmente VOICE-06/07, y el milestone v1.6 cierra con una verificación conjunta final de ambos tracks (Track A motion + Track B contenido) contra el baseline pre-milestone.

</domain>

<decisions>
## Implementation Decisions

### Inputs ya cerrados de Phases 29/30

- `29-VOICE-PROFILE.md` + `research/voice-sample-juan.md`: fuente de voz autoritativa, aplicar en ambos locales — mismo criterio ya usado en 30-01/02/03.
- `scripts/verify-locale-parity.ts` y `scripts/verify-live-jsonld-meta.mjs` (Plan 30-04): scripts reutilizables, extender para cubrir posts/case-studies en vez de reescribir desde cero.
- `scripts/content-humanization-snapshot.ts`: ya tiene el par `pre-sweep-phase30`/`post-sweep-phase30` — esta fase necesita su propio par pre/post para Posts+Case Studies, y un diff final contra el snapshot de VOICE-04 (pre-humanize original, antes de Phase 30) para el resumen histórico completo que success criterion 2 pide.
- Bug conocido corregido en Phase 30, NO repetir: reusar ids de bloques/sub-arrays entre escrituras de locale (Payload reemplaza el array completo en `update`).
- Regla dura confirmada en Phase 30 (encontrada en el copy real de servicios): CERO voceo, siempre tuteo. Cero em dash. Aplicar el mismo escaneo/corrección en Posts/Case Studies si aparece.
- Meta.description: ya arreglado en Pages (quick fix post-Phase 30, 2026-07-16/17) — Posts y Case Studies pueden tener el mismo gap, sujeto a auditoría de esta fase si aplica, pero el scope formal de esta fase es el body/contenido editorial, no meta (mismo boundary que Phase 30).

### Scope de esta fase

1. Reescribir el body rich-text de TODOS los Posts y Case Studies en la voz de Juan, ambos locales, sin tocar SEO/meta.
2. Snapshot post-sweep de este tramo, diffado contra el snapshot pre-humanize de VOICE-04 (el más antiguo, pre-Phase-30) — disponible para que Juan lo lea antes de cerrar el track.
3. Correr `reindex-search.ts` de nuevo después del sweep completo — el contenido reescrito debe reflejarse en `/search`.
4. Barrido en vivo (curl, ambos locales) sobre TODAS las rutas tocadas por Track B (Phase 30 + esta fase) + validación JSON-LD — cero structured data roto.
5. Gate final de Lighthouse/CWV sobre rutas representativas de AMBOS tracks (motion de Phase 26-28 + contenido reescrito de Phase 29-31) — sin regresión vs. baseline pre-milestone (Phase 32's baseline script, o el más antiguo disponible antes de v1.6).

### Volumen (dato real, no asumido)

Confirmado en Phase 37 research: la colección `case-studies` real tiene 7 documentos poblados (ids 14-20). Confirmar el conteo real de `posts` durante research de esta fase (visto en fases anteriores: ~72 posts) — no asumir un número redondo, el pattern-mapper/planner debe consultar la Neon real.

### Claude's Discretion

- Cómo dividir el trabajo dado el volumen (72 posts + 7 case studies) — probablemente requiere batching/loop, no un script de 1 doc por vez como Phase 30.
- Estrategia exacta de reescritura en volumen (¿todo de una corrida, o por lotes con checkpoints de progreso?) — dado el volumen, preferir progreso verificable/reanudable sobre un solo script monolítico.

</decisions>

<code_context>
## Existing Code Insights

- `scripts/content-humanization-snapshot.ts`, `scripts/verify-locale-parity.ts`, `scripts/verify-live-jsonld-meta.mjs` — reutilizables de Phase 30.
- `scripts/reindex-search.ts` — ya existe en el repo, correr después del sweep.
- `scripts/lighthouse-mobile.mjs` — runner de Lighthouse existente (Phase 11), reusar para el gate final.
- Phase 32's regression baseline (si existe, verificar) — puede servir de referencia "pre-milestone" para el gate de CWV final, o usar el snapshot/lighthouse run más antiguo disponible antes de v1.6 si Phase 32 no aplica cronológicamente (Phase 32 es v1.7, corrió DESPUÉS de v1.6 en la numeración real del repo — verificar orden real de ejecución vs. numeración antes de asumir qué baseline usar).

</code_context>

<specifics>
## Specific Ideas

- Ningún voceo, ningún em dash — regla dura confirmada durante Phase 30, verificar que no reaparezca en Posts/Case Studies.
- No inventar contenido nuevo — reescribir el copy EXISTENTE con la voz de Juan.

</specifics>

<deferred>
## Deferred Ideas

None — esta es la última fase del milestone v1.6.

</deferred>
