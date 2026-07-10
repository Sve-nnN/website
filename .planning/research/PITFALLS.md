# Pitfalls Research

**Domain:** Visual/UX polish pass on an existing, content-populated Payload CMS + Next.js 15 + Tailwind + shadcn/ui bilingual site
**Researched:** 2026-07-10
**Confidence:** MEDIUM-HIGH (synthesized from CSS/design-system refactor post-mortems, WCAG/shadcn theming docs, i18n text-expansion research, animation/CWV performance data, and headless-CMS block-model literature; project-specific risk framing is HIGH confidence given direct read of PROJECT.md constraints)

## Critical Pitfalls

### Pitfall 1: Token refactor silently collapses block-driven layout flexibility

**What goes wrong:**
A "refine the design system" pass touches shared tokens (spacing scale, typography scale, color CSS variables) or shared block components (RenderBlocks registry, hero/card primitives) and, in the process of making things "look consistent," someone hardcodes a spacing value, removes a variant a Payload editor relies on, or collapses conditional rendering branches that existed to support optional/empty fields. Since all 16 blocks are Payload-editable, any content editor could enter a state (long title, no image, 2 vs 6 items in a repeater) that the "polished" version never accounted for because the polish pass was visually validated only against the current real content, not against the field's full input range.

**Why it happens:**
Visual polish is naturally done by eyeballing the rendered site with today's real data. Today's 72 posts and existing case studies represent one slice of the possible content space, not the full one Payload's schema allows (optional fields, empty repeaters, very long/short strings, missing media). A refactor that "looks great" against current content can implicitly assume invariants (image always present, exactly N items, title under X chars) that aren't schema-enforced.

**How to avoid:**
- Before restyling a block, list its Payload field schema (required vs optional, min/max items, character limits if any) and deliberately render each block at least once with a boundary-condition payload (missing optional image, empty repeater, max-length title) — not just against real content.
- Treat every visual change to a shared block/token as a diff against the "field contract," not just against a screenshot.
- Never remove a conditional-render branch (`{image && ...}`) as part of a "simplify for aesthetics" edit unless you've confirmed the field is actually required in the Payload schema.

**Warning signs:**
- Component code changes from `{field && <X/>}` to unconditional rendering during a "just styling" PR.
- A block that previously handled 1-6 repeater items now assumes a fixed count in its grid classes (e.g., `grid-cols-3` hardcoded instead of computed/responsive).
- Visual QA checklist only lists "home, blog, case study" pages instead of also checking blocks with sparse/edge-case content.

**Phase to address:**
Block/component audit and design-token refactor phases — add an explicit "boundary content" pass (empty/minimal fields, max-length fields) to the verification step for every touched block, not just a visual smoke test against production content.

---

### Pitfall 2: Color-token or contrast changes quietly break WCAG compliance that previously passed QA

**What goes wrong:**
The site already passed a full bilingual QA verification, which presumably included contrast checks on the existing palette. A polish pass that "refines" the color system (introducing a new accent, adjusting a neutral ramp, shifting from named colors like `gray-400` to semantic tokens, or adopting the `auditor` project's dark-first lime-accent palette as inspiration) can reintroduce contrast failures — especially in dark mode, where borders/muted text are the most common casualty, and especially on states that aren't visually obvious in a quick glance (placeholder text, disabled buttons, focus rings, muted captions on cards).

**Why it happens:**
Token refactors are usually validated against the primary text/background pair (body copy on white) because that's what's visually salient. Secondary/tertiary text colors, borders, and hover/focus states get updated "to match" without a contrast re-check, and a semantic-token rename (visual-name → role-name) can accidentally repoint a component to a token with different contrast than before.

**How to avoid:**
- Any commit that touches `tokens.css` / CSS custom properties feeding `background`, `foreground`, `muted`, `muted-foreground`, `border`, or accent colors must be re-checked against WCAG AA (4.5:1 normal text, 3:1 large text/UI) for every token pairing actually used in components — not just the primary body-text pair.
- Automated contrast checks catch computed colors but miss compositing effects (opacity, blend modes, overlapping gradient/image backgrounds behind text) common in "editorial-tech" hero treatments — verify those combinations manually in both light and dark mode.
- Re-run whatever accessibility check the original bilingual QA used (axe, Lighthouse a11y, or manual) scoped specifically to color-contrast, on both locales, after any token change — not just once at the end of the whole milestone.

**Warning signs:**
- New accent color introduced without checking it against both light and dark backgrounds it will sit on.
- `muted-foreground` or `border` tokens changed "just for vibe" without re-running contrast tooling.
- Text-over-image/gradient hero treatments added without a contrast check on the actual rendered composite.

**Phase to address:**
Design-token/color-system refinement phase — bake a WCAG contrast check (automated + manual for composite backgrounds) into the phase's own verification step, run per-locale, before marking the phase done.

---

### Pitfall 3: Spanish content breaks layouts sized/tested against English copy

**What goes wrong:**
Spanish text runs roughly 15-25% longer than English for equivalent content (headings, buttons, nav labels, card metadata). A polish pass that tightens spacing, introduces fixed-height cards, single-line truncation, or tighter line-length constraints (for a more "editorial" typographic feel) frequently gets designed/eyeballed in one locale first (commonly English, since that's often the default in dev) and then assumed to transfer. Titles wrap unexpectedly, buttons overflow their container, nav items collide, and card grids that looked aligned in EN show ragged/uneven heights in ES.

**Why it happens:**
Designers and devs naturally iterate in whichever locale is fastest to eyeball, and tighter/more polished spacing (a hallmark of "professional-feeling" redesigns) reduces the slack that used to absorb text-length variance. The most layout-sensitive strings — nav labels, button copy, card titles, breadcrumbs — are exactly the ones that expand the most in Spanish.

**How to avoid:**
- Every visual change to typography, spacing, or fixed-dimension containers (fixed-height cards, single-line truncated headings, nav bars) must be checked in both `/en` and `/es` before being called done — not just the locale it was designed in.
- Prefer flexible/min-height containers and `line-clamp` with enough lines of slack over fixed single-line truncation for card titles, given Spanish's expansion tendency.
- For real regression coverage, spot-check the longest actual ES titles/labels in the 72 migrated posts (not just short lorem-length test content) against tightened layouts.

**Warning signs:**
- Component built and screenshot-reviewed only in one locale during the PR.
- New `truncate` or fixed `h-*` classes added to title/label elements without checking ES equivalents.
- Nav/header polish done against English label lengths ("Blog", "Contact") without checking Spanish equivalents ("Publicaciones/Blog", "Contacto") which may differ enough to reflow.

**Phase to address:**
Any phase touching header/footer/nav, card components, or typography scale — verification step must explicitly include an ES-locale pass with real (not placeholder) longest-case content, not just EN.

---

### Pitfall 4: Animation/motion additions regress Core Web Vitals (INP/LCP) on a site whose entire value prop is technical performance

**What goes wrong:**
"Polish" commonly means adding scroll-triggered reveals, hover micro-interactions, page transitions, or a JS animation library (Framer Motion / Motion) to make the site feel "modern." On a portfolio whose Core Value is explicitly "el rendimiento y el SEO deben ser impecables," this is the highest-stakes category of regression: JS-driven animations that touch non-composited properties, run on the main thread during interaction, or ship a non-trivial bundle can push INP over the 200ms threshold, add CLS from layout-affecting animations, or delay LCP if animation libraries block critical rendering paths on hero content (the same hero elements likely to be the LCP element on case-study/home pages).

**Why it happens:**
Animation libraries are added incrementally, component by component, and each individual addition seems cheap in isolation. The cumulative JS bundle growth and main-thread cost only becomes visible under Lighthouse/CrUX field data, which teams often only check once at the end of a milestone rather than after each animated component is added — by then it's a large diff to unpick.

**How to avoid:**
- Prefer CSS-only transitions/animations (`transform`, `opacity`, driven by CSS transitions or the View Transitions API) over a JS animation library wherever the effect is simple (fade-in, hover states, simple reveals). Reserve JS animation libraries only for interactions CSS genuinely can't express.
- If a JS animation library is added, animate only hardware-accelerated properties (`transform`, `opacity`), never layout-affecting properties (`width`, `height`, `top/left` without `transform`), to avoid CLS and main-thread jank.
- Never animate the actual LCP candidate element (hero image/heading) in a way that delays its paint — entrance animations on above-the-fold hero content are a common self-inflicted LCP regression.
- Run Lighthouse/PageSpeed (mobile, throttled) after each block/page gets its animation pass, not only once at the end — catch INP/CLS/LCP regressions attributable to a specific component while the diff is still small.

**Warning signs:**
- `framer-motion` or similar added as a new dependency for effects that CSS transitions could achieve.
- Animations applied to elements above the fold / to the hero image itself.
- Lighthouse only run once, at the very end of the milestone, instead of incrementally.

**Phase to address:**
Any phase introducing motion/animation — require a CWV check (mobile Lighthouse or field data proxy) as an explicit verification gate before/after, scoped to the specific pages touched, and prefer CSS-first implementation as the default choice in the phase's technical approach.

---

### Pitfall 5: "Just visual" component edits quietly reintroduce hardcoded content, violating the Phase 5 hard rule

**What goes wrong:**
PROJECT.md explicitly states the milestone must keep "todo contenido sigue siendo editable desde Payload." In practice, visual polish work tempts small hardcoded fixes: a dev hand-tunes a card's copy to test a layout and forgets to revert it to the CMS-driven prop, adds a "polish-only" badge/label/CTA string directly in JSX because it's "just a UI label, not real content," or introduces a new visual element (e.g., a decorative eyebrow text, a stat, an icon-per-category mapping) that has no corresponding Payload field, silently becoming unmaintainable/unlocalizable content baked into the component tree.

**Why it happens:**
Block-based/headless CMS component work has a well-documented anti-pattern risk: it's very easy for presentation concerns to leak into what should stay data-driven, especially when a component is being restyled and the dev is iterating quickly with a literal string in place "to see how it looks," and that stopgap never gets converted into a real field before merge. The boundary between "UI chrome that's legitimately hardcoded" (e.g., "Read more →" if truly a UI-only, non-localized affordance) and "content that must be a field" (any string a non-technical editor would expect to change per post/case-study/locale) gets blurred during fast iteration.

**How to avoid:**
- Before merging any visually-touched block, explicitly re-verify: every string visible in the rendered output either comes from a Payload field/richtext, from `next-intl` message catalogs (as genuine UI chrome, translated in both locales), or is a truly static, non-content, non-localized visual element (e.g., a decorative rule/icon with no semantic meaning) — nothing should be an inline literal that a content editor would reasonably expect to edit.
- If a new visual element needs new data (a badge, an icon-per-category, a stat callout) add the Payload field/config for it as part of the same phase, not as a "we'll wire it up later" placeholder.
- Treat "delete this hardcoded test copy before merge" as a checklist item on every visually-driven PR, since it's the most likely place for it to slip through.

**Warning signs:**
- Grep for literal English/Spanish sentences inside component `.tsx` files that aren't in `next-intl` message catalogs.
- A new visual feature (badge, icon, stat) ships without a corresponding new/edited Payload field.
- PR diff shows a component prop being removed in favor of a literal string "to make the demo look right."

**Phase to address:**
Every phase in this milestone (it's a cross-cutting constraint, not phase-specific) — the verification step for each phase should include an explicit grep/audit for hardcoded strings introduced in touched components, and confirm any new visual data point has a Payload field backing it.

---

### Pitfall 6: SEO/structured-data surface area silently degrades during "just visual" markup changes

**What goes wrong:**
Visual refinement of heading hierarchy (e.g., changing an `<h2>` to a styled `<div>` because "it needs a different visual treatment than other h2s"), image handling (swapping `next/image` usage patterns, dropping `alt` text propagation while restyling card image treatment), or link/button semantics (replacing an anchor with a `<div onClick>` for easier styling) quietly damages the SEO and accessibility foundation that plugin-seo, sitemaps, and structured data depend on — even though nothing about the CMS content or SEO plugin config changed. Since this project's whole value proposition rests on "SEO impecable," these are exactly the regressions least visible in a quick visual QA pass (they don't look wrong) but most damaging to the stated Core Value.

**Why it happens:**
Restyling is done by looking at rendered output, not by auditing the DOM/semantic structure. It is easy to swap a semantic element for a `div`/`span` purely to get more predictable CSS control, without registering that this changes heading outline, link crawlability, or landmark structure.

**How to avoid:**
- Any time an element's HTML tag changes during restyling (heading level, `<a>` → `<button>`/`<div>`, list markup removed for a flex/grid layout), explicitly confirm the semantic/structural equivalent is preserved — style can change without changing the underlying tag.
- Re-run whatever Lighthouse SEO/accessibility audit and structured-data validation (rich results test) was used in the original QA, scoped to pages whose markup changed, not just a visual look.
- Keep `alt` text, `next/image` usage, and heading hierarchy on an explicit checklist for any card/hero/blog-post-body component that gets restyled.

**Warning signs:**
- Heading tag downgraded/upgraded (h2→h3 or h2→div) purely to fix visual sizing, instead of using CSS to restyle a semantically-correct tag.
- `next/image` `alt` prop no longer sourced from the Payload media field after a card-image treatment change.
- Clickable cards/links converted to `<div onClick>` patterns for easier hover-state styling.

**Phase to address:**
Any phase restyling headers, blog-post body rendering, or card/link components — include a markup/semantic diff check (not just visual) and a Lighthouse SEO/a11y re-run on affected page types as part of verification.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Restyle against only current production content, skip boundary-condition content | Faster visual iteration | Block breaks the first time an editor enters an edge-case value in Payload | Never for shared/reusable blocks; acceptable only for genuinely one-off, non-reusable page sections |
| Hardcode a string "temporarily" while iterating on a component's look | Faster to see the visual result | Ships as permanent hardcoded content, violating the editable-content rule | Never past the PR that introduces the component — must be wired to a field/message catalog before merge |
| Design/QA visual changes in one locale only (EN) | Half the review time per component | ES layout breaks in production for the longer-text locale | Never for shared components (nav, cards, headings); acceptable only for locale-specific one-off copy tweaks |
| Add a JS animation library site-wide "for consistency" instead of per-need CSS transitions | Convenient shared API for animation | Bundle-size and INP/main-thread cost creeps across every page, hard to isolate later | Only acceptable for genuinely complex interactions CSS can't express (e.g., orchestrated multi-step transitions), never as the default for simple fades/hovers |
| Defer WCAG contrast re-check until the end of the whole token refactor | Faster to "just get the new palette in" | Accumulates many contrast regressions that are expensive to triage together at the end | Never — check per-token-change, not batched |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Payload block registry (RenderBlocks) | Restyling a block by assuming today's content shape (image always present, N items) rather than the field schema's full range | Read the block's Payload field config before restyling; test with sparse/edge-case content, not just production data |
| next-intl message catalogs | Adding new UI copy (labels introduced by new visual elements) directly in EN only, or as a literal string, forgetting the ES catalog entry | Any new UI string introduced during polish must get both `en.json` and `es.json` entries in the same PR |
| shadcn/ui theme tokens (`tokens.css` / CSS variables) | Renaming or repointing tokens without checking every component that consumes them for contrast/visual regressions | Grep for all consumers of a token before changing its value; re-run contrast checks on the actual consuming component pairs |
| `@payloadcms/plugin-seo` + sitemap | Assuming markup/heading changes are purely cosmetic and don't need SEO re-validation since the plugin config didn't change | Structured data and heading hierarchy live in the frontend markup, not the plugin config — re-audit markup after any tag-level restyle |
| Cloudinary-served images (`next/image`) | Restyling image containers (aspect ratio, object-fit, crop treatment) without re-checking `alt` propagation and without re-checking actual Cloudinary transform params match the new visual crop | Verify `alt` still flows from the Payload media field end-to-end; confirm any new aspect-ratio/crop visual choice has a matching Cloudinary transform, not just CSS `object-fit` masking a mismatched image |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Per-component JS animation library additions | INP creeps up incrementally, invisible until Lighthouse run at milestone end | Run Lighthouse mobile after each animated component ships, not just at the end | Becomes visible once several components are animated — hard to attribute to one cause after the fact |
| Entrance/reveal animations on hero (LCP) elements | LCP timing regresses on home/case-study pages | Never delay-paint or animate the actual LCP candidate; animate secondary elements only | Immediately measurable on the first hero touched, but often not checked until later |
| New web fonts or font-weight variants added for "typographic polish" | FOUT/FOIT, CLS from font-swap, larger font payload | Reuse existing font subsets/weights already loaded; if a new weight is truly needed, subset it and use `font-display: swap` with matched fallback metrics | Breaks CWV the moment the new font asset ships to a page with real traffic |
| Denser/tighter grids relying on JS-measured layout (e.g., masonry libraries) for a "more editorial" card grid | CLS from layout shifting after JS measurement runs | Prefer CSS Grid/`auto-rows`/`grid-template-areas` solutions over JS-measured masonry | Breaks as soon as content length varies (which, per Pitfall 3, it reliably will across EN/ES) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Introducing `dangerouslySetInnerHTML` or raw HTML injection points to achieve a specific visual/typographic effect on rich text | XSS surface if content source ever includes untrusted input (contact form, future guest content) | Keep the existing Lexical richtext serializer/sanitization path; don't bypass it for one-off visual effects |
| Adding third-party animation/analytics scripts for polish effects without reviewing their network/data footprint | Unvetted third-party script on a site with real user data (contact form) | Prefer dependency-free CSS solutions; if a script is added, self-host or vet its data practices before inclusion |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Motion-heavy polish without respecting `prefers-reduced-motion` | Vestibular-sensitive users get nausea/disorientation from scroll-triggered or parallax effects | Wrap all non-essential motion in a `prefers-reduced-motion: reduce` fallback (reduced duration/opacity-only) from the first animation added, not retrofitted later |
| Increasing visual density/whitespace tightness for an "editorial" feel without locale testing | Spanish labels/titles wrap awkwardly or collide, looking broken specifically to ES-locale users (a large share of Juan's actual audience) | Design spacing with the longer-language (Spanish) case as the binding constraint, not English |
| Single-line truncated card titles for visual tidiness | Truncated titles lose meaning/SEO value and look worse in Spanish (longer titles truncate more aggressively) | Use 2-3 line `line-clamp` with adequate min-height instead of hard single-line truncation |
| New hover-only interactions/reveals (e.g., info only visible on `:hover`) | Breaks entirely on touch devices (majority of traffic), hides content that Payload editors expect to be visible | Ensure any hover-revealed content has a touch/tap equivalent, or don't gate content visibility behind hover at all |

## "Looks Done But Isn't" Checklist

- [ ] **Restyled block**: Often missing a check against boundary-condition Payload content (empty optional fields, min/max repeater counts, longest real ES title) — verify by rendering the block with edge-case data, not just today's production content.
- [ ] **New color token/accent**: Often missing a WCAG contrast re-check against all backgrounds it's actually composited on (including image/gradient hero overlays) in both light and dark mode — verify with an automated contrast tool plus a manual check on composite backgrounds.
- [ ] **New animation/transition**: Often missing a `prefers-reduced-motion` fallback and a fresh mobile Lighthouse (INP/CLS/LCP) run scoped to the touched page — verify both explicitly, not just "it feels smooth on my machine."
- [ ] **Any visually-touched string/label**: Often missing the Spanish counterpart check and/or accidentally hardcoded instead of CMS/`next-intl`-driven — verify by grepping the diff for literal strings and by loading `/es` for the same component.
- [ ] **Any changed HTML tag during restyle (heading, link, list)**: Often missing a semantic/SEO equivalence check — verify heading hierarchy and link/landmark semantics are unchanged even though the visual style changed.
- [ ] **Card/media image treatment changes**: Often missing `alt` text propagation and Cloudinary transform alignment with the new crop/aspect ratio — verify both, not just that the image "looks right" in the browser.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| Hardcoded content shipped instead of Payload field | LOW-MEDIUM | Add the missing field to the collection/block config, backfill the value into Payload for existing docs, swap the component back to reading from the field, re-run migration/type-gen |
| WCAG contrast regression discovered post-merge | LOW | Adjust the specific token value(s) failing contrast; re-run contrast check; usually isolated to a CSS variable change, not a structural fix |
| CWV regression from an animation library | MEDIUM-HIGH | Identify the offending component via Lighthouse/bundle analysis; replace JS animation with CSS transition where possible; if the library must stay, code-split it to only the routes that need it |
| Layout breakage in ES from tightened spacing | LOW-MEDIUM | Increase min-height/line-clamp allowance or reintroduce flexible spacing at the specific breakpoint/component; re-verify against longest real ES strings |
| Semantic markup regression (heading/link tag changed) | LOW | Revert the tag to the correct semantic element and restyle via CSS instead; re-run SEO/a11y audit on the affected page type |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|----------------|
| Token/block refactor breaks layout flexibility | Block/component visual audit + design-token refinement phases | Render each touched block against boundary-condition Payload content (empty optional fields, min/max repeater counts), not just production data |
| Color-token change breaks WCAG contrast | Design-token/color-system refinement phase | Automated contrast check + manual check on composite/image backgrounds, both light and dark mode, both locales, run per-change not batched |
| Spanish layout breakage from tightened spacing | Any phase touching typography/spacing/nav/cards | Explicit `/es` pass with longest real migrated content, not just `/en`, before marking the phase's components done |
| Animation-driven CWV/INP regression | Any phase introducing motion/animation | Mobile Lighthouse run scoped to touched pages after each animated component ships; prefer CSS-first as default approach |
| Hardcoded content reintroduced during polish | Every phase (cross-cutting) | Grep diff for literal strings not sourced from Payload/`next-intl`; confirm new visual data points have backing Payload fields |
| SEO/structured-data markup regression | Any phase restyling headers, blog body, or card/link components | Markup/semantic diff review + Lighthouse SEO/a11y re-run on affected page types |

## Sources

- [Visual Regression Testing mistakes — DEV Community](https://dev.to/maria_bueno/the-most-common-visual-regression-testing-mistakes-and-how-to-avoid-them-4id8) — MEDIUM
- [From semantic CSS to Tailwind — Netlify engineering blog](https://www.netlify.com/blog/2021/03/23/from-semantic-css-to-tailwind-refactoring-the-netlify-ui-codebase/) — MEDIUM (real-world large CSS refactor account)
- [Motion (Framer Motion) performance / INP discussion — Framer Community & docs](https://www.framer.community/c/support/core-web-vitals) — MEDIUM
- [Framer Motion vs Motion One mobile performance comparison](https://www.reactlibraries.com/blog/framer-motion-vs-motion-one-mobile-animation-performance-in-2025) — MEDIUM
- [prefers-reduced-motion — web.dev](https://web.dev/articles/prefers-reduced-motion) — HIGH (official Google web.dev guidance)
- [prefers-reduced-motion — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — HIGH (official docs)
- [Design accessible animation — Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — MEDIUM
- [WCAG 2.3.3 Animation from Interactions — W3C](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) — HIGH (official WCAG spec)
- [shadcn/ui Theming docs](https://ui.shadcn.com/docs/theming) — HIGH (official docs)
- [Accessible Color Systems in Block Themes — WCAG guide](https://brndle.com/accessible-color-system-block-themes-wcag/) — MEDIUM
- [Text expansion in translation — SimpleLocalize](https://simplelocalize.io/blog/posts/text-expansion-ui-localization/) — MEDIUM
- [Text expansion during translation — Argo Translation](https://www.argotranslation.com/blog/text-expansion-during-translation) — MEDIUM
- [Text Expansion in i18n testing guide](https://i18nagent.ai/zh-Hant-TW/guides/text-expansion-testing) — MEDIUM
- [Structuring content in a headless CMS — Flotiq](https://flotiq.com/blog/structuring-content-in-a-headless-cms-a-practical-guide/) — MEDIUM (block-model anti-pattern discussion)
- Project-specific constraints and hard rules — `.planning/PROJECT.md` (this repo) — HIGH (primary source for the editable-content rule, Core Value on performance/SEO, bilingual scope, and current milestone description)

---
*Pitfalls research for: Visual polish pass on existing Payload CMS + Next.js bilingual portfolio*
*Researched: 2026-07-10*
