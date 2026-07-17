# Phase 31: Historical Diff — Posts/Case Studies Sweep + Full Track B Picture

**Generated:** 2026-07-17
**Tool:** `scripts/diff-humanization-snapshots.ts` (new, Plan 31-16)

This document gives Juan two comparisons before considering Track B (content
humanization, Phases 29-31) closed:

1. **This phase's own before/after** — did the 13 Posts batches + the
   CaseStudies plan touch exactly what they were supposed to, and nothing
   else?
2. **The full historical picture** — everything that changed across BOTH
   Track B phases (30 + 31) combined, versus the ORIGINAL content as it
   existed before any humanization work began.

In both diffs, **document counts matching exactly, in every collection, is
the hard safety check** — this phase must never create or delete a
document. Both diffs below confirm this.

---

## Diff 1 — Phase 31's own before/after

**Before:** `pre-sweep-phase31-2026-07-17T03:57:58.546Z.json` (captured in Plan 31-01, before any of the 13 Posts batches or the CaseStudies plan ran)
**After:** `post-sweep-phase31-2026-07-17T05:19:29.346Z.json` (captured in this plan, after all 13 Posts batches + CaseStudies plan completed)

| Collection | Docs before | Docs after | Count match | Docs changed |
|---|---|---|---|---|
| pages | 12 | 12 | yes | 0 / 12 |
| **posts** | 72 | 72 | yes | **72 / 72** |
| authors | 1 | 1 | yes | 0 / 1 |
| **case-studies** | 7 | 7 | yes | **7 / 7** |
| categories | 5 | 5 | yes | 0 / 5 |
| testimonials | 1 | 1 | yes | 0 / 1 |
| clientes | 28 | 28 | yes | 0 / 28 |
| speaking-events | 2 | 2 | yes | 0 / 2 |
| websites | 6 | 6 | yes | 0 / 6 |
| global/footer | — | — | — | 0 fields |
| global/header | — | — | — | 0 fields |
| global/llms | — | — | — | 0 fields |

**Result: exactly the expected scope.** Only `posts` (72/72) and
`case-studies` (7/7) show content deltas — every other collection and
global this phase did not touch shows zero field-level changes, and every
collection's document count is identical before and after. Nothing was
created or deleted.

---

## Diff 2 — Full Track B history (original pre-humanization vs. now)

**Before (the "VOICE-04 original snapshot"):** `pre-sweep-phase30-2026-07-14T20:38:02.242Z.json` — captured before Phase 30 touched anything, and before any humanization work in milestone v1.6 began. This is the true rollback baseline.
**After:** `post-sweep-phase31-2026-07-17T05:19:29.346Z.json` — the fresh snapshot from this plan, after both Phase 30 (globals/core/services/geo) and Phase 31 (posts/case-studies) completed.

| Collection | Docs before | Docs after | Count match | Docs changed |
|---|---|---|---|---|
| pages | 12 | 12 | yes | 12 / 12 (Phase 30) |
| posts | 72 | 72 | yes | 72 / 72 (Phase 31) |
| authors | 1 | 1 | yes | 1 / 1 (Phase 30) |
| case-studies | 7 | 7 | yes | 7 / 7 (Phase 31) |
| categories | 5 | 5 | yes | 5 / 5 (Phase 30) |
| testimonials | 1 | 1 | yes | 1 / 1 (Phase 30) |
| clientes | 28 | 28 | yes | 0 / 28 (out of Track B scope, Phase 40 content) |
| speaking-events | 2 | 2 | yes | 2 / 2 (Phase 30) |
| websites | 6 | 6 | yes | 0 / 6 (out of Track B scope, Phase 40 content) |
| global/footer | — | — | — | 1 field changed (Phase 30) |
| global/header | — | — | — | 2 fields changed (Phase 30) |
| global/llms | — | — | — | 0 fields |

**Result: every touched collection matches Track B's known scope exactly.**
`clientes` and `websites` (Phase 40 content, unrelated to Track B) show zero
changes, confirming this diff cleanly isolates Track B's actual footprint.
Document counts are identical across the whole milestone span — no doc was
created or deleted by either phase.

### Concrete before/after samples (Posts)

**`technical-seo-checklist` (es, `content`):**
- Before: *"Technical Seo Checklist: complete practical guide. La optimización técnica para motores de búsqueda..."*
- After: *"Checklist de SEO técnico: guía práctica completa. La optimización técnica para buscadores es..."*

**`structured-data-seo` (es, `content`):**
- Before: *"En el mundo digital actual, la competencia por la atención de los usuarios es feroz. Implementar..."*
- After: *"La competencia por la atención del usuario en buscadores es cada vez más dura, y los datos..."*

**`seo-on-page-guia` (es, `content`):**
- Before: *"Seo ON Page: guía completa y estrategia práctica. El SEO On Page es fundamental para mejorar..."*
- After: *"SEO On Page: guía completa y estrategia práctica. El SEO On Page es la base para mejorar el..."*

### Concrete before/after samples (Case Studies)

**`migracion-ecommerce-nextjs-seo-tecnico` (es, `clientContext`):**
- Before: *"Una tienda online con más de 4,000 SKUs necesitaba migrar de una plantilla de comercio gen..."*
- After: *"Trabajé con una tienda online de más de 4,000 SKUs que necesitaba migrar de una plantilla..."*

**`edtech-financiera-infantil-crecimiento-organico-seo` (es, `clientContext`):**
- Before: *"Esta plataforma de educación financiera está dirigida a padres de niños de 8 a 12 años en..."*
- After: *"Esta plataforma de educación financiera está dirigida a padres de niños de 8 a 12 años en..."* (minor tightening, same facts)

---

## Known content gaps confirmed pre-existing (not introduced by this phase)

During Task 1's diff, a real bug was found and fixed in the diff tool
itself (and in `verify-locale-parity.ts`, see Task 2): when a document was
authored with an entire locale completely missing (not `null`, the key is
simply absent from the `locale: 'all'` response), the original localized-pair
detector required exactly 2 keys (`es` and `en`) and silently skipped these
fields, undercounting changed docs (an early buggy run of this diff tool
reported only 64/72 posts changed instead of 72/72 for exactly this reason).
Fixed to accept 1-or-2-key `{es}`/`{en}`/`{es,en}` shapes.

This surfaced (and confirms, cross-referenced against 31-02-SUMMARY.md and
31-11-SUMMARY.md) 4 posts with a pre-existing, NOT-introduced-by-this-phase
missing-English-locale gap at the **entire document** level (title, excerpt,
content all missing `en` since original authoring/migration):

- **Post 9** (`technical-seo-guide`) — confirmed in Plan 31-02
- **Post 56** (`tablas-hash`) — confirmed in Plan 31-11
- **Post 57** (`que-es-css`) — confirmed in Plan 31-11
- **Post 58** (`mejores-cursos-seo-espanol`) — confirmed in Plan 31-11

And 4 more posts confirmed missing `en` at the document level during this
diff pass (same pattern, not previously called out by name in a batch
summary but consistent with the same pre-existing gap):

- **Posts 35, 36, 37, 38** (part of Plan 31-07's batch, ids 33-38) — `es`
  content was rewritten by that batch; `en` was never populated for these 4
  and predates Phase 31 entirely (confirmed via the `pre-sweep-phase31`
  snapshot, taken before Plan 31-07 ran, already showing no `en` key).

**These are translation-authoring gaps, not voice-humanization bugs** — per
31-02/31-11's own explicit Rule-4 scoping decision, authoring brand-new
English translations from scratch is architecturally different work from a
voice-calibration rewrite of existing prose, and was correctly deferred
rather than rushed. Recommend a dedicated follow-up plan if bilingual parity
for these 8 posts is required.

---

## Conclusion

Both diffs confirm: zero documents created or deleted anywhere in the
database across the full Track B span; only the collections each phase was
scoped to touch show content deltas; Posts and Case Studies (this phase's
own scope) are 100% rewritten (72/72, 7/7). The 8-post missing-English-locale
gap is real, pre-existing, and now formally tracked here rather than
silently left undiscovered.
