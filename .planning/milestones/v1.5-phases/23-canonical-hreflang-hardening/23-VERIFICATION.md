---
phase: 23-canonical-hreflang-hardening
verified: 2026-07-12T20:15:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
---

# Phase 23: Canonical + hreflang hardening Verification Report

**Phase Goal:** Las 4 combinaciones de URL de servicio emiten canonical/hreflang correctos, metadataBase sitewide.
**Verified:** 2026-07-12T20:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visiting `/servicios` (es, self-referencing) returns canonical pointing at itself | ✓ VERIFIED | Live curl against a fresh dev server (port 3001, current code confirmed by re-checking source): `<link rel="canonical" href="http://localhost:3000/servicios"/>` |
| 2 | Visiting `/en/services` (en, self-referencing) returns canonical pointing at itself | ✓ VERIFIED | `<link rel="canonical" href="http://localhost:3000/en/services"/>` |
| 3 | "Wrong" combos (`/services` unprefixed, `/en/servicios`) return canonical pointing at the locale-correct segment, not self | ✓ VERIFIED | `/services` → canonical `.../servicios`; `/en/servicios` → canonical `.../en/services` — both re-derived live, matching SUMMARY claim |
| 4 | All 4 service landing slugs emit reciprocal hreflang (es/en/x-default), verified on at least one slug on both locales | ✓ VERIFIED | `/servicios/seo-consulting` and `/en/services/seo-consulting` both emit exactly 3 hreflang `<link>` tags (es, en, x-default) plus 1 canonical, re-derived live |
| 5 | `metadataBase` is defined exactly once, in the frontend root layout, never redefined in any page.tsx | ✓ VERIFIED | `grep -rn "metadataBase" "src/app/(frontend)"` returns exactly 1 match: `[locale]/layout.tsx:18` |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/canonical.ts` | Pure helper `buildServiceAlternates(locale, current?)`, zero Payload/DB imports | ✓ VERIFIED | Exists, exports `buildServiceAlternates`, imports `SITE_URL` from `@/lib/sitemap-data`, `grep -c "getPayload\|@payload-config"` = 0. Canonical computed purely from `locale` arg (not route folder), confirmed by reading implementation. |
| `src/app/(frontend)/[locale]/layout.tsx` | Sitewide `metadataBase`, set once | ✓ VERIFIED | `export const metadata: Metadata = { metadataBase: new URL(SITE_URL) }` present exactly once, static (correct choice since no locale dependency) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `servicios/page.tsx` | `src/lib/canonical.ts` | `generateMetadata` calling `buildServiceAlternates(locale)` | ✓ WIRED | Line 20: `alternates: buildServiceAlternates(locale as 'es' \| 'en')` |
| `servicios/[slug]/page.tsx` | `src/lib/canonical.ts` | `buildServiceAlternates(locale, { slug })` | ✓ WIRED | Line 28: `alternates: buildServiceAlternates(locale as 'es' \| 'en', { slug: doc.slug ?? slug })` |
| `services/page.tsx` | `src/lib/canonical.ts` | same pattern | ✓ WIRED | Line 20, identical shape |
| `services/[slug]/page.tsx` | `src/lib/canonical.ts` | same pattern | ✓ WIRED | Line 28, identical shape |
| `src/lib/canonical.ts` | `src/lib/sitemap-data.ts` | `import { SITE_URL }` | ✓ WIRED | Line 14 of canonical.ts |
| `[locale]/layout.tsx` | `src/lib/sitemap-data.ts` | `new URL(SITE_URL)` | ✓ WIRED | Line 18 of layout.tsx |

### Live Verification (re-derived independently, not trusting SUMMARY)

Both a stale prior-session dev server (port 3001) and a fresh one started for this plan (port 3002) served identical, current output — confirmed by reading `src/app/(frontend)/[locale]/layout.tsx` and `src/lib/canonical.ts` on disk and matching against rendered HTML. Full sweep run against port 3001:

| URL | HTTP | Canonical | hreflang count |
|-----|------|-----------|-----------------|
| `/servicios` | 200 | `http://localhost:3000/servicios` (self) | 3 (es/en/x-default) |
| `/en/services` | 200 | `http://localhost:3000/en/services` (self) | 3 |
| `/services` | 200 | `http://localhost:3000/servicios` (redirected signal — correct) | 3 |
| `/en/servicios` | 200 | `http://localhost:3000/en/services` (redirected signal — correct) | 3 |
| `/servicios/seo-consulting` | 200 | `http://localhost:3000/servicios/seo-consulting` (self) | 3 |
| `/en/services/seo-consulting` | 200 | `http://localhost:3000/en/services/seo-consulting` (self) | 3 |

All 6 match the SUMMARY's claimed evidence exactly. Note `SITE_URL` resolves to the dev fallback `http://localhost:3000` regardless of which port actually served the request (3001/3002) — this is expected per `sitemap-data.ts`'s intentional design (canonical describes public site identity, not the local dev port).

### Anti-Patterns Found

None. No hardcoded URLs in any of the 4 `page.tsx` files — all canonical/hreflang values flow through `buildServiceAlternates`. `npx tsc --noEmit` clean. `git status --short src/migrations/` clean (zero schema changes, consistent with a pure metadata phase).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEOTECH-01 | 23-01-PLAN.md | 4 service URL combos emit `alternates.canonical` via shared helper, no hardcoding | ✓ SATISFIED | Verified live + source read |
| SEOTECH-02 | 23-01-PLAN.md | Every service page emits `alternates.languages` reciprocal hreflang | ✓ SATISFIED | Verified live, 3 hreflang tags per URL |
| SEOTECH-03 | 23-01-PLAN.md | Root layout defines `metadataBase` once, sitewide | ✓ SATISFIED | Single match via grep across entire frontend tree |

No orphaned requirements found for this phase.

### Human Verification Required

None. All truths are observable programmatically (HTTP responses, grep, tsc) and were re-derived independently in this verification, not just read off the SUMMARY.

## Gaps Summary

None. Phase goal achieved: all 4 physical Servicios URL combinations collapse to 2 canonical targets per locale, reciprocal hreflang is emitted correctly, and `metadataBase` is defined exactly once sitewide.

---

_Verified: 2026-07-12T20:15:00Z_
_Verifier: Claude (gsd-verifier)_
