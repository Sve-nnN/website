---
phase: 02-biling-e-seo
verified: 2026-07-09T00:00:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
overrides:
  - must_have: "src/middleware.ts contains: runtime = 'nodejs'"
    reason: "Plan 02-03 specified nodejs-runtime middleware to call Payload's Local API directly for the redirects lookup. During execution this was found to require Next.js's experimental.nodeMiddleware flag, which throws CanaryOnlyError on any non-canary release — this project is pinned to stable next@15.4.11 because @payloadcms/next@3.85.2's peerDependencies exclude 15.5.x+. The executor kept middleware.ts on the default Edge runtime (next-intl's createIntlMiddleware is Edge-safe) and delegated the actual Payload Local API redirects-collection query to a new Node.js Route Handler (src/app/api/redirects-lookup/route.ts), invoked via same-origin fetch from middleware. Both concerns (redirects execution + next-intl locale routing) remain composed in the single src/middleware.ts file — no second middleware file exists, matcher scope unchanged, T-02-01 open-redirect mitigation preserved unchanged in the route handler. External behavior verified identical via live curl tests (307/308 redirects, URL parity) documented in 02-03-SUMMARY.md and 02-05-SUMMARY.md. Deviation fully documented in code comments and SUMMARY, not a hidden stub."
    accepted_by: "verifier (auto-accepted per documented architectural constraint, functionally equivalent, independently confirmed via tsc + code inspection)"
    accepted_at: "2026-07-09T00:00:00Z"
---

# Phase 2: Bilingüe + SEO Verification Report

**Phase Goal:** El sitio tiene routing y contenido bilingüe EN/ES con paridad completa, y la capa de SEO técnico (metas, sitemaps, llms.txt, JSON-LD, redirects) queda operativa antes de que exista contenido migrado, para que la migración no tenga que remapear locales después.
**Verified:** 2026-07-09
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | next-intl routing config exists with `defaultLocale: 'es'`, `localePrefix: 'as-needed'` | ✓ VERIFIED | `src/i18n/routing.ts` contains exact literals; `src/i18n/request.ts` correctly wires `hasLocale`/`routing` |
| 2 | `localeDetection: false` explicitly disabled | ✓ VERIFIED | `src/i18n/routing.ts:10` — `localeDetection: false` with inline comment referencing RESEARCH.md Pitfall 1 |
| 3 | `next.config.mjs` wires next-intl plugin around `withPayload` without touching `output:standalone`/`images.remotePatterns` | ✓ VERIFIED | `next.config.mjs` exports `withPayload(withNextIntl(nextConfig))`, `output: 'standalone'` intact, `remotePatterns: []` untouched (comment notes Cloudinary added Phase 3, not wired here) |
| 4 | `payload.config.ts` declares `localization` block (es default, en secondary, fallback true) | ✓ VERIFIED | `localization: { locales: [es,en], defaultLocale: 'es', fallback: true }` present with sync-warning comment tying it to `src/i18n/routing.ts` |
| 5 | `Media.alt` is `localized: true` | ✓ VERIFIED | `src/collections/Media/index.ts` — `alt` field has `localized: true` |
| 6 | `Llms` global exists and registered | ✓ VERIFIED | `src/globals/Llms/index.ts` exports valid `GlobalConfig` (slug `llms`, `llmsTxt`/`llmsFull` textareas); `payload.config.ts` has `globals: [Llms]` |
| 7 | Schema change applied to live Neon via `migrate:create`/`migrate`, never `push:true` | ✓ VERIFIED | `push: false` hard-coded literal in `payload.config.ts`; new migration `20260709_201401_phase2_i18n_seo.ts` (1076 lines, 281 `_locales`/`CREATE TABLE` occurrences, 5 `llms` references) committed and registered in `src/migrations/index.ts` |
| 8 | `/` serves Spanish unprefixed, `/en` serves English prefixed, `/es` redirects to `/`, Accept-Language never overrides root | ✓ VERIFIED (documented live evidence) | 02-03-SUMMARY.md + 02-05-SUMMARY.md document concrete curl results: `/` 200 es, `/en` 200 en, `/es` 307→`/`, Accept-Language:en-US on `/` still serves Spanish. Code inspection confirms `localePrefix:'as-needed'` + `localeDetection:false` + single middleware composing `createIntlMiddleware(routing)` |
| 9 | `/admin` and `/api` never touched by locale rewriting | ✓ VERIFIED | `src/middleware.ts` `config.matcher: ['/', '/((?!api|admin|_next|_vercel|.*\\..*).*)']` explicitly excludes both; documented curl confirms `/admin` 200/unrewritten |
| 10 | A redirect matched in `redirects` collection issues a real HTTP redirect before any page renders | ✓ VERIFIED (with documented architecture deviation, see override) | `src/middleware.ts` fetches `/api/redirects-lookup`, returns `NextResponse.redirect(..., 308)` on match, falls through to `intlMiddleware` otherwise; `src/app/api/redirects-lookup/route.ts` does the actual `payload.find({ collection: 'redirects' })` Local API lookup; documented curl: `/legacy-test-url` → 308 → `/` |
| 11 | Home page renders hand-written Person JSON-LD via `JSON.stringify` | ✓ VERIFIED | `src/components/JsonLd.tsx` uses `JSON.stringify(data)` inside `dangerouslySetInnerHTML`; `[locale]/page.tsx` renders `<JsonLd data={personData} />` with `@type: 'Person'` |
| 12 | `/sitemap.xml` reflects real pages/posts/case-studies/authors/categories via Local API, not static/plugin | ✓ VERIFIED | `src/app/sitemap.ts` queries all 5 collections via `payload.find({ locale: 'all', ... })`, `_status:'published'` filter correctly scoped to only the 3 drafts-enabled collections, `alternates.languages` (es/en) on every entry |
| 13 | `/robots.txt` native Next.js convention, disallows `/admin`/`/api`, references sitemap | ✓ VERIFIED | `src/app/robots.ts` — `disallow: ['/admin','/api']`, `sitemap: ${SITE_URL}/sitemap.xml` |
| 14 | `/llms.txt`/`/llms-full.txt` publicly reachable, read from `Llms` global, reflect edits without redeploy | ✓ VERIFIED | Both route handlers `force-dynamic`, call `payload.findGlobal({ slug: 'llms' })`, return `llmsTxt`/`llmsFull` respectively as `text/plain` |
| 15 | Bilingual test content exists (Page/Post/CaseStudy/Author/Category) proving field-level localization end to end | ✓ VERIFIED | `scripts/seed-phase2.ts` (322 lines) creates all 6 entities + Llms global using the two-call locale pattern (`create` es, `update` en); idempotency check via `find` before `create`; documented second-run output confirms "already exists, skipping" |
| 16 | Test redirect doc exists and produces a real HTTP redirect via middleware | ✓ VERIFIED | Seed creates `{ from: '/legacy-test-url', to: { type: 'custom', url: '/' } }`; documented curl: 308 → `/` |
| 17 | `Llms` global has real seeded content, `/llms.txt`/`/llms-full.txt` non-empty | ✓ VERIFIED | Seed calls `payload.updateGlobal({ slug: 'llms', data: { llmsTxt, llmsFull } })` with real placeholder text; documented curl confirms non-empty response |
| 18 | At least one post detail page and case-study detail page render valid hand-written JSON-LD (Article, CreativeWork/BreadcrumbList) | ✓ VERIFIED | `blog/[slug]/page.tsx` renders one `<JsonLd data={articleData}>` (`@type: Article`); `case-studies/[slug]/page.tsx` renders two blocks (`@type: CreativeWork`, `@type: BreadcrumbList`); both call `notFound()` on empty query |
| 19 | SEO tab fields (meta.title/description) appear in rendered `<title>`/`<meta description>` | ✓ VERIFIED | All 3 `generateMetadata` functions (`[locale]/page.tsx`, `blog/[slug]/page.tsx`, `case-studies/[slug]/page.tsx`) read `doc.meta?.title`/`doc.meta?.description` before falling back to raw fields; seed script populates `meta` per locale on Page/Post |

**Score:** 19/19 truths verified (6/6 roadmap requirement IDs: I18N-01 through I18N-06)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/i18n/routing.ts` | `defineRouting()` w/ locked decisions | ✓ VERIFIED | Exact literals present |
| `src/i18n/request.ts` | `getRequestConfig()` | ✓ VERIFIED | Imports `hasLocale`, `routing` correctly |
| `messages/es.json` / `messages/en.json` | UI string catalogs | ✓ VERIFIED | Valid JSON, matching `nav`/`home`/`common` keys, real translated values |
| `src/payload.config.ts` | localization + Llms global + seoPlugin generate fns | ✓ VERIFIED | All three present |
| `src/collections/Media/index.ts` | `localized: true` on `alt` | ✓ VERIFIED | Present |
| `src/globals/Llms/index.ts` | `GlobalConfig` export | ✓ VERIFIED | Present, matches shape |
| `src/migrations/index.ts` + new migration file | schema applied to Neon | ✓ VERIFIED | New migration committed, registered, `payload migrate:status` reported clean in 02-02-SUMMARY |
| `src/middleware.ts` | composed redirects + next-intl routing | ✓ VERIFIED (architecture deviated, see override) | Single file, both concerns present (fetch to redirects-lookup + `createIntlMiddleware`); `runtime='nodejs'` literal absent — see override entry |
| `src/app/api/redirects-lookup/route.ts` | Node.js route handler doing actual Local API lookup | ✓ VERIFIED (not in original plan file list, but required by the deviation) | Present, does `payload.find({ collection: 'redirects' })`, resolves `custom`/`reference` targets, never reads `searchParams` as redirect target |
| `src/app/(frontend)/[locale]/layout.tsx` | root layout w/ generateStaticParams | ✓ VERIFIED | Exports both `generateStaticParams` and default, `setRequestLocale`, `NextIntlClientProvider` |
| `src/app/(frontend)/[locale]/page.tsx` | home page w/ generateMetadata + Person JSON-LD | ✓ VERIFIED | Both present |
| `src/components/JsonLd.tsx` | shared JSON-LD component | ✓ VERIFIED | `JSON.stringify` used, exported `JsonLd` |
| `src/app/sitemap.ts` | MetadataRoute.Sitemap, 5 collections + alternates | ✓ VERIFIED | Present |
| `src/app/robots.ts` | MetadataRoute.Robots | ✓ VERIFIED | Present |
| `src/app/llms.txt/route.ts`, `src/app/llms-full.txt/route.ts` | GET handlers reading Llms global | ✓ VERIFIED | Present, force-dynamic |
| `scripts/seed-phase2.ts` | idempotent seed script | ✓ VERIFIED | Present, 322 lines, all 7 entities |
| `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` | post detail w/ Article JSON-LD | ✓ VERIFIED | Present |
| `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` | case study detail w/ CreativeWork+BreadcrumbList JSON-LD | ✓ VERIFIED | Present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `next.config.mjs` | `src/i18n/request.ts` | `createNextIntlPlugin` | ✓ WIRED | Confirmed |
| `src/i18n/request.ts` | `src/i18n/routing.ts` | `import { routing }` | ✓ WIRED | Confirmed |
| `src/payload.config.ts` | `src/globals/Llms/index.ts` | `globals: [Llms]` | ✓ WIRED | Confirmed |
| `src/payload.config.ts` | Neon Postgres | `payload migrate` | ✓ WIRED | Migration applied, confirmed via `payload migrate:status` per 02-02-SUMMARY |
| `src/middleware.ts` | `src/i18n/routing.ts` | `createIntlMiddleware(routing)` | ✓ WIRED | Confirmed |
| `src/middleware.ts` | redirects collection | via delegated fetch to `src/app/api/redirects-lookup/route.ts` → `payload.find({ collection: 'redirects' })` | ✓ WIRED (indirect, documented) | Deviates from plan's literal `payload.find` call directly inside `middleware.ts`, but the link is real and functions identically at the HTTP level |
| `[locale]/page.tsx` | pages collection | `payload.find({ collection: 'pages', where: { slug: 'home' } })` | ✓ WIRED | Confirmed |
| `sitemap.ts` | 5 collections | `payload.find({ collection, locale: 'all' })` | ✓ WIRED | Confirmed |
| `llms.txt/route.ts` | Llms global | `payload.findGlobal({ slug: 'llms' })` | ✓ WIRED | Confirmed |
| `scripts/seed-phase2.ts` | redirects collection | `payload.create({ collection: 'redirects', ... })` | ✓ WIRED | Confirmed |
| `blog/[slug]/page.tsx` | posts collection | `payload.find({ collection: 'posts', where: { slug }, locale, depth: 1 })` | ✓ WIRED | Confirmed |
| `case-studies/[slug]/page.tsx` | case-studies collection | `payload.find({ collection: 'case-studies', where: { slug }, locale })` | ✓ WIRED | Confirmed |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `npx tsc --noEmit` (whole project, including all Phase 2 files) | `npx tsc --noEmit` | Exit code 0, no errors | ✓ PASS |
| Single middleware file, no second middleware.ts | `find . -name "middleware.ts" -not -path "*/node_modules/*"` | Only `src/middleware.ts` | ✓ PASS |
| `localeDetection: false` present | `grep "localeDetection: false" src/i18n/routing.ts` | Present | ✓ PASS |
| No Cloudinary wiring | `grep -ril cloudinary src next.config.mjs` | Only a forward-looking comment in `next.config.mjs` ("add Cloudinary hostname pattern in Phase 3") — no actual wiring | ✓ PASS |
| No Mongo migration script | `grep -ril mongo src scripts` | No matches | ✓ PASS |
| No debt markers (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) in Phase 2 files | grep across all Phase-2-modified files | No matches | ✓ PASS |
| Live dev-server curl re-run by verifier | attempted `curl localhost:3000/...` | Port 3000 was occupied by a **different, unrelated project** ("Auditor" app, cwd `.../auditor/apps/web`) — this project's dev server was not running in this session, so I could not independently re-run the live checks | ? SKIP — per task instructions, documented curl evidence in 02-03/02-05-SUMMARY.md (exact status codes, exact grep matches) is treated as sufficient given its specificity; code-level inspection is fully consistent with the claimed behavior |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| I18N-01 | 02-01, 02-02, 02-03 | next-intl routing/UI + Payload localization, full parity | ✓ SATISFIED | routing.ts, request.ts, localization block, middleware, [locale] pages all present and wired |
| I18N-02 | 02-02, 02-05 | `plugin-seo` tabbed on Pages/Posts/CaseStudies | ✓ SATISFIED | `seoPlugin({ collections: ['pages','posts','case-studies'], tabbedUI: true, generateTitle, generateDescription })`; seed populates `meta` per locale; `generateMetadata` reads it |
| I18N-03 | 02-04 | Sitemap/robots dynamic, no plugin | ✓ SATISFIED | `sitemap.ts`/`robots.ts` hand-written, Local API driven |
| I18N-04 | 02-02, 02-04 | llms.txt/llms-full.txt for GEO/AI discoverability | ✓ SATISFIED | Llms global + 2 route handlers, force-dynamic |
| I18N-05 | 02-03, 02-05 | Hand-written JSON-LD (Person, Article, BreadcrumbList) | ✓ SATISFIED | JsonLd component + Person/Article/CreativeWork/BreadcrumbList instances |
| I18N-06 | 02-03, 02-05 | `plugin-redirects` + middleware/route handler executing redirects | ✓ SATISFIED | redirectsPlugin (Phase 1) + middleware→route-handler execution path, tested with seeded redirect doc |

No orphaned requirements — all 6 I18N-* IDs from REQUIREMENTS.md are claimed across the 5 plans and covered by evidence above.

### Anti-Patterns Found

None. Scanned all files created/modified across all 5 plans for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|not yet implemented|coming soon` — zero matches. The seed script's placeholder content (`test-post`, "Placeholder llms.txt...") is explicitly sanctioned by 02-CONTEXT.md as intentional Phase 2 plumbing-validation data, not a stub hiding missing functionality — real content arrives in Phase 4.

### Human Verification Required

None required to pass this phase. The one item that would ordinarily require a human (live URL parity / redirect / JSON-LD behavior) is already covered by concrete, specific curl evidence documented in 02-03-SUMMARY.md and 02-05-SUMMARY.md (exact HTTP status codes, exact grep matches against real seeded content), which per the verification task's explicit instruction is treated as sufficient without re-running the dev server. If Juan wants an independent live re-confirmation, it would require starting `npm run dev` against the live Neon DB and re-running the curl suite documented in 02-05-SUMMARY.md — optional, not blocking.

### Gaps Summary

No blocking gaps. One documented architectural deviation (middleware delegates the Payload Local API redirects lookup to a Node.js Route Handler instead of running `middleware.ts` itself under `runtime='nodejs'`) was found, fully explained by a real Next.js/Payload version-compatibility constraint (CanaryOnlyError on stable Next 15.4.11), preserves all external behavior and security mitigations, and is accepted via the override entry above rather than treated as a blocker.

---

_Verified: 2026-07-09_
_Verifier: Claude (gsd-verifier)_
