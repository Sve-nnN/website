# Phase 10: Cards/Listados + Autoría E-E-A-T - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning
**Mode:** Refinement phase — visual direction locked, tokens/primitives available from Phases 7-8. This phase applies them to card-grid blocks and author credibility surfaces.

<domain>
## Phase Boundary

Todos los bloques de listado tipo card comparten un tratamiento visual consistente de elevación/spacing, y las credenciales de autoría (E-E-A-T) ya modeladas en Phase 5 se vuelven visualmente prominentes en byline/perfil.

</domain>

<decisions>
## Implementation Decisions

### Scope discipline (carried from milestone-level discuss)
- No new package dependencies, no motion/animation JS library, no dark-mode toggle.
- Zero diffs in any `src/blocks/*/config.ts` file or `payload-types.ts` — same hard constraint as Phases 8-9.
- Copy stays Payload-sourced — no hardcoded content.

### Known content gap — IMPORTANT
- Confirmed via direct Postgres query (2026-07-10, immediately before this phase's planning): the one real migrated author (Juan Carlos Angulo, id=1) has `years_experience: null` and zero rows in `authors_credentials`/`authors_social_links`. This is the exact follow-up flagged at Phase 5 closeout — Juan has not yet populated these fields via `/admin`.
- This phase's job is to make `AuthorByline`/`AuthorCard` render these fields PROMINENTLY *when present* — the component/styling work proceeds regardless of whether the fields are currently empty. Verification of success criterion #3 should confirm the visual treatment is correct by testing with seeded/representative sample data (not necessarily waiting on Juan to fill in his real profile first), and should explicitly note in its report that the real production author still needs this content populated by Juan before the E-E-A-T differentiator is visibly live to real site visitors — this is a content task for Juan, not a blocker for closing this phase's code/styling work.

### Card-grid consistency
- `ArchiveBlock`, `FeaturedPostsBlock`, `FeaturedCaseStudiesBlock`, and related-posts card lists must share the same elevation/spacing visual language — use Phase 7's shadow tokens and Phase 8's refined `card.tsx` primitive consistently across all four.
- Verify against repeater boundary conditions: 1 item and the real maximum count (72 posts exist for posts-based grids; check actual max for case studies/clients) — per PITFALLS.md's boundary-condition warning, do not validate only against "today's typical" content.

### Spanish-locale layout robustness
- Card titles and author names/bios must be verified in `/es` against the longest REAL migrated content (not lorem ipsum) — per PITFALLS.md's explicit warning that Spanish runs 15-25% longer than English and tighter editorial spacing is the most likely casualty. Pull actual longest ES post/case-study titles from the real Postgres data as the boundary-condition test set.

### Claude's Discretion
- Exact card elevation/spacing values — informed by Phase 7's shadow tokens and Phase 8's already-refined `card.tsx` primitive; this phase applies that primitive consistently rather than inventing new treatment.
- Exact AuthorCard/Byline layout for credentials/years/social-links fields — informed by `05-UI-SPEC.md`'s E-E-A-T section and research's author-credibility guidance.

</decisions>

<code_context>
## Existing Code Insights

- Card-grid blocks: `src/blocks/ArchiveBlock/Component.tsx`, `src/blocks/FeaturedPostsBlock/Component.tsx`, `src/blocks/FeaturedCaseStudiesBlock/Component.tsx`, and a related-posts component (likely within the blog post detail page or a shared component) — Phase 5 built these, Phase 8 already refined the underlying `card.tsx` shadcn primitive they should be consuming.
- Author surfaces: `AuthorByline`/`AuthorCard` components (Phase 5, likely under `src/components/` — locate exact path during planning) — the Authors collection schema already has `credentials[]`, `yearsExperience`, `socialLinks[]` fields (Phase 5), fully wired in rendering code per Phase 5's verification, just not populated with real data yet.
- Real content available for boundary testing: 72 real posts, 6 real clientes, 5 real categories in Postgres (per Phase 4 migration) — use actual longest titles/names from this data, not synthetic placeholders.

</code_context>

<specifics>
## Specific Ideas

None beyond the locked decisions above.

</specifics>

<deferred>
## Deferred Ideas

- Populating the real author's actual credentials/years/social links in `/admin` — this is Juan's content task, not part of this phase's code/styling scope. Flag as still-pending in this phase's closing report.

</deferred>
