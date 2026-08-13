---
phase: quick-260813-o0n
plan: 01
subsystem: i18n-routing
tags: [next-intl, routing, seo, links]
status: complete
live_verification: blocked-db-unreachable
requires: []
provides:
  - "src/i18n/navigation.ts — locale-aware Link + isPrefixableHref guard"
  - "scripts/verify-locale-links.mjs — runnable HTTP assertion suite"
affects:
  - "every internal <Link> on the public frontend"
tech-stack:
  added: []
  patterns:
    - "createNavigation(routing) consuming the same routing object as the middleware"
    - "isPrefixableHref guard for admin-authored hrefs, resolved once per component"
key-files:
  created:
    - src/i18n/navigation.ts
    - scripts/verify-locale-links.mjs
  modified:
    - src/components/CaseStudyCard.tsx
    - src/components/WebsiteCard.tsx
    - src/components/AuthorByline.tsx
    - src/components/AuthorCard.tsx
    - src/components/PostCard.tsx
    - src/components/FeaturedEntry.tsx
    - src/components/CMSLink.tsx
    - src/components/SiteHeaderChrome.tsx
    - src/components/SiteFooter.tsx
    - src/blocks/ServicesShowcase/Component.tsx
    - src/components/Breadcrumbs.tsx
    - src/components/LocaleSwitcher.tsx
    - src/app/(frontend)/[locale]/authors/page.tsx
    - src/app/(frontend)/[locale]/authors/[slug]/page.tsx
    - src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx
    - src/app/(frontend)/[locale]/search/page.tsx
    - src/app/(frontend)/[locale]/websites/page.tsx
    - src/app/(frontend)/[locale]/websites/[slug]/page.tsx
    - src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx
    - src/blocks/Hero/Component.tsx
    - src/lib/blog-paths.ts
decisions:
  - "Locale switcher anchors are stripped in BOTH directions by the verification script, not just the es-target one, or assertion 5 false-fails on the switcher's own /en href"
  - "Live HTTP verification could not run: the Neon Postgres endpoint refused every connection for the duration of the session"
  - "Services keep the plain next/link everywhere (footer column and ServicesShowcase): their URL segment is translated, not merely prefixed, so no generic prefix can produce it"
  - "isPrefixableHref returns true for the Spanish service hrefs, not false — the locale-aware Link is a no-op there only because es is the default locale"
metrics:
  duration: ~75min
  completed: 2026-08-13
---

# Quick Task 260813-o0n: Locale-aware Link via next-intl navigation — Summary

Created the `src/i18n/navigation.ts` module the project never had, and routed every
internal `<Link href>` that was rendering unprefixed through it, so a reader on `/en`
stops being dropped into Spanish on the next click.

## What changed

`routing.ts` uses `localePrefix: 'as-needed'` with `defaultLocale: 'es'`, which makes an
unprefixed path the Spanish URL. The middleware only rewrites incoming requests, so
nothing was prefixing outgoing hrefs. That is now done at render time by the locale-aware
`Link`, which reads the active locale from the `NextIntlClientProvider` already wrapping
the whole frontend tree.

`isPrefixableHref` sits next to it for admin-authored values: it rewrites only hrefs that
start with a single slash and do not already open with a locale segment, so absolute URLs,
`mailto:`/`tel:`, bare fragments, protocol-relative URLs, and hand-prefixed paths pass
through the plain component untouched.

## Per-file decision table, as executed

### Swapped to the locale-aware Link (12)

| File | Link site(s) | How |
|---|---|---|
| `src/components/CaseStudyCard.tsx` | L16 | straight import swap |
| `src/components/WebsiteCard.tsx` | L11 | straight import swap |
| `src/components/AuthorByline.tsx` | L24 | straight import swap |
| `src/components/AuthorCard.tsx` | L44, L49 | straight import swap; the `social.url` anchor left alone |
| `src/components/PostCard.tsx` | L38 | straight import swap |
| `src/components/FeaturedEntry.tsx` | L88 | straight import swap |
| `src/app/(frontend)/[locale]/authors/page.tsx` | L57 | straight import swap |
| `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx` | L156 | straight import swap |
| `src/app/(frontend)/[locale]/search/page.tsx` | L129 | straight import swap; `hrefFor()` still returns unprefixed paths, and its `'#'` fallback has no leading slash so it passes through |
| `src/app/(frontend)/[locale]/websites/[slug]/page.tsx` | L241 only | added `Link as LocaleLink` alongside the existing plain import; the L132 breadcrumb keeps the plain component and now says why in the file |
| `src/components/CMSLink.tsx` | both render branches | `const LinkComponent = isPrefixableHref(href) ? LocaleLink : PlainLink`, resolved once above the return so the Button-asChild branch and the anchor branch cannot drift |
| `src/components/SiteHeaderChrome.tsx` | L150 logo, both CTAs | logo dropped its hand-picked `locale === 'en' ? '/en' : '/'` expression for a plain `/` on the locale-aware Link; the two CTAs share one `ctaHref` + `CtaLink` pair computed above the return |

### Deliberately left on `next/link` (6) — each now carries its reason in the file

| File | Reason written in the file |
|---|---|
| `src/components/Breadcrumbs.tsx` | trail urls arrive already locale-prefixed from `src/lib/breadcrumbs.ts`, and the same array feeds `buildBreadcrumbJsonLd()` |
| `src/app/(frontend)/[locale]/websites/page.tsx` | its only `<Link>` renders a breadcrumb url, already prefixed |
| `src/blocks/Hero/Component.tsx` | same — breadcrumb url; the hero CTA row goes through `CMSLink`, which is fixed |
| `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` | its only `<Link>` is an external speaking-event URL |
| `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` | one breadcrumb url plus two CTAs that already build the prefix from the `localePrefix` constant |
| `src/components/LocaleSwitcher.tsx` | cross-locale by design; an explicit `locale` prop would force a prefix even for the default locale, emitting a non-canonical URL plus a redirect hop |

### Docblock correction

`src/lib/blog-paths.ts` no longer claims the middleware resolves in-page hrefs. Zero code
changed in that file — `blogPostPath()`, `blogCategoryPath()`, `blogIndexPath()` and
`localizeBlogPath()` all behave exactly as before.

## Decisions that changed during execution

**One, in the verification script.** The plan said to strip anchors whose `hreflang` is
`es` (the locale switcher, whose unprefixed Spanish target would otherwise trip the
negative checks). Read against the real component, `LocaleSwitcher` renders
`hrefLang={otherLocale}`, so on a Spanish control page the same anchor carries
`hreflang="en"` and points at `/en/…` — which would have false-failed assertion 5 ("no
locale prefix leaked into Spanish"). The script therefore strips anchors carrying *any*
site locale in `hreflang`, which is the same intent generalized to both directions. The
reason is written in the script.

Nothing else deviated. No file was swapped or refused against the plan's call.

## Verification

**Ran and passed:**

- `npx tsc --noEmit` → exit 0, after Task 1 and again after Task 2 and Task 3. It was
  exit 0 before this work, so it is a meaningful gate.
- Import gates (the plan's Task 2 script): the 9 straight-swap files import the named
  `Link` from `@/i18n/navigation` and none default-imports `next/link` — `import gates OK`.
- `git status --porcelain` on the three deferred files → empty (`deferred files unstaged OK`).
- `git diff -- src/lib/breadcrumbs.ts` → empty. Breadcrumb urls and their `BreadcrumbList`
  JSON-LD are byte-unchanged.
- `blog-paths OK` — the false middleware claim is gone and `blogPostPath` still exports.
- **`isPrefixableHref` unit-tested against the real committed module** (via `tsx`): 15/15
  cases pass, including `/entrevistas` → `true` (a slug that merely starts with `en` is not
  mistaken for the prefix), `/en/contact` → `false`, and `//evil.com/x` → `false` (the
  T-o0n-01 mitigation).
- **Verification-script assertion logic proved offline** against synthetic documents: 11/11
  on the original version, then **12/12 again after the footer follow-up** rewrote the
  scoping. The decisive case in the second run: the updated assertion 2 **catches the exact
  footer defect that the old footer-sliced version would have passed**, which is what makes
  dropping the exclusion meaningful rather than cosmetic. Also covered: the double-prefix
  catch, the `/entrevistas` non-match, `/en` home with the ServicesShowcase block, switcher
  stripping in both directions, and external social URLs matching no guard.
- `isPrefixableHref` re-run against the **real footer href shapes** (`buildServiceHref` for
  both locales, `blogPostPath`, the case-study shape, both `contactHref` forms, typical
  admin values) — output quoted in the follow-up section below.
- `node --check scripts/verify-locale-links.mjs` → exit 0.
- No migration was generated and nothing wrote to the database.

**NOT run — blocked:** every live HTTP assertion, i.e. the tracer's `curl` check and
`node scripts/verify-locale-links.mjs` against a running server.

## Blocker: Neon Postgres unreachable

The dev server starts and compiles, but every page returns 500 with
`cannot connect to Postgres: read ECONNRESET`. Verified independently of Next:

- DNS resolves and the TCP handshake on `:5432` succeeds
- the Postgres session is reset immediately afterwards, on ~37 attempts over ~13 minutes
- same result on the direct and the `-pooler` endpoint, and under `sslmode=require`,
  `sslmode=no-verify`, and `uselibpqcompat=true`
- general internet connectivity from this machine is fine
- **retried once more during the footer follow-up**, on a freshly started dev server
  (`✓ Ready in 5.3s`): identical `read ECONNRESET`, all 8 fetches 500, script exit non-zero,
  `0 passed, 8 failed`. The script failed on the fetches, which is the designed behavior —
  an error page must never read as a pass.

So it is the Neon endpoint (suspended, archived, or quota), not the network, not this
change. Nothing here can be worked around locally: every page in scope needs the database
to render, so there is no rendered HTML to assert against.

**What to run once the database is back** (in this order, both from the repo root):

```bash
npm run dev                          # in one terminal
node scripts/verify-locale-links.mjs # in another — exit 0 = all assertions pass
```

Then the human check from the plan: load `http://localhost:3000/en`, click a case-study
card, a blog post card, a header nav item and the header CTA — each destination should keep
the `/en` prefix in the address bar — and confirm the locale switcher lands on the
unprefixed Spanish equivalent rather than `/es/…`.

Until that runs, treat the swap as type-correct and logic-verified but not yet proven
against rendered HTML.

## Follow-up required — CLOSED (commit `3209270`)

The two deferred files were released once the other session pushed its footer work
(`741f09d`). The residual gap named above is now closed. What each turned out to need:

**`src/components/SiteFooter.tsx` — was the real defect.** Re-read from scratch (the other
session had restructured it: closing band, five `<nav>` groups, new Services column). Its
hrefs are mixed, and each shape got a different call:

| Line | Href | Call |
|---|---|---|
| `:114` feed | `blogPostPath(...)` | **locale-aware Link** — unprefixed, the original defect |
| `:135` feed | `` `/case-studies/${doc.slug}` `` | **locale-aware Link** — same defect |
| `:73`/`:86` | `buildServiceHref` / `buildServicesIndexHref` | plain `next/link`, reason in the file |
| `:184` CTA | `contactHref` | **locale-aware Link** with a plain `/contact` |
| `:224` | `item.link.url` | admin-authored → `isPrefixableHref` picks the component |
| `:299` | `legal.href` | admin-authored → same guard |
| `:276` | `social.url` | untouched plain `<a>` — external |

Both feeds share one render loop, so a single swap covers posts and case studies. Before
swapping them I confirmed `case-studies` and `blog` each live in a **single** route folder
under `[locale]` (`find src/app/(frontend)/[locale]/… -name page.tsx`), unlike services,
which really does have two physical folders — so `/en/case-studies/<slug>` resolves and a
generic prefix is the right transform. `contactHref` was
`typedLocale === 'en' ? '/en/contact' : '/contact'`; it now passes plain `/contact` to the
locale-aware Link, which emits the identical URLs and removes one hand-maintained prefix.

**`src/blocks/ServicesShowcase/Component.tsx` — needed no change**, as the coordinator
called it. Its only `<Link>` takes `buildServiceHref(locale, slug)`, already locale-correct
at source. It keeps `next/link` and now carries the same style of refusal comment as the
other six.

**One correction to the stated premise, verified rather than trusted.** The claim was that
`isPrefixableHref` returns `false` for the service hrefs, making the locale-aware Link a
no-op. Run against the real module, that holds only for **English**:

```
passthrough  /en/services/seo-technical-audit   buildServiceHref(en)
PREFIXABLE   /servicios/seo-technical-audit     buildServiceHref(es)
```

On Spanish the guard returns `true`. Routing them through the locale-aware Link is still a
no-op, but because `es` is the default locale and takes no prefix — not because the guard
rejects them. Either way the plain link is the honest call: the service URL **segment** is
translated, not merely prefixed, so no generic prefix can produce it.

**`scripts/verify-locale-links.mjs` updated.** The deliberate footer exclusions are gone:
the `</main>` truncation is deleted, `sliceBeforeFooter` is removed entirely, and `/en`
(home) is no longer skipped by the unprefixed-href assertion. Every assertion now runs on
the whole document. The locale-switcher stripping stays.

**Nothing remains open from this task.** One pre-existing item worth naming, not introduced
and not fixed here: a footer column link stored as `/services` (a non-localized Payload
field) still renders as `/services` on Spanish rather than the canonical `/servicios` — the
same non-localized-field bug already corrected in the header via `normalizeServiceHref`.
This change does not worsen it and improves the English side (`/services` → `/en/services`).

`src/lib/service-slugs.ts` was off-limits and remains untouched.

## Standing item, not introduced here

`CMSLink`/`ctaButton.href` will happily render a `javascript:` URI typed into the admin.
`isPrefixableHref` returns `false` for it, so this change neither creates nor worsens the
risk — it is pre-existing and out of scope, noted so it is not lost (T-o0n-02).

## Commits

| Task | Commit | What |
|---|---|---|
| 1 | `8aeeb96` | `feat`: `src/i18n/navigation.ts` + `CaseStudyCard` as the vertical slice |
| 2 | `a0302d3` | `fix`: 11 more files routed through the guard/Link, 6 refusals documented, docblock corrected |
| 3 | `9a87b1e` | `test`: `scripts/verify-locale-links.mjs` |
| follow-up | `3209270` | `fix`: footer gap closed, ServicesShowcase refusal documented, script exclusions dropped |

All four were path-scoped (`git commit … -- <paths>`) because another session was working
in the same checkout with a large staged index. Its commits (`9909a33`, `741f09d`)
interleaved with mine without collision, and no file outside my explicit path list was ever
staged by me.

## Self-Check: PASSED

- `src/i18n/navigation.ts` — FOUND
- `scripts/verify-locale-links.mjs` — FOUND
- commits `8aeeb96`, `a0302d3`, `9a87b1e`, `3209270` — all FOUND in `git log`
- `git status --porcelain -- src/ scripts/verify-locale-links.mjs` — empty, everything committed
- no file deletions in any of the four commits
- `npx tsc --noEmit` → exit 0 as the final state of the tree
