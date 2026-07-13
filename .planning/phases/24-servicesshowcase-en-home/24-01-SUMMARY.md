---
phase: 24-servicesshowcase-en-home
plan: 01
subsystem: frontend-blocks
tags: [payload-block, home, services, i18n, migration]
requires: []
provides:
  - ServicesShowcase Payload block (config + Component)
  - Home layout populated with servicesShowcase instance (es/en)
affects:
  - src/collections/Pages/index.ts
  - src/blocks/RenderBlocks.tsx
  - Home page rendering (/, /en)
tech-stack:
  added: []
  patterns:
    - "Fixed-set showcase block reads live from SERVICE_SLUGS/getServicePage instead of a curated Payload relation"
    - "Icon selection via a hardcoded slug->icon map colocated in the block Component, sourced from ICON_OPTIONS values"
key-files:
  created:
    - src/blocks/ServicesShowcase/config.ts
    - src/blocks/ServicesShowcase/Component.tsx
    - src/migrations/20260713_005924.ts
    - scripts/seed-phase24-services-showcase.ts
  modified:
    - src/collections/Pages/index.ts
    - src/blocks/RenderBlocks.tsx
    - messages/en.json
    - messages/es.json
    - src/payload-types.ts
    - src/migrations/index.ts
decisions:
  - "Section title copy: 'Cómo puedo ayudarte' (es) / 'How I can help' (en) — real grounded sentences per UI-SPEC's Copywriting Contract, seeded via script, not hardcoded in the block"
  - "Card CTA label sourced from next-intl messages (servicesShowcase.cta), not a Payload field — consistent across all 4 cards"
metrics:
  duration: "~25 min"
  completed: "2026-07-13"
---

# Phase 24 Plan 01: ServicesShowcase en Home Summary

Added a new, purely-additive `ServicesShowcase` Payload block that renders the 4 fixed service pages (read live from `SERVICE_SLUGS`) as a 2x2 card grid on Home, in both locales, per `24-UI-SPEC.md`.

## What Was Built

**Task 1 — Block + additive Payload registration:**
- `src/blocks/ServicesShowcase/config.ts`: `Block` with `slug: 'servicesShowcase'`, `interfaceName: 'ServicesShowcaseBlock'`, a single localized `title` text field (section heading only — card content is entirely derived, not editable per-block).
- `src/blocks/ServicesShowcase/Component.tsx`: server component that fetches all 4 `SERVICE_SLUGS` pages in parallel via `getServicePage(locale, slug)`, filters out any unresolved card (`.filter(Boolean)`), and returns `null` if all 4 fail to resolve. Renders the exact `24-UI-SPEC.md` markup: `Container py-12` > conditional `h2` title > `grid grid-cols-1 sm:grid-cols-2 gap-6` of 4 full-bleed `<Link>`-wrapped `Card`s, each with an icon badge (`seo-technical-audit`→Search, `seo-consulting`→TrendingUp, `fullstack-development`→Code, `ai-seo-geo`→Sparkles, fallback Code), `page.title`, optional `page.meta?.description` excerpt (`line-clamp-2`), and a CTA row using the `next-intl` `servicesShowcase.cta` message key.
- Local `buildServiceHref(locale, slug)` helper: `/servicios/{slug}` for `es`, `/en/services/{slug}` for `en` — a 2-line reimplementation of the dual-segment convention rather than importing `canonical.ts`/`breadcrumbs.ts` (avoids pulling in their DB-touching dependencies).
- Registered additively: `ServicesShowcase` appended as the last entry in `Pages`' `blocks` array and `servicesShowcase: ServicesShowcaseComponent` appended as the last entry in `RenderBlocks`' `blockComponents` map — `git diff` on both files shows only added lines, zero existing lines touched.
- Added `servicesShowcase.cta` message key to `messages/en.json` (`"Explore service"`) and `messages/es.json` (`"Explorar servicio"`).
- Ran `payload generate:importmap` (no new admin components, no-op) and `payload generate:types` (added `ServicesShowcaseBlock`/`ServicesShowcaseBlockSelect` to `payload-types.ts`). `npx tsc --noEmit` exits 0.

**Task 2 — Schema migration (additive only):**
- `npx payload migrate:create` generated `src/migrations/20260713_005924.ts`. Read before applying: contains only `CREATE TABLE` (4 new tables: `pages_blocks_services_showcase`, `pages_blocks_services_showcase_locales`, `_pages_v_blocks_services_showcase`, `_pages_v_blocks_services_showcase_locales`), `ALTER TABLE ... ADD CONSTRAINT` (new FKs referencing existing `pages`/`_pages_v` id columns, not altering them), and `CREATE INDEX` statements — zero `DROP`, zero `ALTER COLUMN` on any pre-existing table.
- Confirmed additive per the relaxed Database Safety rule — ran `npx payload migrate` directly against the real Neon Postgres. Completed with no errors (`Migrated: 20260713_005924 (480ms)`).
- `src/migrations/index.ts` diff shows only a new import + a new array entry appended — no existing migration entry modified.

**Task 3 — Seed Home's layout + live verification:**
- `scripts/seed-phase24-services-showcase.ts`: idempotent, follows the `content.layout` id-reuse-across-locale-writes discipline from `seed-phase13-home-content.ts` (fresh `findByID({ locale })` fetch per locale, `blockType === 'servicesShowcase'` lookup, reused server-assigned `id` across the second locale's write).
- Seeded real bilingual section title copy: `"Cómo puedo ayudarte"` (es) / `"How I can help"` (en).
- Ran against the real production Neon Postgres (normal additive `update()` write, no confirmation needed per the relaxed rule).
- Re-ran the script a second time to confirm idempotency: verified directly against the DB via `findByID` that both locales still have exactly 1 `servicesShowcase` block, same reused `id` (`6a5438bbff1e2bfe712833ba`), correct localized `title` in each.
- Live curl verification against the running dev server:
  - `curl -s http://localhost:3000/ | grep -oc 'href="/servicios/[a-z-]*"'` → `4` (unique: `ai-seo-geo`, `fullstack-development`, `seo-consulting`, `seo-technical-audit`)
  - `curl -s http://localhost:3000/en | grep -oc 'href="/en/services/[a-z-]*"'` → `4` (same 4 slugs, `/en/services/` prefix)
  - All 4 `/servicios/{slug}` URLs and all 4 `/en/services/{slug}` URLs individually return HTTP `200`
  - Section title string present in both rendered pages (`grep -c` = 1 each)
  - Rendered `<h3>` card titles confirmed as the 4 real, distinct service page titles per locale (e.g. es: "Auditoría SEO Técnica", "Consultoría SEO", "Desarrollo Full-Stack con SEO integrado", "SEO para IA / GEO"; en: "Technical SEO Audit", "SEO Consulting", "Full-Stack Development with SEO Built In", "AI SEO / GEO") — confirms card copy is driven by `page.title`, not hardcoded per-instance
  - `grep -rn "Servicios\|Services" src/blocks/ServicesShowcase/Component.tsx` shows no hardcoded per-card copy — only type-name/import matches

## Deviations from Plan

None — plan executed exactly as written.

## Requirements Closed

- **SVCHOME-01**: Home shows a `ServicesShowcase` block with 4 cards in both `/` (es) and `/en` — verified live.
- **SVCHOME-02**: Cards driven by `SERVICE_SLUGS`/`getServicePage`, not hardcoded; each links to the correct locale-appropriate landing — verified live, all 8 URLs return 200.
- **SVCHOME-03**: Registration is 100% additive — confirmed via `git diff` (zero removed/modified lines in `Pages`/`RenderBlocks`) and migration SQL review (additive-only, applied cleanly).

## Self-Check: PASSED

Verified files exist:
```
FOUND: src/blocks/ServicesShowcase/config.ts
FOUND: src/blocks/ServicesShowcase/Component.tsx
FOUND: src/migrations/20260713_005924.ts
FOUND: scripts/seed-phase24-services-showcase.ts
```

Verified commits exist:
```
2ce4c78 feat(24-01): add ServicesShowcase block, additive registration
4217b2a feat(24-01): add migration for servicesShowcase block tables
5a1910a feat(24-01): seed Home with servicesShowcase block (es+en)
```
