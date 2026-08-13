# Phase 8: shadcn Primitives + Global Chrome - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning
**Mode:** Refinement phase — visual direction is already locked by `05-UI-SPEC.md` and `.planning/research/SUMMARY.md`; this phase executes against already-decided tokens (Phase 7), not new design decisions.

<domain>
## Phase Boundary

Las primitivas shadcn de más alto apalancamiento (consumidas por los 16 bloques) y el chrome global del sitio (header/footer) reflejan los tokens de sombra/motion/dark de Phase 7, estableciendo la base visual sobre la que compone el resto del milestone.

</domain>

<decisions>
## Implementation Decisions

### Scope discipline (carried from milestone-level discuss)
- No new package dependencies — this phase only refines existing `cva()` variants using tokens Phase 7 already added (`--shadow-*`, `--motion-*`, `.dark` palette).
- No motion/animation JS library. No dark-mode toggle UI. These remain deferred per the milestone-level decision.
- `config.ts` files (Payload block field schema) and `payload-types.ts` must show ZERO diffs from this phase — success criterion #3 is a hard technical check, not just a nice-to-have. Only `Component.tsx` files (for blocks) and `src/components/ui/*.tsx`/`SiteHeader.tsx`/`SiteFooter.tsx` should change.

### Scope
- Primitives in scope (per ROADMAP): button, card, badge, input, select, tabs, sheet, navigation-menu, separator, skeleton, textarea, avatar.
- Global chrome in scope: `SiteHeader`, `SiteFooter`.
- Apply Phase 7's new shadow/motion tokens where they add value (e.g. card elevation, button press/hover transitions using the new `--motion-*`/`--ease-*` tokens via CSS transitions — NOT a JS animation library).

### Claude's Discretion
- Exact variant-level styling choices (which shadow level on which card variant, exact hover/focus treatment per primitive) — informed by `05-UI-SPEC.md`'s editorial-tech direction and `.planning/research/FEATURES.md`'s micro-interaction guidance (CSS-only hover/focus/press states).
- Whether `FAQ` block already uses a Radix accordion primitive (flagged as unverified in research) — confirm during this phase's audit; if it doesn't, this phase can bring it in line with the `accordion` primitive if in scope, otherwise flag as a note for a later phase.

</decisions>

<code_context>
## Existing Code Insights

- `src/components/ui/*.tsx` — shadcn "new-york" preset primitives, each using `cva()` for variants (confirmed by research).
- `src/components/SiteHeader.tsx` / `SiteFooter.tsx` — existing global chrome components (Phase 5).
- 16 Payload blocks under `src/blocks/*/Component.tsx` consume these primitives — do not touch `src/blocks/*/config.ts` (Payload field schema) in this phase.
- Phase 7 just added `--shadow-sm/md/lg/focus`, `--motion-fast/base/slow`, `--ease-out/standard` tokens to `globals.css`, mapped to `tailwind.config.ts`'s `boxShadow`/`transitionDuration`/`transitionTimingFunction` — this phase is the first consumer of those tokens.
- `.planning/phases/05-frontend-pages/05-UI-SPEC.md` — locked editorial-tech visual direction (Inter+Fraunces, navy/off-white/ember-orange, new-york/neutral shadcn preset).

</code_context>

<specifics>
## Specific Ideas

None beyond the locked decisions above.

</specifics>

<deferred>
## Deferred Ideas

- Motion/animation JS library and dark-mode toggle — deferred per milestone-level decision (carried from Phase 7's context).

</deferred>
