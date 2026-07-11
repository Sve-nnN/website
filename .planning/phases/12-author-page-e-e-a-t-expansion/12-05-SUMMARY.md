---
phase: 12-author-page-e-e-a-t-expansion
plan: 05
subsystem: speaking-events
tags: [payload, postgres, migration, author-page, jsonld]
requires:
  - "12-01 (Authors collection E-E-A-T fields)"
  - "12-02 (author page section pattern, JSON-LD)"
  - "12-03 (seed script pattern)"
provides:
  - Standalone SpeakingEvents collection (speaking-events)
  - 4th author-page section ("Eventos donde he sido ponente" / "Speaking Events")
  - 3rd experience[] item (aprendoclub, ongoing role)
affects:
  - src/collections/SpeakingEvents/index.ts
  - src/payload.config.ts
  - src/migrations/index.ts
  - src/payload-types.ts
  - "src/app/(frontend)/[locale]/authors/[slug]/page.tsx"
  - scripts/seed-author-eeat.ts
  - scripts/verify-phase12-author-eeat.mjs
tech-stack:
  added: []
  patterns:
    - "standalone collection with upsert-by-title seed (no natural slug on speaking-events)"
    - "defaultSort at CollectionConfig top level, not admin.defaultSort (payload 3.85 type surface)"
key-files:
  created:
    - src/collections/SpeakingEvents/index.ts
    - src/migrations/20260711_204216_phase12_speaking_events.ts
    - src/migrations/20260711_204216_phase12_speaking_events.json
  modified:
    - src/payload.config.ts
    - src/migrations/index.ts
    - src/payload-types.ts
    - "src/app/(frontend)/[locale]/authors/[slug]/page.tsx"
    - scripts/seed-author-eeat.ts
    - scripts/verify-phase12-author-eeat.mjs
decisions:
  - "SpeakingEvents modeled as a standalone collection, not related to Authors, per Juan's explicit request — the site has one real author, so the author page lists all speaking-events ordered by date rather than a relationship field"
  - "No dates invented for either speaking event — date field left null on both, per Juan's explicit instruction"
  - "aprendoclub role added to Authors.experience[] (existing field, no schema reopened) rather than speaking-events, since it's an ongoing credential/role, not a one-off talk — per Juan's own framing"
  - "No link/url field added to Authors.experience[] schema for the aprendoclub reference URL — kept it in the description text instead, per Juan's explicit instruction not to reopen the Authors schema for this"
metrics:
  duration: "~30 min"
  completed: 2026-07-11
---

# Phase 12 Plan 05 (mid-phase addition): Speaking Events Summary

Mid-phase addition requested directly by Juan (via the orchestrator) before Phase 12 closed: a 4th E-E-A-T section on the author page, "Eventos donde he sido ponente" / "Speaking Events", backed by a new standalone `speaking-events` Payload collection (not an array field on Authors, so Juan can keep adding events later). Also adds a 3rd `experience[]` item for Juan's ongoing `aprendoclub` coach role, per a follow-up real-content message from Juan.

## What Was Built

**SpeakingEvents collection** (`src/collections/SpeakingEvents/index.ts`, slug `speaking-events`): `title`/`description`/`role` (localized text/textarea), `coSpeakers[]` (array of `name`), `date` (optional, no invented dates), `location`, `attendeeCount`, `link`, `flyer` (optional upload, relationTo media). `defaultSort: '-date'` at the top-level `CollectionConfig` (not `admin.defaultSort` — a `tsc` type error caught this and it was fixed inline, see Deviations). Registered in `src/payload.config.ts`'s `collections` array.

**Migration**: `payload migrate:create phase12_speaking_events` generated `src/migrations/20260711_204216_phase12_speaking_events.ts` (+ `.json`), auto-registered in `src/migrations/index.ts`, applied against dev Postgres with `payload migrate` (push:false respected throughout). `payload generate:types` regenerated `payload-types.ts` with the `SpeakingEvent` interface.

**Author page 4th section** (`src/app/(frontend)/[locale]/authors/[slug]/page.tsx`): fetches `speaking-events` sorted `-date`, renders a single-column card grid (flyer/Mic-icon box, title + role Badge, date/location/attendees meta line, description, co-speakers, external link with `ExternalLink` icon) — same conditional-render contract as the other 3 sections (omitted if empty). Inserted as the 4th section after Experiencia.

**Seed script extension** (`scripts/seed-author-eeat.ts`): added `seedSpeakingEvents` (upserts by ES `title`, since the collection has no natural slug — creates on `es` locale, then updates both `es`/`en` per item), with the 2 real events Juan provided verbatim (Caracas SEO Fest, Taller SEO + IA en Lima por DinoRANK/Lm Marketing) — no invented dates. Also added a 3rd `experience[]` item (`aprendoclub`, "Senior Tech SEO Analyst", `startDate`/`endDate` both `null` since it's an ongoing role with no exact start date given) per Juan's follow-up message, with the DinoRANK diploma reference URL folded into the description text rather than reopening the `Authors.experience[]` schema for a new `link` field (per Juan's explicit instruction).

**Verification script extension** (`scripts/verify-phase12-author-eeat.mjs`): added checks for both real speaking-events titles and the `aprendoclub` experience item, on top of the existing 3-section + JSON-LD checks.

## Execution Evidence

- `npx tsc --noEmit` clean across the whole project after the `defaultSort` fix.
- Seed script run twice against dev DB: first run created 2 `speaking-events` docs (ids 1, 2) and updated `experience[]` to 3 items in both locales; second run confirmed idempotency — `SpeakingEvent already exists ... — updating` (no duplicates), `experience` count stayed 3, `speaking-events count: 2`.
- `node scripts/verify-phase12-author-eeat.mjs` after a clean `.next` rebuild: **RESULT: PASS** across both locale routes (`/es`, `/en`) and all 3 breakpoints (375/768/1280) — confirms both real speaking-events titles visible, the `aprendoclub` experience item visible, no horizontal overflow, and Person JSON-LD still intact.

## Deviations from Plan

- **[Rule 1 - Bug]** `defaultSort: '-date'` was initially placed inside `admin: {}` — `tsc` flagged it as an unknown `CollectionAdminOptions` property. Fixed by moving it to the top-level `CollectionConfig` (the correct location in this Payload version), verified with a clean `tsc --noEmit` re-run. Commit `bc83168`.
- No other deviations — this addition was executed exactly per the orchestrator's mid-phase instructions (2 messages: speaking-events collection + content, then the aprendoclub experience follow-up).

## Self-Check: PASSED

- FOUND: src/collections/SpeakingEvents/index.ts
- FOUND: src/migrations/20260711_204216_phase12_speaking_events.ts
- FOUND: scripts/seed-author-eeat.ts (extended)
- FOUND: scripts/verify-phase12-author-eeat.mjs (extended)
- Commits verified present: f9e93ca, e027b6a, cd5309f, b99707e, f6a0337, bc83168

## Note for final human checkpoint (12-04 Task 2)

This addition lands before Juan's single consolidated visual review — all 4 sections (Expertise, Educación y Certificaciones, Experiencia, Eventos donde he sido ponente) are now built, seeded with real content, and automated-verification-PASS, ready for one combined walkthrough per the coordinator's instruction not to re-block separately.
