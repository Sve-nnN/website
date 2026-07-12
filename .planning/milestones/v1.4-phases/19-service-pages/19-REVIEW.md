---
phase: 19-service-pages
reviewed: 2026-07-12T20:27:51Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/lib/services-data.ts
  - scripts/seed-phase19-data/types.ts
  - src/lib/sitemap-data.ts
  - src/app/(frontend)/[locale]/services/page.tsx
  - src/app/(frontend)/[locale]/servicios/page.tsx
  - src/app/(frontend)/[locale]/services/[slug]/page.tsx
  - src/app/(frontend)/[locale]/servicios/[slug]/page.tsx
  - scripts/seed-phase19-data/group-a.ts
  - scripts/seed-phase19-data/group-b.ts
  - scripts/seed-phase19-service-pages.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 19: Code Review Report

**Reviewed:** 2026-07-12T20:27:51Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewé los 10 archivos nuevos/modificados de la Fase 19 (Service Pages) contra los 5 planes (`19-01` a `19-05`) y el `19-CONTEXT.md`. La capa de routing, el allowlist de slugs (`isServiceSlug` antes de cualquier `payload.find`), la disciplina de un solo `<h1>` por página (delegado al Hero block), la ausencia de precios en el copy, y la deduplicación de los 4 slugs como fuente única de verdad (`src/lib/services-data.ts`) están todos correctamente implementados y verificados de forma independiente (no solo confiando en lo reportado). `npx tsc --noEmit` corre limpio, confirmado.

El hallazgo crítico es una corrupción de contenido bilingüe: el bloque `CallToAction` de Payload (`src/blocks/CallToAction/config.ts`, preexistente, no modificado por esta fase) tiene el campo `richText` **sin `localized: true`**, a diferencia de `Hero.title/subtitle`, `Content.columns[].richText`, `FAQ.title/faqs[].question/answer` y `link.label`, que sí lo tienen. El seed script (`scripts/seed-phase19-service-pages.ts`) escribe un `ctaText` distinto por locale en ese campo compartido, así que la segunda escritura del loop (`en`) pisa el valor de `es` — las 5 páginas nuevas (10 URLs, ambos segmentos) terminarán mostrando el CTA final en inglés también en las rutas en español. Esto contradice directamente el `must_have` explícito de 19-05 ("...populated with real bilingual copy, in both es and en") y el requisito de paridad bilingüe de CLAUDE.md.

También noté que este mismo defecto (campo no localizado + texto distinto por locale) ya existe en `scripts/seed-home-page.ts` para el CallToAction de Home — no es nuevo de esta fase, pero la Fase 19 lo replica en 5 páginas adicionales en vez de detectarlo, pese a que el propio script documenta correctamente (en el mismo comentario) la disciplina de reuse de ids "porque el layout no es localizado, solo campos anidados específicos lo son" — la observación está ahí pero no se aplicó al campo `richText` de `CallToAction`.

## Critical Issues

### CR-01: CallToAction final CTA text collapses to a single locale on all 5 new service pages

**File:** `scripts/seed-phase19-service-pages.ts:127-131` (writes `copy.ctaText` into `CallToActionBlock.richText`)
**Also affects:** `src/blocks/CallToAction/config.ts:15-29` (root cause: `richText` field missing `localized: true`)

**Issue:** `CallToAction.richText` (`src/blocks/CallToAction/config.ts`) is declared without `localized: true`:

```ts
{
  name: 'richText',
  type: 'richText',
  editor: lexicalEditor({ ... }),
  label: false,
},
```

Compare with the FAQ block's fields, which are explicitly localized (`src/blocks/FAQ/config.ts:11,23,29`), and the Content block's `richText`, which was fixed for exactly this reason in a prior phase (`src/blocks/Content/config.ts:40-44`, comment references "Rule 1 bug fix (05-12)").

`upsertPage()` in `scripts/seed-phase19-service-pages.ts:259-272` iterates `LOCALES = ['es', 'en']` and calls `buildServiceLayout(copy, locale)` / `buildIndexLayout(copy, locale)` for each locale, each producing a `CallToAction` block whose `richText` is built from `copy.ctaText` — a value that legitimately differs between `es` and `en` in `group-a.ts`/`group-b.ts` (e.g. `'Si sospechás que tenés un problema técnico...'` vs `"If you suspect there's a technical problem..."`). Because the underlying field is not localized, Payload stores a single shared value for `richText` regardless of the `locale` param passed to `payload.update`. The loop writes `es` first, then `en` — the `en` write silently overwrites the `es` value. Net result after the seed script runs: **all 5 new `pages` docs show the English final-CTA paragraph on both `/servicios/*` (es) and `/services/*` (en) routes.**

This directly breaks:
- 19-05's own `must_haves.truths`: "Visiting /servicios/{slug} and /services/{slug} for all 4 real slugs shows H1 -> problema -> qué incluye -> cómo trabajo -> FAQ -> CTA final, populated with real bilingual copy, **in both es and en**"
- Root `CLAUDE.md`'s bilingual EN/ES content parity requirement

**Fix:** Add `localized: true` to `CallToAction.richText` in `src/blocks/CallToAction/config.ts` (mirrors the fix already applied to `Content.columns[].richText`):

```ts
{
  name: 'richText',
  type: 'richText',
  localized: true, // fixes CR-01 — richText was shared across locales, causing last-locale-write to win
  editor: lexicalEditor({ ... }),
  label: false,
},
```

After adding this, re-run `scripts/seed-phase19-service-pages.ts` (idempotent) so both locale writes land in their own localized slot instead of one clobbering the other. Note this also silently affects `scripts/seed-home-page.ts`'s Home page CTA (`'¿Listo para trabajar juntos?'` vs `'Ready to work together?'`) — worth a follow-up re-seed of Home too once the field is fixed, though that file is outside this phase's file list.

## Warnings

### WR-01: Index page's service links always point at the `/services/` (EN) segment, even from the `/servicios` (ES) page

**File:** `scripts/seed-phase19-service-pages.ts:151` (`buildIndexLayout`)
**Issue:** `buildIndexLayout(copy, locale)` hardcodes `url: \`/services/${s.slug}\`` for every "Ver más"/"Learn more" card link, regardless of `locale`. A Spanish-speaking visitor on `/servicios` who clicks through lands on `/services/{slug}` (English URL segment) instead of `/servicios/{slug}`. Functionally this still resolves (both segments work under either locale param per D-02), but it's an internal-linking inconsistency on a phase whose whole purpose is to demonstrate "SEO impecable" per the project's Core Value — internal links should match the visited locale's canonical URL convention. It also creates a second discoverable path to the same content that diverges from what `sitemap.xml` advertises for the `es` locale (`/servicios/{slug}`, per `src/lib/sitemap-data.ts`), which is exactly the kind of inconsistent internal signal that can dilute a page's perceived canonical URL for crawlers, particularly since no `rel=canonical` is set anywhere in this route tree (see WR-02).
**Fix:**
```ts
function buildIndexLayout(copy: IndexPageCopy, locale: Locale): Record<string, unknown>[] {
  const segment = locale === 'es' ? 'servicios' : 'services'
  return [
    /* ... */
    {
      blockType: 'content',
      columns: copy.services.map((s) => ({
        size: 'half',
        richText: lexicalWithHeading(s.name, [s.description]),
        enableLink: true,
        link: {
          type: 'custom',
          url: `/${segment}/${s.slug}`,
          label: locale === 'es' ? 'Ver más' : 'Learn more',
          appearance: 'default',
        },
      })),
    },
    /* ... */
  ]
}
```

### WR-02: No canonical URL set on the 4 new dual-segment routes, compounding the duplicate-content risk from D-02

**File:** `src/app/(frontend)/[locale]/services/page.tsx`, `servicios/page.tsx`, `services/[slug]/page.tsx`, `servicios/[slug]/page.tsx`
**Issue:** By design (D-02), the same `pages` doc is servable at both `/servicios/{slug}` and `/services/{slug}` under either `[locale]` value — i.e., up to 4 URLs can render byte-identical content for one service page. None of the 4 route files' `generateMetadata` sets `alternates: { canonical: ... }`, so search engines have no explicit signal about which of the (up to) 4 URLs is authoritative. This is a pre-existing gap in the codebase's `generateMetadata` conventions (case-studies/privacy/contact don't set it either), so it isn't a regression introduced by this phase, but Phase 19 is the first place in the codebase that actually creates genuine same-content-multiple-URL duplication (every other route in the app has exactly one reachable URL). Given the project's stated Core Value is "rendimiento y SEO impecables," shipping duplicate-content URLs with zero canonical signal on the phase explicitly about showcasing SEO expertise is a real (if inherited) gap.
**Fix:** Add `alternates: { canonical: locale === 'es' ? `${SITE_URL}/servicios/${slug}` : `${SITE_URL}/en/services/${slug}` }` (mirroring `sitemap-data.ts`'s URL construction) to each route's `generateMetadata`. Could be centralized as a helper in `src/lib/services-data.ts` to avoid drift across the 4 files.

### WR-03: `upsertPage` performs a redundant no-op `es` write on every run

**File:** `scripts/seed-phase19-service-pages.ts:259-272`
**Issue:** After `payload.create({ locale: 'es', ... })`, the `for (const locale of LOCALES)` loop immediately re-runs `payload.update` for `es` with content that reproduces exactly what `create` just wrote (as the code's own comment acknowledges: "This makes the 'es' pass in this loop a no-op content-wise the first time"). This is deliberate per the 19-05 plan for simplicity, and not a correctness bug, but it does mean every seed run performs 2 extra DB round-trips per page (10 total across 5 docs) for zero effect, and it slightly obscures the "created vs. updated" log semantics (a fresh doc logs `Created` and then immediately also silently re-updates `es`). Low priority, but worth a comment clarifying this is intentional-but-wasteful, or special-casing "skip es on the same run as create."
**Fix:** Optional — skip the `es` iteration in the loop when `docs.length === 0` (i.e., this run just created the doc):
```ts
for (const locale of LOCALES) {
  if (docs.length === 0 && locale === 'es') continue // create() already wrote es
  /* ... */
}
```

## Info

### IN-01: `content: { layout: buildLayout(locale) as never }` bypasses type-checking on the block payload

**File:** `scripts/seed-phase19-service-pages.ts:246, 269`
**Issue:** The `as never` cast silences TypeScript entirely for the block array being written to Payload's Local API. This mirrors an existing pattern in `scripts/seed-home-page.ts` (`as any` there), so it's consistent with the codebase's established seed-script convention rather than a new problem, but it does mean a typo in a block field name (e.g. `blockType: 'callToAction'` vs the generated `CallToActionBlock` interface) would not be caught by `tsc --noEmit` — only by a runtime Payload validation error during the actual seed run. Since `npx tsc --noEmit` passing was one of this review's explicit checks, worth flagging that it doesn't fully cover this file's actual write payload.
**Fix:** Non-blocking. If tightened later, import the generated block interfaces from `src/payload-types.ts` (`HeroBlock`, `ContentBlock`, `FAQBlock`, `CallToActionBlock`) and type `buildServiceLayout`/`buildIndexLayout`'s return value as a union of those instead of `Record<string, unknown>[]`.

### IN-02: No `.planning/phases/19-service-pages/19-0X-SUMMARY.md` artifacts present for any of the 5 plans

**File:** `.planning/phases/19-service-pages/` (directory listing)
**Issue:** All 5 plans (`19-01` through `19-05`) require a `SUMMARY.md` output per their `<output>` sections, and 19-05's Task 2 is gated (`gate="blocking"`) on actually running the seed script against the dev DB and curl-verifying all 10 URL combinations. No summary files exist in the phase directory at review time, so there's no artifact confirming Task 2's live verification (seed run, idempotency re-run, curl 200/404 checks, sitemap check) was actually performed — only that the code compiles. This doesn't invalidate the code itself, but it means the "verified against live data" claims in the plans (and the prompt that spawned this review) can't be corroborated from repo state alone. Note this finding also correlates with CR-01: if Task 2's curl checks (which only check HTTP status codes, not per-locale copy diffing beyond "hero title differs for 2 of 4 slugs") had been run, they would not have caught the CTA-text collapse described in CR-01, since that check only asserts hero-title divergence, not CTA-text divergence.
**Fix:** Re-run the seed script's Task 2 verification (including a manual check that the final CTA paragraph text actually differs between `/servicios/{slug}` and `/services/{slug}` for at least one slug) after applying CR-01's fix, and generate the missing SUMMARY.md artifacts per the standard workflow.

---

_Reviewed: 2026-07-12T20:27:51Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
