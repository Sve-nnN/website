# Stack Research

**Domain:** Payload CMS 3.x + Next.js 15 bilingual portfolio site — self-hosted on Hostinger (Cloud/Business Node.js hosting), PostgreSQL data layer, Cloudinary media, Resend transactional email
**Researched:** 2026-07-09
**Confidence:** HIGH on the Payload/Next/Postgres core (verified against live npm registry 2026-07-09 and Payload's monorepo versioning); MEDIUM on the Cloudinary adapter choice (community package, peer-dependency metadata is stale — see notes) and on Hostinger runtime constraints (self-hosted Node target, verified via community guides not official Payload docs)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `payload` | 3.85.x (`^3.85`) | Headless CMS running in-process inside Next.js — collections, globals, blocks, auth, Local API | Payload 3 is a native Next.js app (installs into the App Router), so admin + frontend + API share one process and one deploy — ideal for a single self-hosted Node server on Hostinger. This is the version line the whole `@payloadcms/*` suite is published in lockstep with. |
| `next` | 15.5.x (`15.5.20`, the maintained `next-15` line) | App Router framework hosting both the public site and the Payload admin | Payload 3.85 is built and tested against Next 15's App Router. Next 16 is now `latest` on npm, but staying on the 15.5 backport line keeps you on Payload's most-tested target and matches the ARCHITECTURE.md decision. Upgrade to 16 only after Payload publishes explicit 16 support. |
| `react` / `react-dom` | 19.2.x (`^19.2`) | UI runtime for RSC + admin | Next 15 and Payload 3 both require React 19. Do not pin React 18 — the admin panel and Server Components assume 19. |
| `@payloadcms/next` | 3.85.x | Glue package that mounts Payload's admin routes and REST/GraphQL handlers into the App Router | Required by Payload 3 — provides `withPayload()` for `next.config` and the `/admin` + `/api` route handlers. Must match the `payload` version exactly. |
| `@payloadcms/db-postgres` | 3.85.x | Postgres database adapter (Drizzle-based) | The Postgres target for this project. Uses Drizzle ORM under the hood, generates SQL migrations. Run with `push: false` in production and commit generated migrations — never live-push schema to a Hostinger Postgres in prod. |
| `@payloadcms/richtext-lexical` | 3.85.x | Rich-text editor + serializer for content fields | Default (and actively developed) rich-text engine for Payload 3; `richtext-slate` is legacy. Provides the Lexical editor in admin and JSX/HTML converters for the frontend. |
| `postgresql` | 15 or 16 (server) | Relational datastore | Target DB for the rebuild. Hostinger can host Postgres, or use an external managed Postgres (Neon/Supabase/Railway) reachable over the network — the adapter only needs a connection string. Postgres 15+ is safe for Drizzle's generated DDL. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next-intl` | 4.13.x (`^4`) | Locale-prefixed routing + message catalogs for the public site | The i18n layer for `[locale]/...` routes. Runs independently of Payload's own `localization` config (Payload localizes *content*; next-intl localizes *UI strings + routing*). Both are needed for a bilingual site. |
| `@payloadcms/email-resend` | 3.85.x | Payload email transport backed by Resend | Wire this as Payload's `email` adapter so admin flows (password reset, verification) and any programmatic sends go through Resend. Pairs with the raw `resend` SDK for the contact form. |
| `resend` | 6.17.x (`^6`) | Resend API SDK | Use directly in the contact-form submit handler / server action for the one transactional email the site sends. |
| `payload-cloudinary` | 2.3.x (`^2.3`) | Community storage adapter that offloads Media uploads to Cloudinary | Recommended Cloudinary integration — actively maintained (last publish 2026-06) and built on `@payloadcms/plugin-cloud-storage`. **Caveat:** its `peerDependencies` still declares `payload: ^2.0.0` (stale metadata), but its runtime `dependencies` pull `@payloadcms/plugin-cloud-storage@^3.25.0`, confirming Payload 3 support. Install with `--legacy-peer-deps` or an override if npm complains, and validate against 3.85 during the Media phase. |
| `@payloadcms/plugin-seo` | 3.85.x | Adds a tabbed `meta` group (title/description/OG image) to chosen collections | On `pages`, `posts`, `case-studies` — feeds `<head>` meta and sitemap rendering. Official plugin, kept in lockstep with core. |
| `@payloadcms/plugin-redirects` | 3.85.x | Managed redirect table editable from admin | Preserve inbound links/SEO equity from the old site's URLs during the rebuild. |
| `@payloadcms/plugin-nested-docs` | 3.85.x | Parent/child hierarchy + breadcrumbs for docs/pages | Only if the Pages collection needs hierarchical URLs; otherwise skip. |
| `@payloadcms/plugin-form-builder` | 3.85.x | Admin-editable forms + submission storage | Optional — use if the contact form should be editable in admin rather than hardcoded. For a single fixed contact form, a plain server action + `resend` is simpler. |
| `sharp` | 0.35.x | Image processing for Payload uploads (resize/format variants) | Required by Payload for image resizing. Must be installed and must run on the Hostinger Node runtime — verify the platform allows native `sharp` binaries (a known self-host gotcha). |
| `graphql` | ^16.8.1 (pin to 16, NOT 17) | GraphQL runtime Payload's API depends on | Payload's peer dependency is `^16.8.1`. npm `latest` is 17.x — do **not** install 17 or Payload's GraphQL layer will break. Pin `graphql@^16`. |
| `drizzle-orm` | pulled transitively by `db-postgres` | SQL query builder / migration engine | Do not add directly — it comes with `@payloadcms/db-postgres`. Listed here for awareness when reading generated migrations. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `typescript` | Types across Payload config, collections, generated types | Payload generates `payload-types.ts`; run `payload generate:types` after schema changes. Use TS ^5. |
| `tsx` | Run standalone TS scripts (the Mongo→Postgres migration ETL) | Run the migration script (`scripts/migrate-from-mongo.ts`) with `payload run` or `tsx` outside the Next build. |
| `payload` CLI | `migrate:create`, `migrate`, `generate:types`, `generate:importmap`, `run` | Use `payload migrate:create` to author DDL locally, commit it, and `payload migrate` on deploy. Never rely on `push` in prod. |
| `dotenv` / Next env loading | Env-var-gated adapters (Cloudinary, Resend) | Follow the env-gate pattern from ARCHITECTURE.md: register the Cloudinary/Resend plugins only when their vars are present, so local dev works without cloud credentials. |
| Process manager (PM2 or systemd) | Keep the standalone Node server alive on Hostinger | Hostinger Node hosting does not manage the process for you — run `next start` (or the standalone `server.js`) under PM2/systemd with restart-on-crash. Verify Node 20+ is available. |

## Installation

```bash
# Core (versions lockstep at 3.85.x — let npm resolve the matching minor)
npm install payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical
npm install next@15 react@19 react-dom@19

# Official plugins
npm install @payloadcms/plugin-seo @payloadcms/plugin-redirects @payloadcms/plugin-nested-docs

# i18n + email + media
npm install next-intl @payloadcms/email-resend resend
npm install payload-cloudinary   # add --legacy-peer-deps if peer-dep warning on payload@3

# Image processing (required by Payload uploads)
npm install sharp

# Pin GraphQL to 16 to satisfy Payload's peer (avoid 17.x)
npm install graphql@^16

# Dev
npm install -D typescript tsx @types/node @types/react @types/react-dom
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `payload-cloudinary` | `@jhb.software/payload-cloudinary-plugin` (0.4.0) | If `payload-cloudinary` shows problems against 3.85, this is a second community Cloudinary adapter. Lower version/maturity, but a viable fallback. Evaluate both during the Media phase. |
| `payload-cloudinary` | `@payloadcms/storage-s3` (official) + Cloudinary S3-compatible bucket, or migrate media to an S3/R2 bucket instead | If Cloudinary integration proves fragile, the officially-maintained S3 adapter is the most robust storage path. Only choose this if you're willing to drop Cloudinary for S3/R2 (Cloudinary is a user-specified requirement, so treat S3 as a fallback, not default). |
| `@payloadcms/db-postgres` | `@payloadcms/db-vercel-postgres` | Only if deploying to Vercel (this project self-hosts on Hostinger, so plain `db-postgres` with a standard connection string is correct). |
| Next 15.5 | Next 16.2 (`latest`) | Once Payload publishes explicit Next 16 support. Don't lead the upgrade — the CMS admin is the fragile surface. |
| `next-intl` | Payload `localization` alone (no route prefixing) | If UI-string i18n and locale-prefixed URLs aren't needed and content localization suffices. For a public bilingual marketing site, you want `next-intl` for the `[locale]` routing. |
| Plain server action + `resend` | `@payloadcms/plugin-form-builder` | Use the plugin only if the client needs to edit form fields in admin. A fixed contact form is leaner as a hardcoded server action. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@payloadcms/db-mongodb` | This is a rebuild *off* MongoDB onto Postgres; keeping Mongo defeats the migration goal (it's only used read-only by the one-time ETL script against the OLD config). | `@payloadcms/db-postgres` |
| `graphql@17` | Payload's peer is `^16.8.1`; 17.x is npm `latest` and will be installed by accident, breaking Payload's GraphQL layer. | `graphql@^16` (pin it) |
| `@payloadcms/richtext-slate` | Legacy editor, no longer the default; new features and converters target Lexical. | `@payloadcms/richtext-lexical` |
| `push: true` in production | Drizzle live-push can silently alter/drop columns on the Hostinger Postgres — data-loss risk on a production DB. | Generated migrations (`payload migrate:create` → commit → `payload migrate`) with `push: false` |
| Mixing `@payloadcms/*` versions | The suite is published in lockstep (all 3.85.x today); mismatched minors cause subtle type/runtime breakage. | Keep every `@payloadcms/*` package on the same version |
| Local-disk uploads in production | Hostinger Node dynos/containers may not persist local disk across restarts/deploys — uploaded media would vanish. | Cloudinary storage adapter (env-gated) |
| Serverless-only assumptions (Edge runtime, Vercel Blob) | The old site used Vercel Blob; the new target is a persistent Node process on Hostinger, not serverless/Edge. | Node runtime + Cloudinary; keep Payload routes on the Node runtime, not Edge |

## Stack Patterns by Variant

**If Postgres is hosted on Hostinger itself (same box):**
- Use a local/socket or `localhost` connection string, small pool size.
- Because a portfolio's traffic is low; a large connection pool wastes the shared host's memory.

**If Postgres is external managed (Neon/Supabase/Railway):**
- Require SSL in the connection string (`?sslmode=require`) and a modest `max` pool.
- Because managed providers enforce TLS and cap connections; pooling misconfig is the top self-host Postgres failure.

**If Hostinger blocks native `sharp` binaries:**
- Set Payload image sizes conservatively and confirm `sharp` installs/runs before building collections.
- Because `sharp` is a hard requirement for image uploads; a broken binary blocks the entire Media phase.

**If the client needs zero-downtime content edits:**
- Rely on `afterChange` hooks calling `revalidatePath`/`revalidateTag` (persistent server, no rebuild).
- Because the deploy is a long-lived Node server, not a static export — ISR-style revalidation works without redeploying.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `payload@3.85.x` | `@payloadcms/next@3.85.x`, `@payloadcms/db-postgres@3.85.x`, all `@payloadcms/plugin-*@3.85.x` | Lockstep versioning — always match the minor across the whole suite. |
| `payload@3.85.x` | `next@15.5.x` | Payload 3 targets Next 15 App Router. Next 16 works for many but is not the tested target yet — hold at 15.5. |
| `next@15.5.x` | `react@19.2.x`, `react-dom@19.2.x` | Next 15 requires React 19; do not downgrade to 18. |
| `payload@3.85.x` | `graphql@^16.8.1` | Peer dep is 16.x — pin, since npm `latest` is 17. |
| `payload-cloudinary@2.3.x` | `@payloadcms/plugin-cloud-storage@^3.25`, `cloudinary@^2.5` | Peer metadata falsely says `payload@^2`; runtime deps confirm Payload 3. Install may need `--legacy-peer-deps`. Validate against 3.85 in the Media phase (MEDIUM confidence). |
| `@payloadcms/db-postgres@3.85.x` | `drizzle-orm@0.45.x` (transitive), Postgres 15/16 server | Don't install `drizzle-orm` directly; it ships with the adapter. |
| `sharp@0.35.x` | Node 20+ on Hostinger | Native binary — must be verified on the deploy target, common self-host failure point. |

## Sources

- npm registry (live, queried 2026-07-09) — verified current versions: `payload` 3.85.2, `next` 15.5.20 (next-15 line) / 16.2.10 (latest), `@payloadcms/*` 3.85.2, `next-intl` 4.13.1, `resend` 6.17.2, `react`/`react-dom` 19.2.7, `graphql` 17.0.2 (latest) vs Payload peer `^16.8.1`, `payload-cloudinary` 2.3.0, `@jhb.software/payload-cloudinary-plugin` 0.4.0 — HIGH
- `npm view payload@3.85.2 peerDependencies` → `{ graphql: '^16.8.1' }` — HIGH (basis for the graphql-16 pin)
- `npm view payload-cloudinary peerDependencies / dependencies` → peer `payload@^2.0.0` but dep `@payloadcms/plugin-cloud-storage@^3.25.0` — MEDIUM (stale peer metadata; Payload-3 support inferred from runtime dep + 2026-06 publish date)
- `.planning/research/ARCHITECTURE.md` (this project) — architectural decisions on Local API, env-gated storage adapter, Postgres `push:false`, Cloudinary-vs-Blob media, Hostinger persistent-Node deploy model — HIGH (verified against real production codebases apturio/aprendoclub + current JuanPortfolio)

---
*Stack research for: Payload CMS 3.x + Next.js 15 self-hosted bilingual portfolio (PostgreSQL / Cloudinary / Resend on Hostinger)*
*Researched: 2026-07-09*

---
---

# Milestone v1.1 Addendum — UI/UX Visual Polish Pass Stack

**Domain:** UI/UX visual polish pass (animation, micro-interactions, refined typography/spacing) on the already-shipped Payload CMS 3.85 + Next.js 15 App Router + shadcn/Tailwind v3 site
**Researched:** 2026-07-10
**Confidence:** HIGH

This section is additive to the core-project stack above. It answers a narrower question for milestone v1.1: what to add for visual polish without touching the content/data layer, without replacing shadcn or Tailwind, and without breaking the Payload block-editability hard rule established in Phase 5.

## Context: What Already Exists (do not re-add)

Confirmed by direct repo scan (`package.json`, `components.json`, `tailwind.config.ts`, `src/components/ui/`):

- **Tailwind CSS 3.4.19** (NOT v4 — `tailwind.config.ts` + PostCSS, not the new CSS-first `@import "tailwindcss"` engine)
- **shadcn/ui** already initialized: `new-york` style, `neutral` base color, CSS variables on, `lucide-react` icons, components present: `avatar`, `badge`, `button`, `card`, `input`, `navigation-menu`, `select`, `separator`, `sheet`, `skeleton`, `tabs`, `textarea`
- **`tailwindcss-animate@1.0.7`** already installed — this is the correct animate plugin for Tailwind v3 (its CSS-first successor, `tw-animate-css`, only applies to Tailwind v4 projects and would require a Tailwind major-version migration to adopt — out of scope for a polish pass)
- **`class-variance-authority@0.7.1`**, **`clsx@2.1.1`**, **`tailwind-merge@3.6.0`** — the `cva()` + `cn()` variant pattern is already the project's styling primitive
- **Radix primitives** already pulled in individually per shadcn component (`react-avatar`, `react-dialog`, `react-navigation-menu`, `react-select`, `react-separator`, `react-slot`, `react-tabs`)
- **Fonts:** Inter (body/UI) + Fraunces (display/headings) via `next/font/google`, already wired per `05-UI-SPEC.md`
- **16 Payload blocks** rendering as **async Server Components** that call `getPayload({config})` directly (confirmed in `TestimonialsCarousel/Component.tsx`, `ClientLogosBlock/Component.tsx`) — this is the architectural fact that shapes every recommendation below: block components are RSC data-fetchers, not client interaction surfaces, today

None of the above needs replacing. This addendum is additive only.

## Recommended Additions

### Core Additions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `motion` | `^12.42.2` | Declarative animation + gesture library for React (scroll-triggered reveals, hover/tap micro-interactions, layout transitions, `AnimatePresence` for enter/exit) | This is Framer Motion, renamed and now independently maintained under `motion.dev`; the npm package `framer-motion` still works but `motion` is the current name and import path (`motion/react`). It is the de facto standard for React animation in 2026, has first-class React 19 support, and — critically — composes cleanly with the RSC-first block architecture: wrap only the interactive *leaf* (e.g. a `<Reveal>` client component) in `'use client'` and keep the Payload `getPayload()` data-fetching in the parent Server Component untouched. No data-fetching pattern changes. |
| `embla-carousel-react` | `^8.6.0` | Lightweight, unstyled carousel engine for `TestimonialsCarousel` and `ClientLogosBlock` | These two blocks currently render as a plain CSS `overflow-x-auto` scroll-snap div (confirmed in code) with no drag, autoplay, or infinite-loop behavior — a common "polish pass" gap for logo/testimonial rows. Embla is what shadcn's own `Carousel` component wraps, has zero visual opinions (fully Tailwind-styleable, matches the existing design tokens), and is ~5KB. Only the carousel's client-side controller needs `'use client'` — the Payload `find()` query supplying testimonials/clients stays server-side in the parent block. |

### Supporting Additions

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-tooltip` | `^1.2.12` | Accessible tooltips (e.g. credential badges, KPI number explanations in case studies) | Add only if the polish audit surfaces a concrete need (e.g. author credential chips, abbreviated KPI labels). Matches the existing per-component Radix install pattern already used for `avatar`/`dialog`/`select`/etc — install via `npx shadcn@latest add tooltip`, don't hand-roll. |
| `@radix-ui/react-accordion` | `^1.2.16` | Collapsible sections (FAQ block already exists — verify it isn't hand-rolled; if it is, swap to this for correct ARIA + smooth height animation) | Use if `FAQ` block's current expand/collapse isn't using Radix accordion primitives already — check during the component audit before adding. |
| `@radix-ui/react-scroll-area` | `^1.2.14` | Styled scrollbars for horizontally-scrolling regions (mobile category filter tabs, KPI card rows) | Optional — only if native `overflow-x-auto` scrollbars look inconsistent across browsers during the visual audit. Skip if native scroll already looks acceptable; don't add for its own sake. |
| `sonner` | `^2.0.7` | Toast notifications for contact-form submit success/error states | The `ContactFormBlock` (per `05-UI-SPEC.md`'s Copywriting Contract) needs success/error feedback. `sonner` is the shadcn-recommended toast (replaces the deprecated shadcn `Toast`/`useToast`), themeable via CSS variables to match the navy/off-white/ember palette already defined. Install via `npx shadcn@latest add sonner`. |
| `react-intersection-observer` | `^9.16.0` | Trigger scroll-into-view animations (fade/slide-up on section entry) without hand-rolling `IntersectionObserver` | Alternative to Motion's built-in `whileInView` prop — **prefer Motion's native `whileInView`** (no extra dependency) unless a non-animation use case for intersection detection appears (e.g. lazy-loading below-the-fold blocks). Listed here only as a fallback; do not install if Motion's `whileInView` covers the need, which it will for this milestone's scope. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npx shadcn@latest add [component]` | Pull additional shadcn primitives (tooltip, accordion, sonner, carousel) as needed during the audit | Keep using the CLI rather than hand-authoring Radix wrappers — preserves the existing `new-york`/`neutral`/CSS-variable preset already locked in `components.json`. Each `add` only touches `src/components/ui/`, it does not re-run `init` or touch Tailwind config. |
| Tailwind CSS variables in `src/app/globals.css` | Extend, don't replace, the design-token layer | The spacing scale (4/8/16/24/32/48/64px) and 4-size typography scale from `05-UI-SPEC.md` should be expressed as Tailwind theme extensions (`theme.extend.spacing`, `theme.extend.fontSize`) or CSS custom properties in `globals.css`, consistent with how shadcn already defines color tokens there. Do not introduce a separate design-token tool (Style Dictionary, Theo, etc.) — that's rebuild-scope, not polish-scope, for a single-brand site with an already-declared token set. |

## Installation

```bash
# Core — animation + carousel
npm install motion embla-carousel-react

# Supporting — add via shadcn CLI (pulls matching Radix primitive + styles the shadcn way)
npx shadcn@latest add tooltip sonner carousel

# Only if FAQ block audit shows it needs it:
npx shadcn@latest add accordion

# Only if scrollbar styling audit shows it needs it:
npx shadcn@latest add scroll-area
```

No new dev dependencies are required — TypeScript, ESLint, and the existing build pipeline (`next build`, `payload generate:types`) are unaffected by these additions.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `motion` (Motion / ex-Framer Motion) | `@react-spring/web` | If the team strongly prefers a physics-first API over Motion's declarative `animate`/`variants` API. Motion has broader adoption, better docs, and native `whileInView`/gesture support that maps directly to "hover card lifts", "section fades in on scroll" — the exact micro-interactions this polish pass targets. React Spring is a reasonable choice but adds no benefit here and the team has zero existing familiarity signal in this repo. |
| `motion` | Pure CSS transitions/animations (`@keyframes`, `transition-*` Tailwind utilities) | For simple, non-orchestrated effects (button hover scale, color transition, focus ring) — **use plain Tailwind/CSS, not Motion**, to avoid shipping a JS animation library for things CSS already does for free. Reserve Motion for orchestrated sequences, scroll-triggered reveals, `AnimatePresence` enter/exit, and gesture-driven interactions where CSS alone is awkward. |
| `embla-carousel-react` | `keen-slider` | If a heavier feature set (e.g. built-in autoplay-with-pause-on-hover with less boilerplate) is wanted out of the box. Embla wins here because it's what shadcn's own `Carousel` primitive already wraps — using shadcn's carousel keeps the styling/token integration path identical to every other shadcn component already in the project. |
| `sonner` | shadcn's legacy `Toast` + `useToast` | Never — `Toast`/`useToast` is the deprecated shadcn pattern; shadcn's own docs point new installs to `sonner`. Only relevant if the codebase already had the old toast wired (it does not). |
| Tailwind CSS variable token extension | Tailwind v4 migration + `tw-animate-css` + native CSS `@theme` | Only as a *separate, later* milestone if there's an independent reason to move off Tailwind v3 (e.g. needing v4's performance/Oxide engine). Do not bundle a major Tailwind version upgrade into a visual polish pass — it's a build-tooling migration with its own risk surface (PostCSS config changes, plugin compatibility), not a design change. |

## What NOT to Use (for this milestone)

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Replacing shadcn/ui with another component system (Mantine, Chakra, Ant Design, etc.) | shadcn is already initialized, themed to the navy/off-white/ember palette, and every existing block renders shadcn primitives. Swapping systems mid-project is a rebuild, not a polish pass, and would force re-touching all 16 Payload blocks. | Keep shadcn; add/extend individual primitives via `npx shadcn add`. |
| CSS-in-JS (styled-components, Emotion, vanilla-extract, Panda CSS) | The project is committed to Tailwind utility classes + CSS variables. Introducing a CSS-in-JS runtime alongside Tailwind creates two competing styling systems, adds client-side runtime cost, and works against RSC (styled-components in particular has known friction with the App Router's server-first rendering model). | Tailwind utilities + `cva()` variants (already the pattern in this codebase). |
| `tw-animate-css` | It's the Tailwind v4-only successor to `tailwindcss-animate` and requires the v4 CSS-first config (`@import "tailwindcss"`, `@theme`). This project is on Tailwind v3.4.19 — installing `tw-animate-css` without the v4 migration will not work correctly. | Keep `tailwindcss-animate@1.0.7`, already installed and correct for v3. |
| Large "animated component kit" registries (Aceternity UI, Animate UI, Magic UI, Smooth UI) wholesale | These ship pre-built, opinionated components (often already animated) meant to be copy-pasted wholesale, frequently bypassing the Payload-block hard rule by hardcoding copy/structure inside the component, and they typically bundle their own animation dependency choices (sometimes GSAP, sometimes their own Motion setup) that may not match `motion@12`. | Cherry-pick *techniques/patterns* from these registries for inspiration during the visual audit, but implement the actual micro-interactions as thin, Payload-field-driven wrappers using `motion` directly — never paste in a full pre-built component that owns its own content. |
| GSAP (GreenSock) | Powerful but overkill for a component-level polish pass — heavier API surface and no React-idiomatic integration compared to Motion. Reasonable for complex scroll-driven storytelling (e.g. an agency showcase reel) but this site's needs (hover states, reveal-on-scroll, carousel, toasts) don't require it. | `motion` covers this scope with a smaller footprint and native React ergonomics. |
| Hardcoding animation variants, copy, or "what animates" logic directly as literal JSX/props inside a block's React component in a way that can't vary per Payload field | Violates the Phase 5 hard rule reaffirmed in this milestone: "every visual section must remain Payload-block-driven, not hardcoded." An animation *timing/easing* choice (e.g. "fade up 300ms") is a *style* decision and fine to hardcode in the component (it's layout/style, not content) — but never let an animation library tempt you into inlining copy, image choices, or "which N items to show" logic that should stay a Payload field. | Keep animation code purely presentational: it wraps already-fetched Payload data, it never decides *what* content appears. |

## Stack Patterns by Variant

**If a Payload block needs a scroll-triggered reveal (e.g. fade-up on section entry):**
- Keep the block itself (e.g. `Section/Component.tsx`) as an async Server Component doing `getPayload()` data-fetching, unchanged.
- Extract a small client component (e.g. `src/components/Reveal.tsx`, `'use client'`) that wraps `children` in `<motion.div whileInView={...} viewport={{ once: true }}>` and accepts only presentational props.
- The Server Component block renders `<Reveal><h2>{data.title}</h2></Reveal>` — content still flows from Payload, only the wrapping animation is client-side.
- Because this preserves the RSC data-fetching boundary already established by all 16 blocks; it avoids turning entire blocks into client components (which would lose server-side data fetching and increase client JS for no reason).

**If a Payload block needs a carousel (TestimonialsCarousel, ClientLogosBlock):**
- Use shadcn's `Carousel` component (wraps `embla-carousel-react`) as a client sub-component.
- The parent block's `getPayload().find()` call stays server-side and passes the resulting array as a prop into the client `Carousel`.
- Because splitting "fetch" (server) from "scroll/drag mechanics" (client) is the same pattern as the Reveal wrapper above — one consistent seam for all interactive additions in this milestone.

**If a micro-interaction is a simple hover/focus/active state (button lift, card shadow on hover, link underline):**
- Use Tailwind's built-in `hover:`, `focus-visible:`, `active:`, `transition-*`, and `tailwindcss-animate`'s `animate-in`/`animate-out` utilities.
- Because these don't need JS orchestration; adding `motion` for a CSS-achievable hover state increases client JS bundle for zero visual benefit.

**If the design-token audit (spacing/typography from `05-UI-SPEC.md`) finds gaps between declared tokens and actual Tailwind config:**
- Extend `tailwind.config.ts`'s `theme.extend` (spacing, fontSize, colors) to codify the 7-step spacing scale and 4-size typography scale as named utilities/classes.
- Because this keeps the token system in the same file shadcn already uses for its CSS-variable colors — one source of truth, no new tooling.

## Version Compatibility (additions)

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `motion@^12.42.2` | `react@19.2.7`, `react-dom@19.2.7` | Motion 11+ requires React 18+; version 12 is tested against React 19 and is the current major as of this research (2026-07-10). Import from `motion/react`, not the old `framer-motion` package name, in new code. |
| `motion@^12.42.2` | Next.js 15 App Router / RSC | Any component using `motion.*` JSX or hooks (`useAnimate`, `useScroll`, etc.) must be marked `'use client'`. Motion has no built-in RSC-server component; it is a client-only animation runtime — plan the Reveal/Carousel wrapper pattern above accordingly. |
| `embla-carousel-react@^8.6.0` | shadcn `Carousel` component (installed via `npx shadcn add carousel`) | shadcn's carousel component is a thin wrapper generating source you own in `src/components/ui/carousel.tsx` — the `embla-carousel-react` version shadcn's CLI pulls will match this line; no manual pinning needed beyond what the CLI installs. |
| `tailwindcss-animate@1.0.7` | `tailwindcss@^3.4.19` | Correct pairing for this project's Tailwind major version. Do NOT install `tw-animate-css` alongside it — that package targets Tailwind v4's `@theme`/CSS-first config and is a different animation utility set, not a drop-in addition. |
| `sonner@^2.0.7` | `react@19.2.7`, shadcn `new-york` preset | shadcn's `add sonner` generates a small `src/components/ui/sonner.tsx` wrapper reading the app's CSS-variable theme (`--background`, `--foreground`, etc.) already defined for the navy/off-white/ember palette — no extra theming work needed beyond what's already in `globals.css`. |
| `@radix-ui/react-tooltip@^1.2.12` / `@radix-ui/react-accordion@^1.2.16` / `@radix-ui/react-scroll-area@^1.2.14` | Existing `@radix-ui/*@1.2.x`/`1.1.x` primitives already in `package.json` | All current-generation Radix primitives share the same major-version cadence as what's already installed (`react-avatar@1.2.2`, `react-select@2.3.3`, etc.) — no version-skew risk introduced. |

## Sources (addendum)

- npm registry (live, queried 2026-07-10): `motion@12.42.2`, `embla-carousel-react@8.6.0`, `class-variance-authority@0.7.1`, `tailwindcss-animate@1.0.7`, `@radix-ui/react-accordion@1.2.16`, `@radix-ui/react-tooltip@1.2.12`, `@radix-ui/react-hover-card@1.1.19`, `@radix-ui/react-progress@1.1.12`, `@radix-ui/react-scroll-area@1.2.14`, `vaul@1.1.2`, `sonner@2.0.7`, `tailwind-merge@3.6.0`, `lucide-react@1.24.0`, `clsx@2.1.1` — HIGH
- Direct repo scan: `package.json`, `components.json`, `tailwind.config.ts`, `src/components/ui/*`, `src/blocks/TestimonialsCarousel/Component.tsx`, `src/blocks/ClientLogosBlock/Component.tsx` (confirms Tailwind v3, shadcn new-york preset, RSC-based block architecture, no existing carousel/animation library) — HIGH
- [motion.dev](https://motion.dev/) and [Motion for React: Get started](https://motion.dev/docs/react) — package rename from `framer-motion` to `motion`, import path `motion/react`, React 19 support — MEDIUM (WebSearch-sourced, cross-checked against npm registry version/publish recency)
- [Motion & Framer Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide) — confirms API continuity between `framer-motion` and `motion` packages — MEDIUM
- WebSearch: shadcn/ui `tailwindcss-animate` → `tw-animate-css` migration is scoped to Tailwind v4 projects; new shadcn `init` on Tailwind v4 defaults to `tw-animate-css`, but Tailwind v3 projects (this repo) correctly keep `tailwindcss-animate` — MEDIUM (WebSearch findings cross-checked against this repo's confirmed Tailwind v3.4.19 + already-installed `tailwindcss-animate@1.0.7`, and against shadcn's own [Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) framing this as a v4-specific change)
- `.planning/phases/05-frontend-pages/05-UI-SPEC.md` (this project) — existing design tokens (spacing scale, 4-size typography scale, navy/off-white/ember palette), shadcn preset lock (new-york/neutral/CSS variables), Payload block-editability hard rule — HIGH

---
*Stack research for: UI/UX visual polish pass on existing Payload + Next.js + shadcn site (milestone v1.1)*
*Researched: 2026-07-10*
