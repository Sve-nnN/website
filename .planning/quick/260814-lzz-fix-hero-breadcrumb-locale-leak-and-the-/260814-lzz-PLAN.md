---
phase: quick-260814-lzz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/blocks/Hero/Component.tsx
  - src/components/BlogCategoryTabs.tsx
  - scripts/verify-locale-links.mjs
autonomous: true
requirements: [F1-hero-breadcrumb, F1b-category-tabs, F2-blog-blank-gap, F3-footer-services, HK-verify-base-3001]
subsystem: i18n-routing
tags: [next-intl, routing, breadcrumbs, seo, blog]

must_haves:
  truths:
    - "On /en/blog the breadcrumb Home link resolves to the English home URL, not the site root"
    - "On /blog the breadcrumb Home link still resolves to the site root — byte-identical to today"
    - "On /en/blog every category tab href carries the /en prefix"
    - "On /blog every category tab href stays unprefixed — byte-identical to today"
    - "A crumb url an editor already prefixed by hand, and an external crumb url, are passed through unrewritten"
    - "scripts/verify-locale-links.mjs fails when the breadcrumb defect is present — proven by running it against production, which still has the defect"
    - "The stale refusal comment at the top of Hero/Component.tsx no longer asserts a premise that is false for CMS-authored breadcrumbs"
    - "npx tsc --noEmit exits 0"
    - "Zero migrations generated, zero DB writes, src/blocks/Hero/config.ts and src/lib/breadcrumbs.ts byte-unchanged"
    - "The /blog blank-gap question has a written verdict backed by a real browser measurement"
  artifacts:
    - src/blocks/Hero/Component.tsx
    - src/components/BlogCategoryTabs.tsx
    - scripts/verify-locale-links.mjs
    - .planning/quick/260814-lzz-fix-hero-breadcrumb-locale-leak-and-the-/260814-lzz-SUMMARY.md
  key_links:
    - "isPrefixableHref(crumb.url) selects the link component per crumb, exactly as CMSLink and SiteFooter already do"
    - "Link from @/i18n/navigation reads the active locale from the NextIntlClientProvider already wrapping the frontend tree in [locale]/layout.tsx"
    - "localizeBlogPath(locale, path) is the existing locale transform for blog URLs — BlogCategoryTabs already receives locale as a prop"
    - "The new script assertion keys off the nav aria-label=\"Breadcrumb\" marker, which BOTH Hero/Component.tsx and components/Breadcrumbs.tsx emit"
---

<objective>
Close the locale leak on the `/en` blog listing: the breadcrumb and the category tabs both hand an English reader a Spanish URL. Fix both at render time, code only. Then extend the existing verification script so the defect cannot come back silently, and settle the open question about the blank region on `/blog` with a measurement instead of a guess.

Purpose: `/en/blog` is a real entry point. Today its breadcrumb "Home" and all five category tabs navigate an English reader straight into Spanish content. Both are the same class of bug the previous sweep (260813-o0n) fixed everywhere else and missed here.
Output: two component fixes, one extended verification script, one written verdict on the blank gap.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/quick/260813-o0n-add-locale-aware-link-via-next-intl-navi/260813-o0n-SUMMARY.md
@src/i18n/navigation.ts
@src/blocks/Hero/Component.tsx
@src/components/BlogCategoryTabs.tsx
@src/lib/blog-paths.ts
@scripts/verify-locale-links.mjs
</context>

<verified_baseline>
Everything below was read off live production (`https://juan-tech.com`) during planning. It is measurement, not inference. Do not re-derive it; do use it as the before-state to diff against.

**`/en/blog`** — exactly ONE link in the entire document points at the site root, and it is the breadcrumb "Home". Its markup, verbatim from production:

`<nav aria-label="Breadcrumb" class="mb-4"><ol …><li …><a class="hover:text-secondary-foreground underline-offset-2 hover:underline" href="/">Home</a></li><li …><span aria-hidden="true">/</span><span aria-current="page">Blog</span></li></ol></nav>`

Note the shape: the label translated ("Home"), the url did not. That is `src/blocks/Hero/config.ts:36` — `breadcrumbs` is a CMS array where `label` is `localized: true` and `url` is not. One url value, shared by both locales.

**`/en/blog`, second leak, also verified:** 5 anchors render an unprefixed blog path — `/blog/tech-seo`, `/blog/cs-fundamentals`, `/blog/general`, `/blog/development`, `/blog/seo`. All five come from `src/components/BlogCategoryTabs.tsx`, which renders raw `<a href>` from `blogIndexPath()` / `blogCategoryPath()` with no locale transform at all. That file was not in the 260813-o0n sweep. Same page, same class of defect, and it will keep the verification script red on `/en/blog` even after the breadcrumb is fixed — so it is in scope here.

**`/blog` (Spanish control)** — breadcrumb renders `href="/"` with label "Inicio". That is the correct Spanish URL and must come out byte-identical after the fix.

**Finding 3 (footer `/services`) does NOT currently reproduce.** Production `/blog` emits `/servicios` ×2 plus four `/servicios/<slug>` and zero unprefixed `/services`; production `/en/blog` emits zero `/services` and zero `/servicios`. The footer Services column is already locale-correct on both sides. Task 2 therefore locks the good state with a regression assertion and makes NO edit to `src/components/SiteFooter.tsx`.

**Sibling breadcrumb renderers — expected audit result:** `src/components/Breadcrumbs.tsx` takes a typed `BreadcrumbItem[]` and its only two call sites (`case-studies/page.tsx`, `authors/[slug]/page.tsx`) pass helper-built trails, which already carry the locale. `src/components/SiteHeader.tsx` mentions breadcrumbs only in a comment and renders none. `src/blocks/Hero/Component.tsx` is the only component in the repo that renders a CMS-authored crumb url. Confirm this with the grep in Task 1 rather than trusting it, and write the verdict either way.
</verified_baseline>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Every link on /en/blog keeps the reader in English</name>
  <files>src/blocks/Hero/Component.tsx, src/components/BlogCategoryTabs.tsx</files>
  <read_first>src/i18n/navigation.ts, src/components/SiteFooter.tsx (lines 238-255, the admin-authored-href guard pattern to copy), src/lib/blog-paths.ts</read_first>
  <behavior>
    - `isPrefixableHref` applied to the site root returns true, so a crumb url of that shape is handed to the locale-aware `Link`, which emits the English home URL on an `/en` page and the unchanged root on a Spanish page.
    - `isPrefixableHref` applied to a hand-prefixed `/en/...` crumb url returns false, so it is rendered by the plain link untouched — no second locale segment can stack.
    - `isPrefixableHref` applied to an absolute URL, a protocol-relative `//host` url, a `mailto:` url or a bare `#fragment` returns false — the plain link renders it verbatim.
    - The four Services pages that override `breadcrumbs` via `blockProps` (`servicios/`, `servicios/[slug]`, `services/`, `services/[slug]`) keep byte-identical output: their English trails already open with a locale segment, so the guard refuses them; their Spanish trails go through the locale-aware `Link` but Spanish is the default locale and takes no prefix.
    - Every category tab on an English blog page emits a locale-prefixed path; on a Spanish blog page every tab emits the unprefixed path it emits today.
  </behavior>
  <action>
Two render-time normalizations. No schema change, no migration, no DB write, no touching `src/blocks/Hero/config.ts`.

**`src/blocks/Hero/Component.tsx`.** Import the locale-aware `Link` and `isPrefixableHref` from `@/i18n/navigation` alongside the existing plain link import, aliasing so both are unambiguous — copy the naming and the shape used in `src/components/SiteFooter.tsx` (`LocaleLink` / `PlainLink`) so the two files read the same. Inside the breadcrumb `map`, in the branch that renders a link (not the `isLast || !crumb.url` span branch), resolve the component per crumb from the guard and render through the resolved component. Change nothing else in the map: keep the `key`, keep the separator span, keep the span branch, keep the className verbatim.

Then correct the stale five-line refusal comment sitting above the plain-link import at the top of the file. It currently justifies the plain link on a premise that is false: it claims the only link here is a trail url that `src/lib/breadcrumbs.ts` already prefixed. That holds only for the four Services pages that override the prop via `blockProps`. On any page that does not override it — the blog listing being the live example — the crumb urls come straight from the CMS array field, where `url` is not localized. Write the replacement comment to say what is now true: the crumb url is admin-authored, its shape is unknown, and the guard picks the component per crumb; name both sources (CMS array field vs `blockProps` override) so the next reader does not re-derive this.

**`src/components/BlogCategoryTabs.tsx`.** The component already receives `locale` as a prop and `src/lib/blog-paths.ts` already exports `localizeBlogPath(locale, path)`, which is the exact transform. Wrap both href expressions — the "All" tab's `blogIndexPath()` and the per-category `blogCategoryPath(...)` — in `localizeBlogPath`. Keep the raw `<a>` elements and the Radix `TabsTrigger asChild` composition exactly as they are: do not swap in a `Link` component here, because these anchors are children of a Radix trigger and the point of this task is a one-expression change with no composition risk. Add a short comment naming why the transform lives at the call site rather than inside `blogCategoryPath` (those helpers are shared with `blogPostPath`, whose callers already run through the locale-aware `Link`, so localizing at the source would double-prefix them).

Finally, run the sibling audit — grep only, zero edits: list every component that renders a crumb url and confirm which of them read from the CMS rather than from `src/lib/breadcrumbs.ts`. Record the verdict for `src/components/Breadcrumbs.tsx` and `src/components/SiteHeader.tsx` explicitly in the SUMMARY, including the case where the verdict is "shares no defect" — the point is that the answer is written down, not that something changed.
  </action>
  <verify>
    <automated>npx tsc --noEmit; echo "tsc:$?"</automated>
    <automated>grep -c "isPrefixableHref" src/blocks/Hero/Component.tsx; grep -c "localizeBlogPath" src/components/BlogCategoryTabs.tsx</automated>
    <automated>grep -c "Deliberately the PLAIN link" src/blocks/Hero/Component.tsx</automated>
    <automated>git diff --stat -- src/blocks/Hero/config.ts src/lib/breadcrumbs.ts src/lib/blog-paths.ts src/components/SiteFooter.tsx; git status --porcelain -- src/migrations</automated>
    <automated>printf '%s\n' "import { isPrefixableHref } from '../src/i18n/navigation'" "const cases: [string, boolean][] = [['/', true], ['/en', false], ['/en/blog', false], ['/entrevistas', true], ['/blog', true], ['https://x.com/a', false], ['//evil.com/x', false], ['mailto:a@b.c', false], ['#contact', false]]" "let bad = 0" "for (const [href, want] of cases) { const got = isPrefixableHref(href); if (got !== want) { bad++; console.error('MISMATCH', href, 'got', got, 'want', want) } else console.log('ok', href, got) }" "process.exit(bad === 0 ? 0 : 1)" > scripts/_tmp-verify-lzz.ts && npx tsx scripts/_tmp-verify-lzz.ts; echo "harness:$?"; rm -f scripts/_tmp-verify-lzz.ts</automated>
  </verify>
  <done>
`tsc:0`. The two positive greps are both at least 1. The refusal-comment grep is 0 (that phrase is gone from the file). The `git diff --stat` line is empty for all four listed paths and `git status --porcelain -- src/migrations` is empty — nothing outside the two target files moved, and no migration exists. The guard harness exits 0 on all 9 cases (this is the same tsx-against-the-real-module technique 260813-o0n used to prove the guard 15/15, so the import is known to work in this repo; if it fails on module resolution rather than on an assertion, say so in the SUMMARY and fall back to the live HTTP evidence from Task 2 rather than deleting the check). The scratch harness file is deleted and `git status --porcelain -- scripts/_tmp-verify-lzz.ts` is empty.
  </done>
</task>

<task type="auto">
  <name>Task 2: Make the verification script catch this defect, and prove it does</name>
  <files>scripts/verify-locale-links.mjs</files>
  <read_first>scripts/verify-locale-links.mjs (the whole file — assertions 1-5 and the scoping helpers are the pattern to extend)</read_first>
  <precondition>The dev server may or may not be running on port 3001; `https://juan-tech.com` was reachable during planning and is required for the RED proof.</precondition>
  <action>
First, the housekeeping. The working tree already has one uncommitted change in this file: the `BASE` default moved to port 3001, which is where Juan's dev server runs. Keep it exactly as it is and commit it as part of this task. `VERIFY_BASE_URL` still overrides it, so nothing else has to change.

Then extend the script. It currently has a real blind spot, and that blind spot is precisely why the breadcrumb defect survived the last sweep: assertion 2 only looks for unprefixed hrefs whose first segment is one of the content sections (`blog`, `case-studies`, `authors`, `websites`). A link whose href is exactly the site root matches none of them, so nothing was watching the crumb that was broken.

Add a breadcrumb assertion block, numbered after the existing five and following their exact style (module-level regex constants near the others, a scoping helper near `headerSlice`/`stripLocaleSwitcher`, `assertNone`/`assertSome` for the checks, a comment above the block explaining what it exists to catch):

- A scoping helper that returns the concatenation of every `<nav>` element carrying `aria-label="Breadcrumb"`. Scoping is required, not cosmetic: the header logo legitimately renders a root-path href on Spanish pages, and on English pages the locale switcher does too — asserting document-wide would false-fail on both. Both `src/blocks/Hero/Component.tsx` and `src/components/Breadcrumbs.tsx` emit that same aria-label, so one helper covers CMS-authored and helper-built trails alike.
- On every `/en` page that renders a breadcrumb: assert the scoped slice contains no link to the bare site root, assert it contains no unprefixed section href (reuse the existing `UNPREFIXED_SECTION` constant), and assert it contains at least one locale-prefixed href (reuse `ANY_PREFIXED`) so absence can never pass.
- On the Spanish control pages that render a breadcrumb: assert the scoped slice still contains a link to the bare site root, and no locale prefix leaked in. This is the no-regression half — it is what proves the Spanish output did not move.
- A coverage guard: if not a single fetched page produced a breadcrumb slice, fail loudly. An assertion that silently matches nothing is worse than no assertion, and this suite already treats a non-200 fetch as a failure for the same reason.

Add one more short assertion while the file is open, covering the finding-3 class of bug so the currently-good state is locked: on every fetched page, assert no href uses the English services segment without a locale prefix; and on `/en` pages additionally assert no href uses the Spanish services segment. Both hold on production today (verified during planning), so this is a regression latch, not a fix.

Now run it, twice, and record both runs verbatim in the SUMMARY.

Run A, the RED proof, against production — this is the mandatory one, because production still carries the defect and is reachable: `VERIFY_BASE_URL=https://juan-tech.com node scripts/verify-locale-links.mjs`. The new breadcrumb assertion MUST fail on `/en/blog`, and assertion 2 MUST report the five category-tab hrefs on the same page. If either passes, the assertion is not testing what it claims and has to be corrected before you go further. Any OTHER failure in this run is information about the deployed build, not about your change — record it, do not chase it.

Run B, the local GREEN, against the dev server: start it if it is not up, then `node scripts/verify-locale-links.mjs`. Known and out of scope: `/blog` and `/en/blog` return 404 locally because that content sits in draft status — another session is handling it (`.planning/quick/260814-publish-stranded-websites/`). Do not touch content or the database to work around it. If those two fetches 404, the script reports them as fetch failures and the breadcrumb block simply has no `/en/blog` to inspect; in that case record the local result honestly as "everything reachable passes, the two blog routes are the pre-existing 404s", and state plainly in the SUMMARY that the live green for `/en/blog` lands on deploy. If the routes do return 200 locally, the full suite must pass — that is the real green, capture it.
  </action>
  <verify>
    <automated>node --check scripts/verify-locale-links.mjs; echo "syntax:$?"</automated>
    <automated>grep -c 'aria-label="Breadcrumb"' scripts/verify-locale-links.mjs</automated>
    <automated>grep -n "localhost:3001" scripts/verify-locale-links.mjs</automated>
    <automated>VERIFY_BASE_URL=https://juan-tech.com node scripts/verify-locale-links.mjs; echo "prod-run-exit:$?"</automated>
    <automated>node scripts/verify-locale-links.mjs; echo "local-run-exit:$?"</automated>
  </verify>
  <done>
`syntax:0`. The breadcrumb-marker grep is at least 1 and the port-3001 default is still present on the `BASE` line. The production run exits non-zero and its output names a breadcrumb failure on `/en/blog` — that non-zero exit is the pass condition for this task, since it is the proof the new gate catches the real, still-deployed defect. The local run's outcome is recorded verbatim, with the `/blog` and `/en/blog` 404s (if present) explicitly labelled pre-existing and out of scope. Both runs are pasted into the SUMMARY, not summarized.
  </done>
</task>

<task type="auto">
  <name>Task 3: Settle the /blog blank-gap question by measuring it</name>
  <files>.planning/quick/260814-lzz-fix-hero-breadcrumb-locale-leak-and-the-/260814-lzz-SUMMARY.md</files>
  <action>
This task is a diagnosis. Its deliverable is a verdict in the SUMMARY. A code change is permitted only if the measurement proves a defect AND the fix is confined to a file already in this plan's scope; anything larger, or anything needing a content/CMS change, is reported and left alone.

Start from what was already measured off production `https://juan-tech.com/blog` during planning, so you do not repeat it:

- The page renders two card grids, not one: a 3-card grid (a "Destacados" featured block) and, after the lead entry and the category tabs, the main 12-card archive grid.
- Of those 12 cards, 9 are server-rendered inside `ScrollReveal` with an inline style setting opacity to 0 and a 16px Y offset. The first 3 carry `priority`, which skips the motion wrapper entirely — that is the deliberate LCP fix documented in `src/components/ScrollReveal.tsx`.
- The `</main>` tag closes immediately after the last card. There is no empty block, no stray element and no spacer between the grid and the footer.
- The footer's own top margin is `mt-16`, 64px. Nowhere near a viewport.

So the leading hypothesis is that the "blank region" is those 9 opacity-0 cards waiting on an IntersectionObserver reveal that never fired during the screenshot capture — which would make it a capture artifact, not a layout bug. Test that hypothesis instead of assuming it. Playwright is already a devDependency (`^1.61.1`) and the repo has precedent for this style of check in `scripts/verify-mobile-viewport.mjs`.

Drive a real browser against production `/blog`: load it, scroll to the bottom, wait for the reveal to settle, then read (a) the computed opacity of the last `[data-testid="scroll-reveal"]` element, and (b) the vertical distance in pixels between the bottom edge of the last grid card and the top edge of the footer.

Apply this decision rule and write the result either way:

- Last card's computed opacity settles at 1 after it enters the viewport, AND the measured grid-to-footer distance is roughly the footer's own 64px margin: NOT a bug. The blank in the screenshot is the SSR initial state of a scroll reveal, captured before it fired. Write that verdict plainly, note that the cards are fully present in the HTML so there is no SEO exposure, and change no code.
- Last card's computed opacity stays 0 after it is scrolled into view: real defect — the reveal is not firing. Root-cause it (the likeliest culprit is the `LazyMotion features={domAnimation}` bundle in `src/components/MotionProvider.tsx` not carrying the in-view feature, or the `amount: 0.3` viewport threshold being unreachable for a tall card) and report the root cause with the evidence. Implement the fix only if it is a one-expression change inside `ScrollReveal.tsx` or `MotionProvider.tsx`; otherwise write the recommendation and stop.
- A real empty element taller than ~400px sits between the grid and the footer: real defect — name the offending selector and its source component, then apply the same "small fix or report" rule.

Whichever branch fires, also record the secondary observation as an observation only, with no change: the page shows the same recent posts up to three times (the 3-card featured block, the lead entry, and the top of the 12-card grid). That is a content/layout question for Juan, not a bug in this task's scope.

Delete any scratch Playwright script you write, and confirm the working tree is clean of it.
  </action>
  <verify>
    <automated>git status --porcelain -- scripts/ | grep -v "verify-locale-links.mjs" || echo "no stray scratch scripts"</automated>
    <automated>grep -ci "blank\|scroll-reveal\|opacity" .planning/quick/260814-lzz-fix-hero-breadcrumb-locale-leak-and-the-/260814-lzz-SUMMARY.md</automated>
    <automated>npx tsc --noEmit; echo "tsc:$?"</automated>
  </verify>
  <done>
The SUMMARY contains a verdict section for the blank gap that names the measured computed opacity and the measured grid-to-footer pixel distance, states which branch of the decision rule fired, and says explicitly whether code changed. If no code changed, that is a complete and acceptable outcome and the SUMMARY says so in those words. `tsc:0` still holds. No scratch script is left in the working tree.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Payload admin → rendered href | `Hero.breadcrumbs[].url` is a free-text CMS field. Any string an editor types reaches an anchor's `href`. |
| Public site → verification script | The script issues unauthenticated GETs against a base URL supplied by an env var. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-lzz-01 | Tampering | `crumb.url` → `Link` selection in `Hero/Component.tsx` | medium | mitigate | `isPrefixableHref` only ever rewrites hrefs opening with a single slash, so it can never convert an external URL into a same-origin one, and it refuses protocol-relative `//host` values outright. Task 1's harness re-asserts the `//evil.com/x` and absolute-URL cases against the real committed module. |
| T-lzz-02 | Tampering | Double-prefixing a hand-authored `/en/...` crumb url | medium | mitigate | The guard matches the whole first segment against the routing locale list, so `/en/...` is refused and `/entrevistas` is not mistaken for it. Both cases are in the harness; the script's existing assertion 1 (`DOUBLE_PREFIX`, whole document, every page) is the live backstop. |
| T-lzz-03 | Tampering | `javascript:` URI typed into an admin crumb url | low | accept | Pre-existing sitewide and already logged as T-o0n-02. The guard returns false for it, so the plain link renders exactly what it renders today — this change neither creates nor worsens the exposure. |
| T-lzz-04 | Information disclosure | `VERIFY_BASE_URL=https://juan-tech.com` run | low | accept | Read-only GETs of public pages, no credentials or cookies sent, no data written anywhere. |
| T-lzz-05 | Denial of service | Data loss via schema reshape | n/a | mitigate | Structurally prevented: this plan makes zero schema changes, generates zero migrations and performs zero DB writes. Localizing `Hero.breadcrumbs[].url` is the exact reshape that wiped the Home CTA on 2026-07-12 and is explicitly off the table — Task 1's `git diff --stat` and `git status -- src/migrations` gates enforce it mechanically. |

No package-manager installs occur in this plan, so no supply-chain (`-SC`) threat applies.
</threat_model>

<verification>
How to confirm the fix, end to end:

1. **The English breadcrumb href.** Load an `/en` listing page that renders a CMS-authored trail — `/en/blog` is the live case — and read the anchor inside `<nav aria-label="Breadcrumb">`. It must resolve to the English home URL. Before this change it resolved to the site root; that before-state is captured verbatim in `<verified_baseline>` above, straight off production.
2. **Spanish output unchanged.** The same nav on `/blog` must still carry the root href with the label "Inicio", byte-identical to the production markup quoted in `<verified_baseline>`. The script's Spanish-control half asserts this automatically.
3. **The category tabs.** On `/en/blog`, all five tab hrefs carry the `/en` prefix; on `/blog` all five stay unprefixed.
4. **The gate is real, not decorative.** `VERIFY_BASE_URL=https://juan-tech.com node scripts/verify-locale-links.mjs` must FAIL the new breadcrumb assertion today, because production still runs the defective build. That non-zero exit is the proof the assertion catches the actual bug rather than an imagined one.
5. **Nothing else moved.** `npx tsc --noEmit` exits 0, `git diff` is empty for `src/blocks/Hero/config.ts`, `src/lib/breadcrumbs.ts`, `src/lib/blog-paths.ts` and `src/components/SiteFooter.tsx`, and `src/migrations` is untouched.

Known environmental limit, pre-existing and explicitly out of scope: `/blog` and `/en/blog` return 404 against a local dev server because that content is in draft status. Another session owns it (`.planning/quick/260814-publish-stranded-websites/`). Do not fix it here, do not work around it with a DB write, and do not let it read as a failure of this change.
</verification>

<success_criteria>
- [ ] `src/blocks/Hero/Component.tsx` picks the link component per crumb via `isPrefixableHref`, and its top-of-file comment states the true premise
- [ ] `src/components/BlogCategoryTabs.tsx` routes both href expressions through `localizeBlogPath`
- [ ] `scripts/verify-locale-links.mjs` has a breadcrumb-scoped assertion block plus the services regression latch, and keeps the port-3001 `BASE` default
- [ ] The production run fails the new breadcrumb assertion on `/en/blog`, output pasted into the SUMMARY
- [ ] The local run is recorded verbatim, with the two blog-route 404s labelled pre-existing
- [ ] The guard harness passes all 9 cases and its scratch file is deleted
- [ ] The sibling-breadcrumb audit verdict is written down for `Breadcrumbs.tsx` and `SiteHeader.tsx`, including when the verdict is "no shared defect"
- [ ] The `/blog` blank-gap verdict is written with measured numbers, and says explicitly whether code changed
- [ ] Finding 3 is documented as not reproducing, with the production evidence, and `SiteFooter.tsx` is unmodified
- [ ] `npx tsc --noEmit` exits 0
- [ ] Zero migrations, zero DB writes
</success_criteria>

<output>
Create `.planning/quick/260814-lzz-fix-hero-breadcrumb-locale-leak-and-the-/260814-lzz-SUMMARY.md` when done.
</output>
</content>
</invoke>
