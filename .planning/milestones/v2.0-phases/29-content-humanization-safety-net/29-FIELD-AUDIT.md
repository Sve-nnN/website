# Phase 29: Field-Localization Audit

**Audited:** 2026-07-14
**Status:** Complete — pre-flight audit, no content rewritten yet
**Purpose:** Full field-by-field localization audit across every collection, global, and block, produced before any real content gets rewritten in the humanization track (Phases 30/31). Source: grep sweep already performed during phase planning, see `29-PATTERNS.md`.

---

## Full field table

| Collection/Global/Block | Field path | Type | localized? | Public-facing? | Notes |
|---|---|---|---|---|---|
| **Authors** | name | text | false | yes | proper noun, correct as-is |
| Authors | jobTitle | text | true | yes | |
| Authors | bio | textarea | true | yes | |
| Authors | credentials[].label | text | true | yes | |
| Authors | expertise[].topic | text | true | yes | |
| Authors | education[].degree | text | true | yes | |
| Authors | education[].institution | text | true | yes | |
| Authors | education[].description | text | true | yes | |
| Authors | experience[].company | text | true | yes | |
| Authors | experience[].role | text | true | yes | |
| Authors | experience[].description | text | true | yes | |
| Authors | socialLinks[].url | text | false | no | URL, correct as-is |
| Authors | yearsExperience | number | n/a | no | numeric, not text |
| **CaseStudies** | title | text | true | yes | |
| CaseStudies | heroMetric | text | true | yes | |
| CaseStudies | heroSubtitle | text | true | yes | |
| CaseStudies | sector | text | true | yes | |
| CaseStudies | period | text | **false** | yes | short date/range string, low risk but public-facing — flag |
| CaseStudies | services[].service | text | **false** | yes | **MIGRATION REQUIRED, see Action Needed #2 and `29-CASESTUDIES-SERVICES-DECISION.md`** |
| CaseStudies | kpis[].label | text | true | yes | |
| CaseStudies | kpis[].value | text | false | yes | numeric-like string, acceptable |
| CaseStudies | clientContext | richText | true | yes | |
| CaseStudies | challenge[].text | text | true | yes | |
| CaseStudies | solution[].title | text | true | yes | |
| CaseStudies | solution[].description | text | true | yes | |
| CaseStudies | results.metrics[].label | text | true | yes | |
| CaseStudies | results.metrics[].before | text | false | yes | numeric-like, acceptable |
| CaseStudies | results.metrics[].after | text | false | yes | numeric-like, acceptable |
| CaseStudies | conclusion | richText | true | yes | |
| **Categories** | title | text | true | yes | |
| Categories | description | text | true | yes | |
| **Clientes** | name | text | false | yes | proper noun, correct as-is |
| Clientes | websiteUrl | text | false | no | URL, correct as-is |
| **Media** | alt | text | true | yes | |
| **Pages** | title | text | true | yes | |
| Pages | content (blocks) | blocks | n/a | yes | delegates to each block's own config, see Blocks section below |
| **Posts** | title | text | true | yes | |
| Posts | excerpt | text | true | yes | |
| Posts | content | richText | true | yes | |
| **SpeakingEvents** | title | text | true | yes | |
| SpeakingEvents | description | text | true | yes | |
| SpeakingEvents | role | text | true | yes | |
| SpeakingEvents | coSpeakers[].name | text | false | yes | proper noun, correct as-is |
| SpeakingEvents | location | text | **false** | yes | minor — flag, see Action Needed #4 |
| SpeakingEvents | link | text | false | no | URL, correct as-is |
| **Testimonials** | name | text | false | yes | proper noun, correct as-is — matches CONTEXT decision "no anonymous quotes" |
| Testimonials | role | text | true | yes | |
| Testimonials | company | text | false | yes | proper noun, correct as-is |
| Testimonials | testimonial | textarea | true | yes | |
| **Users** | name | text | false | no | internal admin user, not public-facing — correct as-is |
| **Websites** | title | text | true | yes | |
| Websites | role | text | true | yes | |
| Websites | industry | text | true | yes | |
| Websites | highlights[].text | text | true | yes | |
| Websites | stack[].tag | text | **false** | yes | same shape as CaseStudies.services — see Action Needed #5, resolved |
| Websites | challenges[].text | text | true | yes | |
| **Footer** (global) | columns[].title | text | true | yes | |
| Footer | dynamicColumns[].title | text | true | yes | |
| Footer | legalLinks[].label | text | true | yes | |
| Footer | legalLinks[].href | text | false | no | URL, correct as-is |
| Footer | socialLinks[].url | text | false | no | URL, correct as-is |
| Footer | copyrightText | text | true | yes | |
| **Header** (global) | navItems[].link.label | text | true | yes | via shared `link()` helper, `src/fields/link.ts` line 108 |
| Header | navItems[].link.url | text | false | no | URL, correct as-is |
| Header | ctaButton.label | text | true | yes | |
| Header | ctaButton.href | text | false | no | URL, correct as-is |
| **Llms** (global) | llmsTxt | textarea | **false** | yes | AI-facing copy — **see Action Needed #3, AWAITING JUAN'S CALL** |
| Llms | llmsFull | textarea | **false** | yes | AI-facing copy — **see Action Needed #3, AWAITING JUAN'S CALL** |
| **FeaturedContent** (global) | — | relationship only | n/a | n/a | no text fields, relationships only to posts/case-studies/websites |
| **AboutSection** (block) | eyebrow | text | true | yes | |
| AboutSection | title | text | true | yes | |
| AboutSection | paragraphs[].text | text | true | yes | |
| AboutSection | features[].title | text | true | yes | |
| AboutSection | features[].description | text | true | yes | |
| AboutSection | ctaText | text | true | yes | |
| AboutSection | ctaLink | text | false | no | URL, correct as-is |
| **ArchiveBlock** | emptyStateHeading | text | true | yes | |
| ArchiveBlock | emptyStateBody | text | true | yes | |
| **CallToAction** | richText | richText | true | yes | fixed by 2026-07-12 incident migration — reference pattern for this phase's migration work |
| **ClientLogosBlock** | title | text | true | yes | |
| **Code** | language / code | text/code | n/a | no | technical, not editorial copy |
| **ContactFormBlock** | eyebrow | text | true | yes | |
| ContactFormBlock | title | text | true | yes | |
| ContactFormBlock | description | text | true | yes | |
| ContactFormBlock | submitLabel | text | true | yes | |
| ContactFormBlock | sidebarTitle | text | true | yes | |
| ContactFormBlock | sidebarDescription | text | true | yes | |
| ContactFormBlock | socialProofText | text | true | yes | |
| ContactFormBlock | contactInfo[].title | text | true | yes | |
| ContactFormBlock | contactInfo[].value | text | true | yes | |
| ContactFormBlock | contactInfo[].href | text | false | no | URL, correct as-is |
| **Content** | richText | richText | true | yes | |
| **FAQ** | title | text | true | yes | |
| FAQ | faqs[].question | text | true | yes | |
| FAQ | faqs[].answer | richText | true | yes | |
| **FeaturedCaseStudiesBlock** | title | text | true | yes | |
| **FeaturedPostsBlock** | title | text | true | yes | |
| **FeaturedWebsitesBlock** | title | text | true | yes | |
| **Hero** | title | text | true | yes | |
| Hero | subtitle | text | true | yes | |
| Hero | breadcrumbs[].label | text | true | yes | |
| Hero | breadcrumbs[].url | text | false | no | URL, correct as-is |
| Hero | cityName | text | true | yes | |
| Hero | inlineStat | text | true | yes | |
| **LocalProofSection** | stats[].value | text | true | yes | |
| LocalProofSection | stats[].label | text | true | yes | |
| LocalProofSection | testimonial.quote | text | true | yes | |
| LocalProofSection | testimonial.authorName | text | false | yes | proper noun, correct as-is |
| LocalProofSection | testimonial.authorBusiness | text | true | yes | |
| **MediaBlock** | — | media only | n/a | n/a | no text fields |
| **RelatedCaseStudyBlock** | title | text | true | yes | |
| RelatedCaseStudyBlock | framingText | text | true | yes | |
| **RelatedPosts** | title | text | true | yes | |
| **ResultsSection** | title | text | true | yes | |
| ResultsSection | description | text | true | yes | |
| ResultsSection | stats[].value | text | true | yes | |
| ResultsSection | stats[].label | text | true | yes | |
| **Section** | — | container/layout | n/a | n/a | no direct editorial text; nested `blocks` inherit their own audit entries above |
| **ServiceScopeCard** | title | text | true | yes | |
| ServiceScopeCard | scope | text | true | yes | |
| ServiceScopeCard | outcome | text | true | yes | |
| ServiceScopeCard | timeline | text | true | yes | |
| **ServicesShowcase** | title | text | true | yes | |
| **TableOfContentsBlock** | title | text | true | yes | |
| **TestimonialsCarousel** | title | text | **false** | yes | **flagged, see Action Needed #1** |
| TestimonialsCarousel | showRating / limit | boolean/number | n/a | no | not text |
| **TestimonialSection** | quote | text | true | yes | |
| TestimonialSection | authorName | text | false | yes | proper noun, correct as-is |
| TestimonialSection | authorRole | text | true | yes | |

---

## Action Needed

Five items surfaced by the sweep require explicit resolution or documentation before the Phase 30/31 content rewrite begins.

### 1. `TestimonialsCarousel.title` — RESOLVED, migrated and applied

**Status:** RESOLVED — migrated to `localized: true`, backfilled, applied 2026-07-14 (Juan's direct named approval, migration `20260714_200158.ts`).

`src/blocks/TestimonialsCarousel/config.ts` defines `title` as a plain `text` field without `localized: true`. This is one of the three fields named in ROADMAP.md's repeated-bug list (alongside `CallToAction.richText` and `Header.navItems.url`, both already fixed). The fix is a config change (`localized: true`) plus a backfill-then-drop-column migration, following the corrected pattern in `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` — copy the existing value into both `es`/`en` locale rows before dropping the shared column. Applied successfully, verified via read-back — no data lost.

Cross-reference: VOICE-02, resolved in Plan 29-03.

### 2. `CaseStudies.services[].service` — RESOLVED, migrated and applied

**Status:** RESOLVED — migrated to `localized: true`, backfilled, applied 2026-07-14 (Juan's direct named approval, migration `20260714_200220_phase29_casestudies_services_localized.ts`). See `29-CASESTUDIES-SERVICES-DECISION.md` for full evidence.

`src/collections/CaseStudies/index.ts` defines `services[].service` as a plain `text` field, not localized. Live-data investigation (Plan 29-02, queried via `payload.find({ collection: 'case-studies', locale: 'all' })` against real production data) found the actual values are descriptive Spanish service-category labels — "SEO técnico", "Estrategia de contenido", "Optimización on-page", "SEO local", "Contenido educativo de salud", "Estrategia de contenido legal", "Estrategia de contenido de producto" — not proper nouns or brand terms. Applied successfully, backfill verified via read-back on docs 18-20 — `en` currently holds the Spanish placeholder pending real translation in Phase 30/31, no data lost.

Cross-reference: VOICE-03, investigated in Plan 29-02, resolved in Plan 29-04.

### 3. `Llms.llmsTxt` / `Llms.llmsFull` — RESOLVED, intentional single-locale exception

**Status:** RESOLVED — Option B. Juan confirmed 2026-07-14: leave non-localized.

This is a new finding from this session's grep sweep, not previously named in ROADMAP.md's 3-repeat bug list. Both `llmsTxt` and `llmsFull` on the `Llms` global are `textarea` fields, not localized, and both are public AI-crawler-facing copy (`llms.txt` / `llms-full.txt`).

These files conventionally exist in a single canonical form across most sites — English is the common web convention for `llms.txt` — so leaving them non-localized may already be the correct call. But that's a decision, not something to resolve silently.

Two options:
- **Option A — Localize like normal copy.** Add `localized: true` and maintain separate ES/EN content, consistent with how the rest of the site's public copy is treated.
- **Option B — Document as an intentional single-locale exception.** Leave `llmsTxt`/`llmsFull` non-localized, on the reasoning that AI-crawler files conventionally ship in a single (usually English) form regardless of site locale, and note that explicitly here rather than as an unexamined gap.

This row is marked **AWAITING JUAN'S CALL** — no unilateral decision has been made.

### 4. `SpeakingEvents.location` — minor, likely correct as-is

**Status:** Likely correct as-is, confirm during Phase 30/31 execution.

`location` is a plain `text` field, not localized. It most likely holds a city name (proper noun), which would make non-localization correct — the same reasoning applied to `Clientes.name` and `Testimonials.company`. Low risk, non-blocking. Confirm against live data during Phase 30/31 execution rather than treating this as a blocker now.

### 5. `Websites.stack[].tag` — resolved, see Phase 38 CONTEXT.md

**Status:** Resolved — see Phase 38 CONTEXT.md. No further action needed.

Same shape and reasoning as `CaseStudies.services[].service` (a plain `text` field inside an array, not localized), but this one was already reviewed and approved as intentionally non-localized during Phase 38's planning: `stack[].tag` holds tech-stack names (Next.js, Payload, PostgreSQL), which are proper nouns and correctly left untranslated. Documented here for completeness only.
