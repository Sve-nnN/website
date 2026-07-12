# Phase 20: SEO Local Geo-pages - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning
**Mode:** Auto-generated (non-interactive autonomous run — no human available to answer discuss questions; decisions below made by Claude, grounded in the real codebase, `scripts/seed-author-eeat.ts` (Juan's real bio facts), and `research/keyword-research/KEYWORD-RESEARCH.md`)

<domain>
## Phase Boundary

Two new landing pages: "SEO técnico en Lima" and "SEO técnico en Madrid/España", each with genuinely different content grounded in real facts — not a templated page with the city name find-replaced (a pattern Juan explicitly rejected, per ROADMAP.md line 15: "solo Lima + Madrid como geo-pages, sin expandir a más ciudades"). Out of scope: any other city, a general "local SEO" service page (that's Phase 19's territory if it existed — it doesn't, local SEO was explicitly judged low-priority in `research/SEO-COMPETITIVE-AUDIT-v1.4.md` §"Relevante para Juan" since his ICP is global/complex-stack clients, not local SMBs — these 2 pages exist for SEO positioning value, not to pivot Juan into local-business SEO).

</domain>

<decisions>
## Implementation Decisions

### Data model & routing
- **D-01:** Reuse the `Pages` collection (same as Phase 19 — no new collection). 2 new docs: slugs `seo-tecnico-lima` and `seo-tecnico-madrid` (kebab-case, descriptive, bilingual-content-holding single doc per Payload's non-localized-slug convention, same as every other page).
- **D-02:** Fixed-slug static routes (NOT a `[slug]` dynamic route like Phase 19's services — only 2 known pages, no need for a slug registry/allowlist layer). Route segment convention: since these are inherently location-specific SEO landing pages (not marketing categories like "services"), and the ROADMAP/REQUIREMENTS text names them by their Spanish title ("SEO técnico en Lima" / "SEO técnico en Madrid"), use ONE shared URL path per page across both locales — `/seo-tecnico-lima` and `/seo-tecnico-madrid` — rather than Phase 19's dual-segment pattern. Rationale: these pages are inherently about a Spanish-speaking-market keyword ("SEO técnico en Lima/Madrid" is itself the target search term in Spanish — see D-03), so translating the URL segment into English would work against the SEO intent these pages exist for. The EN locale version of these pages (content translated, per site-wide bilingual parity requirement) still lives at the same slug prefixed with `/en/`, matching every other single-segment route already in this codebase (`/contact`, `/privacy`, etc.) — this is the established project convention Phase 19 deviated from only because SEO-SVC-01 explicitly demanded 2 different segment spellings; no such requirement exists here.
- **D-03:** Per ROADMAP goal + REQUIREMENTS.md SEO-LOCAL-01/02, both pages target Spanish-language local-intent search terms as their primary SEO purpose ("seo técnico Lima", "seo técnico Madrid") — the ES locale is the primary version of these 2 pages; EN locale exists for site-wide bilingual parity (CLAUDE.md constraint) but is not the primary SEO target for these specific 2 pages.

### Content differentiation (the actual phase risk — SEO-LOCAL-01/02, success criterion #3)
- **D-04 (Lima):** Grounded in Juan's REAL physical base and local community involvement, per `scripts/seed-author-eeat.ts` (already-seeded, real data): studied at Universidad Peruana de Ciencias Aplicadas (UPC), co-taught a real 4-hour "SEO + IA" workshop in Lima with Arianna Lupi/DinoRANM/Lm Marketing (18 real attendees, LinkedIn post exists as a citable source), physically based in Lima. This page's differentiated content angle: real local presence + real local community credibility (workshop, university), addressing a Lima/Peru-based business owner who wants someone who understands the local context AND has global-caliber technical chops (not a generalist local agency).
- **D-05 (Madrid):** Juan is NOT physically based in Madrid — the page must NOT fabricate a false local presence (that would be worse than the templated-page anti-pattern Juan rejected: it would be dishonest). Instead, ground this page in what IS real and differentiated: `research/keyword-research/KEYWORD-RESEARCH.md` confirms Spain is genuinely the primary commercial market for Juan's Spanish-language SEO terms (real DataForSEO/DinoRank volume+CPC data cited in that doc, e.g. "seo técnico" 260 vol/mes €3.22 CPC — Spain-weighted search data). This page's differentiated content angle: remote-first technical SEO specialist who deeply understands the Spanish market (language register, SERP competitors, GDPR/EU context) and serves Spanish businesses without the overhead of a local agency — explicitly framed as "trabajo remoto con clientes en España" (honest), not "tengo oficina en Madrid" (false). This is a genuinely different argument from Lima's "estoy físicamente aquí" angle — satisfies success criterion #3 (verifiably distinct content, not just city name swapped).
- **D-06:** Both pages must independently satisfy success criterion #3 ("cada una tiene al menos una sección/argumento que no aparece en la otra") — Lima's local-community/physical-presence section has no Madrid equivalent; Madrid's remote-specialist/Spain-market-data section has no Lima equivalent. Shared structural skeleton (H1→context→qué incluye→cómo trabajo→FAQ→CTA, same pattern as Phase 19, per site-wide consistency) is fine and expected — content within each section must differ substantively, not just the city name.

### SEO/metadata (success criterion #4)
- **D-07:** Both pages already get plugin-seo's meta tab for free — `pages` collection is already in `seoPlugin`'s `collections` array since Phase 1 (confirmed: `src/payload.config.ts` line ~91 already includes `'pages'`). No new plugin wiring needed (unlike Phase 18's Authors gap). Each page's `generateMetadata` follows the exact same `doc.meta?.title ?? doc.title` / `doc.meta?.description ?? ''` pattern already established (contact/privacy/case-studies precedent).
- **D-08:** H1 comes from the Hero block (same one-H1-per-page discipline established in Phase 18/19 — Hero block's own `<h1>` from `title`, no manual `<h1>` in the route file).

### Claude's Discretion
- Exact route-file structure (static-slug pattern like `/contact`/`/privacy`, no lib helper needed given only 2 fixed slugs — simpler than Phase 19's dynamic `[slug]` + registry).
- Exact FAQ questions and full copy body for both pages, grounded in D-04/D-05's differentiation angles.
- Whether to add these 2 pages to `sitemap-data.ts`'s special-casing (Claude's discretion: since D-02 uses the SAME url segment for both locales — no dual-segment complexity like Phase 19 — the existing generic `pages` branch in `sitemap-data.ts` already produces the CORRECT URL for these 2 docs with zero code change needed; verify this at execution time rather than assuming a fix is required).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 20: SEO Local Geo-pages" — goal, success criteria, requirements (SEO-LOCAL-01, SEO-LOCAL-02)
- `.planning/REQUIREMENTS.md` §"SEO-LOCAL" — full requirement text

### Real facts to ground content in (do not invent)
- `scripts/seed-author-eeat.ts` lines ~14, ~73-90, ~179-207 — Juan's real UPC education, real Lima workshop (with Arianna Lupi/DinoRANK/Lm Marketing, 18 attendees, LinkedIn source link)
- `research/keyword-research/KEYWORD-RESEARCH.md` — real ES-market search volume/CPC data supporting the Madrid page's "Spain is the real commercial market" angle
- `research/SEO-COMPETITIVE-AUDIT-v1.4.md` §"SEO Local" section — confirms local SEO is NOT Juan's ICP pivot, these pages exist for positioning value only

### Project-wide constraints
- root `CLAUDE.md` — bilingual EN/ES parity requirement, `push:false` migration discipline
- root `CLAUDE.md` §"Database Safety" (new, added during Phase 19) — any `payload migrate` or DB-writing script requires explicit human approval before running; if this phase needs a schema migration, generate it, present the full SQL (up+down) to the human, and wait for explicit approval before applying

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(frontend)/[locale]/privacy/page.tsx` — exact static-single-slug route pattern to mirror (simpler than Phase 19's dynamic-slug pattern, no lib helper needed for just 2 fixed slugs)
- `src/blocks/Hero/`, `Content/`, `FAQ/`, `CallToAction/` — same blocks Phase 19 used, all already localized correctly as of Phase 19's fix (`CallToAction.richText` now has `localized: true`)
- `scripts/seed-phase19-service-pages.ts` — canonical pattern for the seed script's Lexical-block-assembly + idempotent upsert-by-slug + id-reuse-across-locales discipline; this phase's seed script should follow the exact same shape (simpler since only 2 docs, no dynamic-slug allowlist needed)

### Established Patterns (from Phase 18/19, already proven)
- One real `<h1>` per page via Hero block, never a manual `<h1>` in the route file
- `generateMetadata` reads `doc.meta?.title ?? doc.title` / `doc.meta?.description ?? ''`
- Sub-array/block id-reuse discipline across locale writes (STATE.md documented bug pattern)
- **CRITICAL, learned the hard way in Phase 19:** before touching ANY existing block's field-level `localized` setting, check `src/payload-types.ts`/`payload.config.ts` first — do NOT assume `CallToAction.richText` (or any other reused block field) needs a new migration; Phase 19 ALREADY fixed `CallToAction.richText` to `localized: true` with a proper backfilled migration. This phase should need ZERO new schema migrations (Hero/Content/FAQ/CallToAction are all already correctly localized) — if a plan for this phase proposes a migration, that is a signal something is being done differently than Phase 19's now-correct blocks, and should be double-checked before proceeding.

### Integration Points
- New route files: `src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx`, `src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx` (D-02 — single segment, no `[slug]` dynamic route, no lib registry needed for just 2 fixed slugs)
- `scripts/seed-phase20-geo-pages.ts` (new) — creates the 2 `Pages` docs, reusing Phase 19's block-assembly + id-reuse helper pattern

</code_context>

<specifics>
## Specific Ideas

- Lima page: lean into Juan's real physical presence + the real DinoRANK/Arianna Lupi workshop + UPC education as trust signals no generic "local SEO agency" template page would have.
- Madrid page: lean into "trabajo remoto, especialista, no agencia local genérica" — explicitly honest about not having a Madrid office, framed as an advantage (senior technical specialist vs. local agency overhead) rather than hidden.
- Both pages avoid the local-SEO-for-SMBs framing (dentists/restaurants) that `research/SEO-COMPETITIVE-AUDIT-v1.4.md` explicitly flagged as NOT Juan's ICP — these are technical SEO / dev-adjacent positioning pages for the same complex-stack client profile as the rest of the site, just geo-targeted.

</specifics>

<deferred>
## Deferred Ideas

None — Phase 21 (Home linking) and any additional cities are explicitly out of scope per ROADMAP.md ("solo Lima + Madrid, sin expandir a más ciudades").

### Reviewed Todos (not folded)
None found matching this phase.

</deferred>

---

*Phase: 20-SEO Local Geo-pages*
*Context gathered: 2026-07-12*
