---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 05
subsystem: content
tags: [payload-cms, lexical-richtext, local-api, content-humanization, postgres]

# Dependency graph
requires:
  - phase: 31-01
    provides: pre-sweep-phase31 content snapshot (before/after diff baseline)
provides:
  - Posts ids 21-27 (tree-traversal, time-complexity, space-complexity, quicksort-python, queue-data-structure, merge-sort-python, heap-data-structure) content rewritten in Juan's voice, both es/en locales
  - scripts/humanize-posts-batch-04.ts — reusable placeholder-based (⟦L⟧/⟦K⟧) Lexical rewrite pattern for link/formatted-text-preserving prose rewrites
  - scripts/data/humanize-posts-batch-04-content.json — authored replacement content, structure-position-indexed
affects: [31-16 (post-sweep snapshot), 31-17 (final verification)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Placeholder-indexed Lexical rewrite: author replacement text with ⟦L⟧/⟦K⟧ tokens marking link-anchor and formatted-text positions, then a tree walker fills them back from the ORIGINAL node in traversal order — preserves link hrefs and bold/italic/code spans exactly without needing per-leaf hand authoring"
    - "Dry-run tree-walk validator (no DB writes) to catch entry/tree structural mismatches before running the real write-and-checkpoint script"

key-files:
  created:
    - scripts/humanize-posts-batch-04.ts
    - scripts/data/humanize-posts-batch-04-content.json
  modified: []

key-decisions:
  - "Resumed and completed a prior agent's crashed-but-salvageable work (script + 133KB hand-authored content JSON already on disk) instead of starting from scratch, after verifying via live spot-check that zero DB writes had occurred"
  - "Fixed the VOCEO_RE regex bug (mir[aá] matched non-voceo 'mira') rather than silently trusting the inherited pattern — false positive would have blocked a real post from being marked done"
  - "Treated an FAQ-type block (fields.faqs[].answer, nested richText) as real editorial content requiring cliché cleanup, even though it is structurally a 'block' node the main content walk correctly treats as opaque — fixed via a narrow, scoped follow-up patch rather than expanding the main walker's contract"

requirements-completed: [VOICE-06]

coverage:
  - id: D1
    description: "Posts ids 21-27 content field rewritten in Juan's voice, both es/en locales, applied against production Neon"
    requirement: VOICE-06
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-04.ts (idempotent re-run: 7/7 already done, 0 em dash, 0 voceo)"
        status: pass
    human_judgment: true
    rationale: "Voice/tone quality (matches research/voice-sample-juan.md rhythm, no AI-cliché register) is a subjective judgment call best confirmed by Juan reading a sample, even though the mechanical gates (em dash, voceo, code/table integrity) are automated and passing."

duration: ~50min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 05: Humanize Posts Batch 4 (ids 21-27, algorithms/CS content) Summary

**Rewrote Posts.content for 7 algorithms/data-structures posts (tree traversal, time/space complexity, quicksort, queue, merge sort, heap) in both locales via a placeholder-indexed Lexical tree walker that preserves every code-block embed and internal link byte-identical.**

## Performance

- **Duration:** ~50 min
- **Completed:** 2026-07-17
- **Tasks:** 1 (single autonomous task per plan)
- **Files modified:** 2 (script + content data)

## Accomplishments
- All 7 posts (ids 21, 22, 23, 24, 25, 26, 27), both `es` and `en` locales, rewritten in Juan's calibrated voice against production Neon Postgres via Local API
- Zero em dash, zero voceo markers across all 7 posts' `es` content (formal gate, verified by the script's own read-back self-check and a final full-batch pass)
- Every code-block (`type: 'block'`, `fields.blockType === 'code-block'`) and every table node confirmed byte-identical pre/post write for all 7 posts — verified structurally by the script (block/table subtree deep-equality check before every write) and by manual spot-check (post 24's Python quicksort code sample intact)
- Idempotent re-run confirmed: running the script again reports 7/7 already done with zero new writes
- Also found and fixed 3 residual AI-cliché markers ("es fundamental" / "crucial") living inside a nested FAQ block's answer text (posts 24, 25) that the main content-tree walker correctly treats as opaque — these render on the page as real FAQ copy, so they were patched with a narrow, targeted follow-up rather than left in place

## Task Commits

1. **Task 1: Humanize Posts batch 4 (ids 21,22,23,24,25,26,27)** - `930be01` (feat)

**Plan metadata:** this commit (docs: complete plan, in progress)

## Files Created/Modified
- `scripts/humanize-posts-batch-04.ts` - Idempotent, checkpointed Local API rewrite script; placeholder-based (⟦L⟧/⟦K⟧) tree walker that never enters `block`/`table` nodes and never touches link-anchor or already-formatted (bold/italic/code) text
- `scripts/data/humanize-posts-batch-04-content.json` - Authored replacement text per post/locale, position-indexed to match a pre-order DFS over heading/paragraph/listitem nodes (`__KEEP_ORIGINAL__` sentinel for blocks left untouched, e.g. mangled inline-math fragments or fake-table-as-paragraphs artifacts from the original content)
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-04.json` - Checkpoint file (gitignored), confirms all 7 ids `'done'`

## Decisions Made
- Resumed a prior crashed agent's in-progress work (script skeleton + a substantial, already largely-humanized content JSON, both left on disk) rather than re-authoring from scratch, after confirming via live DB spot-check that no writes had actually landed yet — the crash happened before any `payload.update` call
- Fixed the inherited `__dirname` ESM bug (the script needed `fileURLToPath(import.meta.url)`, not bare `__dirname`, to run under `tsx`)
- Fixed a `VOCEO_RE` false positive: the shared voceo-detection pattern used in this phase's scripts matched `mir[aá]` (both accented and unaccented), which flags ordinary tuteo/neutral Spanish verb forms like "mira" (he/she looks at / tú-imperative) as if they were the voceo form "mirá" (vos-imperative). Narrowed to `mirá` only, matching the plan's own literal marker list
- Ran a dry-run tree-walk validator (no DB writes) before the real run, which surfaced and let me fix ~35 structural mismatches in the authored content JSON — all the same root cause: an entry authored with a leading `⟦L⟧`/`⟦K⟧` placeholder token when the actual Lexical node's first child was the link/formatted node itself (no preceding plain-text run to anchor the placeholder to). Fixed by stripping the leading placeholder token (the referenced node stays in its original tree position regardless of whether a placeholder token names it in the entry string)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `__dirname` ReferenceError under ESM/tsx**
- **Found during:** Task 1, first script invocation
- **Issue:** Script used bare `__dirname`, which is not defined in ES module scope; `tsx` runs `.ts` files as ESM
- **Fix:** Added `const __dirname = path.dirname(fileURLToPath(import.meta.url))`
- **Files modified:** `scripts/humanize-posts-batch-04.ts`
- **Verification:** Script runs without the ReferenceError
- **Committed in:** `930be01`

**2. [Rule 1 - Bug] Fixed inherited VOCEO_RE false positive**
- **Found during:** Task 1, first live write attempt (post 23 es failed self-check on "mira")
- **Issue:** `mir[aá]` matched both accented "mirá" (voceo) and unaccented "mira" (standard tuteo/impersonal verb form), causing a real post's rewritten content to fail its own em-dash/voceo self-check even though it contained zero actual voceo
- **Fix:** Narrowed the regex to `mirá` only (matches the plan's own literal marker list, which specifies "mirá" not "mira")
- **Files modified:** `scripts/humanize-posts-batch-04.ts`
- **Verification:** Re-run completed posts 23-27 successfully with correct self-check results
- **Committed in:** `930be01`

**3. [Rule 1 - Bug] Repaired ~35 leading-placeholder segment mismatches in the authored content data**
- **Found during:** Task 1, pre-write dry-run validation (a temporary, deleted-after-use validator script)
- **Issue:** The prior agent's authored content used a `⟦L⟧`/`⟦K⟧` placeholder scheme to mark link/formatted-text positions within a rewritten sentence, but ~35 entries placed a placeholder at the very start of the string even though the actual Lexical node's first child WAS that link/formatted node (no leading plain-text run exists in the tree for the placeholder to "attach" to). This made the tree walker's segment-count invariant unsatisfiable and would have thrown mid-write.
- **Fix:** Stripped the leading placeholder token from each affected entry (the referenced formatted/link node stays in its original tree position automatically — the token was purely a human-readability marker, not structurally required)
- **Files modified:** `scripts/data/humanize-posts-batch-04-content.json`
- **Verification:** Dry-run validator reported 0 errors across all 14 (post × locale) combinations before the real run
- **Committed in:** `930be01`

**4. [Rule 2 - Missing Critical] Removed 3 residual AI-cliché markers from a nested FAQ block's answer text**
- **Found during:** Post-write spot-check (live read-back of posts 21/25/27, per the user's explicit ask to verify the exact ids previously flagged)
- **Issue:** Posts 24 and 25 embed an FAQ-type `block` node (`fields.faqs[].answer`, its own nested richText tree) inside `content`. The main rewrite correctly treats all `type: 'block'` nodes as opaque per the plan's `<interfaces>` pattern (protects code-sample embeds) — but this meant the FAQ block's own prose, which renders as real page content, was left completely untouched and still carried "es fundamental" / "crucial"
- **Fix:** Wrote a narrow, scoped follow-up patch that locates the exact FAQ answer text nodes by id and does a targeted string replacement, leaving the question text, other FAQ entries, and the rest of the block's structure untouched
- **Files modified:** none tracked in git (direct DB write via a temporary script, deleted after use — matches this task's scope of a content-only field update, no schema change)
- **Verification:** Live re-scan of all 7 posts' FAQ blocks (both locales) confirms zero remaining cliché markers, em dashes, or voceo
- **Committed in:** n/a (production DB write only, no code artifact to commit beyond what's already in `930be01`)

---

**Total deviations:** 4 auto-fixed (2 bug fixes to inherited tooling, 1 content-data repair, 1 missing-critical-content fix)
**Impact on plan:** All four were necessary for the plan's own success criteria (zero em dash/voceo, code/table byte-identical, genuinely rewritten voice). No scope creep — the FAQ fix in particular was deliberately kept minimal (3 sentences patched, not a full FAQ-block rewrite) since the plan's `<must_haves>` explicitly scope this batch to the `content` field's prose.

## Issues Encountered
- A previous agent attempt on this exact plan crashed mid-execution (session limit) before making any DB write, but had left a nearly-complete script and a substantial (133KB) hand-authored content JSON on disk. Resumed from that state after confirming via live spot-check (per the task prompt) that the crash left zero DB-level trace, then completed, validated, and fixed the inherited work rather than discarding it.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Posts ids 21-27 are done; combined with prior batches (per STATE.md / other concurrent batch plans in this wave), the Posts sweep for Phase 31 continues toward full completion
- Ready for 31-16 (post-sweep-phase31 snapshot) and 31-17 (final verification) once all batch plans in this phase complete
- No blockers

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*

## Self-Check: PASSED
- FOUND: scripts/humanize-posts-batch-04.ts
- FOUND: scripts/data/humanize-posts-batch-04-content.json
- FOUND: .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-05-SUMMARY.md
- FOUND commit: 930be01
