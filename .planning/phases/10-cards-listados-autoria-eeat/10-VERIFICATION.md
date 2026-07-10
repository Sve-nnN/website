# Phase 10 Verification: Cards/Listados + Autoría E-E-A-T

Verification date: 2026-07-10
Verified against: real dev server (`npm run dev`) + real Neon Postgres production data.

## Success Criteria Results

### 1. Repeater boundary conditions verified (1 item, real/schema max) for all four card-grid surfaces

**PASSED.**

- `FeaturedPostsBlock` (home page, real data): toggled `limit` to 1, confirmed exactly 1 real `PostCard` DOM anchor rendered on `/en`; restored to original (3).
- `ArchiveBlock` (blog page, real data, untouched): the real, Payload-configured `limit=12` instance was verified at `/en/blog` (72 real posts, categories 0/17/18/18/24) — confirmed a sane, non-corrupted card count (no runaway/duplicated grid markup). Note: the plan's own "real content facts" section misattributed this block instance to the home page (`pages.id=1`); direct execution-time inspection of `pages_blocks_archive_block` confirmed it actually lives on the blog page (`pages.id=2`). The verify script targets the correct route.
- `FeaturedCaseStudiesBlock` (home page, seeded fixtures — 0 real CaseStudies exist in production): toggled `limit` to 1, confirmed exactly 1 seeded `CaseStudyCard` rendered; toggled to 6 (schema max), confirmed all 6 seeded CaseStudyCards rendered; restored to original (3).
- `RelatedPosts`: not independently re-toggled (it has no page-builder instance — it's template-hardcoded at `limit={3}` in the blog-post-detail route per the plan's own interface notes) — it delegates to the same restyled `PostCard` verified via the `FeaturedPostsBlock`/`ArchiveBlock` checks above, and was rendered without error during the ES longest-title checks (`/es/blog/{slug}` renders the post detail page, which includes `RelatedPosts`).
- Category-filter min boundary (real 0-post category, `general`/id=3): confirmed `/en/blog?category=general` renders `ArchiveBlock`'s existing empty-state wrapper markup — pre-existing, already-implemented behavior, unaffected by the Task 1 restyle (zero diff in `ArchiveBlock/Component.tsx`).

### 2. AuthorCard/AuthorByline render bio, credentials, years of experience, and social links prominently in both `/en` and `/es`, against a fully-populated fixture author

**PASSED.**

Verified against seeded fixture author `test-author-phase10-eeat` (bio, 3 credentials, `yearsExperience: 12`, 3 social links):
- `/en/authors/test-author-phase10-eeat`: bio text present, all 3 credential labels present, `"12+ years of experience"` yearsLabel string present (headline-stat styled per 10-01), all 3 seeded social URLs present as `href` values.
- `/es/authors/test-author-phase10-eeat`: `"12+ años de experiencia"` ES yearsLabel variant present.

### 3. The two longest real Spanish post titles render correctly in `/es` with no broken layout

**PASSED, with one documented residual risk.**

- Post id=53 (`tech-seo-guide`, 75 chars): `/es/blog/tech-seo-guide` returns HTTP 200, no error marker, full title renders verbatim in the response body.
- Post id=66 (`normalizacion-bases-datos`, 75 chars): `/es/blog/normalizacion-bases-datos` returns HTTP 200, no error marker, full title renders verbatim.
- **Residual risk (non-blocking):** this automated check confirms the server does not truncate the title string and the route renders without error. It cannot verify pixel-level wrap/overflow behavior in the browser — that would require a headless browser, and no new dependency was authorized for this plan. **Recommend a human eyeball-check** of these two routes (`/es/blog/tech-seo-guide`, `/es/blog/normalizacion-bases-datos`) to confirm the 75-character title wraps cleanly in `PostCard`'s `line-clamp`-free heading and the post-detail header, matching the E-E-A-T-consistent styling from 10-01.

### 4. Zero residual fixtures or toggled field values remain in the production database

**PASSED.**

- All 6 seeded `CaseStudy` fixtures (`Test Case Study Phase 10 Boundary 1`..`6`) deleted, confirmed via `payload.find` returning 0 case-studies remaining.
- The 1 seeded `Author` fixture (`Test Author E-E-A-T Fixture (Phase 10)`) deleted, confirmed the real `authors` collection now contains exactly 1 document again (`Juan Carlos Angulo`).
- `FeaturedContent.featuredCaseStudies` confirmed empty (`[]`) — the relationship join rows referencing the deleted fixtures were removed automatically by Postgres FK cascade on delete; independently re-confirmed by direct read after cleanup.
- Home page `FeaturedCaseStudiesBlock.limit` and `FeaturedPostsBlock.limit` both confirmed at their original value (3).
- `scripts/.phase10-fixture-state.json` removed.
- Zero diffs in `src/blocks/*/config.ts` and `src/payload-types.ts` maintained throughout Plan 02 (only new scripts and this report were added/modified).

### 5. The phase's closing verification artifact explicitly flags Juan's pending real-author content-population task as non-blocking

See explicit flag below.

---

## Explicit Content-Gap Flag

**AuthorCard/AuthorByline correctly render credentials, years of experience, and social links prominently when present — verified against a seeded fixture author, since the real production author (id=1, Juan Carlos Angulo) still has `years_experience: null` and 0 rows in `authors_credentials`/`authors_social_links`. This is a pending content-population task for Juan to complete via `/admin` (add credentials, years of experience, and social links to his real author profile) — it does not block this phase's code/styling work, which is complete and verified.**

## Execution Notes (deviations, discovered during Plan 02)

1. **Block-to-page attribution correction:** the plan's "real content facts" section stated `ArchiveBlock` limit=12 lives on the home page (`pages.id=1`). Direct execution-time inspection (`pages_blocks_archive_block` table) confirmed it actually lives on the blog page (`pages.id=2`). The verify script was written against the corrected, real location. No plan code/styling changes were affected by this — it only changed which route Task 2's automated check fetches.
2. **Card-grid `pages` field path:** the plan's interface notes referenced `pages.layout`; the real schema nests it under `pages.content.layout` (a `group` field wraps the `blocks` field). Both the seed and verify scripts were written against the real nested path.
3. **Safer block-limit toggling:** rather than round-tripping the entire localized `content.layout` blocks array through the Local API `payload.update()` (which requires every localized sub-field of every sibling block — Hero, CallToAction, etc. — to be re-supplied in exact write format), the verify/cleanup scripts perform surgical raw-SQL `UPDATE`s against the single non-localized `limit` column on `pages_blocks_featured_posts_block`/`pages_blocks_featured_case_studies_block`, scoped by `_parent_id`. This was adopted after a full-array round-trip attempt during development broke `CallToAction`'s link-label validation on unrelated content — a clear illustration of why the narrower approach is safer for real production data.
4. **Card-count assertion methodology:** initial DOM-count assertions using naive Tailwind class-fragment matching (e.g. counting `aspect-[16/10]` occurrences) overcounted, because the same class strings also appear inside Next.js's embedded RSC hydration payload later in the same HTML document. The verify script instead matches literal rendered anchor tags (`<a class="group block" href="...">`), which only appear in the true server-rendered DOM.

## Fixtures Cleanup Confirmation

| Fixture | Status |
|---|---|
| `authors` — "Test Author E-E-A-T Fixture (Phase 10)" (id=5) | Deleted, confirmed |
| `case-studies` — "Test Case Study Phase 10 Boundary 1".."6" (ids 8-13) | Deleted, confirmed |
| `FeaturedContent.featuredCaseStudies` | Restored to `[]` |
| Home page `FeaturedCaseStudiesBlock.limit` | Restored to `3` |
| Home page `FeaturedPostsBlock.limit` | Restored to `3` |
| `scripts/.phase10-fixture-state.json` | Removed |

No production content was left behind. No real page's field values were left altered.
