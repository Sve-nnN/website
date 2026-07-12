# Phase 21: Home Optimization & Service Linking - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning
**Mode:** Auto-generated (non-interactive autonomous run — decisions below made by Claude, grounded in the real existing Home/Header code and seed scripts)

<domain>
## Phase Boundary

Two changes to Home, no schema changes: (1) reinforce the "desarrollo real (Next.js/Payload/CMS headless) + SEO técnico" differentiator in the `aboutSection` block's copy, and (2) add at least one working link from Home toward the Phase 19 service pages. Depends on Phase 19 (now complete — `/services`/`/servicios` and the 4 individual pages exist and return 200 in both locales).

</domain>

<decisions>
## Implementation Decisions

### No schema changes (coordination note)
- **D-00:** The main/orchestrator session is concurrently installing `@payloadcms/plugin-mcp` in this same repo and may edit `payload.config.ts` and add a migration for an API-keys collection. This phase's scope (Home copy + nav link) requires ZERO changes to `payload.config.ts`, ZERO new collections, ZERO new fields — `AboutSection` already has `ctaText`/`ctaLink` (Phase 10.7) and `Header.navItems` already exists (Phase 5/10.6) with capacity for more items. This phase will not touch `payload.config.ts` at all, avoiding any collision with the concurrent MCP plugin work.

### Link placement (success criterion #2/#3)
- **D-01:** `Header.navItems[].link.url` is NOT a localized field (only `.link.label` is — confirmed in `src/fields/link.ts`). Every existing nav item (Blog, Case Studies, Authors, Contact) already shares one `url` string across both locale writes, with only the label translated. Following that exact existing convention, the new "Servicios"/"Services" nav item uses a single canonical URL — `/services` — for both locale writes (this is a real, working URL confirmed 200 in both `/services` and `/en/services` during Phase 19's live verification; picking `/servicios` instead would be equally valid since both resolve for both locales per Phase 19's D-02, `/services` is chosen only for consistency with the English-named nature of every other stored nav URL in this codebase, e.g. `/case-studies`, `/authors`).
- **D-02:** Add the link via `Header.navItems` (main nav), NOT by repurposing `AboutSection.ctaText`/`ctaLink` — the existing About CTA already points to `#contact` (a real, working, conversion-critical anchor to Home's `contactFormBlock`, added in Phase 13). Hijacking it to point to Services instead would remove a working conversion path for a phase whose goal is additive positioning, not a redesign. A nav item satisfies ROADMAP success criterion #2's "y/o en la navegación principal" clause directly.
- **D-03:** Follow the exact id-reuse discipline already proven in `scripts/seed-header-footer-content.ts` + `scripts/fix-header-navitems-es-labels.ts` (the STATE.md-documented Header nav-label bug and its fix) — fetch existing `navItems` per locale, preserve every existing item's `id`, append the new item without an `id` on the first locale write, refetch to capture its Payload-assigned `id`, then reuse that captured `id` on the second locale's write. Never write a fresh array without ids for items that already exist — that is the exact bug class already hit twice on this global (Phase 15, and originally).

### Copy reinforcement (success criterion #1)
- **D-04:** Update `aboutSection`'s `paragraphs[0].text` (the block's single description paragraph, both locales) to explicitly name Next.js/Payload/headless CMS development with SEO integrated into the code, contrasted implicitly against the generic "SEO + WordPress" pattern 3 of 4 audited competitors show (per `research/SEO-COMPETITIVE-AUDIT-v1.4.md` §2, already the exact language used on Phase 19's `fullstack-development` service page — this phase's Home copy should echo that established angle, not invent a new one).
- **D-05:** Update the `features[]` item currently titled "Arquitectura escalable"/"Scalable Architecture" (index 2 of 4) to explicitly mention Next.js and headless CMS in its description — the most natural fit among the 4 existing features for this reinforcement, avoiding a full rewrite of all 4 (SEO Técnico, Rendimiento web, Ingeniería de UX stay as-is, already on-topic and not competing for the same claim).
- **D-06:** Follow the exact in-place block-update pattern already proven in `scripts/seed-phase13-home-content.ts` (`findIndex((b) => b.blockType === 'aboutSection')`, edit in place, reuse `paragraphs[]`/`features[]` sub-array ids across the locale loop) — do not create a new block or touch any other block in Home's layout (Hero, FAQ, contactFormBlock, featuredPosts, etc. stay untouched).

### Claude's Discretion
- Exact reinforced copy wording for the paragraph and the one feature description (D-04/D-05), grounded in the audit's differentiator language and Phase 19's `fullstack-development` service page copy (already-approved language) rather than invented fresh.
- Whether to also add a services link from within the AboutSection paragraph text itself (plain text, no real link possible in a textarea field) — not applicable, textarea has no link markup, so this is N/A, not a real discretion point.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 21: Home Optimization & Service Linking" — goal, success criteria, requirements (SEO-HOME-01, SEO-HOME-02)
- `.planning/REQUIREMENTS.md` §"SEO-HOME" — full requirement text

### Real facts / precedent to reuse
- `scripts/seed-phase19-data/group-b.ts`'s `fullstackServiceCopy` — the already-approved "desarrollo real Next.js/Payload + SEO integrado" language to echo on Home, not reinvent
- `scripts/seed-phase13-home-content.ts` — exact in-place aboutSection block-edit pattern to mirror
- `scripts/seed-header-footer-content.ts` + `scripts/fix-header-navitems-es-labels.ts` — exact Header navItems id-reuse discipline to mirror
- `src/fields/link.ts` — confirms `url` is not localized, `label` is

### Project-wide constraints
- root `CLAUDE.md` §"Database Safety" — any DB-writing script requires explicit human approval (Juan, directly in-thread, not relayed) before running
- **Coordination note (this session):** main session is concurrently touching `payload.config.ts` for `@payloadcms/plugin-mcp` — this phase must not touch that file (confirmed unnecessary per D-00)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/blocks/AboutSection/config.ts` — already has `paragraphs[]`, `features[]` (exactly 4, min/max), `ctaText`/`ctaLink` — no new fields needed
- `src/globals/Header/index.ts` — `navItems` array already supports arbitrary additional items, no schema change needed
- `src/components/SiteHeader.tsx` — renders `header.navItems` directly via `CMSLink`, will pick up the new item automatically once seeded, no component change needed
- `scripts/seed-phase13-home-content.ts`, `scripts/seed-header-footer-content.ts`, `scripts/fix-header-navitems-es-labels.ts` — patterns to mirror exactly

### Integration Points
- `scripts/seed-phase21-home-optimization.ts` (new) — single script performing both the Header navItems addition and the aboutSection copy update, run against the real dev DB once (with explicit human approval per Database Safety rule)

</code_context>

<specifics>
## Specific Ideas

- Reinforced paragraph language should feel like a natural extension of the existing "Mi enfoque en Consultoría Técnica" copy, not a bolted-on sentence — integrate the Next.js/Payload/SEO-in-the-code angle into the flow of the existing description rather than appending a disconnected clause.

</specifics>

<deferred>
## Deferred Ideas

None — this is the last phase of the v1.4 milestone (18-21); lifecycle (audit/complete/cleanup) follows immediately after this phase closes.

### Reviewed Todos (not folded)
None found matching this phase.

</deferred>

---

*Phase: 21-Home Optimization & Service Linking*
*Context gathered: 2026-07-12*
