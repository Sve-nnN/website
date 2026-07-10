# Phase 11 Plan 01 — Contrast, Hardcoded-Content & Schema-Drift Report

## 1. WCAG AA contrast (both themes)

Ran `node_modules/.bin/tsx scripts/check-wcag-contrast-full.ts` — 20 checks (10 token pairs x 2 themes: light `:root` and `.dark`).

**Initial run (before fixes): 4 light-theme FAILs, dark theme 10/10 PASS (unchanged from Phase 7).**

| Pair | Theme | Before | Threshold | Result | Fix applied |
|------|-------|--------|-----------|--------|-------------|
| muted-foreground / muted | light | 4.35 | 4.5 | FAIL | `--muted-foreground` oklch L 0.556 -> 0.54 |
| primary-foreground / primary | light | 2.97 | 4.5 | FAIL | `--primary-foreground` `#FAFAF7` -> `#12141C` (dark navy, mirrors the already-verified `.dark` theme's dark-text-on-primary pattern) |
| primary / background | light | 2.97 | 3.0 | FAIL | `--primary` `#FF5B1F` -> `#F7581E` (minor darkening) |
| border / background | light | 1.20 | 3.0 | FAIL | `--border` oklch L 0.922 -> 0.63 |

All 4 were genuine, previously-unchecked regressions: the shadcn-scaffold oklch defaults (`--muted-foreground`, `--border`) were never contrast-verified since scaffold, and the brand `--primary`/`--primary-foreground` pairing in light mode had never been checked against WCAG (only the `.dark` rebrand was checked, by Phase 7's `check-dark-contrast.ts`).

**Final run (after fixes): 20/20 PASS.**

| Pair | Light ratio | Dark ratio | Threshold |
|------|-------------|------------|-----------|
| foreground / background | 17.58 | 17.58 | 4.5 |
| muted-foreground / background | 4.81 | 8.13 | 4.5 |
| muted-foreground / muted | 4.61 | 6.98 | 4.5 |
| card-foreground / card | 17.58 | 15.88 | 4.5 |
| primary-foreground / primary | 5.57 | 7.11 | 4.5 |
| secondary-foreground / secondary | 17.58 | 13.98 | 4.5 |
| accent-foreground / accent | 16.44 | 13.98 | 4.5 |
| destructive / background | 4.62 | 6.64 | 4.5 |
| primary / background | 3.15 | 7.11 | 3.0 |
| border / background | 3.35 | 3.13 | 3.0 |

No component code changes were needed beyond `src/app/globals.css` — every consumer of `--primary`/`--primary-foreground`/`--border`/`--muted-foreground` (`Badge`, `Button`, `ResultsSection`, cards, borders) reads these as Tailwind CSS-variable-backed tokens (`bg-primary text-primary-foreground`, `border-border`), so the token-value fix propagates automatically with zero JSX/TSX edits (confirmed via `grep -rn "primary-foreground\|bg-primary" src/components src/blocks`).

Dark-theme values are byte-identical to Phase 7's verified state — confirmed unchanged, no regression there.

## 2. Hardcoded-content grep (full Phase 7-10 diff)

File list scanned (`git diff --stat 0812dc4..HEAD --name-only -- src/ scripts/`, filtered to `.tsx`/`.ts` content-relevant files):

- `src/app/(frontend)/[locale]/blog/[slug]/page.tsx`
- `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx`
- `src/blocks/Hero/Component.tsx`
- `src/blocks/ResultsSection/Component.tsx`
- `src/components/AuthorCard.tsx`
- `src/components/CaseStudyCard.tsx`
- `src/components/PostCard.tsx`
- `src/components/Prose.tsx`
- `src/components/SiteFooter.tsx`
- `src/components/SiteHeader.tsx`
- `src/components/ui/{avatar,badge,button,card,input,navigation-menu,select,separator,sheet,skeleton,tabs,textarea}.tsx`
- Scripts (`check-*.ts`, `seed-phase10-*.ts`, `cleanup-phase10-*.ts`, `verify-phase10-*.mjs`, `smoke-check-phase8.mjs`) — excluded from the content audit, these are dev tooling, not rendered UI.

**Result: zero genuine hardcoded-content violations.**

One candidate flagged and investigated: `src/components/SiteHeader.tsx:37`, `<span className="font-display text-heading">Juan Carlos Angulo</span>` — a fallback rendered only when `header.logo` (a Payload global field) is absent. Confirmed via `git log -p 0812dc4..HEAD -- src/components/SiteHeader.tsx | grep "Juan Carlos Angulo"` that this line was **not** touched or introduced by any Phase 7-10 commit — it predates this milestone (Phase 5). It is a graceful-degradation fallback (brand name shown only if the CMS-driven logo image is unset), not new hardcoded content introduced in scope for this audit. Left as-is; out of scope for this phase per the scope-boundary rule (pre-existing, not caused by Phase 7-10 changes).

All remaining string literals found across the scanned files were false positives on inspection: shadcn `displayName` assignments (`"CardHeader"`, `"SheetFooter"`, etc.), CVA `variant`/`size` default keys (`"default"`), or Tailwind class-name fragments — none are user-facing content strings.

## 3. Full-milestone-range config/types diff (2e22e9b..HEAD)

Command: `git diff --stat 2e22e9b..HEAD -- 'src/blocks/*/config.ts' src/payload-types.ts`

Output: **empty** (zero lines).

This confirms zero schema/type drift across the entire milestone range — from Phase 5's close (`2e22e9b`) through current HEAD (covering Phases 7, 8, 9, and 10 in one pass), corroborating each phase's own narrower per-phase VERIFICATION.md claims with a single fresh, full-range check.

## Summary

| Check | Result |
|-------|--------|
| WCAG AA contrast (light + dark, 20 checks) | PASS (4 light-theme failures found and fixed) |
| Hardcoded-content grep (Phase 7-10 files) | PASS (0 genuine findings; 1 pre-existing fallback investigated and confirmed out of scope) |
| config.ts/payload-types.ts diff (2e22e9b..HEAD) | PASS (empty diff) |

## Re-verification against final diff (post Phase 10.6-10.8)

This plan originally ran before Phases 10.6, 10.7, and 10.8 executed (see commit order: `46110fb`/`d50a554` predate `2cb09f7`..`675f5ad`). Phase 11's closing pass re-ran both checks against the now-fully-accumulated milestone state to confirm the new blocks/fields introduced by 10.6-10.8 (Footer `dynamicColumns`, `AboutSection`, `TestimonialSection`, Hero `links`/`breadcrumbs`) didn't introduce a new contrast pairing or hardcoded content.

**(a) WCAG contrast re-run.** `node_modules/.bin/tsx scripts/check-wcag-contrast-full.ts` against current HEAD: **20/20 PASS**, identical ratios to the original run (`globals.css` token values untouched by 10.6-10.8 — the new components only consume existing tokens: `bg-secondary`/`text-secondary-foreground`, `text-primary`, `border-primary`, `text-muted-foreground`, `bg-muted`; no new token pairing was introduced).

**(b) Hardcoded-content grep re-run**, scoped to the files added/changed by Phase 10.6-10.8 (`src/blocks/AboutSection/Component.tsx`, `src/blocks/TestimonialSection/Component.tsx`, `src/blocks/Hero/Component.tsx`, `src/components/SiteFooter.tsx`, `src/components/SiteHeader.tsx`) read in full: all rendered text is sourced from Payload fields/props (`eyebrow`, `title`, `paragraphs[].text`, `quote`, `authorName`, `authorRole`, `footer.columns`/`dynamicColumns`/`socialLinks`/`legalLinks`/`copyrightText`, `header.navItems`/`ctaButton`/`logo`) or is genuine UI chrome (`aria-label="Menu"`, `"Navigation menu"` sr-only title, breadcrumb `/` separator glyph, `aria-label="Breadcrumb"`). The one previously-flagged pre-existing fallback (`SiteHeader.tsx`'s `"Juan Carlos Angulo"` logo fallback) is unchanged and remains confirmed out of scope (Phase 5-era, not touched by 7-10.8).

**Result: zero new hardcoded-content violations, zero new contrast regressions.**

**(c) config.ts/payload-types.ts diff — now legitimately non-empty.** Re-running `git diff --stat 2e22e9b..HEAD -- 'src/blocks/*/config.ts' src/payload-types.ts` against current HEAD (which now includes 10.6-10.8) shows:

```
src/blocks/AboutSection/config.ts       |  58 +++++++++
src/blocks/Hero/config.ts               |  41 +++++++
src/blocks/TestimonialSection/config.ts |  40 +++++++
src/payload-types.ts                    | 206 +++++++++++++++++++++++++++-----
```

This is **expected, intentional schema growth**, not drift: `AboutSection`/`TestimonialSection` are Phase 10.7's new blocks and Hero's `links`/`breadcrumbs` fields are Phase 10.8's enrichment — both shipped with committed Postgres migrations (`src/migrations/20260710_164937_phase10_7_about_testimonial_sections.ts`, `src/migrations/20260710_165940_phase10_8_hero_cta_breadcrumbs.ts`) and `payload-types.ts` was regenerated via `payload generate:types` in-plan (10.7-04, 10.8-03), not hand-edited. The UI-13 "zero unexplained diff" bar is about undocumented/uncommitted schema drift, not about legitimate new-field commits with migrations — this diff is fully accounted for by 10.6-10.8's own plan artifacts. Re-confirmed: no *undocumented* schema drift exists.

**Updated summary:**

| Check | Result |
|-------|--------|
| WCAG AA contrast (both themes, post 10.6-10.8) | PASS (20/20, unchanged) |
| Hardcoded-content grep (10.6-10.8 new files) | PASS (0 genuine findings) |
| config.ts/payload-types.ts diff (2e22e9b..HEAD) | Non-empty, but fully explained by 10.6-10.8's committed migrations — no undocumented drift |
