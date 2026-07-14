# Phase 33: Local Landing Components - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the 2 new reusable components the .pen design file introduces — Hero variant `local-landing` and a new Payload block `LocalProofSection` — and register them in Payload + `RenderBlocks`. This phase ONLY builds and verifies the components against test content; it does NOT touch the real `/seo-tecnico-madrid` / `/seo-tecnico-lima` pages' Payload content (that is Phase 34, which depends on this phase existing first).

</domain>

<decisions>
### Design spec (locked, source: `designs/DESIGN-SYSTEM-PEN.md`)

- `Hero/Local Landing` variant: hero with city badge (map-pin icon + city name), decorative ring (ellipse, stroke only, no fill), inline stat with check-icon, CTA row. Reuses existing color/typography/spacing tokens only — zero new tokens added to `tailwind.config.ts`/`globals.css`.
- `Local Proof Section`: 3 numeric stats + testimonial card with name/local-business, editable from admin.
- Madrid page (future Phase 34 use): ring positioned right, opacity 0.25, single primary CTA.
- Lima page (future Phase 34 use): ring mirrored (`flipX`) positioned left, opacity 0.35, CTA row with primary + outline secondary button ("Ver casos en Lima").
- Each page brings its own city badge, inline stat, LocalProofSection numbers, and testimonial — this phase only needs the components to support all of that via Payload fields (ring side/opacity/flipX admin-configurable per variant instance, since Madrid and Lima need different values).

### Claude's Discretion

- Exact Tailwind utility classes, icon sizes, ring SVG dimensions/viewBox — matched to existing codebase visual conventions (ResultsSection's KPI-metric-dominance pattern, ServicesShowcase's icon+card pattern), no new design decisions needed.
- `ringOpacity` modeled as a Payload `number` field (min 0/max 1, step 0.05) rather than a preset `select` — simpler admin UX, same result.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/blocks/Hero/config.ts` — `variant` select field pattern, `linkGroup()` for CTAs, `breadcrumbs`' `admin.condition` pattern reused verbatim for the 5 new local-landing-only fields.
- `src/blocks/Hero/Component.tsx` — `variantStyles` record pattern extended with a `local-landing` entry; existing generic `links` CTA-row rendering (flex-wrap row) reused as-is, no duplication needed.
- `src/blocks/ResultsSection/{config,Component}.tsx` — closest existing analog for `LocalProofSection`'s stats array shape (value+label, localized).
- `src/blocks/TestimonialSection/{config,Component}.tsx` — closest existing analog for the testimonial sub-shape, extended with an `authorBusiness` field for the local-business requirement.
- `lucide-react` (already a dependency) — `MapPin`/`CheckCircle2` icons, same import convention as `ServicesShowcase`/`AboutSection`.
- `src/blocks/blockRegistry.tsx` + `src/collections/Pages/index.ts` — single registration points for the new block (both additive edits, following the Phase 24/25 ServicesShowcase/ServiceScopeCard precedent).

### Established Patterns
- Additive Payload schema change → `payload migrate:create` → read generated SQL → `payload migrate` (no destructive statements in the UP path) → per project CLAUDE.md database-safety rules.
- Guarded seed/cleanup script pair for throwaway test content (exact-slug-match delete guard), same shape as `scripts/cleanup-phase10-eeat-fixtures.ts`.

</code_context>

<specifics>
## Specific Ideas

- `Hero.variant` gains `local-landing` as a 5th option alongside `home`/`listing`/`post-header`/`case-study-header`.
- New conditional fields on Hero (all gated on `variant === 'local-landing'` via `admin.condition`, same pattern as `breadcrumbs`): `cityName` (localized text), `inlineStat` (localized text), `ringSide` (select left/right, default right), `ringOpacity` (number 0–1, default 0.25), `ringFlipX` (checkbox, default false).
- New block `LocalProofSection`: `stats` array (exactly 3 rows, value+label localized text) + `testimonial` group (quote textarea localized, authorName text, authorBusiness localized text).
- Functional verification done via a throwaway Payload page (`phase33-local-landing-test`, id 13) + a throwaway Next.js route, hit with curl against a real `next dev` server — confirmed both Hero local-landing configurations (ring-right/no-flip and ring-left/flipX) and the LocalProofSection block render correct DOM (city badges, ellipse SVGs with correct opacity/transform, CTA hrefs, stats, testimonial), zero server errors. Test page and test route deleted immediately after.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Applying these components to the real Madrid/Lima pages is explicitly Phase 34's job, not this phase's.

</deferred>
