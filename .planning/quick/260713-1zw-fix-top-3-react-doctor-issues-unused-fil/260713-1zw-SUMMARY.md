---
quick_id: 260713-1zw
type: execute
status: partial (2 of 3 tasks executed, 1 skipped by explicit user decision)
one_liner: Deleted 2 genuinely-dead UI primitives and modernized 3 deep-clone call sites in the migration scripts to structuredClone; Next.js CVE bump explicitly deferred by Juan.
files_modified:
  - src/components/ui/select.tsx (deleted)
  - src/components/ui/skeleton.tsx (deleted)
  - scripts/migrate/export/dump-source.ts
  - scripts/migrate/lib/richtext-remap.ts
  - scripts/migrate/steps/04-posts.ts
commits:
  - 6972ae8
  - f8ea619
---

# Quick Task 260713-1zw: Fix Top 3 React Doctor Issues Summary

## What was done

### Task 1: Deleted 2 genuinely-dead UI files (executed)

Re-verified via grep that `src/components/ui/select.tsx` and `src/components/ui/skeleton.tsx` had zero references anywhere in `src/` before deleting — confirmed still true at execution time (matches planning's original finding). Both files deleted.

`ecosystem.config.cjs` and all 22 files under `src/migrations/` were left untouched, as documented false positives (loaded dynamically by PM2's CLI and Payload's migration runner respectively — invisible to deslop's static import graph).

`npx tsc --noEmit` passed clean after deletion, confirming nothing else in the codebase was actually importing either file.

Commit: `6972ae8`

### Task 2: Bump next off CVE-2026-23870 — SKIPPED (explicit user decision)

**Not executed.** Per Juan's explicit instruction on 2026-07-13, this task was deferred. The plan had identified that the only patched-and-peer-compatible fix is the `next@16.2.x` line (no `15.5.x` exists in `@payloadcms/next@3.85.2`'s peer range), which is a major-version bump. Juan chose to decide on this separately rather than execute it as part of this quick task. `package.json`, `package-lock.json`, and the installed `next` version were not touched in this run.

### Task 3: Replaced JSON.parse(JSON.stringify(x)) with structuredClone(x) (executed)

Re-confirmed via grep that the 3 target lines matched the plan's pre-verified findings exactly (same file, same line number, same code). All 3 are genuine full-object clones of plain-JSON-safe data (a Payload docs array, and two Lexical rich-text trees) with no functions/Date/Map/Set — safe to swap.

Edits:
- `scripts/migrate/export/dump-source.ts:93` — `structuredClone(result.docs)`
- `scripts/migrate/lib/richtext-remap.ts:54` — `structuredClone(richText)`
- `scripts/migrate/steps/04-posts.ts:185` — `structuredClone(original)`

No other logic in these 3 files was touched. `npx tsc --noEmit` passed clean.

Commit: `f8ea619`

## Deviations from Plan

None. Both executed tasks followed the plan exactly. Task 2 was skipped per explicit, documented user instruction (not a deviation — a scope reduction the plan itself anticipated as a possible outcome).

## Self-Check

- `test ! -f src/components/ui/select.tsx` → PASSED (file absent)
- `test ! -f src/components/ui/skeleton.tsx` → PASSED (file absent)
- `test -f ecosystem.config.cjs` → PASSED (untouched)
- `test -f src/migrations/index.ts` → PASSED (untouched)
- `grep -c structuredClone` on all 3 migration files → 1 each, PASSED
- `grep JSON.parse(JSON.stringify` on all 3 migration files → 0 matches, PASSED
- `npx tsc --noEmit` (run after both tasks) → PASSED, no errors
- Commit `6972ae8` → FOUND in `git log`
- Commit `f8ea619` → FOUND in `git log`

## Self-Check: PASSED

## Out of Scope / Not Touched

- `package.json`'s `next` dependency version (Task 2, skipped)
- The other ~70 react-doctor findings not covered by the plan's top-3 selection
- The pre-existing unstaged `package.json` modification present in the working tree before this task started — left as-is, not part of this quick task
