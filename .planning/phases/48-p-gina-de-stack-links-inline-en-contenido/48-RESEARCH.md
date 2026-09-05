# Phase 48: Página de Stack + Links Inline en Contenido - Research

**Researched:** 2026-09-04
**Domain:** Payload CMS block registration (Postgres adapter), Lexical `BlocksFeature` inline blocks, Next.js App Router content routing, affiliate-link rendering
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Contenido real por herramienta (fuente: Juan, 2026-09-04):**
- **DinoRANK** — afiliado activo. Uso: más barato que otras herramientas SEO, buena suite, le gusta el redactor de contenido, usa su investigación de keywords para contrastar con otras herramientas. Pro: precio/funcionalidad, redactor de contenido. Contra: la IA de investigación de keywords no funciona del todo; el mapa de SEO local demora mucho en generarse. Case study: los 7 case studies.
- **Hostinger** — Referral, sin umbral (link de afiliado pendiente, Juan lo envía después). Uso: hosting predilecto, todos sus clientes están alojados ahí. Pro: velocidad, precios accesibles, configuración libre. Contra: ninguno reportado — no inventar uno; si el bloque de contras es obligatorio, dejar vacío o "sin quejas reales hasta ahora". Case study: case study 4 (`migracion-ecommerce-nextjs-seo-tecnico`).
- **DigitalOcean** — sin postular todavía, sin link de afiliado aún. Uso: VPS específico para clientes, fácil de configurar y rápido. Pro: facilidad de uso/configuración, rapidez. Contra: número limitado de centros de datos. Sin case study público — excepción documentada a STACK-06: enlaza a `/servicios/fullstack-development`.
- **Kinsta** — sin postular todavía, sin link de afiliado aún. Uso: hostear BD de proyectos personales, hosting WordPress, proyectos universitarios temporales. Pro: muy rápido (GCP), staging incluido. Contra: caro, limitado para WordPress. Sin case study público — misma excepción, enlaza a `/servicios/fullstack-development`.
- **DataForSEO** — afiliado activo (corrige research de Phase 44 que decía "sin programa público"). Uso: research en bulto, API para aplicaciones locales de keyword data para clientes. Pro: los tokens no vencen. Contra: recarga mínima $50. Case study: los 7 case studies.
- **Payload** — sin programa de afiliados, link directo. Uso: CMS moderno, alternativa a WordPress. Pro: permite optimizar sitios al máximo. Contra: curva de aprendizaje alta, mantenimiento a código. Case study: case study 4.
- **Cloudinary** — programa de créditos por referido, NO comisión en dinero (tratar igual como material connection para disclosure, sin decir "pagan comisión"). Uso: almacenar/editar imágenes on-the-fly, genera las OG images. Pro: edición on-the-fly. Contra: no reportado, no fabricar uno. Case study: case study 4.
- **Resend** — sin programa de afiliados, link directo. Uso: manejo de correos, tier gratuito bueno. Pro: fácil de implementar, buena velocidad/entrega. Contra: Juan no ha aprendido las automatizaciones de email marketing. Case study: case study 4.
- **Ahrefs** — sin programa de afiliados (cerrado, confirmado Phase 44), link directo. Uso: onboarding de proyectos de clientes. Contra: muy caro. Case study: los 7 case studies.
- **Amazon** — afiliado activo, sección "Gear" separada dentro de `/stack` (un solo segmento, sin ruta nueva, sin case study — productos personales). 13 links `amzn.to` que DEBEN resolverse a URL directa con `tag=juantech02-20` visible antes de publicar (Amazon prohíbe acortadores/cloaking): AMD RYZEN 7 9800X3D, Samsung SSD 990 PRO 2TB, CORSAIR Vengeance DDR5 32GB, MSI MAG B850 Tomahawk MAX, Fractal Design North Chalk White, ARCTIC MX-7, Apple 2022 MacBook Air M2, ASUS Prime GeForce RTX 5070, MSI PRO A1000PL PCIE5, Noctua NH-D15 G2, Logitech G305, Logitech G435, LG UltraWide Monitor 29U511A, Amazon Prime (mención, no producto).
- **Cursor, Claude/OpenAI, Sitebulb** — omitidos por decisión de Juan, no agregar sin confirmación futura.
- **Bloques obligatorios:** "Qué elegiría hoy si empezara de cero" (DataForSEO+DinoRANK, Hostinger, GSC/Ahrefs free/GA4, Payload/Astro/WordPress según caso, Resend/Cloudinary free tiers); recomendación destacada sin comisión = Google Search Console; negativos honestos ya cubiertos por herramienta arriba.
- **Constraints duras del ROADMAP:** `/stack` usa segmento único compartido en ambos locales, sin tocar `sitemap-data.ts`/`canonical.ts`/`breadcrumbs.ts`; la página NO entra al nav principal (se reevalúa a los 90 días); sin tablas de precios, sin roundups "las mejores", sin ordenar por comisión; links de Amazon salen directos, `/go/` solo para el resto; nunca emitir `/go/undefined`.

### Claude's Discretion
- Estructura visual exacta del bloque `ToolStack` (cards, grupos por categoría, orden) — resuelto por 48-UI-SPEC.md (checker-approved), este research sigue esa forma.
- Agrupación de herramientas (por categoría de uso vs. programa de afiliado vs. orden de aparición) — resuelto por 48-UI-SPEC.md.
- Redacción exacta ES/EN de cada bloque de 100+ palabras, partiendo del contenido crudo, pasada por humanizer antes de publicar — pendiente de ejecución, no de research.
- Nombres exactos de campos Payload para `ToolStack`/`AffiliateInlineBlock` — "el planner's call", per UI-SPEC; este research ofrece un shape ilustrativo (ver Code Examples), no un contrato final.

### Deferred Ideas (OUT OF SCOPE)
- Cursor, Claude/OpenAI, Sitebulb como herramientas del stack.
- Nav principal para `/stack` — reevaluar a los 90 días con Search Console.
- Resolver la ambigüedad de red de DigitalOcean (CJ vs. Impact) — se resuelve al postular, fuera de esta fase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STACK-01 | Bloque `ToolStack` + página `/stack` en ambos locales bajo segmento único, sin tocar `sitemap-data.ts`/`canonical.ts`/`breadcrumbs.ts` | Pattern 3 (new route file precedent) + verified zero-diff reading of all 3 forbidden files; Pitfall 1 flags the migration this constraint does NOT cover |
| STACK-02 | ≥100 palabras de experiencia propia por herramienta y locale, sin copy de fabricante ni specs | Code Examples (word-count enforcement decision); `ToolStack.tools[].narrative` field shape in the block config skeleton |
| STACK-03 | Bloque "qué elegiría hoy si empezara de cero" | `ToolStack.elegiriaHoy` field + `StackHighlightCallout` component contract (UI-SPEC, verified) |
| STACK-04 | Recomendación destacada sin comisión + negativos honestos | `ToolStack.noCommissionPick` relationship to the GSC `affiliate-links` doc (Pattern 5, GSC carve-out); `tools[].con` nullable field |
| STACK-05 | Enlace desde footer y página de autor, fuera del nav principal | `Footer.legalLinks` admin-authored array (verified, zero code change) + `authors/[slug]/page.tsx` hardcoded link precedent (verified) |
| STACK-06 | Cada herramienta enlaza al case study o servicio real | Pattern 4 (`referenceLink` field shape) + security note on `overrideAccess: false` |
| INL-01 | Inline block de afiliado en Posts, mismo `rel`, sin migración de esquema | Pattern 2 (`BlocksFeature` on jsonb column, verified zero-DDL) + TDZ hazard guidance |
| INL-02 | Disclosure auto-inyectado antes del primer link de afiliado, escaneo puro del editor state | UI-SPEC's editor-state-scan contract (referenced, not re-derived) — `hasAmazonLinks` computed by checking `post.content` nodes for `blockType === 'affiliate-inline'` with `program === 'amazon'` |
</phase_requirements>

## Summary

Phase 48 builds on top of Phase 46 (`affiliate-links` collection, `AffiliateLink`, `AffiliateDisclosure`) and Phase 47 (`/go/[slug]` route) to render two surfaces: a new `/stack` page built from a new `ToolStack` Payload block, and a new Lexical inline block (`affiliate-inline`) usable inside `posts.content`. Both are UI/content work — Phase 46/47 already did the schema and routing plumbing this phase consumes.

The single most important correction this research makes to the CONTEXT.md/UI-SPEC framing: **this phase is NOT migration-free.** Registering `ToolStack` as a new block in `Pages.content.layout` (a Payload `blocks`-type field on the Postgres adapter) generates new relational tables, exactly like every prior new-block addition in this repo (`LocalProofSection` in Phase 33, `CodeFixesBlock`/`AuditOfferBlock` in the home-code-fixes migration, `BlogCategoryRows`, `NewsletterBlock` — every one of these shipped with its own `payload migrate:create` migration file). The confusion in CONTEXT.md/the ROADMAP's success criterion #5 comes from conflating this with **INL-01's** genuinely correct "no migration" claim, which applies **only** to the Lexical inline block, because `posts.content` is a single `jsonb` column `[VERIFIED: src/migrations/20260709_191127_initial.ts:564]` — Lexical `BlocksFeature` nodes are just JSON inside that column, so adding `affiliate-inline` as a Lexical feature needs zero DDL. The `ToolStack` **Pages** block and the **Lexical** `affiliate-inline` block are architecturally different mechanisms with opposite migration requirements, and the plan must not merge them into one "no migration" umbrella claim.

The second correction: there is no generic `[locale]/[slug]/page.tsx` catch-all in this codebase `[VERIFIED: src/app/(frontend)/[locale]/ directory listing]`. Every `pages`-collection-backed route (Home, and by the same pattern any future one) is its own hand-written route file that calls `getCachedPageBySlug()` + `RenderBlocks` + `buildAlternates`/`buildOpenGraph`. `/stack` needs a **new** `src/app/(frontend)/[locale]/stack/page.tsx` file, built by copying the Home page's pattern almost verbatim. This does NOT violate STACK-01's "don't touch `sitemap-data.ts`/`canonical.ts`/`breadcrumbs.ts`" constraint — those three files are already fully generic for any `pages` doc with a plain slug and require zero edits, confirmed by reading each one directly (see Architecture Patterns below). The constraint is about not **editing** those 3 files, not about there being a magic shared route.

Third, the `affiliate-links` collection (Phase 46) is missing `pro`/`con`/`referenceLink` fields the UI-SPEC's `ToolCard` needs — but per the UI-SPEC's own Component Contract Detail, these fields belong on the **`ToolStack` block's `tools[]` array** (page-editorial content), not on `affiliate-links` itself. That means no change to the `affiliate-links` schema is needed for STACK-02/03/04/06 — the new fields are part of the `ToolStack` block's own config, and their migration is the same one that creates the block's tables in the first place (no second migration).

**Primary recommendation:** Plan two Payload-config changes with two distinct migration realities — (1) `ToolStack` block registration on `Pages` **requires** a `payload migrate:create` + read + apply cycle (additive, non-destructive, no Juan confirmation needed per CLAUDE.md's hard rule, but it is a real migration the plan must include as a task) — and (2) the Lexical `affiliate-inline` `BlocksFeature` registration on `Posts.content` needs **zero** migration. Build `/stack/page.tsx` from scratch following the Home page's `getCachedPageBySlug` + `RenderBlocks` + `buildAlternates` pattern.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `/stack` page routing, metadata, canonical/hreflang | Frontend Server (SSR, App Router) | Database (Payload/Postgres) | New route file reads a `pages` doc and calls existing generic SEO helpers — same tier as every other content page in this repo |
| `ToolStack` block schema + admin editing | API/Backend (Payload collection config) | Database (Postgres, via migration) | New `blocks`-array member on `Pages`, normalized into new Postgres tables by `@payloadcms/db-postgres` |
| Tool card CTA resolution (direct vs `/go/`) | Frontend Server (Server Component) | — | Pure render-time decision reading `affiliateLink.program`/`slug`, no client JS, per `AffiliateLink.tsx`'s existing "cero JS de cliente" contract |
| Inline affiliate block in posts | API/Backend (Lexical `BlocksFeature` on existing jsonb column) | Frontend Server (JSX converter) | No new DB structure — content lives inside the already-existing `posts_locales.content` jsonb blob |
| Amazon gear links | Frontend Server (static block data, no collection) | — | Per 48-CONTEXT.md, gear items are NOT `affiliate-links` docs; they are literal `href` strings stored as `ToolStack.gearItems[]` sub-fields, rendered directly through `AffiliateLink` |
| Footer / Author-page links to `/stack` | API/Backend (existing admin-authored arrays) | — | `Footer.legalLinks` is already a CMS array; author page link is a hardcoded JSX addition, both zero-migration |

## Standard Stack

No new npm packages this phase — see Package Legitimacy Audit below (empty by design).

### Core (already installed, reused as-is)
| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `payload` | 3.85.x `[VERIFIED: package.json via project CLAUDE.md]` | Block/collection config for `ToolStack` | Already the project's CMS |
| `@payloadcms/richtext-lexical` | 3.85.x | `BlocksFeature` for the inline affiliate block | Already installed, `BlocksFeature`/`lexicalEditor` already imported elsewhere in the repo (`Content/config.ts`, `CallToAction/config.ts`) `[VERIFIED: src/blocks/Content/config.ts:1-9]` |
| `next-intl` | 4.13.x | Locale routing for `/stack` and `/en/stack` | `routing.ts` uses `localePrefix: 'as-needed'` with no per-route `pathnames` map `[VERIFIED: src/i18n/routing.ts]` — a new folder under `[locale]/` works automatically, no config change |

### Alternatives Considered
None — this phase is pure composition of already-adopted primitives (shadcn `Card`/`Badge`/`buttonVariants`, already-registered `AffiliateLink`/`AffiliateDisclosure`, already-registered `RenderBlocks`/`blockComponents`). No new library decision to make.

**Installation:** None required.

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** No `npm install` step exists in this plan. `BlocksFeature`, `lexicalEditor`, all shadcn primitives, and every helper this phase consumes (`buildAlternates`, `buildBreadcrumbJsonLd`, `getCachedAffiliateLinks`, `pickDestination`, `AffiliateLink`, `AffiliateDisclosure`) are already present in the repo from Phases 1–47.

## Architecture Patterns

### System Architecture Diagram

```
Editor (Payload admin)
  │
  ├─ writes a `pages` doc, slug='stack', containing a `ToolStack` block
  │     (categoryGroups[].tools[] → each optionally links an `affiliate-links` doc)
  │
  ├─ writes `affiliate-links` docs (Phase 46, already exists) for tools
  │     WITH a live/pending program (DinoRANK, DataForSEO, Hostinger, DigitalOcean,
  │     Kinsta, GSC-no-commission, Payload, Cloudinary, Resend, Ahrefs)
  │
  └─ writes a Lexical `affiliate-inline` block inside a Post's `content` (jsonb),
        referencing one `affiliate-links` doc

Visitor request → GET /stack (or /en/stack)
  │
  ├─ src/app/(frontend)/[locale]/stack/page.tsx  (NEW FILE)
  │     ├─ getCachedPageBySlug('stack', locale)        → pages doc + ToolStack block data
  │     ├─ generateMetadata(): buildOpenGraph + buildAlternates('/stack','/en/stack')
  │     ├─ inline trail array → buildBreadcrumbJsonLd()  (no breadcrumbs.ts edit)
  │     └─ <RenderBlocks blocks={doc.content.layout} />
  │           └─ blockComponents['toolStack'] → ToolStackComponent
  │                 ├─ AffiliateDisclosure (framed, hasAmazonLinks=true always)
  │                 ├─ ToolCard × N   (per categoryGroups[].tools[])
  │                 │     └─ CTA slot: AffiliateLink→/go/{slug} | Badge(outline) | plain link (GSC)
  │                 ├─ GearCard × 13  (gearItems[], AffiliateLink→direct amzn full URL)
  │                 └─ StackHighlightCallout × 2 ("elegiría hoy" / no-commission pick)
  │
Visitor request → GET /go/{slug}  (Phase 47, unchanged)
  │
  └─ resolves via getCachedAffiliateLinks()+pickDestination(), 302 no-store, after() logs click

Visitor reads a Post with the inline block
  │
  └─ RichTextRenderer → richTextConverters.blocks['affiliate-inline']
        └─ AffiliateInlineCard (reads related affiliate-links doc's tagline/ctaLabel/destinations)
        AND (computed by a pure editor-state scan, INL-02) → AffiliateDisclosure mount
        immediately after byline, before <RichText> body
```

### Recommended Project Structure (new files only)
```
src/
├── app/(frontend)/[locale]/
│   └── stack/
│       └── page.tsx                    # NEW — copy Home page's pattern
├── blocks/
│   └── ToolStack/
│       ├── config.ts                   # NEW — Payload block config, registered in Pages
│       └── Component.tsx               # NEW — server component, exported for blockRegistry.tsx
├── components/
│   ├── ToolCard.tsx                    # NEW
│   ├── GearCard.tsx                    # NEW
│   ├── StackHighlightCallout.tsx       # NEW
│   └── AffiliateInlineCard.tsx         # NEW — Lexical leaf, no RichTextRenderer/AffiliateDisclosure import
├── blocks/
│   └── AffiliateInlineBlock/
│       └── config.ts                   # NEW — Payload Block config for BlocksFeature (Lexical, not Pages)
└── migrations/
    └── <timestamp>_phase48_tool_stack_block.ts   # NEW — additive, generated by `payload migrate:create`
```

### Pattern 1: Registering a new Pages block (STACK-01, ToolStack)

**What:** Add the block's config to `Pages.content.layout.blocks[]` and to the `blockComponents` render registry, then generate a migration.
**When to use:** Any time a new block type is added to a Postgres-backed `blocks` field.
**Verified current wiring** (both files read in full this session):

```typescript
// Source: src/collections/Pages/index.ts (read in full, 2026-09-04)
// Current blocks array has 26 entries (NOT "12-14" — that count is from
// Phase 1's original scope; the array has grown across 47 phases). Add
// ToolStack as entry #27, same import + array-push pattern as every entry
// already there:
import { ToolStack } from '@/blocks/ToolStack/config'
// ...
blocks: [
  Hero, Content, ArchiveBlock, CallToAction, FAQ, MediaBlock,
  TestimonialsCarousel, ContactFormBlock, Code, RelatedPosts,
  TableOfContentsBlock, ResultsSection, Section, FeaturedPostsBlock,
  FeaturedCaseStudiesBlock, FeaturedWebsitesBlock, ClientLogosBlock,
  AboutSection, ServicesShowcase, ServiceScopeCard, RelatedCaseStudyBlock,
  LocalProofSection, CodeFixesBlock, AuditOfferBlock, BlogCategoryRows,
  NewsletterBlock,
  ToolStack, // NEW
],
```

```typescript
// Source: src/blocks/blockRegistry.tsx (read in full, 2026-09-04)
// blockComponents is a flat Record<blockType, Component> — blockType is the
// block's `slug` in camelCase (e.g. 'toolStack'), NOT the interfaceName.
import { ToolStackComponent } from '@/blocks/ToolStack/Component'
export const blockComponents: Record<string, (props: any) => ReactNode> = {
  // ...existing 26 entries...
  toolStack: ToolStackComponent, // NEW
}
```

**Migration reality (verified, not assumed):** Three prior new-block additions each shipped their own migration file, confirmed by directly matching migration filenames to block names:
- `LocalProofSection` (Phase 33) → `src/migrations/20260714_023126_phase33_local_landing_components.ts`, which creates `pages_blocks_local_proof_section`, `pages_blocks_local_proof_section_stats`, and their `_locales` tables `[VERIFIED: src/migrations/20260820_155934_subscribers_collection.json:6699-6858, grepped table names from the schema snapshot]`
- `CodeFixesBlock`/`AuditOfferBlock` → `src/migrations/20260819_195425_home_code_fixes_audit_offer.ts` (filename itself names both blocks)
- `BlogCategoryRows` → three dedicated migrations (`20260820_000041_blog_promo_and_category_rows.ts`, `20260820_001837_..._rail.ts`, `20260820_153557_..._by_category.ts`)

`ToolStack` will follow the identical pattern: `payload migrate:create` after adding the block config, read the generated SQL (expect only `CREATE TABLE`/`ADD COLUMN`, no `DROP`), apply against the real Dokploy Postgres per `CLAUDE.md`'s Database Safety section. This is additive/non-destructive, so per CLAUDE.md's 2026-07-12 hard rule it does **not** need Juan's named approval before running — but the plan MUST include this as an explicit task, not skip it as "no schema change."

### Pattern 2: Lexical `BlocksFeature` inline block (INL-01, zero migration)

**What:** Register a new Lexical block type inside a `richText` field's `editor` config.
**When to use:** Content that needs to live inline within prose (vs. as a page-level block).
**Verified:** `posts.content` is `jsonb` `[VERIFIED: src/migrations/20260709_191127_initial.ts:564: `"content" jsonb,`]`. Any Lexical feature — `HeadingFeature`, `EXPERIMENTAL_TableFeature`, or a new `BlocksFeature` — changes only what shape of JSON that column can contain, never the column's own DDL. Two existing precedents (`Content/config.ts`, `CallToAction/config.ts`) already use the exact override shape needed:

```typescript
// Source: src/blocks/Content/config.ts (read in full) — same shape UI-SPEC
// requires for Posts/index.ts:56, applied there for the first time.
editor: lexicalEditor({
  features: ({ rootFeatures }) => {
    return [
      ...rootFeatures,
      BlocksFeature({ blocks: [AffiliateInlineBlock] }), // NEW for Posts
    ]
  },
}),
```

**Current state of `posts.content`** `[VERIFIED: src/collections/Posts/index.ts, read in full]`: today it is a bare `editor: lexicalEditor()` with **no** feature override at all — confirming UI-SPEC's "applied to Posts/index.ts:56 for the first time" is accurate. There is no existing `BlocksFeature` registration anywhere in this repo yet `[VERIFIED: grep -rln "BlocksFeature" src/ → only match is the converter file's prose, not an actual registration]`.

**TDZ/circular-import hazard (read in full):** `src/components/richTextBlockConverters.tsx`'s docblock documents that `code-block`/`faq` are Lexical nodes that survived the Mongo migration **without ever being registered via `BlocksFeature`** — they're read straight off raw JSON with hand-typed shapes, specifically so `FAQBlockNode`'s renderer never has to import `RichTextRenderer` (which imports this same converters file — a cycle that already caused one production TDZ `ReferenceError` in `src/lib/sitemap-data.ts`'s unrelated but structurally identical circular-import bug). The new `affiliate-inline` converter must follow the same constraint: import only `AffiliateLink` and static UI (`Badge`, `buttonVariants`) into `AffiliateInlineCard.tsx` — never `AffiliateDisclosure` (which itself is fine to import elsewhere, but importing it from inside a Lexical block converter re-opens the same cycle if `AffiliateDisclosure` or its transitive imports ever touch `RichTextRenderer`).

```typescript
// Source: src/components/richTextBlockConverters.tsx (read in full) — add
// alongside the existing 'code-block'/'faq' entries, same pattern:
blocks: {
  'code-block': ({ node }) => <CodeBlockNode {...node.fields} />,
  faq: ({ node }) => <FaqBlockNode {...node.fields} />,
  'affiliate-inline': ({ node }) => <AffiliateInlineCard {...node.fields} />, // NEW
},
```

Unlike `code-block`/`faq`, the new `affiliate-inline` block SHOULD be registered via `BlocksFeature` (there is no legacy-migration reason to avoid it here — `code-block`/`faq` avoid registration only because they're reading pre-existing migrated JSON whose shape predates any current schema). Registering `affiliate-inline` properly gives the admin editor UI and generates a `payload-types.ts` type for it — but this is still zero-DDL, because `BlocksFeature` registration is a TypeScript/admin-UI concern, not a database one (again: `posts.content` is jsonb regardless of what Lexical features are declared).

### Pattern 3: New route file for a `pages`-doc page (`/stack`)

**What:** A hand-written route under `[locale]/`, not a generic `[slug]` catch-all (none exists).
**Verified absence:** `[VERIFIED: directory listing of src/app/(frontend)/[locale]/]` — only `page.tsx` (home) and named folders (`authors`, `blog`, `case-studies`, `contact`, `privacy`, `search`, `seo-tecnico-lima`, `seo-tecnico-madrid`, `services`, `servicios`, `terms`, `websites`) exist. There is no `[slug]/page.tsx`.
**Exact precedent to copy** (Home page, read in full):

```typescript
// Source: src/app/(frontend)/[locale]/page.tsx (read in full) — adapt for stack
export const revalidate = 60
export function generateStaticParams(): Array<{ locale: string }> {
  return []
}
async function getStackPage(locale: string) {
  return getCachedPageBySlug('stack', locale as 'es' | 'en')
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getStackPage(locale)
  const meta = doc?.meta
  return {
    title: pageTitle(meta?.title ?? doc?.title ?? 'My stack'),
    description: meta?.description ?? '',
    openGraph: buildOpenGraph({
      title: meta?.title ?? doc?.title ?? '',
      description: meta?.description ?? '',
      url: locale === 'en' ? '/en/stack' : '/stack',
      locale: locale as 'es' | 'en',
      slug: 'stack',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/stack', '/en/stack'),
  }
}
export default async function StackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getStackPage(locale)
  if (!doc) notFound()
  const trail = [
    { label: locale === 'es' ? 'Inicio' : 'Home', url: locale === 'es' ? '/' : '/en' },
    { label: locale === 'es' ? 'Mi stack' : 'My stack', url: locale === 'es' ? '/stack' : '/en/stack' },
  ]
  return (
    <main>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <RenderBlocks blocks={doc.content?.layout ?? []} />
    </main>
  )
}
```

**Why the 3 forbidden files stay untouched (verified by reading each in full):**
- `src/lib/sitemap-data.ts`: for `collection === 'pages'` and a slug that is neither the services index nor a service landing, the generic `else` branch already computes `esUrl = SITE_URL/stack`, `enUrl = SITE_URL/en/stack` automatically `[VERIFIED: src/lib/sitemap-data.ts:186-192, quoted: "const path = prefix === '' ? (doc.slug !== 'home' ? doc.slug : '') : \`${prefix}/${doc.slug}\`" then "esUrl = path ? \`${SITE_URL}/${path}\` : SITE_URL" / "enUrl = path ? \`${SITE_URL}/en/${path}\` : \`${SITE_URL}/en\`"]` — a `stack` doc needs zero special-casing here, it already falls through the generic branch every other content page uses.
- `src/lib/canonical.ts`: `buildAlternates(locale, esPath, enPath)` is already a pure, generic function taking explicit paths `[VERIFIED: src/lib/canonical.ts, read in full — signature `export function buildAlternates(locale: Locale, esPath: string, enPath: string, options?: {...})`]`; the new page just calls it with `'/stack'`/`'/en/stack'`, same as every other route file.
- `src/lib/breadcrumbs.ts`: exports `buildBreadcrumbJsonLd(trail: BreadcrumbItem[])`, a pure function accepting a plain array `[VERIFIED: src/lib/breadcrumbs.ts:182-193]` — `/stack`'s 2-level trail (Home → Mi stack) is built as a literal inline array in `page.tsx`/`ToolStack/Component.tsx`, exactly as UI-SPEC specifies, with zero new exported helper and zero edit to this file.

### Pattern 4: `referenceLink` field shape (STACK-06) — reuse the repo's existing "internal ref OR custom URL" idiom

The repo already has this exact shape in two forms:
1. `src/fields/link.ts` — a reusable `link()` field factory: `type: 'radio'` (`reference`/`custom`) + conditional `relationship` (currently `relationTo: ['pages', 'posts']`, would need `case-studies` added) + conditional `text` URL, used by `Content`/`CallToAction` blocks `[VERIFIED: src/fields/link.ts, read in full]`.
2. `src/blocks/RelatedCaseStudyBlock/config.ts` — a plain, unconditional `relationship` field with `relationTo: 'case-studies'` `[VERIFIED: src/blocks/RelatedCaseStudyBlock/config.ts:26-30]`.

For `ToolStack.tools[].referenceLink`, the simplest correct shape (matching the DigitalOcean/Kinsta exception in 48-CONTEXT.md, which needs BOTH a case-study relationship AND a plain custom href to `/servicios/fullstack-development`) is a small bespoke group mirroring `link.ts`'s toggle without its unneeded `label`/`newTab`/`appearance` fields:

```typescript
{
  name: 'referenceLink',
  type: 'group',
  fields: [
    { name: 'type', type: 'radio', defaultValue: 'caseStudy',
      options: [{ label: 'Case study', value: 'caseStudy' }, { label: 'Custom URL', value: 'custom' }] },
    { name: 'caseStudy', type: 'relationship', relationTo: 'case-studies',
      admin: { condition: (_, sibling) => sibling?.type === 'caseStudy' } },
    { name: 'url', type: 'text',
      admin: { condition: (_, sibling) => sibling?.type === 'custom' } },
  ],
}
```

**Security note (verified against Phase 50's audit target):** if the `ToolStack` component re-fetches the related `case-studies` doc server-side to resolve its href/title (the way `RelatedCaseStudyBlockComponent` does), it MUST pass `overrideAccess: false` explicitly `[VERIFIED: src/blocks/RelatedCaseStudyBlock/Component.tsx:29-35, comment: "SECURITY (mirrors 24-REVIEW WR-02 / services-data.ts precedent): Local API bypasses read: authenticatedOrPublished by default"]` — Phase 50's GATE-01 requirement #4 will grep every `payload.find(`/`payload.findByID(` added this milestone for exactly this.

### Pattern 5: Amazon direct rendering vs. `/go/` (item 4 of the research brief)

`AffiliateLink` takes a plain `href` prop and applies no logic of its own — the CALLER decides the URL `[VERIFIED: src/components/AffiliateLink.tsx, read in full — component signature is `{ href, children, className }`, no branching]`. Confirmed division of responsibility:
- **Gear items (Amazon):** `ToolStack.gearItems[].href` is a plain `text` field holding the already-resolved full Amazon product URL with `tag=juantech02-20` (never the `amzn.to` shortlink, per 48-CONTEXT.md). `GearCard` renders `<AffiliateLink href={item.href}>`. No `affiliate-links` doc, no `pickDestination()`, no `/go/` — confirmed correct by 48-CONTEXT.md's explicit statement that gear items are "productos personales, no herramientas de servicio a clientes" and never modeled as affiliate-links docs.
- **Active-program tools (DinoRANK, DataForSEO, etc.):** `ToolCard`'s CTA resolves `href="/go/{affiliateLink.slug}"` — the tool's `affiliate-links` doc IS resolved via `getCachedAffiliateLinks()`/relationship, but the actual redirect logic (`pickDestination`, 302, click logging) lives entirely inside `/go/[slug]/route.ts`, unchanged by this phase, per Phase 47's own "Next Phase Readiness" note: *"Phase 48 solo necesita renderizar el href="/go/{slug}", sin tocar middleware ni schema"* `[VERIFIED: .planning/phases/47-.../47-01-SUMMARY.md:197]`.
- **GSC (no-commission pick):** no CTA at all — a plain, non-accent, non-`sponsored` link straight to `search.google.com/search-console`, per UI-SPEC's explicit carve-out (GSC is modeled as an `affiliate-links` doc only so the relationship field works uniformly, but its card renders neither a button nor the "pending" badge).

### Anti-Patterns to Avoid
- **Treating "no migration" as a whole-phase property:** it is true only for INL-01/02 (jsonb-backed Lexical content). The `ToolStack` Pages block needs a real migration. Planning zero migration tasks for this phase would leave the block unregistered against the real Postgres schema.
- **Building a second `/go/`-equivalent inside `ToolCard`/`GearCard`:** both must call the existing `AffiliateLink` leaf with a computed `href`, never re-implement `rel`/redirect logic — this is the exact "second implementation with its own rel" pitfall the ROADMAP's Phase 48 rationale explicitly names.
- **Importing `AffiliateDisclosure` or `RichTextRenderer` from `AffiliateInlineCard.tsx`:** re-opens the documented TDZ hazard.
- **Sorting `tools[]` by `affiliateLink != null` or commission:** UI-SPEC explicitly forbids this — order must be the raw editorial array order (drag-and-drop in admin).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canonical/hreflang for `/stack` | A stack-specific canonical helper | `buildAlternates(locale, '/stack', '/en/stack')` from `canonical.ts` | Already generic, already used by 6+ routes |
| Breadcrumb JSON-LD | A `buildStackTrail()` wrapper in `breadcrumbs.ts` | Literal inline `BreadcrumbItem[]` + existing `buildBreadcrumbJsonLd()` | UI-SPEC explicitly documents this is the correct, lower-footprint choice for a 2-level trail with no reusable "section" |
| Internal-ref-or-custom-URL field | A new ad-hoc field type from scratch | Adapt `src/fields/link.ts`'s toggle idiom | Established, reviewed pattern already in 2 blocks |
| Affiliate CTA `rel`/redirect | Any new redirect route or client-side rel logic | Existing `AffiliateLink` + `/go/[slug]` (Phase 46/47) | Rebuilding this is precisely how a `sponsored`-less anchor slips through, per the ROADMAP's own stated risk |

**Key insight:** every piece of infrastructure this phase needs except the `ToolStack` block/route/components already exists and is verified working in production (Phase 46/47). The actual net-new surface is small: one Payload block, one Lexical block, 4 new React components, one route file, and content.

## Runtime State Inventory

Not a rename/refactor/migration phase in the CLAUDE.md sense (no renamed identifiers, no data migration) — this section is included anyway because the phase DOES touch schema (the `ToolStack` block registration), so the 5 categories are answered explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no existing rows reference a not-yet-existing `stack` slug or `toolStack` blockType | None |
| Live service config | None — Amazon Associates account/link generation happens outside this codebase (Juan's Amazon dashboard); the 13 `amzn.to` shortlinks must be resolved to full URLs with `tag=juantech02-20` **before** they're written into the `ToolStack.gearItems[]` content (a one-time manual/scripted resolution step, not a code change) | Resolve+verify each of the 13 `amzn.to` links to its full product URL with the tag visible, before content-write task |
| OS-registered state | None | None |
| Secrets/env vars | None — no new env var introduced this phase | None |
| Build artifacts | None — `payload generate:types` will need re-running after the `ToolStack`/`AffiliateInlineBlock` config lands, to regenerate `payload-types.ts` (routine, not a stub) | Run `payload generate:types` as part of the block-registration task |

## Common Pitfalls

### Pitfall 1: Assuming the whole phase is migration-free because INL-01 says so
**What goes wrong:** Plan ships without a `payload migrate:create` task for `ToolStack`, then the admin panel throws or silently fails to persist `ToolStack` blocks against a Postgres schema that has no matching tables.
**Why it happens:** ROADMAP's Success Criterion #5 ties "sin migración nueva" to the inline-block criterion specifically, but the phrase is easy to over-generalize to the whole phase, especially since CONTEXT.md's framing ("ToolStack is content in a pages block... not new top-level collections") sounds migration-adjacent but isn't the same claim.
**How to avoid:** Explicit migration task for the `ToolStack` block registration; explicit "no migration, jsonb" note for INL-01/02 in the plan so a checker doesn't flag the migration task as scope creep.
**Warning signs:** `git diff migrations/` empty after adding `ToolStack` to `Pages.content.layout.blocks[]` — that is a bug, not a pass.

### Pitfall 2: `/go/undefined` from an unresolved `affiliateLink` relationship
**What goes wrong:** If `ToolCard`'s CTA builds `href={`/go/${tool.affiliateLink.slug}`}` without checking `tool.affiliateLink` is non-null AND populated (depth), a `null` relationship or an unpopulated ID renders `/go/undefined` — a hard constraint violation per 48-CONTEXT.md.
**Why it happens:** `tools[].affiliateLink` is explicitly nullable (drives the "no affiliate yet" chip state for DigitalOcean/Kinsta) — the null case is the common case for 2 of the ~10 tools, not an edge case.
**How to avoid:** The 3-state CTA logic (active / no-affiliate-yet / GSC-style-plain) must branch on `tool.affiliateLink == null` FIRST, before ever reading `.slug`. Verify `getCachedPageBySlug('stack', locale)` is called with sufficient `depth` (Payload's Local API default is 2) so `tools[].affiliateLink` resolves to a populated object, not a bare ID string.
**Warning signs:** Any `href` containing the literal string `undefined` in the rendered HTML.

### Pitfall 3: Amazon shortlinks published as-is
**What goes wrong:** Publishing `https://amzn.to/46EVbDZ` directly as a `gearItems[].href` violates Amazon's April 2026 Program Policies ban on "Redirecting Links" (this is the exact rule Phase 44/46/47 already built the entire `/go/` split around) and is also just an unresolved shortlink with no visible `tag=juantech02-20`.
**Why it happens:** The 13 links Juan supplied in 48-CONTEXT.md are literally shortlinks — copy-pasting them into the CMS without resolving first is the path of least resistance.
**How to avoid:** A pre-content-write step must resolve each `amzn.to` URL (e.g. via `curl -sI` following redirects, or opening in browser) to its full `amazon.com/.../dp/ASIN?...` form, then append/confirm `tag=juantech02-20` is present, before writing any `gearItems[]` row.
**Warning signs:** Any stored `href` matching `amzn.to`.

### Pitfall 4: TDZ/circular import via `AffiliateInlineCard`
**What goes wrong:** Importing `AffiliateDisclosure` or `RichTextRenderer` (directly or transitively) into `AffiliateInlineCard.tsx` recreates the exact production TDZ `ReferenceError` class of bug already hit once in `sitemap-data.ts`'s unrelated cycle.
**Why it happens:** `AffiliateDisclosure` feels like the "correct" component to reuse for a mini-disclosure inside the inline card, but the file that renders Lexical block nodes (`richTextBlockConverters.tsx`) is itself imported BY `RichTextRenderer`, so anything imported FROM a converter that imports back into that graph closes the cycle.
**How to avoid:** `AffiliateInlineCard` imports only `AffiliateLink`, `Badge`, `buttonVariants`, and plain UI — never any component that itself imports `RichTextRenderer`.
**Warning signs:** A Next.js build-time or runtime error mentioning "Cannot access '...' before initialization."

### Pitfall 5: Disabled/greyed styling on the "no affiliate yet" `ToolCard`
**What goes wrong:** Reaching for `opacity-50`/`disabled` styling on DigitalOcean/Kinsta's card (a natural instinct for "this feature is pending") visually implies the tool itself is somehow lesser or broken, which UI-SPEC explicitly forbids — the card content is 100% real, only the monetization link is pending.
**How to avoid:** Only the CTA slot changes (button → `Badge variant="outline"`); everything else renders at identical visual weight.

## Code Examples

### Word-count enforcement decision (STACK-02, ≥100 words per locale)
Per UI-SPEC: enforced editorially, not via a Payload `minLength` validator (a character-count validator would fight natural prose length variance). No code example needed — this is a content-authoring discipline, verified at publish time by a script or manual count against rendered HTML (per ROADMAP Success Criterion #2: "conteo real sobre el HTML renderizado").

### `ToolStack` block config skeleton (illustrative — exact field names are the planner's call per UI-SPEC)
```typescript
// Source: shape derived from 48-UI-SPEC.md Component Contract Detail +
// existing sibling patterns (ArchiveBlock/Section nested-array precedent)
export const ToolStack: Block = {
  slug: 'toolStack',
  interfaceName: 'ToolStackBlock',
  fields: [
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'categoryGroups', type: 'array',
      fields: [
        { name: 'heading', type: 'text', localized: true },
        {
          name: 'tools', type: 'array',
          fields: [
            { name: 'affiliateLink', type: 'relationship', relationTo: 'affiliate-links' }, // nullable
            { name: 'narrative', type: 'textarea', localized: true },
            { name: 'pro', type: 'text', localized: true },
            { name: 'con', type: 'text', localized: true }, // nullable
            /* referenceLink group — see Pattern 4 */
          ],
        },
      ],
    },
    { name: 'gearIntro', type: 'textarea', localized: true },
    {
      name: 'gearItems', type: 'array',
      fields: [
        { name: 'name', type: 'text' },       // not localized
        { name: 'href', type: 'text' },       // resolved amzn full URL, not localized
      ],
    },
    { name: 'elegiriaHoy', type: 'textarea', localized: true },
    { name: 'noCommissionPick', type: 'relationship', relationTo: 'affiliate-links' },
  ],
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| No affiliate rendering surface existed | `/stack` + inline post block | This phase | First real content-facing monetization surface of v2.1 |
| `code-block`/`faq` Lexical nodes unregistered (legacy, raw-JSON read) | `affiliate-inline` properly registered via `BlocksFeature` | This phase | First `BlocksFeature` registration on any richText field in this repo — establishes the pattern for any future inline block |

**Deprecated/outdated:** None relevant.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ToolStack.tools[].referenceLink` should be a bespoke group (Pattern 4) rather than reusing `link.ts`'s `link()` factory with an overridden `relationTo` | Architecture Patterns / Pattern 4 | Low — either shape satisfies STACK-06; the bespoke group is simpler but the planner may prefer maximal reuse via `deepMerge` overrides on `link()` |
| A2 | `AffiliateLinks.whyIUseIt` (Phase 46 field) goes unused by this phase's design, since UI-SPEC's `ToolCard` narrative is sourced from a NEW `ToolStack.tools[].narrative` field instead | Architecture Patterns | Low-medium — if the planner instead wants to source the ≥100-word narrative FROM `whyIUseIt` to avoid content duplication between `/stack` and the inline block's `tagline`, that's a valid alternative design not fully specified by UI-SPEC; flagging so it's a deliberate choice, not an oversight |
| A3 | Payload's Local API default relationship depth (2) is sufficient to populate `tools[].affiliateLink` when fetched via `getCachedPageBySlug('stack', locale)` without an explicit `depth` override | Common Pitfalls / Pitfall 2 | Medium — if depth is insufficient, `affiliateLink` resolves to a bare ID and the CTA branch logic breaks; verify with a real Local API call during Task 1 execution, not left to production discovery |

## Open Questions

1. **Should `AffiliateLinks.whyIUseIt` be deprecated/removed, or repurposed?**
   - What we know: it exists, localized, exactly the shape UI-SPEC wants for `narrative` — but UI-SPEC's schema shape puts `narrative` on `ToolStack.tools[]` instead.
   - What's unclear: whether Phase 46's author intended `whyIUseIt` to be consumed by Phase 48 and UI-SPEC simply didn't reuse it, or whether it's genuinely dead weight now.
   - Recommendation: planner decides at Task-1 field-mapping time; either is safe, neither requires a migration to fix later (the field already exists, nullable, unused is harmless).

2. **Hostinger's affiliate link is still pending from Juan (per 48-CONTEXT.md).**
   - What we know: the `ToolStack`/`affiliate-links` doc for Hostinger can be authored with `active: false` or `destinations: []` until the real link arrives.
   - What's unclear: whether the plan should include a `checkpoint:human-verify`/pause task waiting on that link, or ship with Hostinger in the "no affiliate yet" visual state (same as DigitalOcean/Kinsta) and flip it later.
   - Recommendation: ship with the "no affiliate yet" state now (matches DigitalOcean/Kinsta precedent exactly), avoid blocking the whole phase on an external email from Juan.

## Environment Availability

Not applicable — no new external tool/service dependency introduced this phase (all infra is Postgres/Payload/Next, already running per Phase 45's baseline and Phase 46/47's live verification against Dokploy).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None automated (no jest/vitest/playwright config found in repo) — this project's established pattern is standalone `tsx` verification scripts + live `curl`/fetch against the real dev/prod server, per every prior phase's `scripts/verify-*.ts` |
| Config file | none — see Wave 0 |
| Quick run command | `npx tsx scripts/verify-<name>.ts` |
| Full suite command | manual curl matrix + `npx tsc --noEmit`, per every prior phase's Self-Check pattern |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STACK-01 | `/stack` 200 both locales, canonical/hreflang, zero-diff on 3 files | e2e (curl) | `curl -s https://.../stack`, `curl -s https://.../en/stack`, `git diff --stat src/lib/sitemap-data.ts src/lib/canonical.ts src/lib/breadcrumbs.ts` | ❌ Wave 0 — new script `scripts/verify-stack-page.ts` |
| STACK-02 | ≥100 words/locale/tool on rendered HTML | manual/scripted word count | word-count script against fetched HTML | ❌ Wave 0 |
| STACK-03/04 | "elegiría hoy" + no-commission blocks present | e2e (curl + grep) | grep rendered HTML for both callout headings | ❌ Wave 0 |
| STACK-05 | Footer + author-page links present, absent from nav | e2e (curl + grep) | grep footer/author HTML for `/stack` href; grep nav HTML for absence | ❌ Wave 0 |
| STACK-06 | Each tool links case study or service page | manual verification against rendered HTML | — | ❌ Wave 0 |
| INL-01 | Inline block renders same `rel`, zero migration | e2e (curl) + `git diff migrations/` (scoped to Lexical-only claim, see Pitfall 1) | `grep 'rel="sponsored nofollow noopener"'` on a post with the block | ❌ Wave 0 |
| INL-02 | Disclosure auto-injected before first affiliate link in DOM order | e2e (curl, order-sensitive grep or DOM parse) | script asserting disclosure `<div>` byte-offset precedes first `rel="sponsored"` anchor | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` + relevant `scripts/verify-*.ts`
- **Per wave merge:** full curl matrix against the real dev server (or Dokploy post-merge, per this project's established discipline — no separate staging DB exists)
- **Phase gate:** all STACK-0x/INL-0x criteria curl-verified against the live site before close, per this project's established pattern (Phase 46/47 both closed this way)

### Wave 0 Gaps
- [ ] `scripts/verify-stack-page.ts` — covers STACK-01, STACK-05
- [ ] `scripts/verify-affiliate-inline-block.ts` — covers INL-01, INL-02
- [ ] Framework install: none — repo convention is standalone `tsx` scripts, no framework to install

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface added |
| V3 Session Management | no | — |
| V4 Access Control | yes | `affiliate-links` read access already gated by `authenticatedOrActive` (Phase 46) — this phase must call `getCachedAffiliateLinks()`/existing helpers, never a raw `payload.find` with `overrideAccess: true`, for any new query it adds (e.g. resolving `referenceLink.caseStudy`) |
| V5 Input Validation | n/a | No user input surface — `/stack` and the inline block are read-only public content |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open-redirect via unvalidated affiliate destination | Tampering | Already mitigated by Phase 46/47 — `pickDestination()` only returns admin-authored URLs, `?to=` is never read by `/go/[slug]` (unchanged this phase) |
| Draft/unpublished doc leak via unguarded relationship refetch | Information Disclosure | `overrideAccess: false` on any new `payload.find`/`findByID` this phase adds (see Pattern 4's security note); Phase 50's GATE-01 will grep for this |
| Missing `rel="sponsored"` on a hand-rolled anchor | Tampering (FTC/Amazon policy) | Route every affiliate CTA through the existing `AffiliateLink` component, never a bare `<a>` |

## Sources

### Primary (HIGH confidence — read in full this session)
- `src/collections/Pages/index.ts` — block registration pattern, current 26-block array
- `src/blocks/blockRegistry.tsx` — `blockComponents` render registry pattern
- `src/collections/AffiliateLinks/index.ts` — full 13-field schema (Phase 46)
- `src/lib/affiliate.ts`, `src/components/AffiliateLink.tsx` — `pickDestination()`, `rel` contract
- `src/app/go/[slug]/route.ts` — Phase 47 redirect logic, unchanged this phase
- `src/lib/sitemap-data.ts`, `src/lib/canonical.ts`, `src/lib/breadcrumbs.ts` — all 3 read in full, zero-edit claim verified
- `src/collections/Posts/index.ts`, `src/components/richTextBlockConverters.tsx` — current Lexical config + TDZ hazard docblock
- `src/blocks/Content/config.ts` — `features: ({ rootFeatures }) => [...]` precedent
- `src/fields/link.ts`, `src/blocks/RelatedCaseStudyBlock/config.ts`, `.../Component.tsx` — reference-link field/security precedent
- `src/app/(frontend)/[locale]/page.tsx`, `.../websites/page.tsx` — route-file precedent
- `src/lib/cache.ts` — `getCachedPageBySlug`/`getCachedAffiliateLinks` genericity
- `src/migrations/20260709_191127_initial.ts` — `content jsonb` column type
- `src/migrations/20260820_155934_subscribers_collection.json` — `pages_blocks_local_proof_section*` table names, confirming new-block-migration precedent
- `messages/es.json`, `messages/en.json` — current namespace inventory (`affiliateDisclosure` present, no `toolStack`/`stack` namespace yet)
- `src/components/SiteFooter.tsx`, `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` — footer/author-page link precedent
- `src/components/PageHero.tsx` — `variant: 'index' | 'detail'` confirmed
- `src/i18n/routing.ts` — `localePrefix: 'as-needed'`, no `pathnames` map
- `src/middleware.ts` — matcher does not exclude `/stack`
- `.planning/phases/46-.../46-01-SUMMARY.md`, `46-02-SUMMARY.md`, `.planning/phases/47-.../47-01-SUMMARY.md` — prior-phase decisions/handoff notes
- `.planning/phases/48-.../48-CONTEXT.md`, `48-UI-SPEC.md` — locked content/design decisions
- `.planning/ROADMAP.md` (Phase 48/48.5/49/50 sections) — hard constraints, success criteria, requirement IDs
- `.planning/REQUIREMENTS.md` — STACK-01..06, INL-01/02 requirement text

### Secondary / Tertiary
None used — this phase's research was fully groundable in the existing codebase; no external library docs or web search were needed since zero new packages are introduced.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, everything already installed/verified in production
- Architecture: HIGH — every claimed pattern was read in full from the actual source file this session, not inferred
- Pitfalls: HIGH — Pitfall 1 (migration) and Pitfall 4 (TDZ) are grounded in direct repo evidence (migration file history, existing docblock), not speculation

**Research date:** 2026-09-04
**Valid until:** 30 days (stable, no fast-moving external dependency)
