---
phase: 01-schema-foundation
plan: 02
subsystem: content-collections
tags: [payload, collections, users, media, categories, posts, auth, upload]
dependency-graph:
  requires: [01-01]
  provides: [users-collection, media-collection, categories-collection, posts-collection]
  affects: [payload.config.ts (Wave 4 import), Authors collection (01-03, relationship target)]
tech-stack:
  added: []
  patterns:
    - "Access control composed from shared src/access/{authenticated,authenticatedOrPublished}.ts utilities"
    - "slugField('title') from src/fields/slug.ts for auto-slug generation"
    - "versions.drafts with autosave + schedulePublish for editorial workflow"
key-files:
  created:
    - src/collections/Users/index.ts
    - src/collections/Media/index.ts
    - src/collections/Categories/index.ts
    - src/collections/Posts/index.ts
  modified:
    - .gitignore
decisions:
  - "Posts.author relates to 'authors' (public profile collection from 01-03), not 'users' (admin login) — matches CONTEXT.md separation of concerns"
  - "Media mimeTypes restricted to image/* only (no video), tighter than aprendoclub analog, per PATTERNS.md security note and threat T-01-04"
  - "No SEO meta fields hand-rolled on Posts — deferred to @payloadcms/plugin-seo tabbedUI in Wave 4"
metrics:
  duration: "~15 min"
  completed: 2026-07-09
---

# Phase 01 Plan 02: Users, Media, Categories, Posts Collections Summary

Four simple KEEP-list collections created — admin auth (Users), local-disk image uploads (Media), taxonomy (Categories), and the blog Posts collection relating to Authors/Categories/Media — all wired to the shared Wave 1 access-control and slug utilities, ready for import into `payload.config.ts` in Wave 4.

## What Was Built

- **`src/collections/Users/index.ts`** — `Users` collection, `auth: true`, admin-login only. Access gated by `authenticated` on all four operations. Single `name` field; no MCP-linked fields (`expertise`/`education`/`experience`/`credentials`/`liveUrl`/`primaryKeyword` intentionally excluded — public-facing profile lives in the `Authors` collection from 01-03).
- **`src/collections/Media/index.ts`** — `Media` upload collection, public `read: () => true` (images must render on the public site without auth), `mimeTypes: ['image/*']` only (no video — tighter than the aprendoclub analog), three image sizes (thumbnail/card/hero). Uses Payload's default local-disk upload handler; no Cloudinary wiring (Phase 3 scope).
- **`src/collections/Categories/index.ts`** — Taxonomy collection with `title`/`description` (both localized) + `slugField('title')`. Access: create/update/delete gated by `authenticated`, read via `authenticatedOrPublished`. Stripped of `liveUrl`/`primaryKeyword`/`indexingControl`/`indexStatus`/`faqs` per PATTERNS.md drop-list.
- **`src/collections/Posts/index.ts`** — Blog post collection: `title`/`excerpt`/`content` (Lexical richText, all localized), `heroImage` (upload → media), `author` (relationship → `authors`, required), `categories` (relationship → `categories`, hasMany), `publishedAt` (sidebar date), `slugField('title')`. `versions.drafts` with `autosave.interval: 100` and `schedulePublish: true`, `maxPerDoc: 50`. Zero GSC/keyword-metrics fields or hooks — those are Out of Scope per PROJECT.md.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] `.gitignore` `media/` pattern was shadowing `src/collections/Media/`**
- **Found during:** Task 1, staging `src/collections/Media/index.ts` for commit
- **Issue:** `.gitignore` had an unanchored `media/` entry intended for the root-level runtime upload directory. On the case-insensitive macOS filesystem this also matched `src/collections/Media/`, causing `git add` to refuse the new collection file.
- **Fix:** Anchored the pattern to the repo root: `media/` → `/media/`, with a comment clarifying intent.
- **Files modified:** `.gitignore`
- **Commit:** `f4cef7e`

### Concurrency Note (not a plan deviation, documented for traceability)

**Shared working tree race with sibling 01-03 executor:** This plan ran as a sequential executor on the same working tree as a concurrently-executing sibling agent (01-03: Authors/CaseStudies/Clientes/Testimonials), per the orchestrator's Wave 2 disjoint-files guarantee. Despite staging only `src/collections/Media/index.ts` and `.gitignore` explicitly via `git add`, commit `f4cef7e` unexpectedly also included `src/collections/CaseStudies/index.ts` — a file that existed on disk (written by the sibling agent) at the moment my `git add`/`git commit` ran, most likely due to a shared-index race (both agents writing to the same `.git/index` with no worktree isolation).

- **Content impact:** None — `CaseStudies/index.ts` content is unmodified, verbatim as authored by the 01-03 executor.
- **Attribution impact:** The file landed in the 01-02 commit rather than a 01-03 commit. No functional or file-content harm; purely a commit-boundary/attribution artifact.
- **Why not corrected:** By the time this was discovered, two further commits (`767092e`, `d414e11`) from the sibling agent had already been built on top of the tree state that includes `CaseStudies/index.ts`. Rewriting history at this point (rebase/reset) would risk corrupting the sibling agent's in-flight work, which is explicitly prohibited by the destructive-git-operations policy. Left as-is; flagged here for the orchestrator/verifier's awareness.
- **Action for orchestrator:** No action needed on file content. If commit-message accuracy matters for audit, note that `f4cef7e`'s diff includes one file (`CaseStudies/index.ts`) outside this plan's declared `files_modified` scope, added by a different (concurrent) agent's work-in-progress being present in the shared working tree at commit time.

## Verification

All four acceptance-criteria checks passed:
- `Users` exports `CollectionConfig` with `auth: true` ✓
- `Media` exports `CollectionConfig` with public `read: () => true` and `image/*` mimeTypes only ✓
- `Categories` exports `CollectionConfig` with `slugField` wired ✓
- `Posts` exports `CollectionConfig` relating to `authors` and `categories`, uses `slugField`, and contains zero references to dropped GSC/keyword fields ✓

## Self-Check: PASSED

- FOUND: src/collections/Users/index.ts
- FOUND: src/collections/Media/index.ts
- FOUND: src/collections/Categories/index.ts
- FOUND: src/collections/Posts/index.ts
- FOUND commit: f4cef7e (Users, Media, Categories)
- FOUND commit: 25a31dd (Posts)
