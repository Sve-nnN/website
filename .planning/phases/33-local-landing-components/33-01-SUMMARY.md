# Phase 33 Plan 01 Summary: Build Local Landing Components

**Status:** Complete

Extended `src/blocks/Hero/config.ts` with a `local-landing` variant option plus 5 conditional fields (`cityName`, `inlineStat`, `ringSide`, `ringOpacity`, `ringFlipX`), following the existing `breadcrumbs` field's `admin.condition` pattern. Extended `src/blocks/Hero/Component.tsx` to render the city badge (MapPin + name), a stroke-only decorative ellipse SVG positioned/opacity/flip per the new fields, and an inline stat (CheckCircle2 + text) — the existing generic `links` CTA-row rendering was reused unmodified. Created `src/blocks/LocalProofSection/config.ts` + `Component.tsx` (3-stat array + testimonial group with name/business), modeled directly on `ResultsSection` and `TestimonialSection`. Registered the new block in `src/blocks/blockRegistry.tsx` and `src/collections/Pages/index.ts`.

Ran `payload generate:types` (clean) and `npx tsc --noEmit` (clean, zero errors). Generated the schema migration (`20260714_023126_phase33_local_landing_components.ts`), read the full SQL before applying — confirmed purely additive (2 new ENUM types, `ALTER TYPE ... ADD VALUE`, 8 new tables for `LocalProofSection` [live + versions, each with locale sub-tables], new nullable/defaulted columns on `pages_blocks_hero`/`_pages_v_blocks_hero`, new FKs/indexes — zero `DROP`/`TRUNCATE` in the UP path) — applied with `payload migrate` against the real Neon DB.

Functional verification: created a throwaway page (`scripts/phase33-test-page-create.ts`, page id 13) with 2 Hero `local-landing` blocks (Madrid config: ring right/opacity 0.25/no flip; Lima config: ring left/opacity 0.35/flipX) and 1 `LocalProofSection` block, plus a throwaway route at `src/app/(frontend)/[locale]/phase33-local-landing-test/page.tsx`. Started `next dev`, curled both `/phase33-local-landing-test` (es) and `/en/phase33-local-landing-test` — both 200, zero errors in dev log. Confirmed via grep: both city badges ("Madrid"/"Lima") present, exactly 2 `<ellipse>` elements, correct per-instance `style="opacity:0.25;transform:translateY(-50%)"` (Madrid) vs `style="opacity:0.35;transform:translateY(-50%) scaleX(-1)"` (Lima), correct CTA hrefs (`/contacto` on both, `/casos-lima` only on the Lima outline button), all 3 stats (`+40`/`98%`/`5 anos`) and the testimonial (name + business) rendered.

Killed the dev server, deleted the throwaway route file, and ran `scripts/phase33-test-page-cleanup.ts` (guarded exact-slug-match delete) — confirmed page id 13 deleted, re-query returns 0 docs. `scripts/phase33-test-page-create.ts`/`phase33-test-page-cleanup.ts` left in the repo (same convention as existing `seed-phaseNN`/`cleanup-phaseNN` scripts) for reuse if Phase 34 needs to re-verify.

**Deviations:** None from the plan. Modeled `ringOpacity` as a `number` field (min 0/max 1, step 0.05) rather than a preset `select` — simpler admin UX for the same 0–1 range, no schema/behavior risk, left to Claude's discretion per 33-CONTEXT.md.

**Files:**
- `src/blocks/Hero/config.ts` (edited)
- `src/blocks/Hero/Component.tsx` (edited)
- `src/blocks/LocalProofSection/config.ts` (new)
- `src/blocks/LocalProofSection/Component.tsx` (new)
- `src/blocks/blockRegistry.tsx` (edited)
- `src/collections/Pages/index.ts` (edited)
- `src/payload-types.ts` (regenerated)
- `src/migrations/20260714_023126_phase33_local_landing_components.ts` + `.json` (new, applied)
- `scripts/phase33-test-page-create.ts` / `scripts/phase33-test-page-cleanup.ts` (new, reusable test fixtures)
