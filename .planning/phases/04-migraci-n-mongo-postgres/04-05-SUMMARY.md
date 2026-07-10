---
phase: 04-migraci-n-mongo-postgres
plan: 05
subsystem: migration-posts
tags: [migration, posts, richtext, postgres]
dependency-graph:
  requires: [media-remap, authors-remap, categories-remap]
  provides: [posts-remap]
  affects: [scripts/migrate/steps/07-redirects-and-verify.ts]
tech-stack:
  added: []
  patterns: ["two-pass migration (create then resolve internal links)", "remap-table reconciliation by slug after an interrupted run"]
key-files:
  created:
    - scripts/migrate/steps/04-posts.ts
decisions:
  - "1 fully-empty orphan draft post (no title/slug/content) in the real source is skipped and logged, not migrated -- there is nothing to preserve"
  - "Real production richText has zero embedded media uploads and zero internal post-to-post links (only code-block/faq blocks) -- both remap passes run as designed but are no-ops against real content"
metrics:
  duration: "~35 min (including recovery from an interrupted first run)"
  completed: 2026-07-10
---

# Phase 4 Plan 05: Posts Migration Summary

Migrated 72 of 73 real posts (1 empty orphan draft skipped) to the new Postgres backend in two passes: create with author/categories/heroImage/media-in-richText resolved, then a second pass resolving post-to-post internal links now that every post has a real ID.

## What Was Built

- `scripts/migrate/steps/04-posts.ts` — `migratePostsPass1()` creates each post (slug verbatim, author resolved from `postAuthors[0]` with a documented fallback to the single migrated Author, categories remapped, richText media refs remapped per locale); `remapInternalLinksPass2()` re-walks each migrated post's richText resolving `link` nodes pointing at other posts.

## Real Execution Result

72/72 non-orphan posts migrated and verified (author, categories, slug all correct via direct Local API query). Real production richText contains **zero** `upload` nodes and **zero** post-to-post internal links (only `code-block` and `faq` blocks, both out of scope for remapping) — both passes ran end-to-end as designed but had nothing to actually rewrite in this dataset. `needsReview` has exactly one entry: the skipped orphan draft.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Old schema nests `heroImage`/`tldr`/`content` under a `content` tab-group**
- Already identified and documented during 04-01 (see that SUMMARY's "Notable Findings"); this plan's script was written from the start to read `doc.content.heroImage` / `doc.content.tldr` / `doc.content.content` rather than the plan's flat field_mapping wording.
- **Files modified:** `scripts/migrate/steps/04-posts.ts` (written correctly from the start, informed by 04-01)

**2. [Rule 3 - Blocking issue / operator-caused] First execution run killed mid-flight, causing one post's EN locale update to be lost**
- **Found during:** Task 1/2 real execution
- **Issue:** The first invocation of the script was running correctly but slowly (Postgres round-trip latency per post); I mistakenly judged it stuck after ~8 minutes of no new stdout and killed it with SIGKILL. This landed mid-request on one post (`algoritmos-ordenamiento`): its Spanish `create` had already committed, but the follow-up English `update` (title/excerpt/content) was aborted in-flight, leaving that one post with an ES-only title in a schema that otherwise expects both locales.
- **Fix:** (a) Wrote a one-off reconciliation pass that matched the 67 already-created Postgres rows back into the remap-table by slug (since the table hadn't been persisted before the kill), avoiding duplicate-slug creation on resume. (b) Wrote a one-off repair pass that compared every migrated post's stored EN title against its dump EN title and re-ran the EN `update` for the single post where they diverged. (c) Re-ran the full script to completion; pass 1 skipped all 72 already-mapped posts (idempotent), pass 2 completed cleanly for all of them.
- **Files modified:** none (recovery was via ad-hoc scratch scripts, deleted after use; the committed `04-posts.ts` itself required no changes)
- **Verified:** direct Local API query confirmed `algoritmos-ordenamiento` has both `es`/`en` titles after repair, and the full remap-table shows 72/72 (excluding the 1 legitimate orphan skip) after the final run.

### Notable Findings

- 10 of 73 real posts have no English title in the source at all (never translated on the old site) — these posts fall back to Payload's locale `fallback: true` for EN display (same behavior the old site relied on). Not a migration defect; documented here for Phase 5 awareness.

## Self-Check: PASSED

- FOUND: scripts/migrate/steps/04-posts.ts
- FOUND commit 92574e4
- Remap-table: posts 72/73 (1 legitimate orphan skip, documented)
- Verified via direct Local API query: sample post has real author (Juan Carlos Angulo), real category (CS Fundamentals), real bilingual title (after repair)
