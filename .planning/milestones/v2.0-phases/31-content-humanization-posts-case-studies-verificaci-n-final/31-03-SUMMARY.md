---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 03
subsystem: content
tags: [payload-cms, lexical-richtext, local-api, content-humanization, i18n]

requires:
  - phase: 29-content-humanization-safety-net
    provides: 29-VOICE-PROFILE.md, research/voice-sample-juan.md (authoritative voice calibration source)
provides:
  - Posts ids 10,11,12,13,14 (technical-seo-checklist, structured-data-seo, seo-on-page-guia, nextjs-seo, auditoria-seo) rewritten in Juan's voice, both es/en locales
  - Checkpointed, idempotent humanize script for this batch (safe to re-run)
  - Fix for a pre-existing locale-parity gap: posts 12 and 14 had no `en` document at all (missing both `title` and `content`), not just missing `content`
affects: [31-16-verificacion-final, verify-locale-parity script future runs]

tech-stack:
  added: []
  patterns:
    - "In-place Lexical tree rewrite (walk + replace only heading/paragraph/listitem text nodes, pass block/table nodes through by reference) instead of full-tree rebuild — prevents deleting code samples, tables, and links"
    - "¤LINK¤ placeholder token standing in for embedded link nodes during authored-text rewrite, consumed in original order to splice the untouched original link node back into the rebuilt paragraph"
    - "Persisted JSON checkpoint file (one entry per post id) read/skip at script start, written immediately after each id's both-locale write + read-back verification — crash-safe resumability"

key-files:
  created:
    - scripts/humanize-posts-batch-02.ts
    - scripts/humanize-posts-batch-02-content.ts
  modified: []

key-decisions:
  - "Reused and repaired a prior crashed-agent attempt's already-authored script + content file (found on disk, untracked, DB untouched) instead of re-authoring from scratch — verified quality via automated em-dash/voceo/AI-cliché scan before trusting it"
  - "Fixed ESM __dirname ReferenceError by switching to fileURLToPath(import.meta.url), matching the pattern already used in sibling batch scripts (01/03/05/07)"
  - "Fixed a Rule 3 blocking bug: ids 12 and 14 had no `en` title at all (required, localized field), not just missing `en` content — Payload validates the whole document's required fields for the locale being written on `update`, so content-only writes for locale 'en' failed until the authored English title (already present as each post's English H1 in the rewrite content) was included in the same write"
  - "Fixed 10 AI-cliché occurrences ('es fundamental'/'son fundamentales', 'crucial(es)', 'robusto/a', 'seamless', 'align with', 'fosters') in the authored copy before writing to production, per the plan's hard anti-AI-writing rules"

requirements-completed: [VOICE-06]

coverage:
  - id: D1
    description: "Posts.content rewritten in Juan's calibrated voice for ids 10,11,12,13,14, both es and en locales, with zero em dash and zero voceo"
    requirement: "VOICE-06"
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-02.ts (idempotent re-run, exit 0, 5/5 already done, em-dash=none voceo=none for all 10 locale/id pairs)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every code-block and table node inside these 5 posts is byte-identical pre/post write"
    requirement: "VOICE-06"
    verification:
      - kind: other
        ref: "scripts/humanize-posts-batch-02.ts assertStructuralNodesUnchanged() — JSON.stringify byte comparison of every block/table node pre vs post rewrite, run inline during the live write for all 10 locale/id pairs, zero mismatches (script would have exited 1 otherwise)"
        status: pass
    human_judgment: false

duration: ~50min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 03: Humanize Posts Batch 2 (ids 10-14) Summary

**Rewrote Posts.content for 5 SEO-guide posts (technical-seo-checklist, structured-data-seo, seo-on-page-guia, nextjs-seo, auditoria-seo) in Juan's calibrated voice, both locales, via a checkpointed Local API script against production Neon — fixing a pre-existing missing-`en`-document gap on 2 of the 5 posts along the way.**

## Performance

- **Duration:** ~50 min
- **Tasks:** 1/1 completed
- **Files modified:** 2 (both new)

## Accomplishments
- Rewrote the `content` richText field for Posts ids 10, 11, 12, 13, 14 in both `es` and `en` locales, calibrated against `research/voice-sample-juan.md` and `29-VOICE-PROFILE.md`'s "Blog posts" guidance (first person where natural, mixed long/short sentence rhythm, "así sea X, Y o Z" / "whether it's X, Y, or Z" connector, zero em dash, tuteo only)
- Preserved every code-block embed and table node byte-identical (in-place tree walk, never touches those node types) and every link's anchor text/target untouched
- Discovered and fixed a live locale-parity gap not anticipated by the plan: ids 12 (seo-on-page-guia) and 14 (auditoria-seo) had **no English document at all** — missing both `title` (required field) and `content`, not just `content`. Authored genuine English prose (not literal translation) for both, and included the missing `title` in the same locale write to satisfy Payload's document-level required-field validation
- Verified idempotency: second script run exits 0, reports 5/5 already done, zero em-dash/voceo findings across all 10 (post, locale) pairs

## Task Commits

1. **Task 1: Humanize Posts batch 2 (ids 10,11,12,13,14)** - `2607030` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `scripts/humanize-posts-batch-02.ts` - Checkpointed, idempotent Local API script: walks each locale's Lexical tree, rewrites only heading/paragraph/listitem text, passes block/table nodes through by reference, self-verifies em-dash/voceo/structural-identity before marking a post `'done'`
- `scripts/humanize-posts-batch-02-content.ts` - Authored rewrite text: one string array per (post id, locale), in the exact block traversal order the script walks, `¤LINK¤` placeholder standing in for each preserved link node

## Decisions Made
- **Reused a crashed prior agent's in-progress work instead of restarting.** Found `scripts/humanize-posts-batch-02.ts` and `scripts/humanize-posts-batch-02-content.ts` already fully authored on disk (untracked, DB confirmed untouched — the crash happened before any `payload.update` call ran). Rather than discard ~950 lines of already-calibrated voice work, ran an automated QA pass (em dash, voceo, AI-cliché regex scan against the plan's exact banned-phrase list) before trusting it, found and fixed 10 cliché violations, then executed.
- **Included the English title in the content write for ids 12/14** rather than treating "missing title" as a separate out-of-scope field. `title` is a required, localized field on Posts, and Payload validates the whole document's required fields for whatever locale is being written on `update` — so `content`-only writes for locale `en` on these two ids were impossible without also supplying `title.en`. The English title text was already available (it's each post's own English H1 in the authored rewrite), so this was a same-class Rule 2 fix, not new scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking bug] ESM `__dirname` ReferenceError**
- **Found during:** Task 1, first script run
- **Issue:** The script (authored by the prior crashed agent) used bare `__dirname`, which doesn't exist in this project's ESM module scope (Node throws `ReferenceError: __dirname is not defined in ES module scope`), blocking the checkpoint-file path resolution entirely.
- **Fix:** Added `import { fileURLToPath } from 'url'` and `const __dirname = path.dirname(fileURLToPath(import.meta.url))`, matching the exact pattern already used in sibling scripts `humanize-posts-batch-01.ts`, `03.ts`, `05.ts`, `07.ts`.
- **Files modified:** `scripts/humanize-posts-batch-02.ts`
- **Verification:** Script ran past the checkpoint-path resolution on next invocation.
- **Committed in:** `2607030` (part of task commit)

**2. [Rule 3 - Blocking bug] Missing `en` title for ids 12 and 14 blocked content writes**
- **Found during:** Task 1, live run — `payload.update({ ..., locale: 'en', data: { content } })` threw `ValidationError: title — This field is required.` for id 12
- **Issue:** Ids 12 (seo-on-page-guia) and 14 (auditoria-seo) had no `en` document at all — `title` (required, localized) was `undefined`, not just `content`. This is a pre-existing locale-parity gap the plan's `<interfaces>` section didn't anticipate (it only flagged the possibility of missing `content`). Payload validates the full document's required fields for the locale being written on `update`, so a content-only write for `locale: 'en'` cannot succeed while `title.en` is missing.
- **Fix:** Added an `EN_TITLES` map with the authored English title for each of the two ids (reusing the exact string already used as that post's English H1 in the rewrite content), and included `title` in the same `payload.update` call whenever the existing title for that locale was missing.
- **Files modified:** `scripts/humanize-posts-batch-02.ts`
- **Verification:** Both ids wrote successfully on the next run; read-back confirmed `title.en` and `content.en` both persisted (e.g. id 12 `title.en = "On-Page SEO: A Complete Guide and Practical Strategy"`, id 14 `title.en = "SEO Audit: A Complete Guide and Practical Strategy"`).
- **Committed in:** `2607030` (part of task commit)

**3. [Rule 1 - Bug] 10 AI-cliché phrases in authored copy, found before any DB write**
- **Found during:** Task 1, pre-flight QA scan of the prior agent's authored content (run before trusting/executing it, per the plan's explicit hard rules on banned phrases)
- **Issue:** `scripts/humanize-posts-batch-02-content.ts` contained 10 occurrences of phrases the plan explicitly bans: "es fundamental" / "son fundamentales" (7×), "crucial(es)" (2×), "robusto/robusta" (3×), "seamless" (1×), "align with" (1×), "fosters" (1×).
- **Fix:** Rewrote each occurrence in-line with natural Juan-voice phrasing ("pesa mucho en", "es clave", "sólido", "painless", "follow the Schema.org spec", "keeps the site improving continuously"), preserving meaning and every `¤LINK¤` placeholder position exactly.
- **Files modified:** `scripts/humanize-posts-batch-02-content.ts`
- **Verification:** Re-ran the full regex sweep (em dash, voceo, and the plan's exact cliché list) — zero matches before executing the write.
- **Committed in:** `2607030` (part of task commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 3 blocking bugs, 1 Rule 1 bug fix)
**Impact on plan:** All fixes were necessary for the task to complete at all (Rule 3 items) or for correctness against the plan's own hard content rules (Rule 1 item). No scope creep — no field outside `Posts.content` (and the one required-field dependency, `title`, needed to satisfy that write) was touched.

## Issues Encountered
None beyond the deviations documented above — all resolved inline without needing a checkpoint pause.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Batch 2 of 13 in Phase 31's Posts sweep is complete; ready for Plan 31-16's final verification pass (locale-parity, JSON-LD/meta, Lighthouse gate) once all batches land.
- Flag for 31-16 or any future locale-parity audit: the missing-`en`-document gap found here (ids 12, 14 had no title/content in English at all) may exist on other posts outside this batch's id range — `scripts/verify-locale-parity.ts` (once extended to include `posts` per this phase's pattern map) should catch this class of issue across the full 72-post collection, not just this batch's 5.

## Self-Check: PASSED
- FOUND: scripts/humanize-posts-batch-02.ts
- FOUND: scripts/humanize-posts-batch-02-content.ts
- FOUND: .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-02.json
- FOUND: commit 2607030
