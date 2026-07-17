# Phase 31: Historical Diff — Posts/Case Studies Sweep + Full Track B Picture

**Generated:** 2026-07-17 (updated after Task 3's systematic content-quality sweep)
**Tool:** `scripts/diff-humanization-snapshots.ts` (new, Plan 31-16)

This document gives Juan two comparisons before considering Track B (content
humanization, Phases 29-31) closed:

1. **This phase's own before/after** — did the 13 Posts batches + the
   CaseStudies plan + this plan's own Task 2/3 fixes touch exactly what they
   were supposed to, and nothing else?
2. **The full historical picture** — everything that changed across BOTH
   Track B phases (30 + 31) combined, versus the ORIGINAL content as it
   existed before any humanization work began.

In both diffs, **document counts matching exactly, in every collection, is
the hard safety check** — this phase must never create or delete a
document. Both diffs below confirm this.

The "after" snapshot used throughout this document is
`post-sweep-phase31-final-2026-07-17T06:23:56.957Z.json`, captured after
ALL of this plan's work: the post-sweep snapshot (Task 1), the excerpt/
footer locale-parity fixes (Task 2), and the systematic content-quality
sweep fixes — link-fusion, AI-cliché phrases, and title locale-mixups
(Task 3). An earlier snapshot (`post-sweep-phase31-2026-07-17T05:19:29Z`,
captured right after Task 1, before Task 2/3's fixes) is also on disk for
reference but superseded by this final one.

---

## Diff 1 — Phase 31's own before/after

**Before:** `pre-sweep-phase31-2026-07-17T03:57:58.546Z.json` (captured in Plan 31-01, before any of the 13 Posts batches or the CaseStudies plan ran)
**After:** `post-sweep-phase31-final-2026-07-17T06:23:56.957Z.json` (captured at the end of this plan, after all 13 Posts batches + CaseStudies plan + this plan's own locale-parity and content-quality fixes)

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
| global/footer | — | — | — | **2 fields** (`dynamicColumns[0/1].title.es`, Task 2 fix — see below) |
| global/header | — | — | — | 0 fields |
| global/llms | — | — | — | 0 fields |

**Result: exactly the expected scope, plus one small in-scope global fix.**
`posts` (72/72) and `case-studies` (7/7) show content deltas from the
humanization sweep + this plan's cliché/title/fusion fixes. `footer` shows
2 field changes from a Task 2 locale-parity fix (see "Footer dynamicColumns
fix" below) — this global was already inside this verification script's
scope since Phase 30. Every other collection/global this phase did not
touch shows zero field-level changes, and every collection's document count
is identical before and after. Nothing was created or deleted.

---

## Diff 2 — Full Track B history (original pre-humanization vs. now)

**Before (the "VOICE-04 original snapshot"):** `pre-sweep-phase30-2026-07-14T20:38:02.242Z.json` — captured before Phase 30 touched anything, and before any humanization work in milestone v1.6 began. This is the true rollback baseline.
**After:** `post-sweep-phase31-final-2026-07-17T06:23:56.957Z.json` — the final snapshot from this plan, after Phase 30 (globals/core/services/geo) + Phase 31 (posts/case-studies) + this plan's own fixes.

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
| global/footer | — | — | — | 3 fields changed (`legalLinks[2].en` fixed in Phase 30 + `dynamicColumns[0/1].es` fixed in this plan) |
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

### Concrete before/after samples (Task 3 title-mixup fixes)

**`queue-data-structure` (title.en):**
- Before: *"Queue data structure: Conceptos y operaciones fundamentales en prog..."* (fully Spanish, truncated)
- After: *"Queue Data Structure: Core Concepts and Operations in Programming"*

**`headless-cms-seo` (title.es):**
- Before: *"Headless Cms Seo: complete practical guide for 2026"* (fully English, in the ES field)
- After: *"Headless CMS SEO: guía práctica completa para 2026"*

---

## Footer dynamicColumns fix (Task 2, small in-scope locale-parity gap)

`Footer.dynamicColumns[].title` (the "Latest posts"/"Latest case studies"
footer column headers) had ONLY ever had an `en` value since before Phase 30
— the Spanish site's footer rendered these two headers in English. Confirmed
byte-identical across `pre-sweep-phase30`, `pre-sweep-phase31`, and the
original `post-sweep-phase31` snapshots (i.e. genuinely pre-existing, not
introduced by any Posts/CaseStudies batch). Because `footer` has been inside
`verify-locale-parity.ts`'s scope since Phase 30, and the fix was a 2-string
write with zero risk, it was fixed directly: `es: "Últimos artículos"` /
`"Últimos casos de éxito"` added, `en` values and array ids preserved
exactly (same id-reuse discipline as every prior Phase 30 global write).

---

## Task 3: Systematic content-quality sweep (Juan's explicit request)

Beyond the plan's original verification scope, a full programmatic sweep of
all 72 Posts (both locales) + 7 Case Studies (`clientContext`/`conclusion`,
both locales) was run for 4 bug classes real recovery agents had
independently found and fixed in individual batches during execution —
since each agent only checked their own batch, the same bug classes could
exist undetected elsewhere. Findings and fixes:

### 1. Link-boundary space-fusion (text immediately touching a link node)

**1 instance found and fixed:** `posts/topic-clusters-seo` (en, `content`) —
"This [internal linking strategy]keeps the content ecosystem..." (missing
space after the link) → "...strategy keeps the content ecosystem...". Fixed
by inserting the missing space into the adjacent text node; link text and
all other structure untouched. A second, full re-scan across all 72 posts +
7 case-studies after the fix found zero remaining instances.

### 2. Residual AI-cliché phrases

**59 post/locale fields found and fixed** (exact marker list: "es
esencial", "es fundamental", "cabe destacar", "crucial", "leverage",
"seamless", "robust", "no solo X sino también Y" / "not only X but also
Y" — the same list Juan specified and prior batches 01/05/08/11 used).
Fixed via grammar-safe, case-preserving word/phrase substitutions applied
directly to the Lexical text-node leaves (never touching `link`/`table`
node structure) plus `title`/`excerpt` plain-text fields: "es esencial" →
"es clave", "es fundamental" → "es la base", "crucial" → "clave"/"key",
"leverage" → "use", "seamless" → "smooth", "robust" → "solid", the
"no solo/not only...sino también/but also" hedge construction → a plain
"y también"/"and also" joiner. A post-fix re-scan confirmed zero remaining
cliché markers across all 72 posts + 7 case-studies, both locales.

Two sweep hits (`estrategia-topic-clusters` es, `binary-search-tree` es)
turned out to be **false positives** from the sweep script's own marker
regex lacking word boundaries (`/es esencial/i` matched inside "ingredientes
**es**enciales", not a real "es esencial" phrase) — confirmed by checking
actual context, and by the fix script's word-boundary-safe regex correctly
finding nothing to change in those two fields. No content was altered
there; documented for completeness, not a real bug.

### 3. Locale mixups (wrong-language content in a locale field)

**14 title mixups found and fixed** — the systematic scan targeted body
prose first (0 flagged there, once locale-mixup and cliché markers were
checked), then a targeted title-only re-scan (titles being short,
high-SEO-value fields) found:

- **4 posts with a Spanish subtitle sitting in `title.en`:**
  `binary-search-tree`, `dynamic-programming`, `queue-data-structure`,
  `structured-data-seo` — rewritten with a proper English title/subtitle.
- **9 posts with an untranslated English "complete practical guide [for
  2026]" template phrase sitting in `title.es`:** `headless-cms-seo`,
  `payloadcms-tutorial` (typo "Guía Complete"), `heap-data-structure`,
  `merge-sort-python`, `space-complexity`, `time-complexity`,
  `payload-cms-guide`, `technical-seo-checklist`, `dynamic-programming`
  (both locales affected) — translated to "guía práctica completa [para
  2026]".
- **1 post (`tech-seo-guide`, id 53) with a truncated ES title** ending
  mid-sentence in "...") — rewritten as a complete, clean title.
- **1 post (`technical-seo-guide`, id 9 — the one confirmed missing all
  English content, see below) had `title.es` = "Guia de technical seo
  guide"**, a malformed title mixing raw English words into the Spanish
  field with a missing accent — rewritten as "Guía de SEO técnico:
  fundamentos para desarrolladores".

All 13+1 fixes preserved each post's existing `slug` explicitly (the
`slugField` hook only regenerates from title when its own value is
falsy/omitted, so passing the unchanged slug in the same `update()` call
guarantees no URL/SEO-equity change). Confirmed via
`scripts/verify-live-jsonld-meta.mjs`'s live sweep (below) that every
`<title>` still resolves and every route still 200s.

**Note on heuristic scope:** a broad stopword-ratio heuristic across full
post bodies (English/Spanish stopword density) found 0 flagged fields —
the whole-document-language mixup pattern found in earlier batches (e.g.
Plan 31-06's "post 30 EN-in-Spanish" incident) does not currently exist
anywhere in the live corpus. The 14 title-level findings above were caught
by a separate, more targeted title-only scan (short fields, easy to spot
untranslated boilerplate) — worth keeping in mind if a future audit wants
to extend the same targeted-field technique to `meta.title`/`meta.description`.

### 4. Literal LLM-refusal strings

**0 instances found** across all 72 posts + 7 case-studies, both locales.

---

## Additional finding: pre-existing unpublished drafts (not fixed, flagged for Juan)

While extending `verify-live-jsonld-meta.mjs`'s dynamic route discovery via
the live `/sitemap.xml`, only 66 of 72 Posts and 1 of 7 Case Studies
appeared in the sitemap. Investigation confirmed **6 Posts and 6 Case
Studies are in Payload's `draft` status** (not `published`), so they are
correctly excluded from the public sitemap and don't render on public
routes. Cross-checked against `pre-sweep-phase30`/`pre-sweep-phase31`
snapshots: **this is 100% pre-existing, unchanged since before Phase 30
even started** — not a regression from any Posts/CaseStudies humanization
batch. Not fixed (publishing content is an editorial decision outside this
verification plan's scope), but flagged here since it directly explains why
the live JSON-LD/meta sweep below covers 134 dynamic blog/case-studies
routes rather than the ~162 the plan estimated (72×2 + 7×2 assuming all
published):

**Draft Posts (6):** `nextjs-portfolio` (45), `nextjs-server-components`
(44), `payloadcms-seo` (43), `payloadcms-tutorial` (42),
`payloadcms-vs-strapi` (41), `typescript-best-practices` (40)

**Draft Case Studies (6):** `pittsburgh-criminal-defense-legal-content-seo`
(20), `fabricante-baldosa-hidraulica-seo-espana` (19),
`immigration-law-atlanta-seo` (18),
`talleres-costura-miami-lanzamiento-seo-local` (17),
`urologo-seo-local-salud-santiago-rd` (16),
`edtech-financiera-infantil-crecimiento-organico-seo` (15)

All 6 draft Posts' content and all 6 draft Case Studies' `clientContext`/
`conclusion` WERE still humanized by this phase's batches (Local API reads
by id, independent of publish status) — so when/if Juan publishes them,
they'll already be in-voice.

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
rather than rushed (this plan confirmed the same boundary — only fixed the
missing/mixed-up TITLE strings for these posts where already short and
safe, never authored new English body prose). Recommend a dedicated
follow-up plan if bilingual parity for these 8 posts is required.

Additionally, ~50 of 160 live-verified routes have an empty
`meta.description` — confirmed pre-existing (same gap Phase 30 already
flagged in 30-04-SUMMARY.md as out of this track's body/content scope, not
meta). Reported for visibility, not treated as blocking per the plan's
explicit informational-only guidance for this category.

---

## Conclusion

Both diffs confirm: zero documents created or deleted anywhere in the
database across the full Track B span; only the collections each phase was
scoped to touch show content deltas; Posts and Case Studies (this phase's
own scope) are 100% rewritten (72/72, 7/7), plus a Task 3 content-quality
pass fixed 1 link-fusion bug, 59 residual AI-cliché fields, and 14 title
locale-mixups — all now confirmed at zero via a final re-scan. The 8-post
missing-English-locale gap and the 12 pre-existing unpublished drafts are
real, pre-existing, and now formally tracked here rather than silently left
undiscovered.
