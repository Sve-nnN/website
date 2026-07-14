# Phase 30: Content Humanization — Globals, Core Pages, Services & Geo - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped — autonomous run, Phase 29 safety net closed and approved by Juan)

<domain>
## Phase Boundary

El primer tramo de reescritura real, de menor riesgo/blast-radius (globals y colecciones lean, páginas núcleo, servicios y geo-pages), queda humanizado en la voz de Juan y verificado, validando el toolchain de snapshot/paridad antes de tocar el contenido de mayor volumen (Posts/Case Studies, diferido a Phase 31).

</domain>

<decisions>
## Implementation Decisions

### Safety net ya cerrado (Phase 29)

- `29-FIELD-AUDIT.md`: mapa completo de campos localizados/no-localizados por colección/global — usar como fuente de verdad de qué campos tocar y cuáles NO (proper nouns, campos ya correctos como no-localizados).
- `29-VOICE-PROFILE.md`: brief de voz para el humanizer skill, con `research/voice-sample-juan.md` como fuente primaria/autoritativa — aplicar en ambos locales (ES/EN), no soltar el ritmo/tono al traducir.
- Migraciones de `TestimonialsCarousel.title` y `CaseStudies.services[].service` ya aplicadas — esos campos ahora son localizables sin riesgo.
- `scripts/content-humanization-snapshot.ts` (Plan 29-02): script de snapshot de texto completo, ya probado contra la Neon real — usar ANTES de tocar contenido en esta fase, para tener base de rollback/diff.
- `Llms.llmsTxt`/`Llms.llmsFull`: Juan confirmó NO localizar (excepción intencional, convención de un solo idioma).

### Scope de esta fase (NO tocar SEO/meta)

Reescribir el copy editorial real en la voz de Juan, en ambos locales, para:
1. Globals + colecciones lean: Header, Footer, Llms (salvo llmsTxt/llmsFull, ya excluidos), Authors, Testimonials, Clientes, SpeakingEvents, Categories.
2. Páginas núcleo: Home, Contact, Privacy, Terms.
3. Servicios + geo: índice de Servicios, 4 landings de servicio, 2 geo-pages.

NO tocar: `meta.title`, `meta.description`, `targetKeyword` — estos son campos SEO, fuera de scope de humanización (siguen optimizados como están).

### Verificación obligatoria de esta fase

- Verificación de paridad de locale (ningún campo colapsado/pisado entre es/en) sobre TODO lo tocado en este tramo — reutilizar el patrón de auditoría de Phase 29, no solo confiar en que el humanizer respeta locales.
- Verificar en vivo (curl) que JSON-LD (`BreadcrumbList`/`Person`) y los campos meta de SEO siguen intactos y válidos en las páginas tocadas.

### Claude's Discretion

- Cómo dividir el trabajo en plans (probablemente por grupo de contenido: globals+lean collections / core pages / services+geo, dado el volumen).
- Redacción exacta del copy humanizado — debe calibrarse contra `research/voice-sample-juan.md` (HARD RULE de CLAUDE.md global: todo escrito debe pasar por el humanizer skill antes de entregarse) y `29-VOICE-PROFILE.md`.

</decisions>

<code_context>
## Existing Code Insights

- `.planning/phases/29-content-humanization-safety-net/29-FIELD-AUDIT.md` — mapa de campos, fuente de verdad para esta fase.
- `.planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md` — brief de voz.
- `research/voice-sample-juan.md` — muestra de voz real de Juan, fuente primaria, usar en ambos locales.
- `scripts/content-humanization-snapshot.ts` — script de snapshot de texto completo (Plan 29-02), correr antes de reescribir para tener base de diff/rollback.
- Skill `humanizer` (`~/.claude/skills/humanizer/SKILL.md`) — aplicar a todo el copy antes de escribirlo a la DB, per CLAUDE.md HARD RULE (output humanization).
- Todos los escrituras son vía Payload Local API (`payload.update()`) contra la Neon real — content-only, no schema, per CLAUDE.md Database Safety NO requieren pausa para confirmación (son updates normales de contenido, no destructivos).

</code_context>

<specifics>
## Specific Ideas

- No inventar contenido nuevo — reescribir el copy EXISTENTE con la voz de Juan, mismo significado/información, distinto estilo/ritmo.
- Mantener SEO/meta intacto — solo tocar campos de copy editorial visible.

</specifics>

<deferred>
## Deferred Ideas

- Posts y Case Studies (mayor volumen/visibilidad SEO): diferido explícitamente a Phase 31, corre después de validar el toolchain en este tramo de menor riesgo.

</deferred>
