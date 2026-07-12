# Phase 19: Service Pages - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning
**Mode:** Auto-generated (non-interactive autonomous run — no human available to answer discuss questions; decisions below made by Claude, grounded in the real codebase and `research/SEO-COMPETITIVE-AUDIT-v1.4.md`, documented for Juan's review)

<domain>
## Phase Boundary

Juan currently has zero service pages — his offering lives implicitly in Home's Hero/AboutSection copy. This phase adds an explicit, navigable service offering: one index page listing 4 service lines, and one landing page per service, following the structural pattern validated by the 4 audited competitors (H1 → problem/pain → what's included → how I work → FAQ → final CTA). No pricing published (matches 3 of 4 competitors; Juan's ICP is global/complex-stack clients, not price-shopping SMBs). "SEO para IA/GEO" gets named as its own service line, leaning on the already-existing `llms.txt`/`llms-full.txt` infrastructure as tangible proof, not just a name.

Out of scope: geo-pages (Phase 20), Home headline/linking changes (Phase 21 — Home cannot link services that don't exist yet, hence this phase runs first), pricing tables, a new pricing collection.

</domain>

<decisions>
## Implementation Decisions

### Data model (SEO-SVC-01/02/03)
- **D-01:** Reuse the existing `Pages` collection (block-based: Hero, Content, FAQ, CallToAction, ContactFormBlock already exist as registered blocks) instead of creating a new `Services` collection. Rationale: these are marketing landing pages with the exact same shape as every other `Pages` doc (H1/problem/includes/process/FAQ/CTA all map directly onto existing blocks — no new field types needed), and a new collection would mean a new migration + new admin UI + duplicated slug/meta/localization plumbing for zero functional gain. 5 new `Pages` docs: 1 index (`services`) + 4 individual services (`servicios-auditoria-tecnica`, `servicios-consultoria-seo`, `servicios-desarrollo-fullstack`, `servicios-seo-ia-geo` or equivalent slugs — exact slug strings are Claude's discretion, must be stable/kebab-case/URL-safe).
- **D-02:** URL segments per SEO-SVC-01's literal wording: ES = `/servicios` (index) + `/servicios/[slug]`, EN = `/services` (index) + `/services/[slug]`. The existing i18n routing (`src/i18n/routing.ts`) has no `pathnames` (translated-segment) config — every existing route (`/contact`, `/case-studies`, etc.) uses the same English segment name for both locales. Setting up next-intl `pathnames` for translated segments project-wide is out of scope for this phase (structural i18n-routing change, not a content phase). Pragmatic resolution: add two route folders under `[locale]/` — `services/` and `servicios/` — both implemented via one shared lib module (`src/lib/services-data.ts` or similar) so there's no logic duplication, just two thin route files per page type (index + `[slug]`). Both segments work under either locale value (i.e., visiting `/en/servicios` does not 404 — content is still driven by the `locale` route param, not the URL segment name). This satisfies the requirement's literal URL text without a project-wide i18n-routing migration.
- **D-03:** Individual service pages use `Pages` collection's existing block layout: `Hero` (service name as H1 + problem/pain framing in subtitle), `Content` (rich text — "qué incluye" + "cómo trabajo" sections), `FAQ` block (already exists, already proven in Phase 13's Home FAQ population), `CallToAction` (final CTA to `/contact`). No new block types needed. Reuse the exact same seeding-script pattern already established (Phase 13's `seed-phase13-*.ts`, Phase 14's target-keyword seed) — write a `scripts/seed-phase19-service-pages.ts` that creates/updates the 5 `Pages` docs via Payload Local API, both locales, following the id-reuse-across-locale-writes discipline documented in STATE.md (Phase 05-12/13-02 bug: arrays get full-replaced on update, sub-array ids must be reused across locale writes to avoid orphaning the other locale's data).
- **D-04:** The index page (`/servicios`, `/services`) lists all 4 services with name + 1-line description + link to the individual landing, plus a CTA to `/contact`. No pricing anywhere on any page. Implementation: either a `Content` block with structured copy, or (Claude's discretion) a small dedicated component if the 4-card grid needs more structure than a rich-text block can express cleanly — if a new component is added, it must follow the existing card visual pattern already established in Phase 10 (Card/CardContent primitive, elevation tokens from Phase 7/8), not invent a new visual language.

### SEO para IA/GEO (SEO-SVC-03)
- **D-05:** This service's page copy must explicitly reference `llms.txt` and `llms-full.txt` as concrete, already-live proof of the offering (e.g., "así es como estructuro el contenido para que los agentes de IA lo puedan citar — mirá `/llms.txt` en este mismo sitio"), not just use "GEO"/"SEO para IA" as a label. Link directly to `/llms.txt` and/or `/llms-full.txt` from this page's copy (real working links on the live site, per Phase 15's sitemap-linking precedent).

### Content authorship
- **D-06:** All service copy is new marketing content that must sound like Juan (technical, direct, no corporate fluff — matches existing Hero/AboutSection tone from Phase 9/13). Content authored directly by Claude during execution, grounded in: (a) the competitive audit's structural pattern (H1→pain→includes→process→FAQ→CTA), (b) Juan's real differentiator already identified in the audit — "desarrollo full-stack real (Next.js/Payload) con SEO integrado desde el código", not "SEO + WordPress genérico" — must be explicit in the "Desarrollo Full-Stack" service page, (c) existing bilingual tone/register already established across Home/case-studies copy (formal "usted"-free, direct "vos/tú"-neutral professional Spanish per project's neutral-Spanish convention, matching existing site copy register — check existing ES copy in Home/AboutSection for the exact register used and match it, not the CLAUDE.md user-facing "no voceo" instruction which governs Claude's chat responses to Juan, not site copy).
- **D-07:** FAQ content per service page: 3-5 real, non-generic questions per service (not filler) — grounded in what a genuine prospect evaluating that specific service would ask (e.g., for Auditoría: "¿cuánto dura una auditoría técnica?", for Desarrollo Full-Stack: "¿por qué Next.js/Payload en vez de WordPress?").

### Claude's Discretion
- Exact slug strings for each service page (D-01) — must be stable, kebab-case, descriptive.
- Whether the index page uses a rich-text `Content` block or a small new component for the 4-service grid (D-04) — prefer reusing `Content` block first; only add a new component if genuinely needed for structure.
- Exact FAQ questions and full copy body for all 5 pages (D-06/D-07) — grounded in the audit's findings and Juan's real differentiator, not invented generically.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 19: Service Pages" — phase goal, success criteria, requirements (SEO-SVC-01, SEO-SVC-02, SEO-SVC-03)
- `.planning/REQUIREMENTS.md` §"v1.4 Requirements" — full requirement text for SEO-SVC-01/02/03

### Audit source
- `research/SEO-COMPETITIVE-AUDIT-v1.4.md` §1.3 (structural pattern), §2 (competitor service naming/segmentation), §"Recomendaciones" items 2-3 — the findings that produced this phase

### Project-wide constraints
- root `CLAUDE.md` — `push:false` hard constraint, bilingual EN/ES content parity requirement
- `.planning/STATE.md` — documented bilingual array/sub-array id-reuse bug pattern (Phases 05-12, 05-13, 13-02, 15-02) — MUST be respected in the seed script to avoid orphaning locale data

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/collections/Pages/index.ts` — block-based collection, already has Hero/Content/FAQ/CallToAction/ContactFormBlock registered
- `src/blocks/FAQ/config.ts` + renderer — already proven in Phase 13 (Home FAQ population)
- `src/blocks/CallToAction/config.ts` — already has a shader variant (see recent quick-task commits `f76678f`/`7e4c521`) — reuse as-is, no new variant needed
- `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` — canonical pattern for a `[slug]`-based dynamic route querying a collection by slug field, with `generateMetadata` reading `doc.meta`
- `src/app/(frontend)/[locale]/contact/page.tsx` — canonical pattern for a single hardcoded-slug static page fetch (relevant for the index page if it ends up being one fixed `Pages` doc)
- `scripts/seed-phase13-*.ts`, `scripts/seed-author-eeat.ts` — canonical seed-script patterns (idempotent, Local API, both locales, sub-array id reuse)

### Established Patterns
- `generateMetadata` pattern: `title: meta?.title ?? doc.title`, `description: meta?.description ?? doc.heroSubtitle ?? ''` (case-studies) — Pages collection already has `meta` (via plugin-seo, `collections: ['pages', ...]` already includes `'pages'` since Phase 1) so this pattern applies directly, no new plugin wiring needed (unlike Phase 18's Authors gap).
- Card grid visual pattern: Phase 10's Card/CardContent primitive + elevation tokens (Phase 7/8) — reuse for the service index page's 4-card grid if a new component is needed.
- H1 discipline (Phase 18 fresh precedent): every page must have exactly one real `<h1>`, sourced from the Hero block's `title` field when a Hero block is present (Hero block renders its own real `<h1>` — confirmed in Phase 18's code review, `src/blocks/Hero/Component.tsx`). Since these new service pages will use a Hero block, this is satisfied for free — no manual `<h1>` needed like Phase 18's `/contact` special case (which had no Hero block).

### Integration Points
- New route files: `src/app/(frontend)/[locale]/services/page.tsx`, `src/app/(frontend)/[locale]/services/[slug]/page.tsx`, `src/app/(frontend)/[locale]/servicios/page.tsx`, `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx` (D-02) — thin wrappers around shared query/render logic.
- `scripts/seed-phase19-service-pages.ts` (new) — creates the 5 `Pages` docs.
- Sitemap (`src/lib/sitemap-data.ts`, Phase 15) — new `Pages` docs with `_status: published` should automatically appear in the sitemap query (it already queries all published Pages) — verify this at execution time, no code change expected, just confirmation.

</code_context>

<specifics>
## Specific Ideas

- 4 services per the audit: Auditoría SEO Técnica, Consultoría SEO, Desarrollo Full-Stack con SEO integrado, SEO para IA/GEO.
- No prices anywhere (Juan's decision, logged in ROADMAP.md line 15: "sin precios publicados en servicios").
- "Desarrollo Full-Stack" page must lean hard into the real differentiator: Next.js/Payload headless CMS development with SEO built into the code, not bolted on — audit confirms no competitor offers this at Juan's level.

</specifics>

<deferred>
## Deferred Ideas

None — geo-pages (Phase 20) and Home linking (Phase 21) are explicitly separate phases per ROADMAP.md dependency chain.

### Reviewed Todos (not folded)
None found matching this phase.

</deferred>

---

*Phase: 19-Service Pages*
*Context gathered: 2026-07-12*
