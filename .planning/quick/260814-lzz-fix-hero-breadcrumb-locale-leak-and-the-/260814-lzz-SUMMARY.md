---
phase: quick-260814-lzz
plan: 01
subsystem: i18n-routing
tags: [next-intl, routing, breadcrumbs, seo, blog, scroll-reveal]
status: complete
requires:
  - src/i18n/navigation.ts (isPrefixableHref, locale-aware Link — from quick task 260813-o0n)
  - src/lib/blog-paths.ts (localizeBlogPath)
provides:
  - Locale-correct breadcrumb and category-tab hrefs on /en blog pages
  - Breadcrumb-scoped and services-segment assertions in scripts/verify-locale-links.mjs
affects:
  - Every page rendering the Hero block with a `listing` variant and a breadcrumb trail
  - The blog index and every /blog/<category> listing (category tabs)
tech-stack:
  added: []
  patterns:
    - "Per-crumb link-component selection via isPrefixableHref, matching CMSLink and SiteFooter"
    - "Locale transform applied at the call site (localizeBlogPath) when a raw <a> cannot use the locale-aware Link"
    - "Scoped HTML slices in the verification script so legitimate root hrefs elsewhere cannot false-fail"
key-files:
  created: []
  modified:
    - src/blocks/Hero/Component.tsx
    - src/components/BlogCategoryTabs.tsx
    - scripts/verify-locale-links.mjs
decisions:
  - "No schema change: Hero.breadcrumbs[].url stays non-localized. Fix is render-time only."
  - "BlogCategoryTabs keeps its raw <a> elements inside Radix TabsTrigger asChild; the prefix comes from localizeBlogPath, not from swapping in a Link component."
  - "The /blog blank gap is a screenshot artifact of an unfired IntersectionObserver, not a layout bug. Zero code changed."
metrics:
  duration: ~45min
  tasks: 3
  files: 3
  completed: 2026-08-14
---

# Quick Task 260814-lzz: Hero breadcrumb locale leak and the /en blog tabs — Summary

Closed the `/en/blog` locale leak at render time: the breadcrumb "Home" link and all five category tabs now keep an English reader in English, the verification script grew a breadcrumb-scoped gate that fails against the still-defective production build, and the `/blog` blank gap was measured and ruled a capture artifact with no code changed.

## What Changed

### Task 1 — `src/blocks/Hero/Component.tsx` + `src/components/BlogCategoryTabs.tsx` (commit `7f2a079`)

**Hero/Component.tsx.** The plain `next/link` import became `PlainLink`, joined by `Link as LocaleLink` and `isPrefixableHref` from `@/i18n/navigation`. Inside the breadcrumb map, the link branch now resolves its component per crumb:

```tsx
const CrumbLink =
  crumb.url && isPrefixableHref(crumb.url) ? LocaleLink : PlainLink
```

Nothing else in the map moved: same `key`, same separator span, same `isLast || !crumb.url` span branch, same className string.

The five-line refusal comment at the top of the file is gone. It justified the plain link on the premise that the only crumb url here came from `src/lib/breadcrumbs.ts` already prefixed — true only for the four Services pages that override `breadcrumbs` through `blockProps`, and false for every page that reads the CMS array field. The replacement comment names both sources explicitly and says the guard picks the component per crumb, so the next reader does not have to re-derive it.

**BlogCategoryTabs.tsx.** Both href expressions now route through `localizeBlogPath(locale, …)` — the "All" tab's `blogIndexPath()` and the per-category `blogCategoryPath(...)`. The raw `<a>` elements and the Radix `TabsTrigger asChild` composition are untouched. A comment records why the transform lives at the call site: `blogCategoryPath`/`blogIndexPath` are shared with `blogPostPath`, whose callers already render through the locale-aware `Link`, so localizing inside the helpers would give those hrefs a second `/en` segment.

### Task 2 — `scripts/verify-locale-links.mjs` (commit `d478103`)

Three module-level regex constants added next to the existing ones: `BARE_ROOT_HREF` (`href="/"`), `UNPREFIXED_EN_SERVICES`, `UNPREFIXED_ES_SERVICES`. A `breadcrumbSlice(html)` helper sits beside `headerSlice`/`stripLocaleSwitcher` and returns the concatenation of every `<nav aria-label="Breadcrumb">` on the page.

Assertion block 6 (breadcrumbs): on every `/en` page that renders a trail — no bare-root href, no unprefixed section href, and at least one locale-prefixed href so absence cannot pass. On the Spanish controls — the bare-root href must still be there and no `/en` may leak in. A coverage guard fails loudly if not one fetched page produced a breadcrumb slice.

Assertion block 7 (services latch): no unprefixed `/services` href on any fetched page, and no `/servicios` href on any `/en` page. Both already hold on production; this locks the good state rather than fixing anything.

The pre-existing uncommitted hunk moving the `BASE` default from port 3000 to 3001 (Juan's) was kept and carried in this commit, as the plan instructed. `VERIFY_BASE_URL` still overrides it.

## Verification

### Task 1 gates

```
tsc:0
isPrefixableHref:3          (grep -c, src/blocks/Hero/Component.tsx)
localizeBlogPath:4          (grep -c, src/components/BlogCategoryTabs.tsx)
stale-comment:0             (grep -c "Deliberately the PLAIN link", Hero/Component.tsx)
git diff --stat -- src/blocks/Hero/config.ts src/lib/breadcrumbs.ts src/lib/blog-paths.ts src/components/SiteFooter.tsx
                            -> empty
git status --porcelain -- src/migrations
                            -> empty
```

Guard harness against the real committed module (`npx tsx scripts/_tmp-verify-lzz.ts`), 9/9:

```
ok / true
ok /en false
ok /en/blog false
ok /entrevistas true
ok /blog true
ok https://x.com/a false
ok //evil.com/x false
ok mailto:a@b.c false
ok #contact false
harness:0
```

The scratch file was deleted; `git status --porcelain -- scripts/_tmp-verify-lzz.ts` is empty.

### Task 2 gates

```
syntax:0                    (node --check)
bc-marker:3                 (grep -c 'aria-label="Breadcrumb"')
28:const BASE = (process.env.VERIFY_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '')
```

### Run A — the RED proof against production (mandatory gate)

`VERIFY_BASE_URL=https://juan-tech.com node scripts/verify-locale-links.mjs`, verbatim:

```
Verifying locale-prefixed hrefs against https://juan-tech.com
locales=[es, en] default=es

PASS  no stacked double locale segment — https://juan-tech.com/en
PASS  no stacked double locale segment — https://juan-tech.com/en/blog
PASS  no stacked double locale segment — https://juan-tech.com/en/case-studies
PASS  no stacked double locale segment — https://juan-tech.com/en/websites
PASS  no stacked double locale segment — https://juan-tech.com/en/authors
PASS  no stacked double locale segment — https://juan-tech.com/blog
PASS  no stacked double locale segment — https://juan-tech.com/case-studies
PASS  no stacked double locale segment — https://juan-tech.com/websites
PASS  no unprefixed section href — https://juan-tech.com/en
FAIL  no unprefixed section href — https://juan-tech.com/en/blog
      6 offending href(s): href="/blog
PASS  no unprefixed section href — https://juan-tech.com/en/case-studies
PASS  no unprefixed section href — https://juan-tech.com/en/websites
PASS  no unprefixed section href — https://juan-tech.com/en/authors
PASS  at least one prefixed blog href — https://juan-tech.com/en/blog (21 match(es))
PASS  at least one prefixed case-study href — https://juan-tech.com/en/case-studies (12 match(es))
PASS  header has a locale-prefixed href — https://juan-tech.com/en (header) (7 match(es))
PASS  header has no unprefixed section href — https://juan-tech.com/en (header)
PASS  no locale prefix leaked into Spanish — https://juan-tech.com/blog
PASS  Spanish section hrefs still unprefixed — https://juan-tech.com/blog (38 match(es))
PASS  no locale prefix leaked into Spanish — https://juan-tech.com/case-studies
PASS  Spanish section hrefs still unprefixed — https://juan-tech.com/case-studies (23 match(es))
PASS  no locale prefix leaked into Spanish — https://juan-tech.com/websites
PASS  Spanish section hrefs still unprefixed — https://juan-tech.com/websites (22 match(es))
FAIL  breadcrumb has no link to the bare site root — https://juan-tech.com/en/blog (breadcrumb)
      1 offending href(s): href="/"
PASS  breadcrumb has no unprefixed section href — https://juan-tech.com/en/blog (breadcrumb)
FAIL  breadcrumb has a locale-prefixed href — https://juan-tech.com/en/blog (breadcrumb)
      expected at least one match, found none
PASS  breadcrumb has no link to the bare site root — https://juan-tech.com/en/case-studies (breadcrumb)
PASS  breadcrumb has no unprefixed section href — https://juan-tech.com/en/case-studies (breadcrumb)
PASS  breadcrumb has a locale-prefixed href — https://juan-tech.com/en/case-studies (breadcrumb) (1 match(es))
PASS  breadcrumb has no link to the bare site root — https://juan-tech.com/en/websites (breadcrumb)
PASS  breadcrumb has no unprefixed section href — https://juan-tech.com/en/websites (breadcrumb)
PASS  breadcrumb has a locale-prefixed href — https://juan-tech.com/en/websites (breadcrumb) (1 match(es))
PASS  Spanish breadcrumb still links the bare site root — https://juan-tech.com/blog (breadcrumb) (1 match(es))
PASS  no locale prefix leaked into Spanish breadcrumb — https://juan-tech.com/blog (breadcrumb)
PASS  Spanish breadcrumb still links the bare site root — https://juan-tech.com/case-studies (breadcrumb) (1 match(es))
PASS  no locale prefix leaked into Spanish breadcrumb — https://juan-tech.com/case-studies (breadcrumb)
PASS  Spanish breadcrumb still links the bare site root — https://juan-tech.com/websites (breadcrumb) (1 match(es))
PASS  no locale prefix leaked into Spanish breadcrumb — https://juan-tech.com/websites (breadcrumb)
PASS  breadcrumb coverage — 6 page(s) inspected
PASS  no unprefixed English services href — https://juan-tech.com/en
PASS  no Spanish services href on an /en page — https://juan-tech.com/en
PASS  no unprefixed English services href — https://juan-tech.com/en/blog
PASS  no Spanish services href on an /en page — https://juan-tech.com/en/blog
PASS  no unprefixed English services href — https://juan-tech.com/en/case-studies
PASS  no Spanish services href on an /en page — https://juan-tech.com/en/case-studies
PASS  no unprefixed English services href — https://juan-tech.com/en/websites
PASS  no Spanish services href on an /en page — https://juan-tech.com/en/websites
PASS  no unprefixed English services href — https://juan-tech.com/en/authors
PASS  no Spanish services href on an /en page — https://juan-tech.com/en/authors
PASS  no unprefixed English services href — https://juan-tech.com/blog
PASS  no unprefixed English services href — https://juan-tech.com/case-studies
PASS  no unprefixed English services href — https://juan-tech.com/websites

49 passed, 3 failed
prod-run-exit:1
```

**This non-zero exit is the pass condition.** All three failures are on `/en/blog`, the one page production still serves from the defective build, and they are exactly the two defects this task fixed:

1. `breadcrumb has no link to the bare site root — /en/blog` reports `href="/"` — the crumb url the CMS shares across both locales.
2. `breadcrumb has a locale-prefixed href — /en/blog` finds none, confirming the trail carries no `/en` anywhere.
3. Assertion 2 reports 6 unprefixed hrefs on the same page: the "All" tab's `/blog` plus the five `/blog/<category>` tabs.

Everything else passed, including the Spanish no-regression half on all three control pages, the two other `/en` breadcrumbs (helper-built, already correct), the coverage guard at 6 pages inspected, and the full services latch. The new assertions are therefore discriminating, not decorative — they fire on the one broken page and stay silent on the seven correct ones.

### Run B — the local run

**Could not be a green.** The local dev server (`npx next dev -p 3001`) starts and listens, but every route returns 500 because Payload cannot reach Neon Postgres:

```
Error: Error: cannot connect to Postgres: read ECONNRESET
    at async eval (src/lib/cache.ts:305:22)
  payloadInitError: true
```

This is the Neon outage already recorded in STATE.md (`Verificación HTTP en vivo pendiente por Neon caído`), not the draft-status 404 the plan anticipated, and not anything this change caused. Verbatim output of `node scripts/verify-locale-links.mjs`:

```
Verifying locale-prefixed hrefs against http://localhost:3001
locales=[es, en] default=es

FAIL  fetch http://localhost:3001/en
      expected 200, got 500
FAIL  fetch http://localhost:3001/en/blog
      expected 200, got 500
FAIL  fetch http://localhost:3001/en/case-studies
      expected 200, got 500
FAIL  fetch http://localhost:3001/en/websites
      expected 200, got 500
FAIL  fetch http://localhost:3001/en/authors
      expected 200, got 500
FAIL  fetch http://localhost:3001/blog
      expected 200, got 500
FAIL  fetch http://localhost:3001/case-studies
      expected 200, got 500
FAIL  fetch http://localhost:3001/websites
      expected 200, got 500
FAIL  breadcrumb coverage
      no fetched page rendered a <nav aria-label="Breadcrumb">

0 passed, 9 failed
local-run-exit:1
```

Every one of these nine failures is environmental and pre-existing. Two things are worth reading out of it anyway: the fetch guard did its job — eight 500s were reported as failures rather than silently satisfying every negative assertion — and the coverage guard fired exactly as designed, refusing to let a breadcrumb block that inspected nothing report success.

**The live green for `/en/blog` therefore lands on deploy.** No page in this repo could be served locally at execution time, so the GREEN half of this task is unobserved and I am not claiming it. What is proven: the code compiles, the guard behaves correctly on all 9 href shapes against the real module, and the new assertion fires on the real defect in the real deployed HTML. Re-run `VERIFY_BASE_URL=https://juan-tech.com node scripts/verify-locale-links.mjs` after deploy — it must reach `52 passed, 0 failed`.

## Sibling breadcrumb audit (Task 1, grep only, zero edits)

`grep -rn 'aria-label="Breadcrumb"' src/` returns five renderers. The verdict for each:

| Renderer | Crumb url source | Verdict |
|---|---|---|
| `src/blocks/Hero/Component.tsx` | CMS array field `Hero.breadcrumbs`, or a `blockProps` override | **The only defective one.** Fixed in this task. |
| `src/components/Breadcrumbs.tsx` | typed `BreadcrumbItem[]` from `src/lib/breadcrumbs.ts`; call sites are `case-studies/page.tsx` and `authors/[slug]/page.tsx` | **Shares no defect.** `homeHref('en')` returns `/en`, so the trail is prefixed at build time. Its plain `next/link` is correct — the locale-aware one would stack a second segment. No change. |
| `src/app/(frontend)/[locale]/websites/page.tsx` (inline trail) | `buildWebsitesTrail(locale)` | **Shares no defect.** Same helper, same reasoning. Confirmed live: `/en/websites` breadcrumb passes all three new assertions on production. |
| `src/app/(frontend)/[locale]/websites/[slug]/page.tsx` (inline trail) | `buildWebsitesTrail(locale, current)` | **Shares no defect.** Already carries an explicit comment saying so. |
| `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` (inline trail) | `buildCaseStudiesTrail(locale, current)` | **Shares no defect.** Confirmed live via the `/en/case-studies` breadcrumb pass. |

`src/components/SiteHeader.tsx`: **renders no breadcrumb at all.** Its only mention of the word is a comment on line 22 about `canonical.ts`/`breadcrumbs.ts` being locale-derived rather than folder-derived. **Shares no defect**, nothing to change.

So the plan's expectation held under grep: `Hero/Component.tsx` was the only component in the repo rendering a CMS-authored crumb url, and every other trail is helper-built and already locale-correct.

## Finding 3 (footer `/services`) — does not reproduce

Confirmed independently by the new services latch running against production. On all five `/en` pages fetched: zero unprefixed `/services` hrefs and zero `/servicios` hrefs. On all three Spanish controls: zero unprefixed `/services` hrefs. The footer Services column is already locale-correct on both sides.

`src/components/SiteFooter.tsx` is **unmodified** — `git diff --stat` on it is empty. The latch now holds that good state in place so a regression cannot land silently.

## The `/blog` blank-gap verdict

**Measured, not guessed. Verdict: NOT a bug. No code changed.**

A scratch Playwright script drove headless Chromium at 1280x900 against production `https://juan-tech.com/blog`: load to `networkidle`, read the initial state, scroll to the bottom in half-viewport steps with a 250ms pause each, settle 2.5s, then re-read. Raw result:

```json
{
  "url": "https://juan-tech.com/blog",
  "before": {
    "count": 15,
    "lastOpacityBeforeScroll": "0",
    "hiddenBeforeScroll": 9
  },
  "after": {
    "count": 15,
    "lastOpacityAfterScroll": "1",
    "stillHidden": [],
    "lastCardBottomPageY": 3107,
    "footerTopPageY": 3219,
    "gridToFooterGapPx": 112,
    "mainBottomPageY": 3155,
    "mainBottomToFooterTopPx": 64,
    "footerComputedMarginTop": "64px",
    "documentHeight": 4325,
    "elementsBetween": []
  }
}
```

The numbers, read against the decision rule:

- **Computed opacity of the last `[data-testid="scroll-reveal"]`: `0` before scrolling, `1` after.** Every one of the 9 initially-hidden reveals settled — `stillHidden` is empty. The IntersectionObserver fires correctly.
- **Grid-to-footer distance: 112px** from the last card's bottom edge to the footer's top edge, of which **64px is the footer's own computed `margin-top`** (`mt-16`) and the remaining 48px is the `<main>` element's own bottom padding. `mainBottomToFooterTopPx` is exactly 64, matching the margin to the pixel.
- **`elementsBetween` is empty** — scanning every element in the body taller than 100px that sits between the last card and the footer returns nothing. There is no spacer, no empty block, no stray element.

**Branch 1 of the decision rule fired.** The blank region in the screenshot is the SSR initial state of a scroll reveal, captured before the observer fired: 9 of the 15 reveal wrappers are server-rendered at `opacity: 0` with a 16px Y offset (the first 3 carry `priority` and skip the motion wrapper entirely, which is the deliberate LCP fix documented in `ScrollReveal.tsx`). A screenshot taken without scrolling therefore shows a tall stretch of nothing between the visible top rows and the footer.

**No SEO exposure.** All 15 cards are present in the DOM at load — `count` is 15 before any scrolling, the reveal only affects computed opacity, never presence. Crawlers get the full markup.

**Zero code changed for this task.** That is the complete and correct outcome here, not an omission. The scratch Playwright script was deleted; `git status --porcelain -- scripts/` shows only `verify-locale-links.mjs` plus Juan's two pre-existing untracked `_tmp-*` files.

### Secondary observation, recorded only — no change made

`/blog` shows the same recent posts up to three times: once in the 3-card "Destacados" featured block, once as the lead entry, and again at the top of the 12-card archive grid. That is a content/layout question for Juan, outside this task's scope, and nothing was touched.

## Deviations from Plan

None. The plan executed as written.

Two things worth naming that are not deviations:

- **Run B could not produce a green.** The plan anticipated `/blog` and `/en/blog` returning 404 locally from draft status. What actually happened is broader — Neon Postgres is unreachable, so all eight routes 500. Recorded verbatim above rather than worked around; per the plan's constraint, no content or database write was attempted.
- **The guard harness used the `Write` tool instead of a `printf` heredoc** to create `scripts/_tmp-verify-lzz.ts`. Byte-identical content, same `npx tsx` invocation, same deletion afterwards.

## Zero-DB confirmation

No migration was generated, no migration was run, no database write of any kind occurred. `git status --porcelain -- src/migrations` is empty. `Hero.breadcrumbs[].url` was **not** localized — `src/blocks/Hero/config.ts` is byte-unchanged, as are `src/lib/breadcrumbs.ts`, `src/lib/blog-paths.ts` and `src/components/SiteFooter.tsx`. The fix is render-time only, exactly as the plan required.

## Commits

| Task | Commit | Files |
|---|---|---|
| 1 | `7f2a079` | `src/blocks/Hero/Component.tsx`, `src/components/BlogCategoryTabs.tsx` |
| 2 | `d478103` | `scripts/verify-locale-links.mjs` |
| 3 | — | No code changed (diagnosis only; verdict is this document) |

Both commits were path-scoped with explicit `-- <paths>` on `git add` and `git commit`, and every hunk was reviewed with `git diff -- <path>` before staging, since other sessions share this checkout. The one pre-existing hunk carried in was the `BASE` port-3001 default in `verify-locale-links.mjs`, which the plan explicitly instructed to keep.

## Follow-Up

- **After deploy, re-run the production gate.** `VERIFY_BASE_URL=https://juan-tech.com node scripts/verify-locale-links.mjs` must reach `52 passed, 0 failed`. It is the only remaining unobserved assertion in this task.
- **Neon is down.** No route can be served locally until it is back. Unrelated to this change, already tracked in STATE.md.

## Self-Check: PASSED

- `src/blocks/Hero/Component.tsx` — FOUND, modified, committed in `7f2a079`
- `src/components/BlogCategoryTabs.tsx` — FOUND, modified, committed in `7f2a079`
- `scripts/verify-locale-links.mjs` — FOUND, modified, committed in `d478103`
- Commit `7f2a079` — FOUND in `git log`
- Commit `d478103` — FOUND in `git log`
- `npx tsc --noEmit` — re-run at task close, `tsc:0`
- `scripts/_tmp-verify-lzz.ts` — deleted, absent from the working tree
- `scripts/_tmp-blank-gap.mjs` — deleted, absent from the working tree
- `src/migrations` — empty in `git status --porcelain`
