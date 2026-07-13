---
phase: 23-canonical-hreflang-hardening
reviewed: 2026-07-12T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/lib/canonical.ts
  - "src/app/(frontend)/[locale]/layout.tsx"
  - "src/app/(frontend)/[locale]/servicios/page.tsx"
  - "src/app/(frontend)/[locale]/servicios/[slug]/page.tsx"
  - "src/app/(frontend)/[locale]/services/page.tsx"
  - "src/app/(frontend)/[locale]/services/[slug]/page.tsx"
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-07-12
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found (no blockers — findings are minor/hardening notes)

## Summary

Reviewed the shared canonical/hreflang helper (`src/lib/canonical.ts`), the sitewide `metadataBase` wiring in `[locale]/layout.tsx`, and all 4 Servicios `generateMetadata` call sites (`servicios/page.tsx`, `servicios/[slug]/page.tsx`, `services/page.tsx`, `services/[slug]/page.tsx`) against the plan (`23-01-PLAN.md`) and its must-haves.

Traced the canonical-collapse logic for all 4 physical URL combinations by hand against `routing.ts` (`localePrefix: 'as-needed'`, `defaultLocale: 'es'`) and `middleware.ts`: unprefixed paths always resolve to `locale='es'` internally, and `[locale]` route segments are only ever `'es'` or `'en'` by construction of next-intl's matcher, so the two "wrong combo" URLs (`/services`, `/en/servicios`) can only ever be reached with a `locale` value that is already one of `'es'|'en'` — confirming the `locale as 'es' | 'en'` cast in each page.tsx (pre-existing pattern, not introduced by this phase) is safe in practice, and confirming the canonical-collapse logic is correct: `targetPath = locale === 'es' ? esPath : enPath` computed purely from `locale`, never from which route folder rendered the page, exactly matching the plan's mandated mechanism. Cross-checked this against the live curl evidence recorded in `23-01-SUMMARY.md` — all 6 combos match hand-traced expected output.

`SERVICE_SLUGS` allowlist in `services-data.ts` (`isServiceSlug`) gates `getServicePage()` before any `doc.slug` ever reaches `buildServiceAlternates`, so the slug-interpolation threat (T-23-01) is correctly mitigated as claimed — no unvalidated user input reaches the emitted `<link>` hrefs.

`metadataBase` is defined exactly once repo-wide (verified via `grep -rn "metadataBase" src/app`), and `canonical.ts` has zero literal `getPayload`/`@payload-config` references (verified via grep, matching the plan's acceptance criteria). `npx tsc --noEmit` is clean.

No Critical issues found. One Warning and two Info-level notes below, none of which block shipping this phase — they are hardening opportunities for future work.

## Warnings

### WR-01: `canonical.ts` is not actually a "pure, no-DB-import" module at the bundle level — it transitively pulls in Payload/DB code via `sitemap-data.ts`

**File:** `src/lib/canonical.ts:14`
**Issue:** `canonical.ts` imports `SITE_URL` from `@/lib/sitemap-data`, and `sitemap-data.ts` itself has top-level `import { getPayload } from 'payload'` and `import config from '@payload-config'` (used inside `getSitemapEntries()`, not at module-init time — no DB call actually fires just from importing `canonical.ts`). Functionally this is safe today because every consumer is a server-only `generateMetadata` function. But the plan's "pure module, zero DB/Payload import" framing (and the doc comment in `canonical.ts` line 2: "no Payload/DB access") is only true of the file's own source text, not its transitive closure — the grep-based acceptance check (`grep -c "getPayload|@payload-config" src/lib/canonical.ts`) passes literally but doesn't catch this. If `canonical.ts` is ever imported from a Client Component (an easy mistake given the file has no `'use server'`/`'server-only'` marker), the whole Payload/DB dependency tree would attempt to bundle into client JS.
**Fix:** Add `import 'server-only'` at the top of `canonical.ts` (and consider doing the same in `sitemap-data.ts` and `breadcrumbs.ts`, which share this exact same transitive-import shape) so a client-side import fails at build time with a clear error instead of silently bundling server code or breaking at runtime.
```typescript
import 'server-only'
import type { Metadata } from 'next'

import { SITE_URL } from '@/lib/sitemap-data'
```

## Info

### IN-01: `SITE_URL` + path concatenation has no trailing-slash guard — pre-existing pattern, latent double-slash risk if `NEXT_PUBLIC_SERVER_URL` is ever set with a trailing slash

**File:** `src/lib/canonical.ts:41,43-45`
**Issue:** `canonical: \`${SITE_URL}${targetPath}\`` assumes `SITE_URL` never ends in `/`. `resolveSiteUrl()` in `sitemap-data.ts` does not strip a trailing slash from `process.env.NEXT_PUBLIC_SERVER_URL`, so a misconfigured env var (e.g. `https://juancarlosangulo.com/`) would produce canonical/hreflang URLs like `https://juancarlosangulo.com//servicios`. This is a pre-existing risk shared with `sitemap-data.ts`'s own URL-building (`getSitemapEntries()`) and `breadcrumbs.ts`, not introduced by this phase, so it's informational rather than a new defect — but this phase is a good opportunity to close it since it's now duplicated a third time.
**Fix:** Normalize once at the source, e.g. in `resolveSiteUrl()`: `return envUrl.replace(/\/+$/, '')` before returning, so every consumer downstream is guaranteed a slash-free base.

### IN-02: `locale` param is cast with `as 'es' | 'en'` without runtime validation in all 4 page.tsx files

**File:** `src/app/(frontend)/[locale]/servicios/page.tsx:20`, `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx:28`, `src/app/(frontend)/[locale]/services/page.tsx:20`, `src/app/(frontend)/[locale]/services/[slug]/page.tsx:28`
**Issue:** `buildServiceAlternates(locale as 'es' | 'en', ...)` trusts the cast rather than validating against `routing.locales`. Traced this against `middleware.ts`/`routing.ts` and confirmed it's currently unreachable with an invalid value (next-intl's matcher constrains `[locale]` to `'es'|'en'`, and `layout.tsx`'s `hasLocale()` check also guards the render path) — so this is not a live bug today. It is, however, the exact same unchecked-cast pattern already present pre-phase in `getPage()`/`buildTrail()` calls in these same files, now applied a second time per file for `buildServiceAlternates`. If the locale routing config ever changes (e.g. a third locale is added) this cast would silently produce an `en`-shaped canonical for a locale that is neither `es` nor `en`, since `buildServiceAlternates`'s internal branch is a binary `locale === 'es' ? esPath : enPath` with no explicit rejection of unrecognized values.
**Fix:** Not blocking for this phase (matches established codebase convention), but worth a follow-up: either a shared `isSupportedLocale(locale): locale is Locale` guard reused across `getPage`, `buildTrail`, and `buildServiceAlternates`, or leave as-is and track as tech debt if a third locale is ever planned.

---

_Reviewed: 2026-07-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
