---
phase: 30-content-humanization-globals-core-pages-services-geo
plan: 01
subsystem: content
tags: [payload-local-api, i18n, content-humanization, header, footer, authors, testimonials, speaking-events, categories]

# Dependency graph
requires:
  - phase: 29-content-humanization-safety-net
    provides: 29-FIELD-AUDIT.md (localized-field map), 29-VOICE-PROFILE.md (voice rules), content-humanization-snapshot.ts (reusable snapshot tool)
provides:
  - Pre-sweep content snapshot (pre-sweep-phase30-*.json) for Phase 31 diffing
  - Header/Footer globals rewritten in Juan's calibrated voice, both locales
  - Header.ctaButton.label and Footer.legalLinks[2] locale-parity bugs fixed
  - Authors/Testimonials/SpeakingEvents/Categories rewritten in Juan's calibrated voice, both locales
  - 3 additional Categories locale-parity gaps fixed (found live, not in original plan scope)
affects: [30-02, 30-03, 31-content-humanization-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Global array rewrite: findGlobal({ locale: 'all' }) first to capture ids, echo ids back per-locale on updateGlobal to avoid orphaning rows"
    - "Flat-collection rewrite: only pass changed fields in payload.update data — Payload leaves omitted fields (e.g. untouched arrays) alone, no id-reuse needed when a field isn't in the payload at all"

key-files:
  created:
    - scripts/humanize-globals-header-footer.ts
    - scripts/humanize-lean-collections.ts
    - .planning/phases/29-content-humanization-safety-net/content-snapshots/pre-sweep-phase30-2026-07-14T20:38:02.242Z.json (gitignored by design, not committed — same as all prior snapshots in that directory)
  modified: []

key-decisions:
  - "Header/Footer navItems, columns, dynamicColumns, and copyrightText were confirmed already in Juan's voice via a live read before writing the rewrite script — echoed back unchanged (ids reused) rather than rewritten for the sake of it"
  - "Testimonials.testimonial for Patricia Ibarra had the literal Spanish string duplicated into the en locale (not a translation) — treated as a locale-parity bug, not new content invention; translated faithfully without adding claims not in the original quote"
  - "Categories had 3 additional locale-parity gaps beyond the plan's 2 named bugs (General/Development missing en title, Development's es title held the untranslated English word, SEO Strategy's en description was the literal placeholder 'Test category.') — fixed under deviation Rule 1 as the same bug class already in scope"
  - "SpeakingEvents.location left untouched — confirmed live values are city/country proper nouns ('Lima, Peru', 'Caracas, Venezuela'), matching 29-FIELD-AUDIT.md Action Needed #4's expectation"

patterns-established:
  - "Em dash removal in existing production copy: Authors.bio (es) and SpeakingEvents.role (both events) used em dashes despite the voice sample's explicit 'cero em dash' rule — replaced with parentheses/commas"

requirements-completed: [VOICE-06, VOICE-07]

# Metrics
duration: 25min
completed: 2026-07-14
---

# Phase 30 Plan 01: Globals + Lean Collections Content Humanization Summary

**Rewrote Header/Footer navigation copy and Authors/Testimonials/SpeakingEvents/Categories editorial fields into Juan's calibrated voice in both es/en, fixing 2 planned locale-parity bugs (ctaButton, legalLinks) plus 4 more found live (Testimonials en-collapse, 3x Categories gaps), all via Payload Local API against production Neon.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-14T20:18:00Z (approx, first tool call)
- **Completed:** 2026-07-14T20:43:00Z
- **Tasks:** 3/3 completed
- **Files created:** 2 scripts + 1 snapshot JSON (gitignored)

## Accomplishments

- Ran the mandatory pre-sweep snapshot (`pre-sweep-phase30-2026-07-14T20:38:02.242Z.json`) before any rewrite touched the database
- Fixed the real `Header.ctaButton.label` locale-collapse bug: was `"Get in Touch"` in **both** `es` and `en` live; now `es: "Hablemos"`, `en: "Let's talk"` — distinct, collaborative-tone values per VOICE-PROFILE's CTA rule
- Fixed the real `Footer.legalLinks[2]` (sitemap entry) missing `en` label entirely; now `en: "Sitemap"`
- Confirmed Header `navItems` and Footer `columns`/`dynamicColumns`/`copyrightText` were already in Juan's voice (no em dash, no AI tells, short direct nav copy) — left unchanged, echoed back with ids reused so no rows were orphaned
- Rewrote `Authors.bio` in both locales: removed em dashes from the `es` version (voice sample explicitly never uses them), rewrote the `en` version to carry the same mixed long/short rhythm as `es` instead of a more compressed/corporate register
- Fixed a real `Testimonials.testimonial` bug: the `en` locale held the literal untranslated Spanish string — now has a faithful English rendering
- Rewrote `SpeakingEvents.role` for both events, removing em dash separators; tightened the Caracas event's redundant "first conference... first conference" `description` phrasing in both locales without losing any fact (100 attendees, Caracas, Venezuela)
- Found and fixed 3 additional `Categories` locale-parity gaps beyond the plan's named bugs: `General`/`Development` missing `en` title, `Development`'s `es` title literally holding the untranslated English word "Development", and `SEO Strategy`'s `en` description being the literal placeholder string `"Test category."`
- Confirmed `Clientes` as an intentional no-op (proper nouns/URLs only) — documented in the script's own header comment, no update logic written for it
- No `meta.title`/`meta.description`/`targetKeyword` field touched anywhere

## Task Commits

Each task was committed atomically:

1. **Task 1: Run the mandatory pre-sweep snapshot** - no code commit (generated artifact only, gitignored per existing repo convention for this directory)
2. **Task 2: Humanize Header and Footer globals, fix the 2 real bugs** - `9746c99` (feat)
3. **Task 3: Humanize lean collections (Authors, Testimonials, SpeakingEvents, Categories); confirm Clientes no-op** - `3c9580e` (feat)

_No TDD tasks in this plan — all are content-write scripts against production Postgres via Payload Local API._

## Files Created/Modified

- `scripts/humanize-globals-header-footer.ts` - reads live Header/Footer via `locale: 'all'`, reuses array ids, fixes ctaButton/legalLinks bugs, echoes back already-correct copy
- `scripts/humanize-lean-collections.ts` - rewrites Authors.bio, Testimonials.testimonial, SpeakingEvents.role/description, Categories.title/description in both locales; documents Clientes as no-op
- `.planning/phases/29-content-humanization-safety-net/content-snapshots/pre-sweep-phase30-2026-07-14T20:38:02.242Z.json` - pre-rewrite baseline (gitignored, not committed, matches existing repo convention for this directory)

## Before/After Samples

**Header.ctaButton.label** (real bug fix):
- Before: `es: "Get in Touch"`, `en: "Get in Touch"` (identical, es never actually localized)
- After: `es: "Hablemos"`, `en: "Let's talk"`

**Footer.legalLinks[2]** (real bug fix):
- Before: `es: "Sitemap"`, `en: <missing>`
- After: `es: "Sitemap"`, `en: "Sitemap"`

**Authors.bio (es)** — em dash removal, facts unchanged:
- Before: "...la auditoría técnica SEO —rastreo, indexabilidad, Core Web Vitals, Schema.org y datos estructurados— con el desarrollo full-stack..."
- After: "...la auditoría técnica SEO (rastreo, indexabilidad, Core Web Vitals, Schema.org y datos estructurados) con el desarrollo full-stack..."

**Authors.bio (en)** — rhythm rebalanced to match es:
- Before: "I build web applications with Next.js and Payload CMS, conduct technical SEO audits (crawlability, Core Web Vitals, Schema.org, indexation), and help businesses grow their organic visibility by fixing issues at the source."
- After: "My work sits at the intersection of software development and search engine optimization: technical SEO audits (crawlability, Core Web Vitals, Schema.org, indexation) combined with full-stack development in Next.js and Payload CMS. I help businesses grow their organic visibility by fixing issues directly in the code, no intermediaries involved."

**Testimonials.testimonial** (real bug fix, en held literal es text):
- Before: `es: "Trabajar con Juan fue lo mejor"`, `en: "Trabajar con Juan fue lo mejor"` (identical)
- After: `es: "Trabajar con Juan fue lo mejor."`, `en: "Working with Juan was the best decision we made."`

**Categories `seo` slug description (en)** — placeholder replaced with real content:
- Before: `"Test category."`
- After: `"Organic ranking methodologies, information architecture through topic clusters, and E-E-A-T optimization. Data-driven strategies to dominate the SERPs."`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Testimonials.testimonial locale-collapse (identical es/en text)**
- **Found during:** Task 3
- **Issue:** Live `en` locale held the literal Spanish string `"Trabajar con Juan fue lo mejor"` instead of a translation — same root-cause class as the Header ctaButton bug (a field never actually localized despite the schema supporting it).
- **Fix:** Wrote a faithful, minimal English rendering: "Working with Juan was the best decision we made." No new claims added beyond what the original quote implies.
- **Files modified:** `scripts/humanize-lean-collections.ts`
- **Commit:** `3c9580e`

**2. [Rule 1 - Bug] Categories: 3 additional locale-parity gaps beyond plan scope**
- **Found during:** Task 3 (live read before writing the rewrite script)
- **Issue:** `General` and `Development` categories had no `en` title at all; `Development`'s `es` title field literally held the untranslated English word "Development"; `SEO Strategy`'s `en` description was the literal placeholder string `"Test category."` left over from earlier seeding.
- **Fix:** Added `en: "General"`; set `es: "Desarrollo"` / `en: "Development"` for the Development category; wrote a real translated `en` description for SEO Strategy.
- **Files modified:** `scripts/humanize-lean-collections.ts`
- **Commit:** `3c9580e`

**3. [Rule 1 - Bug] Em dash usage in existing production copy**
- **Found during:** Task 3
- **Issue:** `Authors.bio` (es) and `SpeakingEvents.role` (both events) used em dashes (`—`), directly violating the voice sample's explicit "cero em dash" rule (`research/voice-sample-juan.md`, `29-VOICE-PROFILE.md`).
- **Fix:** Replaced em dashes with parentheses (bio) and commas (role).
- **Files modified:** `scripts/humanize-lean-collections.ts`
- **Commit:** `3c9580e`

No auth gates encountered. No architectural changes needed (Rule 4 not triggered).

## Known Stubs

None. The one placeholder found (Categories `seo` en description, `"Test category."`) was fixed in this plan rather than left as a documented stub, since a real translation was straightforward to write from the existing es content.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All writes are content-only field updates via existing Local API, consistent with the plan's threat model (T-30-01, T-30-02).

## Self-Check: PASSED

- FOUND: `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/scripts/humanize-globals-header-footer.ts`
- FOUND: `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/scripts/humanize-lean-collections.ts`
- FOUND: commit `9746c99` (`git log --oneline --all | grep 9746c99`)
- FOUND: commit `3c9580e` (`git log --oneline --all | grep 3c9580e`)
- FOUND: pre-sweep snapshot file on disk (gitignored, confirmed via `ls` during Task 1 verification)
- Verified live database state post-write matches all before/after samples above (read back via `payload.findGlobal`/`payload.find` with `locale: 'all'`)
