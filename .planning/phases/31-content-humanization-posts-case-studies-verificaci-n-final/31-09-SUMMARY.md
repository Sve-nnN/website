---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 09
subsystem: content
tags: [payload, lexical, richtext, seo, i18n, humanization]

requires:
  - phase: 29-content-humanization-safety-net
    provides: research/voice-sample-juan.md and 29-VOICE-PROFILE.md (authoritative voice calibration)
provides:
  - "Posts ids 45,46,47,48,49 (nextjs-portfolio, headless-cms-seo, xml-sitemap-automation, ssr-vs-csr-seo, schema-markup-guide) rewritten in Juan's voice, both locales"
  - "scripts/humanize-posts-batch-08.ts — reusable run-grouped tree-rewrite pattern for future Lexical richText humanization batches"
affects: [31-16 (post-sweep snapshot/verification), 31-17 (milestone close)]

tech-stack:
  added: []
  patterns:
    - "Run-grouped Lexical tree rewrite: group consecutive text-node children of heading/paragraph/listitem into 'runs' (a run ends at any non-text sibling, e.g. a link), rewrite the whole run as one unit instead of per-leaf — avoids breaking grammar around SEO-keyword bold-insertion artifacts and retained link anchors"
    - "Positional REWRITES[id][locale] array (index-aligned to a tree walk) instead of original-text-keyed lookup — avoids transcription-mismatch risk from retyping long paragraphs as object keys"

key-files:
  created:
    - scripts/humanize-posts-batch-08.ts
  modified: []

key-decisions:
  - "Left SEO-load-bearing H2 headings and short list-item/spec labels unchanged (not rewritten) to protect existing keyword targeting — voice rewrite focused on paragraph/listitem prose, per the site's core value that SEO must not regress"
  - "Left paragraph/heading text immediately adjacent to a retained link untouched when rewriting only one side risked breaking grammar against the unchanged anchor text; rewrote the far side when it started with unambiguous closing punctuation instead"
  - "Post 49 (schema-markup-guide) es locale content was found entirely in English (a genuine pre-existing locale bug, not just wrong-voice) — translated and humanized into real Spanish rather than leaving English body copy on the Spanish page, treated as Rule 1 (broken behavior)"

requirements-completed: [VOICE-06]

coverage:
  - id: D1
    description: "Posts ids 45,46,47,48,49 content field rewritten in Juan's voice, es and en locales, zero em dash / zero voceo in es, code-block and table nodes byte-identical pre/post write"
    requirement: VOICE-06
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-08.ts (2nd run: 5/5 already done, zero em-dash/voceo findings, exit 0)"
        status: pass
    human_judgment: false

duration: ~75min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 09: Humanize Posts batch 8 (ids 45-49) Summary

**Rewrote 5 Posts' richText content in Juan's calibrated voice across both locales via a checkpointed, idempotent Local API script — including a real translation fix for a post whose Spanish locale was silently rendering English prose.**

## Performance

- **Duration:** ~75 min
- **Completed:** 2026-07-17T04:48:22Z
- **Tasks:** 1 (single-task plan)
- **Files modified:** 1 (`scripts/humanize-posts-batch-08.ts`), plus 5 Posts documents in production Neon (content field, both locales)

## Accomplishments

- `scripts/humanize-posts-batch-08.ts` created: fetches ids [45,46,47,48,49] via `locale: 'all'`, walks each locale's `content` Lexical tree, rewrites prose in-place, writes back per locale, reads back to self-check (structural byte-identity of every `block`/`table` node, zero em dash, zero voceo in `es`), and only then marks the id `'done'` in a gitignored checkpoint file.
- All 5 posts' `content` field rewritten in both `es` and `en`, calibrated against `research/voice-sample-juan.md` and `29-VOICE-PROFILE.md` — mixed sentence rhythm, direct address, "así sea X, Y o Z" / "whether it's X, Y, or Z" connector used naturally in enumerations, AI-tell vocabulary and constructions removed (copula avoidance, negative parallelism, rule-of-three padding, generic conclusions, filler transitions).
- Every code-block (`type: 'block'`) and `table` node across all 5 posts confirmed byte-identical pre/post write by the script's own self-check (structural node map compared by path + deep JSON equality).
- Live re-run of the script confirms idempotency: `5/5 already done. ... Zero em-dash/voceo findings across all 5 posts. Done.` (exit 0).
- Discovered and fixed a real pre-existing bug: post 49's (`schema-markup-guide`) `es` locale `content` field contained full English prose (a different English draft than the `en` locale, never translated) — this script translated and humanized it into real Spanish instead of leaving an English body on a Spanish-locale page.

## Task Commits

1. **Task 1: Humanize Posts batch 8 (ids 45,46,47,48,49)** - `174c2d5` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `scripts/humanize-posts-batch-08.ts` - Idempotent, checkpointed rewrite script for this batch's 5 posts, both locales; also the source of truth for exactly which prose runs were rewritten vs. left untouched (see `REWRITES` map and its inline documentation).
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-08.json` (generated, gitignored) - checkpoint log, all 5 ids `'done'`.
- Production Neon: `posts.content` (jsonb, richText) for ids 45, 46, 47, 48, 49, both `es` and `en` locale columns.

## Before/After Samples

**Post 45 (nextjs-portfolio), es, opening paragraph:**
- Before: "Next.js se ha convertido en una herramienta esencial para quienes desean crear portafolios impactantes y funcionales. Este framework, basado en React, ofrece características que optimizan tanto el rendimiento como la visibilidad en motores de búsqueda, lo que lo hace ideal para desarrolladores y creativos que buscan destacar su trabajo."
- After: "Next.js se volvió la opción por defecto para armar portafolios rápidos y bien indexados. Es un framework construido sobre React, y da control real sobre rendimiento y SEO, dos cosas que cualquier desarrollador o diseñador necesita si quiere que su trabajo se vea y se encuentre."

**Post 45 (nextjs-portfolio), en, opening paragraph:**
- Before: "Building a personal portfolio has never been easier with Next.js. This powerful framework offers an array of features designed to optimize performance and enhance user experience."
- After: "Building a personal portfolio got a lot easier once Next.js became the default choice. It's a React framework built around performance and a better user experience, not bolted-on afterthoughts."

**Post 48 (ssr-vs-csr-seo), es — toned down an overwrought "analyst persona" voice found in the live content:**
- Before: "Como analista técnico, te explicaré por qué el Client-Side Rendering (CSR) debe restringirse a entidades cerradas... Mi principio arquitectónico es inamovible..."
- After: "Te explico por qué el Client-Side Rendering (CSR) conviene reservarlo para plataformas cerradas... Para mí esto no se negocia..."

**Post 49 (schema-markup-guide), es — translation fix (was English, now real Spanish):**
- Before (found live, `es` locale): "Schema markup is a critical component of modern SEO, enabling search engines to better understand and present your content..."
- After: "El schema markup es una pieza clave del SEO moderno: ayuda a los buscadores a entender y mostrar mejor tu contenido..."

## Decisions Made

- **Run-grouped tree rewrite instead of per-leaf rewrite.** The plan's `<interfaces>` example rewrites each `text` leaf independently. Live content in this batch is heavily interspersed with SEO-keyword bold insertions (a single sentence split into 3+ text-node siblings around a bolded keyword phrase, or around an inline link). Rewriting each fragment independently risked producing grammatically broken sentences once concatenated. Instead, the script groups consecutive `text` children of a heading/paragraph/listitem into "runs" (a run ends at any non-text sibling — `link` or otherwise), and rewrites the whole run as one coherent unit, or leaves it untouched. This is still fully compliant with "never touch links/tables/blocks, only rewrite prose text nodes in place" — links are never entered or modified, and node count/type structure is preserved.
- **Left SEO-load-bearing headings unchanged.** Given this project's stated core value ("Si el rendimiento o el SEO fallan, el sitio no cumple su propósito"), H2 headings that carry keyword targeting were left byte-identical rather than rewritten for voice, to avoid an unintended SEO regression. The voice rewrite focused on body paragraphs and list items, which is where the actual "AI slop" (copula avoidance, "no solo... sino también", filler, generic conclusions) lived in the source content.
- **Left link-adjacent prefix fragments untouched.** When a paragraph is split by an inline link (e.g. "...capacidad para realizar [Server-Side Rendering] (SSR) y..."), the text immediately *before* the link was left unchanged (rewriting it risked producing an ungrammatical lead-in to the unchanged anchor text). Text immediately *after* a link, when it started with unambiguous closing punctuation (a period, comma, or closing parenthesis), was rewritten while preserving that leading punctuation exactly.
- **Translated post 49's `es` locale instead of just re-voicing it.** During authoring it became clear post 49's `content.es` was full English prose (different wording from `en`, but still English, not Spanish) — a real content-correctness bug for a bilingual site, not a voice issue. Per CLAUDE.md's rule that additive/non-destructive content writes proceed without pause-for-confirmation, this was translated and humanized directly rather than left broken or escalated. Facts, numbers (20-30% CTR, 800+ schema types, 2011 founding date), and tool/proper names were preserved exactly; only prose was translated. Schema.org type-name headings (`Organization Schema`, `Product Schema`, etc.) were deliberately left in English in both locales, matching standard technical-SEO convention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ESM `__dirname` reference**
- **Found during:** Task 1, first script execution attempt
- **Issue:** The plan's `<interfaces>` checkpoint-pattern example uses `path.resolve(__dirname, ...)`, but this project's `package.json` has `"type": "module"` — `__dirname` is not defined in ESM scope, causing an immediate `ReferenceError` on run.
- **Fix:** Added the standard ESM shim (`const __dirname = path.dirname(fileURLToPath(import.meta.url))`), matching the pattern already used by sibling batch scripts (`humanize-posts-batch-01.ts` through `-10.ts`) that hit the same issue in this same wave.
- **Files modified:** `scripts/humanize-posts-batch-08.ts`
- **Verification:** Script ran to completion after the fix.
- **Committed in:** `174c2d5` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed tree-walk entry point (wrapper vs. `.root`)**
- **Found during:** Task 1, first successful script execution
- **Issue:** `payload.update`/`findByID` return `content` as `{ root: { type: 'root', children: [...] } }`. The first implementation called the rewrite/structural-collection walkers on that outer wrapper object directly, which has no `.type`/`.children` of its own — the walk silently produced zero runs (`FATAL: id=45 locale=es produced 0 runs but REWRITES has 50`), which the script's own safety check caught before any write happened.
- **Fix:** Walk/collect against `content.<locale>.root` instead of the wrapper, and re-wrap as `{ root: rewritten }` before `payload.update`.
- **Files modified:** `scripts/humanize-posts-batch-08.ts`
- **Verification:** Re-run produced `wrote N run(s), N matched` for every id/locale, and the read-back self-check passed for all 5 ids.
- **Committed in:** `174c2d5` (Task 1 commit)

**3. [Rule 1 - Bug] Fixed 4 array-length/positional-alignment errors in the authored `REWRITES` data**
- **Found during:** Pre-execution verification (before any production write), via a standalone length/alignment check against the live document's actual run count per post/locale
- **Issue:** While hand-authoring the `REWRITES[id][locale]` arrays (positional, one entry per tree-walk "run"), 4 arrays ended up with the wrong length relative to the live document's actual run count — id 45 `es` (off by 1), id 46 `es` (off by 2) and `en` (off by 4), id 48 `en` (off by 2), id 49 `en` (off by 1) — due to manual miscounting of `null` placeholders while transcribing the classification into code.
- **Fix:** Before running against production, generated the ground-truth run list for every post/locale directly from the live document (the same grouping algorithm the runtime script uses) and diffed it index-by-index against each authored array to find and correct every misalignment (inserting/removing `null` entries at the exact divergence points, and for id 46 `es`, fully reconstructing the array from the 20 authored rewrite strings mapped back onto their correct target indices). Verified all 9 arrays hit their expected length and that every non-null rewrite landed on the correct original paragraph before running the script.
- **Files modified:** `scripts/humanize-posts-batch-08.ts` (the `REWRITES` object)
- **Verification:** All 9 `REWRITES[id][locale]` arrays matched the live document's run count exactly; the script's own runtime guard (`counter.i !== expected` → abort) provided a second, independent confirmation during actual execution — no id triggered it.
- **Committed in:** `174c2d5` (Task 1 commit)

**4. [Rule 2 - Missing Critical] Translated post 49's `es` locale content (was found entirely in English)**
- **Found during:** Task 1, content reading/authoring pass (reading the live `es` content before writing rewrites)
- **Issue:** Post 49 (`schema-markup-guide`) `content.es` was full English prose site-wide — a genuine locale-correctness bug on a project whose explicit scope is a bilingual (EN+ES) site, not just an "AI voice" issue. A pure voice-rewrite pass would have left an English-language body on the Spanish-locale page.
- **Fix:** Translated the full `es` locale content into natural Spanish while simultaneously applying the same voice/anti-AI-pattern humanization already applied elsewhere in this batch. All facts, statistics, and proper/tool names (Schema.org, JSON-LD, Google Rich Results Test, etc.) preserved exactly; Schema.org type-name headings kept in English (standard convention in both locales).
- **Files modified:** `scripts/humanize-posts-batch-08.ts` (the `REWRITES[49].es` array)
- **Verification:** Live read-back after write confirms `content.es` for post 49 is genuine Spanish prose; self-check (em dash / voceo) passed on the new Spanish text.
- **Committed in:** `174c2d5` (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (1 blocking, 1 bug, 1 bug/pre-write-verification, 1 missing-critical)
**Impact on plan:** All four were necessary for the script to run correctly or for the deliverable to actually meet the plan's intent (a working, correctly-targeted humanization of these 5 posts' real content). No scope creep — no content was added beyond translating/rephrasing what already existed.

## Known Stubs / Deferred Items

- **Post 47 (`xml-sitemap-automation`) `en` locale is missing its article body.** Only a "See Also" related-links section exists in `content.en` (1 Lexical node, a heading + 3 list items) — the actual article prose was never authored for this locale (pre-existing, confirmed via live read before this plan touched anything). This is out of scope per the plan's boundary ("rewrite existing prose... never invent new claims") — inventing an ~24-paragraph English article was not attempted. Logged here for a future content-authoring plan; `31-16`'s post-sweep snapshot/verification should flag this post's `en` route as substantially shorter than its `es` counterpart if it audits word counts.
- **Post 45's "Ver también" (See Also) list has 2 of 3 entries with no hyperlink** (plain duplicate-title text instead of a `link` node) in the `es` locale — a pre-existing content-data issue, left untouched (not in scope for a prose/voice rewrite).

## Issues Encountered

None beyond the auto-fixed items documented above — all were caught and resolved before or during the single production run, with no partial/inconsistent state left in the database (the script never marks an id `'done'` until its own read-back self-check passes).

## Next Phase Readiness

- Batch 8 of 13 in Phase 31's Posts sweep is complete; ids 45-49 need no further action from this plan.
- `31-16` (post-sweep snapshot/final verification) should include ids 45-49 in its scope and should specifically re-confirm the post 49 `es`→Spanish fix and flag post 47's missing `en` body for a follow-up content plan.
- No blockers for sibling batch plans (31-02 through 31-08, 31-10 through 31-14) — this plan touched only ids 45-49, disjoint from all other batches per the plan's design.

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*

## Self-Check: PASSED

- FOUND: `scripts/humanize-posts-batch-08.ts`
- FOUND: `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-08.json` (checkpoint: `{"45":"done","46":"done","47":"done","48":"done","49":"done"}`)
- FOUND: commit `174c2d5` in `git log --oneline --all`
