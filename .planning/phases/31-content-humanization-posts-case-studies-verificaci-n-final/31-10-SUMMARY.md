---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 10
subsystem: content
tags: [payload, lexical, richtext, seo, i18n, humanization]

requires:
  - phase: 29-content-humanization-safety-net
    provides: research/voice-sample-juan.md and 29-VOICE-PROFILE.md (authoritative voice calibration)
provides:
  - "Posts ids 50,51,52,53,54 (robots-txt-best-practices, core-web-vitals-guide, web-performance-guide, tech-seo-guide, non-developers-guide) rewritten in Juan's voice, both locales"
  - "scripts/humanize-posts-batch-09.ts — checkpointed tree-rewrite script, corrected and verified byte-identical to live production content"
affects: [31-16 (post-sweep snapshot/verification), 31-17 (milestone close, Lighthouse gate on /en/blog/tech-seo-guide = post 53)]

tech-stack:
  added: []
  patterns:
    - "Link-boundary space integrity check: after any positional in-place Lexical rewrite that leaves link/bold nodes untouched, explicitly verify no text/link node boundary lost its space character (word-char-adjacency check on both sides of every `link` node) — a silent, non-obvious failure mode where the tree is structurally valid and passes byte-identity checks on frozen nodes, but renders as merged/garbled prose"

key-files:
  created:
    - scripts/humanize-posts-batch-09.ts
  modified:
    - scripts/humanize-posts-batch-09.ts (space-boundary fix applied to 56 REWRITES entries, see Deviations)

key-decisions:
  - "Did not trust the crashed prior session's checkpoint (all 5 ids marked 'done') at face value — ran an independent, code-level verification pass before accepting any post as actually complete, per the explicit instruction not to trust the checkpoint blindly"
  - "Patched production directly first (fastest path to correct live content), then back-ported the identical fix into the script's REWRITES arrays and proved equivalence via a full checkpoint reset + re-run producing byte-identical output — rather than hand-editing 56 long string literals and hoping they matched what was already live"
  - "Logged the pre-existing 'See Also' heading duplication found in post 53's es locale to deferred-items.md instead of fixing it — it predates this batch (not present in the REWRITES data), and restructuring it is an architectural/content-shape change outside this plan's declared scope"

requirements-completed: [VOICE-06]

coverage:
  - id: D1
    description: "Posts ids 50,51,52,53,54 content field rewritten in Juan's voice, es and en locales, zero em dash / zero voceo in es, code-block and table nodes byte-identical pre/post write, zero link-boundary text-merge bugs"
    requirement: VOICE-06
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-09.ts (full checkpoint-reset re-run: 5/5 self-check passed; independent link-boundary/em-dash/voceo scan: 0 findings; byte-identical diff against pre-reset production content)"
        status: pass
    human_judgment: false

duration: ~90min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 10: Humanize Posts batch 9 (ids 50-54) Summary — crash recovery + bug fix

**Recovered a crashed prior session's uncommitted work, found and fixed 37 real link-boundary text-merge bugs (missing spaces around inline links, e.g. "estrategia deSEO de cualquier sitio") across all 5 posts/both locales, and proved the corrected script reproduces byte-identical live content.**

## Performance

- **Duration:** ~90 min
- **Completed:** 2026-07-17T05:04:19Z
- **Tasks:** 1 (single-task plan) + recovery/verification work
- **Files modified:** 1 (`scripts/humanize-posts-batch-09.ts`), plus 5 Posts documents in production Neon (content field, both locales, patched twice: once directly, once via full script re-run to prove source/production parity)

## Accomplishments

- Verified the crashed prior session's claim ("all 5 posts done") was **partially wrong**: the script and checkpoint existed on disk and content had genuinely been written to production, but a spot-check (per the task's explicit instruction) surfaced a real bug rather than a diagnostic artifact — text segments adjacent to `link` nodes across the entire batch were missing the space character that belongs at the text/link boundary.
- Ran a systematic, code-level audit (not just eyeballing rendered text) of every `link` node boundary in all 5 posts' both locales — found **37 merge points** producing garbled concatenations live in production: `"estrategia deSEO de cualquier sitio"`, `"en laGoogle Search Console"`, `"usarherramientas de auditoríaSEO"`, `"Building aXML sitemapthat sends crawlers"`, and 33 more across posts 50-54.
- Patched all 37 points directly against production Neon (56 individual space insertions — several link nodes needed a fix on both sides), then re-verified: zero remaining merge issues, zero em dash, zero voceo, across all 5 posts/both locales.
- Synced the identical 56 fixes into `scripts/humanize-posts-batch-09.ts`'s `REWRITES` arrays (via a dedicated line-aware patch script, not manual string edits, to avoid transcription errors across ~700 array elements with duplicate content like bare `'El'`).
- Proved script/production parity the hard way: reset the checkpoint to empty, re-ran the full script from scratch against production, and diffed the resulting live content against the pre-reset (already-patched) content — **byte-identical** (only the Node process PID in an unrelated warning line differed). This confirms the committed script is now the true, reproducible source of what's live.
- Confirmed post 53 (`tech-seo-guide`, the exact route `/en/blog/tech-seo-guide` this phase's Lighthouse gate measures) has intact heading hierarchy in both locales — no headings added, removed, or reordered by any of the fixes (only text within existing text nodes was touched).
- Found and deferred (not fixed, out of scope) a pre-existing structural anomaly: post 53's `es` locale content ends with a `Ver también` heading followed by 4 additional duplicate `"See Also"` (English, untranslated) headings, each with one related-link listitem. Confirmed this predates the batch (none of those strings appear in `REWRITES`) and does not affect the Lighthouse-gate `en` route, which has a single clean `See Also` section. Logged to `deferred-items.md`.
- Deleted two leftover temp scripts from the crashed session (`scripts/dump-posts-batch-09.ts`, `scripts/extract-posts-batch-09.ts`) — both self-documented as "TEMP... delete after use" and not part of this plan's deliverables, matching the convention established by sibling batch plans (only the single `humanize-posts-batch-NN.ts` file is committed).

## Task Commits

1. **Task 1: Humanize Posts batch 9 (ids 50,51,52,53,54) — recovery + link-boundary bug fix** - `cfa3267` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `scripts/humanize-posts-batch-09.ts` - Idempotent, checkpointed rewrite script for this batch's 5 posts, both locales; `REWRITES` arrays corrected so 56 previously-merged link-boundary text segments now carry the correct leading/trailing space.
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-09.json` (generated, gitignored) - checkpoint log, all 5 ids `'done'` (re-earned via a genuine full re-run after reset, not just left over from the crashed session).
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/deferred-items.md` - new file, logs the post 53 `es`-locale duplicate "See Also" heading anomaly for future follow-up.
- Production Neon: `posts.content` (jsonb, richText) for ids 50, 51, 52, 53, 54, both `es` and `en` locale columns.

## Before/After Samples (the bug this plan fixed)

**Post 50 (robots-txt-best-practices), es, opening paragraph — the exact bug Juan spot-checked:**
- Before (live, from crashed session): `"El archivo robots.txt es una pieza clave en la estrategia de[SEO] de cualquier sitio."` → rendered as `"...estrategia deSEO de cualquier sitio."` (merged "de"+"SEO", read by a link-stripping diagnostic as duplicated "de de")
- After: `"El archivo robots.txt es una pieza clave en la estrategia de [SEO] de cualquier sitio."` → renders correctly as `"...estrategia de SEO de cualquier sitio."`

**Post 51 (core-web-vitals-guide), es — a 3-way link chain that needed 2 separate space fixes:**
- Before: `"...por qué le importan tanto al[SEO]y cómo optimizar..."` → `"tanto alSEO y cómo optimizar"` merged, plus a further missing leading space after the link
- After: `"...por qué le importan tanto al [SEO] y cómo optimizar..."`

**Post 53 (tech-seo-guide), es — heading-adjacent link with double-sided merge:**
- Before: `"El[SEO técnico]es la disciplina..."` → rendered `"ElSEO técnicoes la disciplina"`
- After: `"El [SEO técnico] es la disciplina que se encarga de..."`

## Decisions Made

- **Did not trust "done" status in the checkpoint file.** The task instructions were explicit that a crashed session's checkpoint claiming completion should not be accepted at face value. Rather than re-authoring content from scratch, the priority was verifying what was actually live, which surfaced the real bug within the first live document read.
- **Built a code-level link-boundary checker instead of relying on visual/manual proofreading.** With ~700 text segments across 5 posts x 2 locales, eyeballing rendered paragraphs would have missed most of the 37 instances (they're not word-repeats a simple regex catches — a link with different text sits between the two abutting words). A dedicated walker that inspects every `link` node's immediate text siblings for a missing space at the word-character boundary found all 37 deterministically.
- **Fixed production directly, then made the script match — not the other way around.** Reconstructing 56 precise edits inside ~700 long, sometimes-duplicate string literals by hand risked introducing new transcription errors (exactly the failure mode that likely caused the original bug). Patching the live Lexical trees programmatically by segment index was safer and immediately verifiable via the script's own self-check. The script source was then updated to match using the same index-based patch logic (applied to the `.ts` array literals via a dedicated tokenizer-free line patcher, since element order/quoting style — mixed single/double quotes depending on internal apostrophes — made blind string-replace unsafe for a duplicate-content-heavy array).
- **Proved parity with a full reset-and-rerun rather than trusting the two patch passes matched.** Emptying the checkpoint and letting the corrected script rewrite all 5 posts from scratch, then diffing the resulting content against what was already live, is a stronger guarantee than assuming two independently-run patch scripts produced identical output — and it did (byte-identical).
- **Left the post 53 `es` "See Also" duplication alone.** None of the affected heading/listitem strings are present in `REWRITES`, confirming the anomaly existed before this batch (and before the crashed session) ran. Fixing it would mean removing/merging Lexical nodes — a structural change this plan's `<threat_model>` explicitly scopes out (T-31-04: never touch structure, only rewrite prose text-node values in place).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 37 link-boundary text-merge bugs (56 missing-space insertions) across all 5 posts, both locales**
- **Found during:** Post-recovery spot-check verification (per explicit task instruction not to trust the crashed session's "done" checkpoint blindly)
- **Issue:** Text segments immediately before and/or after `link` nodes were missing the space character that belongs at the text/link boundary in the original Lexical tree — likely introduced when the crashed prior session hand-authored the `REWRITES` array text without accounting for the space living inside the *adjacent* text node rather than the link's own label. This produced garbled, merged words when the content actually rendered (e.g. `"estrategia deSEO"`, `"en laGoogle Search Console"`, `"usarherramientas de auditoríaSEO"`), live in production, across all 5 posts.
- **Fix:** Built a code-level checker that walks every `heading`/`paragraph`/`listitem` container, inspects the immediate text siblings of every `link` node, and flags any word-character-to-word-character adjacency with no space. Found and fixed all 37 instances (56 total space insertions, several links needed both sides fixed) — first directly against production via a targeted index-based patch script, then synced identically into `scripts/humanize-posts-batch-09.ts`'s `REWRITES` arrays.
- **Files modified:** `scripts/humanize-posts-batch-09.ts`; production Neon `posts.content` for ids 50, 51, 52, 53, 54 (both locales)
- **Verification:** Independent link-boundary scan returns zero findings after the fix; full checkpoint reset + script re-run reproduces byte-identical content to the directly-patched version; script's own self-check (em dash, voceo, block/table byte-identity) passes for all 5 posts.
- **Committed in:** `cfa3267` (Task 1 commit)

**2. [Rule 3 - Scope boundary, deferred not fixed] Logged pre-existing "See Also" heading duplication in post 53's es locale**
- **Found during:** Heading-structure verification of post 53 (the Lighthouse-gate route)
- **Issue:** Post 53's `es` locale content ends with a `Ver también` heading + related-links list, followed by 4 additional duplicate headings literally reading `"See Also"` (English, untranslated), each with a single related-link listitem. Not present in `en` locale (single clean section there).
- **Fix:** Not fixed — confirmed via `REWRITES` cross-reference that none of this text was ever part of any humanization batch's editable content (it predates this plan and the crashed session), so it's out of this plan's scope (voice/prose rewrite only, no structural changes per `<threat_model>` T-31-04). Logged to `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/deferred-items.md` for a future dedicated content-structure fix.
- **Files modified:** `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/deferred-items.md` (new)
- **Verification:** N/A (deferred, not fixed) — confirmed it does not affect the `en`-locale Lighthouse-gate route.
- **Committed in:** `cfa3267` (Task 1 commit)

---

**Total deviations:** 2 (1 Rule-1 bug fix affecting all 5 posts/both locales, 1 scope-boundary deferral logged for follow-up)
**Impact on plan:** The Rule 1 fix was essential — without it, all 5 posts would have shipped with dozens of visibly garbled/merged words in live production content, defeating the purpose of a voice-humanization pass. No scope creep: the fix only restored the space character that should already have been present per the plan's own in-place rewrite pattern; no new prose was written beyond what the crashed session had already authored. The deferred item was correctly left alone rather than expanded into a structural content fix outside this plan's stated boundaries.

## Known Stubs / Deferred Items

- **Post 53 (`tech-seo-guide`) `es` locale has a duplicated "See Also" related-links section** (4 extra English-heading link cards after the normal `Ver también` section). Pre-existing, not caused by this batch. See `deferred-items.md`. Does not affect the `en`-locale Lighthouse-gate route.

## Issues Encountered

- The crashed prior session left a plausible-looking but incomplete checkpoint (`{"50":"done", ..., "54":"done"}`) with no indication that live content had a rendering-level defect — the script's own self-check (em dash / voceo / block-table byte-identity) does not test for link-boundary spacing, so it could not have caught this class of bug on its own. Resolved by building an independent, purpose-built verification tool rather than trusting the existing self-check's scope.

## Next Phase Readiness

- Batch 9 of 13 in Phase 31's Posts sweep is complete and verified; ids 50-54 need no further action from this plan.
- **Recommend**: `31-16` (post-sweep snapshot/final verification) or a dedicated follow-up should run a link-boundary space check (the technique built in this plan) across the OTHER batches (1-8, 10-13) too — the same authoring pattern (crashed or not) may have produced the same class of bug elsewhere, and it would not be caught by any existing self-check in this phase.
- `31-17`'s Lighthouse gate on `/en/blog/tech-seo-guide` (post 53) is unaffected by the deferred "See Also" duplication (that's `es`-locale only) and can proceed against the now-corrected `en` content.
- No blockers for sibling batch plans — this plan touched only ids 50-54, disjoint from all other batches per the plan's design.

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*

## Self-Check: PASSED

- FOUND: `scripts/humanize-posts-batch-09.ts`
- FOUND: `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-09.json` (checkpoint: `{"50":"done","51":"done","52":"done","53":"done","54":"done"}`)
- FOUND: `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/deferred-items.md`
- FOUND: commit `cfa3267` in `git log --oneline --all`
