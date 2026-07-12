# Pitfalls Research

**Domain:** UI/UX polish pass + new visual components (Breadcrumbs, ServicesShowcase, redesigned service-page layouts) on an existing, shipped, SEO-critical, bilingual (EN/ES) Payload 3.85 + Next.js 15 production portfolio
**Researched:** 2026-07-12
**Confidence:** HIGH (grounded in this repo's actual source — canonical/hreflang, JSON-LD, dual-slug routing, breadcrumb field, Payload schema — not generic advice)

> **Read this first.** Two facts from the current codebase drive most of the pitfalls below:
> 1. **The site emits NO `rel=canonical` and NO `hreflang` link tags anywhere in `<head>`.** `generateMetadata` across every page (home, services, blog, authors…) sets only `title` + `description`. `alternates`/`canonical` appear ONLY in `sitemap.xml`/`sitemap.html`, never in page metadata. There is no `metadataBase` in the layout. (Verified: `grep alternates|canonical src/app` → only sitemap files.)
> 2. **The dual URL segments `/servicios` and `/services` both physically exist as route folders under `[locale]`, and both call the same `getServicePage(locale, slug)` with no segment/locale guard.** So all four combinations resolve to identical content (the milestone log even says "10 combinaciones de URL curl-verificadas"). Nothing today tells Google which is canonical.
>
> A visual polish pass is the moment these latent SEO gaps become *visible regressions* — because you'll be re-touching exactly these templates. Treat "add the canonical/hreflang that never existed" as in-scope hardening, not scope creep.

## Critical Pitfalls

### Pitfall 1: Dual-slug `/servicios` ↔ `/services` duplicate content with no canonical

**What goes wrong:**
The redesigned service pages get indexed four ways per service (`/servicios/x`, `/services/x`, `/en/servicios/x`, `/en/services/x`) because `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx` and `.../services/[slug]/page.tsx` are byte-identical, both resolve any locale, and neither sets a canonical. Google sees Spanish content on an English URL segment (and vice-versa) as duplicate/thin, splitting ranking signals across up to 4 URLs per service. A visual redesign that makes these pages "more competitive" is wasted if the ranking equity is fragmented.

**Why it happens:**
The dual segment was a deliberate v1.4 feature (Spanish readers get `/servicios`, English get `/services`), but it was shipped without the canonical/hreflang layer that makes dual segments safe. The polish pass will make the pages prettier without anyone re-examining the routing/SEO contract.

**How to avoid:**
Before/while redesigning service layouts, add to each service page's `generateMetadata`: an `alternates.canonical` pointing at the *locale-correct* segment (`es` → `/servicios/x`, `en` → `/en/services/x`) and `alternates.languages` with reciprocal `es`/`x-default`/`en` hreflang. Reuse the exact URL-building logic already in `src/lib/sitemap-data.ts` (lines ~89-133 already compute `esUrl`/`enUrl` for exactly these pages) — extract it into a shared helper so page metadata and sitemap can't drift. Optionally 404/redirect the "wrong" locale+segment combos (e.g. `es` locale hitting `/services/...`) instead of rendering them.

**Warning signs:**
`curl -s https://site/servicios/seo-consulting | grep -i canonical` returns nothing; Search Console "Duplicate, Google chose different canonical"; the same service ranking on two URLs.

**Phase to address:**
The Services-page redesign phase (first, per milestone priority). Make "canonical + hreflang present and locale-correct on every service URL" an explicit success criterion of that phase.

---

### Pitfall 2: New Breadcrumb component ships visual UI but no `BreadcrumbList` JSON-LD (or ships conflicting/duplicate schema)

**What goes wrong:**
Two opposite failures. (a) You build a pretty visual breadcrumb `<nav>` and forget the `schema.org/BreadcrumbList` JSON-LD — so you get the UI benefit but zero SEO/SERP-breadcrumb benefit, which is the whole point on an SEO-demonstration site. (b) You add BreadcrumbList JSON-LD that *contradicts* the page: URLs in the schema use the wrong locale segment (English URLs on the Spanish page), item names don't match the visible trail, or the schema `item` URLs don't match the page's canonical — all of which Google flags as structured-data mismatch and can suppress the rich result.

**Why it happens:**
The repo already has a *visual* breadcrumb as an editorial Hero field (`src/blocks/Hero/config.ts` `breadcrumbs`, rendered in `Hero/Component.tsx` only on the Listing variant) — it's hand-typed content with no schema and no guaranteed URL correctness. It's tempting to reuse that field for the new Services breadcrumbs and stop there. Meanwhile blog/case-study/author pages already emit `Article`/`Person` JSON-LD via `src/components/JsonLd.tsx`, so a second uncoordinated JSON-LD block is easy to bolt on wrong.

**How to avoid:**
Render BreadcrumbList JSON-LD from the *same* source of truth as the visible breadcrumb (don't hand-type it twice — parity is the failure mode). Reuse the existing `<JsonLd data={...} />` component. Ensure each `ListItem.item` URL uses the locale-correct absolute URL from the shared URL helper (same one as Pitfall 1). Match `name` to the visible crumb text per locale. Verify with Google's Rich Results Test on both `es` and `en`. Only add BreadcrumbList where a real hierarchy exists (Services index → service landing); don't fake breadcrumbs on top-level pages.

**Warning signs:**
Rich Results Test shows "Breadcrumbs — 0 detected" (missing) or "Invalid item / mismatched URL"; visible crumb says "Servicios" but JSON-LD says "Services"; breadcrumb `item` URL ≠ page canonical.

**Phase to address:**
Breadcrumbs phase (Services pages). Gate: "BreadcrumbList validates in Rich Results Test on both locales AND item URLs equal the page canonical."

---

### Pitfall 3: ServicesShowcase Payload block change is not purely additive → repeats the Home-CTA data-loss incident

**What goes wrong:**
Adding the Home "ServicesShowcase" component requires a new block (or new fields) on the `pages` collection's blocks layout. If the migration localizes an existing field, renames, or drops a column without backfilling, it wipes live bilingual content — exactly the Phase-19 incident where `CallToAction.richText` was localized and `DROP COLUMN`'d the Home CTA copy in production (recovered via Neon PITR). There is only ONE database and it is production (`DATABASE_URI` → real Neon).

**Why it happens:**
Payload/Drizzle auto-generates migrations; adding `localized: true` to an existing field, or restructuring blocks, silently emits a destructive `DROP COLUMN`/reshape that does NOT copy old values into the new locale rows. Under time pressure during a "just make it look good" pass, the generated SQL isn't read.

**How to avoid:**
Design ServicesShowcase as a **brand-new block appended to the existing `blocks` field** (new tables only = additive `CREATE TABLE`) — never as a reshape of an existing block. Follow the repo's own DB-safety rule (root `CLAUDE.md`): run `payload migrate:create`, **read the generated SQL yourself first**. Purely additive (`CREATE TABLE`/`ADD COLUMN`/new index) → just run it. Anything touching an existing column with data (localizing, narrowing, drop/rename) → must backfill both `es`/`en` locale rows before dropping, AND requires Juan's explicit named approval before applying. If the showcase just reads the 4 existing service `pages` docs (it can — `SERVICE_SLUGS` already exists in `src/lib/services-data.ts`), you may need **no schema change at all** — prefer that.

**Warning signs:**
Generated migration contains `DROP COLUMN`, `ALTER ... TYPE`, or a rename on an existing `pages`/block table; a field gained `localized: true`; migration has no backfill `UPDATE` before a drop.

**Phase to address:**
ServicesShowcase (Home) phase. Gate: "migration SQL reviewed, additive-only, or Juan-approved with backfill." Prefer a read-only showcase that needs no migration.

---

### Pitfall 4: Core Web Vitals / Lighthouse regression from the visual polish

**What goes wrong:**
The polish adds heavier hero imagery, a Services showcase grid with 4 card images, animations/transitions, web fonts, or client components — pushing LCP up, introducing CLS from unsized media/late-loading cards, or adding JS to previously-static pages. Core Value is explicit: "si el rendimiento o el SEO fallan, el sitio no cumple su propósito." The site already spent a -3 Performance budget on the WebGL Hero (v1.3); there's little headroom left.

**Why it happens:**
Design-driven passes optimize for how it looks in a screenshot, not measured field/lab metrics. New images without explicit `width`/`height`/`sizes`, `next/image` misuse, unbounded card grids, and "just one more animation" each shave points that compound.

**How to avoid:**
Baseline Lighthouse (mobile, production build) for Home + Services **before** the pass and treat it as a regression gate — same discipline v1.3 used. Every new image via `next/image` with explicit dimensions and Cloudinary sizing; reserve space to keep CLS ~0; keep new interactivity in small client islands, not whole-page client components; lazy-load below-the-fold showcase media. Re-run Lighthouse per phase, not just at the end.

**Warning signs:**
LCP element becomes a showcase/hero image; CLS climbs above ~0.1; Performance drops more than the agreed threshold vs baseline; new `'use client'` at a page/layout root.

**Phase to address:**
Every UI phase. Bake "Lighthouse mobile ≥ baseline (within agreed Δ) on prod build" into each phase's success criteria, Home + Services first.

---

### Pitfall 5: EN/ES parity gaps in new components (visible in one locale, broken/empty in the other)

**What goes wrong:**
New UI (breadcrumb labels, ServicesShowcase headings/CTAs, redesigned section copy) renders correctly in `es` but shows empty strings, English fallback, or missing translations in `en` (or vice-versa). This repo has a documented history of exactly this class of bug: v1.2 found empty ES labels in Footer/Header and an EN eyebrow/title gap in `AboutSection`; v1.4 found a non-localized shared `Header.navItems` id-collision and the non-localized `CallToAction.richText`. There are TWO localization layers — next-intl (UI strings/routing) and Payload `localized` fields (content) — and new components must cover both.

**Why it happens:**
It's easy to hardcode a label in one language, or add editorial content in the admin for only one locale, or forget `localized: true` on a new content field. Shared non-localized arrays (like the old navItems) leak one locale's values into both.

**How to avoid:**
For every new UI string, add both `es` and `en` next-intl messages. For every new Payload content field feeding the showcase/breadcrumbs, decide localization deliberately (`localized: true` when copy differs) and populate BOTH locales in admin before calling the phase done. Manually load `/` and `/en` (and `/servicios/x` + `/en/services/x`) and eyeball every new component in both. Breadcrumb crumb text must be localized AND match the visible URL segment language.

**Warning signs:**
A new component shows blank text or the wrong language under `/en`; a new field has content in only one locale; a label is a hardcoded literal instead of a next-intl key.

**Phase to address:**
Every UI phase. Gate: "component verified live in BOTH `/` and `/en`; all new strings localized in next-intl; all new content fields populated in es+en."

---

### Pitfall 6: Redesign silently drops existing SEO-load-bearing markup

**What goes wrong:**
While restyling service/home templates you replace or restructure JSX and accidentally remove or demote SEO-critical elements the prior milestones deliberately added: the single semantic `<h1>` (v1.4 fixed missing H1 on `/contact` and Author page — regressing that undoes shipped work), the `Person`/`Article` JSON-LD (`page.tsx` emits it as a sibling of `RenderBlocks` — easy to lose when refactoring the page shell), heading hierarchy (h1→h2→h3), or the `nav aria-label="Breadcrumb"` semantics.

**Why it happens:**
Visual refactors rewrite markup structure; the SEO significance of a given tag isn't visible in the design and isn't obvious in the JSX. Turning an `<h1>` into a styled `<div>` for design reasons is a classic regression.

**How to avoid:**
Before restyling a template, note its SEO-load-bearing elements (H1, JSON-LD blocks, meta, breadcrumb nav, canonical once added). Keep exactly one `<h1>` per page. Keep the `<JsonLd>` emission when refactoring page shells. After each redesign, diff rendered `<head>` + heading outline against the pre-pass version. The v1.4 audit history (H1 fixes) means these are known-fragile spots here.

**Warning signs:**
More than one or zero `<h1>` on a page; JSON-LD block disappears from a refactored page; a heading downgraded to a styled div; breadcrumb `<nav>` loses `aria-label`.

**Phase to address:**
Every template-redesign phase. Gate: "post-redesign, exactly one H1, JSON-LD still present, heading outline intact vs baseline."

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Ship redesigned service pages without adding canonical/hreflang (leave the existing gap) | Faster; "SEO wasn't in the ticket" | Duplicate content across 4 URLs/service actively fragments rankings on the pages whose whole purpose is to rank | **Never** for the Services phase — the redesign is the natural moment to fix it; deferring makes prettier duplicate content |
| Hand-type breadcrumb JSON-LD separately from the visible breadcrumb | Quick to bolt on | Visible trail and schema drift (name/URL mismatch) → invalid rich result, silent SERP loss | Never — derive both from one source |
| Reuse the Hero editorial `breadcrumbs` field for Services (hand-typed per doc) | No new code | No schema, URL-correctness not guaranteed, parity burden per doc | Only for the visual layer, and only if paired with programmatic BreadcrumbList from the same data |
| `push: true` / apply auto-generated migration without reading SQL | Instant schema sync | Production data loss (the documented CTA incident) | Never against this prod-only Neon DB |
| Whole page/layout becomes `'use client'` for one interaction | Easy state/animation | Kills RSC benefits, tanks CWV on an SEO-critical page | Never at page/layout root; use small client islands |
| Add showcase card images without explicit dimensions/`next/image` | Looks fine locally | CLS + LCP regression in the field | Never on Home/Services |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Next.js Metadata API (`generateMetadata`) | Assuming `title`/`description` is "enough"; no `alternates`/`canonical`/`metadataBase` (current state) | Add `metadataBase` once (layout) + `alternates.canonical` + `alternates.languages` per page; build URLs from the shared sitemap helper |
| next-intl routing + dual `/servicios`\|`/services` segments | Trusting that only the "right" locale hits each segment; it doesn't — all 4 combos render | Set locale-correct canonical, or guard/redirect wrong locale+segment combos |
| Payload localization | Adding a content field without `localized:true`, or a shared non-localized array (the navItems id-collision precedent) | Decide localization per field; give localized arrays per-locale rows; populate both locales |
| Payload `plugin-seo` | Expecting it to output canonical/hreflang into `<head>` (it only fills admin `meta.title`/`meta.description`; no `generateURL` configured here) | Emit canonical/hreflang yourself in `generateMetadata`; plugin-seo only feeds title/description |
| `@payloadcms/plugin-seo` + `next/image`/Cloudinary OG | Redesign changes OG image field/aspect without updating meta OG tags | Verify OG/Twitter meta after redesign; keep OG image dimensions valid |
| Payload migrations (Drizzle) on Neon | Applying generated migration unread; localizing an existing column drops it without backfill | Read SQL; additive → run; destructive/reshape → backfill both locales + Juan's named approval |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| ServicesShowcase grid loads 4+ full-res card images eagerly | LCP/late paint, mobile Lighthouse drop | `next/image` + Cloudinary transforms + lazy-load below fold | As soon as showcase is above/near fold on Home |
| Unsized new media/cards | CLS jumps, layout shift on load | Explicit width/height, reserved space | First real image with unknown intrinsic size |
| Animations/transitions stacked on the WebGL Hero page | Main-thread jank, INP regression | Respect `prefers-reduced-motion`, keep animations cheap/GPU, budget already thin from v1.3 | Any added motion on Home |
| Client-component creep for interactive showcase/tabs | Hydration cost, TBT/INP up | Small client islands only; keep pages RSC | When a whole section/page turns client |
| Web font additions for the "pro" redesign | Render-blocking, CLS from swap | Reuse the 4 already-loaded font families (array/khand/geist); avoid new fonts | Any new `@font-face` |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Building JSON-LD via string concatenation of CMS fields | `</script>` breakout / injection in structured data | Keep using the existing `JsonLd` component — it `JSON.stringify`s (documented mitigation T-02-02) |
| Dropping the `isServiceSlug` allowlist when refactoring service routes | Arbitrary attacker slug hits `pages` collection (T-19-01) | Preserve the allowlist guard in `getServicePage` before any DB query |
| `dangerouslySetInnerHTML` for new rich-text/showcase copy | XSS from CMS content | Render Lexical via the existing converters, not raw HTML injection |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Breadcrumb visible trail doesn't match the URL a user is on (segment/locale) | Confusion, distrust on the page meant to prove expertise | Derive crumbs from the actual locale-correct route |
| Redesigned service pages diverge in structure between EN and ES | Bilingual visitors get inconsistent experience | Same component/layout both locales; only copy differs |
| Showcase links to service pages using the wrong locale segment (`es` user sent to `/services`) | Extra redirect/404, broken flow | Link builder resolves segment by current locale |
| "Pro" redesign reduces text contrast below WCAG (v1.1 explicitly checked this) | Accessibility regression, readability loss | Re-run contrast checks after restyle |
| Removing breadcrumbs' keyboard/`aria` semantics for a custom visual | Screen-reader/keyboard users lose navigation | Keep `nav aria-label="Breadcrumb"` + ordered list semantics |

## "Looks Done But Isn't" Checklist

- [ ] **Service page redesign:** looks polished — verify `rel=canonical` present, locale-correct, and points to the right segment (`es`→`/servicios/x`, `en`→`/en/services/x`)
- [ ] **Service page redesign:** verify `hreflang` alternates (es/en/x-default) reciprocal in `<head>`, not just in sitemap
- [ ] **Breadcrumbs:** visual `<nav>` renders — verify `BreadcrumbList` JSON-LD validates in Rich Results Test on BOTH locales and item URLs equal the page canonical
- [ ] **BreadcrumbList:** verify it doesn't duplicate/conflict with existing `Person`/`Article` JSON-LD on the same page
- [ ] **ServicesShowcase:** renders on Home — verify migration (if any) is additive-only / SQL read / no destructive drop; prefer read-only (no schema change)
- [ ] **Every new component:** verify live in BOTH `/` and `/en` — no empty strings, no wrong-language fallback
- [ ] **Every new string:** in next-intl catalogs for es AND en; every new content field populated in both locales
- [ ] **Every redesigned template:** exactly one `<h1>`; existing JSON-LD still emitted; heading outline intact
- [ ] **Performance:** Lighthouse mobile (prod build) re-run and ≥ baseline within agreed Δ for the touched page
- [ ] **Images:** new media via `next/image` with explicit dimensions; CLS unchanged
- [ ] **Security guards intact:** `isServiceSlug` allowlist and `JsonLd` stringify path preserved through refactors

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Destructive migration wiped bilingual content | HIGH | Neon point-in-time restore (as done in the Phase-19 CTA incident), then re-author migration with backfill before drop |
| Duplicate content indexed across dual slugs | MEDIUM | Add canonical/hreflang, resubmit sitemap, request re-crawl; consolidation takes weeks in Search Console |
| Invalid/mismatched BreadcrumbList schema | LOW | Fix item URLs/names to match page, re-validate Rich Results Test, wait for re-crawl |
| CWV regression shipped | MEDIUM | Re-baseline, bisect the offending component (image/animation/client boundary), optimize or revert that piece |
| EN/ES parity gap shipped | LOW | Add missing next-intl keys / populate missing-locale content field; verify both routes |
| Lost H1/JSON-LD in redesign | LOW | Restore the semantic element from git diff vs pre-pass baseline |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dual-slug duplicate content / missing canonical+hreflang | Services-page redesign phase (early) | `curl` each of the 4 service URLs → canonical + hreflang present, locale-correct; extract shared URL helper from `sitemap-data.ts` |
| Breadcrumb JSON-LD missing/conflicting | Breadcrumbs phase | Rich Results Test valid on es+en; item URLs == canonical; no schema conflict with Person/Article |
| Non-additive ServicesShowcase migration (data loss) | ServicesShowcase (Home) phase | Migration SQL read; additive-only OR Juan-approved with backfill; prefer no-schema read-only showcase |
| CWV/Lighthouse regression | Every UI phase (Home + Services first) | Prod-build Lighthouse mobile ≥ baseline within agreed Δ |
| EN/ES parity gaps | Every UI phase | Live check `/` and `/en`; all new strings/fields localized both locales |
| Dropped SEO markup (H1/JSON-LD) in redesign | Every template-redesign phase | Post-redesign: one H1, JSON-LD present, heading outline diff vs baseline |

## Sources

- This repository's actual source (HIGH, read directly 2026-07-12): `src/app/(frontend)/[locale]/**/page.tsx` (`generateMetadata` sets only title/description; no canonical/hreflang/metadataBase); `src/lib/services-data.ts` (dual-slug shared loader, `isServiceSlug` allowlist, `SERVICE_SLUGS`); `src/lib/sitemap-data.ts` (alternates/hreflang computed only for the sitemap, incl. the `/servicios`↔`/services` branch); `src/components/JsonLd.tsx` (stringify mitigation T-02-02); `src/blocks/Hero/{config,Component}.tsx` (editorial breadcrumb field, visual only, no schema); `src/payload.config.ts` (plugin-seo config — title/description only, no `generateURL`)
- `.planning/PROJECT.md` and root `CLAUDE.md` (HIGH): Phase-19 CTA localization data-loss incident + Neon PITR recovery; DB-safety rule (destructive migrations need Juan's named approval); v1.4 H1 fixes; v1.2 empty-ES-label and AboutSection EN gap bugs; v1.4 non-localized `navItems`/`CallToAction.richText` bugs; Core Value ("si el rendimiento o el SEO fallan, el sitio no cumple su propósito"); prod-only single Neon DB
- Google structured-data / hreflang guidance (MEDIUM, training-data baseline): BreadcrumbList item URL/name must match page; reciprocal hreflang + canonical needed for locale/segment duplicates — verify current specifics against Google's live docs during the Services phase

---
*Pitfalls research for: UI/UX polish pass + new components on an existing bilingual SEO-critical Payload + Next.js production site*
*Researched: 2026-07-12*
