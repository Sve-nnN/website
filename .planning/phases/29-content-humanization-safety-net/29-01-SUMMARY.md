---
phase: 29-content-humanization-safety-net
plan: 01
subsystem: content-planning-docs
tags: [voice-profile, field-audit, localization, humanizer, i18n]
dependency-graph:
  requires: []
  provides:
    - "29-FIELD-AUDIT.md (full field-localization audit, all collections/globals/blocks)"
    - "29-VOICE-PROFILE.md (humanizer skill input brief for Phases 30/31)"
  affects:
    - "Plan 29-03 (TestimonialsCarousel.title migration)"
    - "Plan 29-04 (CaseStudies.services[].service migration)"
    - "Phases 30/31 (real content humanization rewrite)"
tech-stack:
  added: []
  patterns:
    - "Voice profile grounded in a real writing sample (research/voice-sample-juan.md) as primary/authoritative source, applied to both ES and EN"
key-files:
  created:
    - .planning/phases/29-content-humanization-safety-net/29-FIELD-AUDIT.md
    - .planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md
  modified: []
decisions:
  - "Llms.llmsTxt / Llms.llmsFull marked AWAITING JUAN'S CALL in the audit rather than silently resolved — two options presented (localize vs. document as intentional single-locale exception)"
  - "Voice profile's primary/authoritative source is research/voice-sample-juan.md (Juan's real writing sample), not just the Arianna Lupi/JUAN-PROFILE.md research — added mid-execution per coordinator note, applies to both ES and EN"
metrics:
  duration: "~40 minutes"
  completed: "2026-07-14"
---

# Phase 29 Plan 01: Field Audit + Voice Profile Summary

Two pure-documentation deliverables for the Phase 29 safety net: a full field-by-field localization audit across every collection/global/block, and a voice profile brief for the `humanizer` skill grounded in Juan's real writing sample, applied to both locales.

## What was built

**Task 1 — `29-FIELD-AUDIT.md`**: transcribed the complete raw findings from `29-PATTERNS.md`'s grep sweep into one table covering every public text field across all 11 collections, 4 globals, and 22 blocks registered on Pages. Added an "Action Needed" section with the 5 flagged items:
1. `TestimonialsCarousel.title` — migration required (Plan 29-03)
2. `CaseStudies.services[].service` — flagged pending investigation at write time
3. `Llms.llmsTxt`/`Llms.llmsFull` — new finding this session, marked **AWAITING JUAN'S CALL** with two explicit options rather than resolved silently
4. `SpeakingEvents.location` — minor, documented as likely-correct-as-is
5. `Websites.stack[].tag` — documented as already resolved per Phase 38 CONTEXT.md

**Task 2 — `29-VOICE-PROFILE.md`**: built as the humanizer-skill input brief for Phases 30/31, structured around tone rules, a positive-reference bio citation, competitor contrast (Arianna Lupi vs. Aleyda Solis), per-content-type application guidance, and an explicit "no hacer" section.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - missing critical input] Voice profile primary source updated mid-execution**
- **Found during:** Task 2, after initial draft was written
- **Issue:** The coordinator flagged that Juan wants the humanizer to always use his real voice, grounded in `research/voice-sample-juan.md` (a genuine writing sample with detected voice traits: mixed long/short rhythm, the "así sea X, Y o Z" connector, no em dash, technical vocabulary without forced anglicisms, personal-reflection closers) — not just the Arianna Lupi/Aleyda Solis competitor research the plan originally scoped.
- **Fix:** Rewrote `29-VOICE-PROFILE.md` to lead with `research/voice-sample-juan.md` as the primary/authoritative source (ahead of the JUAN-PROFILE.md bio, now framed as a secondary confirming reference), and added an explicit "Traducción del mismo ritmo/tono al inglés" subsection describing how the same rhythm/tone applies to EN, not just ES. Added two new "no hacer" items (no em dash in either language, no letting EN slip into a more polished/corporate register than ES).
- **Files modified:** `.planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md`
- **Commit:** 8885260

### Not flagged as a deviation (external, concurrent change)

`29-FIELD-AUDIT.md` was created by this plan (Task 1) but its Action Needed item #2 (`CaseStudies.services[].service`) was subsequently updated in-place by the concurrently-running Plan 29-02 agent once their live-data investigation completed, and swept into their commit `910240c docs(29-02): resolve CaseStudies.services[].service localization decision` alongside their own new `29-CASESTUDIES-SERVICES-DECISION.md`. This is expected cross-plan handoff behavior (Task 1's own instructions explicitly say the doc "will be updated with the final decision once Plan 29-02's investigation completes") — no content was lost or reverted, the file's current state on disk matches what Task 1 was written to produce, verdict included. No separate commit was made for this file under Plan 29-01 since it is already captured in Plan 29-02's commit history.

## Self-Check: PASSED

- FOUND: `.planning/phases/29-content-humanization-safety-net/29-FIELD-AUDIT.md` (present on disk, committed in `910240c`)
- FOUND: `.planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md` (present on disk, committed in `8885260`)
- FOUND: commit `8885260` (docs(29-01): add voice profile brief for humanizer skill)
- Verification greps: `TestimonialsCarousel` (5 hits), `llmsTxt` (4 hits), `sin voceo` (1 hit), `Arianna Lupi` (1 hit) — all pass per task-level `<verify>` blocks.

## Commits

- `8885260`: docs(29-01): add voice profile brief for humanizer skill
- (Task 1's file content is present via `910240c`, committed by the concurrent Plan 29-02 agent — see Deviations above)
