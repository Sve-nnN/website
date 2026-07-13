---
phase: 25
slug: service-page-visual-polish
status: draft
shadcn_initialized: true
preset: "style: new-york, baseColor: neutral, cssVariables: true, iconLibrary: lucide"
created: 2026-07-13
---

# Phase 25 — UI Design Contract: Service-Page Visual Polish

> Visual and interaction contract for the 4 service landings (`/servicios/[slug]`, `/en/services/[slug]`), both locales. This is **polish on an established design system** (Phases 7/8/9/10) — no new visual language, no new tokens. Every value below is either a direct read of an existing token/component or a composition of existing components.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (already initialized, `components.json` present) |
| Preset | `style: new-york`, `baseColor: neutral`, `cssVariables: true`, prefix none |
| Component library | Radix primitives via shadcn (`Card`, `Button`, `Badge` already in `src/components/ui/`) |
| Icon library | `lucide-react` (already in use: `ContactFormBlock`, `ServicesShowcase`, `AboutSection`, `SiteFooter`, Author page) |
| Font | `font-sans` (Geist, body) / `font-heading` (Khand, H2-H4) / `font-display` (Array, H1 only) — set sitewide in `src/app/(frontend)/[locale]/layout.tsx`, do not override per-block |

No new npm dependency, no new shadcn component install required for this phase. `Accordion`/`Badge` are not currently installed — this spec deliberately avoids requiring them (see FAQ and Scope Card sections below, which reuse the existing `<details>` pattern and plain `Card` instead).

---

## Spacing Scale

Declared values (must be multiples of 4) — unchanged from sitewide scale, `tailwind.config.ts` comment "UI-SPEC Spacing Scale":

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px (`p-1`) | Icon gaps, inline padding |
| sm | 8px (`p-2`) | Compact element spacing |
| md | 16px (`p-4`) | Default element spacing, `Container` horizontal padding (mobile) |
| lg | 24px (`p-6`) | `Container` horizontal padding (md+), Card padding |
| xl | 32px (`p-8`) | Layout gaps |
| 2xl | 48px (`p-12`) | Major section breaks — use as the default inter-block rhythm on these landings (`py-12` on most blocks already) |
| 3xl | 64px (`p-16`) | Page-level spacing — CallToAction block already uses `py-16 md:py-20` |

Exceptions for this phase: none. All new sections use `<Container className="py-12">` (2xl) exactly like `FAQComponent`/`ResultsSectionComponent`/`ClientLogosBlockComponent` already do — do not introduce a different vertical rhythm for the new blocks.

---

## Typography

Unchanged, sitewide 4-size scale (`tailwind.config.ts` `fontSize`):

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px (`text-body`) | 400 (default) | 1.5 |
| Label | 14px (`text-label`) | 600 | 1.4 |
| Heading | clamps 22px→28px (`text-heading`) | 600 | 1.2 |
| Display | clamps 36px→56px (`text-display`) | 600 | 1.05 |

Rules for this phase:
- H1 stays exactly as-is inside the existing `Hero` block (`variant: listing` → `font-heading text-heading`, per `HeroComponent`). **Do not touch `Hero/Component.tsx` or the H1 markup** — SVCPOL-09 requires zero H1 regression.
- Every new section heading (Pain, Scope Card title, Social Proof sub-headings, Related Case Study title) uses `font-heading text-heading` — same as `FAQComponent`'s `<h2>`. Never introduce an `<h1>` outside Hero.
- KPI/metric numbers (case-study `heroMetric`, scope card timeline figure if numeric) reuse the established metric-dominance treatment verbatim: `font-display text-display font-semibold text-primary tracking-tight tabular-nums` (`ResultsSection` precedent) or the smaller `font-heading text-heading font-semibold text-primary` variant used by `CaseStudyCard`'s `heroMetric` — use the **smaller** `CaseStudyCard` variant here, since this is a summary card, not a full case-study hero.
- Body copy (pain paragraphs, scope card text, case-study framing sentence) is `text-body`, matching `Content`/`FAQ`/`TestimonialSection` — never introduce a smaller custom size.

---

## Color

Unchanged sitewide tokens (`src/app/globals.css` `:root`, no `.dark` class is ever applied to `<html>` — confirmed: `[locale]/layout.tsx` sets no `dark` className, so the site renders in **light mode** at all times; the "navy/ember" branding lives in `--secondary`/`--primary`, not in a dark theme toggle).

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--background` `#FAFAF7` (off-white) | Page background, `Content`/`FAQ`/social-proof section backgrounds — default, no `backgroundColor` override |
| Secondary (30%) | `--secondary` `#12141C` (navy) | Hero block background (unchanged), `CallToAction` block background (via `HeroGrainGradient variant="cta"` over navy), `SiteHeader`/`SiteFooter` — reuse only, do not add new navy blocks |
| Accent (10%) | `--primary` `#F7581E` (ember) | Reserved for: CTA button fills (`Button` default variant), KPI/metric numbers (`text-primary`), scope card's timeline highlight figure, hover state on `ClientLogosBlock` logos (already `hover:grayscale-0`), FAQ `+`/`×` toggle glyph (existing pattern). **Not** used for body text, card borders, or section backgrounds. |
| Destructive | `--destructive` `#DC2626` | Not applicable — this phase has no destructive actions (read-only marketing pages, no delete/cancel affordances) |

Accent reserved for (explicit, non-negotiable list for this phase): CTA buttons (both the top and bottom repeated CTA), the case-study `heroMetric` figure inside the Related Case Study card, and the FAQ expand glyph. Nothing else on these landings gets ember.

Card surfaces (Scope Card, Related Case Study card) use the existing `Card` primitive verbatim (`bg-card` = same as `--background` in light mode with a 1px `border` + `shadow-sm`/`hover:shadow-md`) — do not introduce a "Muted"/"Primary (light)" `Section.backgroundColor` variant for these; keep the page reading as one continuous off-white surface, consistent with how `FAQ`/`ResultsSection`/`ClientLogosBlock` already render on these landings.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (top, ES) | "Agenda una llamada" → links to `/contact` (mirrors existing `copy.ctaLinkLabel` pattern from Phase 19 seed data — reuse per-service `ctaLinkLabel`, do not hardcode a generic label across all 4) |
| Primary CTA (bottom, ES) | Same label as top CTA, same destination — repetition is intentional (SVCPOL requirement), not a second distinct CTA |
| Primary CTA (EN) | "Book a call" (mirrors existing EN `ctaLinkLabel`) |
| Pain section heading (ES) | Service-specific, written per landing (e.g. "¿Te suena familiar?" / "El problema" as a generic fallback pattern only if a more specific phrase doesn't fit) — must pass through the humanizer skill before publishing, no em/en dashes, no AI-writing tells |
| Scope card heading (ES) | "Alcance de este servicio" |
| Scope card fields (ES) | "Qué incluye" (alcance) / "Qué vas a lograr" (resultado) / "Tiempo estimado" (tiempo) — three short labels, no pricing anywhere on the card (hard project rule, D-01 in ROADMAP) |
| Scope card heading/fields (EN) | "Service scope" / "What's included" / "What you'll get" / "Estimated timeline" |
| Related case study framing (ES) | "Un caso real de cómo trabajo" — explicit honest framing per Juan's 2026-07-13 decision, never implies the case study is specific to this exact service |
| Related case study framing (EN) | "A real example of how I work" |
| Related case study CTA | "Ver el caso completo" / "Read the full case study" — links to `/case-studies/migracion-ecommerce-nextjs-seo-tecnico` (or `/en/...`) |
| Empty state (Related Case Study, no case study configured) | Component returns `null` (same pattern as `ClientLogosBlockComponent`/`FeaturedCaseStudiesBlockComponent` when their data source is empty) — no visible empty-state copy needed, this is editor-configured content, not a user-facing search/filter result |
| Error state | Not applicable — no client-side data fetching, no forms on these pages beyond the existing `/contact` link |
| Destructive confirmation | Not applicable — no destructive actions on this phase |

All copy above (pain section, scope card body text per service, case-study framing sentence) is genuinely new or rewritten content and **must** go through the humanizer skill (`~/.claude/skills/humanizer/SKILL.md`) before being seeded, per CONTEXT.md's hard rule. This applies independently to the ES and EN version of each string (not a translation pass over an already-humanized ES string).

---

## Block Anatomy & Order (SVCPOL-01)

Starting point: today each of the 4 landings already renders `Hero(listing) → Content(includes+process+proofLinks) → FAQ → CallToAction` (per `scripts/seed-phase19-service-pages.ts`). This phase **restructures and adds to** that sequence — it does not start from a blank page, and it must not remove or reorder the existing `Content`/`FAQ`/`CallToAction` blocks' internal field shapes (only their position and the surrounding blocks change).

Target order (identical structure for all 4 landings and both locales — content differs, anatomy doesn't):

1. **Hero** (`variant: listing`, unchanged component/props) — H1 + subtitle + breadcrumbs. **No changes.**
2. **Content** block (existing, reused) — one `full`-width column: the pain/problem section, new copy per service, `lexicalWithHeading(painTitle, painParagraphs)` same shape as today's `includes`/`process` columns.
3. **Scope Card** (NEW Payload block, see below) — one per landing, service-specific copy, no price.
4. **CallToAction** block (existing, reused) — top repeated CTA. Same component/props as the bottom one; this is a second instance of the same block, not a new variant.
5. **Content** block (existing, reused, same block instance shape as today) — "Qué incluye" column, then "Proceso" column, then any `proofLinks` columns — this preserves today's exact field usage, just moved later in the sequence.
6. **Social proof** — three existing blocks, all reused as-is, no new components:
   a. **ClientLogosBlock** (existing) — `clients` left empty to show all 6 real clients (same config as Home's instance).
   b. **TestimonialsCarousel** (existing) — the block actually wired to the `testimonials` collection (confirmed via `scripts/seed-home-page.ts`; `TestimonialSection` is a different, single-hand-picked-quote block embedded inside CaseStudies docs, not used standalone on Home — do not use `TestimonialSection` here, use `TestimonialsCarousel` to match the Home precedent and pull the 1 real testimonial from the `testimonials` collection).
   c. **Related Case Study** (NEW Payload block, see below) — the single real case study (`migracion-ecommerce-nextjs-seo-tecnico`), honestly framed.
7. **FAQ** block (existing, reused, unchanged component/props).
8. **CallToAction** block (existing, reused) — bottom repeated CTA, second instance of step 4's block.

This satisfies SVCPOL-01 (H1 → pain → what's-included → process → social-proof → FAQ → CTA — the Scope Card sits between pain and what's-included as a natural "here's the shape of the engagement" beat, and does not break the required sequence since it's additive, not a reordering of the named anatomy stages) and the repeated-CTA requirement (steps 4 and 8, same block, same props shape, different `id`).

Reapply-IDs discipline: any script that seeds this new layout **must** follow the existing `reapplyIds()` pattern from `scripts/seed-phase19-service-pages.ts` (walk by index, copy `id`/sub-array ids from the same-index block in the other locale's already-saved layout) — this is a hard requirement, not a style preference, per the documented Phase 05/13/15 bug pattern cited in that script's own header comment. Do not round-trip a full-array `payload.update` without it.

---

## New Block 1: Scope Card (`serviceScopeCard`)

**Decision:** new, lightweight Payload block — not a variant of `Section`/`Content`. Rationale: the alcance/resultado/tiempo triad is structured data (three distinct labeled fields, like `ResultsSection.stats[]`), not free-form rich text, and it needs a fixed 3-slot visual (not `Content`'s arbitrary N-column layout). Reuses the existing `Card`/`CardContent` primitive for rendering — no new CSS, no new shadcn install.

**Config shape** (`src/blocks/ServiceScopeCard/config.ts`):

```
slug: 'serviceScopeCard'
fields:
  - title (text, localized, optional — defaults to "Alcance de este servicio"/"Service scope" in the component if empty)
  - scope (textarea, localized, required) — "Qué incluye"/"What's included"
  - outcome (textarea, localized, required) — "Qué vas a lograr"/"What you'll get"
  - timeline (text, localized, required) — "Tiempo estimado"/"Estimated timeline", short freeform string (e.g. "2-3 semanas"), NOT a number field — timelines vary in phrasing per service and must not be forced into a numeric shape
```

**Visual treatment:** single `Card` (not a grid of cards), full `Container` width on mobile, `max-w-2xl` centered on desktop to read as one cohesive "spec sheet," not a pricing table (hard rule — literally never render a `$`/price/tier anywhere in this component). Inside the card: `title` as `font-heading text-heading`, then three stacked rows (not columns — stacking reads as sequential/narrative, avoiding any resemblance to a 3-tier pricing grid), each with a `text-label uppercase tracking-wide opacity-70` micro-label (same treatment `ResultsSection` uses for its stat labels) above `text-body` content. `timeline`'s value line only (not its label) may use `text-primary font-semibold` to give it the same accent-highlight treatment as a KPI, since "how long this takes" is the detail visitors scan for first — but do not apply `text-display`/`text-heading` sizing to it (it is a short phrase, not a number, so it does not qualify for the metric-dominance treatment).

Register additively in `src/collections/Pages/index.ts` `blocks:` array and `src/blocks/RenderBlocks.tsx` `blockComponents` map (`serviceScopeCard: ServiceScopeCardComponent`), exactly like every prior gap-fill block (`AboutSection`, `TestimonialSection`, `ServicesShowcase`) was registered. Additive migration only (`CREATE TABLE`-shape) — safe to run without Juan's named approval per the project's DB-safety rule, but still generate with `payload migrate:create` and read the SQL before applying.

---

## New Block 2: Related Case Study (`relatedCaseStudyBlock`)

**Decision:** new Payload block, deliberately generic (per CONTEXT.md: "el componente que renderiza esta sección debe ser genérico... para no bloquear que en el futuro se agreguen más case studies y sí se pueda filtrar por `services[]` real"). Today it always resolves to the single real case study; the schema must not hardcode that assumption.

**Config shape** (`src/blocks/RelatedCaseStudyBlock/config.ts`):

```
slug: 'relatedCaseStudyBlock'
fields:
  - title (text, localized, optional — defaults to "Un caso real de cómo trabajo"/"A real example of how I work")
  - framingText (textarea, localized, optional) — the honest-framing sentence, editorial, e.g.
    "No tengo un caso publicado específico de [service] todavía, pero así es como
    trabajo con clientes reales:" — written per-landing in the seed data, NOT a
    single hardcoded string in the component (each of the 4 landings phrases
    this slightly differently, humanized individually)
  - caseStudy (relationship to 'case-studies', hasMany: false, required: false)
    — if empty, component falls back to payload.find({collection:'case-studies',
    limit:1, sort:'-createdAt'}) so the block never renders empty once at least
    one case study exists; if zero case studies exist, component returns null
    (same guard pattern as ClientLogosBlockComponent)
```

**Visual treatment:** reuse `CaseStudyCard` component as-is (`src/components/CaseStudyCard.tsx` — client name, title, sector, `heroMetric` in the `text-primary` accent treatment) inside this block's own `Container`. Above the card: `title` as `font-heading text-heading`, then `framingText` as `text-body text-muted-foreground italic` (the `italic` + `muted-foreground` pairing signals "context/caveat" the same way `TestimonialSection`'s blockquote styling signals "quoted voice" — a deliberate, already-established pattern for secondary-register copy, not a new treatment). Do not build a bespoke card layout — `CaseStudyCard` already renders exactly the fields available (`heroMetric`, `sector`, `client.name`, `title`) and linking to `/case-studies/[slug]` is exactly the "Ver el caso completo" CTA requirement, so no extra link/button is needed inside the card itself.

Register additively, same protocol as Scope Card above.

---

## Regression Guardrails (SVCPOL-09, non-visual but binds this spec)

- `Hero` block's `variant`, `title`, `subtitle`, `breadcrumbs` props and component internals: **zero changes**. The H1 and the `BreadcrumbList`/`Person` JSON-LD from Phases 22/23 read from this same Hero data — do not touch `src/blocks/Hero/Component.tsx`.
- `Content`, `FAQ`, `CallToAction` block configs/components: **zero changes** — this phase only changes *how many times* and *where* they're placed in each landing's layout array, and what copy is fed into their existing fields. No new fields on these three blocks.
- `ClientLogosBlock`, `TestimonialsCarousel`: **zero changes** — reused exactly as configured on Home (empty `clients`/default `limit`).
- Two genuinely new blocks only: `ServiceScopeCard`, `RelatedCaseStudyBlock` — both additive migrations, both following the `reapplyIds()` locale-safety pattern when seeded.
- Baseline capture (Lighthouse mobile + H1/JSON-LD snapshot for all 8 URLs) happens before any of the above lands, per CONTEXT.md — this UI-SPEC does not change that testing protocol, only the visual contract being tested against.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|--------------|
| shadcn official | `Card`, `CardContent`, `Button` (all already installed, `src/components/ui/`) | not required — already vetted in Phase 8 |
| Third-party | none | not applicable |

No new shadcn component install, no new registry. Icons (if used inside Scope Card, e.g. a small check/clock glyph next to `timeline`) come from the already-installed `lucide-react` package, same import pattern as `AboutSection`/`ContactFormBlock`.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PENDING
- [ ] Dimension 2 Visuals: PENDING
- [ ] Dimension 3 Color: PENDING
- [ ] Dimension 4 Typography: PENDING
- [ ] Dimension 5 Spacing: PENDING
- [ ] Dimension 6 Registry Safety: PENDING

**Approval:** pending
