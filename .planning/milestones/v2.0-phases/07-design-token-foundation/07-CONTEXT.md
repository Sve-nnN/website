# Phase 7: Design-Token Foundation - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning
**Mode:** Infrastructure phase (design-token/CSS foundation, no user-facing content decisions — research already covered the design direction in `.planning/research/SUMMARY.md` and `.planning/research/ARCHITECTURE.md`'s v1.1 addendum)

<domain>
## Phase Boundary

El sitio tiene una capa de tokens de elevación y timing CSS-puro que hoy no existe, más una paleta dark-mode branded (ember/navy), disponibles para que toda restauración visual posterior componga sobre ellos sin reinventar valores por bloque.

</domain>

<decisions>
## Implementation Decisions

### Scope discipline (from milestone-level discuss)
- NO motion/animation JS library (no `motion`/Framer Motion, no `embla-carousel-react`) — this phase and the whole milestone are CSS-only for timing/transitions. Motion/animation work was explicitly deferred by Juan to a future milestone.
- NO visible dark-mode toggle UI — this phase only fixes the `.dark` CSS variable set so it's ember/navy-branded instead of generic shadcn gray. No toggle component, no `next-themes` wiring beyond what may already exist for the `.dark` class mechanism itself.
- Color/typography/spacing values are LOCKED by `.planning/phases/05-frontend-pages/05-UI-SPEC.md` — do not reopen those decisions. This phase only ADDS two genuinely new token categories (shadow/elevation, motion timing) and FIXES the existing `.dark` block's color values to derive from the already-decided light palette (navy/off-white/ember), not invent a new dark palette from scratch.

### Token architecture
- Follow the existing two-tier pattern already used in this codebase (confirmed in research/ARCHITECTURE.md's v1.1 addendum): CSS custom properties in `src/app/globals.css` → `tailwind.config.ts theme.extend` mapping → Tailwind utility classes. Do NOT introduce CSS Modules or a second styling paradigm (the sibling `auditor` project's `tokens.css`/CSS-Modules pattern was evaluated in research and explicitly rejected as unnecessary for this milestone's 4-color palette).
- New primitives needed: `--shadow-sm/md/lg/focus`, `--motion-fast/base/slow`, `--ease-out/standard` (or equivalent easing curve names) — exact naming at Claude's discretion following the existing token naming convention in `globals.css`.
- Global `prefers-reduced-motion: reduce` media query rule required — must neutralize any existing or future CSS transition, not just newly-added ones.

### Dark mode contrast verification
- WCAG contrast on the new dark token set must be verified as part of THIS phase's own closing verification, not deferred to Phase 11's cross-cutting pass (per ROADMAP success criterion #4). This is a real, checkable requirement — do not skip it.

### Claude's Discretion
- Exact shadow/motion token values (px/ms/curve numbers) — inform by common Tailwind/shadcn conventions and the existing spacing rhythm already in `05-UI-SPEC.md`, since no specific values were dictated by research or Juan.
- Exact dark-mode OKLCH/HSL values for the ember/navy palette — derive systematically from the light-mode values already in `globals.css` (same hue family, adjusted lightness/chroma for dark-surface legibility), verified by contrast checker before closing the phase.

</decisions>

<code_context>
## Existing Code Insights

- `src/app/globals.css` — current source of truth for CSS custom properties (confirmed by research: has a light-mode ember `#FF5B1F`/navy `#12141C` palette, but the `.dark` block still carries generic shadcn gray/OKLCH defaults, never received the branded palette).
- `tailwind.config.ts` — maps CSS vars to Tailwind's `theme.extend` (color, but no `boxShadow`/`transitionDuration`/`transitionTimingFunction` extensions yet for the new token categories).
- `tailwindcss-animate@1.0.7` already installed and correctly matched to this project's Tailwind v3.4.19 — do not touch/upgrade, do not add `tw-animate-css` (that's Tailwind v4-only and would break this project).
- No `--shadow-*` tokens exist anywhere in the codebase today (confirmed by direct grep in research).
- Sibling reference project `/Users/juan/Documents/Codigo/Personal/juantech/auditor/apps/web/app/tokens.css` — useful for primitives→semantic-token naming DISCIPLINE only (not for its dark-first lime-accent color direction, which doesn't apply here), and not for its CSS-Modules consumption pattern (this project stays 100% Tailwind utility classes).

</code_context>

<specifics>
## Specific Ideas

None beyond the locked decisions above — this is a foundational, low-ambiguity technical phase informed directly by `.planning/research/SUMMARY.md` and `.planning/research/ARCHITECTURE.md`.

</specifics>

<deferred>
## Deferred Ideas

- Motion/animation libraries (`motion`, `embla-carousel-react`) and any carousel/scroll-reveal work — deferred to a future milestone per Juan's explicit milestone-level decision.
- Visible dark-mode toggle UI — deferred; this phase only fixes the underlying token values.

</deferred>
