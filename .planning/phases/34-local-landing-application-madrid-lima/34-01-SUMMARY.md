# Phase 34 Plan 01 Summary: Apply Local Landing Components to Madrid/Lima

**Status:** Complete (LOCAL-03/LOCAL-04 fully done; LOCAL-05 structurally complete, content-pending — see placeholder table below)

Converted both live pages' existing `hero` block (index 0) from `variant: 'listing'` to `variant: 'local-landing'` via `scripts/phase34-apply-local-landing.ts`, keeping each page's real, already-correct `title`/`subtitle` untouched. Madrid: ring right, opacity 0.25, single primary CTA ("Conversar sobre tu proyecto" / "Talk about your project" -> `/contact`, real copy matching the site's existing CTA convention from `scripts/seed-phase20-data/copy.ts`). Lima: ring mirrored (`flipX`) left, opacity 0.35, CTA row with that same primary button plus a real outline secondary button ("Ver casos en Lima" / "See Lima case studies" -> `/case-studies`, a real existing route). Inserted a new `LocalProofSection` block right after the hero on both pages, before the existing `content`/`faq`/`callToAction` blocks (all left untouched).

Lima's `inlineStat` and 1 of its 3 `LocalProofSection` stats use the real, already-established 2025 DinoRANK/Arianna Lupi "SEO + AI" workshop fact (18 attendees) — not a placeholder. Everything else (Madrid's inline stat, both cities' remaining 2 stats each, both cities' testimonial name/business/quote) has no real source yet, per Juan's explicit authorization to proceed with clearly-marked placeholder content pending real Google Search Console client data. Every placeholder value is prefixed with the literal string `[PLACEHOLDER]`.

Applied via the Payload Local API against the real Neon DB (additive content update, no schema change) — wrote locale `es` first, re-fetched to capture Payload-assigned array-row ids, reapplied them (generic recursive `applyIds()` helper, generalizing `seed-phase20-geo-pages.ts`'s `reapplyIds()`) before writing locale `en`, avoiding duplicate rows.

Functional-tested against a real `next dev` server (port 3457): all 4 routes (`/seo-tecnico-madrid`, `/en/seo-tecnico-madrid`, `/seo-tecnico-lima`, `/en/seo-tecnico-lima`) returned 200, exactly 1 `<h1>` each (matches Phase 32 baseline exactly, same titles), correct per-city ring `opacity`/`transform` (`opacity:0.25;transform:translateY(-50%)` on Madrid, `opacity:0.35;transform:translateY(-50%) scaleX(-1)` on Lima), correct city badges, correct CTA labels/hrefs (`/contact` on both, `/case-studies` only on Lima's outline button), `[PLACEHOLDER]` markers present and grep-able in rendered HTML (22 occurrences combined across Madrid's 2 locale pages, 15 across Lima's), zero server errors in the dev log. Dev server killed after.

**Deviations:** None from the plan.

## Placeholder Content Table (LOCAL-05 — real data pending from Juan)

| Page | Locale | Field path | Current placeholder value |
|------|--------|-----------|---------------------------|
| seo-tecnico-madrid | es | `hero.inlineStat` | `[PLACEHOLDER] Estadistica real pendiente — reemplazar antes de publicar` |
| seo-tecnico-madrid | en | `hero.inlineStat` | `[PLACEHOLDER] Real stat pending — replace before publishing` |
| seo-tecnico-madrid | es | `localProofSection.stats[0].label` | `[PLACEHOLDER] Reemplazar con dato real (clientes en Espana)` (value: `0`) |
| seo-tecnico-madrid | en | `localProofSection.stats[0].label` | `[PLACEHOLDER] Replace with real data (clients in Spain)` (value: `0`) |
| seo-tecnico-madrid | es | `localProofSection.stats[1].label` | `[PLACEHOLDER] Reemplazar con dato real (proyectos en Espana)` (value: `0`) |
| seo-tecnico-madrid | en | `localProofSection.stats[1].label` | `[PLACEHOLDER] Replace with real data (projects in Spain)` (value: `0`) |
| seo-tecnico-madrid | es | `localProofSection.stats[2].label` | `[PLACEHOLDER] Reemplazar con dato real (keywords investigadas)` (value: `0`) |
| seo-tecnico-madrid | en | `localProofSection.stats[2].label` | `[PLACEHOLDER] Replace with real data (keywords researched)` (value: `0`) |
| seo-tecnico-madrid | es | `localProofSection.testimonial.quote` | `[PLACEHOLDER] Testimonio real pendiente — reemplazar antes de publicar.` |
| seo-tecnico-madrid | en | `localProofSection.testimonial.quote` | `[PLACEHOLDER] Real testimonial pending — replace before publishing.` |
| seo-tecnico-madrid | es+en (not localized) | `localProofSection.testimonial.authorName` | `[PLACEHOLDER] Nombre pendiente / Name pending` |
| seo-tecnico-madrid | es | `localProofSection.testimonial.authorBusiness` | `[PLACEHOLDER] Negocio pendiente` |
| seo-tecnico-madrid | en | `localProofSection.testimonial.authorBusiness` | `[PLACEHOLDER] Business pending` |
| seo-tecnico-lima | es | `localProofSection.stats[1].label` | `[PLACEHOLDER] Reemplazar con dato real (clientes en Lima)` (value: `0`) |
| seo-tecnico-lima | en | `localProofSection.stats[1].label` | `[PLACEHOLDER] Replace with real data (clients in Lima)` (value: `0`) |
| seo-tecnico-lima | es | `localProofSection.stats[2].label` | `[PLACEHOLDER] Reemplazar con dato real (proyectos en Lima)` (value: `0`) |
| seo-tecnico-lima | en | `localProofSection.stats[2].label` | `[PLACEHOLDER] Replace with real data (projects in Lima)` (value: `0`) |
| seo-tecnico-lima | es | `localProofSection.testimonial.quote` | `[PLACEHOLDER] Testimonio real pendiente — reemplazar antes de publicar.` |
| seo-tecnico-lima | en | `localProofSection.testimonial.quote` | `[PLACEHOLDER] Real testimonial pending — replace before publishing.` |
| seo-tecnico-lima | es+en (not localized) | `localProofSection.testimonial.authorName` | `[PLACEHOLDER] Nombre pendiente / Name pending` |
| seo-tecnico-lima | es | `localProofSection.testimonial.authorBusiness` | `[PLACEHOLDER] Negocio pendiente` |
| seo-tecnico-lima | en | `localProofSection.testimonial.authorBusiness` | `[PLACEHOLDER] Business pending` |

**NOT placeholder (real content, safe to keep)**: `seo-tecnico-lima` `hero.inlineStat` (`+18 asistentes en el taller SEO + IA 2025 (con Arianna Lupi)` / `+18 attendees at the 2025 SEO + AI workshop (with Arianna Lupi)`) and `localProofSection.stats[0]` (value `18`, label referencing the same real 2025 workshop) — sourced from the already-established DinoRANK/Arianna Lupi fact. All CTA copy/hrefs on both pages are real (site-wide convention), not placeholders.

**To replace later**: once Juan supplies real client counts/case data and a real (or anonymized-but-real) local testimonial per city, update the fields above directly in `/admin` (each is a plain admin-editable field on the `localProofSection` block / `hero` block), or write a small follow-up Local API script targeting the same field paths. `grep -r "\[PLACEHOLDER\]"` across a DB export or `payload.find()` output will find all 22 occurrences.

**Files:**
- `scripts/phase34-inspect-pages.ts` (new, read-only helper, left in repo)
- `scripts/phase34-apply-local-landing.ts` (new, one-off apply script, left in repo)
- Payload `pages` collection docs `seo-tecnico-madrid` (id 12) and `seo-tecnico-lima` (id 11), both locales — content updated via Local API, no code/schema files changed this phase (Phase 33 already shipped the schema).
