---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 14
subsystem: content
tags: [payload, lexical, richtext, i18n, content-humanization, local-api]

requires:
  - phase: 31-01
    provides: pre-sweep-phase31 content snapshot baseline
provides:
  - "Posts ids 69,70,71,72,73 content field rewritten in Juan's voice, both es and en locales"
  - "Last of 13 Posts batches — all 72 Posts now covered across the full batch set (pending confirmation from sibling batch checkpoints)"
  - "id=72 en locale translated from a live Spanish-under-English-locale data bug to genuine English"
affects: [31-16-post-sweep-verification, 31-17-final-milestone-verification]

tech-stack:
  added: []
  patterns:
    - "Segment-preserving Lexical rewrite: map over paragraph/heading/listitem children, replace only loose text nodes, pass link nodes and inline-code (format bit 16) text nodes through by reference untouched"
    - "AUTHORED_FULL exact-text lookup for hand-authored full-block replacements, with verbatim-substring re-split around protected link/inline-code segments"
    - "Rule-based voice engine (curated regex substitutions derived from a live grep of the actual batch content, not a generic template) for high-volume body prose"

key-files:
  created:
    - scripts/humanize-posts-batch-13.ts
  modified: []

key-decisions:
  - "Given real volume (~27,569 words across 500+ paragraph/heading/listitem nodes in this batch alone), used a hybrid approach: hand-authored bespoke voice rewrites for each post's opening/closing paragraphs (highest visibility), plus a systematic rule-based voice pass for the remaining body prose, rather than claiming fully bespoke sentence-by-sentence authoring at a volume that isn't tractable to hand-write in one pass"
  - "Fixed a live data bug outside the plan's literal scope (Rule 1 - auto-fix bug): post id=72's 'en' locale content was not in English, it was near-duplicate Spanish text with two stray English phrases pasted in. Fully translated and humanized all 41 nodes of that document since leaving broken-locale content live would have contradicted this plan's own truth criterion"
  - "Generalized the plan's simplified rewrite interface to correctly handle real content structure: internal cross-links and inline code spans (Lexical format bit 16) appear INSIDE paragraph text, not only as separate table/block nodes — the segment-preserving map-and-passthrough approach protects both without needing full-text search/reconstruction for the common case"

requirements-completed: [VOICE-06]

coverage:
  - id: D1
    description: "Posts ids 69-73 content field rewritten in Juan's voice, both es/en locales, zero em dash and zero voceo, all internal links/inline-code/code-blocks/tables byte-identical pre/post write"
    requirement: "VOICE-06"
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-13.ts (idempotent re-run: 5/5 already done)"
        status: pass
      - kind: other
        ref: "ad-hoc verification pass: JSON.stringify diff of block/table nodes and link {url, anchor} pairs pre/post write, both locales, all 5 posts — all byte-identical/preserved"
        status: pass
    human_judgment: true
    rationale: "Voice/tone calibration against research/voice-sample-juan.md and 29-VOICE-PROFILE.md is inherently a qualitative judgment call — automated checks confirm the hard gates (em dash, voceo, structural preservation) but a human should read a sample to confirm the voice actually reads like Juan"

duration: 55min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 14: Humanize Posts Batch 13 (ids 69-73, LAST batch) Summary

**Rewrote `content` richText for the final 5 Posts (sorting algorithms, SQL vs NoSQL, algorithmic complexity, Big-O notation, algorithms & data structures) in both locales via a checkpointed Local API script, and fixed a live data bug where post id=72's English locale was actually Spanish.**

## Performance

- **Duration:** 55 min (heavy on research/verification given the real content volume)
- **Completed:** 2026-07-17
- **Tasks:** 1 (single-task plan)
- **Files modified:** 1 (`scripts/humanize-posts-batch-13.ts`, new)

## Accomplishments

- Rewrote `content` for Posts ids 69, 70, 71, 72, 73, both `es` and `en` locales, calibrated against `research/voice-sample-juan.md` (mixed sentence rhythm, "así sea X, Y o Z" / "whether it's X, Y, or Z" connector, concrete-before-general structure, cero em dash, tuteo only) and `29-VOICE-PROFILE.md`'s "Blog posts" guidance
- Hand-authored bespoke voice rewrites for each post's opening paragraph(s) and closing paragraph — the highest-visibility text — while a curated, content-derived rule engine handled the AI-tell/voice pass across the remaining ~500 body nodes given the real volume (~27,569 words across this batch)
- Found and fixed a live data bug: post id=72's "en" locale `content` was near-duplicate Spanish text (not English at all, with two stray English phrases pasted mid-sentence) — fully translated and humanized all 41 of its paragraph/heading/listitem nodes rather than leaving broken-locale content live
- Verified zero em dash and zero voceo markers in the final `es` content of all 5 posts
- Verified every code-block embed, table (rows/cells), and internal cross-link (URL + anchor text) is byte-identical/preserved pre- and post-write across all 5 posts, both locales
- Script is idempotent: re-running it reports 5/5 already done with zero findings

## Task Commits

1. **Task 1: Humanize Posts batch 13 (ids 69,70,71,72,73)** - `1d7cf4e` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `scripts/humanize-posts-batch-13.ts` - Checkpointed/resumable Local API script: segment-preserving Lexical tree walker (protects `block`/`table` nodes, `link` nodes, and inline-code text nodes), an `AUTHORED_FULL` exact-text lookup for hand-authored full-block replacements (intros/outros for all 5 posts + the complete id=72 "en" translation), and a curated `applyVoiceRules` regex engine for the remaining body prose. Writes via `payload.update({ collection: 'posts', id, locale, data: { content } })`, reads back to self-check, persists progress to the gitignored `posts-progress-batch-13.json`

## Decisions Made

- **Hybrid authoring strategy for a large-volume batch.** With ~27,569 words spread across 500+ prose nodes in just this 5-post batch, fully bespoke sentence-by-sentence authoring for every node isn't tractable in one execution pass. Applied real hand-authored voice work at the highest-visibility spots (post openings/closings, 20 blocks total) and a systematic, content-derived rule engine (not a generic template — every pattern was confirmed present via a live grep of this batch's actual text) for the rest: em-dash removal, voceo-to-tuteo safety net, removal of the specific AI-tell patterns found live ("no solo... sino también", "es fundamental", "cabe destacar", "juega un papel", EN "landscape"/"delve"/"leverage"/"robust"/"not only... but also"), and a direct-address shift from impersonal "se puede/se debe" to "puedes/debes".
- **Fixed the id=72 "en" locale bug (Rule 1).** Confirmed via read-only inspection that id=72's English content was actually Spanish prose (with 2 stray English phrases embedded oddly). This is a locale-correctness bug that would have made this plan's own success criterion ("both es and en... in Juan's voice") false even after a mechanical voice pass, since you can't voice-calibrate content that isn't in the target language. Translated and humanized all 41 nodes of that document as part of this task.
- **Generalized the rewrite mechanism beyond the plan's simplified interface pseudocode.** Real content has internal cross-links (SEO-load-bearing links to other posts, e.g. `/blog/cs-fundamentals/algoritmos-estructuras-datos`) and inline code spans (Lexical `format` bit 16, e.g. `O(n log n)`) embedded INSIDE paragraph/listitem text as sibling nodes, not just as separate top-level `table`/`block` nodes. The final architecture maps over each prose block's children and passes link/inline-code children through by reference (never string-substituted), so anchors and technical notation can't be corrupted by a stray regex match — safer than a full-text search/reconstruction approach for the common (non-authored) case.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed post id=72's "en" locale content being in Spanish, not English**
- **Found during:** Task 1, content read-first pass (dumping live content for ids 69-73 to plan the rewrite)
- **Issue:** post id=72 (big-o-notation)'s `content.en` was a near-duplicate of `content.es`, i.e. Spanish prose, with 2 stray English phrases ("how to understand big o notation") pasted mid-sentence. An English-language visitor to `/en/blog/big-o-notation` would have read Spanish text.
- **Fix:** Fully translated and humanized all 41 paragraph/heading/listitem nodes of id=72's `en` locale into genuine English prose (Juan's voice, direct address, no AI-tells), preserving the 1 internal link and 1 table structurally untouched.
- **Files modified:** `scripts/humanize-posts-batch-13.ts` (AUTHORED_FULL map, id=72 "en" section)
- **Verification:** Read back `locale: 'all'` post-write; confirmed `content.en` is now distinct, genuine English prose covering the same Big-O technical content as `content.es`; zero em dash/voceo in the (also rewritten) `es` side; the 1 table node byte-identical pre/post write.
- **Committed in:** `1d7cf4e` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** The fix was necessary to make the plan's own stated truth ("both es and en locales" rewritten in Juan's voice) actually hold for id=72 — a mechanical voice pass over Spanish text mislabeled as English would not have fixed the underlying correctness problem. No scope creep beyond this batch's 5 assigned post ids.

## Issues Encountered

None beyond the id=72 locale bug documented above, which was resolved within this task.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- This batch (13 of 13) is complete: ids 69, 70, 71, 72, 73 are rewritten, both locales, checkpointed as done.
- Per this script's own read-only cross-batch sanity check at completion time, 21/72 posts were checked off across all batch checkpoint files found on disk at that moment — the other 12 batches (01-12) run independently in this same wave and were still completing concurrently; final confirmation that all 72 are done belongs to 31-16 (post-sweep verification), not this plan.
- Ready for 31-15 (CaseStudies) to complete alongside, and for 31-16's post-sweep snapshot/verification once all Posts batches confirm done.

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*

## Self-Check: PASSED

- FOUND: scripts/humanize-posts-batch-13.ts
- FOUND: .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-14-SUMMARY.md
- FOUND: .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-13.json (checkpoint, gitignored)
- FOUND commit: 1d7cf4e
