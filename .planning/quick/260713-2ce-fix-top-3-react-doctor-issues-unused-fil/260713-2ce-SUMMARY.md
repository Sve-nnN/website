---
phase: quick-260713-2ce
plan: 01
subsystem: dependencies
tags: [react-doctor, dependency-cleanup, security-cve]
dependency-graph:
  requires: []
  provides: []
  affects: [package.json, package-lock.json]
tech-stack:
  added: []
  removed: [@radix-ui/react-select]
key-files:
  created: []
  modified: [package.json, package-lock.json]
decisions:
  - "Skipped the next@15.5.20 bump (Task 3) — @payloadcms/next@3.85.2's real peerDependencies exclude the entire 15.5.x line, confirmed live against npm; the plan's context block was factually wrong on this point."
metrics:
  duration: 12min
  completed: 2026-07-13
---

# Quick Task 260713-2ce: Fix top-3 react-doctor issues (unused files, unused dep, RSC CVE) Summary

Removed the dead `@radix-ui/react-select` dependency and triaged all 23 `deslop/unused-file` findings as confirmed false positives (CLI-invoked migration/PM2 files, zero deletions). Did **not** bump `next` to close the RSC CVE — the plan's assumption that `next@15.5.20` is peer-compatible with `@payloadcms/next@3.85.2` is factually wrong; the real fix requires a Next 16 major bump, already deferred by Juan.

## What Was Built

- **Task 1 (triage, no file changes):** Re-verified all 23 `deslop/unused-file` findings. `grep -n "migrations" src/payload.config.ts` returned no output — no `migrationDir` override, so Payload's default `src/migrations` convention applies. `ecosystem.config.cjs` confirmed present (PM2 deploy config, loaded by filename via `pm2 start ecosystem.config.cjs`, never imported by the Next app). 21 migration files + `src/migrations/index.ts` confirmed present and untouched. **Disposition: 23/23 flagged unused-file findings verified as false positives (1 PM2 deploy config + 22 Payload migration registry files, both CLI-invoked, not reachable from any Next.js app entry point); zero files deleted.**
- **Task 2:** Confirmed zero `src/` imports of `@radix-ui/react-select` (`grep -rln` returned no matches), then ran `npm uninstall @radix-ui/react-select`. Removed from `package.json` dependencies and `package-lock.json` regenerated. Commit `d3acae4`.
- **Task 3 — SKIPPED, deviation documented below.**
- **Task 4:** Ran `npm install` (lockfile consistency), `npx tsc --noEmit` (zero errors), and `npx react-doctor@latest --verbose`. Confirmed:
  - Zero `deslop/unused-dependency` findings for `@radix-ui/react-select`.
  - `deslop/unused-file ×23` still reported — exactly the same 23 files triaged in Task 1 (no regressions, no new unused-file findings).
  - `react-doctor/no-vulnerable-react-server-components` still reported on `next@15.4.11` — expected, since Task 3 was skipped (see deviation).

## Deviations from Plan

### Rule 4 — Architectural: Task 3 (next bump to 15.5.20) skipped, not executed

**Found during:** Task 3, before running `npm install next@15.5.20`.

**Issue:** The plan's `<context>` block asserted that `next@15.5.18`/`15.5.19`/`15.5.20` are all valid targets for the CVE-2026-23870 fix and that installing `next@15.5.20` is safe against the project's pinned `@payloadcms/next@3.85.2`. I re-verified this directly against the live npm registry before running the install:

```
npm view @payloadcms/next@3.85.2 peerDependencies
{
  next: '>=15.2.9 <15.3.0 || >=15.3.9 <15.4.0 || >=15.4.11 <15.5.0 || >=16.2.6 <17.0.0',
  graphql: '^16.8.1',
  payload: '3.85.2'
}
```

The peer range has a hard gap covering the entire `15.5.x` line (`<15.5.0` then next allowed range starts at `>=16.2.6`). `next@15.5.20` is **not** in `@payloadcms/next@3.85.2`'s peer range — installing it would either fail on strict peer resolution or require `--legacy-peer-deps`/`--force` against an untested, unsupported combination.

This is not a new finding: `.planning/STATE.md`'s Deferred Items table already documents this exact conclusion ("CVE-2026-23870 ... patch requires next@16.2.x, no compatible 15.5.x exists in `@payloadcms/next@3.85.2` peer range | deferred, needs separate go/no-go decision on Next 16 major bump"), and the immediately-preceding quick task `260713-1zw` already hit this same wall and explicitly skipped the equivalent task for the same reason. Root project `CLAUDE.md` also states: "Next 15.5 ... Once Payload publishes explicit Next 16 support. Don't lead the upgrade — the CMS admin is the fragile surface."

**Decision:** Per Rule 4 (architectural change requiring a major-version bump outside the project's pinned Next 15 line) and the existing precedent decision already on record from Juan (deferred, needs a separate go/no-go), Task 3 was skipped rather than re-litigated. `next` remains at `15.4.11`. No `package.json`/`package-lock.json` changes were made for this task.

**Files modified:** none.

**Commit:** none (no-op task).

**Impact:** The `react-doctor/no-vulnerable-react-server-components` (CVE-2026-23870) finding remains open, same as before this plan ran. This was one of the plan's stated "top 3" targets and is **not** closed by this execution — see Known Gaps below.

## Known Gaps

- **CVE-2026-23870 (next RSC DoS) remains unpatched.** The only compatible fix is a Next 16 major bump (`>=16.2.6`), which is out of scope for this plan and requires a separate explicit go/no-go decision from Juan given the CMS admin fragility concern already on record in `CLAUDE.md` and `STATE.md`. This is a re-confirmation of an already-deferred item, not a new gap.

## Self-Check: PASSED

- `package.json`: `@radix-ui/react-select` absent — confirmed (`grep -q react-select package.json` returns no match).
- `package.json`: `next` version `15.4.11` — confirmed present (unchanged, Task 3 skipped intentionally).
- Commit `d3acae4` exists — confirmed via `git log --oneline`.
- `src/migrations/index.ts` and 21 numbered migration files — confirmed present via `ls`.
- `ecosystem.config.cjs` — confirmed present.
- `npx tsc --noEmit` — zero errors.
- `npx react-doctor@latest --verbose` — zero `unused-dependency` findings, `deslop/unused-file ×23` unchanged, `no-vulnerable-react-server-components` still present (expected, Task 3 skipped).
