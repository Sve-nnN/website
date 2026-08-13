# Architecture Research

**Domain:** Monetization layer (affiliate links, "My Stack" page, email capture, deferred digital store) integrated into the existing Payload 3.85.2 + Next.js 15.4.11 bilingual codebase — milestone v2.1
**Researched:** 2026-08-13
**Confidence:** HIGH for every integration point (grounded in direct reads of `src/middleware.ts`, `src/payload.config.ts`, `src/lib/cache.ts`, `src/lib/cache-tags.ts`, `src/lib/sitemap-data.ts`, `src/lib/canonical.ts`, `src/lib/breadcrumbs.ts`, `src/lib/service-slugs.ts`, `src/collections/*`, `src/blocks/*`, `src/app/actions/contact.ts`, `src/migrations/*`, `package.json`). MEDIUM for two flagged items: Lexical relationship population depth, and Amazon Associates cloaking interpretation.

> **Note on the previous file:** the pre-existing `.planning/research/ARCHITECTURE.md` (v1 foundational research, 2026-07-10) was copied to `.planning/research/ARCHITECTURE-v1.0.md` before this file was written. Nothing was lost.

---

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        Payload Admin (schema layer)                         │
│  NEW  src/collections/AffiliateLinks/index.ts   ← single source of truth    │
│  NEW  src/collections/AffiliateClicks/index.ts  ← append-only event log     │
│  NEW  src/collections/Subscribers/index.ts      ← opt-in state machine      │
│  NEW  src/collections/LeadMagnets/index.ts      ← Cloudinary public_id refs │
│  MOD  src/payload.config.ts                     ← register 4 collections    │
├────────────────────────────────────────────────────────────────────────────┤
│                    Cached data layer (Phase 43 pattern)                     │
│  MOD  src/lib/cache.ts        getCachedAffiliateLinks(locale)  (1 query)    │
│  MOD  src/lib/cache-tags.ts   CACHE_TAGS.affiliateLinks() + revalidate hook │
│  NEW  src/lib/affiliate.ts    PURE: buildGoHref / hasAffiliateLinks         │
├────────────────────────────────────────────────────────────────────────────┤
│                          Block layer (rendering)                            │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────────┐   │
│  │ NEW ToolStack      │ │ NEW EmailCapture   │ │ NEW AffiliateLinkInline│   │
│  │ Pages block        │ │ Pages block        │ │ Lexical INLINE block   │   │
│  │ (grid of tools)    │ │ (server-action fm) │ │ (zero migration)       │   │
│  └────────────────────┘ └────────────────────┘ └────────────────────────┘   │
│  MOD src/collections/Pages/index.ts   ← register ToolStack + EmailCapture   │
│  MOD src/blocks/blockRegistry.tsx     ← map both blockTypes                 │
│  MOD src/collections/Posts/index.ts   ← BlocksFeature({ inlineBlocks })     │
│  MOD src/components/richTextBlockConverters.tsx ← inlineBlocks converter    │
├────────────────────────────────────────────────────────────────────────────┤
│                       Leaf components (zero client JS)                      │
│  NEW src/components/AffiliateLink.tsx        <a rel="sponsored nofollow">   │
│  NEW src/components/AffiliateDisclosure.tsx  FTC/EU disclosure banner       │
├────────────────────────────────────────────────────────────────────────────┤
│                          Route layer (App Router)                           │
│  NEW  src/app/go/[slug]/route.ts                    302 + after() logging   │
│         ↑ OUTSIDE [locale]. REQUIRES a middleware matcher change.           │
│  NEW  src/app/(frontend)/[locale]/stack/page.tsx    single shared segment   │
│  NEW  src/app/(frontend)/[locale]/newsletter/confirm/page.tsx  noindex      │
│  NEW  src/app/actions/subscribe.ts                  contact.ts clone        │
│  MOD  src/middleware.ts   matcher: add `go` to the negative lookahead       │
│  MOD  src/app/robots.ts   disallow: ['/admin', '/api', '/go']               │
├────────────────────────────────────────────────────────────────────────────┤
│                          External integrations                              │
│  Resend  (contacts.create — needs the raw `resend` SDK, NEW dependency)     │
│  Cloudinary (private_download_url — `cloudinary@^2.10.0` ALREADY installed) │
│  Affiliate networks (NO JS. Server-side 302 only. Zero third-party script.) │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `affiliate-links` collection | Canonical record of every tool: name, slug, destination URL, program bookkeeping, localized copy | Payload collection, no drafts, `read: () => true` (matches `Testimonials`/`Clientes`) |
| `src/lib/affiliate.ts` | Pure href builder + Lexical-scan helper. Zero Payload/DB imports so it is client-safe | Mirrors `src/lib/service-slugs.ts` (the precedent module written *specifically* to be importable from Client Components) |
| `getCachedAffiliateLinks()` | The ONLY read path for tool data — stack page, blog inline links, and `/go` all share it | `unstable_cache` + `overrideAccess: false`, exactly the Phase 43 pattern in `src/lib/cache.ts` |
| `/go/[slug]` route handler | Resolve slug → destination, 302, log the click post-response | Node route handler, `dynamic = 'force-dynamic'`, `after()` from `next/server` |
| `affiliate-clicks` collection | Append-only click events (what converts, from which page) | INSERT-only; never an `UPDATE ... counter + 1` (see Anti-Pattern 3) |
| `ToolStack` block | Renders curated groups of tools on any `pages` doc | Same shape as `ServicesShowcase`: one editable heading, all card data derived from the source of truth |
| `AffiliateLinkInline` | Lexical inline block letting a blog post reference a tool | `BlocksFeature({ inlineBlocks: [...] })`; data lives inside the existing `jsonb` column → **no migration** |
| `subscribers` collection | Owns the pending → confirmed → unsubscribed state machine and the confirm token | Payload is the state owner; Resend is the delivery list |
| `lead-magnets` collection | Maps a magnet to a Cloudinary `authenticated` raw asset, per locale | Signed, expiring delivery URL minted server-side |

---

## 1. Affiliate Link Data Model

### Collection: `affiliate-links` (NEW — `src/collections/AffiliateLinks/index.ts`)

One collection serves both surfaces. The "My Stack" page and an inline blog mention need identical data (slug, name, logo, destination, disclosure); duplicating them would guarantee drift.

```ts
export const AffiliateLinks: CollectionConfig = {
  slug: 'affiliate-links',
  labels: { singular: 'Affiliate Link', plural: 'Affiliate Links' },
  admin: { useAsTitle: 'name', group: 'Monetization',
           defaultColumns: ['name', 'category', 'program', 'active'] },
  access: {
    // Same as Testimonials/Clientes (src/collections/Testimonials/index.ts:13):
    // public reference data with no draft state, so there is no draft to leak.
    read: () => true,
    create: authenticated, update: authenticated, delete: authenticated,
  },
  hooks: { afterChange: [revalidateAffiliateLinksCache],
           afterDelete: [revalidateAffiliateLinksCacheOnDelete] },
  // NO `versions.drafts` — see rationale below.
  fields: [ /* table below */ ],
}
```

**No drafts, deliberately.** Drafts would double the table count (`_affiliate_links_v*` + `_locales` variants, see the `websites` migration for how much SQL that is) for a small reference collection that has no editorial workflow. A non-localized `active` checkbox covers "not ready yet". This also sidesteps the Phase 24 draft-leak bug class entirely: there is no draft state to leak.

### Field-by-field localization decision

The project's documented failure mode is **under-localization**: `Header.navItems.url`, `Content.link.url`, `TestimonialsCarousel.title`, `CaseStudies.services[].service`, `CallToAction.richText` all stored human-facing values in a shared, non-localized column and collapsed to last-write-wins. The rule that prevents recurrence:

> **A field is localized if and only if a human reads its value as prose. A field is NOT localized if its value is a machine identifier — unless the identifier itself genuinely differs per locale.**

| Field | Type | `localized` | Reasoning |
|-------|------|-------------|-----------|
| `name` | text, required | **NO** | Proper noun. "Notion" is "Notion" in both locales. Localizing invites a half-filled EN value that only survives because `payload.config.ts` sets `fallback: true` — a silent trap, not a feature. |
| `slug` | `slugField('name')` | **NO** | It is the `/go/{slug}` routing key and carries `unique: true` + `index: true`. Localizing it produces two slugs per doc, makes the unique index meaningless, and forces `/go/[slug]` (which has **no locale in scope**, see §2) to guess which one to resolve. Non-negotiable. |
| `affiliateUrl` | text, required | **NO** — see below | The single most important decision in this section. |
| `siteUrl` | text | **NO** | The tool's plain homepage, used for the "goes to notion.so" disclosure hint and as the fallback if `affiliateUrl` is ever emptied. Machine value. |
| `logo` | upload → `media` | **NO** | A logo is a brand asset, identical in both locales. (`media.alt` IS localized — that lives on the Media doc, already correct.) |
| `category` | select (enum) | **NO** | Stores a machine value (`hosting`, `seo-tools`, `dev`, `analytics`, `productivity`). **The human label is translated in `messages/{es,en}.json`, not in Payload.** This is the structural fix for the `CaseStudies.services[].service` bug: that field stored free-text human labels non-localized. Storing an enum + translating the label at render time is immune by construction — there is no per-locale value to forget to fill. |
| `tagline` | textarea | **YES** | One-line human copy. Same class as `TestimonialsCarousel.title`. |
| `whyIUseIt` | richText (lexical) | **YES** | Prose. Same class as `CallToAction.richText` (the Phase 19 Critical bug). |
| `disclosureOverride` | textarea | **YES** | Optional per-tool disclosure copy. Prose. Default comes from `messages/*.json`. |
| `program` | text | **NO** (+ field-level `read: authenticated`) | Internal bookkeeping ("Amazon Associates", "Impact"). Not public. |
| `cookieWindowDays` | number | **NO** (+ field-level `read: authenticated`) | Internal. |
| `commissionNote` | textarea | **NO** (+ field-level `read: authenticated`) | Internal. Commission terms must never reach the public API. |
| `active` | checkbox, default `true` | **NO** | Boolean state. |

**Field-level read access pattern:** the three internal fields use the exact mechanism already written in `src/fields/targetKeyword.ts` (`const authenticatedFieldRead: FieldAccess = ({ req: { user } }) => Boolean(user)`). That file exists *because* a field-level access leak was found and fixed in Phase 12 — reuse it verbatim rather than reinventing it.

### The `affiliateUrl` localization question — resolved explicitly

**Decision: `affiliateUrl` is NOT localized. If a program genuinely differs by region, add a non-localized `regionalUrls` array in a later, separate additive migration. Never localize it.**

Three grounded reasons:

1. **Wrong axis.** Payload localization is keyed to *content locale* (`es`/`en`, `payload.config.ts` lines 71-78). Affiliate program variance is *geographic* (amazon.es vs amazon.com vs amazon.com.mx), and locale ≠ geography. A Spanish-reading visitor in Miami would be sent to amazon.es and the commission would be lost. Localizing encodes a market split into a language field and is wrong even when it appears to work.
2. **The redirect route has no locale.** `/go/[slug]` sits outside the `[locale]` tree (§2) — deliberately, so it is not a localized route. To read a localized field there, the handler would have to invent a locale value. `payload.config.ts` already carries a comment warning that its `defaultLocale` "MUST stay in sync with `src/i18n/routing.ts` — two independent defaultLocale settings that can silently drift". Introducing a *third* place that picks a default locale is exactly that hazard, in the one code path where a wrong answer costs money.
3. **YAGNI, verifiably cheap to add later.** Adding a `regionalUrls` array later is `CREATE TABLE "affiliate_links_regional_urls"` — purely additive, no data touched. Localizing `affiliateUrl` later is the `DROP COLUMN`-with-backfill reshape that caused the Phase 19 data-loss incident (see `src/migrations/20260712_202954_phase19_calltoaction_localized.ts`). Pick the direction that keeps the destructive option off the table.

If regional variance does appear, the shape is:

```ts
{ name: 'regionalUrls', type: 'array', /* NOT localized */
  fields: [
    { name: 'market', type: 'select', options: ['us','es','mx','pe','uk'] }, // NOT localized
    { name: 'url',    type: 'text', required: true },                        // NOT localized
  ] }
```
…resolved by a single `pickDestination(doc, req)` function in `src/lib/affiliate.ts` that falls back to `affiliateUrl` when the array is empty. Ship the fallback path only.

### How a Lexical rich-text link picks up an affiliate target

**Recommended: a Lexical INLINE BLOCK, not a customized `LinkFeature`.**

`LinkFeature({ fields })` can add a relationship field to the built-in link node, but the editor still types the visible text *and* an href, so the affiliate URL ends up duplicated in the body — the drift problem the collection exists to solve. An inline block stores only a reference.

```ts
// NEW src/blocks/AffiliateLinkInline/config.ts
export const AffiliateLinkInline: Block = {
  slug: 'affiliateLink',
  interfaceName: 'AffiliateLinkInlineBlock',
  labels: { singular: 'Affiliate Link', plural: 'Affiliate Links' },
  fields: [
    { name: 'tool',  type: 'relationship', relationTo: 'affiliate-links', required: true },
    { name: 'label', type: 'text' }, // optional anchor-text override
  ],
}
```

```ts
// MODIFIED src/collections/Posts/index.ts — `content` currently uses a bare lexicalEditor()
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({ blocks: [], inlineBlocks: [AffiliateLinkInline] }),
  ],
}),
```

**Neither inline-block field is marked `localized`, and that is correct.** `posts.content` is already `localized: true` (`src/collections/Posts/index.ts:55`), so the entire serialized editor state is stored in a per-locale `jsonb` column. Everything nested inside it — including this block's `label` — is inherently per-locale. Marking a field inside a localized `richText` as `localized` is redundant. **The localization guarantee here comes from the parent field, not the block.** Practical consequence for the editor: the affiliate link must be inserted separately in the ES body and the EN body, exactly like every other piece of inline content today. That is expected, not a regression.

**Rendering** (MODIFIED `src/components/richTextBlockConverters.tsx`):

```tsx
export const richTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters, ...defaultJSXConverters,
  blocks: { 'code-block': ..., faq: ... },          // unchanged
  inlineBlocks: {                                    // NEW key
    affiliateLink: ({ node }) => <AffiliateLinkInlineNode {...node.fields} />,
  },
})
```

**Circular-import hazard — read this before editing that file.** Its header comment documents that `FAQComponent` is deliberately *not* imported because `FAQComponent → RichTextRenderer → richTextBlockConverters` is a cycle, and "that cycle is exactly the shape that already caused a production TDZ ReferenceError once" (see also the identical warning at the top of `src/lib/sitemap-data.ts`). Therefore: `src/components/AffiliateLink.tsx` must be a **leaf** — it may import `src/lib/affiliate.ts` (pure), `next/link` is not even needed (it is an external-bound anchor), and it must import nothing from `src/blocks/`.

**Relationship population — MEDIUM confidence, verify in-phase.** `getCachedPost` uses `depth: 1`. Payload populates relationships inside Lexical nodes according to depth, but this has not been verified against 3.85.2 in this repo. **Design around the uncertainty:** the renderer should need only `slug` to build `/go/{slug}`, and it resolves the id through `getCachedAffiliateLinks(locale)` (already cached, already fetched by the same request on any page that also renders the stack, and cheap: one small query per 60s). That removes the depth dependency entirely. If the relationship *does* arrive populated, use it; if it arrives as a bare id, resolve through the map; if neither resolves, render the label as plain text — **never** emit `/go/undefined`.

### Migration shape (purely additive — CREATE TABLE / CREATE TYPE only)

Generated by `payload migrate:create`; read the SQL before applying. Expected DDL, modeled on the real `websites` migration (`src/migrations/20260714_163429.ts`) minus the `_v` version tables (no drafts):

```sql
CREATE TYPE "public"."enum_affiliate_links_category" AS ENUM('hosting','seo-tools','dev','analytics','productivity');

CREATE TABLE "affiliate_links" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar,
  "affiliate_url" varchar,
  "site_url" varchar,
  "logo_id" integer,
  "category" "enum_affiliate_links_category",
  "program" varchar,
  "cookie_window_days" numeric,
  "commission_note" varchar,
  "active" boolean DEFAULT true,
  "slug" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "affiliate_links_locales" (        -- the localized fields
  "tagline" varchar,
  "why_i_use_it" jsonb,
  "disclosure_override" varchar,
  "id" serial PRIMARY KEY NOT NULL,
  "_locale" "_locales" NOT NULL,
  "_parent_id" integer NOT NULL
);

ALTER TABLE "affiliate_links_locales"
  ADD CONSTRAINT "..._parent_id_fk" FOREIGN KEY ("_parent_id")
  REFERENCES "public"."affiliate_links"("id") ON DELETE cascade;
ALTER TABLE "affiliate_links"
  ADD CONSTRAINT "..._logo_id_media_id_fk" FOREIGN KEY ("logo_id")
  REFERENCES "public"."media"("id") ON DELETE set null;
CREATE UNIQUE INDEX "affiliate_links_locales_locale_parent_id_unique"
  ON "affiliate_links_locales" USING btree ("_locale","_parent_id");
CREATE UNIQUE INDEX "affiliate_links_slug_idx" ON "affiliate_links" USING btree ("slug");
```

**Additive-only checklist for this milestone (all four migrations):**
- No `DROP COLUMN`, `DROP TABLE`, `TRUNCATE`, or type narrowing anywhere in `up()`.
- No field gains or loses `localized: true` on an existing column. Every localized field in this milestone is **new**, so its `_locales` table is created empty — no backfill needed, and no approval-by-name gate triggered (per the relaxed Database Safety rule in `CLAUDE.md`).
- The Lexical inline block adds **zero** DDL: its data lives inside the existing `posts_locales.content` `jsonb` column. Confirmed by the shape of `pages_blocks_call_to_action_locales.rich_text jsonb` in the real migrations, and by the fact that `code-block`/`faq` blocks already live inside post bodies with no tables of their own (`src/components/richTextBlockConverters.tsx` header comment).
- The `ToolStack`/`EmailCapture` **Pages blocks** DO generate DDL: `pages_blocks_tool_stack`, `pages_blocks_tool_stack_locales`, `pages_blocks_tool_stack_groups(+_locales)`, plus `_pages_v_*` mirrors (Pages has drafts). All `CREATE TABLE`.

---

## 2. Link Cloaking / Redirect Route

### Route location and the middleware blocker

**File: `src/app/go/[slug]/route.ts` — outside `(frontend)/[locale]`, outside `(payload)`.**

**BLOCKER (must be fixed in the same phase, verified by reading `src/middleware.ts`):**

```ts
export const config = { matcher: ['/', '/((?!api|admin|_next|_vercel|.*\\..*).*)'] }
```

`/go/notion` contains no dot and is not `api`/`admin`/`_next`/`_vercel`, so it **is matched today**. Two consequences, both fatal:

1. Every click first performs the same-process loopback `fetch('/api/redirects-lookup')` — a DB round trip (cached, but still a hop) on a path that can never have a redirect doc.
2. `createIntlMiddleware(routing)` with `localePrefix: 'as-needed'` rewrites the unprefixed path to the default locale → `/es/go/notion` → no such route exists (there is no catch-all under `[locale]`) → **404 on every affiliate click**.

This is also precisely why `/sitemap.xml`, `/robots.txt`, `/llms.txt` and `/sitemap.html` work today: they all contain a dot and are excluded by `.*\..*`. `/go` has no dot.

**Fix (one line, MODIFIED `src/middleware.ts`):**

```ts
export const config = { matcher: ['/', '/((?!api|admin|go/|_next|_vercel|.*\\..*).*)'] }
// NOTA (corregido 2026-08-13): el trailing slash de `go/` es obligatorio. El lookahead
// esta anclado justo despues de la barra inicial, asi que matchea por PREFIJO, no por
// segmento: un `go` pelado excluiria /gobierno, /golang-para-seo y cualquier slug futuro
// que empiece con esas dos letras, saltandose next-intl Y el lookup de redirects.
```

*Rejected alternative:* mounting at `/api/go/[slug]`, which is already excluded. Rejected because a visitor-facing affiliate URL reading `/api/go/notion` is less obviously first-party (which matters for Amazon's "we must be able to determine the originating site" requirement), and because `/go/` is the conventional, human-legible shape that affiliate-compliance guidance describes.

This one-line matcher edit is the highest-risk change in the milestone. Isolate it in its own phase and curl-verify it against a control route (`/`, `/en`, `/servicios`, `/en/services`, `/blog`) — the repo already has that habit: Phase 19 curl-verified 10 URL combinations.

### Status code: 302, not 301

| | Why |
|---|---|
| **302 Found — chosen** | Browsers do not persist it. Every click reaches the server, so (a) the click count does not silently under-report after the first visit, and (b) a changed destination (Amazon tag rotation, program switch, network migration) takes effect immediately for returning visitors. |
| 301 rejected | Permanently cached by the browser. A returning visitor is redirected *by their own browser* to a stale affiliate URL forever, with no server hit and no way to fix it. For a monetized link this is a revenue bug, not a perf optimization. |
| 307 rejected | Method-preserving; irrelevant for a GET-only link and non-idiomatic here. |
| 308 (used by the redirects plugin path in middleware) | Correct for canonical URL moves, wrong here for the same reason as 301. Note the two mechanisms now use different codes on purpose. |

```ts
// src/app/go/[slug]/route.ts
import { after, NextResponse, type NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'   // same reason as every other route here:
                                          // the Dokploy/Nixpacks build container has no DB access

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const links = await getCachedAffiliateLinks('es')      // slug/URL are non-localized → locale is arbitrary
  const link = links.find((l) => l.slug === slug && l.active)

  // SECURITY: the destination comes EXCLUSIVELY from the admin-authored doc,
  // never from a query param. Same T-02-01 open-redirect rule already documented
  // in getCachedRedirectTarget (src/lib/cache.ts). No `?to=` fallback, ever.
  if (!link?.affiliateUrl) return new NextResponse('Not found', { status: 404 })

  after(() => logClick({ link, req }))   // post-response, adds 0ms to the click

  return NextResponse.redirect(link.affiliateUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
```

`Cache-Control: no-store` matters: without it a proxy or the browser can cache even a 302 and the click stops being counted. `X-Robots-Tag` is belt-and-braces — a redirect response is not indexed anyway, but the header costs nothing and covers a crawler that follows the hop.

`after` is confirmed available on this exact Next version: `node_modules/next/server.d.ts:16` → `export { after } from 'next/dist/server/after'` (Next 15.4.11; stable since 15.1, with explicit self-hosted-server support). It is the right primitive here precisely because this deploy is a long-lived Node process, not serverless.

### Rendering side: `rel` and `target`

```tsx
// NEW src/components/AffiliateLink.tsx — leaf component, no block imports
<a href={`/go/${slug}`} rel="sponsored nofollow noopener" target="_blank">{label}</a>
```

- **`rel="sponsored"` is required by Google.** Google Search Central's link-tagging guidance asks sites in affiliate programs to qualify those links with `rel="sponsored"`, manually or dynamically, and warns that failing to do so can trigger manual or algorithmic action. Multiple `rel` values may be combined.
- **`noreferrer` must NOT be used.** `noreferrer` strips the `Referer` header. Amazon's Operating Agreement forbids obscuring the site from which the customer clicked through; deliberately stripping the referrer works against exactly that. Note that the existing `src/components/CMSLink.tsx` emits `rel="noopener noreferrer"` whenever `newTab` is set — **`AffiliateLink` must therefore be a separate component, not a `CMSLink` wrapper.** This is a real, easy-to-miss trap.
- **`rel` is not an editable Payload field.** Making it editable invites an editor to remove `sponsored`. It is emitted unconditionally by the component.
- **Honest caveat:** the href is *internal* (`/go/...`), so `rel="sponsored"` on it is a weak signal — it qualifies a link to your own domain. The signals that actually do the work are (a) the visible disclosure and (b) `Disallow: /go` in robots.txt. Emit `rel="sponsored"` anyway: it is the documented convention, it costs nothing, and it is what an auditor looks for.

### robots / noindex treatment

**MODIFIED `src/app/robots.ts`:**

```ts
disallow: ['/admin', '/api', '/go'],
```

Blocking `/go` stops Google spending crawl budget on non-content redirect URLs — the standard practice for cloaked affiliate paths. `/go/*` is never emitted into `sitemap.xml` (it is not a `pages` doc and is not in `SITEMAP_COLLECTIONS`), so nothing advertises it. `X-Robots-Tag: noindex` on the response covers a crawler that reaches it anyway.

### Amazon Associates compliance (MEDIUM confidence — verify against the live agreement before publishing Amazon links)

The Operating Agreement forbids cloaking/hiding/spoofing "the URL of your Site containing Special Links (including by use of Redirecting Links) … such that we cannot reasonably determine the site … from which a customer clicks through". Vendor/community reading (Geniuslink, Lasso) is that a **first-party `yoursite.com/go/x` 302 that preserves the Tracking ID and lands on Amazon is compliant**, while generic third-party shorteners that hide the destination are the risky pattern. Because this is a vendor/community interpretation of a contract rather than a first-party statement, the roadmap should flag "re-read the current Amazon Associates Operating Agreement section on Redirecting Links" as an explicit task in the phase that publishes the first Amazon link. Concrete design consequences already baked in: no `noreferrer`, no URL shortener, no stripping of query parameters from `affiliateUrl`, and visible disclosure on the page.

### Coexistence with `@payloadcms/plugin-redirects`

Once `go` is in the matcher lookahead, the two mechanisms cannot collide: the redirects plugin only fires from `src/middleware.ts`, which no longer runs on `/go`. **Invariant to document in code:** a `redirects` doc with `from: '/go/...'` would be dead configuration. A validate hook on the plugin's `from` field is more machinery than the risk deserves — a comment in `src/app/go/[slug]/route.ts` and in the phase notes is sufficient.

### Click logging

**Collection `affiliate-clicks` (NEW):** append-only events, not a counter.

| Field | Type | Localized | Notes |
|-------|------|-----------|-------|
| `link` | relationship → `affiliate-links` | NO | id reference |
| `slug` | text | NO | snapshot, so the row survives a rename/delete |
| `path` | text | NO | referring page pathname (`/blog/seo/x`), from the `Referer` header |
| `locale` | text | NO | a data attribute, not copy — localizing a locale field is nonsense |
| `country` | text | NO | optional, from a proxy geo header if present |

Access: `read: authenticated`, `create/update: () => false`, `delete: authenticated`. The route handler writes via the Local API with the default `overrideAccess: true`.

> **This is the one place in the codebase where `overrideAccess: true` is correct, and it must carry a comment saying so** — every read path in `src/lib/cache.ts` carries the opposite invariant because of the Phase 24 draft leak. Here the writer is a server-trusted handler and the payload is not user-parameterized beyond a slug that was already resolved against admin-authored data.

**Concurrency / write amplification on Neon:**

`payload.config.ts` uses the **UNPOOLED direct** Neon connection string (its comment explains why: the `-pooler` string breaks `payload migrate` prepared statements). A direct connection has a low, hard ceiling, so every `after()` INSERT borrows from a small pg pool. At portfolio traffic (tens of clicks/day) this is a non-issue. The real risk is a crawler or uptime monitor hammering `/go/*`. Mitigations, in order of effectiveness and cost:

1. `Disallow: /go` in robots.txt (already required above) — removes well-behaved crawlers.
2. Skip logging when the User-Agent matches a bot pattern, or when `Sec-Fetch-Mode`/`Sec-Fetch-Dest` headers are absent (a real browser click always sends them). Pure header check, zero cost.
3. Reuse the **existing** in-process throttle pattern from `src/app/actions/contact.ts` — a module-level `Map` keyed by IP. That file carries a long comment justifying module state for this deploy ("single persistent Node process on Hostinger … not serverless/edge"), including a note that `react-doctor`'s `server-no-mutable-module-state` warning is a known false positive here. Reuse the pattern *and* the comment; do not invent a new mechanism.

**Why an events table and not `UPDATE affiliate_links SET clicks = clicks + 1`:** concurrent increments on one hot row serialize on a row-level lock, so the busiest link is the slowest one; INSERTs into an append-only table do not contend. The events table also answers "which post drives clicks", which a counter structurally cannot. Aggregation is `payload.count()` on demand — **do not build a dashboard** (that is exactly the "internal analytics tooling" the project's Out of Scope section rejects). If the table ever exceeds ~1M rows, add a monthly rollup; note the threshold so it is not a silent scaling trap.

---

## 3. "My Stack" Page

### Recommendation: reuse `Pages` + a new `ToolStack` block. Do NOT create a page collection.

The tools get their own collection (`affiliate-links`) because that is **data reused across surfaces**. The stack page is a **view** over that data, and views belong in the block system.

Grounded justification:

1. **Direct precedent, already marked ✓ Good in `.planning/PROJECT.md` Key Decisions:** *"Páginas de servicio (v1.4) reusan la colección `Pages` existente en vez de una colección `Services` nueva — son landings de marketing con la misma forma que cualquier doc de `Pages` (bloques Hero/Content/FAQ/CallToAction); una colección nueva hubiera significado migración + admin UI + plumbing duplicado sin beneficio funcional."* The stack page is the same shape: Hero + Content + the grid + CallToAction. Four of five blocks already exist.
2. **Structural precedent for the block itself:** `src/blocks/ServicesShowcase/config.ts` has exactly one editable field (`title`), with all card content derived live from the source of truth. `ToolStack` is that pattern with a different source.
3. A page collection would also drag in `@payloadcms/plugin-seo` registration, sitemap wiring, and a detail route — none of which the stack page needs.

```ts
// NEW src/blocks/ToolStack/config.ts
export const ToolStack: Block = {
  slug: 'toolStack',
  interfaceName: 'ToolStackBlock',
  fields: [
    { name: 'title', type: 'text', localized: true },      // heading — prose
    { name: 'intro', type: 'richText', localized: true },  // prose
    { name: 'groups', type: 'array', fields: [
        { name: 'heading', type: 'text', localized: true },              // prose → LOCALIZED
        { name: 'tools', type: 'relationship', relationTo: 'affiliate-links',
          hasMany: true },                                               // ids → NOT localized
    ]},
    { name: 'showDisclosure', type: 'checkbox', defaultValue: true },    // boolean → NOT localized
  ],
}
```

`groups[].tools` is a non-localized relationship array on purpose: a document reference is language-independent, and all of its human copy is localized *inside* the referenced doc. This is the structural inverse of the `CaseStudies.services[].service` bug (which stored human text in a shared array column). A curated array is preferred over "query all tools by category" because ordering is editorial — the first tool in each group is the one that converts.

### Bilingual routing: single shared segment `/stack` (+ `/en/stack`)

**Chosen: single shared segment. Rejected: dual segment (`/herramientas` + `/tools`).**

The project has precedent for both. Services uses a dual segment; `case-studies`, `websites`, `authors`, `blog`, `contact`, `privacy`, `terms`, `seo-tecnico-lima`, `seo-tecnico-madrid` all use a single shared segment — and `src/lib/breadcrumbs.ts:44-48` explicitly documents that *only* Services genuinely differs. Reasons to stay in the majority here:

1. **No keyword argument.** The dual segment existed because "servicios" and "services" are both real, high-volume, locale-distinct commercial queries. "Stack" is the same word in Spanish technical usage, and the audience is developers and SEOs. There is no second keyword to win.
2. **The dual segment is expensive, and the codebase proves it.** It required: `buildServiceAlternates()` in `src/lib/canonical.ts` to collapse four physical URL combinations into two canonicals; `normalizeServiceHref()` in `src/lib/service-slugs.ts`; a `SERVICE_SEGMENTS` map in `src/lib/breadcrumbs.ts`; and a special-case branch in `src/lib/sitemap-data.ts:114-127`. Four modules, each a place a bug can hide.
3. **`normalizeServiceHref()` exists *only* to paper over a non-localized-field bug.** Its own docblock says so: *"Content stored in Payload (Header.navItems.url, page card links) is not locale-aware — some of those fields are non-localized, so a single stored URL like `/services` renders on both locales verbatim unless corrected here."* Choosing a dual segment for `/stack` would recreate the exact `Header.navItems.url` bug fixed in Phase 21 the moment the nav link is added. **With a single segment, the stored href `/stack` is verbatim-correct in both locales** — next-intl's `as-needed` prefix serves it as ES, and the LocaleSwitcher's prefix produces `/en/stack`. Zero normalization needed. This is the strongest argument and it maps directly onto the documented bug history.
4. **Zero changes to `src/lib/sitemap-data.ts` and `src/lib/canonical.ts`** (see §6). A dual segment would require editing both.

Escape hatch, stated honestly: if later keyword research shows a Spanish segment is worth real traffic, the correct migration is a `redirects` doc plus a second route folder mirroring Services — additive, reversible. Do not pre-build it.

**Route:** `src/app/(frontend)/[locale]/stack/page.tsx`, copying the shape of `src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx` verbatim: `export const dynamic = 'force-dynamic'`, fetch the `pages` doc with `slug: 'stack'`, `generateMetadata` using `buildOpenGraph(...)` + `buildAlternates(locale, '/stack', '/en/stack')`, render via `<RenderBlocks />`. **No breadcrumbs** — `/stack` is a top-level page like `/contact`, `/privacy`, `/terms`, none of which have a trail, so `src/lib/breadcrumbs.ts` is untouched.

**Nav:** add a `/stack` item to the `header` global via the admin UI. `Header.navItems[].link.url` is not localized, and with a single segment that is now correct rather than a bug. No code change.

---

## 4. Email Capture Flow

### End-to-end

```
[EmailCapture block on any Pages doc]  (Server Component, plain <form action={...}>)
        ↓  FormData: email, locale, leadMagnetId, company_website (honeypot)
[src/app/actions/subscribe.ts]  server action — clone of contact.ts
        ├─ honeypot filled?            → silent success redirect, no write
        ├─ per-IP rate limit (Map)     → ?subscribed=false
        ├─ EMAIL_REGEX fail            → ?subscribed=false
        ├─ upsert `subscribers` doc    status=pending, confirmToken=<32B hex>,
        │                              confirmTokenExpiresAt=now+48h, locale, source
        └─ payload.sendEmail(...)      confirmation email, locale-correct copy,
                                       link → /{locale}/newsletter/confirm?token=…
        ↓
[src/app/(frontend)/[locale]/newsletter/confirm/page.tsx]   noindex, force-dynamic
        ├─ token lookup + expiry check → invalid/expired screen (no leak of why)
        ├─ subscribers.status = confirmed, confirmedAt = now
        ├─ resend.contacts.create({ email, audienceId, unsubscribed:false })
        │     → store resendContactId on the doc (idempotency)
        └─ mint a 15-minute Cloudinary signed URL for the lead magnet, render
          the download button + a copy of the link in a follow-up email
```

### Where state lives: **Payload owns the state machine, Resend owns the delivery list**

Resend's contact model is `{ email, firstName, lastName, unsubscribed }` — it has nowhere to put a confirmation token, an expiry, a lead-magnet association, a source page, or the subscriber's locale. And there is **no built-in double opt-in in Resend**; the confirm step must be implemented by the app either way. So:

- `subscribers` (Payload) is the source of truth for `pending | confirmed | unsubscribed`, the token, the locale and the acquisition source.
- Resend receives the contact **only after confirmation**. Unconfirmed addresses never enter the sending list, which is what protects the sender reputation of a domain that also sends this site's transactional contact-form mail.
- Unsubscribes flow the other way: Resend's unsubscribe link flips `unsubscribed: true` in Resend; a periodic reconciliation (or a Resend webhook, later) mirrors it onto the Payload doc. Divergence here is cosmetic, not harmful — the send list is the one that must be right, and Resend owns it.

**Collection `subscribers` (NEW):** `email` (text, unique, index, NOT localized), `status` (select, NOT localized), `locale` (select `es|en`, **NOT localized** — it is a data attribute; a per-locale locale field is nonsense), `source` (text, NOT localized), `leadMagnet` (relationship, NOT localized), `confirmToken` (text, index, NOT localized), `confirmTokenExpiresAt` (date), `confirmedAt` (date), `resendContactId` (text). **No localized fields at all** — this collection stores no prose. All confirmation copy comes from `messages/{es,en}.json`, which is also what guarantees it can never be half-translated (the failure mode behind the documented bug history).

Access: `read/create/update/delete: authenticated`. The server action writes through the Local API.

> **MODIFIED `src/payload.config.ts` — do NOT add `subscribers`, `affiliate-clicks` or `lead-magnets` to the `mcpPlugin` collections map.** That map currently exposes 10 collections to any MCP client. Adding `subscribers` would expose subscriber email addresses over MCP. This needs to be an explicit instruction in the phase plan, because the natural instinct when registering a new collection is to add it everywhere the others appear.

### Confirmation email transport

Use `payload.sendEmail(...)` — the `resendAdapter` is already configured in `payload.config.ts` with `defaultFromAddress`/`defaultFromName`, and `src/app/actions/contact.ts` already uses exactly this call. **The raw `resend` SDK is still needed** for `contacts.create` (Audiences are not part of the email adapter). `resend` is **not** currently a direct dependency (`package.json` has only `@payloadcms/email-resend@3.85.2`) — adding `resend` is the milestone's one new runtime dependency. Env vars: `RESEND_AUDIENCE_ID` alongside the existing `RESEND_API_KEY` / `RESEND_FROM_EMAIL`. Follow the established env-gate pattern (`hasCloudinaryCreds` in `payload.config.ts`): if `RESEND_AUDIENCE_ID` is absent, still confirm the subscriber in Payload and still deliver the magnet — just skip the Resend contact call and log. Local dev must not require cloud credentials.

### Confirm route: a **page** inside `[locale]`, not a route handler

`src/app/(frontend)/[locale]/newsletter/confirm/page.tsx` with `?token=`. Rationale:

- It renders a real bilingual screen inside the existing layout (header, footer, fonts, skip-link) instead of a bare redirect.
- It stays inside the `[locale]` tree, so **no middleware matcher change is needed** — unlike `/go`. Only one route in this milestone gets to be outside the locale tree, and it is the one that genuinely has no locale.
- `generateMetadata` must set `robots: { index: false, follow: false }`. It is not a `pages` doc, so it never enters `sitemap.xml` automatically, but it is reachable by URL.
- `export const dynamic = 'force-dynamic'`, matching every other route in the repo.

### Lead magnet delivery: Cloudinary `authenticated` raw asset + signed expiring URL

**Collection `lead-magnets` (NEW) — deliberately NOT a Payload upload collection.**

| Field | Type | Localized | Reasoning |
|-------|------|-----------|-----------|
| `title` | text | **YES** | Prose. |
| `cloudinaryPublicId` | text | **YES** | **The second explicit localization exception.** The Spanish PDF and the English PDF are genuinely different files, so the identifier itself differs per locale. This is the same logic that makes `media.alt` localized. Not localizing it would ship an English checklist to Spanish subscribers. |
| `fileFormat` | text (`pdf`) | NO | Machine value. |
| `resourceType` | select (`raw`/`image`) | NO | Cloudinary parameter. |

Delivery, generated server-side inside the confirm page:

```ts
// NEW src/lib/secure-download.ts
cloudinary.utils.private_download_url(publicId, 'pdf', {
  resource_type: 'raw',
  type: 'authenticated',
  expires_at: Math.floor(Date.now() / 1000) + 900,   // 15 minutes
})
```

**Why this and not a Payload upload collection with access control:**

1. `src/collections/Media/index.ts` sets `upload.mimeTypes: ['image/*']` — a PDF cannot go there without changing a shared collection.
2. A second upload collection would need `cloudStoragePlugin` wired for it in `payload.config.ts`, and even then Payload's `access.read` governs **the document**, not the CDN object. The returned Cloudinary URL would remain publicly fetchable forever. That is security theater.
3. Cloudinary `authenticated` delivery + `private_download_url` is the only mechanism that actually expires.
4. **Zero new dependencies and an existing in-house precedent:** `cloudinary@^2.10.0` is already installed, and `src/lib/og-image.ts` documents that this account already stores `raw/authenticated Array-Bold.woff2`. The pattern is proven on this exact Cloudinary account.

Accepted limitation: a signed URL can be shared within its 15-minute window. That is fine — a lead magnet is meant to be given away; the gate is the email address, not DRM.

### Spam/bot protection with no heavy client script

The site's core value is a zero-regression performance gate, so **no CAPTCHA**: hCaptcha/Turnstile/reCAPTCHA each add 20-60 KB plus a third-party connection on a page whose whole job is to load fast. The ladder that replaces it, in order:

1. **Honeypot** — reuse the exact field name and off-screen technique already shipped in `ContactFormBlockComponent` (`company_website`, `absolute -left-[9999px]`, `tabIndex={-1}`, `autoComplete="off"`) and the exact server-side handling in `sendContactMessage` (silent success, never an error, so the bot learns nothing). Cost: 0 KB.
2. **Per-IP rate limit** — the module-level `Map` in `src/app/actions/contact.ts`, with its existing justification comment carried over verbatim. Cost: 0 KB.
3. **Double opt-in itself** — the strongest filter available. A bot-submitted address never confirms, so it never reaches Resend and never costs sender reputation.
4. *(Optional, cheap)* a hidden render-timestamp field HMAC-signed with `PAYLOAD_SECRET`, rejecting submissions that arrive under ~2 seconds. Server-side verification only, no client script. Same HMAC helper the deferred store will need (`src/lib/download-token.ts`).

---

## 5. Digital Product Store — Design Only (defer to v2.2)

### Minimal integration shape, if and when it happens

| Piece | Shape | Notes |
|-------|-------|-------|
| `products` collection | `name` (NOT localized), `slug` (NOT localized), `description` richText (**LOCALIZED**), `priceCents` + `currency` (**NOT localized** — money is a market attribute, not copy; localizing it repeats the `affiliateUrl` axis error), `checkoutUrl` / `providerProductId` (NOT localized), `deliverable` → relationship to `lead-magnets` | The store is ~80% the lead-magnet delivery mechanism with a payment gate in front |
| Checkout handoff | Hosted checkout page, linked with a plain `<a href={checkoutUrl}>` | 0 KB. No client SDK. |
| Provider | Merchant-of-record (Lemon Squeezy / Polar / Gumroad) over Stripe-direct | MoR handles EU VAT and cross-border tax exposure for a Peru/Spain-facing seller, and the site never touches card data — no PCI surface on a self-hosted box, no Stripe.js weight against the performance gate |
| Webhook | `src/app/api/webhooks/[provider]/route.ts` | Lives under `/api`, therefore **already excluded** by the middleware matcher and **already disallowed** in robots.ts. Zero routing work. `dynamic = 'force-dynamic'`. Verify the HMAC over the **raw** body: `await request.text()` first — never `request.json()` before verifying. |
| `orders` collection | `providerOrderId` (unique — the idempotency key, since webhooks retry), `email`, `product`, `downloadToken`, `downloadExpiresAt`, `downloadCount`. `read: authenticated`. No localized fields. | |
| Download delivery | `/{locale}/download?token=` page + `private_download_url` | **The same two helpers built in §4**, reused verbatim |

### What is NOT worth building until there is a first product

Explicitly: the `products` collection, the `orders` collection, the webhook route, the download-token flow, any admin sales view, refunds, coupons, VAT reporting, and any checkout UI. **None of it should ship in v2.1.** Every one of those is unfalsifiable until a real product exists — the price, the format, the fulfilment shape and even the provider choice all move once there is something to sell.

**What IS worth doing now, at zero extra cost, so the store is later a small addition rather than a rebuild:**

1. Put the Cloudinary signing logic in `src/lib/secure-download.ts` and the HMAC token mint/verify in `src/lib/download-token.ts` — **not inline in the newsletter confirm page**. Both are needed by the lead magnet anyway. With that boundary in place, the store phase becomes "add a webhook + an orders table", not "rebuild delivery".
2. Choose the provider and open the account, so the decision is not re-litigated later. Write no code.

---

## 6. SEO / Performance Impact

### Files that do NOT need to change (the payoff of the single-segment decision)

- **`src/lib/sitemap-data.ts` — unchanged.** The generic branch (lines 139-145) computes `path = doc.slug` for any `pages` doc with `prefix === ''` and emits `${SITE_URL}/stack` + `${SITE_URL}/en/stack` with reciprocal alternates, automatically, the moment the `pages` doc with slug `stack` is published. A dual URL segment would have required a third special case next to `isServicesIndex`/`isServiceLanding`.
- **`src/lib/canonical.ts` — unchanged.** `buildAlternates(locale, '/stack', '/en/stack')` is the existing generic 1:1 builder; it already emits `canonical` + `languages.es/en/x-default` (x-default → `es`, matching `routing.defaultLocale`). A dual segment would have needed a `buildServiceAlternates`-style 4-to-2 collapsing function.
- **`src/lib/breadcrumbs.ts` — unchanged.** `/stack` is a top-level page like `/contact`/`/privacy`/`/terms`, none of which render a trail.

### Sitemap hygiene (things that must NOT be added)

`affiliate-links`, `affiliate-clicks`, `subscribers` and `lead-magnets` must **not** be added to `SITEMAP_COLLECTIONS` — none has a public URL. The typed union on `SitemapCollection['collection']` makes this a visible, deliberate choice rather than an omission. `/go/*` and `/{locale}/newsletter/confirm` never enter the sitemap; the confirm page additionally sets `robots: { index: false }` because it is reachable by URL.

### Canonical / hreflang for the new page

`/stack` ↔ `/en/stack` reciprocal, `x-default` → `/stack`, produced by `buildAlternates`. Correct by construction, no new logic.

### Structured data opportunity

The stack page can emit an `ItemList` of `SoftwareApplication` entries through the existing `src/components/JsonLd.tsx`. Cheap, and it feeds the AI/GEO surface that is literally one of Juan's four service lines (`ai-seo-geo`). Optional, high value-per-line.

### Affiliate disclosure (legal + trust, and it is UI, not config)

FTC and EU rules require a clear, conspicuous disclosure **above the first affiliate link**, not in the footer. Implementation:

- `NEW src/components/AffiliateDisclosure.tsx`, rendered by `ToolStack` when `showDisclosure` is true.
- For blog posts, injected automatically by the post template when the body contains at least one affiliate inline block. Detection is a pure function `hasAffiliateLinks(editorState)` in `src/lib/affiliate.ts` that scans the already-loaded Lexical JSON for `blockType === 'affiliateLink'` — **no extra query**.
- Copy lives in `messages/es.json` / `messages/en.json`, never in Payload. A translation stored in code cannot be half-filled, which is the failure mode behind every bug in the documented history.

### Performance gate

**Zero new client JavaScript across the entire milestone.** Every new component is a Server Component: the stack grid is static markup, the email form is a plain `<form action={serverAction}>` (identical to `ContactFormBlockComponent`, which ships no client JS), the affiliate link is an `<a>`. Click tracking is server-side by construction — that is the single biggest performance advantage of this design over the conventional plugin approach.

**Explicitly excluded:** Amazon OneLink, Skimlinks, Sovrn, any affiliate-network JS pixel, any client-side A/B tool, any additional consent platform.

**New database work per request:**

| Route | Extra queries | Mechanism |
|-------|---------------|-----------|
| `/stack`, `/en/stack` | 1 | `getCachedAffiliateLinks(locale)` — `unstable_cache`, tag `affiliate-links:all`, `revalidate: CACHE_TTL_SECONDS` (60), `overrideAccess: false`, invalidated by an `afterChange` hook |
| Blog post with inline affiliate links | 0 | Same cached fetcher, deduped by `unstable_cache` within the request |
| `/go/{slug}` | 0 reads on a cache hit | Same fetcher; 1 INSERT **after** the response via `after()` |
| `/{locale}/newsletter/confirm` | 2 | Token lookup + status update. Not indexed, not on a hot path. |

`src/lib/cache-tags.ts` gains `CACHE_TAGS.affiliateLinks()` plus `revalidateAffiliateLinksCache`/`OnDelete` hooks, following the Phase 43 pattern exactly. **That file must stay free of `payload`/`@payload-config` imports** — its header comment documents the `payload.config.ts → collections/* → cache-tags.ts → @payload-config` cycle it exists to avoid.

**Regression gate:** the repo already has `lighthouse`, `chrome-launcher` and `playwright` in devDependencies and an established REG-01/REG-02 baseline-then-gate pattern from v1.7. Capture the baseline **before** the first phase that changes rendered pages (Phase C), add `/stack` in both locales to the measured route set, and keep the existing thresholds (no >5pt performance drop, no CWV band crossing, H1/JSON-LD byte-identical on untouched routes).

---

## Data Flow

### Affiliate click

```
Visitor clicks <a href="/go/notion" rel="sponsored nofollow noopener" target="_blank">
        ↓
src/middleware.ts  — SKIPPED (matcher now excludes `go`; no redirects-lookup hop, no locale rewrite)
        ↓
src/app/go/[slug]/route.ts  (Node runtime, force-dynamic)
        ├─ getCachedAffiliateLinks('es')  → unstable_cache hit, 0 DB reads
        ├─ find slug, active? no → 404 (never an attacker-supplied fallback)
        └─ NextResponse.redirect(link.affiliateUrl, 302,
             { Cache-Control: no-store, X-Robots-Tag: noindex })
        ↓ response already sent
after(() => payload.create({ collection: 'affiliate-clicks', ... }))
        ├─ bot UA / missing Sec-Fetch-* → skip
        └─ per-IP throttle (module Map) → skip
```

### Stack page render

```
GET /stack  →  middleware (intl, as-needed prefix)  →  [locale]/stack/page.tsx
     ├─ getCachedPageBySlug('stack', locale)     [existing fetcher, overrideAccess:false]
     ├─ RenderBlocks(doc.content.layout)
     │     └─ toolStack → ToolStackComponent (Server Component)
     │            ├─ getCachedAffiliateLinks(locale)   [1 cached query]
     │            ├─ <AffiliateDisclosure />           [copy from messages/*.json]
     │            └─ <AffiliateLink slug=… />          [<a rel="sponsored nofollow noopener">]
     └─ generateMetadata: buildOpenGraph + buildAlternates(locale,'/stack','/en/stack')
```

### Email capture

```
<form action={subscribe}>  →  src/app/actions/subscribe.ts
   honeypot → rate limit → regex → payload.create/update('subscribers', status:'pending')
                                 → payload.sendEmail(confirmation, locale copy)
   →  /{locale}/newsletter/confirm?token=…
        → verify token + expiry → status:'confirmed'
        → resend.contacts.create({ audienceId })        [env-gated]
        → secure-download.ts → 15-min Cloudinary signed URL → render + email the link
```

---

## Architectural Patterns

### Pattern 1: Pure helper module, importable from anywhere

**What:** URL/slug logic lives in a zero-import module with no `payload`/`@payload-config` reference.
**When:** any time both a Server Component and a Client Component (or `cache-tags.ts`) need the same derivation.
**Precedent:** `src/lib/service-slugs.ts` was split out of `services-data.ts` for exactly this reason, and its header explains that importing the DB-touching module from a Client Component would pull the Payload server SDK into the client bundle. `src/lib/breadcrumbs.ts` and `src/lib/canonical.ts` follow the same rule.
**Apply to:** `src/lib/affiliate.ts` (`buildGoHref`, `hasAffiliateLinks`, `pickDestination`).

### Pattern 2: `unstable_cache` fetcher + tag invalidation hook

**What:** every new read path gets a fetcher in `src/lib/cache.ts` with `overrideAccess: false`, a tag from `src/lib/cache-tags.ts`, and an `afterChange`/`afterDelete` hook on the collection.
**Trade-off:** up to 60s staleness on the TTL safety net; the hooks make the normal case instant.
**Non-negotiable:** `overrideAccess: false`. `src/lib/cache.ts`'s header documents that omitting it once let a draft doc get cached and served to anonymous visitors — "worse than the single-request leak already fixed in Phase 24, because a cache hit amplifies it across visitors".

### Pattern 3: Block reads a source of truth; only the heading is editable

**What:** `ServicesShowcase` exposes one `title` field and derives every card from `SERVICE_SLUGS` at render time.
**Why:** content cannot drift from the source of truth, because there is no second copy.
**Apply to:** `ToolStack` (curated group order is the one editorial input; all card content comes from `affiliate-links`).

### Pattern 4: Server-action form with no client JS

**What:** `<form action={serverAction}>` in a Server Component; state comes back through a `?param=` on redirect.
**Precedent:** `ContactFormBlockComponent` + `sendContactMessage` — including the honeypot, the module-level rate limiter, and the `?sent=true|false` round trip.
**Apply to:** `EmailCapture` + `subscribe.ts`, field-name-for-field-name.

---

## Anti-Patterns

### Anti-Pattern 1: Localizing a URL or a slug "just in case"

**What people do:** mark `affiliateUrl`/`slug` as `localized: true` because the site is bilingual.
**Why it's wrong:** it encodes a *market* split into a *language* field, and it makes `/go/[slug]` — which has no locale in scope — pick a default locale, adding a third independent `defaultLocale` to a codebase whose own config file warns about the two that already exist drifting. It also converts a future change from an additive `CREATE TABLE` into the `DROP COLUMN`-with-backfill reshape that caused the Phase 19 data-loss incident.
**Do instead:** keep it non-localized; add a non-localized `regionalUrls` array if and when a program actually requires it.

### Anti-Pattern 2: Storing human labels in a shared non-localized column

**What people do:** a free-text `category` or `groupHeading` without `localized: true`.
**Why it's wrong:** last write wins and one language silently loses its copy — the exact `CaseStudies.services[].service`, `TestimonialsCarousel.title` and `CallToAction.richText` bugs.
**Do instead:** either mark it `localized: true`, or (better, for a closed set) store an enum and translate the label in `messages/*.json`, which cannot be half-filled.

### Anti-Pattern 3: A click counter column

**What people do:** `UPDATE affiliate_links SET clicks = clicks + 1`.
**Why it's wrong:** concurrent increments serialize on a row lock, so the most successful link becomes the slowest; and a scalar can never answer "which post drives clicks".
**Do instead:** append-only `affiliate-clicks` INSERTs, written post-response through `after()`.

### Anti-Pattern 4: Reusing `CMSLink` for affiliate links

**What people do:** reach for the existing link component.
**Why it's wrong:** `CMSLink` emits `rel="noopener noreferrer"` whenever `newTab` is set. `noreferrer` strips the `Referer` header, working directly against Amazon's requirement that it be able to determine the originating site — and it never emits `rel="sponsored"`, which Google requires.
**Do instead:** a dedicated `AffiliateLink` leaf component that always emits `rel="sponsored nofollow noopener"` and never `noreferrer`.

### Anti-Pattern 5: 301 on the affiliate redirect

**What people do:** reach for "permanent" because the mapping feels permanent.
**Why it's wrong:** the browser caches it forever; click counts under-report and a rotated affiliate tag can never reach a returning visitor.
**Do instead:** 302 with `Cache-Control: no-store`.

### Anti-Pattern 6: Registering every new collection everywhere the others appear

**What people do:** add the new collections to `seoPlugin`, `searchPlugin` and `mcpPlugin` by reflex.
**Why it's wrong:** `subscribers` in `mcpPlugin` exposes email addresses to any MCP client; `affiliate-links` in `seoPlugin` adds a meta tab to a collection with no public page; `affiliate-clicks` in `searchPlugin` indexes noise.
**Do instead:** register the four new collections in `collections: [...]` only. Touch no plugin map.

---

## Integration Points

### New files

| File | Purpose |
|------|---------|
| `src/collections/AffiliateLinks/index.ts` | Tool source of truth |
| `src/collections/AffiliateClicks/index.ts` | Append-only click events |
| `src/collections/Subscribers/index.ts` | Opt-in state machine |
| `src/collections/LeadMagnets/index.ts` | Cloudinary public_id per locale |
| `src/blocks/ToolStack/config.ts` + `Component.tsx` | Stack grid block |
| `src/blocks/EmailCapture/config.ts` + `Component.tsx` | Capture form block |
| `src/blocks/AffiliateLinkInline/config.ts` | Lexical inline block (no Component — rendered via converter) |
| `src/components/AffiliateLink.tsx` | Leaf anchor, correct `rel` |
| `src/components/AffiliateDisclosure.tsx` | FTC/EU disclosure |
| `src/lib/affiliate.ts` | **Pure**: `buildGoHref`, `hasAffiliateLinks`, `pickDestination` |
| `src/lib/secure-download.ts` | Cloudinary signed expiring URL |
| `src/lib/download-token.ts` | HMAC mint/verify over `PAYLOAD_SECRET` |
| `src/app/go/[slug]/route.ts` | 302 redirect + `after()` logging |
| `src/app/actions/subscribe.ts` | Server action (clone of `contact.ts`) |
| `src/app/(frontend)/[locale]/stack/page.tsx` | Stack page route |
| `src/app/(frontend)/[locale]/newsletter/confirm/page.tsx` | Double opt-in confirm, `noindex` |
| `src/migrations/<ts>_affiliate_links.ts` | Additive |
| `src/migrations/<ts>_affiliate_clicks.ts` | Additive |
| `src/migrations/<ts>_toolstack_emailcapture_blocks.ts` | Additive (Pages block tables + `_pages_v` mirrors) |
| `src/migrations/<ts>_subscribers_lead_magnets.ts` | Additive |

### Modified files

| File | Change | Risk |
|------|--------|------|
| **`src/middleware.ts`** | add `go` to the matcher negative lookahead | **HIGH — the milestone's critical change.** Without it every affiliate click 404s. Curl-verify `/`, `/en`, `/servicios`, `/en/services`, `/blog`, `/go/<slug>` after editing. |
| `src/app/robots.ts` | `disallow: ['/admin', '/api', '/go']` | Low |
| `src/payload.config.ts` | register 4 collections in `collections: [...]` **only** — no plugin maps | Medium (see Anti-Pattern 6) |
| `src/collections/Pages/index.ts` | add `ToolStack`, `EmailCapture` to the `blocks` array | Low, additive |
| `src/blocks/blockRegistry.tsx` | map `toolStack`, `emailCapture` | Low |
| `src/collections/Posts/index.ts` | `content` editor: bare `lexicalEditor()` → `lexicalEditor({ features: … BlocksFeature({ inlineBlocks: [AffiliateLinkInline] }) })` | Medium — verify existing post bodies still render (`code-block`/`faq` nodes are unregistered blocks that already survive; adding a feature must not change that) |
| `src/components/richTextBlockConverters.tsx` | add the `inlineBlocks` key | Medium — **respect the documented circular-import constraint**; the affiliate renderer must be a leaf |
| `src/lib/cache.ts` | `getCachedAffiliateLinks(locale)` with `overrideAccess: false` | Low |
| `src/lib/cache-tags.ts` | `CACHE_TAGS.affiliateLinks()` + revalidate hooks; **keep it free of `@payload-config`** | Low |
| `messages/es.json`, `messages/en.json` | disclosure copy, stack UI strings, subscribe form + confirm strings, category labels | Low |
| `package.json` | add `resend` (the only new runtime dependency) | Low |
| `header` global (admin data, no code) | add the `/stack` nav item | Low — safe *because* of the single-segment decision |

### External services

| Service | Integration | Gotchas |
|---------|-------------|---------|
| Resend | `payload.sendEmail` for transactional mail (already wired); raw `resend` SDK for `contacts.create` | No built-in double opt-in — the app owns the confirm step. Needs `RESEND_AUDIENCE_ID`. Env-gate it like `hasCloudinaryCreds` so local dev runs without credentials. Note `RESEND_API_KEY` is still a placeholder in this repo (Phase 6 blocker) — the flow must degrade gracefully, not throw. |
| Cloudinary | `private_download_url` for lead magnets; `cloudinary@^2.10.0` already installed | Asset must be uploaded with `type: 'authenticated'`, `resource_type: 'raw'`. The account already hosts `raw/authenticated` assets (`src/lib/og-image.ts`). |
| Affiliate networks | Server-side 302 only. No SDK, no pixel, no script. | Amazon: preserve the Tracking ID, do not strip the referrer, no third-party shortener. Re-read the Operating Agreement's Redirecting Links clause before publishing the first Amazon link. |
| Neon Postgres | Existing direct (unpooled) connection | Click INSERTs go through the same small pool — mitigate with robots Disallow + bot-header filter + the existing module-Map throttle. |

---

## Suggested Build Order

Each step states the dependency that forces its position.

**A. Affiliate data model + migration**
`affiliate-links` collection, `getCachedAffiliateLinks`, `CACHE_TAGS.affiliateLinks`, `src/lib/affiliate.ts`, one additive migration. Nothing renders yet.
*Forced first:* every other piece needs a slug to point at. Also the only phase touching schema on the production DB, so it stands alone where the migration SQL can be read in isolation.

**B. `/go` redirect + middleware/robots fix + click logging**
`src/app/go/[slug]/route.ts`, the `src/middleware.ts` matcher edit, `robots.ts`, `affiliate-clicks` + its migration.
*Forced after A:* needs slugs to resolve. *Forced before C:* if any UI ships `/go/` hrefs before the matcher is fixed, **every affiliate link on the site is a 404**. Isolating the matcher edit here means it can be curl-verified against control routes with no other change in flight.

**B0. Regression baseline capture** — run before C, matching the REG-01 precedent of capturing Lighthouse/CWV + H1/JSON-LD before touching any rendered component.

**C. `ToolStack` block + `/stack` page + nav + disclosure**
Block config/component, migration for the block tables, the route, `AffiliateLink`, `AffiliateDisclosure`, `messages/*.json`.
*Forced after A (data) and B (working hrefs).* First revenue surface; first phase that changes rendered output, hence B0 immediately before it.

**D. Lexical inline affiliate link**
`AffiliateLinkInline`, the `Posts` editor change, the converter change.
*Could technically run right after B* — it has **zero migration**, so it blocks nothing and nothing blocks it. Placed after C on purpose: it is the riskier integration (the documented circular-import hazard in `richTextBlockConverters.tsx`, plus the unverified relationship-population-at-depth question), and because it has no schema impact it can slip a phase without stalling the milestone.

**E. Email capture**
`subscribers`, `lead-magnets`, `subscribe.ts`, the confirm page, `secure-download.ts`, `download-token.ts`, `EmailCapture` block, the `resend` dependency, migrations.
*Independent of A-D — it could run in parallel.* Ordered last for two reasons: its blocking dependency is **content, not code** (Juan has to write the actual lead magnet, and `RESEND_API_KEY` is still a placeholder), and `secure-download.ts` is the piece the deferred store will reuse, so it benefits from being written after the affiliate work has settled the `src/lib` conventions.

**Deferred — digital product store.** Not in v2.1. Choose the provider, open the account, write no code.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Middleware matcher blocker on `/go` | **HIGH** | Read `src/middleware.ts` directly; the `.*\..*` exclusion explains why the dotted routes work and `/go` would not |
| Migration additivity (`CREATE TABLE` only) | **HIGH** | Modeled on the real `websites` migration; the Lexical-inline-block zero-DDL claim is confirmed by the `jsonb` shape in the CallToAction migration and by `code-block`/`faq` living in post bodies with no tables |
| Localization decisions | **HIGH** | Each one is tied to a specific documented bug (`Header.navItems.url`, `Content.link.url`, `TestimonialsCarousel.title`, `CaseStudies.services[].service`, `CallToAction.richText`) and to the real field configs read in `src/collections/*` |
| Single-segment `/stack` routing | **HIGH** | `sitemap-data.ts:139-145` and `canonical.ts` `buildAlternates` verified to handle it with zero changes; `breadcrumbs.ts:44-48` documents that only Services differs |
| `after()` availability on Next 15.4.11 | **HIGH** | `node_modules/next/server.d.ts:16` exports it |
| Cloudinary signed-URL delivery | **HIGH** | `cloudinary@^2.10.0` already a dependency; `src/lib/og-image.ts` documents existing `raw/authenticated` assets on this account |
| Resend Contacts/Audiences API shape | **MEDIUM** | Context7-sourced official docs; verify `audienceId` casing against the installed SDK version at implementation time |
| Lexical relationship population at `depth: 1` | **MEDIUM** | Not verified against 3.85.2 in this repo — design routes around it via `getCachedAffiliateLinks`, and verify in Phase D |
| Amazon Associates cloaking interpretation | **MEDIUM** | Vendor/community reading of contract language, not a first-party statement — re-read the live agreement before publishing the first Amazon link |
| `rel="sponsored"` requirement | **MEDIUM** | Google Search Central link-tagging guidance, retrieved via web search rather than a direct first-party fetch |

---

## Sources

- Direct reads of this repository (HIGHEST confidence): `src/middleware.ts`, `src/payload.config.ts`, `src/lib/{cache,cache-tags,sitemap-data,canonical,breadcrumbs,service-slugs,og-image}.ts`, `src/collections/{Pages,Posts,Websites,Media,Testimonials,Clientes}/index.ts`, `src/fields/{slug,link,targetKeyword}.ts`, `src/blocks/{blockRegistry,RenderBlocks,ServicesShowcase,ContactFormBlock,Content}`, `src/components/{CMSLink,RichTextRenderer,richTextBlockConverters}.tsx`, `src/app/actions/contact.ts`, `src/app/api/redirects-lookup/route.ts`, `src/app/robots.ts`, `src/app/(frontend)/[locale]/{layout,seo-tecnico-lima,servicios,services}`, `src/migrations/*`, `package.json`, `next.config.mjs`, `.planning/PROJECT.md`
- `node_modules/next/server.d.ts:16` — `after` export on Next 15.4.11 — HIGH
- [Google Search Central: A reminder on qualifying links and our link spam update](https://developers.google.com/search/blog/2021/07/link-tagging-and-link-spam-update) — `rel="sponsored"` for affiliate links — MEDIUM
- [Amazon Associates Program Participation Requirements](https://affiliate-program.amazon.com/help/operating/participation/) and [Geniuslink: Link Cloaking & Amazon Compliance](https://geniuslink.com/blog/link-cloaking-amazon/) / [Lasso: Can I Cloak Amazon Links?](https://support.getlasso.co/en/articles/3776391-can-i-cloak-amazon-links) — Redirecting Links clause and its practical reading — MEDIUM
- [Resend docs: Create Contact / Update Contact / Audiences](https://resend.com/docs/api-reference/contacts/create-contact) via Context7 — MEDIUM
- [Payload docs: Custom Features (BlocksFeature/inlineBlocks) and Converting JSX](https://payloadcms.com/docs/rich-text/custom-features) via Context7 — MEDIUM
- [Cloudinary: Media Access Control and Authentication](https://cloudinary.com/documentation/control_access_to_media) — `private_download_url`, `expires_at`, authenticated raw assets — MEDIUM
- [Next.js 15.1 release notes](https://nextjs.org/blog/next-15-1) — `after()` stabilization and self-hosted support — MEDIUM

---
*Architecture research for: monetization layer on an existing Payload 3 + Next.js 15 bilingual site (v2.1)*
*Researched: 2026-08-13*
