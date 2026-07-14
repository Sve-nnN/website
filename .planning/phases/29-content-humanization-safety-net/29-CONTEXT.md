# Phase 29: Content Humanization Safety Net - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped — autonomous run, Juan explicitly triggered `--from 29` giving go-ahead for Track B)

<domain>
## Phase Boundary

Toda la herramienta de seguridad (auditoría de campos, snapshot, fixes de schema bloqueantes, perfil de voz) existe y está verificada antes de reescribir una sola palabra de contenido real — prerequisito duro, no una fase paralela opcional, dado el historial real del proyecto (3 bugs repetidos de campos no-localizados pisados, 1 incidente real de pérdida de datos el 2026-07-12 recuperado vía Neon point-in-time restore).

</domain>

<decisions>
## Implementation Decisions

### HARD GATE — migraciones que tocan columnas existentes con datos

Dos de los 5 success criteria de esta fase (#2 `TestimonialsCarousel.title` → `localized: true`, #3 `CaseStudies.services[].service`) requieren migraciones que tocan columnas EXISTENTES con datos reales. Per CLAUDE.md "Database Safety":

- Estas NO son escrituras aditivas — requieren backfill explícito de ambos locales antes de cualquier `DROP`.
- El plan/executor debe generar la migración, LEERLA por completo, y presentársela a Juan para aprobación NOMBRADA antes de aplicarla contra la Neon real.
- Referencia del incidente: 2026-07-12, una migración similar (`CallToAction.richText` localize) hizo `DROP COLUMN` sin backfill correcto y borró el copy del CTA de Home — recuperado vía point-in-time restore. NO repetir ese patrón.
- El plan de esta fase debe tener la task de migración marcada como blocking/checkpoint humano explícito — no autónoma.

### Resto de la fase (auditoría, snapshot, perfil de voz)

Estas son de solo lectura / creación de artefactos nuevos (documentos de research, snapshots de contenido, perfil de voz) — no tocan schema ni datos existentes, así que sí son autónomas.

### Claude's Discretion

- Estructura exacta del documento de auditoría pre-vuelo (qué formato, qué herramienta usar para recorrer todas las colecciones/globals).
- Formato del snapshot completo de texto real (JSON, markdown, ambos).
- Redacción exacta del perfil de voz — usar research de Arianna Lupi/Aleyda Solis ya referenciado en ROADMAP.md como fuente, más el patrón de bio de Juan ya usado en Phase 37 (español neutro, sin voceo, profesional-directo, primera persona con credenciales directas).

</decisions>

<code_context>
## Existing Code Insights

- Incidente de referencia: 2026-07-12, migración `20260712_202954_phase19_calltoaction_localized.ts` — localizó `CallToAction.richText` sin backfill, hizo DROP COLUMN, perdió el copy del CTA de Home. El archivo de migración ya fue corregido con el patrón correcto de backfill — revisar como ejemplo de "cómo SÍ hacerlo" antes de generar la migración de `TestimonialsCarousel.title`.
- `scripts/content-freeze-snapshot.ts` ya existe en el repo (visto en Phase 37/40 research) — puede ser un punto de partida o patrón a extender para el snapshot completo de texto real que pide esta fase (VOICE-04), en vez de crear uno desde cero.
- Skill `humanizer` (`~/.claude/skills/humanizer/SKILL.md`) — el perfil de voz de esta fase es el brief de entrada para esa skill en fases 30/31. No reescribir contenido en esta fase, solo producir el perfil.

</code_context>

<specifics>
## Specific Ideas

- Perfil de voz: español neutro, sin voceo, profesional-directo, primera persona con reclamos de credenciales directos (estilo Arianna Lupi), framing de CTA colaborativo — ya especificado en el success criterion 5, no inventar desde cero.
- El bug de campos no-localizados pisados ya ocurrió 3 veces en v1.5 — la auditoría pre-vuelo debe ser exhaustiva (cada colección, cada global, cada campo de texto público) para no repetirlo una cuarta vez en Track B.

</specifics>

<deferred>
## Deferred Ideas

None — el scope de reescritura real de contenido está deliberadamente diferido a Phases 30/31, esta fase es solo la red de seguridad.

</deferred>
