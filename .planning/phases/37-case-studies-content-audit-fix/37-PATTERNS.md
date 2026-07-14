# Phase 37: Case Studies Content Audit & Fix - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 2 code files to modify (0 new files) + 6 content docs (data-only, no new files)
**Analogs found:** 2 / 2 code files; content-fix path confirmed via existing MCP tool registration

## Correction to CONTEXT.md's MCP tool assumption

CONTEXT.md/ROADMAP.md both state (based on an earlier tool-discovery pass) that "no case-studies tools exist in that MCP server currently." **This is out of date — verified directly against `src/payload.config.ts` lines 143-162 (`mcpPlugin` config):**

```typescript
mcpPlugin({
  collections: {
    pages: { enabled: { find: true, create: true, update: true, delete: false } },
    posts: { enabled: { find: true, create: true, update: true, delete: false } },
    'case-studies': { enabled: { find: true, create: true, update: true, delete: false } },
    authors: { enabled: { find: true, create: true, update: true, delete: false } },
    testimonials: { enabled: { find: true, create: true, update: true, delete: false } },
    clientes: { enabled: { find: true, create: true, update: true, delete: false } },
    'speaking-events': { enabled: { find: true, create: true, update: true, delete: false } },
    categories: { enabled: { find: true, create: true, update: true, delete: false } },
    users: { enabled: { find: true } },
    media: { enabled: { find: true } },
  },
  globals: { /* llms, header, footer, featured-content */ },
}),
```

`case-studies` is enabled for `find`/`update`/`create` (delete disabled everywhere, by design — see the comment directly above the plugin call, lines 137-142). Following the same naming convention as the other confirmed-live tools the orchestrator prompt lists (`findPages`/`findPosts`/`findAuthors`/etc. and their `update`/`create` counterparts), the executor should expect **`mcp__juan-payload__findCaseStudies`** and **`mcp__juan-payload__updateCaseStudies`** to be live tools in this session. `deleteCaseStudies` will NOT exist (delete disabled).

**Executor action:** call `find`/`update` for `case-studies` directly via the `juan-payload` MCP server first. Only fall back to a Local API script (verifying it produces real stdout before trusting it — see note below) if the MCP tools are confirmed unavailable in the live tool list.

**Auth:** `~/.claude.json` → this project's `mcpServers.juan-payload` → `type: "http"`, `url: "http://localhost:3000/api/mcp"`, `Authorization: Bearer e799cf...` header (already configured, dev server must be running on `localhost:3000`).

## Note on the prior failed script

`scripts/tmp-inspect-case-studies.ts` (referenced in CONTEXT.md as a prior failed attempt) **does not exist in the working tree or in git history** (`git log --all -- scripts/tmp-inspect-case-studies.ts` returns nothing — it was apparently created and deleted, or never committed, in the failed session). There is nothing to read/reuse from it. If a Local API fallback script is needed, model it on the pattern in `scripts/backfill-case-study-author.ts` (below) instead, and explicitly verify it prints to stdout (e.g. `console.log(JSON.stringify(result, null, 2))` at the very end, checked with a trivial `echo` sanity command first) before trusting silent success.

## File Classification

| File to Modify | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` | page (request-response, server component) | CRUD read + render | `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` (author-dedup pattern), `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` (dynamic JSON-LD pattern) | exact (same file already exists, both analogs are siblings in the same route-group) |
| `src/components/CaseStudyResultsChart.tsx` | component (client, chart) | transform (data → chart rows) | itself (existing `buildChartRows`/`parseLeadingNumber`, extend in place) | exact — no other dual-axis chart exists in the codebase, this is a self-modification |
| 6 CaseStudies docs (ids 15-20) | content (Payload documents, not files) | CRUD via MCP | N/A — data population, not code | N/A |

## Pattern Assignments

### `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` — Fix 1: Author dedup (CASE-07)

**Current state** (lines 243-250, already read in full — this is the bug):
```typescript
{author && (
  <section>
    <AuthorByline author={author} />
    <div className="mt-6">
      <AuthorCard author={author} />
    </div>
  </section>
)}
```

**Analog:** `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` line 201 — the author page renders **only** `AuthorCard`, no `AuthorByline` stacked on top:
```typescript
<AuthorCard author={doc} asPageHeading />
```

**Fix — exact target state** (per 37-UI-SPEC.md Fix 1 contract, do NOT pass `asPageHeading` here since the case-study page's H1 is the case-study title, not the author's name):
```typescript
{author && (
  <section>
    <AuthorCard author={author} />
  </section>
)}
```
Delete the `AuthorByline` import (line 10) if this is the only remaining usage in the file — grep the file for other `AuthorByline` references before removing the import (there should be none left after this edit). Do NOT touch `src/components/AuthorByline.tsx` itself or any other page that renders it (e.g. card/listing headers) — CONTEXT.md is explicit that `AuthorByline` stays correct everywhere else.

---

### `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` — Fix 2: Dynamic JSON-LD audit (CASE-08)

**Current state — the bug** (lines 91-96, already read in full):
```typescript
const creativeWorkData = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: doc.title,
  about: doc.heroSubtitle,
}
```
This is generic/shallow — only 2 real fields (`name`, `about`), no author, no dates, no metrics. This is the exact CASE-08 bug ("no hardcodeado/genérico... datos reales de cada caso").

**Analog — the sibling blog post page already does this correctly**, `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` lines 91-98:
```typescript
const articleData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: doc.title,
  description: doc.excerpt,
  datePublished: doc.publishedAt,
  author: { '@type': 'Person', name: author?.name },
}
```

**Recommended fix, composing the blog analog with fields actually available on `CaseStudy`** (per `src/collections/CaseStudies/index.ts` schema read in full above — no `publishedAt` field exists on CaseStudies, but Payload's `versions`/timestamps give every doc `createdAt`/`updatedAt`; `kpis`/`results.metrics` and `client`/`author` are already fetched into `doc`/`author`/`client` in this file):
```typescript
const creativeWorkData = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: doc.title,
  about: doc.heroSubtitle,
  description: doc.heroSubtitle,
  author: author ? { '@type': 'Person', name: author.name } : undefined,
  dateCreated: doc.createdAt,
  dateModified: doc.updatedAt,
  ...(client?.name ? { creator: { '@type': 'Organization', name: client.name } } : {}),
  ...(doc.kpis?.length
    ? {
        // Real per-doc metrics as a lightweight PropertyValue list -- avoids
        // fabricating a dedicated schema.org Report/Dataset type not backed
        // by real structured data on this collection.
        additionalProperty: doc.kpis.map((kpi) => ({
          '@type': 'PropertyValue',
          name: kpi.label,
          value: kpi.value,
        })),
      }
    : {}),
}
```
Executor should audit each of the 6 docs individually after this code fix (per CASE-08's "auditar... corregir donde falte") to confirm `author`/`client`/`kpis` are actually populated per-doc (not just structurally present) — this is a content-population check, not just a code check, since the field-level bugs (CASE-01/02) are being fixed in the same phase.

Note: `doc.createdAt`/`doc.updatedAt` come through automatically on every Payload document (not declared in the collection's `fields` array) — confirmed present because `CaseStudies` has `versions: { drafts: {...}, maxPerDoc: 50 }` in its config, which requires Payload's standard timestamp tracking.

---

### `src/components/CaseStudyResultsChart.tsx` — Fix 3: Dual-axis (CASE-09) + mobile (CASE-10)

**Current state** — read in full above (105 lines). Single shared linear `<YAxis>` (line 97), all bars plotted against it regardless of magnitude.

**Self-modification pattern** — extend the existing `buildChartRows`/magnitude logic rather than introducing a new charting approach (per UI-SPEC's explicit "no normalizar a porcentaje... no separar en charts distintos"):

1. Extend `ChartRow` to carry an assigned `yAxisId`:
```typescript
type ChartRow = {
  label: string
  before: number
  after: number
  yAxisId: 'left' | 'right'
}
```

2. After `buildChartRows()` returns rows, bucket by `Math.floor(Math.log10(Math.max(Math.abs(row.before), Math.abs(row.after))))` per the UI-SPEC's magnitude-grouping algorithm (37-UI-SPEC.md lines 51-56) — split at the largest gap between consecutive orders, low bucket → `left`, high bucket → `right`; if all rows share one order of magnitude, assign every row `yAxisId: 'left'` and only render a single `<YAxis>` (no dual-axis forced).

3. Render pattern, extending the existing JSX (current single `<YAxis>` at line 97 and two `<Bar>`s at lines 99-100):
```typescript
<YAxis yAxisId="left" orientation="left" tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11 }} />
{hasRightAxis && (
  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11 }} />
)}
<ChartTooltip content={<ChartTooltipContent />} />
<Bar dataKey="before" yAxisId={/* per-row via a keyed data shape, or split into two <Bar> sets by bucket */} fill="var(--color-before)" radius={4} />
<Bar dataKey="after" yAxisId={/* same */} fill="var(--color-after)" radius={4} />
```
Recharts assigns `yAxisId` per `<Bar>`, not per-datum, so if rows are mixed within one `data` array the cleanest approach (Recharts idiom, no in-repo precedent since this is the first multi-axis chart) is either (a) two `<Bar>` pairs, each filtered to its own bucket's rows via two separate `data` slices passed to two nested `<BarChart>`-compatible structures, or (b) since Recharts' single `<BarChart data={rows}>` can't mix per-row axis assignment on one `<Bar>`, keep one `data={rows}` array but render 4 `<Bar>` elements total (`before-left`, `after-left`, `before-right`, `after-right`, each reading from a bucket-specific accessor function or pre-split key), only rendering the pair whose bucket is non-empty. Executor has discretion here per CONTEXT.md ("implementación técnica exacta... a discreción") — the constraint is the visual contract in 37-UI-SPEC.md (colors/fontSize/width unchanged, `interval={0}` unchanged), not a specific Recharts wiring approach.

4. **Mobile contract (CASE-10)** — 37-UI-SPEC.md lines 67-74 is the authoritative source; key numbers: `tick.fontSize` 10px floor (down from current 11px only if crowding requires it), optional `angle={-30} textAnchor="end"` on `XAxis` instead of truncating `label` text, verify no horizontal scroll on `ChartContainer` (already `w-full`) at 375px. **Verification must be live** (real browser/headless against the running dev server), not inferred from code — no committed Playwright script exists for this pattern (`scripts/` has no `*mobile-verify*.ts`/`*playwright*.ts` file; prior mobile verifications in this project, e.g. Phase 10.6/11, appear to have been done ad-hoc in-session with browser tooling and screenshots saved to `scripts/.mobile-verify-screenshots/`, not via a reusable committed script). Follow that same ad-hoc-but-real-browser discipline; screenshots for this phase can follow the existing naming convention seen there, e.g. `scripts/.mobile-verify-screenshots/p37_es_case-studies_<slug>-mobile.png`.

---

### Content fixes to the 6 CaseStudies docs (ids 15-20) — CASE-01, 02, 03, 04, 06

**Not a code pattern — a data pattern.** Use the schema read in full above (`src/collections/CaseStudies/index.ts`) as the exact field map when writing via MCP:

| Field to fix | Path | Type/shape |
|---|---|---|
| Challenge (CASE-01) | `challenge[]` | `{ text: string (localized, textarea) }[]` — fill both `en`/`es` per doc |
| Solution (CASE-01) | `solution[]` | `{ title: string (localized), description: string (localized, textarea) }[]` — fill both locales |
| KPI labels (CASE-02) | `kpis[]` | `{ label: string (localized, required), value: string (required) }[]` — `label` is already required+localized in schema; the bug is empty/missing population, not schema |
| Results metric labels (CASE-02, CASE-04, CASE-06) | `results.metrics[]` | `{ label: string (localized, required), before: string (required), after: string (required) }[]` — add more rows (currently only 1-2) with real GSC-derived `before`/`after` values and a real `label` per row |
| Doc 20 anonymization (CASE-03) | `title`, `heroSubtitle`, `clientContext` (richText), `client` relationship (`clientes` collection doc, if it stores real name/domain — check via `findClientes`), any free-text mentioning "Pittsburgh"/county/firm name | Replace with anonymized-but-consistent values matching the pattern already used in docs 15-19 (no real firm name, domain, county, or review count) |

**Write call shape** (via MCP, following the naming convention confirmed above):
```
mcp__juan-payload__findCaseStudies({ where: { id: { in: [15,16,17,18,19,20] } }, locale: 'all', depth: 1 })
mcp__juan-payload__updateCaseStudies({ id: <doc-id>, data: { challenge: [...], solution: [...], kpis: [...], results: { metrics: [...] } }, locale: 'en' | 'es' })
```
Payload's `locale: 'all'` on read returns every localized field as `{ en, es }` objects for inspection; writes must target one `locale` at a time per the project's established localized-field-write discipline (see `CLAUDE.md`'s Database Safety section — localized field reshapes are the exact incident category that caused the 2026-07-12 data-loss incident, though these are content writes to existing localized fields, not schema reshapes, so they do NOT require Juan's named approval per the "additive/non-destructive... just do them" rule — only destructive operations do).

**Fallback if MCP tools are unavailable**, analog for a Local API write script: `scripts/backfill-case-study-author.ts` (existing script in the repo, same collection) — read this file directly before writing a fallback script, since it already demonstrates the working Local API `payload.update({ collection: 'case-studies', id, data, locale })` call shape against this exact collection. Verify any such script prints real output (`console.log`) before trusting a silent exit.

## Shared Patterns

### AuthorCard single-render pattern
**Source:** `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` line 201 (`<AuthorCard author={doc} asPageHeading />`, no `AuthorByline`)
**Apply to:** case-study detail page's author section (Fix 1 above) — same "only `AuthorCard`" pattern, but without `asPageHeading` since the case-study page's `<h1>` is already the case-study title (set at line 139 of `page.tsx`), not the author name.

### Dynamic JSON-LD from real per-doc fields
**Source:** `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` lines 91-98 (`articleData` — `headline`/`description`/`datePublished`/`author` all read from `doc`/`author`, no hardcoded/shared values)
**Apply to:** case-study detail page's `creativeWorkData` (Fix 2 above) — same principle of "every field traces to a real per-doc value," extended with `kpis`/`client` since CreativeWork (vs Article) has different natural fields available.

### `JsonLd` component usage (unchanged, no new pattern needed)
**Source:** `src/components/JsonLd.tsx` — already imported and used identically in both the blog post page and the case-study page (`<JsonLd data={...} />`), no changes needed to this component itself.

## No Analog Found

| File/Pattern | Role | Data Flow | Reason |
|---|---|---|---|
| Dual-Y-axis Recharts `<BarChart>` | component | transform | This is the first multi-axis chart in the codebase — `CaseStudyResultsChart.tsx` itself (single-axis) is the closest available starting point, extended per Recharts' own API (`yAxisId` prop on `<YAxis>`/`<Bar>`), not copied from an existing dual-axis instance. |
| Committed mobile-viewport verification script | script | n/a | No `scripts/*mobile-verify*.ts` or `scripts/*playwright*.ts` file exists despite screenshot evidence (`scripts/.mobile-verify-screenshots/`) of prior mobile verification passes (Phase 10.6/11) — those were apparently done ad-hoc with in-session browser tooling, not a reusable script. Follow the same ad-hoc-but-real-browser discipline for CASE-10; do not assume a script exists to run. |
| `scripts/tmp-inspect-case-studies.ts` | script | n/a | File does not exist in the working tree or git history — nothing to read or avoid-repeating beyond the documented symptom (silent empty-output failure) in CONTEXT.md/ROADMAP.md. |

## Metadata

**Analog search scope:** `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx`, `src/app/(frontend)/[locale]/authors/[slug]/page.tsx`, `src/app/(frontend)/[locale]/blog/[slug]/page.tsx`, `src/components/{AuthorCard,AuthorByline,CaseStudyResultsChart,JsonLd}.tsx`, `src/collections/CaseStudies/index.ts`, `src/payload.config.ts`, `scripts/backfill-case-study-author.ts` (referenced, not opened in full), `~/.claude.json` (MCP server auth), `.planning/REQUIREMENTS.md` (CASE-01..11 verbatim)
**Files scanned:** 9 source files (full or targeted reads) + 1 collection schema + 1 config file + git history check for the missing script
**Pattern extraction date:** 2026-07-14
