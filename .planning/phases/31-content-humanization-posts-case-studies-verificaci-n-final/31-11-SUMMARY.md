---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 11
subsystem: content
tags: [payload-local-api, richtext-lexical, content-humanization, i18n, es, en]

# Dependency graph
requires:
  - phase: 31-01
    provides: pre-sweep-phase31 content snapshot, fresh pre-milestone Lighthouse baseline
provides:
  - "Posts ids 55,56,57,58,59,60 (nextjs-seo-optimization, tablas-hash, que-es-css, mejores-cursos-seo-espanol, experiencia-de-usuario, redaccion-seo) rewritten in Juan's voice — es for all 6, en for the 3 that actually have en content live"
  - "Confirmed (and documented as a blocker) a pre-existing content gap: ids 56, 57, 58 have no `en` locale content at all in production — not something this batch introduced"
affects: [31-16-final-verification, 31-verify-locale-parity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Index-aligned REWRITES array (ordered to match collectEligible()'s depth-first traversal) instead of exact-text-string keys or per-path keys — length-asserted against the live eligible-node count before any write, so a mismatch aborts loudly instead of silently misapplying text"
    - "Short bold/technical-term text nodes and inline code-formatted samples (e.g. '[css]\\nbody {...}') intentionally left byte-identical in the rewrite array, since they are code/tool identifiers, not prose"

key-files:
  created: [scripts/humanize-posts-batch-10.ts, scripts/humanize-posts-batch-10-data.ts]
  modified: [.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-10.json]

key-decisions:
  - "Split the rewrite prose into a separate data file (humanize-posts-batch-10-data.ts) from the walk/apply logic (humanize-posts-batch-10.ts) — the plan's files_modified names only the main script, but this data file is a direct dependency of it and was committed alongside it, not a separate deliverable"
  - "Rewrote at the individual Lexical text-node level using an ordered index array aligned to traversal order, asserting eligible-node-count === rewrite-array-length before writing anything — avoids the risk of exact-text-key collisions on short/duplicate fragments (e.g. multiple listitem labels reading 'Generación del hash:')"
  - "For ids 56, 57, 58: confirmed live via payload.findByID({ locale: 'all' }) that content.en is null/absent entirely, then cross-checked against the phase 31 pre-sweep snapshot (.planning/phases/29-content-humanization-safety-net/content-snapshots/pre-sweep-phase31-*.json) to confirm this predates this batch's execution. Did NOT invent full new EN translations for these 3 posts — that is a translation-authoring task, not a voice rewrite, and falls outside VOICE-06's scope. Rewrote only the existing es content for these 3; flagged the en gap as a blocker for a follow-up plan."

requirements-completed: [VOICE-06]

coverage:
  - id: D1
    description: "Posts 55, 59, 60 (both es and en) and posts 56, 57, 58 (es only, en confirmed absent) have content field rewritten in Juan's voice; zero em dash/voceo; code-sample text and table nodes byte-identical pre/post write"
    requirement: "VOICE-06"
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-10.ts (re-run reports 6/6 already done, zero findings)"
        status: pass
    human_judgment: true
    rationale: "Voice/tone quality is a subjective judgment call Juan should confirm by reading a sample of the rewritten posts, even though the automated em-dash/voceo/structural checks all pass."

# Metrics
duration: ~100min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 11: Humanize Posts Batch 10 (ids 55-60) Summary

**Rewrote `content` (richText) for 6 posts (Next.js SEO, hash tables, CSS basics, Spanish SEO courses, UX, SEO copywriting) in Juan's voice via a resumable Local API script — es for all 6, en for the 3 that actually have English content live, and flagged the other 3's missing en content as a pre-existing gap rather than inventing new translations.**

## Performance

- **Duration:** ~100 min (large batch — includes discovering and cross-verifying the missing-en-content gap on 3 of 6 posts, and authoring ~1,045 rewritten Lexical text nodes across 9 post/locale combinations, roughly 22,000+ words of voice-rewritten prose)
- **Completed:** 2026-07-17T04:44:00Z
- **Tasks:** 1 (single autonomous task per plan)
- **Files modified:** 3 (2 scripts created, 1 gitignored checkpoint file)

## Accomplishments
- `scripts/humanize-posts-batch-10.ts` + `scripts/humanize-posts-batch-10-data.ts` created: fetch each of the 6 posts (`locale: 'all'`), walk the Lexical tree, rewrite only `text` nodes under `heading`/`paragraph`/`listitem` (never `block`, `table`, or `link`-child text) using an index-aligned rewrite array, write back per locale, read back to self-check, and mark each id `'done'` in a checkpoint file only after its self-check passes
- Post 55 (nextjs-seo-optimization), 59 (experiencia-de-usuario), and 60 (redaccion-seo) now have distinct, voice-rewritten `content` in both `es` and `en`
- Posts 56 (tablas-hash), 57 (que-es-css), 58 (mejores-cursos-seo-espanol) have voice-rewritten `content` in `es`; their `en` locale has no content at all in production, confirmed both live and against the pre-sweep-phase31 snapshot taken before this plan ran, so nothing was silently skipped or invented
- Zero em dash, zero voceo markers verified live post-write across all 6 posts' rewritten locales
- The 1 table node (post 55), 1 table node (post 58), and 1 table node (post 59) all confirmed byte-identical pre/post write via automated diff inside the script; no code-block-type nodes exist in this batch (confirmed via live scan before authoring)
- Re-running the script reports "6/6 posts done" with zero findings, confirming idempotency

## Task Commits

1. **Task 1: Humanize Posts batch 10 (ids 55,56,57,58,59,60)** - `1ff2766` (feat)

**Plan metadata:** (this commit, docs)

## Files Created/Modified
- `scripts/humanize-posts-batch-10.ts` - Idempotent, checkpointed Local API script: fetches, walks, rewrites, writes back, self-checks, and reports final verification across all 6 posts
- `scripts/humanize-posts-batch-10-data.ts` - Ordered rewrite-text arrays (`POST_55_ES`, `POST_55_EN`, `POST_56_ES`, `POST_57_ES`, `POST_58_ES`, `POST_59_ES`, `POST_59_EN`, `POST_60_ES`, `POST_60_EN`), each aligned to the exact traversal order of eligible nodes in its post/locale
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-10.json` - Checkpoint file (gitignored), shows all 6 ids `'done'`

## Decisions Made
- Used an index-aligned rewrite array (verified by length assertion against the live eligible-node count) rather than exact-text-string matching, since several posts have duplicate/short fragments (e.g. repeated listitem labels like "Generación del hash:") that would collide under a text-key approach
- Left short bold/technical-term nodes (tool names, code identifiers like `next/script`, `robots.txt`, `h1`, `<h1>`) and CSS/HTML code-sample text nodes (formatted as `[css]\n...` plain text, not actual Lexical `block` nodes) byte-identical rather than "humanizing" them — they are technical facts/code, not prose voice
- Did not invent EN translations for posts 56/57/58 — verified live and against the phase 31 pre-sweep snapshot that these posts simply never had English content, which is a translation-authoring gap outside this plan's voice-rewrite scope (VOICE-06). Flagging this as a blocker for Juan rather than quietly expanding scope.

## Deviations from Plan

### Blockers (not auto-fixed — flagged for follow-up)

**1. Posts 56, 57, 58 have no `en` locale content at all in production**
- **Found during:** Task 1, live content inspection before authoring the rewrite (`payload.findByID({ locale: 'all' })` against production Neon returned `content.en: null` for all 3)
- **Cross-checked against:** `.planning/phases/29-content-humanization-safety-net/content-snapshots/pre-sweep-phase31-2026-07-17T03:57:58.546Z.json` — same 3 ids show `en: False` in that pre-sweep snapshot taken before any Phase 31 batch ran, confirming this predates this plan's execution and is not a regression this script introduced
- **Why not auto-fixed:** The plan's `<action>` describes rewriting existing prose in Juan's voice — not authoring brand-new content. Writing a full EN translation for 3 posts (que-es-css, tablas-hash, mejores-cursos-seo-espanol) is a much larger surface (translating technical facts, code samples, and structure from scratch, not paraphrasing existing text) and carries real risk of introducing translation errors or subtly different technical claims if done as a rushed side effect of a voice-rewrite task. This is architecturally a different kind of work (Rule 4 territory — significant scope expansion), not a same-task auto-fix.
- **Recommendation:** A dedicated follow-up plan (translation authoring, not voice humanization) should scope and execute EN translations for these 3 posts if bilingual parity for this content is required. Until then, these 3 posts remain ES-only, same as they were before this plan ran.
- **Impact on this plan:** None — all 6 posts' existing content (ES for all 6, EN for the 3 that had it) is now voice-rewritten and passes every automated check. No content was deleted or degraded.

---

**Total deviations:** 1 blocker (pre-existing content gap, confirmed not introduced by this or any prior Phase 31 batch)
**Impact on plan:** Plan's must_haves are satisfied for content that actually exists; the missing-en-content gap on 3 posts is a distinct, pre-existing issue now formally documented rather than silently worked around.

## Issues Encountered

None beyond the missing-en-content discovery documented above. 12 sibling agents were running the same pattern concurrently on disjoint post id ranges (plus one on case studies); `git log` was checked before each commit and no unexpected diffs from concurrent work were observed — this batch's 2 files were staged and committed individually.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Batch 10 of 13 in Phase 31's Posts sweep is complete; ids 55-60 are done
- The missing-en-content gap on ids 56, 57, 58 is a real, pre-existing bilingual-parity issue (not a regression) that should be visible to whoever runs 31-16's final joint verification pass — locale-parity checks will correctly flag these 3 posts' `en` as legitimately empty (both `es`/`en` empty is not a regression per `verify-locale-parity.ts`'s logic, but here it's `es` populated + `en` empty, which — depending on how that script's asymmetry check is scoped to posts — may or may not currently be caught; worth a manual note for Juan on whether Posts collection is in scope for that check at all)
- Ready for 31-16's final joint verification pass once all 13 batches + case-studies plan are done

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*

## Self-Check: PASSED

- FOUND: scripts/humanize-posts-batch-10.ts
- FOUND: scripts/humanize-posts-batch-10-data.ts
- FOUND: .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-10.json (gitignored checkpoint, all 6 ids `'done'`)
- FOUND: commit 1ff2766 (feat) in `git log --oneline --all`
- Re-run of `node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-10.ts` confirms 6/6 already done, zero findings
