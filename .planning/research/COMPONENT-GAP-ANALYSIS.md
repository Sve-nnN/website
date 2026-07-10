# Component Gap Analysis — Old Site (JuanPortfolio, 39 blocks + 5 heros) vs Current Site (juan-payload, 16 blocks)

**Researched:** 2026-07-10
**Method:** Read every old-block `config.ts` (fields define real purpose, not just the name) plus `RenderHero.tsx`/hero component bodies, cross-checked against current `src/blocks/*/config.ts` and `RenderBlocks.tsx`, and against `.planning/PROJECT.md` Key Decisions / Out of Scope.
**Bias applied per quality gate:** conservative — default to Redundant or Intentionally-Excluded; only marked Genuine Gap where the old block serves a real, distinct content need with no current equivalent.

## Summary verdict

- **Genuine gaps (new blocks worth adding): 3** — `AboutSection` (consolidated), `CalendlyEmbed`, `TestimonialSection` (single-quote spotlight).
- **Field-level gaps (NOT new blocks — enrich the existing `Hero` block instead): 2** — CTA/links array on Hero, case-study/post metadata fields on Hero (client/sector/period/services, category/author/date/read-time). Called out separately below so they don't get miscounted as missing blocks.
- **Redundant / already covered: 27** — same content purpose as an existing current-site block, differing only in name or minor field shape.
- **Intentionally excluded (confirms Key Decisions in PROJECT.md): 6** — `FeaturedWorks`, `WorkCards` (Works retirement), `Form` (form-builder explicitly out of scope), `PostSidebar`, `SidebarBanners` (both hard-wired to the `ad-banners`/AdBanners collection, which is explicit SEO-tooling clutter), plus `AdBanners`/`Works` collections themselves reinforcing the exclusion.
- **Old hero variants (5): all redundant** — fully covered by the current `Hero` block's 4-variant system (`home`/`listing`/`post-header`/`case-study-header`), modulo the same 2 field-level gaps above.

---

## Blocks (39)

| Old Block | Category | Rationale |
|---|---|---|
| `AboutSection` | **Genuine Gap** | Narrative bio block (eyebrow + title + array of paragraphs, likely + photo). No current equivalent — `Content` is generic richtext with no bio-specific layout, and `Hero` is not meant to carry long-form "about me" narrative. A named-consultant portfolio needs a dedicated bio section for credibility/E-E-A-T (matches SEO expert positioning in Core Value). See integration notes below. |
| `AboutWithFeatures` | Redundant | Near-duplicate of `AboutSection` (same eyebrow/title/image/description shape, plus a features list). Old site itself had two competing bio blocks — don't replicate that duplication; fold any "features list" need into the single consolidated `AboutSection` block recommended above as an optional array field, not a second block. |
| `ArchiveBlock` | Redundant / Already Covered | Current site already has `ArchiveBlock` (`relationTo`: posts/case-studies, `mode`: latest/manual) — same purpose, same name. |
| `Banner` | Redundant | Generic styled inline alert/notice (info/warning/error/success + richtext). Not a distinct content need for this site — an announcement/availability strip is achievable with the existing generic `Section` + `CallToAction` combo. Conservative call per quality gate; skip. |
| `BlogArchiveHeader` | Redundant / Already Covered | Title + description + category-filter toggle + hero image for the blog listing page — fully covered by current `Hero` (`variant: 'listing'`) placed above the current `ArchiveBlock` (which already supports category filtering per its config comment). |
| `CalendlyEmbed` | **Genuine Gap** | Booking widget (Calendly URL + title/subtitle + height select). Real, distinct content need: a technical-consultant portfolio's primary conversion path is often "book a call," not just a contact form. Old site shipped it, current site has no equivalent CTA mechanism beyond the static `ContactFormBlock`. Confidence: MEDIUM — depends on Juan still using Calendly as his scheduling tool (old site had it; no evidence he dropped it). |
| `CallToAction` | Redundant / Already Covered | Current site already has `CallToAction`. |
| `CaseStudiesGrid` | Redundant | Grid listing of case studies with column/category-filter options — same purpose as current `ArchiveBlock` with `relationTo: 'case-studies'`. |
| `CaseStudyHeader` | Redundant / Already Covered (see field-level gap below) | Eyebrow + title + description + featured image for a case study's header — shape-wise this is exactly current `Hero` (`variant: 'case-study-header'`). The block itself is not a gap; see the **case-study metadata field-level gap** below for what's actually missing. |
| `Code` | Redundant / Already Covered | Current site already has `Code`. |
| `ContactFormBlock` | Redundant / Already Covered | Current site already has `ContactFormBlock` (and it's wired to Resend, which is the actual improvement over the old site — not a gap). |
| `Content` | Redundant / Already Covered | Current site already has `Content`. |
| `FAQ` | Redundant / Already Covered | Current site already has `FAQ`. |
| `FeaturedBlog` | Redundant | Curated/latest posts section with title+description+CTA — same purpose as current `FeaturedPostsBlock`, naming difference only. |
| `FeaturedBlogPosts` | Redundant | Same purpose again (old site had 3 near-duplicate "featured posts" blocks: `FeaturedBlog`, `FeaturedBlogPosts`, `LatestBlogPosts`) — current `FeaturedPostsBlock` (backed by the `FeaturedContent` global as single curation surface) is a cleaner consolidation of all three. |
| `FeaturedCaseStudies` | Redundant | Same purpose as current `FeaturedCaseStudiesBlock`, naming difference only. |
| `FeaturedClients` | Redundant | Curated client-logo carousel — same purpose as current `ClientLogosBlock` (relationTo `clientes`), naming difference only. |
| `FeaturedWorks` | **Intentionally Excluded** | Directly tied to the `works` collection/relationTo `case-studies`-as-"works" concept. PROJECT.md Key Decisions: "Works vs Clientes: se elimina Works... CaseStudies se enriquece" — this block is exactly the pattern that decision retired. Confirmed by old-site `Works` collection existing standalone (`src/collections/Works`). |
| `Form` | **Intentionally Excluded** | Generic Payload form-builder block (`relationTo: 'forms'`, rich intro content). PROJECT.md Out of Scope explicitly names `plugin-form-builder` as excluded: "se resuelve contacto con lógica simple + Resend, no formbuilder genérico." |
| `HeroHome` | Redundant / Already Covered (see field-level gap below) | Badge + title + subtitle + description for the homepage hero — shape-wise this is current `Hero` (`variant: 'home'`). The block itself is not a gap; see **Hero CTA/links field-level gap** below for what's thinner in the current version. |
| `Intro` | Redundant | Bare heading + body textarea — generic and strictly less capable than current `Content` (richtext) or `Hero` subtitle. No distinct need. |
| `LatestBlogPosts` | Redundant | Title + count, auto-latest posts — subset of current `ArchiveBlock` (`mode: 'latest'`, `relationTo: 'posts'`) or `FeaturedPostsBlock`. |
| `LatestCaseStudies` | Redundant | Same as above for case studies — subset of current `ArchiveBlock`/`FeaturedCaseStudiesBlock`. |
| `ListingHero` | Redundant / Already Covered (see field-level gap below) | Title + description + custom breadcrumbs array for listing pages — shape-wise this is current `Hero` (`variant: 'listing'`). The block itself is not a gap; the breadcrumbs array is a field-level gap (see below), not worth a whole new block. |
| `MediaBlock` | Redundant / Already Covered | Current site already has `MediaBlock`. |
| `PostArticleHeader` | Redundant / Already Covered | Category + title + author + publishedDate + readTime for a post's header — covered by current `Hero` (`variant: 'post-header'`) plus the byline component already tracked as an existing piece under the v1.1 milestone's audit scope ("byline" listed alongside header/footer). Not a missing block. |
| `PostHero` (block, `src/blocks/PostHero`) | Redundant | Admin toggles (showHero/showImage/showMeta/showCategories/heroStyle) wrapping the same post-header content as `PostArticleHeader` — a config-toggle convenience, not new content. Superseded by `Hero` + byline. |
| `PostsGrid` | Redundant | Paginated posts grid with category filter and column count — same purpose as current `ArchiveBlock` (`relationTo: 'posts'`). |
| `PostSidebar` | **Intentionally Excluded** | Its only field is `banners: relationTo 'ad-banners'` (plus position/sticky). Hard-wired to the `AdBanners` collection, which PROJECT.md Out of Scope names explicitly ("AdBanners, BrokenLinks, GSCMetrics..." = "el 'clutter' que se descarta explícitamente"). Confirmed: old-site `AdBanners` collection is `admin.group: MARKETING`, an internal tooling artifact, not a content need. |
| `RelatedPosts` (block dir, no `config.ts` — Component-only, not a registrable Payload block) | Redundant | Not even a real Payload block on the old site (no field schema) — a display component embedded directly in the post template. Current site's `RelatedPosts` block (a real, registered block in `RenderBlocks.tsx`) is a strict upgrade (editable from admin) over this. |
| `RelatedPostsBlock` | Redundant / Already Covered | Title + manual posts + autoSelect-by-category + limit — same purpose as current `relatedPosts` block, naming difference only (`RelatedPostsBlock` old vs `RelatedPosts`/`relatedPosts` current). |
| `ResultsSection` | Redundant / Already Covered | Current site already has `ResultsSection`. |
| `Section` | Redundant / Already Covered | Current site already has `Section`. |
| `SidebarBanners` | **Intentionally Excluded** | Identical pattern to `PostSidebar` — sole field is `banners: relationTo 'ad-banners'`. Same AdBanners-tooling exclusion applies. |
| `SimpleCTA` | Redundant | Text + button label + url + background-color select — a simpler subset of current `CallToAction`, no distinct content need. |
| `TableOfContentsBlock` | Redundant / Already Covered | Current site already has `TableOfContentsBlock`. |
| `TestimonialsCarousel` | Redundant / Already Covered | Current site already has `TestimonialsCarousel` (multi-testimonial rotating display, typically home/about placement). |
| `TestimonialSection` | **Genuine Gap** | Single-quote spotlight: one big pull-quote + `authorName` + `authorRole` (e.g. "CEO, Moda-Vanguardia"), no carousel. Distinct purpose from `TestimonialsCarousel`: this is meant to be embedded *inside a specific case study* to attribute one client quote to that project — the carousel is a generic, page-level rotating showcase (home/about), not something you'd drop mid-narrative in a case study. The case-study content model referenced in PROJECT.md Context (ariannalupi.com pattern: hero metric → client → challenge → solution → results → conclusion → CTA) has no "the client said" moment currently — this fills it. |
| `WorkCards` | **Intentionally Excluded** | Title + count + showReadMore, driven by the `works`/`case-studies`-as-"work" grid pattern. Same retirement as `FeaturedWorks` — PROJECT.md Key Decision explicitly eliminates "Works" as a concept. |

## Old Hero Variants (5, in `src/heros/`)

| Old Hero | Category | Rationale |
|---|---|---|
| `HighImpact` | Redundant / Already Covered (see field-level gap below) | Large hero with background media + title — covered by current `Hero` (`variant: 'home'`). Thinner: no CTA/links field (see below). |
| `MediumImpact` | Redundant / Already Covered | Mid-size hero treatment — covered by current `Hero`'s smaller-heading variants (`listing`/`post-header`/`case-study-header`). No distinct content need beyond what a size/weight CSS variant already gives. |
| `LowImpact` | Redundant / Already Covered | Minimal text-only hero — same as above, covered by current `Hero`'s non-home variants. |
| `ArchiveHero` | Redundant / Already Covered | Title + description + breadcrumbs + category filters for listing pages — covered by current `Hero` (`variant: 'listing'`) + `ArchiveBlock`'s own category filtering. Breadcrumbs is the same field-level gap called out under `ListingHero` above. |
| `PostHero` (heros dir) | Redundant / Already Covered | Full post-header treatment (category, title, author, date, image) — same content as `PostArticleHeader`/blocks-`PostHero` above, covered by current `Hero` (`variant: 'post-header'`) + byline. |

---

## Field-Level Gaps (NOT new blocks — flag for roadmap as Hero enhancements)

The current `Hero` block (`src/blocks/Hero/config.ts`) is intentionally a consolidation of 4 old variants (`HeroHome`, `ListingHero`, `PostArticleHeader`/`PostHero`, `CaseStudyHeader`) behind one `variant` select — that consolidation itself is good architecture (matches the `Section`/`ArchiveBlock` "extend, don't fork" precedent already documented in this repo's block comments). But comparing its actual fields (`variant`, `title`, `subtitle`, `media`) against what the old variants carried shows it's thinner than all 4 originals combined:

1. **No CTA/links field.** `HeroHome` and `HighImpact` both carried button/link data; current `Hero` has none. A homepage hero with no call-to-action button is a real UX gap for a consultant site whose whole point is conversion (book a call / view case studies). **Fix:** add an optional `links` array (label + url + style) to the existing `Hero` block config — do not create a new hero block.
2. **No breadcrumbs field.** `ListingHero` and `ArchiveHero` both carried a breadcrumbs array. Currently unaddressed on listing pages. **Fix:** add optional `breadcrumbs` array to `Hero`, conditioned on `variant !== 'home'`.
3. **No case-study metadata fields.** `CaseStudyHeader` only had eyebrow/title/description/image, so the block itself isn't the gap — but PROJECT.md Context explicitly documents the competitive case-study model to replicate (`ariannalupi.com/casos/...`): "hero con métrica principal... metadatos (cliente/sector/período/servicios)." None of the old blocks even had this, and current `Hero` doesn't either. **Fix:** this is a genuine content-model gap, but it belongs on the `CaseStudies` collection (or a case-study-specific header block) rather than the generic `Hero` — likely warrants its own small `caseStudyMeta` field group. Flagging here since it surfaced during this audit, but treat as a collection-schema task, not a "port an old block" task.
4. **No author/date/read-time on post variant.** `PostArticleHeader`/`PostHero` carried these; if the current site's separate "byline" component (already in the v1.1 audit scope per PROJECT.md target features) doesn't already render this, it's a gap — confirm during the visual audit rather than adding a block.

---

## Confirmation of Intentionally-Excluded List (reinforces PROJECT.md)

Reading the old collections directly confirms the exclusions already decided:

- **`src/collections/Works`** — standalone collection (`admin.group: MARKETING`, `useAsTitle: 'title'`) backing `WorkCards`/`FeaturedWorks`. Confirms Key Decision: Works is retired, CaseStudies is the enriched replacement. Nothing found that contradicts this — safe to keep both `WorkCards` and `FeaturedWorks` excluded.
- **`src/collections/AdBanners`** — standalone collection (`admin.group: MARKETING`) backing `PostSidebar` and `SidebarBanners`. Confirms Out of Scope: this is the internal ad/monetization tooling PROJECT.md calls "clutter," same category as `BrokenLinks`/`GSCMetrics`/etc. Both sidebar blocks are correctly excluded as a consequence — they have no content purpose independent of `ad-banners`.
- **`Form`** (generic form-builder block, `relationTo: 'forms'`) is a distinct exclusion already stated verbatim in PROJECT.md Out of Scope ("plugin-form-builder... salvo que la investigación determine que alguno es necesario") — this research did not find a reason to necesitarlo; `ContactFormBlock` + Resend remains sufficient.

No new "intentionally excluded" categories surfaced beyond what PROJECT.md already lists — the audit did not find anything that should reopen the Works/AdBanners/form-builder decisions.

---

## Integration Notes for the 3 Genuine-Gap Blocks

All three follow the exact same wiring pattern as every current block: a `config.ts` (Payload `Block` field schema) registered into `Page['content']['layout']` via the Pages collection's blocks array, a `Component.tsx` under `src/blocks/<Name>/`, and one line added to the `blockComponents` map + import in `src/blocks/RenderBlocks.tsx` (per that file's own "Single source of truth... do NOT duplicate this as a switch/if chain" comment).

### 1. `AboutSection` (consolidated bio block)
- **Fields:** `eyebrow` (text, localized), `title` (text, localized, required), `paragraphs` (array of textarea, localized), `image` (upload, relationTo `media`, optional), optional `ctaLabel`/`ctaUrl` pair.
- **Fills:** the "about me" narrative gap — no current block carries long-form bio copy with a portrait image, needed for E-E-A-T/credibility on the homepage and/or an About page.
- **Integration:** new `src/blocks/AboutSection/config.ts` + `Component.tsx`; add `AboutSectionComponent` import + `aboutSection: AboutSectionComponent` entry to `blockComponents` in `RenderBlocks.tsx`; add to Pages collection's blocks array.

### 2. `CalendlyEmbed`
- **Fields:** `calendlyUrl` (text, required), `title`/`subtitle` (localized, optional), `height` (select: compact/default/tall).
- **Fills:** booking-CTA gap — a scheduling widget as an alternative/complement to the static contact form, standard pattern for consultant portfolios.
- **Integration:** new `src/blocks/CalendlyEmbed/config.ts` + client `Component.tsx` (loads Calendly's inline-widget script client-side, `'use client'`); register in `RenderBlocks.tsx` as `calendlyEmbed`. Env-gate is not needed (no secret involved, just a public scheduling URL), but confirm CSP/script-src allows `assets.calendly.com` if a CSP header exists in `next.config`.

### 3. `TestimonialSection` (single-quote spotlight)
- **Fields:** `title` (optional, localized), `quote` (textarea, required, localized), `authorName` (text, required, localized), `authorRole` (text, required, localized), optional `authorPhoto` (upload).
- **Fills:** the "client said" moment inside a case study narrative — distinct from the page-level `TestimonialsCarousel`, meant to sit between "Solución" and "Resultados"/"Conclusión" sections in the case-study content model documented in PROJECT.md Context.
- **Integration:** new `src/blocks/TestimonialSection/config.ts` + `Component.tsx`; register as `testimonialSection` in `RenderBlocks.tsx`; add to the CaseStudies collection's blocks array (and Pages, if reused elsewhere) alongside the existing `ResultsSection`/`Section` blocks it's meant to be interleaved with.

---

## Sources

- Direct file reads: `.planning/PROJECT.md` (Key Decisions, Out of Scope, Context — case-study competitive model), all 39 `src/blocks/*/config.ts` under `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio`, `src/heros/*` + `RenderHero.tsx`, old-site `RenderBlocks.tsx`, `src/collections/Works` + `src/collections/AdBanners` (old site) — HIGH confidence (read actual field schemas, not inferred from names).
- Current-site cross-check: all 16 `src/blocks/*/config.ts` + `Hero/Component.tsx` + `RenderBlocks.tsx` under `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload` — HIGH confidence.
- Domain judgment on "consultant portfolio table stakes" (booking widget, single-testimonial spotlight in case studies) — MEDIUM confidence, general SEO/marketing-site pattern knowledge, not independently web-verified in this pass; recommend Juan confirm he's still using Calendly specifically before implementation.
