# Technology Stack — v1.5 UI/UX Pro Max

**Project:** Juan Carlos Angulo Portfolio (Payload rebuild)
**Milestone:** v1.5 UI/UX Pro Max — Polish y Competitividad
**Researched:** 2026-07-12
**Scope:** Stack additions/changes for a professional UI/UX polish pass (breadcrumbs, service-page layouts, home services showcase). NOT a re-research of backend/CMS/deploy (settled — see `STACK.md`).
**Overall confidence:** HIGH (all versions verified live against npm registry 2026-07-12)

> **File-naming note:** written as `STACK-v1.5.md` (not overwriting the v1 backend `STACK.md`, which CLAUDE.md's stack section derives from). Follows the v1.4 precedent of milestone-suffixed research files.

---

## Headline Recommendation

**Add zero new runtime dependencies for the core of this milestone.** The project already ships a complete, WCAG-audited shadcn/ui-style design system that covers every UI need in the v1.5 goal:

- **Radix primitives** already installed: `avatar`, `dialog`, `navigation-menu`, `select`, `separator`, `slot`, `tabs`
- **Styling toolkit**: `class-variance-authority` (0.7.1), `clsx` (2.1.1), `tailwind-merge` (3.6.0), `tailwindcss-animate` (1.0.7)
- **Icons**: `lucide-react` (1.24.0) — includes every icon needed (`ChevronRight`, `Check`, `X`, `ArrowRight`, etc.)
- **Design tokens**: full CSS-variable system (colors, `--shadow-*`, `--motion-*`, `--ease-*`), plus a 4-size type scale and spacing scale in `tailwind.config.ts`
- **WebGL accent**: `@paper-design/shaders-react` (0.0.77), already the Hero background precedent

The three named capabilities map to patterns that are already in the codebase or are pure HTML+Tailwind:

| Capability | How to build it | New dependency? |
|------------|-----------------|-----------------|
| Breadcrumbs (Services + landings) | shadcn `breadcrumb.tsx` primitive (uses already-installed `@radix-ui/react-slot` + lucide `ChevronRight`) + `BreadcrumbList` JSON-LD via existing `src/components/JsonLd.tsx` | **No** |
| Comparison table (value props) | Native `<table>` + Tailwind + lucide `Check`/`X` + existing `Badge` | **No** |
| Value-prop cards / pricing-free tiers | Existing `Card` primitive + `Badge` + `Button` (CVA variants) | **No** |
| Social proof on service pages | Existing `TestimonialsCarousel` block (native CSS scroll-snap, zero JS) + `ClientLogosBlock` | **No** |
| Sticky CTA | CSS `position: sticky` + existing `CallToAction` block / `Button` | **No** |
| Home services showcase | Existing `Card` grid + lucide icons + `Button`, following `AboutSection`/`FeaturedCaseStudiesBlock` patterns | **No** |
| Scroll-reveal / entrance motion (optional polish) | CSS scroll-driven animations (`animation-timeline: view()`) or `tailwindcss-animate` utilities + `IntersectionObserver` | **No** |

The opinionated call: **the design system is already sufficient. Reach for existing primitives before adding anything.** Every new runtime dependency is a Core Web Vitals liability on a site whose entire value proposition is impeccable performance and SEO.

---

## Recommended Stack (Additions)

### Core Framework — no changes

Stay on the settled versions.

| Technology | Version | Why hold |
|------------|---------|----------|
| `next` | 15.4.11 (installed) | UI polish is orthogonal to framework version; Payload 3.85 targets Next 15. Do not bump for this milestone. |
| `tailwindcss` | 3.4.19 (installed) | **Stay on v3.** Tailwind v4 (4.3.2 live) is a config-and-engine rewrite (CSS-first `@theme`, no `tailwind.config.ts`) — migrating mid-polish churns the entire token system in `tailwind.config.ts` + `globals.css` for zero user-visible benefit and risks the WCAG-audited color work. Out of scope. |
| `lucide-react` | 1.24.0 (installed) | Already the icon source; covers breadcrumb chevrons, check/x for comparison tables, service icons. Add no other icon library. |

### New UI Primitives (copy-in source files, not npm installs)

shadcn/ui components added as **source files** under `src/components/ui/`, composing already-installed dependencies.

| Component | File | Depends on (already installed) | Purpose |
|-----------|------|-------------------------------|---------|
| Breadcrumb | `src/components/ui/breadcrumb.tsx` | `@radix-ui/react-slot`, `lucide-react`, `clsx`/`tailwind-merge` | Accessible breadcrumb nav (`<nav aria-label="breadcrumb">` + ordered list + `aria-current="page"`). Matches the existing shadcn primitive style already in `src/components/ui/`. |

Get the source via the shadcn CLI (writes the file, installs nothing new because deps already exist) or copy from ui.shadcn.com/docs/components/breadcrumb. **Pair it with a `BreadcrumbList` structured-data emit** through the existing `JsonLd` component for the Services page + each landing — competitors surface breadcrumb rich results, and this is the SEO half of the "breadcrumbs" requirement.

**Existing breadcrumb precedent:** the Hero block already has a `breadcrumbs` array field (phase 10.8 — see `src/blocks/Hero/config.ts` + `Component.tsx`). Decide in-phase whether Services reuses the Hero field or gets the standalone `breadcrumb.tsx` primitive — do NOT build a third parallel implementation. Recommendation: standalone primitive for shadcn-convention consistency, wire the JSON-LD there.

### Optional Differentiator (evaluate, don't default-add)

| Library | Version | Purpose | When to add | CWV cost |
|---------|---------|---------|-------------|----------|
| `@number-flow/react` | 0.6.1 | Animated number transitions for KPI/metric counters (case-study "$41K → $76K", service result stats) | ONLY if the design calls for animated stat counters and a CSS/IntersectionObserver count-up feels insufficient | ~6–8KB gz, client component, respects `prefers-reduced-motion`. Not free — a static bold number is zero-cost and often reads as more credible. Default to static; add only if Juan wants the motion. |

---

## What NOT to Add (Core Web Vitals guardrails)

The project has a **hard performance requirement** (Core Value: "Si el rendimiento o el SEO fallan, el sitio no cumple su propósito"). v1.3 explicitly rejected over-budget libraries. Hold that line.

| Avoid | Live version | Why it's a regression risk | Use instead |
|-------|-------------|----------------------------|-------------|
| `framer-motion` / `motion` | 12.42.2 | ~30–60KB gz, hydrates a client runtime, pulls interactivity into otherwise-static RSC pages. Contradicts the CWV budget and RSC-first architecture. v1.3 already rejected JS-animation libs (anime.js) for the Hero. | CSS scroll-driven animations (`animation-timeline: view()`), `tailwindcss-animate` utilities, or a tiny `IntersectionObserver` reveal hook — all near-zero JS. |
| `embla-carousel-react` | 8.6.0 | ~5KB but adds a client component + JS where none is needed. The project **already** does carousels with native CSS scroll-snap (`overflow-x-auto snap-x snap-start`, see `TestimonialsCarousel/Component.tsx`), zero JS. | Reuse the existing CSS scroll-snap pattern for any new horizontal scroller. |
| Second icon library (`react-icons`, `@heroicons/react`, `@tabler/icons`) | — | Duplicates `lucide-react`, bloats the tree, fragments visual consistency. | `lucide-react` (installed) exclusively. |
| Second component kit (MUI, Chakra, Mantine, Ant, Flowbite, DaisyUI, Preline) | — | Collides with the tokenized shadcn/Radix system, ships its own CSS/JS runtime, breaks the dark-mode token contract, and re-introduces the "clutter" this rebuild exists to remove. | The in-repo shadcn primitives + Radix. |
| `@radix-ui/themes` | — | Radix *Themes* (styled kit) is distinct from the unstyled Radix *primitives* already in use; adopting it would fight the existing token system. | Keep composing unstyled `@radix-ui/react-*` primitives with the local Tailwind tokens. |
| Tailwind v4 upgrade | 4.3.2 | Engine + config-format rewrite; churns `tailwind.config.ts` and `globals.css` token definitions mid-polish for no user-facing gain, risks the WCAG audit. | Stay on `tailwindcss@3.4.19`. Its own milestone if ever. |
| `sonner` / `vaul` | 2.0.7 / 1.1.2 | Toasts and drawers aren't in the v1.5 goal (marketing/service polish). Adding patterns the milestone doesn't need is scope creep with a client-JS cost. | Nothing — out of scope. |
| Heavy table libs (`@tanstack/react-table`, AG Grid, MUI DataGrid) | — | Data-grid engines are for sortable/virtualized interactive tables; a static value-comparison table is presentational. | Native `<table>` (or CSS grid) + Tailwind + lucide `Check`/`X`. Semantic, zero JS, best for SEO. |

---

## Integration with Existing Setup

- **Design tokens are the contract.** New components must consume existing CSS variables — `bg-primary`, `text-muted-foreground`, `border-border`, `shadow-md`, `duration-base`, `ease-out` — never hardcoded hex/px. The token layer passed a WCAG AA contrast audit (phase 11); hardcoding colors silently breaks dark mode and the contrast guarantees.
- **Type & spacing scale is fixed** to 4 sizes (`body`/`label`/`heading`/`display`) and a 4px spacing grid (per `05-UI-SPEC.md`). New service-page layouts must use these — no ad-hoc font sizes.
- **Content glob gotcha:** `tailwind.config.ts` content includes `./src/blocks/**` (a phase 10.8 fix). Utilities used only in a new top-level dir not covered by the glob get purged. Keep new components under `src/components/**` or `src/blocks/**`.
- **Motion must respect the global `prefers-reduced-motion` net** in `globals.css` (unscoped; kills animation/transition/scroll-behavior). CSS scroll-driven reveals and `tailwindcss-animate` classes are auto-covered; a JS `IntersectionObserver` reveal must also gate on the media query.
- **RSC-first:** service pages and the home showcase stay Server Components. Opt a leaf into `'use client'` only if it genuinely needs interactivity (e.g. an optional animated counter). Preserves the zero-hydration baseline.
- **JSON-LD path exists:** breadcrumb structured data goes through `src/components/JsonLd.tsx` (used on home/authors/case-studies/blog), which safely `JSON.stringify`s to prevent script injection. Reuse it; don't hand-roll `<script>` tags.

---

## Installation

For the core milestone: **nothing to install.** Add the breadcrumb primitive as a source file:

```bash
# Writes src/components/ui/breadcrumb.tsx; installs no new package
# (deps — @radix-ui/react-slot, lucide-react, clsx, tailwind-merge — already present)
npx shadcn@latest add breadcrumb
```

Only if the design explicitly calls for animated metric counters (evaluate first):

```bash
npm install @number-flow/react@^0.6
```

---

## Alternatives Considered

| Need | Recommended | Alternative | Why not the alternative |
|------|-------------|-------------|-------------------------|
| Breadcrumbs | shadcn `breadcrumb.tsx` (source file, 0 deps) | Radix — no breadcrumb primitive exists | Radix has no breadcrumb; the shadcn pattern is a plain accessible `<nav>`+list. Nothing to install. |
| Horizontal card scroller | Existing CSS scroll-snap pattern | `embla-carousel-react` 8.6.0 | Embla adds client JS for a pattern the repo already solves with zero JS. |
| Entrance/scroll animation | CSS scroll-driven + `tailwindcss-animate` | `motion`/`framer-motion` 12.42.2 | 30–60KB + hydration vs near-zero-cost CSS; CWV budget forbids it. |
| Animated stat counters | Static bold number (default) | `@number-flow/react` 0.6.1 | Static is zero-cost and reads as credible; add motion only on explicit request. |
| Comparison table | Native `<table>` + Tailwind | `@tanstack/react-table` | Grid engines are for interactive/virtualized data; overkill and JS-heavy for a static value table. |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| "Add nothing new" thesis | HIGH | Verified against installed `package.json`, existing `src/components/ui/*` primitives, `tailwind.config.ts` tokens, and existing block patterns (Hero breadcrumb field, CSS scroll-snap carousel). |
| Version numbers | HIGH | Queried live from npm 2026-07-12: `motion` 12.42.2, `embla-carousel-react` 8.6.0, `react-intersection-observer` 10.1.0, `@number-flow/react` 0.6.1, `tailwindcss` 4.3.2, `vaul` 1.1.2, `sonner` 2.0.7. |
| CWV guardrails | HIGH | Grounded in the stated hard performance requirement and the v1.3 precedent of rejecting heavy animation libs. |
| Breadcrumb approach | MEDIUM | Standalone-primitive-vs-reuse-Hero-field is a real in-phase decision; both viable. Flagged, not prescribed. |

## Sources

- npm registry (live, 2026-07-12) — `motion`/`framer-motion` 12.42.2, `embla-carousel-react` 8.6.0, `react-intersection-observer` 10.1.0, `@number-flow/react` 0.6.1, `tailwindcss` 4.3.2, `vaul` 1.1.2, `sonner` 2.0.7 — HIGH
- Project `package.json` (installed deps) — Radix primitives, CVA/clsx/tailwind-merge, `tailwindcss-animate`, `lucide-react` 1.24.0, `@paper-design/shaders-react` 0.0.77, `tailwindcss` 3.4.19 — HIGH
- Project source: `tailwind.config.ts`, `src/app/globals.css` (token system, reduced-motion net, content glob), `src/components/ui/*` (existing primitives), `src/blocks/Hero/config.ts` (existing breadcrumbs field), `src/blocks/TestimonialsCarousel/Component.tsx` (CSS scroll-snap carousel precedent), `src/components/JsonLd.tsx` (safe JSON-LD emit) — HIGH
- ui.shadcn.com — Breadcrumb is a source-file pattern over Radix Slot + lucide, no runtime package — HIGH
