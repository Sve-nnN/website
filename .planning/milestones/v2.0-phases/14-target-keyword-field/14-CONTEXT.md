# Phase 14: Target Keyword Field - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning
**Mode:** Infrastructure phase — no user-facing UI, discuss skipped (field exists / populated criteria only)

<domain>
## Phase Boundary

Campo `targetKeyword` (grupo `en`/`es`, texto simple) agregado a las colecciones `pages` y `authors` — editorial, informativo, sin llamadas en vivo a ninguna API externa. Poblado en Home y Author page con los picks ya investigados en `research/keyword-research/KEYWORD-RESEARCH.md`.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Ubicación del campo dentro del schema (grupo simple `targetKeyword: { en, es }`, probablemente en un tab "SEO" si existe uno ya en `pages`/`authors`, o como campo suelto si no)
- Nombre exacto de sub-campos (`en`/`es`, texto simple, sin richText)
- Picks a poblar (ya decididos, no requieren discusión): Home ES = "seo técnico", Home EN = "technical seo consultant", Author ES = "auditoría seo técnico", Author EN = "technical seo specialist" — ver `research/keyword-research/KEYWORD-RESEARCH.md` para el research completo

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@payloadcms/plugin-seo` ya está habilitado en `pages`/`posts`/`case-studies` (no en `authors`) — el campo `targetKeyword` es distinto y adicional a los campos de ese plugin (title/description/OG), no lo reemplaza ni lo toca
- Seed scripts idempotentes vía Payload Local API (patrón ya usado en Phases 4, 10.x, 12, 13)

### Integration Points
- `src/collections/Pages/index.ts` (o donde esté definido el schema de `pages`)
- `src/collections/Authors/index.ts`
- Migración Postgres nueva (push:false)
- Seed script para poblar Home (`pages`) y el author real (`authors`) con los 4 picks

</code_context>

<specifics>
## Specific Ideas

Picks confirmados (research real vía DinoRank, `research/keyword-research/KEYWORD-RESEARCH.md`):
- Home ES: "seo técnico" (260 vol/mes)
- Home EN: "technical seo consultant" (320 vol/mes, competencia muy baja)
- Author ES: "auditoría seo técnico" (90 vol/mes)
- Author EN: "technical seo specialist" (1300 vol/mes avg, CPC $40)

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase, discuss skipped per ROADMAP success criteria (todas técnicas: "campo existe", "poblado con los picks").

</deferred>
