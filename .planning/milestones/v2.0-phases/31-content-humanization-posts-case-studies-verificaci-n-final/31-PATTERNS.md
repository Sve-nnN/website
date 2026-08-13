# Phase 31: Content Humanization — Posts & Case Studies + Verificación Final - Pattern Map

**Mapped:** 2026-07-16
**Files analyzed:** 0 new schema/component files — same as Phase 30, this phase is content-only (Local API writes against real Neon data) plus reuse/extension of existing verification scripts. No `src/collections/*` changes needed (fields already `localized: true`).
**Analogs found:** 6 / 6 (all read in full; one temporary read-only script written and deleted for live counts, per instructions)

## Live data confirmed (read-only, script deleted after use)

- **`posts`: 72 documents** (confirmed via `payload.find({ collection: 'posts', limit: 0 })` — CONTEXT.md's "~72 seen in earlier phases" is now a confirmed, not assumed, count).
- **`case-studies`: 7 documents, ids `[14, 15, 16, 17, 18, 19, 20]`** — matches Phase 37 research exactly.
- Total rich-text bodies to touch across both locales: 72 Posts × 1 field (`content`) + 7 CaseStudies × 2 fields (`clientContext`, `conclusion`) not already fixed by Phase 37, × 2 locales = **148 Posts writes + up to 28 CaseStudies writes** (before batching/checkpoint split).

## File Classification

| Content Group | Role | Data Flow | Closest Analog Script | Match Quality |
|---|---|---|---|---|
| Posts `content` (richText, 72 docs) | content-update script (batched loop) | CRUD (Local API `find` all + `update` by id, per locale) | `scripts/humanize-legal-pages.ts` (Lexical builder) + `scripts/backfill-case-study-author.ts` (loop-all-docs-in-collection shape) | role-match, composed from two analogs |
| CaseStudies `clientContext`/`conclusion` (richText, 7 docs) | content-update script | CRUD, same shape as above, smaller volume | `scripts/humanize-legal-pages.ts` | exact for the Lexical-write mechanics; volume is trivial (7 docs) |
| CaseStudies `challenge[]`/`solution[]` | **out of scope** | — | Already rewritten in Phase 37 (`.planning/phases/37-...`), per CONTEXT.md explicit instruction not to re-touch | n/a — exclude from this phase's plan |
| Progress/batching for 72-doc sweep | new small utility (checkpoint-based loop) | batch, resumable | No exact analog exists for "resumable batch with progress log" — closest shape is `scripts/reindex-search.ts`'s simple `find(limit:500)` + per-doc loop (no checkpoint) and `scripts/backfill-case-study-author.ts`'s conditional skip-if-already-done (`if (cs.author) continue`) | role-match, compose a new resumable pattern from these two |
| Post-sweep snapshot (Posts + Case Studies) | verification script (already exists, run don't modify) | batch read | `scripts/content-humanization-snapshot.ts` | exact — reuse as-is |
| Reindex search after sweep | verification/maintenance script (already exists, run don't modify) | batch write (no-op update) | `scripts/reindex-search.ts` | exact — reuse as-is |
| Locale-parity verification, extended to Posts/Case Studies | verification script (extend existing) | batch read + diff | `scripts/verify-locale-parity.ts` | role-match — needs a small extension (see below), not a rewrite |
| Live JSON-LD/meta verification, extended to blog/case-studies routes | verification script (extend existing) | request-response (curl) | `scripts/verify-live-jsonld-meta.mjs` | role-match — needs a small extension (see below), not a rewrite |
| Final CWV/Lighthouse gate | verification script (already exists, run don't modify) | request-response (Lighthouse) | `scripts/lighthouse-mobile.mjs` | exact — reuse as-is, but with an EXTENDED route list (see below) |

---

## Pattern Assignments

### 1. Posts `content` field (72 docs, both locales)

**Schema confirmed** (`src/collections/Posts/index.ts`, full file, 71 lines): `content` is a single top-level `richText` field (`lexicalEditor()`, `required`, `localized: true`) — NOT nested in blocks/arrays. This is simpler than every Phase 30 analog (no `content.layout` blocks array, no id-reuse concern at all for this field — a plain `richText` field on `update` just replaces the tree, no sibling array rows to orphan).

**Batching/loop analog — combine two patterns:**

1. Fetch-all-docs shape from `scripts/backfill-case-study-author.ts` (lines 25-29):
```typescript
const { docs: posts } = await payload.find({
  collection: 'posts',
  limit: 0, // 0 = no limit, confirmed via live count check this phase
  depth: 0,
})
```

2. Per-doc, per-locale write loop (no id-reuse needed since `content` is a flat richText field, not blocks):
```typescript
for (const post of posts) {
  for (const locale of ['es', 'en'] as const) {
    const current = await payload.findByID({ collection: 'posts', id: post.id, locale, depth: 0 })
    const humanizedTree = humanizeRichText(current.content) // author-authored rewrite, see Lexical shape below
    await payload.update({
      collection: 'posts',
      id: post.id,
      locale,
      data: { content: humanizedTree },
    })
  }
}
```

**Resumability (CONTEXT.md's "Claude's Discretion" — prefer verifiable/resumable progress over one monolithic run):** No existing script in the repo implements a true checkpoint/resume file. The closest defensive pattern is `backfill-case-study-author.ts`'s `if (cs.author) continue` skip-check (line 34) — adapt this idea by writing a small JSON progress log (e.g. `.planning/phases/31-.../progress.json` with `{ postId: 'done' }` entries) that the script reads at start and skips any id already marked done, so a crashed/interrupted run can re-invoke the same script and only process remaining docs. This is new — no direct repo precedent for the checkpoint-file mechanic itself, only for the "skip if already correct" idea it's built on.

### 2. Lexical rich-text read/write shape (used for both Posts `content` and CaseStudies `clientContext`/`conclusion`)

**Analog:** `scripts/humanize-legal-pages.ts` (lines 15-60, full helper block) — the only existing script in the repo that builds Lexical JSON programmatically for a Local API `update`.

**Verbatim node shape to reuse:**
```typescript
function heading(text: string) {
  return { type: 'heading', tag: 'h2', version: 1, children: [{ type: 'text', version: 1, text }] }
}
function paragraph(text: string) {
  return { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text }] }
}
function richTextDoc(sections: { heading: string; body: string }[]) {
  return {
    root: {
      type: 'root',
      children: sections.flatMap((s) => [heading(s.heading), paragraph(s.body)]),
      direction: 'ltr', format: '', indent: 0, version: 1,
    },
  }
}
```
For Posts, most bodies will likely be multiple paragraphs without headings (blog prose) — use only `paragraph()` calls flattened into `root.children`, e.g. `richTextDoc` variant that takes `string[]` of paragraphs with no heading. For CaseStudies `clientContext`/`conclusion` (shorter prose blocks, no confirmed heading structure in the live schema), same flat-paragraph shape applies — read the live doc first via `payload.findByID({ locale: 'all' })` to confirm the actual existing paragraph count/structure before assuming a fixed shape, since these fields were authored freely (unlike Legal pages' fixed 5/6-section structure).

**Reading existing Lexical content back out (needed to know what to rewrite):** `scripts/verify-locale-parity.ts`'s `extractText()` helper (lines 63-81) is the only existing repo code that walks a Lexical tree to pull plain text back out — reuse this exact recursive shape (checks `obj.text`, recurses into `obj.children`) when the planner needs to read the CURRENT prose of all 72 Posts + 7 CaseStudies as an editing worklist before rewriting.

### 3. CaseStudies `clientContext` + `conclusion` (7 docs, both locales) — excluding `challenge[]`/`solution[]` (already done in Phase 37)

**Schema confirmed** (`src/collections/CaseStudies/index.ts`, full file, 92 lines):
- `clientContext`: top-level `richText` field, `localized: true`, NOT required — line `{ name: 'clientContext', type: 'richText', editor: lexicalEditor(), localized: true }`.
- `conclusion`: same shape, also `localized: true`, not required.
- `challenge` (array of `{ text: textarea, localized }`) and `solution` (array of `{ title, description }`, both localized) are the fields Phase 37 already fixed — **do not touch these two arrays in this phase**, per CONTEXT.md's explicit instruction.
- `testimonialSection` (blocks, `TestimonialSection`, maxRows 1) — quotes are third-party attributed content (real client testimonials), NOT humanization targets; leave untouched (same caution as VOICE-PROFILE's "los datos locales... sean reales" rule for placeholder-vs-real content, applied here to not paraphrasing a client's actual words).
- `kpis[].label`/`services[].service`/`sector` are short localized labels, low editorial surface — confirm via live read whether these are already in-voice (likely yes, short factual labels) before deciding whether they're in scope; CONTEXT.md's phase boundary is "body/contenido editorial" which points at `clientContext`/`conclusion` as the primary targets, consistent with Phase 30's boundary of excluding meta/short-label fields.

**Same loop shape as Posts, scaled down (7 docs, not 72) — no batching/checkpoint complexity needed here, single-pass script is fine:**
```typescript
const { docs: caseStudies } = await payload.find({ collection: 'case-studies', limit: 0, depth: 0 })
for (const cs of caseStudies) {
  for (const locale of ['es', 'en'] as const) {
    await payload.update({
      collection: 'case-studies',
      id: cs.id,
      locale,
      data: {
        clientContext: humanizedClientContextByIdAndLocale[cs.id][locale],
        conclusion: humanizedConclusionByIdAndLocale[cs.id][locale],
      },
    })
  }
}
```
No id-reuse concern here either — `clientContext`/`conclusion` are flat `richText` fields, not blocks/arrays, so a full-tree replace on `update` cannot orphan sibling array rows (unlike the Pages `content.layout` blocks pattern from Phase 30).

---

### 4. Snapshot before/after (VOICE-04 historical diff)

**File:** `scripts/content-humanization-snapshot.ts` (already includes `posts` and `case-studies` in its `COLLECTIONS` array per Phase 30's pattern map, confirmed again this pass at line 34 — `const COLLECTIONS = [...]` includes both). Reuse exactly as documented in Phase 30's PATTERNS.md section 0:

```bash
node --env-file=.env node_modules/.bin/tsx scripts/content-humanization-snapshot.ts --tag pre-sweep-phase31
# ...after full rewrite...
node --env-file=.env node_modules/.bin/tsx scripts/content-humanization-snapshot.ts --tag post-sweep-phase31
```

Both write to `.planning/phases/29-content-humanization-safety-net/content-snapshots/` (hardcoded path in the script, per its own design — do not redirect). For the **historical diff against VOICE-04's original pre-humanize snapshot** (CONTEXT.md decision #2, "diff final contra el snapshot de VOICE-04"), locate the original tag via:
```bash
ls .planning/phases/29-content-humanization-safety-net/content-snapshots/ | grep -i voice-04
```
No existing script diffs two snapshot JSON files against each other — this is new, small tooling (a plain `JSON.parse` + recursive key-diff, following the same `extractText`/`isLocalizedPair` walk shape already built in `verify-locale-parity.ts`) that the planner should scope as its own small script or an ad-hoc one-off, not a rewrite of the snapshot script itself.

---

### 5. Reindex search after sweep

**File:** `scripts/reindex-search.ts` (full file, 41 lines) — run exactly as-is, unmodified, after the full Posts+CaseStudies rewrite completes:
```bash
node --env-file=.env node_modules/.bin/tsx scripts/reindex-search.ts
```
Confirmed it already targets `['posts', 'case-studies', 'authors']` with `limit: 500` (comfortably above the confirmed 72+7 volume) and a no-op `payload.update({ data: {} })` per doc to retrigger the search-plugin's `afterChange` sync hook. No extension needed.

---

### 6. Extend `verify-locale-parity.ts` to Posts/Case Studies

**File:** `scripts/verify-locale-parity.ts` (full file, 206 lines) — currently `COLLECTIONS = ['pages', 'authors', 'testimonials', 'speaking-events', 'categories']` (line 40), does NOT yet include `posts`/`case-studies`.

**Minimal extension needed:** add `'posts'` and `'case-studies'` to the `COLLECTIONS` tuple (line 40). The generic `walk()`/`isLocalizedPair()`/`extractText()` machinery (lines 55-118) already handles richText Lexical trees generically (via `extractText`'s recursive `children`/`text` walk) and needs **zero changes** to support the new collections — it was built to genericize over any `{ es, en }`-shaped node, which is exactly what `locale: 'all'` returns for `content`/`clientContext`/`conclusion`. This confirms CONTEXT.md's assumption: the script generalizes cleanly, only the `COLLECTIONS` array needs a one-line addition, no new logic.

No named-regression-check additions are needed unless a specific known bug surfaces in Posts/CaseStudies live data during execution (the two hardcoded checks at lines 164-195 are Phase-30-specific bugs, e.g. Header ctaButton — leave those in place, they still apply, just add new ones if a Posts/CaseStudies-specific parity bug is found).

---

### 7. Extend `verify-live-jsonld-meta.mjs` to blog/case-studies routes

**File:** `scripts/verify-live-jsonld-meta.mjs` (full file, 181 lines) — currently `ROUTES` (lines 23-46) covers only Phase 30's touched routes (home, contact, privacy, terms, services, geo-pages). Does NOT include `/blog/[slug]` or `/case-studies/[slug]` routes.

**Extension needed:** add entries for a representative sample of Posts/CaseStudies routes, both locales, e.g.:
```javascript
{ path: '/blog', expectedJsonLd: [] }, // confirm live via curl first, don't assume
{ path: '/en/blog', expectedJsonLd: [] },
{ path: '/blog/<a-real-live-slug>', expectedJsonLd: ['BlogPosting'] }, // confirm actual @type via one curl before hardcoding
{ path: '/en/blog/<same-slug>', expectedJsonLd: ['BlogPosting'] },
{ path: '/case-studies', expectedJsonLd: [] },
{ path: '/en/case-studies', expectedJsonLd: [] },
{ path: '/case-studies/<a-real-live-slug>', expectedJsonLd: ['Article'] }, // confirm actual @type before hardcoding — do not assume Article vs CreativeWork
{ path: '/en/case-studies/<same-slug>', expectedJsonLd: ['Article'] },
```
The script's own header comment documents its methodology: "`expectedJsonLd` documents what this phase's authors confirmed live... BEFORE this script existed" — follow the same discipline, curl the real routes first (do not guess the `@type`) before adding entries. `lighthouse-mobile.mjs` already curls one real post slug (`tech-seo-guide`) and one real case-study slug (`migracion-ecommerce-nextjs-seo-tecnico`) — reuse these exact confirmed-live slugs rather than picking new ones, since they're already proven to resolve (200 OK) in the existing Lighthouse route list.

The `extractJsonLd`/`extractTitle`/`extractMetaDescription`/`verifyUrl` functions (lines 64-132) need **zero changes** — they're already route-shape-agnostic (pure regex over any HTML response).

---

### 8. Final CWV/Lighthouse gate — baseline determination

**Chronology confirmed via git log dates:**
- Phase 32 (v1.7, "Regression Baseline") was captured **2026-07-14** — commit `00d7d8f` — this is BEFORE Phase 29/30/31 (v1.6 Track B) resumed (Phase 30 closed 2026-07-16/17 per STATE.md `last_updated: 2026-07-17`).
- Phase 26-28 (v1.6 Track A, motion work) closed earlier still (Phase 26 commit `3601448`, predates Phase 32).
- Sequence confirmed: **26-28 (Track A motion) → 32-36 (v1.7, entirely) → 29-31 (v1.6 Track B, resumed after v1.7 closed)**. So numerically "Phase 32" ran chronologically BEFORE "Phase 31" — CONTEXT.md's suspicion is correct.

**This makes Phase 32's baseline the ideal "pre-Track-B-content, post-Track-A-motion" reference point** — it was captured after all of Phase 26-28's motion/animation work was live, and before any Phase 29-31 content rewrite touched anything. It is NOT "pre-milestone-v1.6" in the purest sense (Track A's motion changes are already baked into it), but per CONTEXT.md's own framing ("motion de Phase 26-28 + contenido reescrito de Phase 29-31... sin regresión vs. baseline pre-milestone"), the milestone's own success criterion is about the JOINT final state vs. this exact pre-Track-B checkpoint, not a mythical pre-Phase-26 snapshot. Use it as-is.

**File:** `.planning/milestones/v1.7-phases/32-regression-baseline/32-REGRESSION-BASELINE.md` + `lh-phase32-baseline.json` (both read in full).

Baseline routes and numbers to gate against (read in full, reproduced here for the planner):

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 84 | 96 | 96 | 100 | 4094ms | 0 | 154ms |
| `/en` | 85 | 96 | 96 | 100 | 4236ms | 0 | 75ms |
| `/seo-tecnico-madrid` | 88 | 98 | 96 | 91 | 3795ms | 0 | 65ms |
| `/en/seo-tecnico-madrid` | 89 | 98 | 96 | 91 | 3782ms | 0 | 64ms |
| `/seo-tecnico-lima` | 89 | 98 | 96 | 91 | 3783ms | 0 | 60ms |
| `/en/seo-tecnico-lima` | 89 | 98 | 96 | 91 | 3785ms | 0 | 60ms |

Phase 32's route set does NOT include a blog/case-studies route — CONTEXT.md's success criterion 5 wants "rutas representativas de AMBOS tracks", so the planner needs a **second, older reference point for blog/case-studies specifically**: `scripts/lighthouse-mobile.mjs`'s own hardcoded `ROUTES` (lines 28-37, read in full this phase) already includes `/en/blog/tech-seo-guide` and `/en/case-studies/migracion-ecommerce-nextjs-seo-tecnico` — but there is no committed baseline JSON for THESE specific routes pre-dating Phase 29 in `.planning/`. The oldest committed Lighthouse artifacts found in the repo are `.planning/phases/28-component-motion-rollout-hero-variants-blog-grids/lh-phase28-baseline.json` (pre-32, i.e. even earlier, right after Track A's motion rollout) and `.planning/phases/11-verificacion-cruzada-final/lh-baseline.json` (much older, v1-era). **Recommend to the planner:** use Phase 32's baseline for home + geo-pages (exact route overlap), and run a FRESH "before" Lighthouse pass on the blog/case-studies routes at the very start of Phase 31 execution (before any Posts/CaseStudies content is rewritten) as this phase's own local "before" snapshot for those two routes specifically — there is no pre-existing committed baseline for blog/case-studies routes to reuse, so one must be captured fresh, same invocation as always:
```bash
node scripts/lighthouse-mobile.mjs --base-url http://localhost:3000 --out /tmp/lh-phase31-pre.json --routes-only "/en/blog/tech-seo-guide,/en/case-studies/migracion-ecommerce-nextjs-seo-tecnico"
```

Invocation confirmed unmodified — `--base-url`, `--out`, `--routes-only` (comma-separated) flags all present and working as documented in the script's own header comment (lines 14-17). Must be run against a production build (`next build && next start`), never `next dev`, per the script's own comment (lines 3-4).

---

## Shared Patterns

### Lexical richText read/write (flat field, no blocks nesting)
**Source:** `scripts/humanize-legal-pages.ts` lines 15-60 (`heading`/`paragraph`/`richTextDoc` builders) + `scripts/verify-locale-parity.ts` lines 63-81 (`extractText` reader).
**Apply to:** Posts `content`, CaseStudies `clientContext`/`conclusion`. Simpler than every Phase 30 blocks-nested case — no id-reuse discipline needed since these are flat richText fields, not arrays/blocks.

### Loop-all-docs-in-collection + per-locale update
**Source:** `scripts/backfill-case-study-author.ts` (full file) for the fetch-all + conditional-skip shape; `scripts/humanize-lean-collections.ts` (per-doc `for` + per-locale `for` nested loop, lines 40-56) for the double-loop update shape.
**Apply to:** both Posts (72 docs) and CaseStudies (7 docs) rewrite scripts.

### Snapshot-before/after + historical diff discipline
**Source:** `scripts/content-humanization-snapshot.ts` (already includes posts/case-studies in scope, do not modify).
**Apply to:** run pre-sweep and post-sweep tags for Phase 31, then diff both against the original VOICE-04 tag for the full-milestone historical summary Juan reads before close.

### Verification-script extension over rewrite
**Source:** `scripts/verify-locale-parity.ts` and `scripts/verify-live-jsonld-meta.mjs` (both confirmed generic/route-shape-agnostic in their core walk/extract logic).
**Apply to:** add `posts`/`case-studies` to `COLLECTIONS` (parity script) and add blog/case-studies routes to `ROUTES` (JSON-LD/meta script) — no logic changes needed in either file.

### Lighthouse gate against the correct chronological baseline
**Source:** `.planning/milestones/v1.7-phases/32-regression-baseline/` (home + geo-pages, captured 2026-07-14, pre-Track-B/post-Track-A) + a freshly captured "before" pass on blog/case-studies routes (no pre-existing committed baseline for those two routes).
**Apply to:** Phase 31's final CWV gate (success criterion 5) — compare post-sweep numbers against Phase 32's baseline for home/geo overlap, and against this phase's own fresh pre-sweep blog/case-studies capture for those two routes.

## No Analog Found

| Item | Role | Data Flow | Reason |
|---|---|---|---|
| Resumable/checkpoint batch loop for 72 Posts | new small utility | batch, resumable | No existing script implements a persisted checkpoint file across runs — closest precedent is `backfill-case-study-author.ts`'s in-memory `if (cs.author) continue` skip (checks live DB state, not a separate progress file). New: read/write a small JSON progress log so an interrupted 72-doc sweep can resume without re-processing already-humanized docs. |
| Snapshot-to-snapshot JSON diff tool (VOICE-04 vs. post-sweep-phase31) | new small utility | batch read + diff | `content-humanization-snapshot.ts` only captures, `verify-locale-parity.ts` only asserts es/en symmetry within one snapshot — neither diffs two separate snapshot files against each other over time. Build small, reusing `extractText`/`isLocalizedPair`-style recursive walk already proven in `verify-locale-parity.ts`. |

## Metadata

**Analog search scope:** `scripts/` (11 scripts read in full or targeted: `reindex-search.ts`, `lighthouse-mobile.mjs`, `verify-locale-parity.ts`, `verify-live-jsonld-meta.mjs`, `content-humanization-snapshot.ts` [referenced, not re-read — already fully read in Phase 30's mapping pass, no new ranges needed], `humanize-legal-pages.ts`, `backfill-case-study-author.ts`, `humanize-lean-collections.ts`), `src/collections/Posts/index.ts` (full, 71 lines), `src/collections/CaseStudies/index.ts` (full, 92 lines), `.planning/milestones/v1.7-phases/32-regression-baseline/` (both files, full), `.planning/STATE.md`, `git log` (chronology confirmation).
**Files scanned:** 9 scripts (full), 2 collection configs (full), 1 baseline doc + 1 baseline JSON (full), plus one temporary read-only Local API script (written to `scripts/tmp-count-check.ts`, run once, deleted immediately after) to confirm live Posts/CaseStudies counts.
**Pattern extraction date:** 2026-07-16
**Live-data findings surfaced during mapping (flag for planner, not resolved here):**
1. Posts confirmed at exactly 72 documents (not assumed) — volume matches CONTEXT.md's cautious estimate.
2. CaseStudies confirmed at 7 documents, ids 14-20 (matches Phase 37 research exactly, no discrepancy).
3. Chronology confirmed: Phase 32 (v1.7) ran BEFORE Phase 31 (v1.6) despite the higher phase number — Phase 32's regression baseline is the correct "pre-Track-B" reference for home/geo routes, but has no blog/case-studies routes in its route set, requiring a fresh "before" Lighthouse capture for those two routes at the start of this phase's execution.
4. No committed pre-Track-B baseline exists for blog/case-studies routes anywhere in `.planning/` — this is a genuine gap, not an oversight to route around; flag as a fresh-capture requirement in the plan, not something to search harder for.
</content>
