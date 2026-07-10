# Phase 4: Migración Mongo → Postgres - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning
**Mode:** Infrastructure phase (smart discuss skipped — pure ETL/migration, all success criteria technical)

<domain>
## Phase Boundary

Todo el contenido real del sitio actual (posts, case studies, authors, testimonials, works/clientes, medios) existe en el nuevo backend Postgres con URLs idénticas a las actuales y relaciones preservadas, listo para renderizarse en las páginas públicas.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — this is a pure infrastructure/ETL phase. Follow ROADMAP success criteria exactly:

- Freeze a live-URL inventory (crawled from sitemap/GSC) before migrating, as the verification contract.
- Standalone ETL script (not raw SQL) using Payload's Local API against both the old Mongo config and the new Postgres config, in strict order: Media → Authors/Categories → Posts/CaseStudies/Testimonials/Clientes.
- The old site's Works collection is retired — audit its content manually and fold into case studies where it fits; do not migrate Works as a 1:1 collection.
- Every migrated document must keep its exact original slug/URL (never regenerate from title).
- Maintain an ObjectId → Postgres-ID remap table so relations (post→author, post→category, etc.) resolve correctly.
- Media must be genuinely re-uploaded to Cloudinary via the Phase 3 adapter (not URL-copied), and rich text/block references updated to the new Cloudinary URLs.
- Any URL that intentionally changes during migration needs a corresponding 301 redirect entry.

</decisions>

<code_context>
## Existing Code Insights

Codebase context (dual-config ETL, old Mongo config location, Cloudinary adapter usage, existing `scripts/seed-phase2.ts` conventions) will be gathered during plan-phase research, per established pattern from prior phases.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond ROADMAP success criteria — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (smart discuss skipped as infrastructure-only).

</deferred>
