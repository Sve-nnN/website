# Pitfalls Research

**Domain:** Adding a "Websites Portfolio" collection (real sites + Lighthouse scores + screenshots) to an existing Payload/Next.js portfolio that already has `case-studies` and `clientes`
**Researched:** 2026-07-14
**Confidence:** MEDIUM-HIGH (informed by direct read of `.planning/PROJECT.md` schema decisions + general web research on screenshot legality and schema.org typing; LOW confidence specifically on per-site ToS status of the 6 target sites, which needs a manual check, not research)

## Critical Pitfalls

### Pitfall 1: Lighthouse scores captured once, presented as current forever

**What goes wrong:**
Lighthouse performance/accessibility/best-practices/SEO scores are stored as static numeric fields on the `Websites` doc at seed time. Six months later Juan redesigns `aprendoclub.com` or Google ships a Core Web Vitals algorithm change, and the site now shows stale (often inflated) numbers next to a `year: 2026` badge — the opposite of the "impeccable technical execution" core value this whole rebuild is built around. Nothing in the schema signals "as of X date," so a visitor (or Juan himself months later) can't tell if the number is trustworthy.

**Why it happens:**
Lighthouse has no push/webhook model — it's a point-in-time CLI/PSI run. Teams model it as a plain number field because that's the simplest schema, and nobody schedules a re-check because there's no natural trigger (no CI, no cron already running against Payload).

**How to avoid:**
- Add a `lighthouseCapturedAt` (date) field alongside the four score fields — never store scores without a capture timestamp.
- Render the date next to the scores in the UI ("Lighthouse 96/100 · captured Jul 2026") rather than presenting them as live facts.
- Store the PSI/Lighthouse JSON report URL or raw JSON blob (not just the 4 numbers) so a future refresh can diff instead of re-running blind, and so the number is defensible ("here's the report").
- Optional but cheap: a documented manual runbook ("re-run Lighthouse for all 6 Websites docs before any milestone that touches CWV, or every ~6 months") — don't build live PSI API polling infra for a portfolio's 6 static entries, that's over-engineering for this scale.

**Warning signs:**
- Score fields with no accompanying date field in the collection schema.
- Scores that are suspiciously round or all-identical across sites (copy-paste seed data, not real runs).

**Phase to address:**
Schema/collection phase (when `Websites` fields are defined) — the `capturedAt` field is nearly free to add now, expensive to retrofit once content and any listing/sort-by-score UI already assumes 4 bare numbers.

---

### Pitfall 2: Screenshotting external live sites without checking robots/ToS, ending up with rate-limit bans or legal exposure

**What goes wrong:**
Someone (Juan or an agent) automates screenshots of the 6 external URLs via a headless-browser call each time content is refreshed, or worse, the site tries to fetch a live screenshot at request time. Two failure modes: (a) the target site's WAF/CDN detects the automated request pattern and rate-limits or blocks the IP — annoying if it's a client's own site (`drmanuelvargashidalgo.com`) that Juan doesn't want to accidentally hammer; (b) if any of the 6 sites is under NDA or the client relationship has since ended, publishing a full-page screenshot of their live UI/branding without a fresh check-in could be a client-relations problem even if not strictly illegal, since it visually represents their current product.

**Why it happens:**
Screenshotting your own past work feels risk-free because "it's public, anyone with a browser could see it" — true for a one-off manual capture, but automated/repeated capture at scale is what actually trips ToS and bot-detection rules, and portfolio content tends to get "refreshed" more than people expect (redesigns, new sections, future re-runs of this same phase).

**How to avoid:**
- Capture screenshots **manually, once, as static assets** uploaded through the existing Cloudinary media pipeline — do not build an automated recurring screenshot job for 6 external sites. This matches the project's existing media pattern (Media collection + Cloudinary adapter) and avoids the entire bot-detection/ToS-automation risk category.
- Before capturing, a quick sanity check per site: is it Juan's own site or a client he's still on good terms with? All 6 listed (ariannalupi.com, aprendoclub.com, estylopia.com, drmanuelvargashidalgo.com, apturio.com, juan-tech.com) read as Juan's own work/agency-adjacent sites, not arm's-length clients whose ToS would forbid this — but this is a judgment call for Juan, not something research can verify from outside. Flag it, don't assume.
- Store screenshots with a captured-at context similar to Lighthouse (redesigns happen; a screenshot from 2026 of a site redesigned in 2027 is misleading the same way a stale score is).
- Never hotlink/embed the live external site (e.g., iframe) to "always show current state" — that reintroduces the automation/ToS problem continuously instead of once, and adds a runtime dependency on 6 third-party uptimes for your own homepage.

**Warning signs:**
- Any code path that fetches `liveUrl` at build/request time to render a preview (iframe, live screenshot API call) instead of a stored Cloudinary asset.
- A screenshot job scheduled to run repeatedly rather than a one-time manual capture step in the content-population phase.

**Phase to address:**
Content population phase (when the 6 real sites are seeded) — capture screenshots manually as a one-time task, store via Media/Cloudinary, and make "static asset only, no live fetch" an explicit constraint in that phase's plan.

---

### Pitfall 3: `Websites` and `CaseStudies` drift into duplicated or contradictory content

**What goes wrong:**
Both collections describe "a project Juan worked on." Without a clear rule for what goes where, editors (present or future Juan) end up either (a) creating a `CaseStudies` doc and a `Websites` doc for the same project with diverging descriptions of the same work — inconsistent stack/year/role facts visible to a visitor who clicks both, undermining the credibility the site is trying to build — or (b) treating them as fully redundant and never bothering to cross-link, so a visitor who finds the case study never discovers the matching technical portfolio entry (or vice versa), losing the cross-promotion value the optional relationship field was clearly designed to provide.

**Why it happens:**
The two collections encode genuinely different angles on the same underlying thing (client results/storytelling vs. technical build details), which is exactly why PROJECT.md's Core Value section calls out both "content (case studies)" and "technical execution" as the two things that must be demonstrated — but that intentional separation is easy to blur once someone is filling in forms for six real sites and needs to make an in-the-moment call about which collection a given site belongs in.

**How to avoid:**
- Write down the rule explicitly before content population, not after: `CaseStudies` = "has measurable client results / before-after metrics, written as a narrative" (per the `ariannalupi.com/casos/ecommerce-vape` model already referenced in PROJECT.md); `Websites` = "a live URL I built, shown for the technical build quality (stack, scores, screenshots), independent of whether there's a results narrative." A site can have both a `CaseStudies` doc and a `Websites` doc — that's the intended use of the optional cross-relationship field, not a sign of duplication.
- When a site has both, the two docs should state the *same* facts where they overlap (year built, stack, client name) — treat one as source of truth for shared facts (recommend `Websites` for technical facts, `CaseStudies` for narrative/results) rather than hand-typing the same field twice in both places.
- Render the cross-link in both directions in the UI: from a `CaseStudies` detail page link to the matching `Websites` entry ("see the technical build") and vice versa ("see the results") — so the duplication risk becomes a feature (two angles, one linked pair) instead of two disconnected records.

**Warning signs:**
- A `Websites` doc and a `CaseStudies` doc for the same `liveUrl` with different `stack`/`year` values.
- The optional cross-relationship field left empty on docs where a matching doc obviously exists in the other collection.

**Phase to address:**
Should be resolved in the schema/collection-design phase (define the relationship field + the content rule) and re-verified during content population when the 6 real sites are seeded (check: does this site already have a CaseStudies doc? link it, don't duplicate facts).

---

### Pitfall 4: Relationship modeling — treating `Clientes` and `CaseStudies` links as one-to-many when reality is many-to-many (or vice versa)

**What goes wrong:**
`Clientes` today is described in PROJECT.md as "lean — only for carousel of logos" (name, logo, link). If the new `Websites` → `Clientes` relationship is modeled as a single `relationship` field assuming one client per site, it breaks the first time a site was built *for* a client but the client itself isn't in the lean `Clientes` collection (e.g., a personal/agency site like `apturio.com` or `juan-tech.com` with no external client), or the reverse case where one client relationship spans multiple sites (a client for whom Juan built more than one site over time). Conversely, over-modeling this as a many-to-many join collection for what is actually ~6 static entries is unnecessary schema complexity for a portfolio's scale.

**Why it happens:**
Relationship cardinality mistakes are the classic CMS schema trap — it's tempting to copy the shape of an existing relationship (e.g., how `CaseStudies` already relates to `Clientes`, if it does) without checking whether the new collection's real-world cardinality actually matches.

**How to avoid:**
- Make the `Websites.client` relationship field **optional** (per the milestone's own description — "relación opcional a Clientes") and a single relationship (`hasMany: false`), not required — several of the 6 real sites (apturio.com, juan-tech.com are plausibly Juan's own/agency sites, not third-party clients) will legitimately have no client.
- Do not build a many-to-many join table for this — Payload's built-in `relationship` field with `hasMany: false` on `Websites` (pointing at one `Clientes` doc) is sufficient at this scale; if a client ever has multiple sites, that's discoverable by querying `Websites` filtered by `client` equals X, no join collection needed.
- Same logic for the optional cross-link to `CaseStudies`: keep it a single optional relationship field, not bidirectional-managed arrays on both sides (Payload can auto-generate the reverse lookup via a `join` field type in recent Payload versions if a "case studies related to this website" list view is wanted — verify `join` field support in Payload 3.85 before hand-rolling a reverse array).

**Warning signs:**
- A required (non-optional) `client` field on `Websites` that would block seeding the 2-3 sites without a matching client.
- Any new junction/pivot collection created just to link `Websites` ↔ `Clientes` for 6 rows of data.

**Phase to address:**
Schema/collection-design phase — get the field's `required: false` and `hasMany: false` decisions right before content population starts, since changing cardinality after real docs exist means a data migration (per this project's Database Safety rule, any field reshape that could lose data needs Juan's named sign-off).

---

### Pitfall 5: Wrong or missing JSON-LD type for the new content — SEO payoff assumed but not actually implemented correctly

**What goes wrong:**
The whole point of this milestone, per Core Value, is demonstrating SEO expertise "tangibly." If `Websites` detail pages ship with no structured data, or with the wrong type (e.g., reusing `CaseStudies`' schema.org type verbatim, or picking `SoftwareApplication` — which Google's structured-data guidelines associate with actual downloadable/installable apps and expects `applicationCategory`/`operatingSystem`/`offers` properties that don't apply to "a website I built for a client"), that's a visible, checkable SEO gap on the site of someone whose core value proposition is SEO expertise.

**Why it happens:**
`SoftwareApplication` sounds tempting because these are technically "web applications," but schema.org's own definition and Google's Rich Results eligibility for that type target installable software/apps with pricing/OS/category, not portfolio entries. Reusing the `CaseStudies` JSON-LD builder (if one exists as a shared component, per this project's established pattern of extracting shared helpers like `buildTrail()`) without checking whether its type/props fit "a website, not a results narrative" is the likely failure mode given this project already has a `CaseStudies` JSON-LD implementation to copy from.

**How to avoid:**
- Use `CreativeWork` as the base type for each `Websites` detail page (schema.org's general-purpose type for portfolio items, valid Google-recognized properties: `name`, `description`, `url`, `dateCreated`/`datePublished`, `creator`/`author`, `keywords` for stack tags, `image` for screenshots).
- Do not use `SoftwareApplication` unless the entry is genuinely a distributable app with pricing/OS info — none of the 6 target sites fit that (they're marketing/client sites, not downloadable software).
- Consider layering `CreativeWork` with an `about`/`mentions` reference to the `Organization` (if the client is known) — reuse the existing `Person`/`Organization` JSON-LD building blocks from the Author/CaseStudies phases (per Phase 12's Person JSON-LD pattern) rather than inventing a new structured-data shape from scratch.
- If a listing page exists (`/websites` or similar), wrap the collection in `ItemList` with each item pointing at its `CreativeWork` — this is the standard pattern already implicitly established by the Services/Case Studies listing pages in this project.
- Verify in Google's Rich Results Test that the chosen type actually renders (or at minimum validates) — `CreativeWork` alone often produces no visible rich result in search, which is fine (it's for machine-readability/GEO/AI search, consistent with this project's `llms.txt` investment) but don't oversell it as "will show a rich snippet."

**Warning signs:**
- Reusing the `CaseStudies` JSON-LD component verbatim with only field renames.
- `SoftwareApplication` type present without `applicationCategory` + `operatingSystem` (Google will flag this as incomplete in Rich Results Test).
- No structured data at all on the new detail/listing pages while every other content type in this project (Pages, Posts, Authors, Services, breadcrumbs) already has JSON-LD — an obvious regression relative to established project convention.

**Phase to address:**
Frontend pages phase (listing + detail page build) — schema choice should be locked in the same phase as the page templates, verified with Rich Results Test / schema validator before the milestone's audit gate.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Store Lighthouse scores as 4 bare numbers, no date/report link | Faster schema, faster seed | Numbers become silently misleading after any redesign; no way to know if a score is 1 month or 2 years old | Never — the `capturedAt` field costs almost nothing to add up front |
| Reuse `CaseStudies`' JSON-LD builder unmodified for `Websites` | Zero new code | Wrong schema.org semantics shipped on a site whose core value is SEO correctness | Never for this project given its stated Core Value; acceptable only as a throwaway prototype never deployed |
| Skip the `Websites` ↔ `CaseStudies` cross-link field at launch, add "later" | Simpler v1 schema | Duplicated facts across the two collections go unnoticed once both exist for the same site; harder to retrofit once content exists | Only acceptable if truly zero sites will ever have both a case study and a portfolio entry — unlikely given at least some of the 6 (e.g., aprendoclub.com) plausibly already have or will have a case study |
| Manually capture screenshots once, no automated refresh pipeline | Avoids all screenshot-automation ToS/rate-limit risk | Screenshots go stale after a redesign, same staleness problem as Lighthouse scores | Acceptable indefinitely at this scale (6 sites) — the "cost" is just a manual re-capture task, not a design flaw, as long as a `capturedAt` date is stored alongside |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|--------------|------------------|--------------------|
| Lighthouse / PageSpeed Insights | Treating a single PSI run as ground truth; PSI lab scores vary run-to-run by several points due to network/CPU throttling variance | Run Lighthouse 2-3 times per site and record a representative score (or use PSI's field data / CrUX report where available for real-user data), and always store the capture date |
| Screenshot capture of external sites | Automating repeated fetches against a client's live site, risking bot-detection/rate-limiting on infrastructure Juan doesn't control | Capture manually as a one-time task per site, store as a static Cloudinary asset — same env-gated Cloudinary pipeline already used for Media in this project |
| Cross-collection relationship (`Websites` ↔ `CaseStudies` ↔ `Clientes`) | Building a bidirectional array-of-relationships pattern on both sides that must be kept in sync manually | Use a single-direction `relationship` field on `Websites` and rely on Payload's `join` field type (verify availability in 3.85) for reverse lookups instead of duplicating the link on both collections |
| JSON-LD for new content type | Copy-pasting an existing JSON-LD builder (from `CaseStudies` or `Authors`) without checking the schema.org type still fits | Pick the type (`CreativeWork`) based on what the content actually is, not based on what code already exists to copy |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Storing large uncompressed screenshot images without going through the existing Cloudinary transform pipeline | Slow LCP on the new listing/detail pages, undermining the exact CWV story this milestone is meant to showcase | Route all screenshots through the same Cloudinary upload/adapter and responsive-size pattern already used for Media in this project — no bypass with raw `<img>` tags pointing at un-transformed originals | Immediately visible in Lighthouse for the new pages themselves — ironic if the "Lighthouse scores" showcase page has a bad Lighthouse score |
| Rendering all 6 `Websites` docs' full screenshot sets on a single listing page with no lazy-loading | Listing page LCP/CLS regression | Reuse the existing lazy-load/image-optimization pattern from `FeaturedCaseStudiesBlock`/`FeaturedContent` rather than inventing new markup | Noticeable even at 6 items if screenshots are full-page (not thumbnail) captures |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing a `liveUrl` field with no output-encoding/allowlist and rendering it as a raw link or (worse) an iframe src | Low but non-zero XSS/clickjacking surface if `liveUrl` content is ever attacker-influenced (unlikely here since Juan is the sole editor, but still a clean-code hygiene issue) | Treat `liveUrl` as a validated URL field (Payload's own URL validation) rendered only as an `<a href>`, never as an iframe or raw HTML injection |
| Screenshot images potentially containing another site's user data (e.g., a demo/testimonial with a real name visible in a captured UI) | Minor GDPR/privacy exposure if the screenshot captures another person's personal data incidentally rendered on the target page | When manually capturing, prefer marketing/homepage views over dashboards or any page that could show real user data; crop or blur if unavoidable |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Presenting Lighthouse scores as if they are live/real-time | Visitor assumes the number reflects the site *today*, loses trust if they check the live site and see something different | Explicit "as of [date]" label next to scores, consistent with how the site already treats dated case study results |
| Listing `Websites` and `CaseStudies` as visually identical card grids on Home with no distinguishing label | Visitor can't tell why there are two sections about "things Juan built" — feels redundant rather than complementary | Give each section its own distinct framing per PROJECT.md's stated intent ("no solo case studies con storytelling SEO" vs. "portfolio de desarrollo técnico") — different card content emphasis (stack/scores vs. metrics/results) |
| No indication on a `Websites` card of whether a matching case study exists | Visitor interested in results has to hunt for it separately | Small "See the case study" link/badge on cards where the cross-relationship field is populated |

## "Looks Done But Isn't" Checklist

- [ ] **Lighthouse scores:** Often missing a capture date — verify every `Websites` doc has a `lighthouseCapturedAt` (or equivalent) field populated, not just the 4 numeric scores.
- [ ] **Screenshots:** Often captured once by hand and never routed through the Cloudinary optimization pipeline like other Media — verify screenshots are actual `Media` collection docs with Cloudinary-hosted derivatives, not raw local files or hotlinked external URLs.
- [ ] **Client relationship:** Often modeled as required when it should be optional — verify at least one of the 6 seeded sites (a personal/agency site) has `client` left empty and the UI renders gracefully without a client name/logo shown.
- [ ] **Cross-link to CaseStudies:** Often left unpopulated even where an obvious matching case study exists — verify each of the 6 sites was checked against the existing `CaseStudies` collection before publishing, and the relationship field set where a match exists.
- [ ] **JSON-LD:** Often absent entirely on new content types added after the initial SEO-plugin rollout, or copy-pasted with the wrong schema.org type — verify with Google's Rich Results Test / Schema Markup Validator that the `Websites` detail page emits valid `CreativeWork` (not `SoftwareApplication`) structured data, and that the listing page emits `ItemList`.
- [ ] **Bilingual fields:** Given this project's own documented history of non-localized fields breaking things 3+ times in v1.5 (`Header.navItems.url`, `Content.link.url`, `TestimonialsCarousel.title`), explicitly check every text field added to `Websites` (`challenges`, `highlights`, any labels) for `localized: true` where it should apply — this exact bug class has recurred repeatedly in this project.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|-------------------|
| Stale Lighthouse scores discovered post-launch | LOW | Re-run Lighthouse for the affected site(s), update the 4 score fields + `capturedAt` via a normal content update (non-destructive, no migration needed) |
| Wrong JSON-LD type shipped (e.g., `SoftwareApplication` used) | LOW-MEDIUM | Swap the type in the shared JSON-LD builder component; no schema/DB change needed since JSON-LD is rendered from existing fields, not stored as its own type |
| `client` field made required by mistake, blocking seed of client-less sites | MEDIUM | Additive migration to relax `required: true` → `false` on an existing column is generally safe (loosening a constraint, not narrowing it) — but confirm with a generated migration reviewed before applying, per this project's Database Safety rule |
| Duplicated/contradictory facts discovered between a `CaseStudies` doc and a `Websites` doc for the same site | LOW | Content-only fix: reconcile the two docs' overlapping fields (year, stack) and populate the cross-relationship field — no schema change |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|-----------------|
| Stale Lighthouse scores presented as current | Schema/collection-design phase | `Websites` collection config includes a capture-date field; UI renders the date next to scores |
| Screenshot capture legal/rate-limit risk | Content population phase | No automated/recurring screenshot job exists in code; screenshots are static Media/Cloudinary uploads with a documented one-time manual capture step |
| `Websites`/`CaseStudies` content duplication or missed cross-link | Schema-design phase (field) + content-population phase (verification per site) | For each of the 6 sites, confirm whether a matching `CaseStudies` doc exists; if yes, cross-link populated and shared facts reconciled |
| Wrong relationship cardinality (`client`, `caseStudy`) | Schema/collection-design phase | `client` and `caseStudy` fields are `hasMany: false` and `required: false`; at least one seeded doc has no client to prove optionality works end-to-end |
| Missing/incorrect JSON-LD for new content type | Frontend pages phase (listing + detail templates) | `CreativeWork` JSON-LD validated via Rich Results Test / Schema Markup Validator on the live detail page; `ItemList` present on listing page |

## Sources

- `.planning/PROJECT.md` (this project) — schema decisions already made for `CaseStudies`/`Clientes`/`Works` deprecation, the v1.9 milestone scope description, the recurring non-localized-field bug pattern from v1.5 — HIGH (primary source, direct project history)
- [Is it legal to screenshot websites? — ScreenshotOne](https://screenshotone.com/blog/screenshots-and-law/) — MEDIUM (industry blog from a screenshot-API vendor, consistent with general ToS/copyright consensus, not a legal authority)
- [Is it Legal to take the Screenshot of a Website? — CaptureKit](https://www.capturekit.dev/blog/legal-take-screenshot-website) — MEDIUM (same caveat as above)
- [schema.org/CreativeWork](https://schema.org/CreativeWork), [schema.org/SoftwareApplication](https://schema.org/SoftwareApplication), [schema.org/Project](https://schema.org/Project) — HIGH (authoritative schema.org type definitions)
- General knowledge of Lighthouse/PSI run-to-run variance and Payload relationship/join field patterns — MEDIUM (training data, not independently re-verified against Payload 3.85 docs in this session; recommend confirming `join` field availability against Context7/official Payload docs during the schema-design phase itself)

---
*Pitfalls research for: Websites Portfolio Section (v1.9 milestone) — Payload/Next.js portfolio rebuild*
*Researched: 2026-07-14*
