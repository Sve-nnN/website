# Architecture Research — v1.6 (Bulk DB Copy Humanization)

**Domain:** Full-database content rewrite against a live production Payload/Postgres instance, no staging environment
**Researched:** 2026-07-13
**Confidence:** HIGH (based on direct inspection of every collection/global/block config file, the existing seed-script pattern, and two existing snapshot/verification scripts already built for a prior milestone)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  Phase 0: Safety net (build once, reuse every phase)                 │
│  ┌────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │ Neon branch (ephem- │  │ content-text-snapshot │  │ field-config│ │
│  │ eral "staging" DB)  │  │ .ts (full text dump,  │  │ audit script│ │
│  │                     │  │ both locales, JSON)   │  │ (localized: │ │
│  │                     │  │                       │  │ true audit) │ │
│  └──────────┬──────────┘  └───────────┬───────────┘  └──────┬──────┘ │
├─────────────┴──────────────────────────┴──────────────────────┴──────┤
│  Phase N: Per-collection-group rewrite (idempotent seed scripts)     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────────┐   │
│  │ Small       │ │ Static     │ │ Block-based│ │ Prose-heavy      │   │
│  │ globals +   │ │ marketing  │ │ service/geo│ │ collections      │   │
│  │ lean coll.  │ │ pages      │ │ landings   │ │ (Posts, Case-    │   │
│  │             │ │ (Home/     │ │            │ │ Studies)         │   │
│  │             │ │ Contact/   │ │            │ │                  │   │
│  │             │ │ Legal)     │ │            │ │                  │   │
│  └──────┬──────┘ └──────┬─────┘ └──────┬─────┘ └────────┬─────────┘  │
├─────────┴────────────────┴──────────────┴────────────────┴───────────┤
│  Post-write verification (run after EVERY phase, not just at the end)│
│  ┌──────────────┐ ┌───────────────────┐ ┌──────────────────────────┐│
│  │ Locale-parity│ │ Live curl es/en    │ │ reindex-search.ts        ││
│  │ collapse     │ │ diff (established  │ │ (plugin-search doesn't   ││
│  │ detector     │ │ project pattern)   │ │ backfill on update)      ││
│  └──────────────┘ └────────────────────┘ └──────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Close-out: content-text-snapshot.ts (after) vs (before) → human diff│
│  for Juan + Lighthouse/CWV regression gate (v1.5 Phase 25 pattern)   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| Neon ephemeral branch | Dry-run every rewrite script against a real fork of prod before touching prod | `neonctl branches create --parent main`, point `.env.branch` at it, run every seed script there first |
| `content-text-snapshot.ts` (new) | Full before/after text-field dump per locale, per doc, for human diff and script-driven rollback | Extends the existing `content-freeze-snapshot.ts` pattern, but dumps actual field values, not just `updatedAt` |
| Field-config audit script (new) | Static proof of which text fields are/aren't `localized: true`, across every collection/global/block | One-off `ts-morph` or regex script over `src/collections`, `src/globals`, `src/blocks` |
| Per-group seed/rewrite scripts | Idempotent upsert-by-slug (or upsert-by-id for globals/singletons) writes, one script per collection-group phase | Follows `scripts/seed-phase25-service-landings.ts`: write `es` first, `findByID` refetch, `reapplyIds()`, then write `en` |
| Locale-parity collapse detector (new) | Runtime proof that no `localized:true` field collapsed to identical es/en values after a write | Fetch `locale: 'all'` per doc, compare es vs en per field, flag suspicious equality |
| `reindex-search.ts` (existing) | Re-triggers `plugin-search`'s `afterChange` hook for posts/case-studies/authors after bulk `update()` calls | Already built — must be re-run after the Posts/CaseStudies rewrite phase |

## Recommended Project Structure

```
scripts/
├── content-text-snapshot.ts        # NEW — full text dump (before/after), extends freeze-snapshot pattern
├── verify-locale-parity.ts         # NEW — runtime collapse detector (es !== en per localized field)
├── audit-localized-fields.ts       # NEW — static config audit (grep all field configs for localized:true)
├── seed-v1.6-humanize-globals.ts   # NEW — Header/Footer/FeaturedContent/Llms (Llms needs a Juan decision, see Pitfalls)
├── seed-v1.6-humanize-lean-collections.ts   # NEW — Authors, Testimonials, Clientes, SpeakingEvents, Categories
├── seed-v1.6-humanize-pages-core.ts         # NEW — Home, Contact, Privacy, Terms
├── seed-v1.6-humanize-pages-services.ts     # NEW — Services index + 4 landings + 2 geo pages (reuses reapplyIds pattern)
├── seed-v1.6-humanize-posts.ts              # NEW — Posts collection (richText content — heaviest prose)
├── seed-v1.6-humanize-case-studies.ts       # NEW — CaseStudies collection (structured narrative fields)
├── reindex-search.ts               # EXISTING — re-run after posts/case-studies/authors touched
└── content-freeze-snapshot.ts      # EXISTING — reuse verbatim for the final go/no-drift check
```

### Structure Rationale

- **One script per collection-group phase, not one giant script and not one script per individual collection/block.** The project already has ~9 collections, 4 globals, and 21 reusable blocks — a script-per-block would massively over-fragment (blocks are shared across many pages; a per-block script has no natural "one doc" unit). A single giant script is the opposite failure: any bug forces a full re-run/re-review of everything, and a partial failure mid-run leaves an ambiguous DB state with no clean checkpoint. Grouping by **collection-group with similar risk/complexity profile** (lean collections vs block-based pages vs prose-heavy collections) matches how this project already organizes its `seed-phase*.ts` scripts and gives natural phase boundaries for the roadmapper.
- **Globals get their own tiny phase first.** Header/Footer/Llms are singleton documents (no upsert-by-slug ambiguity, easy to review in one PR-sized diff, and Header/Footer already have known non-localized-field history — good low-risk warm-up before touching the bigger collections).
- **Services/geo pages get their own phase** because they already follow the most complex existing pattern in the codebase (`reapplyIds()`, refetch-inside-locale-loop, 10-block anatomy) — reuse that exact script as a template rather than inventing a new pattern.
- **Posts and CaseStudies are separated from the "pages" work** because they hold the most prose (richText bodies, multi-paragraph narrative arrays) — the humanizer skill runs per-string, and these collections will have by far the most individual strings to process, so isolating them lets that phase run longer without blocking the smaller phases.

## Architectural Patterns

### Pattern 1: Neon branch as ephemeral staging (dry-run before prod)

**What:** Before running ANY humanization write script against the real `DATABASE_URI`, create a temporary Neon branch (a full copy-on-write fork of the production database, cheap and fast on Neon) and point the script at the branch's connection string first.

**When to use:** Every rewrite phase in this milestone. This is the single highest-leverage safety measure available, given CLAUDE.md's constraint that there is no persistent staging DB — a Neon branch gives you a *disposable* one without violating that constraint (it isn't a second permanent environment, it's a throwaway fork deleted after verification).

**Trade-offs:** Requires Neon CLI/API access and a few minutes of setup per phase; branches cost a small amount of storage while they exist. Well worth it against the risk class already demonstrated once in this project (2026-07-12 CTA-copy incident, recovered via PITR only by catching it fast).

**Example:**
```bash
# Before any Phase N rewrite script:
neonctl branches create --project-id <id> --name v1.6-dry-run-phaseN --parent main
# Point .env.dry-run at the branch's connection string, then:
node --env-file=.env.dry-run node_modules/.bin/tsx scripts/seed-v1.6-humanize-pages-core.ts
# Run verify-locale-parity.ts + curl checks against the branch
# Only after the branch run is clean:
node --env-file=.env node_modules/.bin/tsx scripts/seed-v1.6-humanize-pages-core.ts   # real .env → prod
neonctl branches delete --project-id <id> --name v1.6-dry-run-phaseN
```

### Pattern 2: Full-text snapshot for human diff + rollback (not just id/updatedAt)

**What:** The project already has `content-freeze-snapshot.ts`, but it only records `{id, slug, updatedAt}` per doc — enough to detect *that* something changed, not *what* changed, and useless for a human text diff or for reconstructing prior copy without Neon PITR. Build a sibling script that walks every collection/global identified in the Field Inventory below, fetches `locale: 'all'`, and serializes every `localized: true` text/textarea/richText field (richText serialized to plain text, not raw JSON, so Juan can actually read the diff) into a single JSON file per snapshot tag.

**When to use:** Once before Phase 1 starts (`--tag pre-humanize`), and once after each phase completes (`--tag post-phaseN`). Diff consecutive snapshots with a plain JSON/text diff tool (or a small custom script) and hand the diff to Juan for a read-through before moving to the next phase.

**Trade-offs:** Slightly more code than the existing snapshot script, and richText-to-plain-text serialization needs to be exact enough to be useful without needing full Lexical fidelity for a human diff. This is a documentation/audit artifact, not a runtime dependency — cheap to build, high value for "prove the humanized copy is what Juan actually approved."

**Example:**
```typescript
// scripts/content-text-snapshot.ts (sketch)
for (const collection of TEXT_COLLECTIONS) {
  const { docs } = await payload.find({ collection, locale: 'all', depth: 0, limit: 0 })
  for (const doc of docs) {
    for (const field of LOCALIZED_TEXT_FIELDS[collection]) {
      snapshot[collection][doc.id][field] = {
        es: extractText(doc[field]?.es),
        en: extractText(doc[field]?.en),
      }
    }
  }
}
```

### Pattern 3: Refetch-inside-locale-loop + `reapplyIds()` (established, reuse verbatim)

**What:** For any block-based `content.layout` field (Pages docs), write `es` first, `findByID` refetch the just-written layout as the reference, `reapplyIds()` to copy block/array-row ids from the reference onto the freshly-built `en` layout by matching `blockType` at each index, then write `en`. This is already the documented, incident-driven pattern in `scripts/seed-phase25-service-landings.ts` (see its own header comment for the full rationale and the CR-01 incident it fixes).

**When to use:** Any script touching `Pages.content.layout` (Home, Contact, Legal, Services, Geo pages). NOT needed for flat-field collections (Authors, Testimonials, Clientes, SpeakingEvents, Categories, CaseStudies, Posts) where there's no block-array id-collision risk — those are simpler `payload.update({ collection, id, locale, data })` calls per locale, still done in a loop (es then en) but without the refetch/reapplyIds machinery.

**Trade-offs:** More code per script than a naive "build both locales, write both" approach, but the naive approach is exactly what caused the CR-01 incident (fresh ids generated independently per locale on a first run, breaking cross-locale block-array-row correspondence).

## Field Inventory: What's Safe to Rewrite Per-Locale vs What's a Trap

This is the concrete, code-verified list the roadmapper needs — every collection, global, and block was read directly (not inferred from `localized:` policy claims) as of 2026-07-13.

### Collections

| Collection | Localized text fields (safe to rewrite per-locale) | Non-localized fields (proper nouns / URLs — correctly excluded) | Status |
|---|---|---|---|
| `Authors` | `jobTitle`, `bio`, `credentials[].label`, `expertise[].topic`, `education[].degree/institution/description`, `experience[].company/role/description` | `name`, `avatar`, `yearsExperience`, `socialLinks[].url`, `education/experience[].startDate/endDate` | Clean |
| `CaseStudies` | `title`, `heroMetric`, `heroSubtitle`, `sector`, `kpis[].label`, `clientContext` (richText), `challenge[].text`, `solution[].title/description`, `results.metrics[].label`, `conclusion` (richText) | `client` (relationship), `period`, `kpis[].value`, `results.periodBefore/After`, `results.metrics[].before/after`, `heroImage`, `author` | **`services[].service` is a NEW TRAP — see below** |
| `Clientes` | none | `name`, `logo`, `websiteUrl` | Clean by design (proper nouns) |
| `Pages` | `title` at doc level; block-level fields, see Blocks table | `slug` | Clean at collection level |
| `Posts` | `title`, `excerpt`, `content` (richText) | `heroImage`, `author`, `categories`, `publishedAt` | Clean |
| `SpeakingEvents` | `title`, `description`, `role` | `coSpeakers[].name`, `date`, `location`, `attendeeCount`, `link`, `flyer` | `location` is a minor watch item — see below |
| `Testimonials` | `role`, `testimonial` | `name`, `company`, `avatar` | Clean (proper nouns correctly excluded) |
| `Categories` | `title`, `description` | `slug` | Clean |
| `Media` | `alt` | file itself | Clean |

### Globals

| Global | Localized text fields | Non-localized fields | Status |
|---|---|---|---|
| `Header` | `ctaButton.label`, `navItems[].link.label` (via shared `link()` field) | `logo`, `ctaButton.href`, `navItems[].link.url` | Clean — `.url` non-localization is intentional (URLs, not human copy) and already has the `normalizeServiceHref()` render-time workaround for the 2 service-index URLs that need locale-aware rewriting |
| `Footer` | `columns[].title`, `columns[].links[].link.label`, `dynamicColumns[].title`, `legalLinks[].label`, `copyrightText` | `socialLinks[].url`, `legalLinks[].href` | Clean |
| `FeaturedContent` | none | `featuredPosts`, `featuredCaseStudies` (relationships) | N/A — no text |
| `Llms` | **none** — `llmsTxt`, `llmsFull` are plain `textarea` with no `localized: true` | — | **NEW TRAP / OPEN DECISION — see below** |

### Blocks (used inside `Pages.content.layout`)

| Block | Localized text fields | Non-localized fields | Status |
|---|---|---|---|
| `Hero` | `title`, `subtitle`, `breadcrumbs[].label`, link labels (via `linkGroup`) | `variant`, `media`, `breadcrumbs[].url`, link URLs | Clean |
| `Content` | `columns[].richText` (fixed in 05-12, was the Privacy/Terms bug), link labels | `columns[].size`, `enableLink`, link URLs | Clean (already fixed) |
| `CallToAction` | `richText` (fixed after the 2026-07-12 production incident — see CLAUDE.md), link labels | link URLs, `appearance` | Clean (already fixed, but this is the field the migration incident happened on — treat any future migration on it with extra care) |
| `FAQ` | `title`, `faqs[].question`, `faqs[].answer` | — | Clean |
| `TestimonialsCarousel` | **`title` — NOT localized, still an open bug**, mitigated by a render-time i18n fallback in `Component.tsx` (`t('title')` when the stored value is null) | `showRating`, `limit` | **KNOWN TRAP, workaround in place — see below** |
| `TestimonialSection` | `quote`, `authorRole` | `authorName` | Clean (proper noun correctly excluded) |
| `AboutSection` | `eyebrow`, `title`, `paragraphs[].text`, `features[].title/description`, `ctaText` | `photo`, `ctaLink`, `features[].icon` | Clean |
| `ArchiveBlock` | `emptyStateHeading`, `emptyStateBody` | `relationTo`, `mode`, `limit`, `selectedDocs`, `enableCategoryFilter` | Clean |
| `ClientLogosBlock` | `title` | `clients` (relationship) | Clean |
| `Code` | none (`code` field intentionally not localized) | `language`, `code` | Clean by design — code samples should stay identical across locales; inline comments inside code are a low-priority edge case, not worth a schema change |
| `ContactFormBlock` | `eyebrow`, `title`, `description`, `submitLabel`, `sidebarTitle`, `sidebarDescription`, `socialProofText`, `contactInfo[].title/value` | `contactInfo[].icon/href` | Clean |
| `FeaturedCaseStudiesBlock` | `title` | `limit` | Clean |
| `FeaturedPostsBlock` | `title` | `limit` | Clean |
| `MediaBlock` | none | `media` | N/A |
| `RelatedCaseStudyBlock` | `title`, `framingText` | `caseStudy` (relationship) | Clean |
| `RelatedPosts` | `title` | `posts`, `autoSelect`, `limit` | Clean |
| `ResultsSection` | `title`, `description`, `stats[].value/label` | `backgroundColor` | Clean |
| `Section` | inner `blocks[]` (wraps `CallToAction`/`Content`/`MediaBlock`/`ArchiveBlock`, each following its own row above); the `blocks` field itself also carries `localized: true` | `container`, `paddingY`, `backgroundStyle`, `backgroundColor`, `backgroundMedia`, `anchorId`, `className` | Clean |
| `ServiceScopeCard` | `title`, `scope`, `outcome`, `timeline` | — | Clean |
| `ServicesShowcase` | `title` (section heading only — card content is derived at render time from `SERVICE_SLUGS`, not stored) | — | Clean, but note: the *displayed* card copy for this block actually lives in the 4 service-landing `Pages` docs it reads from, not in this block itself |
| `TableOfContentsBlock` | `title` (defaults to `'Tabla de contenidos'`) | `position`, `sticky`, `minHeadingLevel` | Clean |

### `@payloadcms/plugin-seo` (`meta.title`, `meta.description`, `meta.image`)

Applied to `pages`, `posts`, `case-studies`, `authors`. **Verified in `node_modules/@payloadcms/plugin-seo/dist/fields/MetaTitle/index.js` and `MetaDescription/index.js`: both carry `localized: true` by default** (HIGH confidence — read directly from the installed package source, not assumed). Safe to rewrite per-locale. `meta.image` is an upload reference, no text.

## Newly Discovered Non-Localized Traps (beyond the 3 already found in v1.5)

### Trap 1: `CaseStudies.services[].service` — plain text array, not localized

```typescript
// src/collections/CaseStudies/index.ts
{
  name: 'services',
  type: 'array',
  fields: [{ name: 'service', type: 'text', required: true }],   // no localized: true
},
```

This renders a public list of service names on the case-study detail page (e.g. "SEO Técnico" / "Technical SEO"). If humanized per-locale via a normal `payload.update({ locale, data })` call, the same "last write wins" collapse that hit `Header.navItems.url`, `Content.link.url`, and `TestimonialsCarousel.title` will hit this field too — es and en will silently converge on whichever locale wrote last.

**Recommendation:** Fix the schema properly this time instead of adding another render-time workaround — add `localized: true` and write a migration that backfills the current single value into both `es` and `en` before any content is dropped (same non-destructive backfill discipline CLAUDE.md already mandates for field reshapes). There is currently only 1 real CaseStudies doc in production, so the backfill blast radius is trivial — this is the cheapest possible moment to fix it.

### Trap 2: `Llms.llmsTxt` / `Llms.llmsFull` — global, no localization at all

```typescript
// src/globals/Llms/index.ts
{ name: 'llmsTxt', type: 'textarea', required: true, ... },   // no localized: true
{ name: 'llmsFull', type: 'textarea', required: true, ... },
```

Unlike the other traps, this may be **intentional** — the llms.txt convention is often published as a single canonical (usually English) document regardless of site locale, and there is no evidence gathered in this pass that `/llms.txt` and `/llms-full.txt` are served per-locale (worth a quick route check before deciding, out of scope for this research pass). Flagging as an **open decision for Juan**, not an automatic bug fix: either (a) leave it single-locale and humanize the one value that exists today, or (b) localize it and write both locale versions. Don't silently assume either — this is exactly the kind of ambiguous case that produced the CTA-copy incident when someone assumed instead of asking.

### Trap 3 (confirmed, not new): `TestimonialsCarousel.title` — still unfixed at the schema level

The v1.5 fix for this was a **render-time workaround** (`Component.tsx` falls back to `t('title')` from next-intl when the stored value is `null`), not a schema fix — the field is still not `localized: true` in `config.ts`. This matters directly for this milestone: **any humanization script that writes a non-null value into `TestimonialsCarousel.title` for one locale will silently apply to both locales again**, the exact same collapse. Two options: (a) leave this field null/untouched during the humanization pass everywhere it's used (rely on the existing i18n fallback, zero risk), or (b) — same as Trap 1 — fix the schema properly with `localized: true` + backfill migration now that a full-content pass is already touching every doc anyway. Given this milestone explicitly wants "TODO el copy real... con la voz de Juan," leaving it null and only translating via the next-intl message catalogs is likely the right call unless Juan wants per-instance carousel titles to vary.

### Watch item (low severity): `SpeakingEvents.location`

Plain `text`, not localized. Holds values like a city/country name. Low risk (place names are often identical or near-identical across es/en — "Lima" is "Lima" in both), but if any location string contains descriptive text beyond a bare place name (e.g. "Lima, Perú (remoto)"), that phrase would need `localized: true` to translate safely. Worth a quick manual check of actual stored values before deciding whether this needs a schema change — not urgent enough to block Phase 1.

## Suggested Build Order (Phase/Plan Granularity for the Roadmapper)

**Ordering constraint that overrides all others: nothing gets rewritten before the snapshot exists.** Every phase below depends on Phase 0 having run first.

1. **Phase 0 — Safety net (no content rewrite yet).**
   - Build `scripts/content-text-snapshot.ts` (extends `content-freeze-snapshot.ts`) and `scripts/verify-locale-parity.ts` (runtime collapse detector) and `scripts/audit-localized-fields.ts` (static config audit — produces the table above, mechanically, so it can be re-run after every phase to catch regressions).
   - Take the `--tag pre-humanize` snapshot against production (read-only, zero risk).
   - Resolve Trap 1 (`CaseStudies.services[].service`) and Trap 2 (`Llms` localization — needs Juan's decision) as small, additive/backfill migrations, following the CLAUDE.md-mandated backfill-before-drop discipline, with Juan's named approval on the migration SQL per the existing rule (these are field reshapes).
   - Decide and document the `TestimonialsCarousel.title` strategy (leave null vs. localize+backfill) before Phase 2 starts, since multiple later phases touch pages using this block.
   - Create the first Neon dry-run branch and validate the whole toolchain (snapshot, parity check, one trivial rewrite) against it before ever touching prod.

2. **Phase 1 — Globals + lean collections (low risk, good warm-up).**
   Header, Footer, FeaturedContent (no text, skip), Llms (per Phase 0 decision), Authors (1 doc), Testimonials, Clientes (currently no localized fields, likely skip), SpeakingEvents, Categories.
   Small blast radius, singleton/few-doc collections, fast to review end-to-end. Establishes the "dry-run on Neon branch → verify → apply to prod → verify again" rhythm for the rest of the milestone.

3. **Phase 2 — Core static Pages (Home, Contact, Privacy, Terms).**
   Block-based `content.layout` rewrites using the refetch/`reapplyIds()` pattern. Home is the highest-traffic page and touches the most distinct block types (Hero, AboutSection, ServicesShowcase, FeaturedPostsBlock, FeaturedCaseStudiesBlock, FAQ, ClientLogosBlock, TestimonialsCarousel) — good coverage test for the parity-collapse detector across nearly every block type in one phase.

4. **Phase 3 — Services + Geo pages (highest existing complexity, reuse existing template).**
   Services index + 4 service landings + 2 geo pages. Directly reuse `scripts/seed-phase25-service-landings.ts` as the literal template (same `reapplyIds()`/refetch-in-loop machinery) — this is the collection-group where the id-collision incident already happened once, so don't reinvent the write pattern here.

5. **Phase 4 — Posts + CaseStudies (heaviest prose, most humanizer-skill invocations).**
   Split into two scripts if Posts has more than a handful of docs (richText bodies are the largest single source of individual strings needing the humanizer skill run per-paragraph or per-section). Re-run `reindex-search.ts` at the end of this phase — `plugin-search`'s `afterChange` hook doesn't backfill retroactively, and this phase is exactly the kind of bulk `update()` pass that requires it.

6. **Phase 5 — Close-out verification.**
   Final `content-text-snapshot.ts --tag post-humanize`, diffed against `pre-humanize` for Juan's own read-through (this is the actual "does it sound like Juan" gate — no automated check can substitute for it). Full live curl sweep of es/en for every touched URL (established project pattern). Lighthouse/CWV regression check (v1.5 Phase 25 gate pattern) since humanized copy can change text length/DOM enough to shift CLS on some pages, even though this pass is text-only, not layout-only.

**Why this order and not, e.g., biggest-content-first:** starting with the lowest-risk, smallest-blast-radius collections (globals, Authors) lets the Neon-branch-dry-run + snapshot + parity-check toolchain get validated for real, cheaply, before it's trusted against the highest-stakes collections (Posts/CaseStudies, which carry the most SEO-visible prose and the most individual strings). It mirrors how v1.5 phased breadcrumbs → canonical/hreflang → showcase → full visual polish, each phase building trust in the pattern before the next phase's larger scope.

## Verification Strategy (would this have caught the v1.5-class bugs?)

The three known bugs (`Header.navItems.url`, `Content.link.url`, `TestimonialsCarousel.title`) were all discovered by **manual observation** during Phase 25 (Juan or the agent noticing a link/label rendering wrong on one locale), not by an automated check. The strategy below is specifically designed to catch that bug class mechanically instead of by luck:

1. **Static audit first (`audit-localized-fields.ts`).** Before writing content, mechanically list every text/textarea/richText field across every collection/global/block and whether it carries `localized: true`. This alone would have flagged all 3 known bugs and both newly discovered traps in this research pass — the static picture was fully derivable from the config files, no runtime inspection needed. Re-run this script after any schema change to confirm the fix landed and after every phase to confirm nothing regressed.

2. **Runtime collapse detector (`verify-locale-parity.ts`), run after every write phase.** For every doc/global touched in that phase, fetch `locale: 'all'`, and for every field the static audit marked `localized: true`, assert `es !== en` (when both are non-empty and the source content was written distinctly). This is the check that would have caught the actual *symptom* of the bug (es and en converging to one value) even on a field the static audit might miss for some reason (e.g. a field inside a dynamically-composed block). Flag — don't auto-fail — since some fields legitimately share a value across locales (e.g. a proper noun that happens to have been typed with translated copy anyway); a human reviews the flagged list.

3. **Live curl es/en diff, per touched URL, per phase.** This is already the established verification discipline in this project (used throughout v1.4/v1.5) — curl both locale URLs for every page touched in a phase and confirm the rendered text actually differs where it's supposed to. Cheap, catches rendering-layer issues the DB-level checks can't see (e.g. a render-time fallback masking a DB-level problem, like the current `TestimonialsCarousel` workaround does).

4. **`content-text-snapshot.ts` diff, human-reviewed, at minimum before/after each phase.** Not just to catch bugs — this is also the practical substitute for a full staging environment: Juan reads the diff before the next phase starts, catching content-quality and correctness issues (not just locale-parity bugs) before they compound across five phases of rewrites.

5. **Neon branch dry-run before every phase's production write.** Every phase's script runs against a throwaway Neon branch first; only after the parity detector and curl checks are clean on the branch does the exact same script run against `.env` (production). This turns "no staging environment" from a hard constraint into a solved problem for the duration of this milestone, without creating a second permanent database that CLAUDE.md's Database Safety section would then need to account for going forward.

## Anti-Patterns

### Anti-Pattern 1: One giant script for the whole DB

**What people do:** Write a single `humanize-everything.ts` that loops over every collection and rewrites every field in one run.
**Why it's wrong:** No natural checkpoint if something breaks partway through (and Postgres `update()` calls here are not wrapped in a single transaction across collections); a bug discovered in doc #340 of 400 forces re-review of everything already written; the humanizer skill runs per-string, so a giant script also produces one enormous, unreviewable diff instead of phase-sized diffs Juan can actually read.
**Do this instead:** Collection-group-per-phase scripts (see Suggested Build Order), each independently idempotent and independently verifiable.

### Anti-Pattern 2: Assuming `localized: true` in a helper field (like `link()`) means every field built from it is automatically safe

**What people do:** See that `Header` uses the shared `link()` field helper (which does have `label: { localized: true }`) and assume the whole `navItems` array is locale-safe.
**Why it's wrong:** This is close to the actual root cause of the original `Header.navItems.url` bug — the *label* was locale-safe but the *url* field in the same shared helper was not (by design, since URLs are usually locale-invariant), and that distinction is easy to lose track of when reasoning about a field "generically."
**Do this instead:** Verify locale-safety per concrete field name, not per helper/shared-field-factory — the Field Inventory table above does this by reading every config file directly rather than trusting field-helper conventions.

### Anti-Pattern 3: Omitting a non-localized field from an `update()` payload instead of explicitly clearing it

**What people do:** When writing locale `es`, only submit the fields that actually need an `es`-specific value, assuming Payload treats the omitted keys as "leave untouched, this locale doesn't need it."
**Why it's wrong:** Documented directly in `TestimonialsCarousel/Component.tsx`'s code comment (25-REVIEW finding): Payload's per-locale `update()` **leaves non-localized fields untouched when the key is omitted** rather than clearing them — so an earlier seed run's stale value silently persists. The fix used there was writing `title: null` explicitly.
**Do this instead:** When a non-localized field should be empty/absent for a given write, submit it explicitly as `null` (or the field's empty value), never rely on omission to mean "no value."

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---|---|---|
| Neon Postgres (production) | Direct connection string via `DATABASE_URI` in `.env`, `push: false`, migrations via `payload migrate` | The only real DB — see CLAUDE.md Database Safety section. Content rewrites here are `update()` calls, not schema migrations, EXCEPT for Trap 1/2/3 fixes which do require additive/backfill migrations with Juan's named approval |
| Neon Postgres (ephemeral branch) | `neonctl branches create/delete`, separate `.env.dry-run` connection string | New for this milestone — recommended as the dry-run mechanism, not a permanent second environment |
| `@payloadcms/plugin-search` | `afterChange` hook auto-syncs on `update()`, but does NOT backfill existing docs on a no-op-triggering bulk pass automatically unless `update()` is actually called per doc | `reindex-search.ts` already exists and handles this — re-run after Posts/CaseStudies/Authors phase |

### Internal Boundaries

| Boundary | Communication | Notes |
|---|---|---|
| Seed/rewrite scripts ↔ Payload Local API | Direct `payload.update({ collection, id, locale, data })` calls, no HTTP layer | Matches every existing `scripts/seed-*.ts` — keep using Local API, not REST/GraphQL, for these bulk writes (faster, no auth/session overhead, already the established pattern) |
| Humanizer skill ↔ rewrite scripts | Humanizer produces the final copy string; the script only handles the DB write/locale/id mechanics | Keep these decoupled — run humanizer as a separate editorial pass (agent- or human-reviewed) producing a copy source-of-truth file (e.g. `scripts/seed-v1.6-data/*.ts`, mirroring the existing `seed-phase19-data/`, `seed-phase20-data/`, `seed-phase25-data.ts` pattern) that the write script then imports, rather than inlining humanizer calls inside the DB-write loop |
| Render-time locale workarounds (`normalizeServiceHref`, `TestimonialsCarousel`'s i18n fallback) ↔ DB content | These are compensating for known schema gaps, not general-purpose patterns | Don't extend this pattern to Trap 1 (`CaseStudies.services[].service`) — fix that one at the schema level instead, since there's no existing component-level fallback to lean on there and the doc count is trivial right now |

## Sources

- Direct file reads (2026-07-13): every file under `src/collections/*/index.ts`, `src/globals/*/index.ts`, `src/blocks/*/config.ts`, `src/fields/{link,linkGroup,slug,targetKeyword}.ts` — HIGH confidence, primary source
- `node_modules/@payloadcms/plugin-seo/dist/fields/{MetaTitle,MetaDescription}/index.js` — HIGH confidence, verified `localized: true` directly in the installed package source
- `scripts/content-freeze-snapshot.ts`, `scripts/verify-content-freeze.ts`, `scripts/seed-phase25-service-landings.ts`, `scripts/reindex-search.ts`, `scripts/seed-phase19-service-pages.ts` (referenced) — HIGH confidence, existing project patterns to extend/reuse
- `.planning/PROJECT.md` "Milestone Anterior: v1.5" and root `CLAUDE.md` "Database Safety" section — HIGH confidence, incident history and hard constraints this research must respect
- `src/blocks/TestimonialsCarousel/Component.tsx` inline code comment — HIGH confidence, documents the exact mechanism of the omitted-field-persists-stale-value bug

---
*Architecture research for: bulk DB copy humanization on a production Payload/Postgres site, no staging environment*
*Researched: 2026-07-13*
