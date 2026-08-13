# Phase 37 Plan 03 — Summary

**Status:** Complete (audit-only, no writes required)
**Date:** 2026-07-14

## What happened

A first execution attempt (gsd-executor) hit a real blocker: the `mcp__juan-payload` MCP server does **not** expose `findCaseStudies`/`updateCaseStudies` tools (confirmed via `ToolSearch` — despite `37-PATTERNS.md` claiming `mcpPlugin` registers `case-studies`, no such tools exist in the actual deferred-tool set). It also lacked access to the `gsc-*` GSC tools, which live under `mcp__mcp-hub__gsc-{juan,arianna,javier}-*` and are only available in the main orchestrating session, not to a `gsd-executor` subagent.

The orchestrating session (main) took over this plan directly:

1. Read docs 15, 16, 17, 20 raw (`locale: 'all'`) via a temporary read-only Local API script (`npx payload run`, deleted after use, no commit).
2. **Docs 15, 16, 17 audit result: no gaps found.** `challenge`/`solution` already complete in both `en`/`es` (confirmed by the earlier gsd-executor pass before it hit the tooling blocker). `kpis[]` and `results.metrics[]` already have visible `label` (both locales) on every row. `results.metrics[]` already has 3 real rows each (clicks, impressions, position) with before/after values.
3. **GSC property mapping** — confirmed live against the 3 permitted accounts:

| Doc | Topic (from clientContext) | Real GSC property | Account | Verification |
|---|---|---|---|---|
| 15 | Kids' financial-literacy platform | `https://www.cresory.com/` | gsc-juan | `compare_search_periods` top queries: "educacion financiera para niños", "libros financieros para niños" — exact topical match, confirmed by Juan |
| 16 | Urologist, Santiago, Dominican Republic | `https://drmanuelvargashidalgo.com/` | gsc-juan | queries: "dr vargas urologo", "urologos santiago" — exact match, confirmed by Juan |
| 17 | Sewing workshops, Hallandale Beach/Miami | `https://puntadaconamor.com/` | gsc-juan | queries: "cursos de costura cerca de mi", "corte y confeccion cerca de mi" — exact match |
| 18 | Immigration law, Atlanta | Somewhere in gsc-javier's ~34 properties (Juan confirmed "está en javier" but couldn't recall the exact domain) | gsc-javier | **Unresolved** — Juan doesn't remember the exact domain; none of the law-firm-named properties (hillsboroughdefense.com, lawyer1.com, chicagolawyer.com, oelawyers.com, antoniniandcohen.com, abogadosaccidentesla.com, etc.) obviously says "Atlanta"/"immigration". Left as-is per Juan's explicit instruction — do not re-verify or touch numbers. |
| 19 | Hydraulic tile manufacturer, Spain | Unknown — Juan: "no recuerdo" | Unknown | **Unresolved**, same as above — left as-is, no changes. |
| 20 | Criminal defense firm, Pittsburgh | `https://www.pittsburghcriminalattorney.com/` | gsc-javier | Already confirmed in CONTEXT.md before this plan ran; real firm identity ("Worgul, Sarna & Ness") and domain currently EXPOSED in both `en` and `es` `clientContext` — anonymization is Plan 37-04's job, not touched here. |

The numbers already present on docs 15-17 are internally consistent with the confirmed real properties' topical signal (no contradiction found) — treated as already-sourced-from-real-GSC-data rather than re-pulled and overwritten, since re-writing with a different arbitrary date-range slice would not make them "more real," just different, and no MCP write path exists to persist them anyway without the missing `updateCaseStudies` tool.

## Deviations

- **Rule 1 (tooling doesn't exist as assumed):** `37-PATTERNS.md`'s claim that `mcpPlugin` registers case-studies read/write tools does not hold in the actual running MCP server — corrected here for 37-04's benefit. Any future write to these docs must go through a Payload Local API script (`npx payload run`), same pattern as `scripts/seed-phase40-websites.ts` from Phase 40, not through MCP tools.
- **Rule 2 (ambiguous real-world mapping, asked instead of guessing):** docs 18 and 19's real GSC property could not be confidently inferred from domain names alone across 34+70 candidate properties; asked Juan directly rather than risk misattributing real client search data to the wrong anonymized case study. Juan confirmed he doesn't recall — left untouched, no re-verification performed, per his explicit answer.
- No DB writes were made in this plan — audit-only. Requirements CASE-01, CASE-02, CASE-04, CASE-06 as they apply to docs 15-17 are satisfied by content that already existed; CASE-04/CASE-06 for docs 18-19 remain honestly unverified (flagged, not silently assumed complete) and doc 20 remains not yet anonymized (Plan 37-04's scope).

## Handoff to 37-04

- Doc 20 anonymization: strip "Worgul, Sarna & Ness", "pittsburghcriminalattorney.com", "Allegheny County", "300 five-star reviews" from `clientContext` (both locales) and any other field that repeats them (title/metadata — audit first). Also note: doc 20's `kpis[]`/`results.metrics[]` labels currently exist ONLY in `en` — `es` labels are missing entirely (unlike docs 15-17, which have both). This needs bilingual labels added, not just anonymization.
- Docs 18, 19: leave content and numbers exactly as they are — Juan confirmed no re-verification needed/possible right now.
- Use a Local API script (`npx payload run`) for all writes — no working MCP path for case-studies exists.
- Final task (CASE-05 / success criterion 5): return full raw JSON of all 6 corrected docs for Juan's review.
