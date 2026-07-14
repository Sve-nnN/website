---
phase: 30-content-humanization-globals-core-pages-services-geo
plan: 03
subsystem: content
tags: [payload-local-api, lexical, i18n, services, geo-pages, voice-humanization]

requires:
  - phase: 30-01
    provides: Header/Footer globals + lean collections humanized, reapplyIds/upsertPage id-reuse discipline reused
provides:
  - Services index (slug services) hero/service-cards/CTA rewritten in Juan's voice, both locales
  - 4 service landings (seo-technical-audit, seo-consulting, fullstack-development, ai-seo-geo) hero/hook/includes/process/faq/CTA rewritten, both locales
  - 2 geo-pages (seo-tecnico-madrid, seo-tecnico-lima) hero/why-remote/how-I-work/faq/CTA rewritten, both locales
  - voceo->tuteo fix applied across all touched ES copy (CLAUDE.md hard-rule violation found live in seed-phase19/20 copy)
  - em dash removed from every rewritten field, both locales
affects: [30-04 (verification tramo), 31 (blog/case-studies humanization)]

tech-stack:
  added: []
  patterns:
    - "In-place block patching (fetch live layout per locale via findByID, map over it, only override fields inside this plan's scope) instead of full-array rebuild, when live content.layout has grown beyond the shape a prior phase's seed script assumed"

key-files:
  created:
    - scripts/humanize-services-index-and-landings-a.ts
    - scripts/humanize-services-landings-b.ts
    - scripts/humanize-geo-pages.ts
  modified: []

key-decisions:
  - "Live content.layout for the 4 service landings has grown to 10 blocks (serviceScopeCard/clientLogosBlock/testimonialsCarousel/relatedCaseStudyBlock added after Phase 19) and geo-pages to 5 blocks (localProofSection added after Phase 20) — switched from the plan's assumed full-array reapplyIds/upsertPage rebuild to in-place block patching to avoid deleting those blocks"
  - "Fixed voceo (vos/tenés/necesitás/trabajás/usás/podés/sospechás/preferís/querés/mirá) to tuteo (tú/tienes/necesitas/trabajas/usas/puedes/sospechas/prefieres/quieres/mira) across every rewritten ES field — CLAUDE.md's global hard rule 'No voceo nunca' was being violated by the existing Phase 19/20 copy"
  - "Left the known link.url locale-branching bug on the services index unfixed (see Known Issues) — root cause is a schema-level non-localized field shared across the whole site's Link component, out of scope for a content-only script"
  - "Left localProofSection on both geo-pages completely untouched, including Lima's one real stat, since that block is outside this plan's fields-to-rewrite scope and mixes placeholder/real data (T-30-09)"

patterns-established:
  - "In-place block patching for pages.content.layout scripts whose live block count/order has drifted from what an earlier seed script wrote — safer than reapplyIds full-rebuild when new blocks may have been appended by a later phase"

requirements-completed: [VOICE-06]

duration: ~55min
completed: 2026-07-14
---

# Phase 30 Plan 03: Services + Geo-Pages Voice Humanization Summary

Rewrote the Services index, all 4 service landing pages, and both geo-pages in Juan's calibrated voice (both es/en), fixing a real voceo violation and stripping em dashes from every touched field, while discovering and safely working around a structural mismatch between the plan's assumed page layout and what Phase 24/33/34 had since appended to these same pages in production.

## Performance

- **Duration:** ~55 min
- **Tasks:** 3/3 completed
- **Files modified:** 3 (all new scripts)

## Accomplishments

- Rewrote and applied (via Payload Local API against production Neon) the Services index, 4 service landings, and 2 geo-pages copy in both locales
- Found and fixed a real CLAUDE.md hard-rule violation: the existing Phase 19/20 seed copy used voceo ("necesitás", "tenés", "trabajás", "usás", "podés", "sospechás", "preferís", "querés", "mirá") throughout the ES copy on every one of these 7 pages — converted to tuteo across the board
- Removed every em dash from the rewritten fields in both locales (voice-sample-juan.md / 29-VOICE-PROFILE.md hard rule)
- Discovered live `content.layout` for the 4 service landings has grown to 10 blocks and the 2 geo-pages to 5 blocks since Phase 19/20 (serviceScopeCard, clientLogosBlock, testimonialsCarousel, relatedCaseStudyBlock, localProofSection — all added by later phases not reflected in 30-PATTERNS.md's assumed 4-block shape) — adapted the update strategy to in-place block patching instead of the plan's assumed full-array `reapplyIds`/`upsertPage` rebuild, to avoid silently deleting those blocks
- Verified post-write that every block/sub-array id matches its pre-write value and that all out-of-scope blocks (serviceScopeCard, clientLogosBlock, testimonialsCarousel, relatedCaseStudyBlock, localProofSection) are byte-identical to their pre-write state

## Task Commits

1. **Task 1: Humanize services index + seo-technical-audit + seo-consulting** - `7747a98` (feat)
2. **Task 2: Humanize fullstack-development + ai-seo-geo landings** - `3370b50` (feat)
3. **Task 3: Humanize both geo-pages** - `aa2107d` (feat)

## Files Created/Modified

- `scripts/humanize-services-index-and-landings-a.ts` - rebuilds services index (3-block layout, unchanged since Phase 19, safe for full reapplyIds rebuild) + in-place patches seo-technical-audit/seo-consulting (10-block live layout)
- `scripts/humanize-services-landings-b.ts` - in-place patches fullstack-development + ai-seo-geo (10-block live layout, ai-seo-geo also has 2 extra proofLinks columns preserved)
- `scripts/humanize-geo-pages.ts` - in-place patches seo-tecnico-madrid + seo-tecnico-lima (5-block live layout with localProofSection at index 1)

## Before/After Samples

**Services index hero.subtitle (ES)** — em dash removed:
- Before: "...con SEO integrado desde el código — no SEO parchado encima de un sitio que ya lo dificulta."
- After: "...con SEO integrado desde el código, no parchado encima de un sitio que ya juega en contra."

**seo-technical-audit FAQ (ES)** — voceo fixed:
- Before: "¿Qué herramientas usás?" ... "no hace falta contratar a otra persona para la parte técnica" (with em dash before it)
- After: "¿Qué herramientas usas?" ... same content, em dash replaced with a colon clause

**seo-tecnico-madrid FAQ (ES)** — voceo fixed:
- Before: "¿Trabajás físicamente en Madrid?"
- After: "¿Trabajas físicamente en Madrid?"

**seo-consulting CTA (ES)** — voceo fixed:
- Before: "Si tu sitio cambia constantemente y necesitás que alguien vigile el SEO técnico..."
- After: "Si tu sitio cambia constantemente y necesitas que alguien vigile el SEO técnico..."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1/3 - blocking structural mismatch] Live page layouts had grown beyond the plan's assumed 4-block shape**
- **Found during:** pre-write live read of all 7 pages (mandatory per plan's action steps), before Task 1's implementation
- **Issue:** 30-PATTERNS.md and 30-03-PLAN.md's interfaces section assumed `[hero, content, faq, callToAction]` (landings) and `[hero, content, faq, callToAction]` (geo-pages). Live data showed landings now have 10 blocks (serviceScopeCard, extra callToAction, second content block, clientLogosBlock, testimonialsCarousel, relatedCaseStudyBlock inserted by Phase 24+) and geo-pages have 5 blocks (localProofSection inserted by Phase 33/34). Using the plan's literal `buildServiceLayout`/`buildGeoPageLayout` + full-array `reapplyIds`/`upsertPage` rebuild would have silently deleted those 6 (landings) / 1 (geo) extra blocks on every page.
- **Fix:** Replaced full-array rebuild with in-place block patching: each locale's live layout is fetched fresh via `findByID({ locale })`, mapped over, and only blocks inside this plan's scope (hero, both content blocks, faq, callToAction) are overridden — every other block is returned untouched, ids preserved automatically since they're spread from the live object. `reapplyIds` is still run as a defense-in-depth no-op check per block.
- **Files modified:** all 3 scripts in this plan
- **Commits:** `7747a98`, `3370b50`, `aa2107d`
- **Verified:** post-write read confirms serviceScopeCard/clientLogosBlock/testimonialsCarousel/relatedCaseStudyBlock/localProofSection titles and ids are byte-identical to pre-write state on all 6 affected pages.

**2. [Rule 2 - correctness/hard-rule requirement] Voceo throughout existing ES copy**
- **Found during:** voice calibration read of research/voice-sample-juan.md + 29-VOICE-PROFILE.md before writing, then confirmed present in every one of the 7 pages' live ES copy
- **Issue:** CLAUDE.md's global hard rule states "No voceo nunca" and 29-VOICE-PROFILE.md explicitly says "Nunca 'vos'/'tenés'... no negociable en todo el sitio." The existing Phase 19/20 seed copy used voceo forms ("necesitás", "tenés", "trabajás", "usás", "podés", "sospechás", "preferís", "querés", "mirá") across the services index, all 4 landings, and both geo-pages.
- **Fix:** Converted every voceo form found to tuteo in all rewritten ES fields.
- **Files modified:** all 3 scripts
- **Commits:** `7747a98`, `3370b50`, `aa2107d`

**3. [Rule 1 - style/hard-rule requirement] Em dash overuse**
- **Found during:** same voice calibration pass
- **Issue:** research/voice-sample-juan.md and 29-VOICE-PROFILE.md both state Juan's voice never uses em dashes, in either locale. The existing copy had roughly 20+ em dashes across the 7 pages' hero/content/faq/CTA fields (both locales).
- **Fix:** Every em dash in a rewritten field was replaced with a comma, period, or colon, with light grammar adjustment as needed.
- **Files modified:** all 3 scripts
- **Commits:** `7747a98`, `3370b50`, `aa2107d`

### Known Issues (not fixed, out of scope)

**Services index per-service card `link.url` locale-branching is broken at the schema level.** `src/fields/link.ts`'s shared `link()` field only marks `label` as `localized: true`; `url` is a plain non-localized text field. `buildIndexLayout`'s locale ternary (`es -> /servicios/{slug}`, `en -> /en/services/{slug}`) writes a different `url` value per locale, but since the field isn't localized, only the LAST locale processed (`en`, since `LOCALES = ['es', 'en']`) persists server-side for BOTH locales. Confirmed live before this task's writes: every card's `url` was already `/en/services/...` regardless of locale (a pre-existing bug, not introduced by this plan — the exact same locale-ternary code pattern was already present in `seed-phase19-service-pages.ts`). This plan's script reproduces the same locale-ternary logic (per the plan's explicit "do NOT alter the locale-branched URL logic" instruction) rather than attempting a schema fix, since localizing `url` on the shared `link()` field would affect every other consumer of that field (Header nav, CTAs, etc.) — an architectural change requiring Juan's decision, out of scope for a content-only script. Flagging for a dedicated follow-up (either add a `localized: true` override scoped to this specific link usage, or compute the href by locale in the rendering component instead of storing it).

**Services index service-card descriptions and geo-pages' localProofSection real stat (Lima's "18 attendees") were left largely as-is / untouched respectively**, per plan scope — not a defect, just noting these weren't rewritten from scratch since they were already factual/compact or explicitly out of the rewrite-scope fields list.

## Known Stubs

None introduced by this plan. Pre-existing stubs (Madrid's fully-placeholder `localProofSection`, Lima's 2 placeholder stats + placeholder testimonial) were confirmed still present and were deliberately left untouched — see 29-VOICE-PROFILE.md / T-30-09 in this plan's threat model.

## Self-Check: PASSED

- FOUND: scripts/humanize-services-index-and-landings-a.ts
- FOUND: scripts/humanize-services-landings-b.ts
- FOUND: scripts/humanize-geo-pages.ts
- FOUND commit 7747a98
- FOUND commit 3370b50
- FOUND commit aa2107d
- Post-write live read confirms all 7 pages' block/sub-array ids match pre-write values; out-of-scope blocks unchanged; no meta.title/meta.description/targetKeyword field touched (never referenced by any of the 3 scripts)
