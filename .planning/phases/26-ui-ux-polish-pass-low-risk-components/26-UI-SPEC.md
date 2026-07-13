---
phase: 26
slug: ui-ux-polish-pass-low-risk-components
status: draft
shadcn_initialized: true
preset: "style: new-york, baseColor: neutral, cssVariables: true, iconLibrary: lucide"
created: 2026-07-13
---

# Phase 26 — UI Design Contract: UI/UX Polish Pass — Low-Risk Components

> Visual and interaction contract for CTA strip, `SiteHeader`, FAQ, `ClientLogosBlock`, `TestimonialsCarousel`, and Case Studies breadcrumbs (listing + detail). This is **polish on an established design system** (Phases 7/8/9/10, confirmed again in v1.5's 25-UI-SPEC.md) — no new visual language, no new tokens, no new npm dependency, no motion/animation (that's Phase 27-28). Every value below is a direct read of an existing token or a composition of existing components.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (already initialized — `components.json` present, unchanged this phase) |
| Preset | `style: new-york`, `baseColor: neutral`, `cssVariables: true`, prefix none |
| Component library | Radix primitives via shadcn (`Card`, `Button`, `NavigationMenu`, `Sheet`, `Separator` already in `src/components/ui/`) |
| Icon library | `lucide-react` (already in use across the codebase — this phase's only new icon usage is `Plus`/`X` for FAQ, both already-available lucide icons, no install) |
| Font | `font-sans` (Geist, body) / `font-heading` (Khand, H2-H4/nav) / `font-display` (Array, H1 only) — set sitewide, do not override per-block |

No new npm dependency, no new shadcn component install required for this phase. Every component below is a Tailwind/JSX edit to an existing file plus one pure-function extension to `src/lib/breadcrumbs.ts`.

---

## Spacing Scale

Declared values (must be multiples of 4) — unchanged sitewide scale:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px (`p-1`) | Icon gaps, glyph padding |
| sm | 8px (`p-2`) | Compact element spacing, edge-fade width base |
| md | 16px (`p-4`) | Default element spacing, `Container` horizontal padding (mobile) |
| lg | 24px (`p-6`) | `Container` horizontal padding (md+), FAQ item horizontal padding |
| xl | 32px (`p-8`) | Layout gaps, edge-fade width (`w-8`) on testimonials scroll affordance |
| 2xl | 48px (`p-12`) | Major section breaks — `FAQComponent`/`ClientLogosBlockComponent`/`TestimonialsCarouselComponent` already use `py-12`, unchanged |
| 3xl | 64px (`p-16`) | Page-level spacing — `CallToAction` already uses `py-16 md:py-20` on its inner content, unchanged |

Exceptions for this phase: none. Every fix below reuses an existing spacing value already present in the touched file — no new spacing scale value is introduced anywhere in this phase.

---

## Typography

Unchanged, sitewide 4-size scale:

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px (`text-body`) | 400 | 1.5 |
| Label | 14px (`text-label`) | 600 | 1.4 |
| Heading | clamps 22px→28px (`text-heading`) | 600 | 1.2 |
| Display | clamps 36px→56px (`text-display`) | 600 | 1.05 |

Rules for this phase:
- FAQ question text stays `font-sans font-semibold text-body` (unchanged) — the grouping treatment is a container/border change, not a type-scale change.
- Case Studies breadcrumb trail (both listing and detail) uses `text-sm` exactly like `Hero`'s existing breadcrumb nav (`src/blocks/Hero/Component.tsx` line 49: `text-sm text-secondary-foreground/70`) — `text-sm` here is Tailwind's raw `0.875rem` utility, the same value as the `label` token but intentionally kept as the literal Hero precedent rather than swapped to `text-label` (which also carries `font-weight:600` — breadcrumbs must stay visually secondary/lightweight, not semi-bold).
- `SiteHeader` nav item text stays `text-body` (unchanged) for both idle and active states — active state is communicated via color/border, never via a type-scale or weight change (weight changes on hover/focus would cause layout shift in the nav bar, an explicit anti-pattern here).
- No new typography role introduced anywhere in this phase.

---

## Color

Unchanged sitewide tokens (`src/app/globals.css` `:root` — confirmed again: `[locale]/layout.tsx` sets no `dark` className, site renders in **light mode only**, "navy/ember" branding lives in `--secondary`/`--primary` token values, not a dark-theme toggle).

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--background` `#FAFAF7` (off-white) | Page background, FAQ section background, testimonials/client-logos section background — unchanged, no override |
| Secondary (30%) | `--secondary` `#12141C` (navy) | `SiteHeader` background (idle and scrolled), `CallToAction` background (via `HeroGrainGradient variant="cta"`), Case Studies hero section background (both listing top strip — new — and existing detail hero) |
| Accent (10%) | `--primary` `#F7581E` (ember) | Reserved for: FAQ toggle glyph (`text-primary`, existing pattern, unchanged), `SiteHeader` active-route indicator (underline + text color), `SiteHeader` CTA button fill (existing `Button` default variant, unchanged) |
| Destructive | `--destructive` `#DC2626` | Not applicable — this phase has no destructive actions (all 5 touched components are read-only marketing/navigation surfaces) |

Accent reserved for (explicit, non-negotiable list for this phase): the FAQ `+`/`×` toggle glyph (unchanged from today), the active-nav-item underline + text color in `SiteHeader`, and the existing CTA button in `SiteHeader`/`CallToAction`. Nothing else gains ember in this phase — specifically: client logos stay grayscale→full-color on hover (no ember tint), testimonial cards stay `bg-card`/neutral (no ember border), breadcrumb links stay `text-secondary-foreground/70` → `hover:text-secondary-foreground` (white-on-navy, never ember-on-navy — ember-on-navy at small `text-sm` size risks contrast failure and is not how Hero's existing breadcrumb link already behaves).

`SiteHeader` scrolled state uses `bg-secondary/95` (95% opacity of the same navy token, not a new color) — verified safe: `--secondary-foreground` (`#FAFAF7`, near-white) against `--secondary` at 95% opacity composited over any page background stays effectively identical to 100% opacity for contrast purposes (the 5% transparency is a backdrop-blur visual cue, not a contrast-relevant change).

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Not applicable — this phase adds no new CTA copy. Existing CTA labels (`CallToAction` links, `SiteHeader.ctaButton`) are structural/layout fixes only, copy untouched. |
| Empty state | Not applicable to the 5 in-scope components except Case Studies listing, which already has a real empty state (`"Próximamente" / "Estamos preparando nuevos casos de éxito. Vuelve pronto."` — `case-studies/page.tsx` lines 41-48) — **do not touch this copy**, it is out of this phase's scope (component polish only, copy humanization is Phase 30-31). |
| Error state | Not applicable — no forms, no client-side data fetching introduced by this phase. |
| Destructive confirmation | Not applicable — no destructive actions in any of the 5 touched components. |
| Breadcrumb labels (Case Studies, ES) | "Inicio" (home) → "Casos de éxito" (index) → `{doc.title}` (detail, already-existing localized field, unchanged) |
| Breadcrumb labels (Case Studies, EN) | "Home" → "Case Studies" → `{doc.title}` |

No new user-facing copy is introduced by this phase beyond the two breadcrumb section labels above, which mirror strings **already live** in `case-studies/[slug]/page.tsx`'s hand-rolled `copy` object (`t.home`/`t.caseStudies`, lines 49-66) — reuse those exact strings when extending `breadcrumbs.ts`, do not invent new wording. No humanizer pass is required for this phase (no new/rewritten copy strings — pure structural/visual/labeling reuse of already-shipped strings).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|--------------|
| shadcn official | `Card`, `CardContent`, `Button`, `NavigationMenu`, `NavigationMenuItem`, `NavigationMenuLink`, `NavigationMenuList`, `Sheet`, `SheetContent`, `SheetTrigger`, `Separator` (all already installed, `src/components/ui/`) | not required — already vetted in Phase 8 |
| Third-party | none | not applicable |

No new shadcn component install, no new registry, no new npm package. `lucide-react`'s `Plus`/`X` icons (used for the FAQ glyph swap, see below) are already an installed dependency, same import pattern as every other lucide usage in the codebase.

---

## Component 1: CTA Strip Container Fix (UIPOL-01)

**Root cause** (confirmed by direct read of `src/blocks/CallToAction/Component.tsx`): the outer `<section>` carries card styling (`rounded-2xl shadow-xl ring-1 ring-white/10`) and the `HeroGrainGradient`/gradient-overlay backgrounds, but has **no `Container` wrapper** — it renders edge-to-edge (`vw`-wide) with rounded corners, so the corners touch the viewport edge and the shape reads as broken.

**Exact fix:**

```tsx
export function CallToActionComponent(props: CallToActionBlockProps) {
  const { richText, links } = props

  return (
    <Container className="py-12 md:py-16">
      <section className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10">
        <HeroGrainGradient variant="cta" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/10"
          aria-hidden="true"
        />
        <div className="relative z-10 py-16 md:py-20 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12 text-center md:text-left">
          <div className="flex-1 max-w-xl">
            <RichTextRenderer data={richText} className="text-secondary-foreground" />
          </div>
          {links && links.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              {links.map(({ link }, i) => (
                <div key={i} className="w-full sm:w-auto">
                  <CMSLink {...link} className="w-full sm:w-auto" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Container>
  )
}
```

Key structural points (binding, not optional):
- The **outer** wrapper is now `Container` (2xl `py-12 md:py-16` spacing token, matching every other block's page-level rhythm — `FAQComponent`/`ClientLogosBlockComponent`/`TestimonialsCarouselComponent` all use `py-12`, this uses `py-12 md:py-16` because the card itself already has its own internal `py-16 md:py-20`, giving comfortable breathing room around the card without doubling the 3xl token).
- The **card** (`rounded-2xl shadow-xl ring-1 ring-white/10`, `HeroGrainGradient`, gradient overlay) moves to the inner `<section>`, now correctly bounded by `Container`'s `max-w-6xl` — this is what makes the rounded corners read as an intentional card shape instead of a layout bug.
- The former inner `Container` (which held `relative z-10 py-16 md:py-20 flex ...`) becomes a plain `<div>` with the same classes minus the width constraint — nesting a second `Container` inside the new outer `Container` would apply `max-w-6xl px-4 md:px-6` twice, redundantly narrowing the card's content further than intended. Only one `Container` in the tree for this block.
- `bg`/`shadow`/`ring` classes are preserved verbatim (`rounded-2xl shadow-xl ring-1 ring-white/10`) — this phase does not restyle the card's visual treatment, only its width/positioning context, per CONTEXT.md's explicit instruction ("manteniendo el fondo/sombra del card").

---

## Component 2: SiteHeader — Scroll State + Active Route (UIPOL-02)

CONTEXT.md leaves "scroll state and/or active-route" to discretion. **Decision: implement both** — both are LOW-MEDIUM cost per FEATURES.md, they compose naturally (both are nav-bar-level interactivity), and ROADMAP's success criterion #2 is satisfied more completely by both together than by either alone.

### 2a. Scroll-state treatment

| State | Classes |
|-------|---------|
| Idle (`scrollY <= 8`) | `bg-secondary shadow-md` (current, unchanged) |
| Scrolled (`scrollY > 8`) | `bg-secondary/95 backdrop-blur-sm shadow-lg` |

Both states keep `sticky top-0 z-50 text-secondary-foreground border-b border-border/20`. Transition: extend the header's existing `transition-shadow duration-base ease-standard` to `transition-[background-color,box-shadow] duration-base ease-standard` so both the opacity/blur cue and the shadow intensify smoothly using the already-established Phase 7 motion tokens (`--duration-base`, `--ease-standard`) — **no new motion token, no animation library**, this is the same class of CSS transition the nav underline hover already uses. `prefers-reduced-motion` (Phase 7 global rule) already neutralizes this transition for users who request it; the end-state classes still apply instantly, so the scroll-state signal itself is preserved, only the smoothing is removed — correct behavior, not a regression.

Threshold: `8px`, not `0px` — avoids flickering the state on sub-pixel scroll jitter (trackpads/mobile momentum scroll) right at the top of the page.

### 2b. Active-route indicator

Extend the nav item's **existing** hover-underline pattern (`border-b-2 border-transparent hover:border-primary hover:text-primary`) to also apply **persistently** when the item's URL matches the current route — not just on hover.

| State | Classes |
|-------|---------|
| Default (inactive) | `border-b-2 border-transparent` (current) |
| Hover/focus (unchanged) | `hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary` |
| Active route | `border-primary text-primary` (same classes hover already applies, now persistent) + `aria-current="page"` |

Match rule: exact pathname match after stripping locale prefix and trailing slash (e.g. `/servicios/seo-tecnico` active only on that exact route, not a prefix match against `/servicios` — a prefix match would incorrectly highlight "Servicios" while on every individual service landing simultaneously with a child page, which is not the intent here; this phase's nav items are top-level single links, not a nested tree, so exact match is sufficient and simpler).

Apply identically to both the desktop `NavigationMenuLink`/`CMSLink` and the mobile `Sheet` nav links — same active-state classes, same `aria-current` attribute, in both locations.

**Implementation note (non-binding, for plan-phase):** both behaviors require client-side JS (`window.scrollY` listener, `usePathname()`), while `SiteHeader` itself is an async Server Component (fetches the `header` global via Local API). The cleanest split — evaluate exact shape in plan-phase — is extracting the nav-rendering + `<header>` element itself into a small client subcomponent (e.g. `SiteHeaderChrome`) that receives `navItems`/`ctaButton`/`logo`/`locale` as already-resolved props from the server `SiteHeader`, and owns the `useState`+scroll-listener and `usePathname()` internally. No new global state, no new library — same pattern already used elsewhere in the codebase for the `prefers-reduced-motion` SSR-safe hook precedent (`HeroGrainGradient`).

---

## Component 3: FAQ Visual Grouping (UIPOL-04)

**Current:** flat `divide-y divide-border` list of `<details>` — functionally correct (native accessibility, keyboard/screen-reader friendly, no JS), visually template-default.

**Fix:** replace the flat divided list with a stack of individually-bordered, elevated items — same native `<details>`/`<summary>`, no interaction-model change (per CONTEXT.md and FEATURES.md's explicit anti-feature warning against introducing a JS/Radix accordion for this).

```tsx
<div className="space-y-3">
  {faqs?.map((item, i) => (
    <details key={i} className="group rounded-lg border border-border bg-card px-6 shadow-sm hover:shadow-md transition-shadow duration-base ease-standard">
      <summary className="cursor-pointer font-sans font-semibold text-body list-none flex items-center justify-between py-4">
        {item.question}
        <Plus className="ml-4 size-5 text-primary transition-transform duration-fast ease-out group-open:rotate-45" aria-hidden="true" />
      </summary>
      <div className="pb-4">
        <RichTextRenderer data={item.answer} />
      </div>
    </details>
  ))}
</div>
```

Key points:
- `space-y-3` (sm+xs composite, effectively 12px — closest standard Tailwind step to a card-gap smaller than `md`/16px; acceptable as the one minor exception since `space-y-2`/8px reads too tight between bordered cards and `space-y-4`/16px reads too loose for 5 short FAQ items — still a value from the standard Tailwind spacing scale, not a custom pixel value) between items, replacing `divide-y`.
- Each item: `rounded-lg border border-border bg-card shadow-sm`, with `hover:shadow-md` (same elevation-on-hover precedent as `PostCard`/`CaseStudyCard` from Phase 10) — signals "this is an interactive card," reinforcing the native `<details>` affordance visually.
- Glyph swaps from a bare `+` text character to the lucide `Plus` icon (`text-primary`, matches the already-reserved accent usage for this exact element per the Color Contract above) — same `group-open:rotate-45` rotation behavior as today (45° rotation turns a `+` glyph into a visual `×`), just rendered as a crisp SVG icon instead of a text glyph for pixel consistency with the rest of the icon system (`lucide-react` is already the sitewide icon library — a bare `+` character was the one place still using a raw text glyph instead of an icon).
- Padding moves from the outer `Container` handling all spacing to `px-6` (lg/24px) on each `<details>` plus `py-4`/`pb-4` (md/16px) on `summary`/answer — reuses existing Card-family padding values, no new spacing value.
- `title` heading (`font-heading text-heading mb-6`) is unchanged.

---

## Component 4: ClientLogosBlock — Logo Scale Normalization (UIPOL-05)

**Current:** every logo forced into a fixed `120×48` box via `next/image` `width`/`height` props, regardless of native aspect ratio — `object-contain` prevents distortion but does not prevent visual-weight inconsistency (a near-square logo and a wide horizontal wordmark both get boxed into the same 120×48 frame, so the square one renders much smaller inside its box than the wide one).

**Fix:** normalize apparent height instead of forcing a fixed box — wrap each logo in a fixed-height flex cell and let width flow naturally.

```tsx
<div className="flex flex-wrap items-center justify-center gap-8">
  {logos.map((client) => {
    const logo = typeof client.logo === 'object' ? client.logo : null
    if (!logo?.url) return null

    const image = (
      <div className="flex h-10 md:h-12 items-center">
        <Image
          src={logo.url}
          alt={logo.alt ?? client.name}
          width={160}
          height={48}
          className="h-full w-auto max-w-[140px] object-contain grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-base ease-standard"
        />
      </div>
    )
    // ... unchanged wrapping <a>/<div> logic
  })}
</div>
```

Key points:
- Outer `<div className="flex h-10 md:h-12 items-center">` gives every logo the same **height** baseline (40px mobile, 48px desktop — both existing values, `h-10`/`h-12` are standard Tailwind steps already used elsewhere) — this is what actually equalizes visual weight, since logos read at comparable scale when their height matches, not when they're boxed into an identical width×height rectangle.
- `Image` keeps `width`/`height` props (Next.js requires them for layout-shift prevention) but the rendered size is overridden by `h-full w-auto max-w-[140px]` — `h-full` fills the fixed-height parent, `w-auto` preserves native aspect ratio, `max-w-[140px]` caps an unusually wide wordmark from dominating the row (one exception value, justified: it is a `max-width` safety cap, not a spacing-scale value, so it is not subject to the 4px-multiple spacing rule — same category of exception as `CallToAction`'s `max-w-xl`/`max-w-2xl` elsewhere in the codebase).
- `grayscale opacity-70 hover:opacity-100 hover:grayscale-0` hover treatment is unchanged (already the correct micro-interaction per FEATURES.md) — only `transition-all` gains explicit `duration-base ease-standard` to use the established motion tokens instead of Tailwind's default transition timing.
- No marquee, no auto-scroll — explicitly rejected per FEATURES.md's anti-feature list (accessibility/CWV risk, conflicts with `prefers-reduced-motion` intent).

---

## Component 5: TestimonialsCarousel — Scroll Affordance (UIPOL-06)

**Current:** `overflow-x-auto` scroll-snap row with zero visual hint that more content exists beyond the first viewport — a deliberate lightweight choice (no `embla-carousel-react`, per the project's explicit CWV guardrail), but missing the one polish signal a scroll-snap row needs.

**Fix:** CSS-only edge-fade affordance, no new JS, no carousel library.

```tsx
<div className="relative">
  <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
    {/* unchanged testimonial Card.map(...) */}
  </div>
  <div
    className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
    aria-hidden="true"
  />
</div>
```

Key points:
- Single fade on the **right** edge only (not both edges) — the row starts fully scrolled-left with nothing to hint on that side; a right-edge fade communicates "more content this way" without visually implying content is cut off on the left when the user hasn't scrolled yet. If plan-phase execution finds the row can start mid-scroll on some locales/viewports, add a symmetric left-edge fade (`inset-y-0 left-0 bg-gradient-to-r`) gated on scroll position — otherwise the single right-edge fade is sufficient and simpler.
- `w-8` (xl/32px token) width, `pointer-events-none` (so the fade never blocks drag/scroll interaction), `from-background to-transparent` — uses the page's actual background token so the fade blends seamlessly regardless of what's behind the section.
- No dot indicators, no prev/next buttons — explicitly out of scope per CONTEXT.md (interaction-model unchanged) and FEATURES.md's anti-feature guidance (a heavier carousel control set for 8 cards is disproportionate).

---

## Component 6: Case Studies Breadcrumbs (UIPOL-09)

### Decision: generalize `buildTrail()` internally, add a sibling export — zero regression risk to Services

Per CONTEXT.md's explicit discretion point, and to avoid duplicating URL/locale logic across two near-identical functions: refactor `src/lib/breadcrumbs.ts` to extract a generic internal `buildSectionTrail()`, keep `buildTrail()` as a **thin, byte-for-byte-compatible wrapper** around it (so the 4 existing Services call sites — `servicios/page.tsx`, `servicios/[slug]/page.tsx`, `services/page.tsx`, `services/[slug]/page.tsx` — require zero changes), and add a new sibling export `buildCaseStudiesTrail()` for the two Case Studies pages.

```ts
// src/lib/breadcrumbs.ts

type Section = 'services' | 'case-studies'

const SECTION_LABELS: Record<Section, Record<Locale, string>> = {
  services: { es: 'Servicios', en: 'Services' },
  'case-studies': { es: 'Casos de éxito', en: 'Case Studies' },
}

// Case Studies routes are NOT locale-prefixed in their segment (confirmed:
// src/app/(frontend)/[locale]/case-studies/page.tsx serves both /case-studies
// and /en/case-studies under the same folder name) — unlike Services, which
// has a genuinely different Spanish segment ('servicios' vs 'services').
const SECTION_SEGMENTS: Record<Section, Record<Locale, string>> = {
  services: { es: 'servicios', en: 'services' },
  'case-studies': { es: 'case-studies', en: 'case-studies' },
}

function sectionIndexHref(locale: Locale, section: Section): string {
  const home = homeHref(locale)
  return `${home === '/' ? '' : home}/${SECTION_SEGMENTS[section][locale]}`
}

function buildSectionTrail(
  locale: Locale,
  section: Section,
  current?: { slug: string; title: string },
): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [
    { label: LABELS[locale].home, url: homeHref(locale) },
    { label: SECTION_LABELS[section][locale], url: sectionIndexHref(locale, section) },
  ]

  if (current) {
    trail.push({
      label: current.title,
      url: `${sectionIndexHref(locale, section)}/${current.slug}`,
    })
  }

  return trail
}

export function buildTrail(locale: Locale, current?: { slug: string; title: string }): BreadcrumbItem[] {
  return buildSectionTrail(locale, 'services', current)
}

export function buildCaseStudiesTrail(locale: Locale, current?: { slug: string; title: string }): BreadcrumbItem[] {
  return buildSectionTrail(locale, 'case-studies', current)
}

// buildBreadcrumbJsonLd() is unchanged — already generic, takes a trail, not a section.
```

This satisfies CONTEXT.md's constraint verbatim ("sin duplicar la lógica de URL/locale") — `homeHref()`, `buildBreadcrumbJsonLd()`, and the trail-array shape are shared, only the per-section label/segment lookup is new. `LABELS`/`LABELS[locale].home` (the existing home-only labels object) stays as-is; `SECTION_LABELS` is additive.

### Exact trail structure

| Page | Trail |
|------|-------|
| Case Studies listing (`/case-studies`, `/en/case-studies`) | `Inicio > Casos de éxito` (2 levels) — ES; `Home > Case Studies` (2 levels) — EN |
| Case Studies detail (`/case-studies/[slug]`, `/en/case-studies/[slug]`) | `Inicio > Casos de éxito > {doc.title}` (3 levels) — ES; `Home > Case Studies > {doc.title}` (3 levels) — EN |

### Wiring: JSON-LD (both pages)

Replace the case-study detail page's hand-rolled `breadcrumbData` object (lines 93-101 of `case-studies/[slug]/page.tsx`) with the shared helper — same pattern already proven on Services:

```tsx
import { buildCaseStudiesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
// ...
const trail = buildCaseStudiesTrail(locale as 'es' | 'en', { slug: doc.slug ?? slug, title: doc.title })
// ...
<JsonLd data={buildBreadcrumbJsonLd(trail)} />
```

Add the equivalent (2-level, no `current`) to the listing page, which today emits **no** `BreadcrumbList` JSON-LD at all:

```tsx
import { buildCaseStudiesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
// ...
const trail = buildCaseStudiesTrail(locale as 'es' | 'en')
// ...
<JsonLd data={buildBreadcrumbJsonLd(trail)} />
```

### Wiring: visual `<nav>` (both pages)

**Neither Case Studies page renders through the `Hero` block** (both hand-roll their own hero/heading markup directly in `page.tsx` — confirmed by direct read; Services' breadcrumb-via-`blockProps={{ hero: { breadcrumbs: trail } }}` pattern does not apply here, and this phase explicitly does **not** touch `Hero/Component.tsx` or introduce a `case-study-header`/`listing` variant change — that's Phase 28's Hero-variant-differentiation work). Insert a standalone breadcrumb `<nav>` directly into each page, reusing the exact JSX/class pattern `Hero/Component.tsx` already uses for its own breadcrumb nav (lines 48-63), so the visual language matches Services' breadcrumb exactly even though the markup lives in a different file.

**Detail page** — insert inside the existing hero `<section className="relative bg-secondary text-secondary-foreground">`, inside its `Container`, above the client/sector/period metadata row (same navy background as Hero's own breadcrumb, so reuse `text-secondary-foreground/70` exactly):

```tsx
<Container className="py-8">
  <nav aria-label="Breadcrumb" className="mb-4">
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary-foreground/70">
      {trail.map((crumb, i) => {
        const isLast = i === trail.length - 1
        return (
          <li key={i} className="flex items-center gap-x-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {isLast ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link href={crumb.url} className="hover:text-secondary-foreground underline-offset-2 hover:underline">
                {crumb.label}
              </Link>
            )}
          </li>
        )
      })}
    </ol>
  </nav>
  {/* existing client/sector/period row, h1, subtitle, heroMetric — unchanged */}
</Container>
```

**Listing page** — the page background here is `--background` (off-white), not navy (no hero band today — the page is a plain `<h1>` inside `Container className="py-16"`), so the breadcrumb nav uses the light-surface equivalent (`text-muted-foreground`, matching how breadcrumb-style secondary text renders elsewhere on light backgrounds):

```tsx
<Container className="py-16">
  <nav aria-label="Breadcrumb" className="mb-4">
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      {trail.map((crumb, i) => {
        const isLast = i === trail.length - 1
        return (
          <li key={i} className="flex items-center gap-x-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {isLast ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link href={crumb.url} className="hover:text-foreground underline-offset-2 hover:underline">
                {crumb.label}
              </Link>
            )}
          </li>
        )
      })}
    </ol>
  </nav>
  <h1 className="font-display text-display">
    {/* unchanged */}
  </h1>
  {/* unchanged */}
</Container>
```

Both insertions reuse `buildCaseStudiesTrail()`'s already-computed `trail` array (same variable feeds both the JSON-LD call and the visual `<nav>` — never re-derive labels/URLs inline in the page, per `breadcrumbs.ts`'s own header-comment contract, which this phase must continue honoring).

---

## Regression Guardrails

- `CallToAction`'s `config.ts` (schema): **zero changes** — this is a render-only fix, no field added/removed.
- `SiteHeader`'s data-fetching (`payload.findGlobal('header', ...)`, `normalizeServiceHref` locale-fix): **zero changes** — only the rendering/interactivity layer is touched.
- `FAQ`'s `config.ts` (schema) and native `<details>`/`<summary>` accessibility semantics: **zero changes** — visual container only, no interaction-model change (per CONTEXT.md and FEATURES.md's anti-feature warning).
- `ClientLogosBlock`'s data-fetching/fallback logic (`clients` prop vs `payload.find('clientes')` fallback): **zero changes** — only the per-logo sizing markup is touched.
- `TestimonialsCarousel`'s data-fetching, locale-title-fallback fix (25-REVIEW's non-localized-`title` fix): **zero changes** — only a wrapping `<div>` and one absolutely-positioned fade overlay are added.
- Services' 4 existing pages (`servicios/`, `services/` index + `[slug]`) and their `buildTrail()` call sites: **zero changes required** — `buildTrail()` remains the exact same exported function signature, now implemented via the shared internal `buildSectionTrail()`, fully backward-compatible.
- Case Studies collection schema / `payload-types.ts`: **zero changes** — this phase adds a breadcrumb `<nav>` and a `JsonLd` call to existing pages, no new Payload field.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PENDING
- [ ] Dimension 2 Visuals: PENDING
- [ ] Dimension 3 Color: PENDING
- [ ] Dimension 4 Typography: PENDING
- [ ] Dimension 5 Spacing: PENDING
- [ ] Dimension 6 Registry Safety: PENDING

**Approval:** pending
