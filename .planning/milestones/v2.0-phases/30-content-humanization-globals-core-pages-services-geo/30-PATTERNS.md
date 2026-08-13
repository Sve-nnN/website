# Phase 30: Content Humanization — Globals, Core Pages, Services & Geo - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 0 new files — this phase is content-only (Local API writes against real Neon data), executed via one-off `scripts/*.ts` runners, not schema/component changes.
**Analogs found:** 5 / 5 (one strong script analog per content group, all read in full)

This phase does not create or modify `src/collections/*`, `src/globals/*`, or `src/blocks/*` — 29-FIELD-AUDIT.md already confirms which fields are `localized: true` and public-facing, and no schema changes are needed. The only artifacts this phase produces are **temporary content-rewrite scripts** (run once against Neon via Local API, then safe to delete or keep as a record — follow existing repo convention of keeping `seed-phase*.ts` scripts committed for history) plus the snapshot/parity verification. Classification below is by **content group + script role**, not by traditional controller/service/model roles.

## File Classification

| Content Group | Role | Data Flow | Closest Analog Script | Match Quality |
|---|---|---|---|---|
| Header + Footer globals | content-update script | request-response (Local API `updateGlobal`) | `scripts/seed-header-footer-content.ts` | exact |
| Llms global (excl. llmsTxt/llmsFull) | content-update script | request-response (Local API `updateGlobal`) | `scripts/seed-header-footer-content.ts` (global update pattern) | role-match (Llms has no editorial fields left to touch — see note below) |
| Authors, Testimonials, Clientes, SpeakingEvents, Categories (lean collections) | content-update script | CRUD (Local API `find` + `update` by id, per locale) | `scripts/seed-author-eeat.ts` / `scripts/seed-legal-pages.ts`'s per-locale-update loop pattern | role-match |
| Home page (`pages` doc, slug `home`) | content-update script | CRUD on nested `content.layout` blocks array | `scripts/seed-phase13-home-content.ts` | exact |
| Contact page (`pages` doc, slug `contact`) | content-update script | CRUD on nested `content.layout` blocks array | `scripts/seed-contact-page.ts` | exact |
| Privacy/Terms pages (`pages` docs, slugs `privacy`/`terms`) | content-update script | CRUD on nested richText inside `content.layout` | `scripts/seed-legal-pages.ts` | exact |
| Services index + 4 service landings (`pages` docs) | content-update script | CRUD on nested `content.layout` blocks array | `scripts/seed-phase19-service-pages.ts` | exact |
| 2 geo-pages (`pages` docs, slugs `seo-tecnico-madrid`/`seo-tecnico-lima`) | content-update script | CRUD on nested `content.layout` blocks array | `scripts/seed-phase20-geo-pages.ts` | exact |
| Pre-sweep snapshot | verification script (already exists, run don't modify) | batch read | `scripts/content-humanization-snapshot.ts` | exact — reuse as-is |
| Locale-parity verification | verification script (new, small) | batch read + diff | pattern to build from `scripts/content-humanization-snapshot.ts`'s `locale: 'all'` read shape | role-match |

---

## Pattern Assignments

### 0. Mandatory first step: run the existing snapshot script, do not modify it

**File:** `scripts/content-humanization-snapshot.ts` (111 lines, read in full)

Invoke exactly as documented in its own header comment, before any rewrite in this phase begins:

```bash
node --env-file=.env node_modules/.bin/tsx scripts/content-humanization-snapshot.ts --tag pre-sweep-phase30
```

Behavior confirmed by reading the file:
- Takes one required `--tag <name>` CLI arg (exits with usage error if missing).
- Iterates `COLLECTIONS = ['pages', 'posts', 'authors', 'case-studies', 'categories', 'testimonials', 'clientes', 'speaking-events', 'websites']` via `payload.find({ collection, limit: 0, locale: 'all', depth: 0 })` — `locale: 'all'` returns the full `{ es, en }` shape per localized field, which is exactly what a before/after diff needs.
- Iterates `GLOBALS = ['footer', 'header', 'llms']` via `payload.findGlobal({ slug, locale: 'all' })`.
- Writes one JSON file to `.planning/phases/29-content-humanization-safety-net/content-snapshots/<tag>-<ISO timestamp>.json` (note: hardcoded to the Phase 29 directory, not Phase 30's — this is intentional per the script's own design, keep snapshots centralized there; do not redirect output to the Phase 30 directory unless Juan says otherwise).
- Exits 0 on success.

Run this once at the start of Phase 30 execution (tag e.g. `pre-sweep-phase30`) and again at the end (tag e.g. `post-sweep-phase30`) so a diff is possible even though the formal diff-and-present-to-Juan step is Phase 31's job (VOICE-07 closes there). `websites` and `posts`/`case-studies` are included in the script's scope but out of scope for Phase 30's rewrite — that's fine, the snapshot is comprehensive by design and costs nothing extra to include.

---

### 1. Header + Footer globals

**Analog:** `scripts/seed-header-footer-content.ts` (full file, 117 lines)

**Imports pattern** (lines 1-3):
```typescript
import { getPayload } from 'payload'

import config from '../src/payload.config'
```

**Core update pattern — `updateGlobal` called once per locale** (lines 21-30):
```typescript
await payload.updateGlobal({
  slug: 'header',
  locale: 'es',
  data: { navItems: navItemsEs },
})
await payload.updateGlobal({
  slug: 'header',
  locale: 'en',
  data: { navItems: navItemsEn },
})
```
Same shape for `footer` (lines 86-107), passing `columns`, `dynamicColumns`, `socialLinks`, `legalLinks`, `copyrightText` in one `data` object per locale call.

**Fields to touch (cross-checked against `src/globals/Header/index.ts` and `src/globals/Footer/index.ts`, both read in full):**
- `Header.navItems[].link.label` (localized text, via shared `link()` helper — `src/fields/link.ts` line 108) — current live values: `Blog`/`Blog`, `Casos de éxito`/`Case Studies`, `Autores`/`Authors`, `Contacto`/`Contact`, `Servicios`/`Services` (5 nav items live today, not 4 — the seed script is stale, a `services` link was added later, confirmed via live `payload.findGlobal` read).
- `Header.ctaButton.label` (localized text) — current live value is **`Get in Touch` for BOTH locales** (ES locale was never actually localized to "Hablemos" despite the seed script's intent and the VOICE-PROFILE's explicit "Hablemos" > "Contáctame ahora" rule — this is a real bug to fix in this phase, not just a rewrite).
- `Footer.columns[].title`, `Footer.dynamicColumns[].title`, `Footer.legalLinks[].label`, `Footer.copyrightText` (all localized text) — current live Spanish copy is plain/serviceable ("Sitio", "Contacto", "Buscar", copyright line) — low-risk rewrite per VOICE-PROFILE's "breve, directo, sin espacio para desarrollar voz" guidance for globals/nav.
- Do NOT touch `navItems[].link.url`, `ctaButton.href`, `legalLinks[].href`, `socialLinks[].url` — all non-localized URLs, correct as-is per 29-FIELD-AUDIT.md.
- Note: live Footer has a 3rd `legalLinks` entry not in the seed script (`/sitemap.html` → "Sitemap", ES-only, no `en` value at all) — flag this as a real locale-parity gap to fix during this phase's parity verification (success criterion 4), not something to silently rewrite around.

**Array/nested-array id-reuse constraint (applies here too):** Header/Footer's `navItems`/`columns`/`dynamicColumns`/`legalLinks`/`socialLinks` are top-level arrays directly on the global (not nested inside a `pages.content.layout` blocks array), but the same Payload behavior applies — if the script ever needs to change array *length* (e.g. adding/removing a nav item) across locale writes, it must fetch existing ids first and reuse them, same as the Pages-block pattern below. If only editing existing entries' `label`/`title` text in place (no structural add/remove), the original per-locale `data: { navItems: [...] }` full-array write is safe as long as ids from a `locale: 'all'` or per-locale read are echoed back unchanged.

---

### 2. Llms global (excluding llmsTxt/llmsFull)

**File:** `src/globals/Llms/index.ts` (full file, 27 lines) — schema has exactly two fields, `llmsTxt` and `llmsFull`, both `textarea`, both **excluded** from this phase per CONTEXT.md ("Llms, salvo llmsTxt/llmsFull, ya excluidos") and 29-FIELD-AUDIT.md Action Needed #3 (Juan confirmed: leave non-localized, single-locale exception).

**No analog needed — there is nothing to rewrite on this global in Phase 30.** Flag this for the planner explicitly: despite CONTEXT.md listing "Llms" in the phase-30 scope line, the field-level reality is that both of its fields are the excepted ones. Either drop Llms from the plan entirely, or keep a plan step that explicitly documents "confirmed no-op, see 29-FIELD-AUDIT.md Action Needed #3" so the success-criteria checklist doesn't silently skip a global that turns out to have zero actionable fields.

---

### 3. Lean collections: Authors, Testimonials, Clientes, SpeakingEvents, Categories

**Analog:** `scripts/seed-legal-pages.ts`'s per-locale `payload.update` loop pattern (lines 201-236) adapted for flat collections instead of Pages docs — no `content.layout` nesting involved here, so the array-id-reuse concern is simpler (only applies to any array sub-fields inside these collections, e.g. `Authors.credentials[]`/`expertise[]`/`education[]`/`experience[]`).

**Fields to touch, confirmed against actual collection configs (all read in full):**

| Collection | Fields (per 29-FIELD-AUDIT.md, confirmed against source) | Config file |
|---|---|---|
| `Authors` | `jobTitle`, `bio` (textarea), `credentials[].label`, `expertise[].topic`, `education[].degree/institution/description`, `experience[].company/role/description` | `src/collections/Authors/index.ts` |
| `Testimonials` | `role`, `testimonial` (textarea) — NOT `name`/`company` (proper nouns, non-localized, correct as-is) | `src/collections/Testimonials/index.ts` |
| `Clientes` | none — every field (`name`, `websiteUrl`) is non-localized proper-noun/URL data, correct as-is. **No rewrite needed for Clientes**, flag as no-op like Llms above. | `src/collections/Clientes/index.ts` |
| `SpeakingEvents` | `title`, `description`, `role` — NOT `location` (likely proper noun/city, per 29-FIELD-AUDIT.md Action Needed #4, confirm live value before deciding) or `coSpeakers[].name` (proper noun) | `src/collections/SpeakingEvents/index.ts` |
| `Categories` | `title`, `description` | `src/collections/Categories/index.ts` |

**Real live sample confirmed via read-only Local API query** — `Authors` bio (both locales), current published live text:

> ES: "Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico freelance con sede en Lima, Perú. A lo largo de más de cuatro años de experiencia profesional me he especializado en la intersección entre el desarrollo de software y la optimización para motores de búsqueda. Mi trabajo combina la auditoría técnica SEO —rastreo, indexabilidad, Core Web Vitals, Schema.org y datos estructurados— con el desarrollo full-stack utilizando Next.js y Payload CMS. Ayudo a empresas a mejorar su visibilidad orgánica mediante correcciones a nivel de código, sin intermediarios. Construyo y mantengo juan-tech.com, un blog técnico bilingüe orientado a desarrolladores y profesionales de tecnología en Latinoamérica y España."
>
> EN: "I'm Juan Carlos Angulo, a Software Engineer and Technical SEO Consultant based in Lima, Peru, with over four years of professional experience. I build web applications with Next.js and Payload CMS, conduct technical SEO audits (crawlability, Core Web Vitals, Schema.org, indexation), and help businesses grow their organic visibility by fixing issues at the source. I run juan-tech.com, a bilingual technical blog in Spanish and English covering Technical SEO, web performance, and CS fundamentals for developers across Latin America and Spain."

Note this is already flagged in 29-VOICE-PROFILE.md as the **"referencia positiva"** (already-correct voice sample) — the ES version already matches the voice sample's traits closely (concrete opening, quantified credential "más de cuatro años", first person, no em dash). The EN version reads slightly more compressed/listy than the ES ("I build... I conduct... and help...") — worth checking during humanization whether the EN needs the same mixed long/short rhythm the ES already has, per VOICE-PROFILE's explicit rule against a "more polished/corporate" EN register.

**Core update code shape (Local API, no `content.layout` nesting):**
```typescript
const { docs } = await payload.find({ collection: 'authors', limit: 1 })
const docId = docs[0].id

for (const locale of ['es', 'en'] as const) {
  await payload.update({
    collection: 'authors',
    id: docId,
    locale,
    data: {
      bio: humanizedBioByLocale[locale],
      // credentials[]/expertise[]/education[]/experience[] arrays: if editing
      // in place (same count/order), fetch existing ids first (locale: 'all'
      // read) and echo them back per array item to avoid orphaning the other
      // locale's array rows — same discipline as the Pages blocks pattern below.
    },
  })
}
```

---

### 4. Home page

**Analog:** `scripts/seed-phase13-home-content.ts` (full file, 401 lines, read in full) — this is the single richest analog in the codebase for editing an *existing* Pages doc's nested blocks in place without duplicating rows.

**Home's live `content.layout` blockType order, confirmed via live read:**
```
['hero', 'featuredCaseStudiesBlock', 'aboutSection', 'clientLogosBlock', 'featuredPostsBlock', 'testimonialsCarousel', 'callToAction', 'faq', 'contactFormBlock', 'servicesShowcase']
```

**Editorial fields to rewrite on Home (per 29-FIELD-AUDIT.md, cross-checked against blocks used):** `hero.title`/`hero.subtitle` (Hero block), `aboutSection.eyebrow`/`title`/`paragraphs[].text`/`features[].title`/`features[].description`/`ctaText` (AboutSection block), `faq.title`/`faqs[].question`/`faqs[].answer` (FAQ block), `callToAction.richText` (CallToAction block, already localized post-2026-07-12 fix), `contactFormBlock.*` text fields, `clientLogosBlock.title`, `featuredPostsBlock.title`, `featuredCaseStudiesBlock.title`, `servicesShowcase.title` — all confirmed `localized: true` text/textarea fields per 29-FIELD-AUDIT.md's Blocks section.

**Real live sample — Home hero (both locales):**
```json
"title": {
  "es": "Juan Carlos Angulo: Ingeniero de Software y Experto SEO",
  "en": "Juan Carlos Angulo: Software Engineer & SEO Expert"
},
"subtitle": {
  "es": "Arquitecturas de alto rendimiento y estrategias de crecimiento orgánico",
  "en": "High-performance architectures and organic growth strategies"
}
```
This hero title/subtitle reads like a corporate tagline (third-person name + noun-phrase subtitle), not first-person prose — a strong contrast case against the VOICE-PROFILE's "no tercera persona" rule and a clear rewrite target. Note: VOICE-PROFILE explicitly excepts JSON-LD/schema and "kicker de tarjeta" contexts from the first-person rule — confirm during planning whether a hero title showing the person's name as a heading counts as this kind of structural exception or should be converted to first person; flag for Juan if ambiguous rather than assuming.

**Critical id-reuse pattern (the core lesson of this analog, lines 264-390):**
```typescript
let faqBlockId: string | undefined
let contactBlockId: string | undefined
let featureIds: (string | undefined)[] | undefined
let paragraphIds: (string | undefined)[] | undefined
let faqItemIds: (string | undefined)[] | undefined

for (const locale of LOCALES) {
  const doc = await payload.findByID({ collection: 'pages', id: homeDoc.id, locale, depth: 0 })
  const layout = [...((doc.content?.layout ?? []) as Array<Record<string, unknown>>)]

  const aboutIndex = layout.findIndex((b) => b.blockType === 'aboutSection')
  // ...mutate layout[aboutIndex] in place, reusing featureIds[i]/paragraphIds[0] if already captured...

  await payload.update({
    collection: 'pages',
    id: homeDoc.id,
    locale,
    data: { content: { layout: layout as any } },
  })

  if (!faqBlockId /* etc */) {
    const refetched = await payload.findByID({ collection: 'pages', id: homeDoc.id, depth: 0 })
    // capture ids from refetched layout for reuse on the next locale's write
  }
}
```
The load-bearing insight, stated explicitly in the script's own header comment (lines 20-31): **fetch the full layout fresh per-locale via `findByID({ locale })` before mutating**, so sibling blocks already correct for that locale are preserved verbatim, and **reuse the exact same block/sub-array `id`s across every locale's write** — Payload full-replaces array/blocks fields on `update`, so writing a second locale without echoing back the first locale's ids creates duplicate rows and silently orphans the first locale's already-written localized values. This exact bug pattern is what caused the 2026-07-12 Home CTA data-loss incident (per CLAUDE.md) at the schema-migration level, and its script-level equivalent (orphaned array rows, not data-loss via DROP COLUMN, but same root cause of "unreused ids") already bit this exact repo twice before (referenced in this script's own comments as "the exact bug already hit and fixed once in seed-phase10-7-gap-fill.ts / seed-home-page.ts").

---

### 5. Contact page

**Analog:** `scripts/seed-contact-page.ts` (full file, 130 lines)

**Fields to rewrite:** `contactFormBlock.eyebrow`, `.title`, `.description`, `.submitLabel`, `.sidebarTitle`, `.sidebarDescription`, `.socialProofText`, `.contactInfo[].title`, `.contactInfo[].value` — all confirmed `localized: true` per 29-FIELD-AUDIT.md. Do NOT touch `contactInfo[].href` (non-localized URL/mailto).

**Real live sample (both locales, single `contactFormBlock` on the `contact` Pages doc):**
```json
es: { eyebrow: "Contacto", title: "Hablemos", description: "¿Tienes un proyecto en mente? Cuéntame de qué se trata.", submitLabel: "Enviar mensaje", sidebarTitle: "Charlemos sobre tu próximo proyecto", sidebarDescription: "Disponible para consultoría en ingeniería de software y SEO técnico.", socialProofText: "Respondo en menos de 48 horas." }
en: { eyebrow: "Contact", title: "Get in Touch", description: "Have a project in mind? Tell me about it.", submitLabel: "Send message", sidebarTitle: "Let's talk about your next project", sidebarDescription: "Available for software engineering and technical SEO consulting.", socialProofText: "I respond within 48 hours." }
```
This is already fairly close to the "CTA colaborativo" voice rule ("Hablemos") — low-risk, mostly polish-level rewrite, but confirm the exact live values via a fresh read at execution time rather than trusting this script's literal source (the script is idempotent/upsert, so live DB values should match, but always verify against `payload.findByID` right before writing, not just against the seed script's hardcoded literals).

**Same block/column id-reuse pattern as Home** (lines 87-120): capture `savedIds` from the first locale's write-then-refetch, echo back on subsequent locale writes.

---

### 6. Privacy + Terms pages

**Analog:** `scripts/seed-legal-pages.ts` (full file, 259 lines) — the only analog in the repo for rewriting `richText` prose inside a `Content` block's `columns[].richText` (Lexical JSON), as opposed to plain string fields.

**Fields to rewrite:** `content.layout[0].columns[0].richText` (Lexical rich text tree) — both `privacy` and `terms` Pages docs use a single `Content` block with one `full`-width column holding a Lexical doc built from `heading`+`paragraph` node pairs, one pair per legal section (6 sections for Privacy, 5 for Terms).

**Lexical-tree-building helpers to reuse verbatim** (lines 15-43):
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
Rewrite the `body` string of each `{ heading, body }` section pair — legal document *structure* (6 section headings for Privacy, 5 for Terms) should stay intact per usual legal-content caution, but CONTEXT.md scopes Privacy/Terms into the humanization sweep same as any other page, so the prose voice can shift; do not alter the legal meaning/obligations described.

**Block/column id-reuse pattern** (lines 198-236, `blockId`/`columnId` captured after first locale's write, reused on subsequent locale writes) — identical discipline to every other Pages-doc script in this list.

---

### 7. Services index + 4 service landings + 2 geo-pages

**Analog (services):** `scripts/seed-phase19-service-pages.ts` (full file, 332 lines)
**Analog (geo):** `scripts/seed-phase20-geo-pages.ts` (full file, 249 lines) — "Structurally identical to seed-phase19-service-pages.ts" per its own header comment.

Both scripts share the **exact same `reapplyIds`/`upsertPage` helper pair** — this is the most mature and safest id-reuse implementation in the repo (handles blockType-mismatch detection with a warning instead of silent misattachment, which the Home/Contact/Legal scripts' hand-rolled per-block logic doesn't do).

**`reapplyIds` pattern — copy near-verbatim, this is the pattern to standardize on for this phase's new scripts:**
```typescript
function reapplyIds(
  freshLayout: Record<string, unknown>[],
  referenceLayout: Record<string, unknown>[] | undefined,
): Record<string, unknown>[] {
  if (!referenceLayout) return freshLayout
  return freshLayout.map((block, i) => {
    const refBlock = referenceLayout[i] as Record<string, unknown> | undefined
    if (!refBlock || refBlock.blockType !== block.blockType) {
      if (refBlock) console.warn(`reapplyIds: blockType mismatch at index ${i} ...`)
      return block
    }
    const withId: Record<string, unknown> = { ...block, id: refBlock.id }
    // + per-blockType nested-array id reuse: content.columns[], faq.faqs[], callToAction.links[]
    return withId
  })
}
```

**`upsertPage` pattern — find-by-slug, create in `es` if missing, then loop both locales:**
```typescript
async function upsertPage(payload, { slug, titleByLocale, buildLayout }) {
  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1 })
  let docId
  if (docs.length === 0) {
    const created = await payload.create({
      collection: 'pages', locale: 'es',
      data: { title: titleByLocale.es, slug, _status: 'published', content: { layout: buildLayout('es') } },
    })
    docId = created.id
  } else {
    docId = docs[0].id
  }
  const refetched = await payload.findByID({ collection: 'pages', id: docId, depth: 0 })
  const referenceLayout = refetched.content?.layout
  for (const locale of LOCALES) {
    const layoutWithIds = reapplyIds(buildLayout(locale), referenceLayout)
    await payload.update({ collection: 'pages', id: docId, locale, data: { title: titleByLocale[locale], content: { layout: layoutWithIds } } })
  }
}
```
For Phase 30, these pages already exist (confirmed live slugs: `services`, `seo-technical-audit`, `seo-consulting`, `fullstack-development`, `ai-seo-geo`, `seo-tecnico-madrid`, `seo-tecnico-lima`) — the `docs.length === 0` branch will never trigger; the rewrite script only needs the "already exists" path (`docId = docs[0].id`) plus the same `reapplyIds`/per-locale-update loop, called with the SAME slug and a NEW `buildLayout` function returning humanized copy instead of the original phase-19/20 copy.

**Confirmed live `content.layout` blockType order for `services` index:** `['hero', 'content', 'callToAction']` (matches `buildIndexLayout` in seed-phase19). Individual service landings and geo-pages follow `buildServiceLayout`/`buildGeoPageLayout`: `['hero', 'content', 'faq', 'callToAction']`.

**Fields to rewrite:** `hero.title`/`hero.subtitle` (variant `listing`, no `cityName`/`inlineStat` — those are `local-landing` variant fields from Phase 33/34, not used here), `content.columns[].richText` (Lexical, built via the same `lexicalWithHeading`/`lexicalParagraph` helpers as Legal pages), `faq.title`/`faqs[].question`/`faqs[].answer`, `callToAction.richText`/`links[].link.label`.

**Geo-page caution from VOICE-PROFILE (services/geo section):** "los datos locales (stats, testimonios) sean reales o estén marcados `[PLACEHOLDER]` — la humanización de copy no debe camuflar contenido de relleno como si fuera dato real." The 2 geo-pages (`seo-tecnico-madrid`/`seo-tecnico-lima`) don't currently carry a `LocalProofSection` block (that block was added in Phase 33/applied in Phase 34, confirmed separately in ROADMAP.md) — confirm during execution whether these Pages docs were updated by Phase 34 to include stats/testimonial content, and if so, treat any `[PLACEHOLDER]`-marked local stat as off-limits for humanization (don't rewrite placeholder markers as if they were real prose).

---

## Shared Patterns

### Lexical richText helper functions (used by Legal pages + Services/Geo pages)
**Source:** `scripts/seed-legal-pages.ts` lines 15-43 (`heading`/`paragraph`/`richTextDoc`) and `scripts/seed-phase19-service-pages.ts` lines 34-85 (`lexicalParagraph`/`lexicalWithHeading`) — near-identical, minor signature differences (single paragraph vs. heading+paragraphs list).
**Apply to:** Any script in this phase that rewrites a `richText` field (Privacy/Terms `Content.columns[].richText`, Services/Geo `Content.columns[].richText`, `CallToAction.richText`). Copy `lexicalParagraph`/`lexicalWithHeading` from `seed-phase19-service-pages.ts` as the more complete pair (handles both single-paragraph and heading+multi-paragraph cases).

### Block/array id-reuse discipline (universal across every Pages-doc script)
**Source:** documented independently in `seed-phase13-home-content.ts` (lines 20-31), `seed-contact-page.ts` (lines 88-90), `seed-legal-pages.ts` (lines 191-197), and formalized as a reusable helper in `seed-phase19-service-pages.ts`/`seed-phase20-geo-pages.ts` (`reapplyIds`).
**Apply to:** every script this phase writes that touches `pages.content.layout` (Home, Contact, Privacy, Terms, Services index + 4 landings, 2 geo-pages) — **prefer copying the `reapplyIds`/`upsertPage` pair from `seed-phase19-service-pages.ts`** over hand-rolling the Home/Contact/Legal scripts' earlier, less defensive per-block logic; it's the most recent and most robust version of this pattern in the repo, with mismatch detection instead of silent misattachment.
**Rule:** Payload full-replaces `array`/`blocks` type fields on every `update` call. Writing locale B's layout without echoing back locale A's already-assigned `id`s (top-level block ids AND nested sub-array ids like `columns[]`/`faqs[]`/`links[]`/`features[]`/`paragraphs[]`) creates duplicate rows server-side and silently orphans locale A's data. This is the exact same root-cause class of bug (unreused ids on array full-replace) that also caused the 2026-07-12 `DROP COLUMN` production incident at the migration/schema level — same discipline, different layer (content script here, schema migration there).

### Global (non-Pages) locale-write pattern
**Source:** `scripts/seed-header-footer-content.ts` (full file) — simpler than the Pages pattern, `payload.updateGlobal({ slug, locale, data })` once per locale, no id-reuse concern unless changing array length.
**Apply to:** Header, Footer rewrite scripts.

### Flat-collection locale-write pattern
**Source:** adapt `payload.find` + `payload.update({ collection, id, locale, data })` per-locale loop, same shape as the Pages/global patterns but without `content.layout` nesting.
**Apply to:** Authors, Testimonials, SpeakingEvents, Categories rewrite scripts (Clientes is a documented no-op, see above).

### Snapshot-before-rewrite discipline
**Source:** `scripts/content-humanization-snapshot.ts` (full file) — already built and tested in Phase 29, do not modify.
**Apply to:** run once at the start of Phase 30 execution (before any script in this phase writes anything) and once at the end, per the phase's own "verificación obligatoria" decision.

### Humanizer skill application (process pattern, not code)
**Source:** `~/.claude/skills/humanizer/SKILL.md` (per CLAUDE.md global HARD RULE) + `.planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md` + `research/voice-sample-juan.md`.
**Apply to:** every string literal written by any script in this phase, in both `es` and `en`, before it's passed into `payload.update`/`payload.updateGlobal`. This is a process step for whoever authors the copy (a `scripts/*-data/*.ts` copy module, following the `seed-phase19-data/group-a.ts` / `seed-phase20-data/copy.ts` convention of separating copy data from the update-runner script), not something to encode into the runner script itself.

## No Analog Found

| Content/Field | Role | Data Flow | Reason |
|---|---|---|---|
| Locale-parity verification script (success criterion 4) | verification script | batch read + diff | No existing script does a field-by-field es/en parity check — `content-humanization-snapshot.ts` only captures data, doesn't diff/assert. Build new, small: read every touched collection/global with `locale: 'all'`, and for every localized field assert both `es` and `en` keys are present and non-empty (flagging the already-found Header `ctaButton.label` collapse and Footer `sitemap.html` legalLink missing `en` as the first two known failures to fix). |
| Live JSON-LD / meta.title / meta.description curl verification (success criterion 5) | verification (manual/script) | request-response | No existing repo script curls live routes and validates JSON-LD/meta post-hoc for this specific purpose; Phase 25/28/32's Lighthouse/H1/JSON-LD baseline scripts (`scripts/lighthouse-mobile.mjs` and similar, per ROADMAP.md Phase 32) are the closest precedent for "curl + validate live route" tooling but weren't read in this pass (out of this phase's touched-file scope) — planner should check those for a reusable curl/validate harness before writing one from scratch. |

## Metadata

**Analog search scope:** `scripts/` (11 seed/content scripts read in full or targeted), `src/collections/` (Authors, Testimonials, Clientes, SpeakingEvents, Categories), `src/globals/` (Header, Footer, Llms), `.planning/phases/29-content-humanization-safety-net/` (29-FIELD-AUDIT.md, 29-VOICE-PROFILE.md), `research/voice-sample-juan.md`
**Files scanned:** 8 collection/global config files (full), 8 seed scripts (full), 1 snapshot script (full), 4 planning/research docs (full), plus one temporary read-only Local API script (written to `scripts/`, run once, deleted immediately after) to pull real live sample content for Header/Footer/Home/Authors/Services-index/page-slug-inventory
**Pattern extraction date:** 2026-07-14
**Live-data findings surfaced during mapping (flag for planner, not resolved here):**
1. Header's live `navItems` has 5 entries (adds a `/services` link), not the 4 the original seed script wrote — treat live DB as source of truth, not the seed script.
2. Header's `ctaButton.label` is `"Get in Touch"` in BOTH `es` and `en` live — a real locale-collapse bug (ES was never actually set to "Hablemos"), to fix as part of this phase's rewrite + parity verification.
3. Footer's live `legalLinks` has a 3rd entry (`/sitemap.html` → "Sitemap") with only an `es` label, no `en` value at all — another real parity gap to fix in this phase.
4. Live `pages` slugs confirmed via query: `home, contact, privacy, terms, blog (not in scope), services, seo-technical-audit, seo-consulting, fullstack-development, ai-seo-geo, seo-tecnico-madrid, seo-tecnico-lima` — all 4 service landing slugs and both geo slugs exist and are populated (Phase 19/20 already ran), so this phase's scripts only need the "page already exists" update path, never the "create" path.
