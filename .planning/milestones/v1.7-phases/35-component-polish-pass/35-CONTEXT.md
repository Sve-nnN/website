# Phase 35: Component Polish Pass - Context

**Gathered:** 2026-07-14
**Status:** Executed directly (single-session review + fix pass, no separate discuss-phase round — scope was fully bounded by ROADMAP Phase 35 + REQUIREMENTS.md POLISH-01..06)

<domain>
## Phase Boundary

Visual review of the 28 components/blocks the .pen file (`designs/current-site-real.pen`) already models 1:1 against the current codebase, grouped exactly as POLISH-01..05 in REQUIREMENTS.md:

1. UI primitives: Button/*, Input, Textarea, Badge/*, Tabs, Card
2. Chrome: SiteHeader, SiteFooter
3. Existing Hero variants: home, listing, post-header, case-study-header (NOT the new `local-landing` variant — that's Phase 33/34 scope, explicitly excluded here per ROADMAP's Phase 35 dependency note)
4. Content blocks: CallToAction, FAQ Item, ContactForm, ResultsSection, ClientLogosBlock, AboutSection, ServiceScopeCard
5. Authorship: AuthorCard, AuthorByline

Every genuine, in-scope micro-improvement found gets implemented directly in code (POLISH-06) — this phase does not stop to log a plan for human approval per-finding; discretion was used per the task brief's explicit "use your own judgment freely on which specific micro-improvements are worth making."

This phase does NOT touch `HeroGrainGradient.tsx` (hard constraint, already validated in v1.3) and does NOT add any new design tokens.
</domain>

<decisions>
## Method

- Read `designs/DESIGN-SYSTEM.md` (code-derived token vocabulary) and `designs/DESIGN-SYSTEM-PEN.md` (state of the .pen artifact) in full before starting, per the task brief.
- Read every one of the 28 components' source files directly (not just their config/schema) to have exact class names in hand before comparing.
- Used `mcp__pencil__get_editor_state` to enumerate all 30 reusable component node IDs, then `mcp__pencil__batch_get` (with `resolveVariables: true`) in two batches to pull every primitive/block's resolved fill/padding/gap/cornerRadius/font values as structured JSON — this gave exact pixel/hex comparisons against the code's Tailwind classes, rather than relying purely on visual screenshots.
- Took 2 confirmatory screenshots (`SiteHeader`, `Card`) to sanity-check the JSON-derived findings against actual rendered pixels before committing to any fix.
- Cross-checked every candidate finding against `tailwind.config.ts` (to see which Tailwind classes are backed by a real CSS variable vs. an unconfigured Tailwind default) before deciding whether a fix reused an existing token or would require inventing one.

## Findings requiring judgment calls

- **Header background color inversion in the .pen** (`SiteHeader` node: `fill:#FAFAF7` light bg + dark nav text) contradicts the documented "dark bands" pattern (`DESIGN-SYSTEM.md` §1.1: `--secondary` used for "bandas oscuras (header/footer/hero)"). The .pen's own `SiteFooter` node correctly models the dark band (`fill:#12141C`), so this reads as a one-off construction slip in the .pen itself, not a real code defect — code's dark-navy header matches the documented system and was left untouched.
- **`text-destructive-foreground` is a broken utility class**: `tailwind.config.ts`'s `colors.destructive` is a flat string (`var(--destructive)`) with no `.foreground` sub-key, unlike `primary`/`secondary`/`muted`/`accent` which all define one — so `text-destructive-foreground` never resolved to a real Tailwind rule in `button-variants.ts`/`badge-variants.ts`. The .pen's own `Button/Destructive` and `Badge/Default`(-style) nodes confirm dark text (`#12141C`) was the intended look on the destructive-red background — exactly what the already-existing `--primary-foreground` token resolves to in both themes. Fixed by swapping the class, not by inventing a new `--destructive-foreground` variable (would have violated the zero-new-tokens constraint).
- **Card-family corner radius**: `rounded-xl` (Tailwind's unconfigured default, 12px) vs. the .pen's consistently-modeled 16px radius on Card/ServiceScopeCard/AuthorCard/ContactForm-sidebar. `CallToAction` already independently uses `rounded-2xl` (16px, a real Tailwind default with precedent already in this codebase) for the same visual family. Fixed by reusing that existing utility, not by adding a `--radius-xl` CSS variable.
- **CallToAction's own padding model** (flat 48px in the .pen vs. code's nested `Container` + inner `section` padding split across two elements) was judged too structural to touch — it's a layout-shape difference, not a token value difference, and restructuring it risks the "no bigger design changes" hard constraint. Discarded.
- **Hero/Case-study-header desktop padding** (72px modeled in .pen vs. `md:py-20`=80px in code) was judged within the .pen's documented approximation noise (the .pen doc itself states several values, like `text-heading`/`text-display` sizes, are deliberately approximate) rather than a real spacing-token mismatch — no exact Tailwind step exists for 72px (the default scale jumps 16→20, i.e. 64px→80px) without introducing an arbitrary value. Discarded.
- **Footer bottom-row layout** (.pen shows socials + copyright only, on one row; code shows socials + legal links on one row, then copyright as a separate paragraph below) was judged a data-completeness difference in the .pen mock (legal links likely just omitted from the mockup's sample data) rather than a real structural code defect. Discarded.
- **ClientLogosBlock resting opacity** (.pen's flat gray placeholder rectangles at 40% opacity vs. code's real-logo images at 70% resting opacity, 100% on hover) was judged not comparable — the .pen uses opacity on an abstract gray rectangle as a generic "logo not available" placeholder convention, not a modeled target value for real logo images. Discarded.

</decisions>

<code_context>
## Existing Code Insights

- `src/components/ui/badge-variants.ts` / `button-variants.ts` / `card.tsx` — Phase 8 already refined these onto the named shadow/motion token vocabulary; this phase's fixes are corner-radius and color-utility swaps only, no new classes invented.
- `src/blocks/AboutSection/Component.tsx`, `src/blocks/ServiceScopeCard/Component.tsx`, `src/blocks/ContactFormBlock/Component.tsx` — each had one inconsistency against a sibling block that already uses the "correct" (per .pen) value: `AboutSection`'s `gap-8` vs. `ContactFormBlock`'s already-correct `gap-12`; `ServiceScopeCard`'s `CardContent p-6` vs. `AuthorCard`'s already-correct `Card p-8`; `ContactFormBlock`'s sidebar `rounded-lg` vs. `CallToAction`'s already-correct `rounded-2xl` (both wrap the same `HeroGrainGradient variant="cta"`).
- `scripts/smoke-check-phase8.mjs` — reused verbatim as the phase's regression smoke check (per ROADMAP Phase 35 success criterion 5, "mismo patrón de Phase 8"). Re-run against a freshly started, isolated `next dev` server (port 3458) after all fixes: 5/5 checkable routes PASS, all 16 blocks covered, exit code 0.
- `tailwind.config.ts` `borderRadius` map — only `lg`/`md`/`sm` are derived from `--radius`; `xl`/`2xl`/etc. fall through to Tailwind's own unconfigured defaults. This is why the Card corner-radius fix reused the already-precedented `rounded-2xl` class instead of adding a new `--radius-xl` variable.

</code_context>

<specifics>
## Specific Ideas

- 6 concrete code fixes applied (see 35-01-SUMMARY.md for the full table): `badge-variants.ts` (radius + destructive-text bug), `button-variants.ts` (destructive-text bug), `card.tsx` (radius), `AboutSection/Component.tsx` (gap), `ServiceScopeCard/Component.tsx` (padding), `ContactFormBlock/Component.tsx` (sidebar radius).
- All 6 fixes are one-line (or one-class) swaps to values already backed by an existing CSS variable/Tailwind utility with precedent elsewhere in the codebase — none introduce a new token.
- Verification: `npx tsc --noEmit` clean; `scripts/smoke-check-phase8.mjs` re-run against an isolated `next dev` server (port 3458) — 5/5 PASS; additional Phase-35-specific sanity curl on `/`, `/en`, `/en/blog`, `/servicios` — all 200, exactly 1 `<h1>` each; `git diff -- src/components/HeroGrainGradient.tsx` empty (confirmed untouched).

</specifics>

<deferred>
## Deferred Ideas

- None of the discarded findings above are tracked as future work items — each was judged either a `.pen` modeling artifact (header color inversion, ClientLogos opacity) or genuinely out of "micro-improvement" scope (CallToAction padding restructure) or within acceptable approximation noise (case-study-header padding, footer bottom-row data completeness). If Juan wants any of these revisited, they'd need a dedicated decision (e.g., a "add `--radius-xl` token properly" ticket, or "restructure footer bottom row" ticket) rather than being folded into this polish pass.
</deferred>
</content>
