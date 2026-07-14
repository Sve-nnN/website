# Phase 37 Plan 04 — Summary

**Status:** Complete
**Date:** 2026-07-14

## What happened

Continuing from 37-03 (audit-only), this plan made the actual writes, using a Payload Local API script run via `npx payload run scripts/<name>.ts` (no working `mcp__juan-payload` case-studies tools exist, confirmed again — same finding as 37-03).

**Tooling note (new finding, useful for future plans):** the first read/write scripts silently did nothing — `npx payload run` exited 0 in ~3 seconds with zero output and no side effects. Root cause: the bin script does `await import(scriptPath)` and calls `process.exit(0)` as soon as that `import()` resolves; if the script's top-level async function isn't awaited at the top level (`run()` instead of `await run()`), the dynamic import resolves synchronously and the process exits before the async work (DB calls, file writes) completes. Fix: always use top-level `await run()` (or equivalent) in scripts run via `payload run`. Recorded here so it isn't rediscovered next time.

### Docs 18, 19 — left untouched (per Juan's explicit instruction)

Per this session's corrections, docs 18 and 19 were not touched at all — no re-verification, no GSC re-pull. Read-only inspection during this plan (as part of the 6-doc dump) confirms both were already fully bilingual with labeled kpis/metrics and 3+ real-looking results.metrics rows, consistent with 37-03's audit. No writes made to either doc.

### Doc 20 — anonymized + bilingual gaps closed

**Real identity found on read (confirmed by direct inspection, matching 37-03's flag):**
- `clientContext` (both `es` and `en`) named the real firm "Worgul, Sarna & Ness", the real domain "pittsburghcriminalattorney.com", "Allegheny County", and "300 five-star reviews" / "300 reseñas de cinco estrellas".
- `kpis[]`, `challenge[]`, `solution[]`, `results.metrics[].label` existed **only in `en`** — no `es` translations at all (worse than 37-03's summary suggested, which flagged only kpis/metrics; the audit for this plan found challenge/solution text was also English-only).
- `title`, `heroSubtitle`, `sector`, `meta.*`, `slug`, and the `client` relationship (`null`) contained no other real-identity leakage — city name "Pittsburgh" is kept (consistent with docs 15-19's pattern of naming cities/regions but never brand names/domains/exact counts).

**Fix applied** (Local API script, one `payload.update()` call per field group per locale):
1. `clientContext` rewritten in both locales — anonymized to "a criminal defense law firm based in Pittsburgh, Pennsylvania... representing clients across the Pittsburgh region and Western Pennsylvania, backed by a strong track record of five-star reviews" (and Spanish equivalent). No firm name, no domain, no county name, no exact review count.
2. `kpis[]` — added the missing `es` label to all 4 rows (ids preserved, values untouched).
3. `challenge[]` — added `es` translations for all 3 rows (ids preserved).
4. `solution[]` — added `es` translations for all 3 rows (ids preserved).
5. `results.metrics[]` — added `es` labels for all 3 rows (ids/before/after untouched).

No GSC re-pull was needed for doc 20's numbers — the existing real numbers (86,000 clicks, 22.4M impressions, 36.3→19.2 position, etc.) were already present from prior work and are internally consistent; only the missing translations and the identity leak needed fixing, per this session's explicit corrections.

**Verification — zero-match grep on the re-fetched doc 20 (and all 6 docs):**
```
grep -io "worgul\|pittsburghcriminalattorney\|allegheny\|300 five-star\|300 reseñas" case-studies-dump.json
→ no matches (grep exit code 1)
```

**Live render check (dev server on :3002, 375px viewport, Playwright):**
- `urologo-seo-local-salud-santiago-rd` (doc 16) and `pittsburgh-criminal-defense-legal-content-seo` (doc 20): both pages return 200, no horizontal overflow (`scrollWidth === clientWidth === 375`), the results chart renders (`svg.recharts-surface`, bounding box within viewport width), and the author byline ("Juan Carlos Angulo") appears exactly once, no duplication.
- JSON-LD `additionalProperty` on both pages reflects the now-complete, correctly-labeled kpis (Spanish labels showing correctly for doc 20's kpis, e.g. "Crecimiento interanual de clics": "+83%").
- Grepped both rendered HTML pages for the same identity strings — zero matches.

No files were changed in this repo — all changes are Postgres content writes via the Local API. Temporary scripts (`scripts/tmp-read-case-studies.ts`, `scripts/tmp-fix-case-study-20.ts`, a temp mobile-check `.mjs`) were deleted after use, matching the pattern from 37-03. `git status` is clean of any tracked-file changes from this plan.

## Deviations

- Rule 1 continuation: reconfirmed no MCP tools exist for case-studies; used Local API script per 37-03's handoff instructions.
- Found and fixed a `payload run` footgun (missing top-level `await`) not previously documented — noted above for future plans using this pattern.
- Widened the doc-20 fix beyond the plan's literal wording: 37-03's summary said only kpis/metrics labels were missing `es`, but direct re-inspection during this plan found `challenge[]`/`solution[]` text was ALSO English-only. Fixed all four (kpis, challenge, solution, results.metrics) for full bilingual parity with docs 15-19, matching the plan's own success criterion of "ningún campo" — anonymization done, but also full bilingual parity, since leaving Spanish visitors with an English-only case study would be a content gap this phase should also close.


## Full raw JSON of all 6 docs

Deliberately NOT persisted in this tracked file — it's a full production-data dump (client-context descriptions, KPI numbers, GSC-derived metrics) with no instruction from Juan to commit it to git history. It was relayed directly to Juan in the chat/conversation where this plan was executed, per the plan's actual requirement ("for Juan's manual review"), not stored here. If it's needed again, re-run `payload.findByID({ collection: 'case-studies', id, locale: 'all' })` for ids 15-20 against the live DB — it's always reproducible from the source of truth.
