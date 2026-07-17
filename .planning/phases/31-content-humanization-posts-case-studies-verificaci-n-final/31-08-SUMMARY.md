---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 08
subsystem: content
tags: [payload-local-api, richtext-lexical, content-humanization, i18n, es, en]

# Dependency graph
requires:
  - phase: 31-01
    provides: pre-sweep-phase31 content snapshot, fresh pre-milestone Lighthouse baseline
provides:
  - "Posts ids 39-44 (topic-clusters-seo, typescript-best-practices, payloadcms-vs-strapi, payloadcms-tutorial, payloadcms-seo, nextjs-server-components) rewritten in Juan's voice, both locales"
  - "Fixed a pre-existing data bug: id=42 (fully) and id=44 (partially) had their `es` locale content stored in English"
affects: [31-16-final-verification, 31-verify-locale-parity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Path-keyed REPLACEMENTS map for in-place Lexical text-node rewrite (path computed identically during walk and during authoring), instead of exact-text-string keys — avoids collisions on duplicate/short fragments"
    - "Inline-code-formatted (format bit 16) and short technical-identifier text nodes intentionally left out of the REPLACEMENTS map (byte-identical pass-through), since they represent code terms, not prose"

key-files:
  created: [scripts/humanize-posts-batch-07.ts]
  modified: [.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-07.json]

key-decisions:
  - "Rewrote at the individual Lexical text-node level (not full-paragraph rebuild) to guarantee block/table nodes and link labels are never touched, and to preserve inline-code formatting for embedded technical terms (tsconfig.json, any, const, etc.)"
  - "Found during live inspection: post 42's `es` locale content was stored entirely in English (title was correctly localized, body was not), and post 44's `es` locale had ~20 paragraphs and several headings mid-document also stored in English. Treated as Rule 1 auto-fix — translated these into genuine Spanish (not paraphrase) as part of the voice rewrite, since the plan's must_haves require real Spanish content for the es locale."
  - "Left short standalone technical identifiers/inline-code fragments (e.g. `any`, `strict`, `const`, `tsconfig.json`) unchanged rather than attempting to 'humanize' single-word code terms — preserves technical accuracy per the plan's verbatim-facts requirement"

requirements-completed: [VOICE-06]

coverage:
  - id: D1
    description: "Posts ids 39,40,41,42,43,44 content field rewritten in Juan's voice, both es and en, zero em dash/voceo, code-block and table nodes byte-identical pre/post write"
    requirement: "VOICE-06"
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-07.ts (re-run reports 6/6 already done)"
        status: pass
    human_judgment: true
    rationale: "Voice/tone quality is a subjective judgment call Juan should confirm by reading a sample of the rewritten posts, even though the automated em-dash/voceo/structural checks all pass."

# Metrics
duration: ~55min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 08: Humanize Posts Batch 7 (ids 39-44) Summary

**Rewrote `content` (richText) for 6 dev-tooling posts (topic clusters, TypeScript, Payload vs Strapi, Payload tutorial, Payload SEO, Next.js Server Components) in Juan's voice across es/en via a resumable Local API script, and along the way fixed a real data bug where two of the six posts had English text stored in their `es` locale field.**

## Performance

- **Duration:** ~55 min (includes live content inspection, ~21,600 words of voice-rewritten prose across 12 post/locale combinations, and an unplanned translation fix)
- **Completed:** 2026-07-17T04:40:32Z
- **Tasks:** 1 (single autonomous task per plan)
- **Files modified:** 2 (1 script created, 1 gitignored checkpoint file)

## Accomplishments
- `scripts/humanize-posts-batch-07.ts` created: fetches each of the 6 posts (`locale: 'all'`), walks the Lexical tree, rewrites only `text` nodes under `heading`/`paragraph`/`listitem` (never `block`, `table`, or `link`-child text), writes back per locale, reads back to self-check, and marks each id `'done'` in a checkpoint file only after its self-check passes
- All 6 posts now have distinct, voice-rewritten `content` in both `es` and `en` — zero em dash, zero voceo markers, verified live post-write
- Every `block` (code-sample embed) and `table` node in all 6 posts confirmed byte-identical pre/post write via automated diff inside the script
- Found and fixed a real content bug: id=42's `es` locale `content` was stored entirely in English (title was properly localized to Spanish, body was not); id=44's `es` locale had ~20 paragraphs plus several headings mid-document also stored in English. Both are now genuinely Spanish, written in Juan's voice, not machine-translated filler
- Re-running the script reports "6/6 posts done" with zero findings, confirming idempotency

## Task Commits

1. **Task 1: Humanize Posts batch 7 (ids 39,40,41,42,43,44)** - `530e997` (feat)

**Plan metadata:** (this commit, docs)

## Files Created/Modified
- `scripts/humanize-posts-batch-07.ts` - Idempotent, checkpointed Local API script that rewrites the 6 posts' `content` field in both locales and self-verifies
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-07.json` - Checkpoint file (gitignored), shows all 6 ids `'done'`

## Decisions Made
- In-place text-node rewrite keyed by exact tree path (not by exact original-text string), to avoid collisions when the same short fragment (e.g. a single technical word) appears multiple times in a document
- Inline-code-formatted fragments (Lexical format bit 16) and short standalone technical identifiers are intentionally left byte-identical rather than rewritten — they carry no "voice," and rewriting them risks altering a real code/tool reference
- Treated the es-locale-in-English bug on ids 42/44 as an in-scope Rule 1 auto-fix rather than deferring it, since the plan's must_haves explicitly require genuine Spanish content for the es locale — a partial "voice rewrite" of English text posing as Spanish would not satisfy that requirement

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Post id=42's `es` locale content was stored entirely in English**
- **Found during:** Task 1, live content inspection before authoring the rewrite (read via `payload.findByID({ locale: 'all' })` on production Neon)
- **Issue:** The `es` locale's `content` field for `payloadcms-tutorial` (id 42) contained English prose identical in structure to, but distinct in wording from, the `en` locale — the title field was correctly localized to Spanish, but the body was never translated
- **Fix:** Authored full Spanish translations (not paraphrase) for every rewritable text node in the `es` locale, in Juan's voice, preserving all technical facts/code references/links exactly as in the original English source
- **Files modified:** scripts/humanize-posts-batch-07.ts (REPLACEMENTS[42].es)
- **Verification:** Live read-back confirms `es` content is now genuine Spanish prose; self-check (em dash/voceo/block/table diff) passes
- **Committed in:** 530e997 (Task 1 commit)

**2. [Rule 1 - Bug] Post id=44's `es` locale content had ~20 paragraphs plus scattered headings stored in English**
- **Found during:** Task 1, live content inspection (same read as above)
- **Issue:** `nextjs-server-components` (id 44) `es` locale alternated between genuinely Spanish sections and English sections within the same document — paragraphs 2 through 21 were entirely in English, and several headings further into the document (e.g. "Transition from pages to app Directory", "Distinguishing Server Components vs. Client Components") remained in English even though the paragraph text immediately following them was already correctly in Spanish
- **Fix:** Translated every English-language node into Spanish in Juan's voice; left the already-correct Spanish nodes with their normal light-touch voice rewrite
- **Files modified:** scripts/humanize-posts-batch-07.ts (REPLACEMENTS[44].es)
- **Verification:** Live read-back of the first 25 root-level nodes confirms every heading and paragraph is now in Spanish; self-check passes
- **Committed in:** 530e997 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bug in pre-existing es-locale content, unrelated to this script)
**Impact on plan:** Necessary for correctness — the plan's must_haves require genuine Spanish content in the es locale for all 6 posts. No scope creep beyond the 6 ids this plan owns.

## Issues Encountered

- A concurrently-running sibling agent (working on a different batch id-range) had created a temp diagnostic script at the same generic filename (`scripts/_tmp-dump-batch07.ts`) I initially reached for. Renamed my own scratch scripts to batch/id-specific names to avoid collision, and deleted all scratch scripts before committing — none were part of the final commit.
- `__dirname` is not defined in this project's ESM module scope for standalone `tsx` scripts (`"type": "module"` in package.json); fixed by deriving `__dirname` from `import.meta.url` via `fileURLToPath`, matching the pattern already used in `scripts/content-humanization-snapshot.ts`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Batch 7 of 13 in Phase 31's Posts sweep is complete; ids 39-44 are done
- The es-locale-in-English bug found on ids 42/44 was isolated to this batch (spot-checked ids 39, 40, 41, 43 — all had correct per-locale language from the start); worth a quick cross-batch awareness note in case any other batch's sibling agent encounters the same pattern on a different id range
- Ready for 31-16's final joint verification pass (locale parity, JSON-LD/meta, Lighthouse gate) once all 13 batches + case-studies plan are done

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*

## Self-Check: PASSED
