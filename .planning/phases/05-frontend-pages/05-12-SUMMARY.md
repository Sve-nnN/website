---
phase: 05-frontend-pages
plan: 12
subsystem: database
tags: [payload, resend, contact-form, i18n-bug, legal-pages]

requires:
  - phase: 05-04
    provides: ContactFormBlock renderer (no-op submit placeholder), RenderBlocks
provides:
  - Working Resend-backed contact form submission
  - /privacy, /terms pages with real ported legal copy
  - CONT-06 confirmation (no SEO-tooling dashboard)
  - Fix for a real localization bug affecting every seeded Pages doc
affects: [05-13]

tech-stack:
  added: []
  patterns:
    - "Server actions passed as sharedProps through RenderBlocks (mirrors 05-07's category-filter pattern) rather than editing block Component.tsx markup"
    - "Seed scripts must reuse persisted block/column ids across sequential per-locale payload.update calls, or later locale writes silently orphan earlier locales' localized field data"

key-files:
  created:
    - src/app/actions/contact.ts
    - src/app/(frontend)/[locale]/contact/page.tsx
    - src/app/(frontend)/[locale]/privacy/page.tsx
    - src/app/(frontend)/[locale]/terms/page.tsx
    - scripts/seed-legal-pages.ts
    - scripts/seed-contact-page.ts
  modified:
    - src/blocks/ContactFormBlock/Component.tsx
    - src/blocks/Content/config.ts
    - scripts/seed-home-page.ts
    - scripts/seed-blog-page.ts

key-decisions:
  - "Added scripts/seed-contact-page.ts (not in the plan's file list) since the contact Pages doc didn't exist yet — without it /contact 404s regardless of the server action being correctly wired"
  - "Fixed Content block's missing localized:true on richText (real pre-existing bug from Phase 1) rather than working around it in only the legal-pages seed script, since it would have silently broken every future Content-block use across locales"
  - "Fixed the seed-script id-instability bug generically across all 4 affected scripts (home/blog/contact/legal-pages) rather than only the two directly touched by this plan"

patterns-established:
  - "Any future seed script writing localized nested block/array fields per-locale must reuse persisted ids after the first locale write"

requirements-completed: [CONT-01, CONT-05, CONT-06]

duration: 45min
completed: 2026-07-10
---

# Phase 5 Plan 12: Contact + Privacy + Terms Summary

**Real Resend-backed contact form, ported Privacy/Terms legal pages, CONT-06 confirmed clean — plus a real cross-cutting localization bug found and fixed that was silently breaking every seeded bilingual Content block across the whole phase.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 2 completed
- **Files modified:** 17

## Accomplishments
- `src/app/actions/contact.ts`: server action validating input, honeypot spam-drop, HTML-escaped message body, recipient always from `CONTACT_TO_EMAIL`
- `/contact` page wires the action as `ContactFormBlock`'s `onSubmit` via `RenderBlocks`'s `sharedProps`, without touching the block's markup beyond adding honeypot/locale hidden fields and a success/error banner
- Verified the action's logic directly (honeypot short-circuits, invalid email rejected, valid submission correctly attempts `payload.sendEmail` and gracefully redirects on failure) — real delivery is blocked only by a placeholder `RESEND_API_KEY`, flagged as a setup item below
- `/privacy` and `/terms`: real, verbatim-ported legal copy (6 + 5 sections) from JuanPortfolio, as editable `Content`-block richText in both locales
- CONT-06 confirmed: 0 matches for any SEO-tooling collection/global name in `src/collections`/`src/globals`
- **Found and fixed a real, previously-invisible localization bug**: `Content` block's `richText` field was missing `localized: true`, and every seed script (home/blog/contact/legal-pages) was regenerating block/array ids on each locale's `update` call — together these silently collapsed every bilingual Content-block page to a single locale's copy. Fixed both root causes and re-verified all 5 affected pages (home, blog, contact, privacy, terms) render correct per-locale content end-to-end.

## Task Commits

1. **Task 1: Contact server action + wiring + /contact page** - `d2d7fe3` (feat)
2. **Task 2: Privacy/Terms pages + Content-block localization bug fix** - `c493d28` (feat)

## Files Created/Modified
- `src/app/actions/contact.ts` - Resend-backed server action
- `src/blocks/ContactFormBlock/Component.tsx` - honeypot/locale hidden fields, success/error banner
- `src/app/(frontend)/[locale]/contact/page.tsx`, `.../privacy/page.tsx`, `.../terms/page.tsx` - new routes
- `scripts/seed-contact-page.ts`, `scripts/seed-legal-pages.ts` - seed scripts
- `src/blocks/Content/config.ts` - added `localized: true` to `richText`
- `scripts/seed-home-page.ts`, `scripts/seed-blog-page.ts` - id-stability fix

## Decisions Made
- Fixed the Content-block localization bug and the seed-script id-instability bug at their root (affecting all prior Wave 4 seed scripts), rather than a narrow workaround scoped only to this plan's own pages, since leaving it would have silently broken bilingual content sitewide

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Contact Pages doc didn't exist**
- **Found during:** Task 1 verification
- **Issue:** `/contact` had nothing to fetch — 404 regardless of correct action wiring
- **Fix:** Added `scripts/seed-contact-page.ts`
- **Committed in:** d2d7fe3

**2. [Rule 1 - Bug] Content block's richText field was not localized**
- **Found during:** Task 2 verification (privacy/terms pages showed English copy on the Spanish route)
- **Issue:** Missing `localized: true` on `Content` block's `richText` field caused ES/EN values to collapse into one shared value
- **Fix:** Added `localized: true`, generated + applied a migration against real Neon Postgres
- **Files modified:** src/blocks/Content/config.ts
- **Committed in:** c493d28

**3. [Rule 1 - Bug] Seed scripts regenerated block/array ids per locale, orphaning earlier locales' data**
- **Found during:** Task 2 verification (re-testing after fix #2 still showed empty ES content)
- **Issue:** `payload.update` calls per locale, without stable block/column ids, replaced the entire array each time — the previous locale's localized child rows were silently orphaned
- **Fix:** Fetch and reuse persisted ids after the first locale's write, in all 4 affected seed scripts (home, blog, contact, legal-pages)
- **Files modified:** scripts/seed-home-page.ts, scripts/seed-blog-page.ts, scripts/seed-contact-page.ts, scripts/seed-legal-pages.ts
- **Committed in:** c493d28

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 bugs)
**Impact on plan:** Deviations #2 and #3 together fixed a real, silent, sitewide bilingual-content bug that would have shipped broken ES/EN parity across Home, Blog, Contact, Privacy, and Terms. Necessary, not scope creep — the bug was discovered directly while verifying this plan's own deliverables.

## Issues Encountered
- `RESEND_API_KEY` in `.env` is a placeholder/invalid value — real contact-form email delivery cannot be verified end-to-end in this environment. The action's logic was confirmed correct by direct invocation (honeypot/validation/graceful-failure all behave correctly); only the actual Resend API call fails with a 401.

## User Setup Required
**Resend API key needed for real email delivery.** `RESEND_API_KEY` in `.env` must be replaced with a real Resend API key (currently a placeholder). Once set, submitting `/contact` will deliver real emails to `CONTACT_TO_EMAIL` (already correctly configured as `hello@juan-tech.com`).

## Next Phase Readiness
All content-bearing Wave 4 pages are complete and verified bilingual. Ready for 05-13's bilingual QA checkpoint — Juan should specifically re-verify Home/Blog/Contact/Privacy/Terms in both locales given the localization bug found and fixed here, and should provide a real `RESEND_API_KEY` before go-live to enable actual contact-form email delivery.

---
*Phase: 05-frontend-pages*
*Completed: 2026-07-10*

## Self-Check: PASSED
