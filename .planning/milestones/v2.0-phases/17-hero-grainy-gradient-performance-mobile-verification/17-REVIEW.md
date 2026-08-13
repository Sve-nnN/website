---
phase: 17-hero-grainy-gradient-performance-mobile-verification
reviewed: 2026-07-12T05:34:07Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - scripts/lighthouse-mobile.mjs
findings:
  critical: 0
  warning: 4
  info: 1
  total: 5
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-07-12T05:34:07Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

This is verification tooling, not application code: the only source change in Phase 17 is an extension of `scripts/lighthouse-mobile.mjs` (Phase 11's mobile Lighthouse runner) to extract `lcpMs`/`cls`/`tbtMs` from Lighthouse audits and to accept comma-separated `--routes-only` lists. The diff itself (verified against commit `ccf08cf`) is small and matches the PLAN/SUMMARY description exactly. No leftover debug code was found — the `.debug-lh.mjs` scratch script mentioned in the SUMMARY as "created, used, deleted, never committed" is confirmed absent from the working tree and git history.

However, the SUMMARY explicitly documents a transient `Cannot read properties of undefined (reading 'toFixed')` crash on a cold-started production server, "resolved" only by manually re-running against an already-warmed server. Reviewing the shipped code confirms the root cause was never actually fixed — it was worked around procedurally. The new audit-extraction code has zero defensive handling for audits that come back without a computed `numericValue` (a documented, reproducible Lighthouse behavior on a server that hasn't served a few warm requests yet, or on any audit that errors out for other reasons). This is a real robustness gap for a script intended for repeat/future use, and it is compounded by a couple of related CLI-parsing regressions introduced in the same diff. None of these rise to Critical/BLOCKER severity — this is local-only dev/CI tooling with no security surface — but they should be fixed before this script is relied on unattended (e.g., in a future CI job).

## Warnings

### WR-01: No defensive handling for Lighthouse audits that fail to compute a numericValue (root cause of the documented transient crash never actually fixed)

**File:** `scripts/lighthouse-mobile.mjs:80-85`
**Issue:** `audits['largest-contentful-paint'].numericValue`, `audits['cumulative-layout-shift'].numericValue.toFixed(3)`, and `audits['total-blocking-time'].numericValue` are accessed unconditionally. The SUMMARY documents that on a cold-started `next start` server, this exact code threw `Cannot read properties of undefined (reading 'toFixed')` — i.e. `audits['cumulative-layout-shift']` resolved but its `numericValue` was `undefined` (Lighthouse audits can come back in an `errored`/incomplete state when the trace/timing collection races a not-yet-warm server). The SUMMARY treats this as "no code change needed" because a manual retry against a warm server worked, but that just means the bug is a flake that will recur on the next cold-start run (including any future CI invocation where there's no human to notice and retry) rather than being handled. Because this is caught by the outer per-route `try/catch` in `main()` (line 103), the script won't hard-crash — but it will silently record `{ error: ... }` for that route and, per WR-02 below, still exit 0.
**Fix:**
```js
function safeNumeric(audits, id, decimals = 0) {
  const value = audits[id]?.numericValue
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Audit "${id}" did not return a numeric value (scoreDisplayMode: ${audits[id]?.scoreDisplayMode ?? 'missing'})`)
  }
  return decimals ? Number(value.toFixed(decimals)) : Math.round(value)
}
// ...
lcpMs: safeNumeric(audits, 'largest-contentful-paint'),
cls: safeNumeric(audits, 'cumulative-layout-shift', 3),
tbtMs: safeNumeric(audits, 'total-blocking-time'),
```
This turns an obscure `TypeError` into an actionable error message, and — combined with a retry loop around `runLighthouse()` in `main()` — would let the script self-heal from the documented cold-start race instead of requiring a human to notice and manually re-run it.

### WR-02: Per-route failures never surface as a non-zero exit code

**File:** `scripts/lighthouse-mobile.mjs:100-118`
**Issue:** When `runLighthouse()` throws for a route (including the exact cold-start scenario documented in the SUMMARY), the `catch` block at line 106-109 records `scores[route] = { error: err.message }` and the loop continues. `main()` then writes the output file and returns normally — there is no check anywhere for `Object.values(scores).some(s => s.error)`, so the process always exits with code 0 unless *every* route throws before the loop even starts. In an unattended/CI context this means a partially-failed Lighthouse run (e.g. `/en` succeeds, `/es` fails) looks identical to a clean run to anything checking `$?`, and the failure would only be caught by a human reading the JSON output — exactly what happened in this phase, where a human had to notice and manually re-run.
**Fix:**
```js
if (args.out) {
  await writeFile(args.out, JSON.stringify(scores, null, 2))
  console.log(`\nScores written to ${args.out}`)
} else {
  console.log(JSON.stringify(scores, null, 2))
}

const failedRoutes = Object.entries(scores).filter(([, v]) => v.error).map(([r]) => r)
if (failedRoutes.length > 0) {
  console.error(`\n${failedRoutes.length} route(s) failed: ${failedRoutes.join(', ')}`)
  process.exitCode = 1
}
```

### WR-03: `--routes-only` with no following value now throws an unhandled `TypeError` instead of being ignored

**File:** `scripts/lighthouse-mobile.mjs:47`
**Issue:** The new parsing is `args.routesOnly = argv[++i].split(',')...`. If `--routes-only` is the last CLI token (missing its value), `argv[++i]` is `undefined`, and calling `.split(',')` on `undefined` throws synchronously inside `parseArgs()`, before any try/catch exists to handle it — it propagates straight to the `main().catch()` handler and hard-exits the whole process with a generic stack trace. The prior version (`args.routesOnly = argv[++i]`) simply assigned `undefined` and continued (silently falling back to the full `ROUTES` list downstream via the old ternary). This is a behavioral regression: a previously-tolerated (if silently wrong) invocation now hard-crashes.
**Fix:**
```js
else if (argv[i] === '--routes-only') {
  const raw = argv[++i]
  args.routesOnly = raw ? raw.split(',').map((r) => r.trim()).filter(Boolean) : null
}
```

### WR-04: `--routes-only ""` (empty string) now silently produces zero routes instead of falling back to the full route list

**File:** `scripts/lighthouse-mobile.mjs:47,94`
**Issue:** Previously, `args.routesOnly ? [args.routesOnly] : ROUTES` treated an empty-string value as falsy and fell back to the full `ROUTES` array. The new code always assigns an array from `.split(',')`, and `''.split(',').map(...).filter(Boolean)` yields `[]` — which is not `null`/`undefined`, so `args.routesOnly ?? ROUTES` at line 94 does **not** fall back; `routes` becomes `[]`, the loop runs zero times, and the script "succeeds" writing an empty `{}` scores file with no warning or error. This is a silent regression for any caller (including a future CI step) that constructs `--routes-only "$ROUTES_VAR"` where `$ROUTES_VAR` can be empty.
**Fix:** In the same `parseArgs` fix from WR-03, only assign `args.routesOnly` when the split/filtered array is non-empty:
```js
else if (argv[i] === '--routes-only') {
  const raw = argv[++i]
  const parsed = raw ? raw.split(',').map((r) => r.trim()).filter(Boolean) : []
  args.routesOnly = parsed.length > 0 ? parsed : null
}
```

## Info

### IN-01: `--no-sandbox` Chrome flag hardcoded

**File:** `scripts/lighthouse-mobile.mjs:66`
**Issue:** `chromeFlags: ['--headless=new', '--no-sandbox']` disables Chrome's OS-level sandbox. This is a common (and here, low-risk) pattern for headless Lighthouse runs against `localhost` on a local dev machine, so it is not flagged as a security issue for this script's actual usage. Worth a one-line comment if this script is ever reused as a template for a shared/CI runner auditing untrusted URLs, where `--no-sandbox` would be a more meaningful risk.
**Fix:** Optional inline comment, e.g. `// --no-sandbox: safe here (headless Chrome only ever hits localhost); reconsider if this runner is ever pointed at untrusted URLs.`

---

_Reviewed: 2026-07-12T05:34:07Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
