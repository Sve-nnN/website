# Feature Research

**Domain:** Visual/UX polish pass — solo technical consultant portfolio (engineering + SEO expertise), competing with agencies and senior independent consultants for client trust
**Researched:** 2026-07-10 (v1.1 milestone — supersedes the 2026-07-09 initial-project feature research below in scope, kept as historical baseline where still relevant)
**Confidence:** MEDIUM (WebSearch-verified across 6 queries, cross-referenced across 2+ sources per claim; no Context7-equivalent for design trends; codebase facts verified directly at HIGH confidence)

## Codebase Baseline (verified directly, not researched)

- Design tokens live in `src/app/globals.css` — shadcn default `:root`/`.dark` OKLCH tokens plus a UI-SPEC override (`--background: #FAFAF7`, `--foreground: #12141C`, `--primary: #FF5B1F` ember-orange, `--secondary: #12141C` navy). **The `.dark` block still has generic shadcn gray tokens — the ember/navy palette was never carried into dark mode.** This is the single biggest gap between "light mode looks branded" and "dark mode looks like an unstyled template."
- No animation library installed (`framer-motion`, `gsap`, `lenis` all absent from `package.json`). Only `tailwindcss-animate` (Tailwind's own keyframe utility plugin, used by shadcn for primitives like accordion/dialog) is present. Any scroll-triggered or orchestrated motion work is a **new dependency decision**, not a config tweak.
- 16 Payload-editable blocks already exist (`Hero`, `ResultsSection`, `FeaturedCaseStudiesBlock`, `TestimonialsCarousel`, `ClientLogosBlock`, `FeaturedPostsBlock`, `ContactFormBlock`, `Content`, `CallToAction`, `FAQ`, `MediaBlock`, `Code`, `TableOfContentsBlock`, `RelatedPosts`, `ArchiveBlock`, `Section`), plus standalone components `AuthorByline`, `AuthorCard`, `CaseStudyCard`, `PostCard`, `SiteHeader`, `SiteFooter`. Polish work is scoped to restyling these, not building new ones.
- shadcn/ui "new-york" primitives in place: `avatar`, `badge`, `button`, `card`, `input`, `navigation-menu`, `select`, `separator`, `sheet`, `skeleton`, `tabs`, `textarea`. No `tooltip`, `progress`, `hover-card`, or `accordion` yet — relevant if any differentiator below needs one.
- Fonts already shipped per PROJECT.md: Inter (body/UI) + Fraunces (display/editorial serif) — this pairing already signals "editorial-tech," not generic SaaS. Polish work should lean into it, not fight it with a third typeface.
- Hard rule carried into this milestone (PROJECT.md): everything stays Payload-editable. This is a visual/CSS/component-styling pass, not a content or component-library rebuild.

## Feature Landscape

### Table Stakes (Users Expect These)

Patterns a professional solo-consultant portfolio is *penalized* for missing in 2026 — their absence reads as "unfinished" or "template," even before a visitor reads any copy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Consistent 4/8px spacing scale across all 16 blocks | Reviewers (recruiters/clients) unconsciously read inconsistent gaps as sloppiness; shadcn's own aesthetic depends on rhythm being exact (8px between related items, 16px between groups, 24-32px between sections) | LOW | Audit each block's padding/gap classes against one scale; likely the fastest highest-leverage fix since blocks were built independently in Phase 5 |
| Typographic hierarchy via size+weight, not just color | Table-stakes for a text/case-study-heavy site; using color alone to differentiate headings looks amateurish and fails dark mode | LOW-MEDIUM | Define a small set of heading/body/caption utility classes (or Tailwind `@layer` presets) once, reuse everywhere instead of ad hoc `text-xl font-bold` per block |
| Working dark mode with brand-correct tokens (not shadcn defaults) | Dark mode crossed into baseline expectation for developer/technical-audience sites in 2026; a "dark mode toggle that looks like default Radix gray" is worse than no toggle because it exposes the gap | MEDIUM | Must define ember/navy-tuned `.dark` OKLCH values (desaturate `--primary` ember for dark backgrounds, use true dark grays not pure black per surface-elevation best practice), not just flip `bg-background` |
| KPI/metric block in case-study hero (large number + short context) | Established convention in case-study and consulting-agency pages — PwC-style pattern of headline metric + short subhead is the fastest trust signal for a technical-results audience | LOW | `ResultsSection` block already exists — this is a restyle/verify task, not new build; ensure the metric is visually the largest element on the page, not just another card |
| Author byline with visible credentials (years experience, certifications, LinkedIn) on every post/case study | E-E-A-T signals now read by both humans and AI-answer engines; Juan's core value is proving expertise — a plain "by Juan" line undercuts that on every content page | LOW | `AuthorByline`/`AuthorCard` already exist; verify years-experience/certifications/social links are rendered prominently, not buried below the fold |
| Mobile-first responsive polish (not just "doesn't break") | Table stakes for any 2026 site — breakpoints must preserve the spacing/typography rhythm above, not just reflow | LOW-MEDIUM | Check each of the 16 blocks at 375px, not just desktop; a common Phase-5-speed-build gap |
| Fast, jank-free page loads (perceived performance) | Project's Core Value explicitly states "if performance fails, the site fails" — a polish pass that adds heavy client JS (parallax libraries, video hero) without budget-checking undermines the site's core positioning | LOW-MEDIUM | Any new animation dependency must be evaluated against bundle-size/CWV budget before adoption; prefer CSS-only or IntersectionObserver-based micro-interactions over a full animation library where possible |

### Differentiators (Competitive Advantage)

Not required, but these are what separate "professionally finished" from "genuinely memorable" for this specific niche (solo technical consultant vs. agencies).

| Feature | Value Proposition | Complexity | Notes |
|---------|--------------------|------------|-------|
| Subtle scroll-reveal on case-study sections (fade/slide-up per section, not per element) | Signals production polish without becoming gimmicky; scrollytelling patterns are expected on case-study-driven sites but must stay restrained for a technical-credibility audience (over-animation reads as "marketing agency," undercutting an engineer's credibility) | MEDIUM | Achievable with `IntersectionObserver` + CSS transitions (no new dependency) OR a lightweight lib (e.g. Motion for React) if richer orchestration is wanted — needs an explicit dependency decision, not silent adoption |
| Micro-interactions on interactive elements only (buttons, cards, nav, form fields) | 2026 best-practice framing: microinteractions should give feedback on *actions*, not decorate static content — hover states, button press feedback, focus rings, form-field validation transitions | LOW-MEDIUM | Mostly CSS `transition`/`:hover`/`:focus-visible` on existing shadcn primitives (`button.tsx`, `card.tsx`, `input.tsx`) — cheap to add, disproportionate perceived-quality payoff |
| Numeric KPI count-up animation in `ResultsSection` on scroll into view | Reinforces the "metric-in-the-headline" case-study pattern already decided in PROJECT.md (the ariannalupi.com reference model); makes the site's strongest trust signal (hard numbers) the most memorable moment on the page | LOW-MEDIUM | Small, scoped enhancement to one existing block; achievable with a simple `requestAnimationFrame` counter or CSS `@property` animation — no new dependency required |
| Editorial "chapter" rhythm in long-form content (case studies, blog posts) using Fraunces for section breaks/pull-quotes | Leverages the fonts already shipped instead of adding new visual language; text-heavy layouts with strong typographic hierarchy are called out repeatedly as effective for consultants who compete on authority, not flashy visuals | LOW | Style existing `Prose`/`Content` block: use Fraunces at larger size for H2 section breaks and any pull-quote pattern, keep Inter for body — no new component needed |
| One consistent "signature" accent motif reused across hero, CTA, and case-study KPI blocks (e.g. a thin ember-orange rule, bracket, or underline treatment) | Gives the site a memorable visual fingerprint (like Linear's purple glow or Vercel's grid pattern) without requiring heavy illustration/3D work that a solo consultant site shouldn't invest in | LOW-MEDIUM | Design decision + reusable CSS class/SVG, applied across `Hero`, `CallToAction`, `ResultsSection` — cohesion payoff is disproportionate to effort |
| Dark mode as a genuinely designed second theme (not a token flip) | 2026 pattern for developer-facing sites: a large majority of top design-led sites in this space are dark-default or dark-parity, with one saturated accent carried through; for an engineer's portfolio, a well-executed dark mode is itself a credibility signal ("this person's site works") | MEDIUM-HIGH | Requires designing the full `.dark` token set (surface elevation layers, desaturated ember accent, adjusted `--muted`/`--border` for readability) — the largest single differentiator-tier item, directly blocked by the Table Stakes dark-mode gap above |
| Client-logo carousel treated as a trust strip, not a filler section (grayscale-to-color on hover, tight consistent sizing) | `ClientLogosBlock` already exists — small styling investment (desaturate logos, consistent bounding box, subtle hover-to-color) reads as far more polished than raw logo images at inconsistent sizes | LOW | Restyle-only, no new component |

### Anti-Features (Commonly Requested, Often Problematic)

Patterns that look tempting for "making it feel modern" but actively work against this project's Core Value (proving technical/SEO expertise through impeccable execution) or its Hostinger/standalone-Node constraints.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|----------------|------------------|-------------|
| Full parallax/3D WebGL hero or cursor-follow effects | Shows up constantly in "creative portfolio" trend roundups and looks impressive in isolation | Wrong register for a *technical SEO expert's* site — over-animation on a consultant/engineer portfolio reads as "agency trying too hard" rather than "engineer with taste"; also directly conflicts with the Core Value's performance mandate (heavy JS/WebGL tanks Core Web Vitals) | Restrained scroll-reveal + one signature accent motif (see Differentiators); save any "wow" motion budget for the case-study KPI count-up, which reinforces the actual message |
| Large animation library (GSAP/full Framer suite) for site-wide motion orchestration | Common "let's make it feel premium" ask once one nice animation ships | Not currently a dependency; adding it pulls in real bundle weight for a portfolio that must stay CWV-green per PROJECT.md, and creates an ongoing maintenance surface for a single-person Payload/Next codebase | CSS transitions + `IntersectionObserver` cover the great majority of the differentiators above; only escalate to a small motion lib (e.g. the lighter `motion` package) if a specific orchestrated sequence genuinely can't be done in CSS, and treat that as an explicit scoped decision, not a blanket install |
| Auto-playing hero video/animated background loop | "Modern agency sites do this" | Same CWV conflict, plus accessibility/`prefers-reduced-motion` concerns, plus content team (Juan alone) now owns video asset production/maintenance for marginal benefit | Static, well-art-directed hero image or the KPI-metric-first hero pattern already planned; use `prefers-reduced-motion` media query as a hard rule for any motion adopted elsewhere |
| Rebuilding a new component library or dropping shadcn primitives for a custom system | Temptation during a "polish pass" to reach for something flashier | Contradicts the milestone's explicit scope: this is a token/CSS/component-styling pass on the existing shadcn "new-york" system, not a framework swap; also reopens the "everything must stay Payload-editable" hard rule to no benefit | Extend existing tokens (`globals.css`) and restyle existing `components/ui/*` primitives; add new shadcn primitives (`tooltip`, `hover-card`, `accordion`) only if a differentiator genuinely needs one, via the standard shadcn CLI, not a custom build |
| Gamified/game-like portfolio interactions (draggable cards, easter eggs, playful cursor) | Shows up in "memorable portfolio" trend content aimed at creative/design audiences | Wrong audience signal for a technical-SEO/engineering consultant whose buyers are evaluating rigor and reliability, not creative flair; risks undercutting the "impeccable execution" positioning from Core Value | Let the metric-driven case studies and clean typographic system carry the "memorable" job instead — restraint is the differentiator for this niche |

## Feature Dependencies

```
[Brand-correct dark-mode tokens in globals.css]
    └──requires──> [Table Stakes: consistent light-mode tokens already in place] (done)
    └──blocks──> [Differentiator: Dark mode as designed second theme]
    └──blocks──> [Any component-level dark-mode-specific styling in Hero/ResultsSection/etc.]

[Typography hierarchy utility classes]
    └──enhances──> [Editorial "chapter" rhythm in Prose/Content block]
    └──enhances──> [KPI/metric hero treatment in ResultsSection]

[Spacing scale audit across 16 blocks]
    └──requires──> [nothing — do first, it's the cheapest highest-leverage fix]
    └──enhances──> [every other visual item — inconsistent spacing undermines any animation/color work layered on top]

[Scroll-reveal / KPI count-up micro-interactions]
    └──requires──> [Decision: CSS/IntersectionObserver only, vs. adopting a motion library]
    └──conflicts──> [CWV/performance mandate in Core Value, if a heavy library is chosen]

[Signature accent motif]
    └──requires──> [Design decision made once]
    └──enhances──> [Hero, CallToAction, ResultsSection cohesion]
```

### Dependency Notes

- **Dark-mode differentiator requires dark-mode table stakes:** you cannot ship "dark mode as a genuinely designed second theme" without first fixing the fact that `.dark` in `globals.css` still carries unbranded shadcn defaults. This is a single, scoped, sequenceable phase item.
- **Spacing audit should be first, not parallel:** every other visual change (typography, KPI hero, accent motif) sits on top of block layout. Fixing spacing after other polish work means redoing measurements twice.
- **Micro-interactions conflict with the performance mandate if scoped wrong:** any animation work must be explicitly budgeted (CSS-only preferred) rather than defaulting to "add framer-motion," because PROJECT.md's Core Value makes Core Web Vitals a hard requirement, not a nice-to-have.
- **Typography utilities enhance two different differentiators** (editorial rhythm in long-form content, and KPI hero legibility) — define once, reuse, rather than styling each block bespoke.

## MVP Definition

### Launch With (v1.1 — this milestone)

Minimum for "professional, polished, memorable" per the milestone goal, ordered by leverage/cost ratio.

- [ ] Spacing/rhythm audit + fix across all 16 blocks — cheapest, highest-leverage, unblocks everything else
- [ ] Typographic hierarchy utilities (size+weight-driven, Inter/Fraunces roles clarified) applied site-wide
- [ ] Brand-correct dark-mode token set in `globals.css` (`.dark` block redesigned, not shadcn defaults) — table-stakes gap identified directly in codebase
- [ ] KPI/metric hero restyle in `ResultsSection` (largest-element treatment) — reinforces the already-decided case-study model from PROJECT.md
- [ ] Author credibility restyle in `AuthorByline`/`AuthorCard` (credentials/years/social visibly prominent) — direct E-E-A-T payoff, low cost
- [ ] Micro-interactions (hover/focus/press states) on `button`, `card`, `input`, nav — CSS-only, no new dependency
- [ ] Mobile responsive pass at 375px for all restyled blocks

### Add After Validation (v1.x — if budget allows within this milestone)

- [ ] Scroll-reveal on case-study section entry (IntersectionObserver + CSS, no new dependency)
- [ ] KPI count-up animation on scroll-into-view in `ResultsSection`
- [ ] Signature accent motif applied across Hero/CTA/ResultsSection
- [ ] Client-logo carousel trust-strip restyle (grayscale-to-color hover)

### Future Consideration (v2+ — explicitly defer)

- [ ] Any motion-library-driven orchestrated animation sequence (only if a specific need can't be met in CSS)
- [ ] Full dark-mode-aware chart/data-viz theming (not needed — no dashboards in scope per PROJECT.md's "no internal SEO tooling" exclusion)
- [ ] Video/WebGL hero treatments — explicitly anti-feature for this niche, revisit only if positioning changes

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Spacing/rhythm audit (16 blocks) | HIGH | LOW | P1 |
| Typography hierarchy utilities | HIGH | LOW | P1 |
| Dark-mode brand-correct tokens | HIGH | MEDIUM | P1 |
| KPI hero restyle (ResultsSection) | HIGH | LOW | P1 |
| Author credibility restyle | MEDIUM-HIGH | LOW | P1 |
| Micro-interactions (hover/focus/press) | MEDIUM | LOW | P1 |
| Mobile responsive pass | HIGH | LOW-MEDIUM | P1 |
| Scroll-reveal on case studies | MEDIUM | MEDIUM | P2 |
| KPI count-up animation | MEDIUM | LOW-MEDIUM | P2 |
| Signature accent motif | MEDIUM | LOW-MEDIUM | P2 |
| Client-logo trust strip | LOW-MEDIUM | LOW | P2 |
| Motion-library orchestration | LOW | HIGH | P3 |
| Video/WebGL hero | LOW (wrong register) | HIGH | P3 (avoid) |

**Priority key:**
- P1: Must have for this milestone's "professional, polished, memorable" bar
- P2: Should have if time allows within the milestone
- P3: Nice to have or explicitly deferred/avoided

## Competitor Feature Analysis

| Feature | Agency sites (e.g. design studios) | Senior solo consultants (e.g. ariannalupi.com reference model) | Our Approach |
|---------|-------------------------------------|-------------------------------------------------------------------|--------------|
| Hero | Often video/motion-heavy, brand-identity-forward | Metric-first headline ("$41K → $76K"), restrained visuals | Already decided in PROJECT.md — KPI-first hero, no video |
| Case study depth | Portfolio-grid style, light on methodology | Structured: metadata, KPI cards, challenge/solution/results, numbered process, strategic conclusion, double CTA | Already modeled in PROJECT.md (`ResultsSection` etc.) — this research confirms it matches 2026 consulting-page conventions |
| Motion | Heavy scrollytelling, cursor effects, 3D | Minimal, purposeful (reveal-on-scroll, KPI count-up) | Adopt the restrained tier only — matches technical-credibility register |
| Dark mode | Inconsistent, often absent | Increasingly expected for developer-facing personal sites | Table-stakes item for this milestone — currently the biggest gap |
| Trust signals | Client logo walls, testimonial carousels | Same, plus visible author credentials/years/certifications (E-E-A-T) | `ClientLogosBlock`, `TestimonialsCarousel`, `AuthorByline` already exist — restyle for prominence |

## Sources

- [19 Best Portfolio Design Trends (In 2026) - Colorlib](https://colorlib.com/wp/portfolio-design-trends/)
- [Portfolio design trends for 2026: From AI builds to gamified portfolios - Envato](https://elements.envato.com/learn/portfolio-trends)
- [Engineer Portfolios: 20+ Well-Designed Examples (2026) - Sitebuilder Report](https://www.sitebuilderreport.com/inspiration/engineer-portfolios)
- [Software Engineer Portfolios: 15+ Well-Designed Examples (2026) - Sitebuilder Report](https://www.sitebuilderreport.com/inspiration/software-engineer-portfolios)
- [Top Web Design Trends for 2026 - Figma](https://www.figma.com/resource-library/web-design-trends/)
- [18 Interactive Portfolio Examples That Engage On Another Level - Really Good Designs](https://reallygooddesigns.com/interactive-portfolio-examples/)
- [Scrolling Designs: 8 Patterns and When to Use Each (2026) - Lovable](https://lovable.dev/guides/scrolling-designs-patterns-when-to-use)
- [15 best microinteraction examples for web design inspiration - Webflow Blog](https://webflow.com/blog/microinteractions)
- [Dark Mode Design Systems: A Complete Guide to Patterns, Tokens, and Hierarchy - Muzli Blog](https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/)
- [Dark mode dashboard design patterns SaaS founders are using in 2026 - AYDesign](https://www.aydesign.ai/blog/dark-mode-dashboard-design-patterns-2026)
- [Dark Mode First: Why Your SaaS Dashboard Should Default to Dark - Brent Haskins](https://brenthaskins.com/blog/dark-mode-first-saas-dashboard)
- [15 Best Case Study Design Examples that STAND OUT! - Content Beta](https://www.contentbeta.com/blog/case-study-design-examples/)
- [The True ROI of UX: B2B Redesign Case Studies - Toptal](https://www.toptal.com/designers/ux/roi-of-ux-redesign-case-studies)
- [How to Write an SEO-Friendly Author Bio for E-E-A-T (2026) - Sangfroid Web Design](https://www.sangfroidwebdesign.com/website-quality/seo-friendly-professional-author-bio-eat/)
- [5 Examples of Author Bios That Drive E-E-A-T - Fractl](https://www.frac.tl/author-bios-eeat/)
- [E-E-A-T SEO in 2026: Build Trust Signals That Rank - HYF Web](https://hyfweb.com/e-e-a-t-seo-in-2026-to-build-trust-signals-that-rank/)
- [The Ultimate shadcn/ui Handbook (2026 Edition) - shadcnspace](https://shadcnspace.com/blog/shadcn-ui-handbook)
- [Design Guidelines for shadcn/ui with Tailwind v4 - ctxs.ai](https://ctxs.ai/weekly/shadcn-ui-tailwind-v4-7z8p3v)
- Codebase inspection (direct, HIGH confidence): `src/app/globals.css`, `src/blocks/*`, `src/components/*`, `src/components/ui/*`, `package.json` — verified 2026-07-10

---
*Feature research for: Solo technical consultant portfolio visual/UX polish (v1.1 milestone)*
*Researched: 2026-07-10*
