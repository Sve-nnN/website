---
phase: 01-schema-foundation
plan: 09
subsystem: app-router-scaffold
tags: [payload-admin, app-router, generated-artifacts, importmap, payload-types]
dependency-graph:
  requires: [01-08]
  provides: [payload-admin-route, frontend-placeholder-route, payload-types, importmap]
  affects: [src/app/(payload), src/app/(frontend), src/payload-types.ts]
tech-stack:
  added: []
  patterns:
    - "Official Payload 3 generated App Router templates ported verbatim (layout.tsx, admin [[...segments]] page/not-found, REST/GraphQL/playground route handlers)"
    - "payload generate:importmap / payload generate:types run as real CLI commands against the completed payload.config.ts, not hand-written"
key-files:
  created:
    - src/app/(payload)/layout.tsx
    - "src/app/(payload)/admin/[[...segments]]/page.tsx"
    - "src/app/(payload)/admin/[[...segments]]/not-found.tsx"
    - "src/app/(payload)/api/[...slug]/route.ts"
    - src/app/(payload)/api/graphql/route.ts
    - src/app/(payload)/api/graphql-playground/route.ts
    - src/app/(frontend)/layout.tsx
    - src/app/(frontend)/page.tsx
    - src/app/(payload)/admin/importMap.js
  modified:
    - src/payload-types.ts
decisions:
  - ".env already existed at repo root (provisioned with real Neon/Cloudinary/PAYLOAD_SECRET credentials) — left completely untouched per plan's revised conditional handling; proceeded straight to CLI generation commands"
metrics:
  duration: 6 min
  completed: 2026-07-09
---

# Phase 1 Plan 9: App Router Scaffold + Generated Admin Artifacts Summary

Scaffolded the `(payload)` and `(frontend)` App Router route groups using Payload's official generated templates, then ran the real `payload generate:importmap` and `payload generate:types` CLI commands against the completed `payload.config.ts` to produce a genuine `importMap.js` and a `payload-types.ts` reflecting all 9 real collections.

## What Was Built

- **`(payload)` route group** (Task 1): `layout.tsx`, `admin/[[...segments]]/page.tsx`, `admin/[[...segments]]/not-found.tsx`, `api/[...slug]/route.ts`, `api/graphql/route.ts`, `api/graphql-playground/route.ts` — all 6 files ported verbatim from the official Payload 3 generated template (source: `apturio/website`), including the "DO NOT MODIFY" header comment.
- **`(frontend)` placeholder route group** (Task 2): minimal `layout.tsx` (bare `<html><body>` shell) and `page.tsx` (heading "juan-payload — Phase 1 scaffold"). Real public pages arrive in Phase 5 per CONTEXT.md's phase boundary.
- **Generated artifacts** (Task 2, real CLI runs, not hand-written):
  - `npx payload generate:importmap` → `src/app/(payload)/admin/importMap.js` (satisfies the `./admin/importMap.js` / `../importMap.js` imports in the Task 1 files).
  - `npx payload generate:types` → `src/payload-types.ts`, confirmed to contain `CaseStudy` (6 occurrences) and `Clientes`/`Cliente` (6 occurrences), proving it reflects the real 9-collection schema from `payload.config.ts`.

## `.env` Handling

`.env` already existed at repo root, provisioned by the orchestrator with real Neon (unpooled), Cloudinary, and `PAYLOAD_SECRET` credentials. Per the plan's revised conditional instructions, verified with `test -f .env` first, then left it completely untouched (never read, printed, or logged) and proceeded directly to the CLI generation commands, which picked up `.env` automatically via dotenv. Confirmed post-execution via `git status --short .env` that it shows no diff (still gitignored, untouched).

## Verification

- `npx payload generate:importmap` completed without error.
- `npx payload generate:types` completed without error, writing to `src/payload-types.ts`.
- `grep -c "CaseStudy" src/payload-types.ts` = 6 (>= 1 required).
- `grep -c "Clientes\|Cliente" src/payload-types.ts` = 6 (>= 1 required).
- `npx tsc --noEmit -p tsconfig.json` produced zero output — full typecheck passes, including zero occurrences of `Cannot find module '@payload-config'`.
- All 6 `(payload)` files and both `(frontend)` files exist per acceptance criteria.

Note: the plan's acceptance criteria used `grep -c ... == 1` for `RootLayout`/`RootPage`/`REST_GET` presence checks, but the verbatim official template legitimately references each symbol on multiple lines (import + JSX usage, or import + each REST export) — actual counts were 3, 2, and 2 respectively. This is expected given the files are exact verbatim ports of the official template and is not a deviation requiring a fix.

## Deviations from Plan

None — plan executed exactly as written (per the revised, plan-checker-reviewed version with conditional `.env` handling).

## Known Stubs

- `src/app/(frontend)/page.tsx` is an intentional placeholder ("juan-payload — Phase 1 scaffold" heading) — real public pages are explicitly out of scope for Phase 1 and arrive in Phase 5 (frontend), per `01-CONTEXT.md` and `PROJECT.md`'s phase boundaries. Not a bug; documented by design in the plan's `<objective>`.

## Self-Check: PASSED

- `test -f "src/app/(payload)/layout.tsx"` → FOUND
- `test -f "src/app/(payload)/admin/[[...segments]]/page.tsx"` → FOUND
- `test -f "src/app/(payload)/admin/[[...segments]]/not-found.tsx"` → FOUND
- `test -f "src/app/(payload)/api/[...slug]/route.ts"` → FOUND
- `test -f "src/app/(payload)/api/graphql/route.ts"` → FOUND
- `test -f "src/app/(payload)/api/graphql-playground/route.ts"` → FOUND
- `test -f "src/app/(frontend)/layout.tsx"` → FOUND
- `test -f "src/app/(frontend)/page.tsx"` → FOUND
- `test -f "src/app/(payload)/admin/importMap.js"` → FOUND
- `test -f src/payload-types.ts` → FOUND
- Commit `f88a4a6` (Task 1) → FOUND in `git log`
- Commit `18b7107` (Task 2) → FOUND in `git log`
