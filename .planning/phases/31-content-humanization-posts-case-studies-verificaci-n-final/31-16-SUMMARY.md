---
phase: 31-content-humanization-posts-case-studies-verificaci-n-final
plan: 16
subsystem: content
tags: [payload-local-api, richtext-lexical, content-humanization, i18n, es, en, seo, verification]

# Dependency graph
requires:
  - phase: 31-02
    provides: Posts batch 1 humanization (and 31-03 through 31-14, all 13 Posts batches, ids 2-73)
  - phase: 31-15
    provides: CaseStudies clientContext/conclusion humanization (7 docs)
provides:
  - "post-sweep-phase31-final content snapshot — proves zero doc-count drift across the full Track B span (Phase 30 + 31)"
  - "scripts/diff-humanization-snapshots.ts — reusable snapshot-to-snapshot diff tool"
  - "31-HISTORICAL-DIFF.md — full before/after picture for Juan, both this-phase-only and full-milestone"
  - "verify-locale-parity.ts extended to posts/case-studies, with a real detection-bug fix"
  - "verify-live-jsonld-meta.mjs extended with dynamic sitemap-based route discovery, covering all live Track B routes"
  - "Systematic content-quality sweep across all 72 posts + 7 case-studies: 1 link-fusion bug, 59 AI-cliché fields, 14 title locale-mixups found and fixed"
affects: [31-17-milestone-close]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Snapshot diff tool: recursive {es,en}-shape walk (same pattern as verify-locale-parity.ts), extended to accept 1-or-2-key localized-field shapes since Payload omits an entirely-unpopulated locale's key rather than writing null"
    - "Dynamic route discovery from live /sitemap.xml (regex-parsed <url>/<xhtml:link> blocks) merged with a hardcoded static-route list, instead of hand-maintaining ~160 route entries"
    - "Content-quality sweep as a 4-category systematic scan (link-fusion, AI-cliché markers, locale-mixup stopword heuristic, LLM-refusal strings) run across the full corpus rather than trusting per-batch self-checks"

key-files:
  created:
    - scripts/diff-humanization-snapshots.ts
  modified:
    - scripts/verify-locale-parity.ts
    - scripts/verify-live-jsonld-meta.mjs
    - .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-HISTORICAL-DIFF.md
    - .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/deferred-items.md

key-decisions:
  - "Fixed a real bug in isLocalizedPair() (both the new diff tool and verify-locale-parity.ts): Payload omits an entirely-missing locale's key from a locale:'all' read rather than returning null, so the original exactly-2-keys check silently skipped these fields — undercounting the diff tool's changed-doc count (64/72 instead of 72/72 on first run) and making verify-locale-parity.ts structurally unable to ever catch a doc missing one locale entirely. Fixed to accept any 1-or-2-key {es}/{en}/{es,en} shape."
  - "Fixed 6 posts' excerpt-only locale gap (title+content already bilingual, excerpt empty in one locale) and Footer.dynamicColumns[].title's missing es values via Local API — both small, bounded, in-existing-scope fixes (Rule 2), not the larger translation-authorship gap"
  - "Did NOT author full English translations for the 8 posts confirmed to have zero EN content at all (title/excerpt/content all missing) — same Rule-4 boundary two sibling batch agents (31-02, 31-11) already established; flagged as a follow-up translation-authoring plan, not silently expanded into this verification plan's scope"
  - "Ran Juan's explicitly-requested systematic content-quality sweep across ALL 72 posts + 7 case-studies (not just the plan's original scope) for: link-boundary space-fusion, residual AI-cliché phrases, locale mixups, and literal LLM-refusal strings. Found and FIXED all real instances (1 fusion bug, 59 cliché fields, 14 title mixups, 0 refusal strings) rather than deferring to a future TODO, per Juan's explicit instruction."
  - "Distinguished title-level locale mixups (small, bounded, safely fixable — 14 posts) from whole-document missing-locale gaps (large, translation-authorship scope — 8 posts, deferred). Preserved every post's existing slug explicitly during title fixes, since Payload's slugField hook only regenerates from title when its own value is omitted/falsy."
  - "Discovered and documented (not fixed) that 6 Posts + 6 Case Studies are pre-existing unpublished drafts, confirmed unchanged since before Phase 30 — explains why the live JSON-LD sweep covers 134 dynamic routes instead of the plan's ~162 estimate. Publishing content is an editorial decision outside this verification plan's scope."
  - "Hardcoded the 4 blog/case-studies index routes (/blog, /en/blog, /case-studies, /en/case-studies) in verify-live-jsonld-meta.mjs's ROUTES constant rather than relying on dynamic sitemap discovery, since these are static listing pages with no backing document and never appear in the doc-driven sitemap.xml"

requirements-completed: [VOICE-07]

coverage:
  - id: D1
    description: "post-sweep-phase31 snapshot captured with posts.count===72 and case-studies.count===7, matching pre-sweep exactly; diff-humanization-snapshots.ts confirms zero doc-count drift in both this-phase-only and full-Track-B-history comparisons"
    requirement: "VOICE-07"
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/diff-humanization-snapshots.ts --before pre-sweep-phase31-*.json --after post-sweep-phase31-final-*.json (RESULT: OK, no count mismatches)"
        status: pass
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/diff-humanization-snapshots.ts --before pre-sweep-phase30-*.json --after post-sweep-phase31-final-*.json (RESULT: OK, no count mismatches)"
        status: pass
    human_judgment: false
  - id: D2
    description: "verify-locale-parity.ts extended to include posts/case-studies; running it reports 23 asymmetric failures, all confirmed pre-existing (8 posts with zero English content, predating Phase 30) — zero failures attributable to Phase 31's own writes"
    requirement: "VOICE-07"
    verification:
      - kind: other
        ref: "node --env-file=.env node_modules/.bin/tsx scripts/verify-locale-parity.ts (exit 1, 23 failures — all cross-referenced against pre-existing snapshots and 31-02/31-11 batch summaries)"
        status: pass
    human_judgment: true
    rationale: "The script's literal exit code is FAIL (23 pre-existing asymmetric gaps from 8 posts with zero English content authored since before Phase 30) — this is an intentional, investigated, documented exception (Rule 4 scope boundary: translation authorship, not a voice-rewrite regression), not a clean PASS. Juan should confirm this is acceptable before the phase's content-quality gate is considered fully closed, or commission a follow-up translation-authoring plan for the 8 posts."
  - id: D3
    description: "verify-live-jsonld-meta.mjs extended with dynamic sitemap-based route discovery; full sweep of 160 live routes reports zero JSON-LD parse failures, zero missing-expected-type failures, zero empty-title failures across every Track B route"
    requirement: "VOICE-07"
    verification:
      - kind: other
        ref: "node scripts/verify-live-jsonld-meta.mjs --base-url http://localhost:3000 --out 31-jsonld-meta-results.json, post-processed: 0 parse failures / 0 missing-type / 0 empty-title across 160 routes (50 empty meta.description, informational only per plan's explicit guidance)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Systematic content-quality sweep (Juan's explicit request) across all 72 posts + 7 case-studies for link-fusion, AI-cliché phrases, locale mixups, and LLM-refusal strings — all real findings fixed, re-scan confirms zero remaining"
    requirement: "VOICE-07"
    verification:
      - kind: other
        ref: "Custom sweep script (deleted after use, results captured in 31-HISTORICAL-DIFF.md): initial pass found 1 fusion instance + 59 cliché fields + 14 title mixups + 0 refusal strings; all fixed via Local API; final re-scan reports 0/0/0/0"
        status: pass
    human_judgment: true
    rationale: "Voice/tone quality of the cliché-phrase substitutions and title rewrites is a subjective judgment call — the automated marker-absence check confirms the banned phrases are gone, but Juan should spot-check a sample of the 59 cliché fixes and 14 title rewrites for tone/accuracy before considering this closed."

# Metrics
duration: ~75min
completed: 2026-07-17
status: complete
---

# Phase 31 Plan 16: Post-Sweep Verification, Historical Diff & Systematic Content-Quality Sweep Summary

**Captured the post-sweep snapshot and full Track B historical diff, extended verify-locale-parity.ts and verify-live-jsonld-meta.mjs to cover all 72 Posts + 7 CaseStudies (160 live routes, zero broken structured data), and ran Juan's explicitly-requested systematic bug sweep that found and fixed 1 link-fusion bug, 59 residual AI-cliché fields, and 14 title-level locale mixups across the full corpus.**

## Performance

- **Duration:** ~75 min
- **Started:** 2026-07-17T05:16:00Z (approx, continuation from Phase 31 Wave 3 start)
- **Completed:** 2026-07-17T06:26:00Z
- **Tasks:** 3 (plan's original 3 tasks) + Juan's explicit systematic-sweep addendum, executed as part of Task 2/3's investigation work
- **Files modified:** 4 (2 scripts extended, 1 new script, 1 historical-diff doc) + ~15 temporary one-off Local API fix scripts written and deleted after use (matching this phase's established "write, run, delete" pattern for one-off content writes)

## Accomplishments

- **Snapshot + historical diff (Task 1):** `post-sweep-phase31` snapshot captured after all 13 Posts batches + CaseStudies plan; new `scripts/diff-humanization-snapshots.ts` diffs two snapshots and confirms zero document-count drift in both the this-phase-only comparison (pre-sweep-phase31 → post-sweep) and the full-milestone comparison (the original pre-Phase-30 VOICE-04 baseline → now). `31-HISTORICAL-DIFF.md` documents both, with concrete before/after prose samples.
- **Search reindexed (Task 2):** `reindex-search.ts` re-run 3 times across this plan (after excerpt fixes, after footer fix, after the full content-quality sweep) — final state has all 72 posts + 7 case-studies + 1 author reindexed, reflecting every content change made in this plan.
- **Locale-parity extended (Task 2):** `verify-locale-parity.ts` now covers `posts`/`case-studies`. Found and fixed a real bug in the parity-detection logic itself (see Decisions). Fixed 6 posts' single-locale-missing `excerpt` and `Footer.dynamicColumns[].title`'s missing Spanish values. Remaining 23 failures are all confirmed pre-existing (8 posts with zero English content since before Phase 30) — documented, not silently patched.
- **JSON-LD/meta verified live (Task 3):** `verify-live-jsonld-meta.mjs` now dynamically discovers blog/case-studies routes from the live `/sitemap.xml` and merges them with Phase 30's 22 hardcoded routes + the 4 static index routes. Full sweep: 160 routes, zero JSON-LD parse failures, zero missing-type failures, zero empty-title failures. 50 routes have an empty `meta.description` — confirmed pre-existing/out-of-scope per Phase 30's own precedent.
- **Systematic content-quality sweep (Juan's explicit addendum):** scanned all 72 posts + 7 case-studies, both locales, for the 4 bug classes real recovery agents had independently found in individual batches. Found and fixed: 1 link-boundary space-fusion instance, 59 AI-cliché phrase fields (exact marker list: "es esencial", "es fundamental", "cabe destacar", "crucial", "leverage", "seamless", "robust", "no solo...sino también"/"not only...but also"), and 14 title-level locale mixups (4 Spanish-in-English-title, 9 untranslated English boilerplate-in-Spanish-title, 1 truncated title). Zero LLM-refusal strings found. Final re-scan confirms 0/0/0/0 remaining.
- **Discovered (not fixed) a real pre-existing gap:** 6 Posts + 6 Case Studies are unpublished drafts, confirmed unchanged since before Phase 30 — flagged in `31-HISTORICAL-DIFF.md` with full id/slug list, since it explains the dynamic route count (134, not ~162) and is a genuine editorial decision outside this plan's scope.

## Task Commits

1. **Task 1: Post-sweep snapshot + historical diff tool + diff report** - `044eaa6` (feat)
2. **Task 2: Re-run search reindex + extend and run locale-parity verification** - `ddd88bb` (feat)
3. **Task 3: Extend and run live JSON-LD/meta verification over all Track B routes** - `44534cd` (feat)

**Plan metadata:** (this commit, docs)

_Content-quality sweep DB writes (excerpt fills, footer fix, title mixup fixes, cliché-phrase substitutions, link-fusion fix) were applied via ~15 one-off Local API scripts, written, run, self-checked, and deleted after use — same pattern as this phase's other batch scripts and the pattern-mapper's temporary count-check script. Results are fully documented in `31-HISTORICAL-DIFF.md` (committed in `44534cd`) and this SUMMARY; no lasting script artifact was left in the repo for these one-off writes, consistent with the phase's "write once, verify, delete" convention for non-reusable fix scripts._

## Files Created/Modified

- `scripts/diff-humanization-snapshots.ts` - New: diffs two content-humanization-snapshot.ts JSON outputs, reports per-collection/per-doc text deltas and flags doc-count mismatches as errors
- `scripts/verify-locale-parity.ts` - Extended `COLLECTIONS` to include posts/case-studies; fixed `isLocalizedPair()` to detect entirely-missing-locale-key asymmetries (previously silently skipped)
- `scripts/verify-live-jsonld-meta.mjs` - Added `getDynamicBlogCaseStudyRoutes()` (live sitemap parsing) + 4 hardcoded static index routes; `main()` merges hardcoded + dynamic routes for the default full run
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-HISTORICAL-DIFF.md` - Full before/after picture: this-phase diff, full-milestone diff, footer fix, systematic sweep results, pre-existing-drafts finding, known content gaps
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/deferred-items.md` - Logged 3 leftover untracked scratch scripts from a prior batch session (out of this plan's scope)
- `.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-jsonld-meta-results.json` - Full raw output of the 160-route live sweep

## Decisions Made

See `key-decisions` in frontmatter. Summary: fixed 2 real bugs in the verification tooling itself (the diff tool and `verify-locale-parity.ts` both had the same missing-locale-key detection gap); fixed small, bounded, in-scope content gaps (6 excerpts, footer dynamicColumns) directly; deferred the larger translation-authorship gap (8 posts with zero English content) to a follow-up plan, matching the boundary two sibling batch agents already established; ran and acted on Juan's explicit systematic content-quality sweep rather than treating it as a future TODO.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `isLocalizedPair()`'s missing-locale-key detection gap in both the new diff tool and `verify-locale-parity.ts`**
- **Found during:** Task 1, first diff run reported only 64/72 posts changed instead of the expected 72/72
- **Issue:** Payload's `locale: 'all'` read omits an entirely-unpopulated locale's key from the response object rather than returning `null` for it. The original `isLocalizedPair()` check required exactly 2 keys (`es` and `en`), so a field missing one locale entirely (not just empty) was never recognized as a localized field at all — silently skipped by both the diff tool's walk and `verify-locale-parity.ts`'s asymmetry check.
- **Fix:** Changed the check to accept any object whose keys are a non-empty subset of `{es, en}` (1 or 2 keys) in both files.
- **Files modified:** `scripts/diff-humanization-snapshots.ts`, `scripts/verify-locale-parity.ts`
- **Verification:** Diff tool now correctly reports 72/72 posts changed. `verify-locale-parity.ts` now correctly surfaces 23 real asymmetric failures (all confirmed pre-existing) instead of silently missing them.
- **Committed in:** `044eaa6`, `ddd88bb`

**2. [Rule 2 - Missing Critical] Filled 6 posts' single-locale-missing excerpt**
- **Found during:** Task 2, after fixing the detection bug above, `verify-locale-parity.ts` surfaced 6 posts (`data-structures`, `experiencia-de-usuario`, `seo-copywriting-guide`, `pillar-page-seo`, `content-pillar`, `topic-clusters-seo`) with title+content already bilingual but excerpt empty in one locale
- **Issue:** Bounded, small content gap (not the larger 8-post translation-authorship case) — these posts already have full bilingual prose, just missing a 1-2 sentence summary field in one language
- **Fix:** Wrote a natural excerpt in the missing locale for each, summarizing the already-existing bilingual content (no new facts invented), voice-matched to the existing content's tone
- **Files modified:** None (DB-only, via a temporary Local API script, deleted after use)
- **Verification:** Re-ran `verify-locale-parity.ts` — all 6 excerpt asymmetries resolved
- **Committed in:** N/A (DB write; documented in `31-HISTORICAL-DIFF.md`, `ddd88bb`)

**3. [Rule 2 - Missing Critical] Fixed `Footer.dynamicColumns[].title`'s missing Spanish values**
- **Found during:** Task 2, `verify-locale-parity.ts` surfaced `dynamicColumns[0/1].title` asymmetric (es=EMPTY, en=ok) — confirmed pre-existing since before Phase 30 (byte-identical across all 3 historical snapshots), but `footer` has been inside this script's scope since Phase 30
- **Issue:** The Spanish site's footer "Latest posts"/"Latest case studies" column headers rendered in English
- **Fix:** Added `es: "Últimos artículos"` / `"Últimos casos de éxito"`, preserving existing ids and `en` values exactly. First attempt accidentally wrote the whole `{es,en}` object as a stringified value into the `es` field (a locale-scoped `update()` needs a plain string per locale, not the `locale:'all'`-shaped object) — caught immediately via self-check read-back, reverted, and fixed with a plain-string write
- **Files modified:** None (DB-only, via a temporary Local API script, deleted after use)
- **Verification:** Re-ran `verify-locale-parity.ts` — both dynamicColumns asymmetries resolved
- **Committed in:** N/A (DB write; documented in `31-HISTORICAL-DIFF.md`, `ddd88bb`)

**4. [Rule 2 - Missing Critical, Juan's explicit request] Fixed 1 link-boundary space-fusion bug**
- **Found during:** Task 3's systematic sweep — `posts/topic-clusters-seo` (en, `content`): a text node immediately following a link ("internal linking strategy") was missing its leading space, rendering as "...strategykeeps the content ecosystem..."
- **Fix:** Inserted the missing space into the adjacent text node; link text and all other tree structure untouched
- **Files modified:** None (DB-only, via a temporary Local API script, deleted after use)
- **Verification:** A full re-scan of all 72 posts + 7 case-studies for the same class of bug found zero remaining instances
- **Committed in:** N/A (DB write; documented in `31-HISTORICAL-DIFF.md`, `44534cd`)

**5. [Rule 2 - Missing Critical, Juan's explicit request] Fixed 59 AI-cliché phrase fields**
- **Found during:** Task 3's systematic sweep — 59 post/locale fields (title/excerpt/content combined) still carried at least one of Juan's exact flagged markers ("es esencial", "es fundamental", "cabe destacar", "crucial", "leverage", "seamless", "robust", "no solo...sino también"/"not only...but also"), despite each individual batch's own self-check passing
- **Fix:** Grammar-safe, case-preserving word/phrase substitutions applied to Lexical text-node leaves only (never touching `link`/`table` structure) plus `title`/`excerpt` fields: "es esencial"→"es clave", "es fundamental"→"es la base", "crucial"→"clave"/"key", "leverage"→"use", "seamless"→"smooth", "robust"→"solid", "no solo/not only...sino también/but also"→"y también"/"and also"
- **Files modified:** None (DB-only, via a temporary Local API script, deleted after use)
- **Verification:** Re-scan across all 72 posts + 7 case-studies confirms zero remaining cliché markers. Two initial sweep hits (`estrategia-topic-clusters`, `binary-search-tree`) turned out to be false positives from the sweep script's own marker regex lacking word boundaries (matched inside "ingredientes **es**enciales") — confirmed via context check, no content altered there
- **Committed in:** N/A (DB write; documented in `31-HISTORICAL-DIFF.md`, `44534cd`)

**6. [Rule 2 - Missing Critical, Juan's explicit request] Fixed 14 title-level locale mixups**
- **Found during:** Task 3's systematic sweep (title-only targeted re-scan, since body-prose locale-mixup heuristic found 0 hits) — 4 posts had a Spanish subtitle sitting in `title.en`, 9 posts had an untranslated English "complete practical guide" template phrase sitting in `title.es`, 1 post had a truncated ES title, and 1 post (the one already confirmed to have zero English content) had a malformed ES title mixing raw English words
- **Fix:** Rewrote each affected title in the correct language, matching the topic and existing content's tone. Explicitly preserved each post's existing `slug` in the same `update()` call (Payload's `slugField` hook only regenerates from title when its own value is omitted/falsy)
- **Files modified:** None (DB-only, via a temporary Local API script, deleted after use)
- **Verification:** Re-scan for title mixups found zero remaining. Confirmed via the live JSON-LD/meta sweep that every affected route's `<title>` still resolves and returns 200
- **Committed in:** N/A (DB write; documented in `31-HISTORICAL-DIFF.md`, `44534cd`)

---

**Total deviations:** 6 auto-fixed (2 bugs in verification tooling itself, 4 content-quality gaps — all Rule 1/2, all within scope of correctness/completeness). 1 architectural boundary explicitly maintained, not expanded (the 8-post missing-English-content translation-authorship gap, Rule 4 territory per established precedent).
**Impact on plan:** All fixes were necessary for the plan's actual goal (a real, trustworthy content-quality gate for Track B's close) rather than a superficial pass/fail check that would have missed real bugs the plan's own verify commands were designed to catch. No scope creep beyond what Juan explicitly requested (the systematic sweep) plus small, bounded, clearly-in-scope fixes surfaced by that sweep.

## Known Content Gaps (documented, not fixed — flagged for Juan)

1. **8 posts with zero English content at all** (title/excerpt/content all missing `en`): `technical-seo-guide` (9), `tablas-hash` (56), `que-es-css` (57), `mejores-cursos-seo-espanol` (58), `seo-copywriting` (35), `seo-off-page-guia` (36), `estrategia-seo` (37), `estrategia-de-contenidos` (38). Confirmed pre-existing (predates Phase 30), same Rule-4 boundary already established by Plans 31-02/31-11. Needs a dedicated translation-authoring plan if bilingual parity is required.
2. **6 Posts + 6 Case Studies are unpublished drafts**, confirmed pre-existing (predates Phase 30). Listed by id/slug in `31-HISTORICAL-DIFF.md`. Their content WAS humanized by this phase's batches (independent of publish status) — ready to go live whenever Juan publishes them.
3. **50 of 160 live routes have an empty `meta.description`** — confirmed pre-existing, same out-of-scope gap Phase 30 already flagged (30-04-SUMMARY.md). Reported for visibility only, not blocking.

## Issues Encountered

None beyond the auto-fixed items documented above. The dev server (`next dev`) was started fresh for Task 3's live route verification and stopped cleanly at the end of this plan (per the executor prompt's instruction to check before killing/restarting — confirmed not running before starting, confirmed stopped after use).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 31's content-humanization scope (Posts + CaseStudies) is complete: 72/72 posts and 7/7 case-studies rewritten in Juan's voice, zero broken structured data, zero remaining AI-cliché markers, zero link-fusion bugs, zero title locale-mixups, search reindexed.
- 2 genuine, pre-existing gaps remain OUT of this phase's scope and are flagged for Juan's decision: (a) 8 posts need full English translation authorship (a distinct, larger deliverable), (b) 12 docs (6 posts + 6 case studies) are unpublished drafts pending an editorial publish decision.
- Ready for Plan 31-17 (milestone close) — this plan's `31-HISTORICAL-DIFF.md` is the complete before/after record Juan should read before considering Track B (Phases 29-31) closed.

---
*Phase: 31-content-humanization-posts-case-studies-verificaci-n-final*
*Completed: 2026-07-17*


## Self-Check: PASSED

- FOUND: scripts/diff-humanization-snapshots.ts
- FOUND: scripts/verify-locale-parity.ts (modified)
- FOUND: scripts/verify-live-jsonld-meta.mjs (modified)
- FOUND: .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-HISTORICAL-DIFF.md
- FOUND: .planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/31-jsonld-meta-results.json
- FOUND: commit 044eaa6 (Task 1) in git log --oneline --all
- FOUND: commit ddd88bb (Task 2) in git log --oneline --all
- FOUND: commit 44534cd (Task 3) in git log --oneline --all

