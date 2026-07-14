# Phase 35 Plan 01: Component Polish Pass - Summary

**Completed:** 2026-07-14

## What was done

Read `designs/DESIGN-SYSTEM.md` + `designs/DESIGN-SYSTEM-PEN.md` in full, then all 28 target component source files. Pulled structured, `resolveVariables:true` JSON for all 30 reusable `.pen` nodes via `mcp__pencil__batch_get` (two batches), cross-checked every candidate diff against `tailwind.config.ts`, and took 2 confirmatory screenshots (`SiteHeader`, `Card`) before applying fixes. 6 genuine, in-scope findings were fixed directly in code; the rest were confirmed already-equivalent or explicitly discarded with a stated reason.

## Group 1 — POLISH-01: UI Primitives (Button/*, Input, Textarea, Badge/*, Tabs, Card)

| Component | Reviewed against | Finding | Action | Reference |
|---|---|---|---|---|
| Button (all variants) | `Button/Primary/Secondary/Outline/Ghost/Destructive/Link` nodes | Default/Secondary/Outline/Ghost/Link variants already match .pen fills/text colors exactly (bg-primary, bg-secondary, bg-background+border-input, transparent, text-primary) | No change | `src/components/ui/button.tsx`, `button-variants.ts` |
| Button — Destructive | `Button/Destructive` node: text `#12141C` on `#DC2626` bg | **Fixed (real bug):** `text-destructive-foreground` compiled to nothing — `tailwind.config.ts`'s `destructive` color has no `.foreground` sub-key (unlike primary/secondary/muted/accent). Swapped to `text-primary-foreground` (`#12141C` in both themes), which is exactly what the .pen shows and an already-existing token | Fixed | `src/components/ui/button-variants.ts:14-19` |
| Input / Textarea | `Input`/`Textarea` nodes: fill `#FAFAF7`, stroke `#DCDCDC`, placeholder `#8A8A8A` | `bg-transparent` + `border-input` + `placeholder:text-muted-foreground` resolve to the same values once composited over the page background — visually equivalent | No change (confirmed match) | `src/components/ui/input.tsx`, `textarea.tsx` |
| Badge/Default, Secondary, Outline | `Badge/*` nodes: `cornerRadius:4`, `padding:[3,10]` | **Fixed:** code used `rounded-md` (6px, `--radius`-2px) instead of `rounded-sm` (4px, `--radius`-4px) — the .pen models badges with a tighter, sharper radius than buttons/inputs | Fixed | `src/components/ui/badge-variants.ts:7` |
| Badge — destructive variant | Same dark-text-on-red bug as Button — Destructive | **Fixed (same bug):** `text-destructive-foreground` → `text-primary-foreground` | Fixed | `src/components/ui/badge-variants.ts:16-24` |
| Tabs | `Tabs`/`Tab/Active`/`Tab/Inactive` nodes: list `bg:#F7F7F7 padding:4 radius:8`, active tab `bg:#FAFAF7 radius:6`, inactive text `#8A8A8A` | Exact match: `bg-muted p-1 rounded-lg` (list), `data-[state=active]:bg-background ... rounded-md` (active tab), `text-muted-foreground` (inactive) | No change (confirmed match) | `src/components/ui/tabs.tsx` |
| Card | `Card` node: `cornerRadius:16` | **Fixed:** base `Card` used Tailwind's unconfigured `rounded-xl` default (12px, no CSS var behind it — unlike `rounded-lg/md/sm` which derive from `--radius`). `CallToAction` already independently uses `rounded-2xl` (16px) for the same "elevated CTA surface" family — reused that precedent instead of inventing a `--radius-xl` variable | Fixed | `src/components/ui/card.tsx:12` |

## Group 2 — POLISH-02: Chrome (SiteHeader, SiteFooter)

| Component | Reviewed against | Finding | Action | Reference |
|---|---|---|---|---|
| SiteHeader | `SiteHeader` node: `fill:#FAFAF7` (light) w/ dark nav text | **Discarded (`.pen` artifact, not a code defect):** contradicts `DESIGN-SYSTEM.md`'s documented "dark bands" pattern (`--secondary` used for header/footer/hero). The .pen's own `SiteFooter` node correctly models the dark band — this reads as a one-off construction slip on the Header node specifically. Code's dark-navy header (`bg-secondary`) matches the documented system and the live-bug-fix history in `SiteHeaderChrome.tsx`; left untouched | Discarded — logged reason above | `src/components/SiteHeaderChrome.tsx` |
| SiteHeader — logo, nav, CTA button, height | `SiteHeader` node: height 72, CTA `fill:#F7581E` `radius:6` `padding:[10,16]` | Matches: header height (40px logo + `py-4`×2=32px=72px), CTA button uses default `<Button>` (bg-primary/radius-md/px-4 py-2) | No change (confirmed match) | `src/components/SiteHeaderChrome.tsx` |
| SiteFooter | `SiteFooter` node: `fill:#12141C`, columns gap 32, socials gap 16, copyright opacity 0.7 | Matches: `bg-secondary`, `gap-x-8` (32px) columns, `gap-4` (16px) socials, `opacity-70` copyright | No change (confirmed match) | `src/components/SiteFooter.tsx` |
| SiteFooter — bottom row layout | `Bottom Row` node: socials + copyright only, single row | **Discarded:** code's structure (socials + legal links on one row, copyright as a separate paragraph below) reads as a data-completeness gap in the .pen's mock data (legal links likely just omitted from the sample), not a real layout defect — restructuring the row would be beyond micro-improvement scope | Discarded — logged reason above | `src/components/SiteFooter.tsx:134-164` |

## Group 3 — POLISH-03: Existing Hero Variants (home, listing, post-header, case-study-header)

| Component | Reviewed against | Finding | Action | Reference |
|---|---|---|---|---|
| Hero — home | `Hero/Home` node: `fill:#12141C`, padding `[96,32]`, subtitle opacity 0.8 | Matches: `bg-secondary`, `md:py-24`=96px, `text-secondary-foreground/80` | No change (confirmed match). `HeroGrainGradient` explicitly not touched per hard constraint | `src/blocks/Hero/Component.tsx` |
| Hero — listing | `Hero/Listing` node: `fill:#12141C`, border-bottom 4px primary, padding `[56,32]` | Matches: `bg-secondary`, `border-b-4 border-primary`, `md:py-14`=56px | No change (confirmed match) | `src/blocks/Hero/Component.tsx:34` |
| Hero — post-header | `Hero/Post Header` node: border-top 4px primary, padding `[64,32]` | Matches: `border-t-4 border-primary`, `md:py-16`=64px | No change (confirmed match) | `src/blocks/Hero/Component.tsx:35-39` |
| Hero — case-study-header | `Hero/Case Study Header` node: border-top 8px primary, padding `[72,32]` | Border matches (`border-t-8`). Padding: .pen models 72px, code renders `md:py-20`=80px (8px off; no exact Tailwind step exists for 72px without an arbitrary value — default scale jumps 16→20, i.e. 64px→80px). **Discarded** as within the .pen's documented approximation noise (same class of approximation as the doc's own `text-heading`/`text-display` clamp values) | Discarded — logged reason above | `src/blocks/Hero/Component.tsx:40-44` |
| Hero — breadcrumb separator | `Hero/Listing`'s `Breadcrumbs` node: no visible "/" separator between items | **Discarded:** code correctly renders a "/" separator (`{i > 0 && <span>/</span>}`) — the .pen's mockup simply omitted the decorative separator; code's behavior is the intended/better one, not a gap | Discarded — logged reason above | `src/blocks/Hero/Component.tsx:121-140` |

## Group 4 — POLISH-04: Content Blocks

| Component | Reviewed against | Finding | Action | Reference |
|---|---|---|---|---|
| CallToAction | `CallToAction` node: `radius:16`, `fill:#12141C` | Corner radius already correct (`rounded-2xl`). Padding model (flat 48px in .pen vs. nested `Container`+`section` padding in code) **discarded** as a layout-shape difference, not a token-value difference — restructuring would exceed micro-improvement scope | Discarded — logged reason above | `src/blocks/CallToAction/Component.tsx` |
| FAQ Item | `FAQ Item` node: `radius:8`, `fill:#FAFAF7`, stroke `#A3A3A3`, plus-icon `20px` primary | Exact match: `rounded-lg` (8px), `bg-card`, `border-border`, `size-5` (20px) `text-primary` plus icon | No change (confirmed match) | `src/blocks/FAQ/Component.tsx` |
| ContactForm — form column | `ContactForm` node: inputs `radius:6` `stroke:#DCDCDC`, submit button matches `Button/Primary` | Matches existing Input/Button primitives (already covered in Group 1) | No change (confirmed match) | `src/blocks/ContactFormBlock/Component.tsx` |
| ContactForm — sidebar panel | `Sidebar` node: `radius:16 fill:#12141C padding:32` | **Fixed:** sidebar wrapper used plain `rounded-lg` (8px, base `--radius`) instead of `rounded-2xl` (16px) — same CTA-styled panel family as `CallToAction` (both wrap `HeroGrainGradient variant="cta"`), which already correctly uses `rounded-2xl` | Fixed | `src/blocks/ContactFormBlock/Component.tsx:84` |
| ResultsSection | `ResultsSection` node: `fill:#F7F7F7`, stats gap 48, KPI value `#F7581E` size 44 | Matches: `bg-muted` (default "gray" variant ≈ `#F7F7F7`), `gap-12`=48px, `text-primary text-display` | No change (confirmed match). KPI font-family diff (.pen shows Khand fallback, code intentionally uses `font-display`/Array) is a documented .pen limitation, not a code gap | No change | `src/blocks/ResultsSection/Component.tsx` |
| ClientLogosBlock | `ClientLogosBlock` node: title→logos gap 24, logo row gap 32 | Matches: `mb-6`≈24px title gap, `gap-8`=32px logo row | No change (confirmed match). Placeholder-rectangle opacity (40%) vs. real-logo resting opacity (70%) **discarded** as not comparable — .pen uses a flat gray rectangle as a generic "logo unavailable" placeholder convention, not a modeled target value | Discarded — logged reason above | `src/blocks/ClientLogosBlock/Component.tsx` |
| AboutSection | `AboutSection` node: text/photo columns gap 48 | **Fixed:** grid used `gap-8` (32px) instead of `gap-12` (48px) — inconsistent with the sibling two-column block `ContactFormBlock`, which already correctly uses `gap-12` for its own two-column layout | Fixed | `src/blocks/AboutSection/Component.tsx:23` |
| ServiceScopeCard | `ServiceScopeCard` node: `padding:32`, radius 16 (Card family, covered in Group 1), `TIEMPO ESTIMADO` value color `#D03D07` | Radius already fixed via the shared `Card` component fix (Group 1). Value color already matches (`text-primary-text`). **Fixed:** `CardContent` padding was `p-6` (24px) instead of `p-8` (32px) — inconsistent with `AuthorCard`, which already correctly overrides `Card` with `p-8` | Fixed | `src/blocks/ServiceScopeCard/Component.tsx:19` |

## Group 5 — POLISH-05: Authorship Components

| Component | Reviewed against | Finding | Action | Reference |
|---|---|---|---|---|
| AuthorCard | `AuthorCard` node: `radius:16 padding:32` (already fixed via Card), avatar `64px`, credentials badges `fill:#12141C` (Badge/Secondary family), years-experience text `#F7581E` | Already correct on every dimension checked: `Card className="p-8"` (32px, matches .pen exactly — was the reference pattern used to fix `ServiceScopeCard`), `Avatar className="size-16"` (64px), `<Badge variant="secondary">` (bg-secondary/text-secondary-foreground, radius fixed via Group 1's Badge fix), `text-primary` years line | No change (confirmed match — this component was the reference/precedent for 2 of the other fixes) | `src/components/AuthorCard.tsx` |
| AuthorByline | `AuthorByline` node: avatar `40px`, name `14px` weight 600, first-credential badge | Matches: default `<Avatar>` (`h-10 w-10`=40px, no size override needed), `text-label` (14px) name, `<Badge variant="secondary">` for first credential | No change (confirmed match) | `src/components/AuthorByline.tsx` |

## Files Changed

- `src/components/ui/badge-variants.ts` — `rounded-md`→`rounded-sm`; destructive variant `text-destructive-foreground`→`text-primary-foreground`
- `src/components/ui/button-variants.ts` — destructive variant `text-destructive-foreground`→`text-primary-foreground`
- `src/components/ui/card.tsx` — `rounded-xl`→`rounded-2xl`
- `src/blocks/AboutSection/Component.tsx` — grid `gap-8`→`gap-12`
- `src/blocks/ServiceScopeCard/Component.tsx` — `CardContent` `p-6`→`p-8`
- `src/blocks/ContactFormBlock/Component.tsx` — sidebar wrapper `rounded-lg`→`rounded-2xl`

Every fix reuses a class/utility that already exists and already has precedent elsewhere in the codebase (`rounded-2xl` from `CallToAction`, `gap-12` from `ContactFormBlock`, `p-8` from `AuthorCard`, `rounded-sm` from the existing `--radius`-4px derivation, `text-primary-foreground` already used by the Button default/outline variants). Zero new Tailwind/CSS-variable tokens added.

## Verification

- `npx tsc --noEmit` — clean, zero errors.
- `scripts/smoke-check-phase8.mjs` re-run against a freshly started, isolated `next dev` server (port 3458): 5/5 checkable routes PASS, all 16 blocks covered, exit code 0.
- Additional Phase-35 sanity check: `/`, `/en`, `/en/blog`, `/servicios` all returned HTTP 200 with exactly 1 `<h1>` each.
- `git diff -- src/components/HeroGrainGradient.tsx` — empty output, confirmed untouched.
- `git diff --stat` — only the 6 files listed above changed (plus pre-existing unrelated `28-REGRESSION-DIFF.md` modification present in the working tree before this phase started).

## Deviations from Plan

None — the plan (single wave, direct-fix approach) was followed as written.
</content>
