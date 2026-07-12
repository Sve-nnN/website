---
phase: 21-home-optimization-service-linking
verified: 2026-07-12T00:00:00Z
status: passed
score: 3/3 must-haves verified
overrides_applied: 0
---

# Phase 21: Home Optimization & Service Linking Verification Report

**Phase Goal:** Home refuerza el ángulo competitivo "desarrollo real (Next.js/Payload/CMS headless) + SEO técnico" y deja de mantener implícita la oferta de servicios, enlazando a las páginas de servicio creadas en Phase 19.
**Verified:** 2026-07-12
**Status:** passed
**Re-verification:** No — initial verification (includes a real bug found and fixed mid-execution, see Disposition)

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | El copy del Hero y/o AboutSection de Home (ambos locales) refuerza explícitamente el ángulo "desarrollo real (Next.js/Payload/CMS headless) + SEO técnico" | ✓ VERIFIED | `curl http://localhost:3000/ \| grep -oc "Next.js\|Payload"` → 23; same on `/en` → 23. `aboutSection.paragraphs[0]` and `features[2]` both rewritten to explicitly name Next.js/Payload/headless CMS, both locales, confirmed live. |
| 2 | Home tiene al menos un link visible hacia la página de Servicios, en AboutSection y/o navegación principal | ✓ VERIFIED | Header nav now includes "Servicios" (ES) / "Services" (EN), confirmed via live curl and direct Payload DB read. |
| 3 | Los links de Home hacia Servicios resuelven sin 404 en ambos locales | ✓ VERIFIED | `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/services` → 200 (link target, already live since Phase 19). |

**Score:** 3/3 ROADMAP success criteria verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `21-CONTEXT.md`, `21-01-PLAN.md` | Discuss→plan documentation | ✓ VERIFIED | Both present. |
| `21-REVIEW.md` | Code review with findings | ✓ VERIFIED | 0 critical, 1 warning (closed post-review), 2 info accepted. |
| `21-01-SUMMARY.md` | Plan completion summary | ✓ VERIFIED | Present, documents the mid-execution bug and its fix. |
| `scripts/seed-phase21-home-optimization.ts` | aboutSection copy + nav link, idempotent | ✓ VERIFIED | Ran twice (once with the bug present, once after the fix), confirmed idempotent with no duplicates. |

### Code Review Findings — Disposition

| ID | Severity | Description | Resolution |
|----|----------|--------------|------------|
| WR-01 | Warning | Idempotency guard only checked `url` existence, not `label` correctness — a future label regression would need a separate one-off fix script instead of a plain re-run | **Fixed** (commit `2d26141`) — guard now self-heals the label for both locales on every run when the item already exists, re-run verified idempotent and correct with no duplicates. |
| IN-01, IN-02 | Info | `as never` cast pattern (pre-existing repo-wide convention, not introduced by this phase); one defensive branch technically unreachable given `paragraphs` has `minRows: 1` in the schema | Accepted as-is, no functional impact. |

**Real incident found and resolved during this phase's own execution (not a code review finding, but load-bearing for this verification):** the first seed run's `en`-locale write for the new nav item collided with the same row already present in the shared `navItems` array (array itself is not localized — only `link.label` is), producing "Servicios" instead of "Services" on the EN homepage. Root-caused as a duplicate-id write; fixed at the source (`scripts/seed-phase21-home-optimization.ts` now filters the existing row by id before re-appending), corrected via a one-off non-destructive script (`scripts/fix-phase21-services-nav-label-en.ts`), and verified stable via 2 independent checks (direct Payload DB read + fresh curl bypassing Next.js's data cache). This is a real, useful precedent documented in `STATE.md` for any future phase touching `Header.navItems`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|--------------|--------|----------|
| SEO-HOME-01 | 21-01-PLAN.md | Home copy reinforces the Next.js/Payload/SEO differentiator | ✓ SATISFIED | Truth #1. |
| SEO-HOME-02 | 21-01-PLAN.md | Home links to Services, no 404, both locales | ✓ SATISFIED | Truth #2, #3. |

No orphaned requirements — REQUIREMENTS.md maps SEO-HOME-01/02 exclusively to Phase 21.

## Human Verification Required

None blocking. Recommended (non-blocking), same as Phases 19/20: Juan's visual/tone pass on the reinforced copy.

## Anti-Patterns Found

None in the final state. The mid-execution nav-label bug was found, root-caused, fixed, and independently verified before this report was written — not left as unresolved tech debt.

## Disposition

**Status: passed.** Both requirements (SEO-HOME-01/02) are satisfied and live-verified. This phase surfaced and fixed a real, non-obvious bug in Header.navItems' locale-write discipline (now documented for future phases), and code review's one Warning finding was closed with a self-healing guard rather than deferred. Zero schema changes, zero `payload.config.ts` edits — no collision with the concurrent `@payloadcms/plugin-mcp` work. This is the last content phase of milestone v1.4 (18-21) — ready for lifecycle (audit → complete → cleanup).

---
*Verified: 2026-07-12*
*Verifier: Claude (orchestrator, direct curl/tsc/DB-read verification against the real dev server and DB)*
