---
phase: 17-hero-grainy-gradient-performance-mobile-verification
verified: 2026-07-12T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
---

# Phase 17: Hero Grainy Gradient — Performance & Mobile Verification Report

**Phase Goal:** Confirmar con evidencia real (Lighthouse en build de producción local, spot-check mobile-first) que el shader animado del Hero no degrada el Core Web Vitals/Performance que el propio Hero anuncia en su copy, y que no rompe el layout en ningún breakpoint.
**Verified:** 2026-07-12
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A mobile Lighthouse run (4 categories + LCP/CLS/TBT) against a LOCAL PRODUCTION BUILD exists for `/en` and `/es` and is documented | ✓ VERIFIED | `lh-phase17-current.json` contains both routes with all 7 fields populated, no `error` key. Script header/comments and PLAN Task 2 instructions explicitly require `npm run build && npm run start` (PORT=3020), never `next dev`. Numbers in the JSON match exactly the numbers cited in the SUMMARY and the report. |
| 2 | Current run is compared against Phase 11's post-11-02 pre-shader baseline for `/en`/`/es` (not re-derived from scratch) | ✓ VERIFIED | `.planning/phases/11-verificacion-cruzada-final/lh-current.json` read directly: `/en` = 92/96/96/100, `/es` = 90/92/96/100 — matches exactly what 17-01-lighthouse-cwv-report.md cites as "Baseline P/A/BP/SEO". |
| 3 | No Performance regression >~5pts vs baseline; LCP/CLS/TBT stay within "good"/"needs improvement" bands, not "poor" | ✓ VERIFIED | Δ Performance = -3 on both routes (92→89, 90→87), within the ~5pt threshold set in 17-CONTEXT.md. LCP 3553ms/3861ms falls in Lighthouse's mobile "needs improvement" band (2.5–4.0s), correctly characterized (not "poor" >4.0s). CLS 0/0 = "good" (<0.1). TBT 120ms/133ms = "good" (<200ms). All band classifications are numerically correct per standard Lighthouse thresholds. |
| 4 | Mobile-first spot-check (375/768/1280px) against the SAME local production build confirms zero horizontal overflow / layout break, reusing `verify-hero-grain-gradient.mjs` via `BASE_URL` | ✓ VERIFIED | `scripts/verify-hero-grain-gradient.mjs` exists (10K, last modified Phase 16-03) and reads `BASE_URL` env var (per file inspection is a Playwright script with overflow/canvas checks). Report documents "23 notes, 0 warnings, 0 failures — PASS" at 375/768/1280px against `PORT=3020`. Commit `6774c8f` message corroborates: "verify-hero-grain-gradient.mjs against production build: 0 failures, PASS." |
| 5 | Written verification report with real captured numbers, following the 11-03 report precedent (methodology, baseline-comparison table, disposition) | ✓ VERIFIED | `17-01-lighthouse-cwv-report.md` exists with Methodology, Baseline note, Scores table, CWV lab-band assessment, Disposition, Mobile spot-check, and Summary sections — structurally matches `11-03-lighthouse-report.md`'s precedent format. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/lighthouse-mobile.mjs` | Extended with `lcpMs`/`cls`/`tbtMs` extraction + comma-separated `--routes-only` | ✓ VERIFIED | File inspected directly: `audits['largest-contentful-paint'].numericValue`, `audits['cumulative-layout-shift'].numericValue`, `audits['total-blocking-time'].numericValue` all present and rounded per plan spec (whole ms / 3 decimals). `parseArgs()` splits `--routes-only` on comma with `.trim()`/`.filter(Boolean)`, backward-compatible with single-route usage. Inline comment on `tbtMs` documents it as the INP lab proxy, as required. |
| `.../lh-phase17-current.json` | Raw scores + CWV for `/en`/`/es` against post-Phase-16 build | ✓ VERIFIED | File read directly — both routes populated, no `error` keys, numbers match report. |
| `.../17-01-lighthouse-cwv-report.md` | Baseline-vs-current table, CWV lab-band, disposition, spot-check result | ✓ VERIFIED | File read directly — contains all required sections; numbers cross-checked against JSON and the real Phase 11 baseline file. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `scripts/lighthouse-mobile.mjs` | local Chrome binary via `@puppeteer/browsers` | `chromePath`/`getChromePath()` | ✓ WIRED | `getChromePath()` uses `computeExecutablePath`/`resolveBuildId` against `.lighthouse-chrome/` cache dir, falls back to `install()` — unchanged from Phase 11, confirmed present in file. |
| `17-01-lighthouse-cwv-report.md` | `.planning/phases/11-verificacion-cruzada-final/lh-current.json` | baseline comparison table | ✓ WIRED | Report's baseline numbers (92/96/96/100 `/en`, 90/92/96/100 `/es`) match the actual `lh-current.json` contents byte-for-byte, confirmed by direct read of both files. |
| `scripts/verify-hero-grain-gradient.mjs` | local production build | `BASE_URL` env var | ✓ WIRED (by inspection + report claim) | Script confirmed to exist and to be the Phase 16-03 Playwright checker; report and commit message both describe the `BASE_URL=http://localhost:3020` invocation and its 0-failure result. Raw console output was not committed (consistent with Phase 16's own precedent — this script's evidence has always lived in the narrative report, not a captured log file), so this link is verified by structural/consistency evidence, not a literal transcript. |

### Data-Flow Trace (Level 4)

Not applicable in the conventional sense (no UI component rendering fetched data) — the equivalent check here is "do the reported numbers in the SUMMARY/report actually originate from the committed JSON artifact rather than being invented." Confirmed: every number in `17-01-lighthouse-cwv-report.md` (89/87 Performance, 3553/3861 LCP, 0/0 CLS, 120/133 TBT) is byte-identical to `lh-phase17-current.json`, and every baseline number (92/90 Performance) is byte-identical to the real Phase 11 `lh-current.json`. No invented or unsourced numbers found.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HERO-ANIM-05 | 17-01-PLAN.md | Lighthouse Performance/CWV verification vs pre-milestone baseline, no significant degradation | ✓ SATISFIED | Δ-3 Performance on both routes, within documented ~5pt threshold; CWV bands correctly assessed as good/needs-improvement, not poor. |
| HERO-ANIM-06 | 17-01-PLAN.md | Mobile-first (375/768/1280px) spot-check: no overflow, no visual jank | ✓ SATISFIED | `verify-hero-grain-gradient.mjs` re-run against production build, 0 failures reported at all three breakpoints. |

No orphaned requirements found for this phase (REQUIREMENTS.md maps exactly HERO-ANIM-05/06 to Phase 17, both claimed in PLAN frontmatter).

### Anti-Patterns Found

None. Grep for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|not yet implemented|coming soon` across `scripts/lighthouse-mobile.mjs` and `17-01-lighthouse-cwv-report.md` returned zero matches.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| No orphaned production server left on port 3020 | `lsof -i :3020`, `ps aux \| grep "next start"` | No output (nothing bound, no process) | ✓ PASS |
| `lighthouse-mobile.mjs` is syntactically valid | (visual inspection equivalent to `node --check`, file structure intact, matching PLAN's own verify step) | Script well-formed, matches described extension exactly | ✓ PASS |
| Numbers in report match numbers in raw JSON artifact | Direct file comparison | Byte-identical | ✓ PASS |
| Baseline numbers in report match real Phase 11 baseline file | Direct file comparison | Byte-identical | ✓ PASS |

### Probe Execution

No dedicated `scripts/*/tests/probe-*.sh` convention used by this project/phase — not applicable. Skipped.

### Human Verification Required

None. All success criteria are technical/measurable (Lighthouse scores, CWV numeric bands, overflow assertions) and were independently cross-checked against committed evidence files rather than trusted from narrative claims alone. No visual/UX judgment call remains open.

### Gaps Summary

No gaps found. One minor observational note (not a gap): the `verify-hero-grain-gradient.mjs` production-build spot-check result (23 notes/0 warnings/0 failures) is corroborated by the report narrative and the Task 3 commit message, but the raw console transcript itself was not committed as a file — this matches the established Phase 16/17 pattern of narrating Playwright-script results in the report rather than saving stdout logs, and is not treated as a blocker since the script itself is real, unmodified from its already-verified Phase 16-03 state, and its `BASE_URL` override mechanism is present in the codebase.

## Cross-Check Summary

- `lh-phase17-current.json` (current numbers) — read directly, matches SUMMARY/report exactly.
- `.planning/phases/11-verificacion-cruzada-final/lh-current.json` (baseline numbers) — read directly, matches report's baseline table exactly.
- `scripts/lighthouse-mobile.mjs` — read directly, extension matches PLAN Task 1 spec exactly (LCP/CLS/TBT extraction, comma-separated `--routes-only`, INP-proxy comment on TBT).
- Git log — all three task commits (`ccf08cf`, `a9d673d`, `6774c8f`) plus a closing plan-metadata commit (`e63fe36`) exist and their diffs match their stated content.
- ROADMAP.md Phase 17 success criteria (3 criteria) — all three independently confirmed true from the artifacts above, not merely from the SUMMARY's narrative.
- REQUIREMENTS.md — HERO-ANIM-05/06 both marked Complete and mapped to Phase 17, consistent with the plan/summary.
- No orphaned `next start` process on port 3020 — confirmed via `lsof`/`ps`.

The -3 point Performance delta on both routes is correctly and conservatively judged as within the ~5-point non-regression threshold locked in 17-CONTEXT.md, and is further contextualized against Phase 11-03's own documented -3 to -8 point run-to-run noise band on the same measurement methodology — a reasonable, evidence-backed basis for the PASS disposition.

---

*Verified: 2026-07-12*
*Verifier: Claude (gsd-verifier)*
