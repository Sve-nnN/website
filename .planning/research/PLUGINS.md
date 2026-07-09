# Plugin Research: Payload CMS 3.x Ecosystem

**Domain:** Payload CMS 3.x plugin ecosystem (official `@payloadcms/*` + community) for a self-maintained personal portfolio/blog
**Researched:** 2026-07-09
**Confidence:** HIGH on official packages (verified via npm registry directly), MEDIUM on community Cloudinary adapters (verified via npm registry + GitHub, but small projects with limited independent validation), LOW-MEDIUM on niche community add-ons (comments/newsletter/table-of-contents) — verified to exist but not deeply vetted for production use

## Method Note

All official `@payloadcms/*` package versions below were pulled directly from the npm registry API (`registry.npmjs.org`), not from training data. All community packages were checked for latest version, publish date, and peer-dependency declarations the same way, plus GitHub star counts / activity via WebFetch. Every official Payload package (plugin-seo, plugin-redirects, plugin-nested-docs, plugin-search, plugin-form-builder, email-resend, storage-s3, plugin-cloud-storage) is at **3.85.2**, published **2026-07-01** — they ship as one monorepo release train, confirming this matches the reference codebase (aprendoclub, Payload 3.85) and is the current stable line as of this research date.

---

## 1. Official Plugins — Evaluated

| Plugin | Package | Version | Verdict | Reason |
|---|---|---|---|---|
| SEO | `@payloadcms/plugin-seo` | 3.85.2 | **SÍ USAR** | Explicit PROJECT.md requirement. Adds tabbed meta/OG/canonical UI to Pages/Posts/CaseStudies. Already proven in aprendoclub (`seoPlugin({ collections: ['pages','blogposts'], uploadsCollection: 'media', tabbedUI: true })`). Zero reason to hand-roll this. |
| Redirects | `@payloadcms/plugin-redirects` | 3.85.2 | **SÍ USAR** | Needed for slug-change 301s (current JuanPortfolio has a custom `createRedirectOnSlugChange` hook doing this manually — the plugin replaces that hook cleanly). **Caveat confirmed via official docs:** the plugin only manages the `redirects` collection in the admin/DB — it does NOT execute the redirect. You still need a Next.js middleware or route handler that reads the collection and issues the 301, same pattern apturio already has in `next.config.mjs` for hardcoded redirects (those stay hardcoded; DB-driven ones need a small middleware, e.g. Payload's own website template ships this exact pattern). |
| Nested Docs | `@payloadcms/plugin-nested-docs` | 3.85.2 | **NO USAR (por ahora)** | Only useful if Pages need hierarchical/nested URL structure (e.g. `/services/seo/technical-seo`). Portfolio site's page list (home, blog, case-studies, authors, contact, privacy, terms, search) is flat — no nesting. aprendoclub itself includes it wired but with `collections: []` (i.e., installed but doing nothing) — do not repeat that pattern of speculative installs. Revisit only if Phase 1 content audit reveals an actual nested-page need. |
| Search | `@payloadcms/plugin-search` | 3.85.2 | **EVALUAR MÁS → probable SÍ, pero en fase posterior** | Runs entirely on your own Postgres DB (no external service like Algolia needed), auto-syncs a search collection as docs change, supports cross-collection search with priority sorting. Given PROJECT.md explicitly lists `search` as one of the pages to replicate, this is the correct low-maintenance way to build it (vs hand-rolling ILIKE queries). Not "clutter" — it's a small, self-contained official plugin with no external dependency, which fits the "backend Juan maintains alone" constraint. Defer to the phase where the search page is actually built (not needed in initial collections/schema phase). |
| Form Builder | `@payloadcms/plugin-form-builder` | 3.85.2 | **NO USAR** | Explicit Out of Scope in PROJECT.md — confirmed correct call. It's a generic form-builder (dynamic field configs, submission storage, conditional logic) sized for marketing sites with many forms. This project has exactly one form (contact) — a simple collection + Resend send in an API route/server action is less code, less admin surface, and avoids a whole extra collection (`form-submissions`) plus admin UI nobody needs to touch after initial setup. |
| Cloud Storage (base) | `@payloadcms/plugin-cloud-storage` | 3.85.2 | **SÍ USAR (como dependencia, no directamente)** | This is the underlying adapter framework that official adapters (S3, Azure, GCS, R2, Vercel Blob, Uploadthing) AND the community Cloudinary packages below are built on. You will consume it indirectly through whichever Cloudinary package/custom adapter you choose (see Section 2) — do not configure it manually unless writing a fully custom adapter. |
| Email (Resend) | `@payloadcms/email-resend` | 3.85.2 | **SÍ USAR** | Confirmed still correct and current — see Section 4. |
| Sitemap | *(no official package exists)* | — | **N/A — construir manual** | Payload does not ship an official `plugin-sitemap`. Confirmed via official docs search: the standard, currently-recommended pattern (per Payload's own guide "How to build an SEO-friendly sitemap in Payload + Next.js") is a Next.js route handler or `app/sitemap.ts` using Next's built-in `MetadataRoute.Sitemap` API, querying Payload's Local API directly (`payload.find({ collection: 'pages', limit: 0 })` etc.), not an installed plugin. See Section 3. |

---

## 2. Storage: Cloudinary Adapter (the critical open question)

**Confirmed: no official Payload Cloudinary adapter exists.** Official list (verified via `payloadcms.com/docs/upload/storage-adapters`): Vercel Blob, AWS S3, Azure Blob, Google Cloud Storage, Uploadthing, Cloudflare R2. Cloudinary is not among them.

### Community options evaluated (verified via npm registry + GitHub)

| Package | Latest | Published | Downloads/mo | Peer dep on `payload` | GitHub | Verdict |
|---|---|---|---|---|---|---|
| `payload-cloudinary` (SyedMuzamilM) | 2.3.0 | 2026-02-17 | ~1,330 | **`^2.0.0`** ⚠️ | 43 stars, 72 commits, 7 forks, 1 open issue | **NO USAR** — despite highest star count and downloads, its declared `peerDependencies.payload` is `^2.0.0` (Payload 2.x), even though it depends on `@payloadcms/plugin-cloud-storage@^3.25.0` (a v3-only package). This is either a stale/incorrect peer-dependency declaration or genuine v2-targeting code with a mismatched dependency — either way it's a quality-control red flag for a package you'd depend on in production. Do not install without manually verifying against Payload 3.85 first, and even then prefer an alternative below. |
| `@pemol/payload-cloudinary` (same author, scoped fork) | 1.6.1 | 2025-03-15 | low | not verified separately | — | **NO USAR** — older, stale duplicate of the above by the same author; superseded by the unscoped `payload-cloudinary` package. Two packages from one author for the same purpose is itself a signal of an unsettled/unstable project. |
| `payload-storage-cloudinary` (nlvcodes) | 1.2.1 | 2026-04-02 | ~1,239 | **`^3.0.0`** ✓ | 6 stars, 29 commits, 0 open issues, README documents adapter clearly | **EVALUAR MÁS → leading community candidate** | Correctly targets Payload 3.x, recent release (3 months old at research date), zero open issues, small but focused single-purpose package (does one thing: Cloudinary adapter). Low star count (6) is the main caution — small community validation. Worth a hands-on spike (install in a throwaway branch, test upload/delete/generateURL) before committing, but this is the most credible option found. |
| `@jhb.software/payload-cloudinary-plugin` | 0.4.0 | 2026-06-19 | ~791 | **`^3.85.1`** ✓ (tightest pin, matches current Payload exactly) | Part of `jhb-software/payload-plugins` monorepo, 97 stars, 478 commits, 29 releases across the monorepo, professional tooling (Husky, commitlint, CI) | **EVALUAR MÁS → strongest maintenance signal, but version 0.4.0 is early** | Backed by an organized team (not a solo hobbyist) with a real monorepo of 10+ Payload plugins, actively releasing (latest release in the monorepo dated 2026-06-26). Tightest version pin to current Payload (3.85.1+) is actually a good sign of active compatibility tracking, not a risk. Main caution: package itself is only at 0.4.0 — pre-1.0, API could still shift. Best bet if you want a team-maintained package rather than a solo one; second candidate for the spike. |

### Recommendation

**Do NOT default to a hand-rolled custom adapter as the first move.** Two credible, actively-maintained, correctly-versioned (Payload 3.x) community options exist: `payload-storage-cloudinary` (nlvcodes) and `@jhb.software/payload-cloudinary-plugin`. Neither is "install and forget" mature (both are small projects, low-to-moderate stars), so:

1. **Spike both in a throwaway branch** during the Media phase: install, wire up `handleUpload`/`handleDelete`/`generateURL` against a real Cloudinary account, verify signed uploads, folder structure, and that the resulting URLs work in `next/image` with the `remotePatterns` config (mirroring the R2 pattern already in `apturio/website/next.config.mjs`).
2. **Prefer `@jhb.software/payload-cloudinary-plugin`** if the spike goes smoothly — team-backed monorepo with an active release cadence is a better long-term maintenance bet than a solo one-repo package, even though its own version number is lower.
3. **Fallback: custom adapter.** If both community packages fail the spike (missing feature, broken with Payload 3.85, or the author goes quiet), write a custom `StorageAdapter` — this is not exotic. Payload's `GeneratedAdapter` interface (used by `@payloadcms/plugin-cloud-storage`, which all official and community adapters — including the ones above — are built on) requires:
   - `name` — adapter identifier string
   - `handleUpload(args)` — receives the file buffer/stream + collection config, must upload to Cloudinary (via the `cloudinary` npm SDK's `uploader.upload_stream`) and return
   - `handleDelete(args)` — deletes the corresponding Cloudinary asset by public ID
   - `generateURL(args)` — builds the public Cloudinary delivery URL from the stored filename/public ID (optional if `staticHandler` covers it, but for a CDN-backed provider like Cloudinary you want this so `next/image` gets direct Cloudinary URLs, not proxied through your Node server)
   - `staticHandler(req, args)` — serves/redirects file requests (can simply 302-redirect to the Cloudinary URL)
   - **Template to copy from:** `@payloadcms/storage-s3` or `@payloadcms/storage-r2` source (both are thin wrappers around `@payloadcms/plugin-cloud-storage`'s `GeneratedAdapter` shape) — R2 is the closer analog since it's also S3-API-compatible object storage with public CDN URLs, same shape you'd want for Cloudinary. Since `payload-storage-cloudinary` and `@jhb.software/payload-cloudinary-plugin` are themselves thin Cloudinary implementations of this exact interface, forking either one under your own `src/lib/cloudinary-adapter.ts` (rather than depending on the npm package) is a legitimate low-risk fallback — it's ~100-150 lines of code, not a framework.

**Bottom line for roadmap:** budget a small time-boxed spike in the Media phase (not "assume it just works"), with a custom-adapter fallback path documented, per the existing PROJECT.md constraint flag.

---

## 3. SEO/Performance Beyond plugin-seo

| Need | Solution | Verdict | Reason |
|---|---|---|---|
| XML Sitemap | Next.js `app/sitemap.ts` (built-in `MetadataRoute.Sitemap`) or `app/sitemap.xml/route.ts`, querying Payload Local API directly | **SÍ, construir manual — no hay plugin oficial** | Confirmed no `@payloadcms/plugin-sitemap` exists. Official Payload guide recommends exactly this pattern: fetch published Pages/Posts/CaseStudies/Authors/Categories via `payload.find({ collection, where: { _status: { equals: 'published' } }, limit: 0 })`, map to sitemap entries with `alternates` for the EN/ES locale pair (matches the multi-locale sitemap need called out in PROJECT.md). Route handler approach is preferred over `sitemap.ts` if you want to bypass Next's static caching for freshness after content edits. |
| `robots.txt` | `app/robots.ts` (Next.js built-in `MetadataRoute.Robots`) | **SÍ, construir manual** | Same pattern as sitemap — Next 15's file-convention API covers this natively, no plugin needed. Trivial, ~10 lines. |
| Schema.org / structured data | Hand-written JSON-LD in page/post templates, sourced from the same fields `plugin-seo` already manages (title, description, OG image) plus collection-specific fields (author, datePublished for posts; org/person schema for case studies) | **NO PLUGIN — construir manual, no clutter** | No credible official or actively-maintained community plugin auto-generates schema.org markup for Payload — and this is genuinely a "few lines of JSX per template" problem, not a plugin-shaped problem. A generic auto-schema plugin would produce generic/wrong schema for a personal portfolio's specific needs (Person schema for Juan, Article schema for posts, potentially CaseStudy/CreativeWork for case studies). Hand-write it; reuses existing SEO plugin fields, zero new dependency. |
| `llms.txt` / `llms-full.txt` | Custom route handler reading a `Llms` global (already planned per ARCHITECTURE.md) | **SÍ, construir manual** | No plugin exists for this (it's a very new, non-standardized convention) — already correctly scoped as a custom global + route in ARCHITECTURE.md. Nothing to add here. |

---

## 4. Email

**Confirmed via official docs:** `@payloadcms/email-resend` (3.85.2) remains the correct, current, officially-supported adapter for Resend. Payload's two official email adapter paths are `@payloadcms/email-nodemailer` (generic, SMTP/any transport, used for local dev with Ethereal by default) and `@payloadcms/email-resend` (Resend's REST API directly, described by Payload's own docs as "lightweight compared to Nodemailer"). Since Resend is already the mandated provider (per PROJECT.md and both reference codebases), **no reason to switch** — `email-resend` talks to Resend's API directly rather than going through Nodemailer's SMTP transport layer, which is marginally simpler for a single-provider setup.

**Verdict: SÍ USAR, no changes needed.**

---

## 5. Analytics / Web Vitals

**Explicit project constraint (PROJECT.md Out of Scope):** no internal dashboards like GSCMetrics/KeywordMetrics/PageMetrics/dinorank.

Research into Payload-specific analytics plugins found **no official or actively-maintained community plugin** that adds Web Vitals or analytics tracking to Payload itself — this makes sense, since analytics is a frontend/runtime concern (script on the page, or Next.js `useReportWebVitals` hook), not a CMS backend concern. Trying to force it into Payload-as-plugin would itself be scope creep.

| Option | Verdict | Reason |
|---|---|---|
| Google Search Console + GA4 (external, no plugin, just tracking scripts/verification) | **SÍ USAR** | Zero backend footprint, zero maintenance surface inside Payload — exactly what "avoid internal SEO dashboards" calls for. Add GA4 via Next.js `<Script>` (or `@next/third-parties/google` package, which is Next's own lightweight official wrapper for GA), and GSC via a meta tag or DNS verification. No CMS involvement at all. |
| Self-hosted privacy analytics (Umami/Plausible CE) | **NO USAR (para este proyecto) — pero anotar como opción futura, no ahora** | Both are legitimate, lightweight, self-hostable (Umami ~200MB RAM, Postgres-backed; Plausible CE needs ClickHouse, heavier). Neither integrates with Payload — they'd be a fully separate service to deploy and maintain on Hostinger alongside the Node app and Postgres DB. Given the project's explicit goal of a backend Juan maintains *alone*, adding a second self-hosted service (plus its own DB) to track analytics is exactly the kind of infra sprawl to avoid at this stage. GA4 (already free, zero infra) covers the need. |
| Next.js `useReportWebVitals` + custom endpoint | **NO USAR** | This is effectively rebuilding PageMetrics — the exact dashboard-tooling pattern explicitly out of scope. If Core Web Vitals monitoring is wanted later, use GSC's own Core Web Vitals report (free, no extra code) or a dedicated tool like PageSpeed Insights / web.dev, not a homegrown Payload collection. |

**Verdict: no plugin, no custom collection — GA4 + Search Console externally, nothing inside Payload.**

---

## 6. i18n / Translation Management in Admin

Confirmed: Payload's **admin panel UI** i18n (translating the admin interface itself into 30+ languages, via `@payloadcms/translations`) is a **different concern** from **content localization** (the `localized: true` field-level translation of Pages/Posts, already the confirmed approach in ARCHITECTURE.md). The question here is specifically about the second one: is there a plugin to help manage/sync content translations inside the admin UI beyond Payload's native locale switcher?

| Option | Verdict | Reason |
|---|---|---|
| Payload native localization (`localized: true` fields + locale switcher in admin) | **SÍ USAR (already the plan)** | This is the correct, zero-dependency mechanism — already confirmed in ARCHITECTURE.md and matches how JuanPortfolio's current Mongo data is shaped (`es` as `defaultLocale`), so migration maps 1:1. |
| `payload-translate` (AI-powered auto-translation plugin, community) | **NO USAR** | Exists as a community package for AI-assisted EN↔ES field translation inside the admin, but this is unverified/low-maturity tooling for a two-language site where Juan (or a human translator) is presumably writing/reviewing both EN and ES content directly — not a good tradeoff of "another API dependency + review overhead" vs. "just type the Spanish version." Reasonable to revisit only if translation volume becomes a real bottleneck later. |

**Verdict: no additional plugin needed — native Payload localization is sufficient and is already the documented plan.**

---

## 7. Other Content-Type Plugins (blog/case-study specific)

| Plugin | Package | Verdict | Reason |
|---|---|---|---|
| Blog comments | `@navanem/payload-comments` (self-hosted, anonymous, threaded) or `payload-plugin-comments` | **NO USAR** | Not in PROJECT.md scope (no comments page/feature mentioned in the content to replicate). Adding comments means moderation surface (spam), a new public-write endpoint (attack surface), and an admin queue to maintain — real ongoing maintenance burden for a solo-maintained site with no stated need. If Juan wants social engagement, a "discuss on LinkedIn/X" link is zero-maintenance and achieves the same goal. |
| Newsletter | `payload-plugin-email-newsletter` (aniketpanjwani, Resend-integrated, magic-link subscriber auth) | **NO USAR (por ahora)** | Not in current PROJECT.md scope (no newsletter page in the site being replicated). It is architecturally interesting — it does integrate with Resend, matching the stack — but it adds a subscriber collection, magic-link auth flow, and scheduling logic: real surface area for a feature not currently requested. Flag as a clean future add (compatible stack) but do not build it into this rebuild. |
| Code syntax highlighting (technical blog posts) | Custom Lexical feature using `prism-react-renderer` (per Payload's own documented pattern) — NOT a plugin | **SÍ, construir manual siguiendo el patrón oficial documentado** | This isn't really a "plugin" decision — Payload's own richtext-lexical docs/guides show the pattern: extend the Lexical editor with a custom code block feature + `prism-react-renderer` (or `shiki`) for render-time highlighting. Given Juan writes technical content (engineer + SEO expert positioning), this is worth building, but as a small custom Lexical feature (~1 block config + 1 render component), not a third-party plugin dependency. |
| Table of contents (long-form posts) | Custom component, computed client/server-side from rendered headings — NOT a plugin | **SÍ, construir manual (bajo costo)** | ARCHITECTURE.md already lists `TableOfContentsBlock` in the minimal block set (carried over from the current site). No dedicated Payload plugin needed — this is a frontend rendering concern (extract `h2`/`h3` from the Lexical JSON tree or rendered HTML, render an anchor-linked list), same complexity class as reading time below. |
| Reading time | Small utility function (e.g. word-count / 200wpm calc over the Lexical JSON), computed at render time or stored via a `beforeChange` hook field | **SÍ, construir manual — no instalar librería/plugin dedicado** | Trivial to compute (count words in the Lexical tree, divide by average WPM) — a `reading-time`-style npm package is only ~10 lines saved, not worth a new dependency; write the ~15-line utility function directly in `utilities/`. |

---

## Summary Table: Install List for Roadmap

### Install (official, confirmed version 3.85.2 as of 2026-07-09 — verify latest at implementation time)

| Package | Purpose |
|---|---|
| `@payloadcms/plugin-seo` | SEO meta/OG tab on Pages/Posts/CaseStudies |
| `@payloadcms/plugin-redirects` | Redirects collection (+ custom middleware to execute them) |
| `@payloadcms/plugin-search` | Search page backing (defer to search-page implementation phase) |
| `@payloadcms/email-resend` | Contact form email delivery |
| `@payloadcms/db-postgres` | Already covered in ARCHITECTURE.md, listed here for completeness |
| `@payloadcms/plugin-cloud-storage` | Transitive dependency of whichever Cloudinary adapter is chosen |
| Cloudinary adapter: `payload-storage-cloudinary` or `@jhb.software/payload-cloudinary-plugin` (spike both, pick one) OR custom adapter if spike fails | Media storage |

### Explicitly DO NOT install (clutter prevention list)

| Package | Reason |
|---|---|
| `@payloadcms/plugin-nested-docs` | No nested-URL page structure exists in the content being replicated; do not install speculatively (aprendoclub's own unused inclusion is the anti-pattern to avoid repeating) |
| `@payloadcms/plugin-form-builder` | Explicit Out of Scope — one simple contact form doesn't need a generic form builder |
| `payload-cloudinary` (SyedMuzamilM, unscoped) | Peer-dependency mismatch (`payload: ^2.0.0` declared despite v3-only sub-dependency) — quality-control red flag |
| `@pemol/payload-cloudinary` | Stale duplicate of the above by the same author |
| `@navanem/payload-comments` / `payload-plugin-comments` | No comments feature in scope; adds moderation/spam surface with no current requirement |
| `payload-plugin-email-newsletter` | No newsletter feature in scope currently; revisit as a clean future add only |
| `payload-translate` (AI translation plugin) | Native Payload localization is sufficient; avoid extra API dependency for a two-language personal site |
| Any Payload analytics/dashboard plugin, Umami/Plausible self-hosted | Explicit Out of Scope — use external GA4 + Search Console instead, zero backend footprint |
| `@payloadcms/plugin-mcp`, admin-bar, dashboard-analytics | Already flagged DROP in ARCHITECTURE.md — confirmed correct, not revisited here |

---

## Sources

- npm registry API (`registry.npmjs.org`) — direct version/publish-date verification for all official `@payloadcms/*` packages and all four Cloudinary community packages (HIGH confidence, pulled live during this research)
- `api.npmjs.org/downloads` — monthly download counts for the three Cloudinary contenders (HIGH confidence)
- [Storage Adapters | Payload Docs](https://payloadcms.com/docs/upload/storage-adapters) — official adapter list + `GeneratedAdapter` interface description
- [Redirects Plugin | Payload Docs](https://payloadcms.com/docs/plugins/redirects) — confirmed plugin does not execute redirects itself
- [How to generate a dynamic sitemap in Payload with Next.js](https://payloadcms.com/posts/guides/how-to-build-an-seo-friendly-sitemap-in-payload--nextjs) — confirmed no official sitemap plugin, documents the `app/sitemap.ts`/route-handler pattern
- [Search Plugin | Payload Docs](https://payloadcms.com/docs/plugins/search) and [Using Payload's Search Plugin guide](https://payloadcms.com/posts/guides/using-payloads-search-plugin-for-custom-search-experiences) — confirmed DB-only, no external service needed
- [How to Set Up Email Adapters in Payload with Resend or SendGrid](https://payloadcms.com/posts/guides/how-to-set-up-email-adapters-in-payload) and [Email Functionality | Payload Docs](https://payloadcms.com/docs/email/overview) — confirmed Resend adapter still current, described as lighter than Nodemailer for single-provider use
- GitHub repo pages (via WebFetch): [SyedMuzamilM/payload-cloudinary](https://github.com/SyedMuzamilM/payload-cloudinary) (43 stars, peer-dep concern), [nlvcodes/payload-storage-cloudinary](https://github.com/nlvcodes/payload-storage-cloudinary) (6 stars, correctly v3-targeted), [jhb-software/payload-plugins](https://github.com/jhb-software/payload-plugins) (97 stars monorepo, team-maintained) — MEDIUM confidence, small-project star counts are a soft signal, not a guarantee
- [Self-Hosted Analytics: Umami vs Plausible vs Rybbit](https://haloy.dev/blog/self-hosted-analytics-compared) and related comparison articles — MEDIUM confidence, used only to confirm neither integrates with Payload directly (both are standalone services)
- [Comments plugin discussion #2489](https://github.com/payloadcms/payload/discussions/2489), [brachypelma/payload-plugin-comments](https://github.com/brachypelma/payload-plugin-comments), [aniketpanjwani/payload-plugin-email-newsletter](https://github.com/aniketpanjwani/payload-plugin-email-newsletter) — LOW-MEDIUM confidence, existence confirmed, not deeply vetted (excluded from scope anyway)
- Project files read: `PROJECT.md`, `ARCHITECTURE.md` (this project), `aprendoclub/payload.config.ts`, `apturio/website/next.config.mjs` — HIGH confidence, ground truth for existing decisions this research builds on

---
*Plugin research for: Payload CMS 3.x portfolio rebuild (juan-payload)*
*Researched: 2026-07-09*
