---
phase: 13-home-content-population
plan: 02
subsystem: frontend
tags: [nextjs, payload, seed-script, i18n, playwright]

requires:
  - phase: 13-01-home-content-population
    provides: "AboutSection.features[]/ctaText/ctaLink schema + IconPickerField admin component + applied migration"
provides:
  - "AboutSection features grid + CTA rendered on Home (ES+EN)"
  - "FAQ block rendered on Home with 5 real Q&A (ES+EN)"
  - "Working #contact anchor backed by a real, Resend-wired ContactFormBlock on Home"
  - "Idempotent seed script (scripts/seed-phase13-home-content.ts)"
  - "Playwright verification script (scripts/verify-phase13-home-content.mjs)"
affects: [phase-14-target-keyword, phase-15-sitemap]

tech-stack:
  added: []
  patterns:
    - "Nested array sub-fields (features[]/faqs[]) inside a block-array field must have their ids captured after the first locale write and reused on the second, same discipline as top-level block ids — otherwise Payload's full-array-replace-on-update behavior orphans the first locale's localized sub-array content"

key-files:
  created:
    - scripts/seed-phase13-home-content.ts
    - scripts/verify-phase13-home-content.mjs
  modified:
    - src/blocks/AboutSection/Component.tsx
    - src/blocks/ContactFormBlock/Component.tsx
    - "src/app/(frontend)/[locale]/page.tsx"

key-decisions:
  - "contactFormBlock added to Home's layout (not previously present) reusing scripts/seed-contact-page.ts's exact copy verbatim, per this plan's <objective> gap-closure — CONTEXT.md's #contact CTA decision assumed the block already existed on Home; it didn't."
  - "Each locale's full layout is fetched fresh via findByID(locale=X) inside the seed script's loop (not a single shared currentLayout object reused across locales) — avoids cross-locale content bleed for sibling blocks untouched by this plan."

patterns-established:
  - "Sub-array id-reuse: any array field nested inside a block that itself lives inside a top-level blocks array (features[] inside aboutSection, faqs[] inside faq) needs the same id-capture-and-reuse treatment as the parent block id across multi-locale seed writes."

requirements-completed: [ABOUT-02, FAQ-01]

duration: ~35min
completed: 2026-07-11
---

# Phase 13 Plan 02: AboutSection Frontend + FAQ + Contact Content Summary

**Rendered the features grid/CTA on AboutSection, populated Home with the real "Mi enfoque en Consultoría Técnica" content and the FAQ's 5 real Q&A pairs, added a working ContactFormBlock so the new CTA's `#contact` anchor is a real functional form (not a dead link) — plus fixed a pre-existing Phase 10.7 bug where the EN Home page was showing a Spanish AboutSection paragraph.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 2/2 completed
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments
- `AboutSectionComponent` renders the 4-feature borderless grid (1-col mobile, 2-col ≥640px) + CTA button, exactly per 13-UI-SPEC.md's locked Section 1 contract
- `ContactFormBlockComponent`'s root now carries `id="contact"`, and Home's `page.tsx` forwards `onSubmit`/`locale`/`contactEmail` to `RenderBlocks` — the CTA's anchor resolves to a real, Resend-backed form
- `scripts/seed-phase13-home-content.ts` — idempotent seed populating AboutSection features/CTA, a new FAQ block (5 real Q&A), and a new ContactFormBlock on Home, in both locales
- `scripts/verify-phase13-home-content.mjs` — headless Playwright verification (ES+EN, 375/768/1280px) confirming feature titles, CTA text/href/scroll behavior, FAQ questions, `#contact` anchor presence, and no horizontal overflow — **RESULT: PASS**

## Task Commits

1. **Task 1: Render features grid + CTA, make #contact anchor real** - `b7bfac9` (feat)
2. **Task 2: Seed script — populate AboutSection features/CTA, add FAQ + ContactFormBlock to Home** - `03b6cdb` (feat)

**Additional commits (deviations, see below):**
- `ed8defe` (fix) — leftover-Spanish EN paragraph translation
- `fa8f114` (test) — Playwright verification script

## Files Created/Modified
- `src/blocks/AboutSection/Component.tsx` - renders `features[]` (icon box + title + description, borderless grid) and CTA button conditionally
- `src/blocks/ContactFormBlock/Component.tsx` - `id="contact"` added to the outer `Container`
- `src/app/(frontend)/[locale]/page.tsx` - forwards `sendContactMessage`/`locale`/`contactEmail` as `sharedProps` to `RenderBlocks`
- `scripts/seed-phase13-home-content.ts` - idempotent Local API seed (features/CTA/FAQ/contactFormBlock, ES+EN)
- `scripts/verify-phase13-home-content.mjs` - Playwright headless verification (new, not in original file list — added to fulfil the plan's manual `<verification>` steps 1-3 in an automated, repeatable way)

## Decisions Made
- Built the ContactFormBlock instance on Home by reusing `/contact`'s exact live copy verbatim (per this plan's own `<objective>` note), rather than authoring new placeholder copy, to avoid content drift between the two instances of the same form.
- Fetched each locale's full layout fresh (`findByID({ locale })`) inside the seed loop instead of reusing one `currentLayout` object across both locale writes, to guarantee sibling blocks' already-correct per-locale content is never cross-contaminated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] features[]/faqs[] sub-array ids not reused across locale writes, orphaning ES content**
- **Found during:** Task 2, first verification run of the seed script
- **Issue:** `payload.update()` full-replaces array fields on write. The seed script reused the parent block's `id` (aboutSection, faq, contactFormBlock) across locale writes, but not the *nested* `features[]`/`faqs[]` sub-array item ids. The `en` locale write therefore created brand-new sub-array rows without an `es` counterpart, and Postgres's full-replace semantics deleted the previously-written `es` rows' localized content — `es` `features[].title`/`description` and `faqs[].question`/`answer` came back `undefined`.
- **Fix:** Capture `featureIds`/`faqItemIds` after the first (`es`) locale write via a targeted refetch, and reuse them when building the `en` write's `features`/`faqs` arrays.
- **Files modified:** `scripts/seed-phase13-home-content.ts`
- **Verification:** Re-ran the seed script; direct DB read confirmed both locales' `features[]`/`faqs[]` fully populated; ran a third time to confirm idempotency (no duplicate rows, no orphaned content).
- **Committed in:** `03b6cdb` (fix folded into the same seed-script commit before first push, since it was caught before committing)

**2. [Rule 1 - Bug] Leftover Spanish paragraph on the EN AboutSection (pre-existing Phase 10.7 bug)**
- **Found during:** Post-implementation bilingual sanity pass (per orchestrator's explicit request, following Phase 12's UTC/heading bugs)
- **Issue:** `scripts/seed-phase10-7-gap-fill.ts` built its `es`/`en` paragraph copy from `author.bio ?? fallback` identically for both locales — since `author.bio` was populated (in Spanish), it silently became the first EN paragraph too. Confirmed live on the running dev server: `curl http://localhost:3000/en` showed "Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico..." verbatim.
- **Fix:** Added an idempotent, targeted patch in `seed-phase13-home-content.ts` that replaces the known-broken Spanish string with a proper English translation only on the `en` locale write, leaving the `es` content and the already-correct second EN paragraph untouched.
- **Files modified:** `scripts/seed-phase13-home-content.ts`
- **Verification:** Re-ran seed script (logged "Fixed leftover-Spanish..." once, then silent/no-op on a second run); `curl http://localhost:3000/en | grep` confirmed the English text now renders; `curl http://localhost:3000/` confirmed the ES paragraph is untouched.
- **Committed in:** `ed8defe`

---

**Total deviations:** 2 auto-fixed (2x Rule 1 — bug). **Impact on plan:** Both fixes were necessary for correctness (broken bilingual content) and directly touched the same block/page this plan already modifies. No scope creep — both are the exact class of issue the orchestrator explicitly asked to catch before Juan's review.

## Issues Encountered
None beyond the deviations documented above.

## Sanity Pass (per orchestrator's explicit request, mirroring Phase 12's post-review fixes)
- Locale headings actually translated: confirmed (`eyebrow`/`title` correct per locale, verified via direct DB read and live curl).
- No leftover English strings on the ES page: confirmed via `curl http://localhost:3000/ | grep` for known EN-only strings — none found.
- No leftover Spanish strings on the EN page: found and fixed (see Deviation #2 above); re-verified clean after the fix.
- Dates/content rendering correctly: FAQ richText answers render correctly (verified via direct DB read of the Lexical JSON); features/CTA content correct in both locales; no date fields introduced in this phase.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Home (ES+EN) now shows the AboutSection features grid + working CTA and the FAQ block with 5 real Q&A, positioned after AboutSection and before the (newly present) ContactFormBlock. The `#contact` CTA target is a real, functional contact form. Ready for Phase 14 (targetKeyword).

**Needs Juan's attention:** the admin icon-picker (`IconPickerField`, built in 13-01) has been verified via TypeScript compilation, `importMap.js` registration, and a clean `/admin/login` load with no build/runtime crash — but its interactive modal (search + click-to-select) has NOT been visually verified against a real logged-in admin session (no admin credentials available to this executor). Recommend Juan does one quick visual pass: open `/admin`, navigate to the Home doc's `aboutSection` block, expand any `features` row's `icon` field, and confirm the popup grid opens/filters/selects as designed.

## Self-Check: PASSED
