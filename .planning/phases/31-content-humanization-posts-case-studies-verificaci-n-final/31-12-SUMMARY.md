---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 12
subsystem: content
tags: [payload, lexical, richtext, seo, i18n, humanization]

requires:
  - phase: 29-content-humanization-safety-net
    provides: research/voice-sample-juan.md and 29-VOICE-PROFILE.md (authoritative voice calibration)
provides:
  - "Posts ids 61,62,63,64,65 (guia-keyword-research, estrategia-topic-clusters, enlaces-internos-guia, guia-eeat, programacion-dinamica) rewritten in Juan's voice, both locales"
  - "scripts/humanize-posts-batch-11.ts — checkpointed, positional-index tree-rewrite script for this batch's 5 posts, both locales"
affects: [31-16 (post-sweep snapshot/verification), 31-17 (milestone close)]

tech-stack:
  added: []
  patterns:
    - "Positional REWRITES[id][locale][blockIndex] map (index-aligned to a document-order heading/paragraph/listitem tree walk) with original link nodes spliced back in by locating verbatim anchor text inside the new string — avoids retyping/dropping links while still doing a full-string prose rewrite per block"
    - "Two-tier self-check on every write: (1) structural byte-identity diff of every block/table node pre vs post write, checked before marking an id 'done'; (2) a final em-dash/voceo regex pass across all 5 posts after the whole batch completes"

key-files:
  created:
    - scripts/humanize-posts-batch-11.ts
  modified:
    - scripts/humanize-posts-batch-11.ts (post-recovery QA patch — see Deviations)

key-decisions:
  - "Did not trust the prior crashed attempt's checkpoint file (all 5 ids marked 'done') at face value — re-ran the idempotent script and additionally ran a standalone live-content cliché scan across all 5 posts before treating the plan as actually complete, per explicit instruction not to trust a checkpoint left by a session that crashed before this agent could observe its own commit"
  - "Distinguished genuine AI-tell clichés in rewritten prose from incidental substring matches inside untouched table cells (e.g. 'Ingredientes Esenciales' triggering an 'es esencial' regex hit) — verified each hit's block type/index live before deciding whether to patch, so table data stayed byte-identical as the plan requires"

requirements-completed: [VOICE-06]

coverage:
  - id: D1
    description: "Posts ids 61,62,63,64,65 content field rewritten in Juan's voice, es and en locales, zero em dash / zero voceo / zero named AI-tell clichés in prose, code-block and table nodes byte-identical pre/post write"
    requirement: VOICE-06
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-11.ts (final run: 5/5 already done, zero em-dash/voceo findings, exit 0); standalone live regex scan of all 5 posts' prose blocks (heading/paragraph/listitem only, tables excluded) for 'es esencial'/'es fundamental'/'es vital'/'juega un papel'/'no solo...también|sino'/'plays a crucial role'/'cabe destacar' returns zero hits in rewritten prose"
        status: pass
    human_judgment: false

duration: ~90min (recovery session)
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 12: Humanize Posts batch 11 (ids 61-65) Summary

**Recovered a crashed prior attempt on this exact batch — re-verified all 5 posts instead of trusting the "done" checkpoint, found 11 residual AI-tell clichés the prior authoring had missed, fixed and re-wrote them against production Neon, and confirmed a clean final state.**

## Performance

- **Duration:** ~90 min (recovery + independent verification session)
- **Completed:** 2026-07-17T05:04:59Z
- **Tasks:** 1 (single-task plan)
- **Files modified:** 1 (`scripts/humanize-posts-batch-11.ts`), plus 5 Posts documents in production Neon (content field, both locales)

## Accomplishments

- Read the existing `scripts/humanize-posts-batch-11.ts` (left on disk, uncommitted, by a prior agent attempt that crashed mid-session before committing) in full and confirmed its design matches the plan: fetches ids `[61,62,63,64,65]` via `locale: 'all'`, walks each locale's `content` Lexical tree, rewrites only `heading`/`paragraph`/`listitem` prose text via a positional `REWRITES[id][locale][blockIndex]` map, splices original link nodes back in by locating their anchor text verbatim inside the new string, writes back per locale, reads back to self-check block/table structural byte-identity, and only then marks the id `'done'` in the gitignored checkpoint file.
- Did **not** trust the checkpoint file's claim that all 5 ids were already `'done'`. Re-ran the script (idempotent, all 5 skip-as-done on a clean re-run, final self-verification pass runs regardless), then ran an independent, standalone live-content scan against production for the exact AI-tell phrases named in the task instructions plus a broader named-cliché list from the phase's own precedent (`31-09`'s deviation log).
- Found and fixed **11 residual AI-tell clichés** the prior authoring session had left in the `REWRITES` text across posts 61, 62, 63, 64, 65 (es and en): "es esencial"/"es fundamental" cliché openers (4 instances), "juega un papel crucial" (1), formulaic "no solo X, también/sino Y" pairs (8, es), and English "plays a crucial role" (2, en, post 64). None of these were caught by the script's own automated self-check, which only tests em dash and voceo markers — exactly the gap the task instructions flagged.
- Two of the found "es esencial"/"es fundamental" matches were investigated and confirmed **false positives**: one inside a table cell title ("Ingredientes Esenciales de la Gastronomía Mexicana", post 62) correctly left byte-identical per the plan's table-preservation rule, and one requiring the fix was a genuine prose paragraph (post 65, block index 39) that had never been part of the original `REWRITES` scope — added and rewritten.
- Iteratively re-ran the script against real production Neon after each round of fixes (reset only the affected ids' checkpoint entries each time, left unaffected ids as `'done'` to avoid redundant writes), ending in a final run where all 5 ids show `'done'`, the script's own em-dash/voceo self-check passes with zero findings, and a final independent broad-pattern scan restricted to actual prose blocks (excluding tables) returns zero genuine cliché hits.
- Cleaned up 4 leftover `scripts/_tmp-*-batch11.ts` scratch/authoring files from the crashed prior attempt (each self-documented as `TEMPORARY ... Deleted after use` in its own header comment) — not part of this plan's declared output.

## Task Commits

1. **Task 1: Humanize Posts batch 11 (ids 61,62,63,64,65)** - `d79511f` (feat)
2. **Concurrency correction** - `cbdcc0d` (fix) — see Issues Encountered

**Plan metadata:** (this commit)

## Files Created/Modified

- `scripts/humanize-posts-batch-11.ts` - Idempotent, checkpointed rewrite script for this batch's 5 posts, both locales; the `REWRITES` map is the source of truth for exactly which prose blocks were rewritten (and their final, cliché-corrected text) vs. left untouched.
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-11.json` (generated, gitignored) - checkpoint log, all 5 ids `'done'`.
- Production Neon: `posts.content` (jsonb, richText) for ids 61, 62, 63, 64, 65, both `es` and `en` locale columns.

## Before/After Samples (clichés found during recovery, not in the original authoring)

**Post 62 (estrategia-topic-clusters), es, block idx 40:**
- Before: "Enlazar bien el contenido pilar con las páginas de soporte **es esencial** para que la estrategia de topic clusters funcione."
- After: "Si no enlazas bien el contenido pilar con las páginas de soporte, la estrategia de topic clusters simplemente no funciona."

**Post 63 (enlaces-internos-guia), es, block idx 0 (opening paragraph):**
- Before: "Los enlaces internos son una pieza esencial en la estructura de cualquier sitio... En este artículo te muestro cómo implementarlos bien, **no solo para el SEO, sino también** para mejorar de verdad la experiencia del usuario."
- After: "Los enlaces internos sostienen la estructura de cualquier sitio... En este artículo te muestro cómo implementarlos bien, tanto para el SEO como para mejorar de verdad la experiencia del usuario."

**Post 64 (guia-eeat), en, block idx 4:**
- Before: "In SEO terms, E-E-A-T **plays a crucial role** in how well a site ranks on the SERPs."
- After: "In SEO terms, E-E-A-T shapes how well a site ranks on the SERPs."

**Post 65 (programacion-dinamica), es, block idx 39 (not in the original REWRITES scope — found during recovery verification):**
- Before: "Aunque Dijkstra es un algoritmo voraz, la Programación Dinámica **es fundamental** en problemas de caminos más cortos cuando hay pesos negativos..."
- After: "Aunque Dijkstra es un algoritmo voraz, la Programación Dinámica entra en juego en problemas de caminos más cortos cuando hay pesos negativos..."

## Decisions Made

- **Treated the crashed-session checkpoint as unverified, not as ground truth.** The task instructions were explicit that a checkpoint left by a session that crashed before committing must not be trusted blindly. Rather than spot-checking a sample and moving on, ran the full idempotent script (which re-validates structure on every write and re-runs the em-dash/voceo check regardless of prior "done" state) and then layered an independent, standalone regex scan against live production content for the exact clichés named in the task instructions — this is what actually surfaced the 11 residual issues, none of which the script's own built-in self-check would have caught.
- **Distinguished real prose clichés from table-cell substring false positives before patching anything.** A naive full-text regex scan flags "es esencial" inside "Ingredientes **Es**enciales" (word-boundary artifact from concatenated table cell text). Before touching any content, resolved each hit's exact block type/index live against the document tree and only patched genuine `heading`/`paragraph`/`listitem` prose — tables stayed byte-identical, consistent with the plan's hard "table structure and cell data unchanged" requirement.
- **Iterative reset-and-rerun instead of a single big rewrite.** Rather than hand-editing the live database directly, each fix was made in `REWRITES` (the script's source of truth), only the affected id's checkpoint entry was reset, and the idempotent script was re-run to write the corrected text and re-validate structural safety — keeping the script itself as the durable, re-runnable record of what's live, matching the pattern this plan's `<interfaces>` and sibling batch `31-09` established.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 11 residual AI-tell clichés left in the prior crashed-session authoring**
- **Found during:** Post-recovery independent verification (before trusting the plan as complete)
- **Issue:** The script's automated self-check only tests em dash and voceo markers — it never tested for the other AI-tell phrases the task instructions explicitly named as things to check for ("es esencial"/"es fundamental"). A live scan of all 5 posts' actual production content found "es esencial"/"es fundamental" cliché openers (4 instances, posts 61/62/63), "juega un papel crucial" (1, post 62), formulaic "no solo X, también/sino Y" pairs (8, posts 61/62/63/65 es), and "plays a crucial role" (2, post 64 en) — genuine unrewritten or newly-reintroduced AI-sounding prose that had slipped through the original authoring pass.
- **Fix:** Authored voice-calibrated replacements for all 11 (facts, numbers, tool names preserved exactly; tuteo maintained; mixed sentence rhythm), applied them via iterative `payload.update` runs against live production content, keeping `scripts/humanize-posts-batch-11.ts`'s `REWRITES` table as the single source of truth so the checked-in script reproduces the corrected text on any future re-run, not the original cliché-laden prose.
- **Files modified:** `scripts/humanize-posts-batch-11.ts` (11 `REWRITES` entries, including one new block index — post 65 `es` idx 39 — added to the map), production Neon `posts.content` for ids 61, 62, 63, 64, 65
- **Verification:** Live regex re-scan of all 5 posts' extracted prose text (headings/paragraphs/listitems only, tables excluded from the scan) for every named phrase returns zero genuine hits; the one remaining raw-text regex match ("es esencial" inside a post-62 table cell, "Ingredientes Esenciales...") was confirmed to be inside an untouched `table` node, correctly left byte-identical; final script run reports `5/5 done, zero em-dash/voceo findings` (exit 0), and the script's own structural self-check passed on every write (no `FAIL — block/table structure changed` was logged).
- **Committed in:** `d79511f` (Task 1 commit)

**2. [Rule 3 - Blocking] Cleaned up leftover scratch/authoring scripts from the crashed prior attempt**
- **Found during:** Pre-commit `git status` review
- **Issue:** 4 files (`scripts/_tmp-dump-posts-batch11.ts`, `_tmp-extract-batch11.ts`, `_tmp-extract-blocks-batch11.ts`, `_tmp-extract-blocks-links-batch11.ts`) were left untracked on disk by the crashed prior session — each self-documented in its own header comment as `TEMPORARY ... Deleted after use`, and none are part of this plan's declared output (`files_modified` only lists the main script and the gitignored checkpoint).
- **Fix:** Deleted all 4; verified via `git status` they were untracked (never committed) before removal.
- **Files modified:** none tracked (scratch files only)
- **Committed in:** n/a (deleted before staging, never entered git history)

## Issues Encountered

**Concurrency: another agent's untracked files got accidentally staged into this plan's commit.** Six other agents were running the same recovery pattern concurrently on disjoint batches in the same working tree (per the task's explicit context). After `git add scripts/humanize-posts-batch-11.ts` and `git commit`, the resulting commit unexpectedly also included `scripts/_extra-rewrites-batch-01.json` and `scripts/humanize-posts-batch-01.ts` — files belonging to a concurrent agent's batch-01 work that must have been staged by a `git add` race between my `add` and `commit` calls. Caught immediately via `git show --stat HEAD` on the fresh commit. Fixed with a follow-up commit (`cbdcc0d`) that ran `git rm --cached` on the two batch-01 files (untracking them, not deleting their on-disk content) so the other agent's in-progress work was left completely intact for them to commit themselves. Final tracked-tree state is correct: `scripts/humanize-posts-batch-11.ts` committed, batch-01 files back to untracked.

## Next Phase Readiness

- Batch 11 of 13 in Phase 31's Posts sweep is complete; ids 61-65 need no further action from this plan.
- `31-16` (post-sweep snapshot/final verification) should include ids 61-65 in its scope.
- No blockers for sibling batch plans — this plan touched only ids 61-65, disjoint from all other batches per the plan's design. Note for whichever agent runs `31-16` or a future audit: given this recovery found 11 clichés the *original* authoring of batch 11 missed despite passing its own automated self-check, other already-completed batches (per their own SUMMARY.md deviation logs, e.g. `31-09`) show the same class of gap was independently found and fixed there too — worth a dedicated cliché-regex sweep across all completed batches before `31-17` (milestone close) if one hasn't already run.

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*

## Self-Check: PASSED

- FOUND: `scripts/humanize-posts-batch-11.ts`
- FOUND: `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-11.json` (checkpoint: `{"61":"done","62":"done","63":"done","64":"done","65":"done"}`)
- FOUND: commit `d79511f` in `git log --oneline --all`
- FOUND: commit `cbdcc0d` in `git log --oneline --all`
