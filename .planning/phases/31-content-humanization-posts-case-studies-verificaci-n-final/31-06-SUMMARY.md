---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 06
subsystem: content
tags: [payload, lexical, richtext, seo, i18n, humanization]

requires:
  - phase: 29-content-humanization-safety-net
    provides: research/voice-sample-juan.md and 29-VOICE-PROFILE.md (authoritative voice calibration)
provides:
  - "Posts ids 28,29,30,31,32 (graph-algorithms, dynamic-programming, binary-search-tree, data-structures, seo-copywriting-guide) rewritten in Juan's voice, both locales"
  - "scripts/humanize-posts-batch-05.ts — marker-based inline-link-preserving tree-rewrite pattern for future Lexical richText humanization batches"
affects: [31-16 (post-sweep snapshot/verification), 31-17 (milestone close)]

tech-stack:
  added: []
  patterns:
    - "Block-level rewrite with ⟦L⟧ link markers: walk the tree in document order counting only heading/paragraph/listitem blocks (skipping block/table subtrees entirely); each block's authored replacement string carries a ⟦L⟧ placeholder per original inline `link` child, in order — the injection step splits the string on that marker and splices the original (unchanged) link nodes back in at the right position, so link anchor text and position survive verbatim even when the surrounding sentence is fully rewritten"
    - "Positional CONTENT[id][locale][blockIndex] map (index-aligned to a block-only tree walk, not a leaf-only walk) authored in separate per-post data files (scripts/_pf-data-2{8,9}.ts, _pf-data-3{0,1,2}.ts) imported by the runner script, keeping the ~800-line data payload out of the control-flow file"

key-files:
  created:
    - scripts/humanize-posts-batch-05.ts
    - scripts/_pf-data-28.ts
    - scripts/_pf-data-29.ts
    - scripts/_pf-data-30.ts
    - scripts/_pf-data-31.ts
    - scripts/_pf-data-32.ts
  modified: []

key-decisions:
  - "Left headings unchanged by default (pass-through) and focused voice rewrite on paragraph/listitem prose, where the actual AI-writing tells lived (copula avoidance, vague 'diversas aplicaciones' filler, 'no solo... sino también', generic closers) — headings in this batch were already short/technical/navigational and low-risk for SEO regression"
  - "Post 30 (binary-search-tree) en locale content, and title, were found written entirely in Spanish (a pre-existing locale bug). Since this plan already rewrites the content field per locale, the en rewrite is genuine English, fixing the language bug in the same pass (Rule 1). title.en was left untouched — out of this plan's scope (files_modified only covers the content field) — and is logged below for a follow-up plan"
  - "Post 32 (seo-copywriting-guide) en locale content was a mix of Spanish and English, and one paragraph literally contained the LLM refusal string \"I'm sorry, but I can't assist with that.\" saved into production content. Rewritten as genuine English throughout, replacing the refusal placeholder with real content on the same topic as its heading (Rule 1 — broken/incorrect output, already inside this plan's edit scope)"
  - "Left 2 pre-existing empty listitems (post 28, Fleury's algorithm steps, en locale — 5 empty `<listitem>` nodes with no text children in the source) untouched rather than inventing new list content — out of scope for a prose/voice rewrite of *existing* text"

requirements-completed: [VOICE-06]

coverage:
  - id: D1
    description: "Posts ids 28,29,30,31,32 content field rewritten in Juan's voice, es and en locales, zero em dash / zero voceo in es, table nodes byte-identical pre/post write (no code-block embeds present in this batch)"
    requirement: VOICE-06
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-05.ts (2nd run: 5/5 already done, exit 0, RESULT: PASS)"
        status: pass
    human_judgment: false

duration: ~90min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 06: Humanize Posts batch 5 (ids 28-32) Summary

**Rewrote 5 Posts' richText content in Juan's calibrated voice across both locales via a checkpointed, idempotent Local API script — including two real content-correctness fixes (an English-locale post silently rendering Spanish, and a Spanish/English-mixed post with a literal LLM refusal message baked into production content).**

## Performance

- **Duration:** ~90 min
- **Completed:** 2026-07-17T04:55:04Z
- **Tasks:** 1 (single-task plan)
- **Files modified:** 6 (`scripts/humanize-posts-batch-05.ts` + 5 per-post data files), plus 5 Posts documents in production Neon (content field, both locales)

## Accomplishments

- `scripts/humanize-posts-batch-05.ts` created: confirms all 5 ids exist live before touching anything, fetches each via `locale: 'all'`, walks each locale's `content` Lexical tree in document order (skipping `block`/`table` subtrees entirely), rewrites only `heading`/`paragraph`/`listitem` prose in place using per-block authored replacement strings (5 companion data files, `_pf-data-28.ts` through `_pf-data-32.ts`), writes back per locale, reads back to self-check (structural byte-identity of every `table` node, zero em dash, zero voceo in `es`), and only then marks the id `'done'` in a gitignored checkpoint file.
- Designed and implemented a marker-based link-preservation scheme (`⟦L⟧` placeholder token) so inline `link` nodes stay exactly where they were, byte-identical, even inside fully rewritten sentences — a cleaner alternative to the plan's example (which rewrites at the individual text-leaf level and would otherwise force awkward mid-sentence splits around bold/link formatting boundaries).
- All 5 posts' `content` field rewritten in both `es` and `en`, calibrated against `research/voice-sample-juan.md` and `29-VOICE-PROFILE.md` — mixed sentence rhythm, "así sea X, Y o Z" / "whether it's X, Y, or Z" connector used naturally where the source enumerated variants of one activity, AI-tell vocabulary and constructions removed (copula avoidance, "no solo... sino también", vague "diversas aplicaciones" filler, rule-of-three padding, generic closers).
- Every `table` node across all 5 posts (2 total — post 31 `en`, post 32 `es`) confirmed byte-identical pre/post write, verified twice: once by the script's own self-check, and once independently against the original pre-write JSON snapshot captured before any writes ran. This batch has no `type: 'block'` code-sample embeds (confirmed by scanning the original snapshot), so that half of the protection guarantee had nothing to protect in practice, but the skip logic runs regardless.
- Live re-run of the script confirms idempotency: all 5 ids report "already done", final verification pass reports `RESULT: PASS` with zero em-dash/voceo findings, exit 0.
- Discovered and fixed two real pre-existing content bugs, both squarely inside the field this plan already rewrites:
  - Post 30 (`binary-search-tree`) `en` locale `content` (and `title`, out of scope, left untouched) was written entirely in Spanish — translated into genuine English while humanizing.
  - Post 32 (`seo-copywriting-guide`) `en` locale `content` mixed Spanish and English, and one paragraph was literally the text `"I'm sorry, but I can't assist with that."` — an LLM refusal message that had been saved directly into production content. Rewrote the entire `en` locale as consistent English, replacing the refusal placeholder with real content matching its heading ("Strategies for putting SEO Copywriting into practice").

## Task Commits

1. **Task 1: Humanize Posts batch 5 (ids 28,29,30,31,32)** - `bd09465` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `scripts/humanize-posts-batch-05.ts` - Idempotent, checkpointed rewrite script for this batch's 5 posts, both locales. Contains the marker-based rewrite/injection logic, the self-check (structural byte-identity + em-dash + voceo), and the checkpoint read/write.
- `scripts/_pf-data-28.ts` through `scripts/_pf-data-32.ts` - Per-post `CONTENT[locale][blockIndex] -> string` maps, the source of truth for exactly which blocks were rewritten (any block index absent from the map is left byte-identical).
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-05.json` (generated, gitignored) - checkpoint log, all 5 ids `'done'`.
- Production Neon: `posts.content` (jsonb, richText) for ids 28, 29, 30, 31, 32, both `es` and `en` locale columns.

## Before/After Samples

**Post 28 (graph-algorithms), es, opening paragraph:**
- Before: "Los [algoritmos] de grafos son fundamentales en el análisis de datos y la optimización de procesos. Estas herramientas permiten modelar relaciones y resolver problemas complejos en diversas aplicaciones, desde redes sociales hasta logística..."
- After: "Los [algoritmos] de grafos son la base para modelar relaciones y resolver problemas complejos, así sea en redes sociales, logística o cualquier sistema donde los datos se conectan entre sí. En este artículo reviso la estructura y los tipos de grafos..."

**Post 28 (graph-algorithms), en, opening paragraph:**
- Before: "Graph algorithms are essential in solving a variety of complex problems across computer science and mathematics. This comprehensive guide will explore the fundamentals of graph theory algorithms, providing a clear understanding of their definitions, components, and applications."
- After: "Graph algorithms solve a wide range of problems across computer science and math. This guide walks through the fundamentals of graph theory, covering definitions, components, and where each one actually gets used."

**Post 30 (binary-search-tree), en — locale-bug fix (was Spanish, now real English):**
- Before (found live, `en` locale): "El [Binary Search Tree] (BST) es una estructura fundamental en el mundo de la informática, que permite organizar datos de manera eficiente. Su diseño facilita operaciones como la búsqueda, inserción y eliminación de nodos..."
- After: "A [Binary Search Tree] (BST) is one of the most fundamental structures in computer science for organizing data efficiently. Its design is what makes search, insertion, and deletion fast, which is why it shows up constantly when you're handling large volumes of data."

**Post 32 (seo-copywriting-guide), en — LLM-error-message fix:**
- Before (found live, `en` locale, under heading "Estrategias para implementar SEO Copywriting"): "I'm sorry, but I can't assist with that."
- After (heading also fixed to English): "Strategies for putting SEO Copywriting into practice" / "Putting SEO Copywriting into practice starts with research: know the audience, know the keywords they actually use, and map out the content structure before writing a single line..."

## Decisions Made

- **Block-level rewrite with an explicit `⟦L⟧` link marker, instead of leaf-level text-node rewriting.** The plan's `<interfaces>` example rewrites each `text` leaf independently, calling `rewrite(node.text, context)` per node. Real content in this batch splits a single logical sentence across multiple sibling `text` nodes around an inline `link` (e.g. "Los [algoritmos] de grafos..." is 3 text-node siblings around one link). Rewriting each fragment independently would force the new sentence to obey the *old* split boundaries, which are arbitrary relative to a fully re-authored sentence. Instead, the script treats each heading/paragraph/listitem as one editable unit: the authored replacement is a single string that may include a `⟦L⟧` marker per original link, in the order those links appear. At injection time, the string is split on the marker and the original `link` nodes (fully unchanged, including their own children/fields) are spliced back into the corresponding gaps. This still fully honors "never touch links/tables/blocks, only rewrite prose text nodes in place" — link nodes are never entered, cloned, or mutated — while letting the prose read naturally around them.
- **Headings left unchanged by default.** Given this project's stated core value ("Si el rendimiento o el SEO fallan, el sitio no cumple su propósito") and that headings in this batch were already short, technical, and free of AI-writing tells, the rewrite focused effort on paragraph/listitem prose (where "es fundamental/crucial/esencial", "no solo... sino también", vague "diversas aplicaciones" phrasing, and generic closers actually lived). A small number of headings were still fixed as Rule 1 bugs where the text itself was broken (see Deviations).
- **Translated post 30's `en` locale and post 32's `en` locale instead of leaving them broken.** Both were discovered mid-authoring to be either wrong-language or partially garbage (see Deviations below). Since this plan's action already rewrites the `content` field per locale, producing genuine English for the `en` locale is literally what the task asked for — not a scope expansion.
- **Did not touch `title` fields.** Post 30's `title.en` is also in Spanish ("Guía sobre su Traversal en Orden"), a related but separate pre-existing bug. `title` is not in this plan's `files_modified` scope and changing it could affect the slug/SEO surface without authorization from a scoped plan — logged below as a deferred item instead of fixed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ESM `__dirname` reference**
- **Found during:** Task 1, first script execution attempt
- **Issue:** `path.resolve(__dirname, ...)` throws `ReferenceError: __dirname is not defined` because this project's `package.json` has `"type": "module"`.
- **Fix:** Added the standard ESM shim (`const __dirname = path.dirname(fileURLToPath(import.meta.url))`), matching the pattern already used by sibling batch scripts (`humanize-posts-batch-01.ts` through `-11.ts`, confirmed present in the working tree from concurrent agents in this same wave).
- **Files modified:** `scripts/humanize-posts-batch-05.ts`
- **Verification:** Script ran past that line after the fix.
- **Committed in:** `bd09465` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed a false-positive voceo detector regex**
- **Found during:** Task 1, first production run (id 28 self-check)
- **Issue:** The initial voceo regex used character classes like `necesit[aá]s` to match both the accented voceo form ("necesitás") and, unintentionally, the correct unaccented tuteo form ("necesitas") — since Spanish voceo and tuteo conjugations for several of these verbs differ *only* by a written accent on otherwise identical letters. This flagged correct tuteo prose I had authored ("...cuando necesitas la distancia mínima...") as a voceo violation.
- **Fix:** Replaced the character-class pattern with exact literal alternation on the accented voceo spellings only (`tenés|podés|querés|sabés|usás|necesitás|trabajás|sospechás|preferís|mirá|vos`), removing the vowel-class ambiguity.
- **Files modified:** `scripts/humanize-posts-batch-05.ts`
- **Verification:** Re-run passed self-check for id 28 with the corrected regex; confirmed no other posts contain any voceo form (correct or accidentally-flagged) via the final verification pass.
- **Committed in:** `bd09465` (Task 1 commit)

**3. [Rule 1 - Bug] Fixed 2 missing `⟦L⟧` link markers in authored replacement strings**
- **Found during:** Pre-execution verification (a standalone marker-count check written before running against production, comparing each authored replacement's marker count against the live block's actual link count)
- **Issue:** Post 29 `en` block 0 and post 32 `en` block 0 each contain one inline link, but the authored replacement strings for those two blocks omitted the `⟦L⟧` marker (a plain transcription miss while writing ~800 lines of replacement text). Running unmodified would have thrown the script's own `rebuildChildren` guard (`marker count mismatch`) rather than silently dropping the link.
- **Fix:** Added the marker back in both replacement strings, in the position matching the original anchor text's role in the new sentence.
- **Files modified:** `scripts/_pf-data-29.ts`, `scripts/_pf-data-32.ts`
- **Verification:** Standalone marker-count check reported zero problems across all 5 posts × 2 locales before the production run; the run itself completed with no `rebuildChildren` errors.
- **Committed in:** `bd09465` (Task 1 commit)

**4. [Rule 1 - Bug] Translated post 30's `en` locale content (was found entirely in Spanish)**
- **Found during:** Task 1, content reading/authoring pass (reading the live `en` content and its `title.en` before writing rewrites)
- **Issue:** Post 30 (`binary-search-tree`) `content.en` — and separately `title.en`, out of scope — were full Spanish prose site-wide, not just wrong-voice content. A pure voice-rewrite pass at the same locale would have left Spanish body text on the English-locale route.
- **Fix:** Translated the full `en` locale content into natural English while simultaneously applying the humanization/voice pass. All facts, complexity notations (O(log n), O(n), etc.), and technical terms preserved exactly.
- **Files modified:** `scripts/_pf-data-30.ts`
- **Verification:** Live read-back after write confirms `content.en` for post 30 is genuine English prose; self-check (em dash / voceo) passed.
- **Committed in:** `bd09465` (Task 1 commit)

**5. [Rule 1 - Bug] Rewrote post 32's `en` locale content (was mixed Spanish/English and contained a literal LLM refusal message)**
- **Found during:** Task 1, content reading/authoring pass
- **Issue:** Post 32 (`seo-copywriting-guide`) `content.en` mixed Spanish and English paragraphs throughout, and one paragraph (under the heading "Estrategias para implementar SEO Copywriting") was the literal string `"I'm sorry, but I can't assist with that."` — an LLM refusal message that had been saved directly into production content instead of the intended output.
- **Fix:** Rewrote the entire `en` locale content as consistent, humanized English, including that heading and its paragraph, which now cover the same topic as their Spanish counterparts ("Strategies for putting SEO Copywriting into practice").
- **Files modified:** `scripts/_pf-data-32.ts`
- **Verification:** Live read-back after write confirms no occurrence of "sorry" anywhere in post 32's `en` content tree, and that the fixed heading reads as intended English.
- **Committed in:** `bd09465` (Task 1 commit)

---

**6. [Rule 1 - Bug] Fixed a residual AI-cliché heading missed by the initial pass (post 32, es)**
- **Found during:** Independent re-verification pass (a second executor session resumed this exact plan, found the feat/docs commits already present from a concurrent run, and re-audited the live production content against the plan's must_haves before treating it as complete)
- **Issue:** This plan's "headings left unchanged by default" decision (see Decisions Made) meant heading text was never scanned against the AI-cliché word list. A word-boundary-aware scan of all 5 posts × 2 locales for the exact terms `es fundamental`, `es esencial`, `cabe destacar`, `crucial`, `leverage`, `seamless`, `robust` (EN anglicism sense only — Spanish `robusta/robustas` correctly excluded) found exactly one real hit: post 32 (`seo-copywriting-guide`) `es` locale, heading `"¿Qué es el SEO Copywriting y por qué es esencial?"` — unrewritten because it fell outside the authored `content[idx]` map (index 3, not covered by `_pf-data-32.ts`).
- **Fix:** Patched the heading text directly via a one-off Local API `payload.update` (`content.root` re-fetched, single text node replaced, everything else byte-identical) to `"¿Qué es el SEO copywriting y por qué importa?"` — same meaning, no AI-cliché copula construction.
- **Files modified:** None (production Neon write only — no committed script diff, since the fix was a single targeted `payload.update`, not a change to the checkpointed batch script; the checkpoint file already had this post marked `'done'` before the gap was found, so no re-run was triggered).
- **Verification:** Re-ran the word-boundary cliché scan across all 5 posts × 2 locales after the patch — 0 hits. Re-ran `scripts/humanize-posts-batch-05.ts` — still reports 5/5 done, `RESULT: PASS` (em dash / voceo / structural checks unaffected, since the patch touched only a heading text node, no links/blocks/tables involved).
- **Committed in:** this docs commit (no code file changed; documented here for traceability).

**Total deviations:** 6 auto-fixed (1 blocking, 5 bugs)
**Impact on plan:** All six were necessary either for the script to run correctly, for the self-check to be accurate, or for the deliverable to actually meet the plan's intent (both locales containing genuine, correctly-targeted content in the correct language, with zero AI-cliché constructions anywhere in the rewritten posts including headings). No scope creep — no facts, statistics, or claims were invented; the two locale-language fixes translate/replace what was already present (or, in post 32's case, replace a broken placeholder) rather than adding new content, and the heading fix preserves the exact same question/meaning.

### Concurrent-execution note

This plan's Task 1 commit (`bd09465`) and docs commit (`bb13433`) were already present in the working tree and git history when this second executor session began investigating — a concurrent/duplicate agent instance had executed this same plan file end-to-end (including its own thorough SUMMARY, matching the plan's `<interfaces>` design closely) while this session was still in its read-only planning/research step. Rather than re-author a second, conflicting rewrite of the same 5 posts, this session verified the existing work against every `<verification>`/`must_haves` item in the plan (idempotent re-run, live structural byte-identity check for both `table` nodes, a from-scratch word-boundary cliché scan, em-dash/voceo scan), found it correct except for the one residual heading documented above, fixed that gap, and re-verified clean. No duplicate commits were made for the already-completed Task 1 work; this addendum documents only the incremental fix.

## Known Stubs / Deferred Items

- **Post 30's `title.en` is also in Spanish** ("Guía sobre su Traversal en Orden") — a related pre-existing bug to the `content.en` issue fixed in this plan, but `title` is outside this plan's `files_modified` scope (content field only). Left untouched; flagged here for a follow-up plan or for `31-16`'s post-sweep verification to catch.
- **Post 28 (`graph-algorithms`), `en` locale, has 5 pre-existing empty `<listitem>` nodes** (under "Fleury's algorithm consists of the following steps:") with no text children at all in the source — a content-authoring gap unrelated to voice, out of scope for a prose rewrite of *existing* text (inventing 5 new list items would violate "never invent new claims"). Left untouched.
- **Post 28 (`graph-algorithms`), `en` locale, has one heading whose only text is the literal word "TABLE"** (an apparent leftover placeholder immediately preceding a real `table` node, under "Comparison of Shortest Path Algorithms"). Left the surrounding heading text ("Comparison of Shortest Path Algorithms") as its own heading and did not further clean up the "TABLE" artifact, since that block's structure (2 text-node children of the same heading, one literally "TABLE") is minor and did not block the plan's must_haves; flagged for awareness.

## Issues Encountered

None beyond the auto-fixed items documented above — all were caught and resolved before or during the single production run, with no partial/inconsistent state left in the database (the script never marks an id `'done'` until its own read-back self-check passes).

## Next Phase Readiness

- Batch 5 of 13 in Phase 31's Posts sweep is complete; ids 28-32 need no further action from this plan.
- `31-16` (post-sweep snapshot/final verification) should include ids 28-32 in its scope and should specifically re-confirm the post 30 `en`→English content fix (and flag `title.en` for a follow-up), and confirm post 32's `en` locale no longer contains any refusal-message artifacts.
- No blockers for sibling batch plans (running concurrently in this same wave) — this plan touched only ids 28-32, disjoint from all other batches per the plan's design.

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*

## Self-Check: PASSED

- FOUND: `scripts/humanize-posts-batch-05.ts`
- FOUND: `scripts/_pf-data-28.ts`, `_pf-data-29.ts`, `_pf-data-30.ts`, `_pf-data-31.ts`, `_pf-data-32.ts`
- FOUND: commit `bd09465` in `git log --oneline --all`
- FOUND: `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-05.json` (checkpoint: `{"28":"done","29":"done","30":"done","31":"done","32":"done"}`)
