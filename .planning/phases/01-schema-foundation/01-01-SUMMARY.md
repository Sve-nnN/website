---
phase: 01-schema-foundation
plan: 01
subsystem: project-scaffold
tags: [payload, nextjs, typescript, scaffolding, access-control]
dependency-graph:
  requires: []
  provides: [package.json, tsconfig.json, next.config.mjs, .env.example, authenticated, authenticatedOrPublished, slugField, deepMerge]
  affects: [all-future-collection-files, payload.config.ts]
tech-stack:
  added: [payload@3.85.2, "@payloadcms/next@3.85.2", "@payloadcms/db-postgres@3.85.2", "@payloadcms/richtext-lexical@3.85.2", "@payloadcms/plugin-seo@3.85.2", "@payloadcms/plugin-redirects@3.85.2", "@payloadcms/email-resend@3.85.2", next@15.4.11, react@19.2.7, react-dom@19.2.7, sharp@0.35.3, "graphql@^16.8.1"]
  patterns: ["shared access-control utilities (authenticated/authenticatedOrPublished)", "slugField() factory with deepMerge-based overrides", "src/ layout with @/* and @payload-config path aliases"]
key-files:
  created:
    - package.json
    - tsconfig.json
    - next.config.mjs
    - .env.example
    - src/access/authenticated.ts
    - src/access/authenticatedOrPublished.ts
    - src/fields/slug.ts
    - src/utilities/deepMerge.ts
  modified: []
decisions:
  - "Pinned next to 15.4.11 instead of the researched 15.5.20 — @payloadcms/next@3.85.2's actual peerDependencies exclude the entire 15.5.x line"
  - "authenticated.ts typed with AccessArgs<any> (not AccessArgs<User>) since payload-types.ts does not exist until Wave 4 — TODO comment left in place"
  - "Left pre-existing .gitignore untouched — the plan's suggested additions (.planning/, .claude/, CLAUDE.md, .gsd/, get-shit-done/) would have ignored paths already tracked in git history, breaking this project's own commit workflow"
metrics:
  duration_minutes: 12
  completed: 2026-07-09
---

# Phase 1 Plan 1: Project Scaffold + Shared Utilities Summary

Scaffolded the greenfield `juan-payload` Node/TypeScript project (package.json pinned to Payload 3.85.2 stack, tsconfig with `@/*`/`@payload-config` aliases, standalone `next.config.mjs`, `.env.example`) and ported the four shared utility modules (`authenticated`, `authenticatedOrPublished`, `slugField`, `deepMerge`) that every collection in later waves will import.

## What Was Built

**Task 1 — Project scaffold:**
- `package.json`: `payload@3.85.2` + lockstep `@payloadcms/*` packages, `graphql@^16.8.1` explicitly pinned (avoids the 17.x `latest` trap), build/dev scripts matching the researched migration-then-build pipeline (`payload migrate && payload generate:importmap && payload generate:types && next build`).
- `tsconfig.json`: `@/*` → `./src/*`, `@payload-config` → `./src/payload.config.ts`, strict mode, bundler module resolution.
- `next.config.mjs`: `output: 'standalone'`, empty `remotePatterns` (Phase 1 uses local-disk media only; Cloudinary arrives Phase 3).
- `.env.example`: placeholder `DATABASE_URI` (with Neon unpooled-connection-string warning comment), `PAYLOAD_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — no real secrets.
- Ran `npm install` successfully — 395 packages, `graphql` resolved to `16.14.2` (6 references, all deduped to the 16.x line), `package-lock.json` committed.

**Task 2 — Shared utilities:**
- `src/access/authenticated.ts` — access-control predicate, returns `Boolean(user)`.
- `src/access/authenticatedOrPublished.ts` — access-control predicate, allows authenticated users full access, public users only `_status: published` docs.
- `src/fields/slug.ts` — `slugField()` factory producing a sidebar-positioned, auto-slugifying text field via `beforeValidate` hook.
- `src/utilities/deepMerge.ts` — recursive object merge helper, zero dependencies, used by `slugField()` to apply caller overrides.

All four files ported verbatim from `JuanPortfolio` per the plan's `<interfaces>` block, with one intentional typing adjustment (see Deviations).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `next@15.5.20` is not installable against `payload@3.85.2`**
- **Found during:** Task 1, `npm install`
- **Issue:** The plan and its RESEARCH.md pinned `next@15.5.20`. `npm install` failed with `ERESOLVE`: `@payloadcms/next@3.85.2`'s actual `peerDependencies.next` is `>=15.2.9 <15.3.0 || >=15.3.9 <15.4.0 || >=15.4.11 <15.5.0 || >=16.2.6 <17.0.0` — the entire 15.5.x line is excluded from the range (jumps straight from `<15.5.0` to `>=16.2.6`). Confirmed live via `npm view @payloadcms/next@3.85.2 peerDependencies`.
- **Fix:** Changed `next` to `15.4.11` (highest version satisfying `>=15.4.11 <15.5.0`), preserving the architectural intent of "stay on Next 15, don't jump to 16 yet."
- **Files modified:** `package.json`
- **Commit:** `2624506`

**2. [Rule 3 - Blocking] Host disk space exhaustion during `npm install`**
- **Found during:** Task 1, `npm install`
- **Issue:** First `npm install` attempt failed with `ENOSPC` (data volume had only ~1.6GB free before cache issues, causing a corrupted `_cacache` tarball on the next retry).
- **Fix:** Ran `npm cache clean --force` to free ~780MB, freeing enough space (8.4GB) for install to complete on the third attempt.
- **Files modified:** none (host-level operation only)
- **Commit:** n/a (no file changes)

**3. [Rule 3 - Blocking] Plan's suggested `.gitignore` additions would break the project's own commit workflow**
- **Found during:** Task 1, `.gitignore` review
- **Issue:** The plan's action text suggested extending `.gitignore` with `.planning/`, `.claude/`, `CLAUDE.md`, `.gsd/`, `get-shit-done/`. Verified via `git ls-files` that all of these paths (24 files under `.planning/`, plus `CLAUDE.md`) are already tracked in this repo's git history (5 prior commits: research/pattern-map/plan docs). Adding them to `.gitignore` now would not untrack existing files, but would block `git add` on *new* files under those paths (e.g. this very `01-01-SUMMARY.md`, `STATE.md` updates) without `-f`, silently breaking the executor's required final-commit step.
- **Fix:** Left `.gitignore` unchanged from its pre-existing state. Verified all Task 1 acceptance criteria still pass against the unmodified file (env exclusion intact, `!.env.example` negation intact, `src/migrations` and `payload-types.ts` correctly absent).
- **Files modified:** none
- **Commit:** n/a (no change made)

None of these deviations affected any acceptance criterion — all Task 1 and Task 2 acceptance checks pass as specified in the plan.

## Verification

- `node -e "console.log(require('./package.json').dependencies.payload)"` → `3.85.2` ✓
- `node -e "console.log(require('./package.json').dependencies.graphql)"` → `^16.8.1` ✓
- `npm ls graphql` → 6 references, all `graphql@16.14.2` (deduped), zero 17.x ✓
- `test -f package-lock.json` ✓
- `grep -c '"@payload-config"' tsconfig.json` → 1 ✓
- `grep -c "output: 'standalone'" next.config.mjs` → 1 ✓
- `.gitignore`: `^\.env$` present, `^!\.env\.example$` present, `src/migrations` absent, `payload-types.ts` absent ✓
- `grep -c "export const authenticated"` / `authenticatedOrPublished` / `slugField` / `deepMerge` → all 1 ✓
- `grep -c "from '../utilities/deepMerge'" src/fields/slug.ts` → 1 ✓
- `npx tsc --noEmit src/utilities/deepMerge.ts src/fields/slug.ts ...` → exit 0 ✓
- `npx tsc --noEmit -p tsconfig.json` (full project, extra check beyond plan spec) → exit 0, no errors ✓
- `git status --short .env` → empty (real `.env` not tracked) ✓

## Known Stubs

None. This plan is pure scaffolding with no UI/data-rendering surface — nothing to stub.

## Threat Flags

None. No new network endpoints, auth paths, or trust-boundary-crossing surface introduced beyond what the plan's own `<threat_model>` already covers (`.env` exclusion, first-party package installs).

## Self-Check: PASSED

All created files verified present on disk via `find`/`test -f`. All commit hashes verified present in `git log`.
