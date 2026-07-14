# Phase 34: Local Landing Application (Madrid/Lima) - Context

**Gathered:** 2026-07-14 (resumed same day as Phase 33)
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply the Phase 33 components (Hero `local-landing` variant + `LocalProofSection` block) for real to the two existing, live pages `seo-tecnico-madrid` and `seo-tecnico-lima` via the Payload Local API. This phase edits the existing `pages` docs' `layout` array — it does NOT create new pages, does NOT touch schema/migrations (Phase 33 already added the fields), and does NOT run the Phase 36 regression gate (spot-checked here, formally gated later).

</domain>

<decisions>
### Design spec (locked, source: `designs/DESIGN-SYSTEM-PEN.md` section 4, ROADMAP Phase 34 success criteria)

- Madrid: Hero `local-landing`, ring right, opacity 0.25, single primary CTA button.
- Lima: Hero `local-landing`, ring mirrored (`flipX`) left, opacity 0.35, CTA row with primary + outline ("Ver casos en Lima" / "See Lima case studies") button linking to `/case-studies`.
- Both existing hero blocks (index 0 of each page's layout) get converted in place (`variant: 'listing' -> 'local-landing'`), keeping their existing real `title`/`subtitle` untouched.
- Both pages get a new `LocalProofSection` block inserted right after the hero block, before the existing `content`/`faq`/`callToAction` blocks (all left untouched).
- Real CTA copy convention reused verbatim from `scripts/seed-phase20-data/copy.ts`: "Conversar sobre tu proyecto" / "Talk about your project", linking to `/contact`.

### Placeholder content (explicitly authorized by Juan — 2026-07-14, real GSC client data pending)

- Lima has one real, already-seeded fact usable as-is: the 2025 DinoRANK/Arianna Lupi "SEO + AI" workshop, 18 attendees (from `.planning/milestones/v1.4-phases/20-seo-local-geo-pages/` and already present in the Lima page's FAQ/content copy). Used as Lima's `inlineStat` and as 1 of 3 `LocalProofSection` stats — NOT a placeholder.
- Everything else (Madrid's inline stat, both cities' remaining 2 stats each, both cities' testimonial name/business/quote) has no real source yet — Juan is still connecting Google Search Console client data. Marked with a literal `[PLACEHOLDER]` prefix per the placeholder-marking convention (see 34-01-SUMMARY.md's placeholder table) so it's grep-able and unmistakable in the rendered HTML.
- No fabricated named local business or person — placeholders read as obviously fake (`[PLACEHOLDER] Nombre pendiente / Name pending`, `[PLACEHOLDER] Negocio pendiente`), never a plausible-sounding invented identity.

### Claude's Discretion

- Exact placeholder stat values (`0` + `[PLACEHOLDER]`-prefixed label, per Juan's own suggested pattern in the task brief) rather than inventing plausible-looking numbers.
- Insertion point for `LocalProofSection` (immediately after Hero) — not specified by ROADMAP, chosen to match typical landing-page proof-section placement (right after the fold).
- `LocalProofSection` id-reuse mechanics (generic recursive `applyIds()` helper) to keep both locales' array rows aligned without duplicating rows — implementation detail, no visible behavior change.

</decisions>

<code_context>
## Existing Code Insights

- `src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx` / `.../seo-tecnico-lima/page.tsx` — both 100% `RenderBlocks`-driven, no page-specific structure in code, confirmed by reading both files in full.
- Both pages' existing `hero` block (index 0) already had `variant: 'listing'`, `ringSide: 'right'`, `ringOpacity: 0.25`, `ringFlipX: false` sitting as inert defaults (fields existed since Phase 33's schema change but were unused pre-Phase-34) plus real, correct, per-locale `title`/`subtitle` text.
- `scripts/seed-phase20-geo-pages.ts` — closest existing analog for the id-reuse-across-locale-writes problem (`reapplyIds()`); Phase 34's `scripts/phase34-apply-local-landing.ts` generalizes that into a recursive `applyIds()` helper instead of hardcoding which array keys to walk.
- `src/fields/link.ts` — confirms `link.label` is `localized: true` but `link.type`/`url`/`appearance`/`newTab` are NOT localized (shared across locales) — informed writing identical shared values in both locale update calls.
- `src/blocks/LocalProofSection/config.ts` — confirms `stats[].value`/`stats[].label` and `testimonial.quote`/`testimonial.authorBusiness` are localized, but `testimonial.authorName` is NOT localized (single shared value across locales).

</code_context>

<specifics>
## Specific Ideas

- One-off script `scripts/phase34-apply-local-landing.ts` (kept in the repo per the existing `seed-phaseNN`/`phase33-test-page-*` convention) fetches both pages (both locales), converts hero block 0 in place, inserts `LocalProofSection`, writes 'es' first then re-fetches to discover Payload-assigned ids and reapplies them before writing 'en' (avoids duplicate array rows).
- `scripts/phase34-inspect-pages.ts` — read-only helper used before writing, to confirm both pages' actual pre-existing hero block shape (fields, real title/subtitle, empty `links`) before deciding what to preserve vs. overwrite. Left in the repo, harmless read-only script.
- Functional verification done via a real `next dev` server (port 3457, avoiding conflicts) + curl against all 4 live routes (`/seo-tecnico-madrid`, `/en/seo-tecnico-madrid`, `/seo-tecnico-lima`, `/en/seo-tecnico-lima`) — confirmed 200s, exactly 1 `<h1>` each (matches Phase 32 baseline), correct per-city ring opacity/transform, correct CTA copy/hrefs, `[PLACEHOLDER]` markers present and grep-able in rendered HTML.

</specifics>

<deferred>
## Deferred Ideas

- Real LocalProofSection stats/testimonial content for both cities — deferred until Juan supplies real Google Search Console client data (GSC mcp-hub auth currently broken server-side per STATE.md). Tracked via the placeholder table in 34-01-SUMMARY.md.
- Full production-build Lighthouse re-run against both landings — deferred to Phase 36 (formal regression gate); this phase only did a dev-server curl-based H1/200 spot-check.
</deferred>
