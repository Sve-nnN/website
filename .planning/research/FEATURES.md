# Feature Research

**Domain:** Software engineer + SEO expert personal portfolio/brand site
**Researched:** 2026-07-09
**Confidence:** MEDIUM (WebSearch + WebFetch on live sites; no Context7/official docs applicable to this domain — competitor findings are MEDIUM confidence unless cross-verified across multiple sites, in which case HIGH)

## Competitor Analysis

Six sites analyzed in depth via WebFetch (live page content), one via WebSearch corroboration only. Selected to cover both ends of Juan's positioning: pure SEO consultants (credibility/conversion patterns) and engineer-focused personal sites (performance/UX patterns).

| Site | Who | Why relevant | Method |
|------|-----|---------------|--------|
| [lucatagliaferro.com](https://www.lucatagliaferro.com/seo-results/) | Luca Tagliaferro, technical SEO consultant | Results-first case study format, zero fluff | WebFetch |
| [aleydasolis.com](https://www.aleydasolis.com/en/) | Aleyda Solis, international SEO consultant (Orainti) | Top-tier E-E-A-T signals, bilingual site (EN/ES — directly relevant), newsletter funnel | WebFetch |
| [kevin-indig.com](https://www.kevin-indig.com/) | Kevin Indig, SEO/growth advisor (ex-Shopify, G2, Atlassian) | Clean advisory-site structure, strong testimonials+logos pattern | WebFetch |
| [leerob.com](https://leerob.com/) | Lee Robinson, engineer (Cursor, ex-Vercel) | Minimalist engineer-site benchmark, technically pristine | WebFetch |
| [joshwcomeau.com](https://www.joshwcomeau.com/) | Josh Comeau, engineer/educator | Content depth + interactivity as differentiation, strong internal linking/taxonomy | WebFetch |
| [swyx.io](https://www.swyx.io/) | Shawn "swyx" Wang, engineer/DevRel | Hub-and-spoke content architecture (essays/talks/podcasts unified), multi-format E-E-A-T | WebFetch |
| elischwartz.co / productledseo.com | Eli Schwartz, SEO consultant, published author | Author-as-authority via book + press mentions (verified via WebSearch only — treat as MEDIUM confidence, not independently WebFetched) | WebSearch |

### What to steal from each

- **Luca Tagliaferro** — Case studies as the primary conversion object, not an afterthought. Each case study leads with a quantified metric ("7× SEO ROI", "4,455% organic growth") in the headline, not buried in a paragraph. No traditional testimonials needed when the numbers do the work — Juan should apply this exact pattern to his case studies collection: headline metric + filterable by category/industry.
- **Aleyda Solis** — Bilingual site done right (EN/ES toggle, WPML-style but Juan will do it via next-intl/Payload localization). Award/press-mention strip ("European Search Personality of the Year", Forbes, USA Today) as a compact trust block. Client logo row (6 recognizable brands) placed high on the page, not buried. Steal the newsletter/resource-hub pattern only partially — Juan's site should NOT try to run 3 concurrent funnels (SEOFOMO + LearningSEO.io + podcast); pick one CTA.
- **Kevin Indig** — Testimonials paired with role/company ("SEO & Growth PM @ Nextdoor") rather than anonymous quotes — this is the credibility format to replicate on Juan's testimonials section. Single clear H1 value proposition ("I unlock Organic Growth" equivalent). Client logo wall is large (20+) but curated — Juan should use his real client/work logos from the existing `Works`/testimonials collections, not pad with recognizable-but-irrelevant names.
- **Lee Robinson** — The benchmark for "clean, no-clutter" that matches Juan's own explicit backend/frontend goal. No newsletter, no funnel — just Bio, Writing, Code, Videos, direct email CTA. Proves that minimalism is credible when backed by real output (current role, years of experience, concrete artifacts). This is the closest structural analog to what Juan's `PROJECT.md` describes wanting to avoid clutter.
- **Josh Comeau** — Content depth and topical clustering (posts tagged into CSS/React/Animation/Career) with a visible "Popular Content" ranking — a pattern Juan can replicate on the blog listing to surface case-study-adjacent, high-value posts instead of a flat reverse-chronological list. Course/product pages demonstrate authority beyond blog posts (Juan doesn't need courses, but case studies serve the same authority-proof role).
- **swyx.io** — Hub-and-spoke architecture unifying multiple content formats (essays, talks, podcasts) under one `/ideas`-style index with type icons — useful if Juan's blog/case-studies/speaking content grows past a simple two-collection split. Portfolio + About + Subscribe kept to 3 core destinations; resist over-fragmenting nav.
- **Eli Schwartz** — Authority-by-publication: a well-known book title and press mentions (TechCrunch, Y Combinator) compress trust into a single sentence in the bio. Juan doesn't have a book, but the pattern — "credentials as a one-line trust signal near the H1" — applies directly to his About/author bio.

## Feature Landscape

### Table Stakes (Users Expect These)

Features every credible engineer/SEO-expert portfolio has. Missing these = the site reads as unfinished or the "SEO expert" claim looks unearned.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Author bio with credentials near every piece of content | E-E-A-T signal Google (and humans) look for; every site studied has an About/bio surfaced prominently, several right at the H1 | LOW | Juan's project already has an `Authors` collection — ensure bio + credentials render on every post/case study byline, not just an About page |
| Case studies with quantified metrics in the headline | Luca Tagliaferro, Aleyda Solis, Kevin Indig all lead with numbers, not narrative | MEDIUM | Requires the `CaseStudies` collection to have a structured "headline metric" field, not just freeform body copy |
| Blog with topical organization/taxonomy | Josh Comeau, swyx, Aleyda Solis all group content, not just reverse-chronological | LOW-MEDIUM | Categories collection already in scope; ensure blog listing surfaces "popular"/featured posts, not only latest |
| Clean meta titles/descriptions, canonical URLs, OG tags per page | Universal across every site studied; baseline technical SEO | LOW | Already covered by `@payloadcms/plugin-seo` requirement in PROJECT.md |
| XML sitemap + robots.txt | Universal baseline, already required by PROJECT.md | LOW | Already in scope |
| Fast page loads / good Core Web Vitals impression | Lee Robinson and Josh Comeau sites are visibly fast and minimal; this is the credibility test for an engineer's own site — a slow site actively undermines the "I do performance/SEO right" claim | MEDIUM | Ties directly to PROJECT.md's Core Web Vitals requirement — Cloudinary image optimization + standalone Next.js output must actually deliver this |
| Mobile-responsive, accessible navigation | Universal | LOW | Standard Next.js/Tailwind implementation |
| Contact CTA that is not buried | Every site studied has a clear, singular contact path (email link, contact form, or "Book a call") | LOW | Already in scope via contact page + Resend |
| Testimonials/social proof tied to named roles or companies | Kevin Indig and Aleyda Solis format testimonials with attribution (name, role, company) — anonymous quotes read as weak | LOW | Testimonials collection already in scope — enforce structured fields (name, role, company) rather than a freeform quote blob |
| Bilingual content parity (EN/ES) | Directly required by PROJECT.md; Aleyda Solis is the proof this is standard practice at the top of the SEO-consultant space | MEDIUM-HIGH | Already in scope via next-intl/Payload localization |

### Differentiators (Competitive Advantage)

Features that set the best sites apart from generic portfolios. These align with Juan's Core Value: demonstrably proving technical + SEO skill through both content and execution.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Case study format with structured proof (problem → approach → metric → stack) | Recruiters/clients and search engines both need to understand *why* the work mattered, not just that it happened — this is the single biggest lever competitor sites use to build credibility | MEDIUM | Model the `CaseStudies` collection fields around this structure explicitly (problem statement, role, stack, outcome metric) rather than a single rich-text body |
| Author/E-E-A-T schema markup (Person, Article, or equivalent) on posts and case studies | None of the fetched sites showed this in visible markup, but it's the documented best practice for author authority — Juan's SEO-expert positioning means this should be visibly correct, not just present | LOW-MEDIUM | `@payloadcms/plugin-seo` handles meta but Juan should verify/add JSON-LD (Person, Article, BreadcrumbList) manually — a place where Juan can outperform every site studied, none of which showed exemplary schema depth |
| Credentials/press-mention strip near the hero | Aleyda Solis (awards, Forbes/USA Today) and Eli Schwartz (book, TechCrunch) both compress authority into a single visible line | LOW | If Juan has press mentions, speaking engagements, or notable client logos, surface them as a compact strip on the homepage — skip entirely if none exist yet (don't fabricate) |
| `llms.txt` / `llms-full.txt` for AI/GEO discoverability | Already required by PROJECT.md; none of the competitor sites studied appear to do this yet — this is a genuine differentiator, not table stakes, in mid-2026 | LOW | Already in scope — worth calling out in case studies/blog as evidence of staying current with SEO practice (GEO) |
| Visibly fast, minimal, "dogfooded" site as proof-of-skill | Lee Robinson's site is the standard-bearer: no bloat, but every technical choice (View Transitions, clean typography) is a quiet demonstration of engineering judgment | MEDIUM | This is where Juan's "clean, no-clutter backend/frontend" goal doubles as a feature, not just an implementation preference — the absence of SEO-tooling clutter (dashboards, internal metrics UI) should read as intentional restraint to anyone who inspects the site or admin |
| Popular/featured content surfacing on blog and case study listings | Josh Comeau's "Popular Content" ranking gives new visitors a fast path to best work instead of forcing them through chronological scroll | LOW | Add a `featured` boolean or manual ordering field to Posts/CaseStudies |

### Anti-Features (Commonly Requested, Often Problematic)

Things that seem good but create bloat or undermine the "clean" positioning — directly relevant given PROJECT.md's explicit exclusion of internal SEO tooling.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Internal SEO/analytics dashboards visible in admin (GSC metrics, keyword tracking, broken-link checkers) | The current JuanPortfolio site has these; feels natural to carry over since Juan is an SEO expert | This is exactly the clutter PROJECT.md explicitly excludes — it bloats the Payload admin, adds maintenance surface, and has nothing to do with the public-facing site's job of demonstrating skill | Use external tools (Google Search Console, Ahrefs, etc.) directly; keep Payload admin scoped to content only |
| Multiple concurrent newsletter/lead-gen funnels (newsletter + podcast + resource hub + course waitlist) | Aleyda Solis runs 3+ funnels simultaneously and it "works" for her at her scale/team size | For a solo personal portfolio, multiple competing CTAs dilute conversion and add pages/collections with no content behind them at launch | One CTA: contact form (already in scope). Add a newsletter only if/when there's a real cadence of content to justify it |
| Generic testimonial carousel with anonymous or vague quotes | Feels like standard "trust signal" boilerplate | Anonymous or unattributed testimonials read as filler, not proof — actively weaker than no testimonials at all (per Luca Tagliaferro's numbers-only approach) | Structured testimonials with name + role + company (already the plan); if attribution isn't available, prefer case study metrics over vague quotes |
| Heavy client-side interactivity/animation libraries "to look impressive" | Josh Comeau's site uses animation, tempting to copy | Animation-heavy sites risk hurting Core Web Vitals (the opposite of Juan's stated goal) unless implemented with real performance discipline that Josh Comeau demonstrably has; a rushed copy is a liability, not an asset | Keep interactivity minimal and purposeful (subtle transitions only); prioritize CWV over visual flourish, consistent with the Lee Robinson benchmark |
| Speaking/podcast/media page with no real content | swyx.io and Aleyda Solis both have rich speaking histories that justify a dedicated page | An empty or sparse "Speaking" section with 1-2 items looks worse than not having the section at all | Fold any speaking/press mentions into the About/bio page as a short list instead of a dedicated collection, unless there's enough material (5+) to justify one |
| Overly granular content-type fragmentation (separate collections for talks, podcasts, videos, notes, essays) | swyx.io's hub-and-spoke model looks appealing to emulate exactly | PROJECT.md already scopes content to Pages/Posts/CaseStudies/Authors — adding more collections up front is exactly the "internal tooling bloat" this rebuild is meant to eliminate | Stick to the existing collection scope; if content volume later justifies it, extend post-launch, not at MVP |

## Feature Dependencies

```
Case study structured fields (problem/approach/metric/stack)
    └──requires──> CaseStudies collection schema update (structured, not just rich text)
                       └──requires──> Content migration mapping from JuanPortfolio's current case study data

Author bio + credentials on every post/case study
    └──requires──> Authors collection populated with real bio/credential data (already in scope)

JSON-LD schema markup (Person, Article, BreadcrumbList)
    └──requires──> plugin-seo base setup (meta/OG/canonical) — already in PROJECT.md scope
    └──enhances──> Author bio + credentials feature (schema surfaces the same E-E-A-T signal machine-readably)

Featured/popular content surfacing on blog & case studies
    └──requires──> Posts/CaseStudies collections having an ordering or "featured" field

Bilingual EN/ES parity ──enhances──> every content feature above (each must exist in both locales)

Internal SEO/analytics dashboards ──conflicts──> "clean, no-clutter backend" goal (explicitly excluded in PROJECT.md)
Multiple concurrent lead-gen funnels ──conflicts──> single clear CTA anti-feature guidance above
```

### Dependency Notes

- **Case study structured fields require a schema update, not just content migration:** the current JuanPortfolio case studies likely exist as freeform rich text; replicating the Luca Tagliaferro/Aleyda Solis pattern (headline metric, problem/approach/outcome) means the `CaseStudies` collection needs explicit structured fields, which affects the migration/seed script referenced in PROJECT.md.
- **JSON-LD schema markup enhances but does not require author bios** — it can be added independently, but is most valuable once bios/credentials exist to reference.
- **Bilingual parity is a multiplier, not a separate feature** — every table-stakes and differentiator item above must be verified in both EN and ES, which increases QA surface for the roadmap.
- **Internal SEO tooling directly conflicts with the stated Core Value** — any temptation to "port over" GSC metrics/keyword dashboards from JuanPortfolio should be resisted; this is already resolved as Out of Scope in PROJECT.md and this research reinforces that decision with competitor evidence (none of the sites studied expose SEO tooling publicly or in a way visitors interact with).

## MVP Definition

### Launch With (v1)

- [ ] Case studies with structured headline metrics (problem → approach → metric → stack) — this is the single highest-leverage credibility feature per competitor analysis
- [ ] Author bios with credentials rendered on every post/case study byline
- [ ] Testimonials with structured name/role/company attribution
- [ ] Blog with category taxonomy + featured/popular post surfacing
- [ ] Bilingual EN/ES parity across all content types
- [ ] Clean meta/OG/canonical via plugin-seo, sitemap, robots.txt (already scoped)
- [ ] Fast, minimal homepage: clear H1 value proposition + credentials line, no funnel clutter

### Add After Validation (v1.x)

- [ ] JSON-LD structured data (Person, Article, BreadcrumbList) beyond what plugin-seo provides out of the box — trigger: once base SEO plugin is live and stable, layer this in as a genuine differentiator
- [ ] Press-mention/award strip on homepage — trigger: only if/when Juan has real press mentions or notable client logos to show; do not fabricate placeholders

### Future Consideration (v2+)

- [ ] Dedicated Speaking/media page — defer until there's enough real speaking history (5+ engagements) to justify a standalone section
- [ ] Newsletter — defer until there's a sustainable content cadence to support it; avoid launching an empty funnel

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Structured case studies with headline metrics | HIGH | MEDIUM | P1 |
| Author bio/credentials on content | HIGH | LOW | P1 |
| Structured testimonials (name/role/company) | MEDIUM | LOW | P1 |
| Blog taxonomy + featured posts | MEDIUM | LOW | P1 |
| Bilingual parity | HIGH | MEDIUM-HIGH | P1 |
| plugin-seo meta/OG/canonical, sitemap, robots.txt | HIGH | LOW | P1 |
| JSON-LD schema markup (Person/Article) | MEDIUM | LOW-MEDIUM | P2 |
| Press-mention/credentials strip on homepage | MEDIUM | LOW | P2 |
| Dedicated Speaking page | LOW | LOW | P3 |
| Newsletter funnel | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Luca Tagliaferro | Aleyda Solis | Kevin Indig | Lee Robinson / Josh Comeau / swyx | Our Approach |
|---------|-------------------|--------------|--------------|-------------------------------------|--------------|
| Case studies | Filterable, metric-first headline, no testimonials needed | N/A (services-led) | N/A (testimonial-led) | N/A | Adopt Tagliaferro's metric-first headline pattern for Juan's `CaseStudies` collection |
| Testimonials | Absent by design | Video testimonials w/ exec titles | Attributed quotes w/ role+company | Absent | Structured text testimonials with name/role/company (lighter than video, more credible than anonymous) |
| Bilingual | No | Yes (EN/ES) | No | No | Required — matches Aleyda Solis as the proof point this is standard at the top of the space |
| Site minimalism / clutter avoidance | Moderate (services menu is dense) | Moderate (3+ funnels) | Moderate | High (Lee Robinson is the benchmark) | Follow Lee Robinson's minimalism, informed by PROJECT.md's explicit "no clutter" goal |
| Content taxonomy | Service + case-study categories | Blog + resource hub | Minimal (advisory-focused) | Josh Comeau: category tags + popular ranking; swyx: format-based hub | Adopt Josh Comeau's category tags + featured/popular surfacing for the blog |
| Authority signals | Quantified results only | Awards, press, client logos | Testimonials + logos | Role/experience stated plainly | Combine metric-first case studies (Tagliaferro) with a compact credentials line near hero (Eli Schwartz pattern) |

## Sources

- [lucatagliaferro.com/seo-results](https://www.lucatagliaferro.com/seo-results/) — WebFetch, MEDIUM-HIGH confidence (direct page content)
- [aleydasolis.com/en](https://www.aleydasolis.com/en/) — WebFetch, MEDIUM-HIGH confidence
- [kevin-indig.com](https://www.kevin-indig.com/) — WebFetch, MEDIUM-HIGH confidence
- [leerob.com](https://leerob.com/) — WebFetch, MEDIUM-HIGH confidence
- [joshwcomeau.com](https://www.joshwcomeau.com/) — WebFetch, MEDIUM-HIGH confidence
- [swyx.io](https://www.swyx.io/) — WebFetch, MEDIUM-HIGH confidence
- Eli Schwartz (elischwartz.co / productledseo.com) — WebSearch only, LOW-MEDIUM confidence, not independently verified via WebFetch
- [jaysearch.com/blog/seo-portfolio-examples](https://jaysearch.com/blog/seo-portfolio-examples) — WebSearch, general SEO portfolio patterns, LOW confidence (secondary source)
- [sitebuilderreport.com/inspiration/seo-portfolios](https://www.sitebuilderreport.com/inspiration/seo-portfolios) — WebSearch, general SEO portfolio patterns, LOW confidence
- [shipixen.com/blog/seo-checklist-for-developer-portfolios-and-landing-pages](https://shipixen.com/blog/seo-checklist-for-developer-portfolios-and-landing-pages) — WebSearch, developer-portfolio SEO checklist reference, LOW-MEDIUM confidence
- /Users/juan/Documents/Codigo/Personal/juantech/juan-payload/.planning/PROJECT.md — project context, HIGH confidence (source of truth for scope)

---
*Feature research for: software engineer + SEO expert personal portfolio*
*Researched: 2026-07-09*
