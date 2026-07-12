---
phase: 21-home-optimization-service-linking
plan: 01
subsystem: seo
tags: [payload-cms, nextjs, home-page, header-nav, bilingual-content]

requires:
  - phase: 19-service-pages
    provides: /services index page (real, live, 200 in both locales) as the nav link target
  - phase: 13-home-content-population
    provides: aboutSection block already populated (paragraphs[0], features[2]) for in-place editing
provides:
  - Home's aboutSection copy (both locales) explicitly reinforces the Next.js/Payload/headless-CMS + SEO-in-the-code differentiator
  - Header nav has a working "Servicios"/"Services" link to /services in both locales
affects: []

tech-stack:
  added: []
  patterns:
    - "Header.navItems id-reuse discipline: navItems array is shared (non-localized) across locales, only link.label is localized — any script editing it must filter out already-processed rows by id before re-appending a corrected version, or risk a duplicate-id write colliding at the DB level"
    - "Self-healing idempotency guard: an existence check based only on a stable field (url) is not sufficient when a mutable field (label) can independently drift — the guard should verify+correct all mutable fields on every run, not just skip on existence"

key-files:
  created:
    - scripts/seed-phase21-home-optimization.ts
    - scripts/fix-phase21-services-nav-label-en.ts
  modified: []

key-decisions:
  - "Added the Services link via Header.navItems (main nav) rather than repurposing AboutSection's existing ctaText/ctaLink, which stays pointed at #contact (a working, conversion-critical anchor) — additive positioning, not a redesign"
  - "Single canonical /services URL for the nav item across both locales, matching the existing convention that Header.navItems[].link.url is not a localized field (only label is) — every other nav item already follows this pattern"
  - "Real bug found and fixed during execution: the first run's en-locale write collided with the same id already present in the shared navItems array (since navItems isn't localized at the array level), leaving 'Servicios' instead of 'Services' on the EN homepage. Fixed the source script (filter existing row by id before re-appending) and ran a one-off non-destructive correction, verified stable via direct DB read and fresh curl"
  - "Post-review: strengthened the idempotency guard to self-heal a wrong label on any re-run, not just skip on url-match, closing WR-01 from code review"

patterns-established: []

requirements-completed: [SEO-HOME-01, SEO-HOME-02]

duration: unknown
completed: 2026-07-12
---

# Phase 21 Plan 01: Home differentiator copy + Services nav link

**Home's "Mi enfoque en Consultoría Técnica" section now explicitly names Next.js/Payload/headless CMS with SEO built into the code (both locales), and the main nav has a working "Servicios"/"Services" link to the Phase 19 service pages.**

## Performance

- **Tasks:** 1 completed (blocking gate: seed + live verification), plus a post-review fix
- **Files created:** 2 (seed script, one-off correction script)

## Accomplishments
- `aboutSection.paragraphs[0].text` (both locales) rewritten to integrate the Next.js/Payload/headless-CMS-SEO-in-the-code differentiator naturally into the existing "Mi enfoque en Consultoría Técnica" narrative, echoing Phase 19's already-approved `fullstackServiceCopy` language rather than inventing new claims.
- `features[2]` ("Arquitectura escalable"/"Scalable Architecture") description updated to explicitly name Next.js and headless CMS.
- Header nav gained a "Servicios"/"Services" item pointing at `/services` (confirmed 200, live content, since Phase 19), without disturbing any existing item's id, label, or url.
- Zero schema changes, zero `payload.config.ts` edits — explicitly coordinated with the concurrent `@payloadcms/plugin-mcp` installation happening in the same repo.
- **Real bug found, diagnosed, and fixed during execution:** the first seed run's `en`-locale write for the new nav item collided with the same row already present in the shared (non-localized) `navItems` array, resulting in the EN homepage briefly showing "Servicios" instead of "Services". Root-caused (duplicate-id write), fixed at the source, corrected via a one-off non-destructive script, and verified stable.
- **Post-review hardening:** the idempotency guard now self-heals a wrong label on any re-run (not just skip-on-url-match), closing a Warning-severity code review finding (WR-01) about the original guard only checking existence, not correctness.

## Task Commits

1. **Task 1: Seed script (aboutSection copy + nav link)** — `131d6ad` (feat)
2. **Bug fix: EN label collision** — `b3bd896` (fix, source script + one-off correction)
3. **Post-review: self-healing guard (WR-01)** — `2d26141` (fix)

## Files Created/Modified
- `scripts/seed-phase21-home-optimization.ts` — in-place aboutSection copy update + guarded, self-healing Header nav link addition
- `scripts/fix-phase21-services-nav-label-en.ts` — one-off non-destructive correction for the EN label collision (kept in the repo for auditability, matching the project's existing `fix-*.ts` precedent)

## Verification (live, against the real dev server + real DB)
- `curl -s http://localhost:3000/ | grep -oc "Next.js\|Payload"` → 23
- `curl -s http://localhost:3000/en | grep -oc "Next.js\|Payload"` → 23
- `curl -s http://localhost:3000/ | grep -o "Servicios" | wc -l` → 5
- `curl -s http://localhost:3000/en | grep -o "Services" | wc -l` → 5
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/services` → 200
- Existing nav items (Blog, Casos de éxito/Case Studies, Autores/Authors, Contacto/Contact) unchanged in both locales, confirmed via direct Payload read and curl — no duplicates after 2 seed runs.
- `npx tsc --noEmit` → exit 0

## Deviations from Plan
- The plan's Task 1 acceptance criteria anticipated a straightforward, bug-free execution; a real bug (EN label collision) was found during the live-verification step and required an additional fix cycle (source-script correction + one-off remediation script + code-review-driven guard hardening) before the phase could be considered done. Documented above and in `21-VERIFICATION.md`.

## Issues Encountered
- `Header.navItems[].link.url` is not a localized field — only `.link.label` is. Any script appending a new item across both locale writes must explicitly filter the already-existing row (by id) out of the second locale's "existing items" snapshot before re-appending its own corrected version, or risk a duplicate-id collision. This is now documented inline in the script and in this SUMMARY for future phases touching `Header.navItems`.

## Next Phase Readiness
- This is the last content phase of milestone v1.4 (18-21). No blockers carried forward. Ready for milestone lifecycle (audit → complete → cleanup).

---
*Phase: 21-home-optimization-service-linking*
*Completed: 2026-07-12*
