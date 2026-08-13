---
phase: 13-home-content-population
plan: 01
subsystem: cms
tags: [payload, admin-ui, postgres-migration, lucide-react, custom-field]

requires:
  - phase: 10.7-home-page-gap-fill
    provides: AboutSection block (eyebrow/title/paragraphs/photo), populated on Home
provides:
  - "AboutSection.features[] array field (min/max 4: icon+title+description)"
  - "AboutSection.ctaText/ctaLink optional text fields"
  - "IconPickerField reusable custom Payload admin component (Modal-based visual icon grid)"
  - "ICON_OPTIONS/iconSelectOptions shared icon list (24 lucide-react icons)"
affects: [13-02-home-content-population, future-contactformblock-icon-picker-retrofit]

tech-stack:
  added: []
  patterns:
    - "Custom Payload admin.components.Field override using @payloadcms/ui's Modal/useField/useModal/FieldLabel instead of shadcn Dialog (admin route does not load site Tailwind build)"
    - "Shared icon-list module (icons.ts) exporting both a React-ref-bearing list (for admin components) and a plain-value list (for Payload field `options`)"

key-files:
  created:
    - src/fields/IconPicker/icons.ts
    - src/fields/IconPicker/Component.tsx
    - src/migrations/20260711_224308_phase13_about_features_faq.ts
    - src/migrations/20260711_224308_phase13_about_features_faq.json
  modified:
    - src/blocks/AboutSection/config.ts
    - "src/app/(payload)/admin/importMap.js"
    - src/payload-types.ts
    - src/migrations/index.ts

key-decisions:
  - "IconPickerField built on @payloadcms/ui's Modal/useField/useModal (not shadcn Dialog) — the Payload admin route imports only '@payloadcms/next/css', not the site's globals.css, so Tailwind/shadcn classes have no effect there (confirmed via 13-01-PLAN.md's <interfaces> note before implementation)."
  - "Icon values persisted as camelCase strings (e.g. trendingUp) matching the iconMap convention already used in AuthorCard.tsx/SiteFooter, so 13-02's frontend iconMap lookup works without translation."
  - "features[] is additive to the existing AboutSection block — no new block type introduced, satisfying ABOUT-01's 'no new block type' constraint."

patterns-established:
  - "Icon-select fields with a visual picker: pair a plain {value,label}[] options array (server-side validated select) with a custom admin.components.Field that only ever calls setValue with one of those known values — server validation still rejects any tampered value regardless of UI path (T-13-01)."

requirements-completed: [ABOUT-01]

duration: ~15min
completed: 2026-07-11
---

# Phase 13 Plan 01: AboutSection Schema + Icon Picker Admin Component Summary

**Extended AboutSection with a features[]/CTA schema and gave `features[].icon` a real searchable Modal-based icon-grid picker (24 lucide-react icons) instead of a plain `<select>`, built on `@payloadcms/ui` primitives since the admin route doesn't load the site's Tailwind/shadcn build.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3/3 completed
- **Files modified:** 8 (2 created source files, 2 created migration files, 4 modified)

## Accomplishments
- `IconPickerField` — a client-side custom Payload admin field component (Modal + search + 44px-touch-target icon grid) replacing the plain `<select>` UX for icon fields
- `AboutSection` block schema extended with `features[]` (min/max 4: icon/title/description, icon wired to `IconPickerField`) and optional `ctaText`/`ctaLink`
- Generated and applied a Postgres migration (`push:false` respected throughout) adding the new columns/tables

## Task Commits

1. **Task 1: Shared icon list + IconPickerField admin component** - `4214835` (feat)
2. **Task 2: Wire features[]/ctaText/ctaLink onto AboutSection + regenerate importMap/types** - `64444ff` (feat)
3. **Task 3: Generate + apply + commit the Postgres migration** - `1fc39c8` (feat)

## Files Created/Modified
- `src/fields/IconPicker/icons.ts` - `ICON_OPTIONS` (24 icons: value/label/Icon) + `iconSelectOptions` (plain value/label pairs for Payload `select.options`)
- `src/fields/IconPicker/Component.tsx` - `IconPickerField` client component: button showing current icon, opens a `Modal` with search input + filtered icon grid, click sets value and closes
- `src/blocks/AboutSection/config.ts` - added `features[]` array field (icon/title/description) and `ctaText`/`ctaLink` text fields
- `src/app/(payload)/admin/importMap.js` - regenerated, registers `IconPickerField` under `@/fields/IconPicker/Component#IconPickerField`
- `src/payload-types.ts` - regenerated, `AboutSectionBlock` now includes `features`/`ctaText`/`ctaLink`
- `src/migrations/20260711_224308_phase13_about_features_faq.ts` (+`.json`) - generated migration for the new columns/tables/enums
- `src/migrations/index.ts` - auto-registered the new migration

## Decisions Made
- Used `@payloadcms/ui`'s `Modal`/`useField`/`useModal`/`FieldLabel` instead of shadcn's `Dialog`, per the plan's `<interfaces>` note confirming the admin route doesn't load Tailwind — avoided a dead-on-arrival implementation.
- Kept icon values as camelCase strings matching the existing `iconMap`/`socialIconMap` convention already established in `AuthorCard.tsx`, so 13-02's frontend rendering needs zero translation layer.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
`features[]`/`ctaText`/`ctaLink` are live in the schema, admin, and Postgres. 13-02 can now render the features grid/CTA on the frontend and seed real content via the Local API.

## Self-Check: PASSED
