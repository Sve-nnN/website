---
phase: 15-sitemap-xsl-html
reviewed: 2026-07-12T01:27:31Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/lib/sitemap-data.ts
  - src/app/sitemap.xml/route.ts
  - public/sitemap.xsl
  - src/app/sitemap.html/route.ts
  - scripts/seed-phase15-sitemap-footer-link.ts
  - scripts/fix-header-navitems-es-labels.ts
findings:
  critical: 0
  warning: 9
  info: 4
  total: 13
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-07-12T01:27:31Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the sitemap XML/XSL/HTML surfaces and the two bilingual-array backfill scripts (footer seed + adjacent header fix). No crashes, injection vectors, or data-loss risks found — XML/HTML output is consistently escaped (`escapeXml`/`escapeHtml`) and both backfill scripts are id-preserving and re-run-safe. No BLOCKER-level findings.

The findings that do exist cluster into three themes: (1) an SEO/domain-correctness gap inherited from the deleted `sitemap.ts` that this phase carried forward without a safety net (wrong-domain fallback, no error handling despite the UI-SPEC's inaccurate claim that error handling already exists, EN pages never emitted as primary `<loc>` entries), (2) fragile matching logic in both bilingual-backfill scripts (URL/position-based matching with undocumented assumptions about `link.type`, column ordering, and hardcoded literal-string keys) that will silently no-op rather than fail loudly if content authoring drifts, and (3) minor dead-code/duplication issues in the new route handlers. None of this blocks shipping the phase's stated goal (6/6 truths were verified live), but several items are worth a deliberate follow-up decision rather than silent acceptance.

## Warnings

### WR-01: `SITE_URL` fallback silently points sitemap at the wrong domain if env var is unset

**File:** `src/lib/sitemap-data.ts:4`
**Issue:** `export const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'`. If `NEXT_PUBLIC_SERVER_URL` is not set (or misconfigured) in the Hostinger production environment, every URL emitted by `sitemap.xml`, `sitemap.html`, and every `<loc>`/hreflang alternate silently resolves to the old reference-site domain instead of the live domain — with no error, warning, or build-time check. Given this project's stated core value is impeccable SEO, a wrong-domain sitemap is a severe, silent failure mode. The 15-01 summary flags this as "confirm env var in Hostinger" but the code itself has no guard.
**Fix:** Fail loud instead of silently falling back in production, e.g.:
```ts
export const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ??
  (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('NEXT_PUBLIC_SERVER_URL must be set in production') })()
    : 'https://juancarlosangulo.com')
```

### WR-02: EN-locale pages are never emitted as primary `<loc>` entries in `sitemap.xml`

**File:** `src/lib/sitemap-data.ts:50-65`, `src/app/sitemap.xml/route.ts:17-31`
**Issue:** `getSitemapEntries()` produces exactly one entry per document, always using the ES URL as `entry.url`/`<loc>`, with the EN URL only ever appearing inside an `hreflang="en"` alternate annotation. The EN version of every page is therefore never listed as its own `<url>` block in the sitemap — only referenced indirectly. This weakens EN-locale discoverability via the sitemap, which matters for a bilingual portfolio whose core value is SEO. This behavior is inherited unchanged from the deleted `sitemap.ts` (confirmed via `git show 1d3a615:src/app/sitemap.ts`), so it's pre-existing, not introduced by this phase — but this phase is exactly the point where the sitemap's structure was touched and would have been the natural place to fix it.
**Fix:** Emit one `<url>` entry per locale (ES and EN), each with a full, reciprocal set of hreflang alternates (including a self-referencing one), matching Google's recommended hreflang sitemap pattern.

### WR-03: No error handling around `getSitemapEntries()` despite UI-SPEC asserting it exists

**File:** `src/app/sitemap.xml/route.ts:14-15`, `src/app/sitemap.html/route.ts:25-26`
**Issue:** 15-UI-SPEC.md states: "Error state: Not applicable — this route has no user input or failure mode beyond the underlying sitemap query, which already has error handling in `sitemap.ts`." This is inaccurate — the original `sitemap.ts` (confirmed via `git show`) has no try/catch either, and neither new route handler adds any. If the Payload query throws (DB connectivity issue, misconfigured collection, etc.), both `/sitemap.xml` and `/sitemap.html` return Next's generic unhandled-error response instead of valid XML/HTML — for `/sitemap.xml` specifically this means crawlers hitting a 500/HTML error page where they expect XML, which can affect indexing.
**Fix:** Wrap the query in a try/catch and return a minimal valid empty `<urlset>`/error-safe HTML with a non-200 status and log the failure server-side, rather than letting it bubble into Next's default error handling.

### WR-04: `sitemap.html` language switcher duplicates the ES link inside the same list item

**File:** `src/app/sitemap.html/route.ts:14-23`
**Issue:** `renderItem` renders the main `<li>` link using `entry.url` (which is always the ES URL, since `entry.url === entry.alternates.es` by construction in `sitemap-data.ts`), then appends a "EN · ES" switcher where the "ES" link points to that exact same URL again. Every row therefore contains two separate `<a>` elements pointing to the identical ES URL, which is confusing/redundant UX for a page whose entire purpose is being a clear, navigable index.
**Fix:** Either drop the redundant "ES" link from the switcher (keep only "EN"), or make the main link language-neutral/labeled and let the switcher be the sole source of both locale links.

### WR-05: `hasAlternates` check in `sitemap.html` is an unreachable branch given current data shape

**File:** `src/app/sitemap.html/route.ts:16-20`
**Issue:** `const hasAlternates = entry.alternates.en !== entry.alternates.es` — given `getSitemapEntries()` always builds `alternates.en` with an extra `/en/` path segment relative to `alternates.es`, these two values can never be equal for any entry currently produced. The `''` (no-switcher) branch is therefore dead code that will never execute, giving a false impression that some entries might lack alternates.
**Fix:** Either remove the conditional (since it's always true today) or make `sitemap-data.ts` genuinely support locale-neutral entries (e.g., a page with only one locale published) so the branch is real and testable.

### WR-06: Both bilingual-backfill scripts match nav/link items via `link.url`, silently no-op for `type: 'reference'` items

**File:** `scripts/fix-header-navitems-es-labels.ts:37-45`, `scripts/seed-phase15-sitemap-footer-link.ts:87-93`
**Issue:** The shared `link()` field (`src/fields/link.ts`) defines two link types: `'reference'` (internal relationship, default) and `'custom'` (raw URL text). Only `type: 'custom'` items populate the `url` field that both scripts key their ES-label matching on. Any nav/footer link item authored as an internal `reference` link (the field's default type) will have `link.url === undefined`, silently fall through the `if (expectedLabel ...)` guards, and be left with a blank ES label with no warning printed. This worked live only because the actual production data happens to use `type: 'custom'` for these items — it is not verified/asserted anywhere in the script.
**Fix:** Add an explicit `type === 'custom'` check and log a warning for any item that doesn't match an expected URL, so future content changes (switching a nav item to an internal reference) don't silently regress ES labels again.

### WR-07: Footer seed's column backfill matches ES↔EN columns by array index, inconsistent with the rest of the script's href-based matching

**File:** `scripts/seed-phase15-sitemap-footer-link.ts:79-94`
**Issue:** `legalLinks` and nested `column.links` are matched by the non-localized `href`/`url` field (robust to reordering), but `columns` themselves are matched positionally: `const enColumn = enFooter.columns?.[columnIndex]`. If the `columns` array is ever reordered or its length diverges between locales — which is precisely the class of bug (`Payload full-replaces localized arrays on update`) this script exists to repair — the positional match will silently backfill the wrong ES title onto the wrong column, with no detection. Compounding this, `COLUMN_TITLE_ES` keys off the literal English string (`Site`, `Contact`); if that copy is ever edited, the lookup silently returns `undefined` and the backfill is skipped without any log line explaining why.
**Fix:** Match columns by a stable identifier (Payload auto-generates `id` on array rows) instead of index, and log when a column's title doesn't match any known key so silent no-ops are visible.

### WR-08: `fix-header-navitems-es-labels.ts`'s hardcoded URL map is incomplete relative to the sibling footer script

**File:** `scripts/fix-header-navitems-es-labels.ts:19-24`
**Issue:** `ES_LABELS_BY_URL` covers `/blog`, `/case-studies`, `/authors`, `/contact` only. The sibling `seed-phase15-sitemap-footer-link.ts` covers a superset including `/search`. If the Header global's `navItems` include a `/search` entry (or a home/root `/` entry), this one-off fix leaves it with a blank ES label indefinitely — this is a one-shot manual script with no follow-up mechanism, and it doesn't log anything when a nav item fails to match any key in the map.
**Fix:** Either share the label-map source of truth between both scripts (e.g., import from `scripts/seed-header-footer-content.ts` directly instead of re-declaring subsets) or add a console warning for any nav item whose URL isn't found in the map, so gaps are visible rather than silent.

### WR-09: Duplicate near-identical escaping helpers across the two new route handlers

**File:** `src/app/sitemap.xml/route.ts:5-12`, `src/app/sitemap.html/route.ts:5-12`
**Issue:** `escapeXml` and `escapeHtml` are two copy-pasted implementations of essentially the same 5-character escape table (only differing in `'` → `&apos;` vs `&#39;`). This phase already established the pattern of factoring shared logic into `src/lib/sitemap-data.ts` (`getSitemapEntries`, `SITEMAP_GROUP_LABELS`) — the escaping helper should have followed the same pattern to avoid drift (e.g., someone patching an escaping bug in one file and forgetting the other).
**Fix:** Move a single `escapeHtml`/`escapeXml` (HTML and XML escaping are compatible for these five characters) into `src/lib/sitemap-data.ts` or a small shared util, and import it from both routes.

## Info

### IN-01: XSL "no alternates" fallback (`—`) is unreachable given current data

**File:** `public/sitemap.xsl:79-91`
**Issue:** Same root cause as WR-05 — every `<url>` entry always carries both `hreflang="es"` and `hreflang="en"` `xhtml:link` children per `sitemap.xml/route.ts`, so the `xsl:otherwise` branch producing `—` can never render today. Harmless, but the code reads as handling a case that can't actually occur.
**Fix:** No action required unless `sitemap-data.ts` starts producing entries without alternates; otherwise consider removing the branch or adding a code comment noting it's defensive/future-proofing.

### IN-02: Language-switcher links lack `hreflang`/`lang` attributes

**File:** `src/app/sitemap.html/route.ts:19`
**Issue:** The "EN"/"ES" switcher anchors have no `hreflang` or `lang` attribute, which would be a small, free SEO/accessibility signal on a page whose entire purpose is a language-aware URL index.
**Fix:** `<a hreflang="en" href="...">EN</a>` / `<a hreflang="es" href="...">ES</a>`.

### IN-03: Redundant re-fetch of the EN footer inside the seed script's locale loop

**File:** `scripts/seed-phase15-sitemap-footer-link.ts:58-64`
**Issue:** `enFooter` (locale `'en'`) is fetched once before the loop for column-title lookups, then `footer` is fetched again for `locale === 'en'` inside the loop — an unnecessary duplicate network round-trip, and the two similarly-named variables (`enFooter` vs. `footer`) increase the risk of a future edit reading the stale `enFooter` snapshot after `footer` (en) has already been updated within the same run.
**Fix:** Reuse `enFooter` directly inside the loop's `en` iteration instead of re-fetching.

### IN-04: `sitemap.html` document declares `lang="en"` unconditionally

**File:** `src/app/sitemap.html/route.ts:48`
**Issue:** The single served document (there is only one `/sitemap.html`, not locale-prefixed) hardcodes `<html lang="en">` even though roughly half its content/links are ES URLs and the page mixes both locales' content by design. Minor accessibility nit — screen readers will announce ES URL text as English.
**Fix:** Not clearly fixable without splitting the page by locale (out of scope per UI-SPEC, which explicitly allows English-only labels for this utility page) — noting for awareness only, no action required.

---

_Reviewed: 2026-07-12T01:27:31Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
