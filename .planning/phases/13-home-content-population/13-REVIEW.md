---
phase: 13-home-content-population
reviewed: 2026-07-11T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/fields/IconPicker/icons.ts
  - src/fields/IconPicker/Component.tsx
  - src/blocks/AboutSection/config.ts
  - src/blocks/AboutSection/Component.tsx
  - src/blocks/ContactFormBlock/Component.tsx
  - src/app/(frontend)/[locale]/page.tsx
  - scripts/seed-phase13-home-content.ts
  - scripts/verify-phase13-home-content.mjs
  - src/migrations/20260711_224308_phase13_about_features_faq.ts
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-07-11
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the AboutSection `features[]`/CTA schema, the new `IconPickerField` admin component, the Home page's frontend rendering, the seed script, the Postgres migration, and the Playwright verification script for Phase 13. The schema/migration pair is internally consistent, the seed script's locale/id-reuse discipline is correct (traced the id-capture-and-reuse logic across both locale-write iterations and confirmed it avoids orphaning sibling-locale array rows), and the FAQ/`#contact` wiring is sound.

The one blocking issue is a real admin/frontend contract mismatch: the icon picker offers 24 selectable icons, but the public-site renderer only recognizes 4 of them, silently substituting a fallback icon for the other 20 with no warning anywhere in the UI. This is exactly the kind of defect that will surface the next time someone (Juan or a future editor) uses the picker outside the four icons the seed script happens to use today. Everything else found is a maintainability/robustness concern, not a shipped-content-breaking bug — the three verified Observable Truths in 13-VERIFICATION.md (features/CTA rendering, header copy, FAQ block) hold up against the code as written.

## Critical Issues

### CR-01: IconPickerField offers 24 icons but the frontend only renders 4 — silent wrong-icon fallback for 20 of them

**File:** `src/blocks/AboutSection/Component.tsx:12` (frontend), `src/fields/IconPicker/icons.ts:34-59` (admin options), `src/blocks/AboutSection/config.ts:70-77` (schema)
**Issue:** `ICON_OPTIONS`/`iconSelectOptions` expose 24 lucide-react icons in the admin picker (`zap`, `monitor`, `code`, `trendingUp`, `shield`, `rocket`, `palette`, `lightbulb`, `target`, `layers`, `cpu`, `database`, `globe`, `search`, `settings`, `smartphone`, `server`, `lock`, `gauge`, `sparkles`, `wrench`, `lineChart`, `checkCircle`, `barChart`), and the generated `payload-types.ts` union for `features[].icon` includes all 24 as valid values. But `AboutSectionComponent`'s render-side `iconMap` only maps 4 of them:
```ts
const iconMap = { trendingUp: TrendingUp, zap: Zap, code: Code, monitor: Monitor } as const
...
const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Code
```
If an editor picks any of the other 20 icons (e.g. `shield`, `rocket`, `palette` — icons CONTEXT.md itself lists as part of the intended set), the site silently falls back to rendering the `Code` icon with zero indication anything went wrong — no console warning, no admin-side validation, no visual difference between "intentionally chose Code" and "picked an icon that isn't wired up." The `as keyof typeof iconMap` cast actively suppresses the TypeScript error that would otherwise flag this mismatch (the compiler knows `item.icon` can be one of 24 strings, but the assertion forces it to pretend only the 4 keys are possible).
This currently doesn't affect the live seeded content (the seed script only ever uses `trendingUp`/`zap`/`code`/`monitor`), but it means the icon picker — a feature Juan explicitly requested to make icon selection reliable and visual — silently breaks for 83% of its own offered options the moment anyone uses it for anything beyond today's 4 seeded features.
**Fix:** Either (a) scope `ICON_OPTIONS` used by `AboutSection.features[].icon` down to just the 4 icons the frontend renders (pass a filtered subset to this field's `options`/component instead of the full 24-icon shared list), or (b) extend `iconMap` in `Component.tsx` to cover the full `ICON_OPTIONS` set by deriving it directly from `icons.ts` instead of hand-listing 4:
```ts
import { ICON_OPTIONS } from '@/fields/IconPicker/icons'
const iconMap = Object.fromEntries(ICON_OPTIONS.map((o) => [o.value, o.Icon]))
```
This removes the need for the `as keyof typeof iconMap` cast and guarantees every icon offered in admin actually renders on the site.

## Warnings

### WR-01: `ctaLink` is a free-text field with no scheme/format validation, rendered directly into an `href`

**File:** `src/blocks/AboutSection/config.ts:101-107`, `src/blocks/AboutSection/Component.tsx:66-71`
**Issue:** `ctaLink` is a plain `text` field with no `validate` function restricting it to relative anchors/paths or `http(s)`/`mailto` schemes. It's rendered directly as `<a href={ctaLink}>`. Since this is admin-only content (not user-submitted), this is not exploitable by anonymous visitors, but it removes a cheap guardrail — a `javascript:`-scheme value (typo, compromised admin session, or a future contributor copy-pasting from an untrusted source) would render as a functional `javascript:` link with no server-side or admin-UI pushback.
**Fix:** Add a lightweight `validate` on `ctaLink` restricting it to values starting with `#`, `/`, `http://`, `https://`, or `mailto:`.

### WR-02: `IconPickerField` trigger button has no accessible label/state wiring

**File:** `src/fields/IconPicker/Component.tsx:30-56`
**Issue:** The trigger `<button>` that opens the icon-picker modal has no `aria-haspopup`, `aria-expanded`, or `aria-labelledby`/`id` pairing with the preceding `FieldLabel`. Screen-reader users get a button announced only as its visible text ("Select icon…" or the selected icon's label), with no indication it opens a dialog or which form field it belongs to.
**Fix:**
```tsx
<FieldLabel label={field.label} required={field.required} path={path} htmlFor={`field-${path}`} />
<button
  id={`field-${path}`}
  aria-haspopup="dialog"
  aria-expanded={/* track via useModal or local state if available */ false}
  ...
>
```

### WR-03: `RenderBlocks` spreads full `sharedProps` (including `onSubmit`, `contactEmail`) onto every block, not just the ones that need them

**File:** `src/app/(frontend)/[locale]/page.tsx:49-56`, `src/blocks/RenderBlocks.tsx:76-82`
**Issue:** This is a pre-existing pattern (not introduced by Phase 13), but this phase's change (`sharedProps={{ onSubmit: sendContactMessage, locale, contactEmail: ... }}`) widens its blast radius: every block on the Home layout now receives the Resend server action and the contact email as props, whether or not it's `ContactFormBlockComponent`. Today this is harmless because unrelated components (e.g. `AboutSectionComponent`, `FAQComponent`) simply ignore unknown props, but it's an easy source of future bugs if a block ever destructures a prop name that collides with `onSubmit`/`locale`/`contactEmail` for an unrelated purpose, and it silently couples every block's prop surface to whatever `sharedProps` any given page decides to pass.
**Fix:** Not blocking for this phase, but worth a follow-up: scope `sharedProps` delivery to the specific `blockType` that needs it (e.g. a `blockProps` map keyed by `blockType`) instead of a global spread.

## Info

### IN-01: Seed script's `contactCopy` typed as `Record<string, unknown>` loses type safety for a known shape

**File:** `scripts/seed-phase13-home-content.ts:208`
**Issue:** `contactCopy` (and the `layout as any` cast at line 358) sidestep the generated `Page`/`ContactFormBlock` types entirely. This is consistent with prior seed scripts in this codebase (not a new pattern), but it means a typo in a field name (e.g. `sidebarTitle` vs `sidebartitle`) would not be caught until a live write against the Local API.
**Fix:** Consider typing `contactCopy` against `Omit<ContactFormBlock, 'id'>` from `payload-types.ts` in a future cleanup pass; not blocking given the established codebase convention.

### IN-02: `IconPickerField` search only matches icon `label`, not `value`

**File:** `src/fields/IconPicker/Component.tsx:24-26`
**Issue:** `filtered = ICON_OPTIONS.filter((opt) => opt.label.toLowerCase().includes(...))` — matches display labels only. This is fine for the current label set (labels are just Title Case of the camelCase value), but if a future icon's `label` diverges from its `value` in wording, search-by-label could miss what an editor expects. Minor, purely a future-maintenance note.
**Fix:** No action needed now; flagging for awareness only.

### IN-03: `verify-phase13-home-content.mjs` hardcodes `BASE_URL` default to `localhost:3000` while the rest of the codebase's dev server conventionally runs on 3001 per CLAUDE.md

**File:** `scripts/verify-phase13-home-content.mjs:12`
**Issue:** CLAUDE.md's project description references `localhost:3001` as the reference/dev context for this rebuild. The verification script defaults to `localhost:3000`, overridable via `BASE_URL` env var. Not a bug (it's an override-able default and 13-VERIFICATION.md confirms it was run correctly against the actual dev server), but worth a note in case the default silently targets the wrong port in a future run.
**Fix:** No action required; override via `BASE_URL=http://localhost:3001 node scripts/verify-phase13-home-content.mjs` if needed, or align the default with the project's actual dev port.

---

_Reviewed: 2026-07-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
