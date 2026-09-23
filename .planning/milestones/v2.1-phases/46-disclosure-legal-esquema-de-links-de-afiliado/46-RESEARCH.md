# Phase 46: Disclosure Legal + Esquema de Links de Afiliado - Research

**Researched:** 2026-09-03
**Domain:** Payload 3.85 collection schema design (additive migration, field-level access gating) + next-intl bilingual copy + legal/compliance text (Amazon Associates Program Policies)
**Confidence:** HIGH (all core patterns read directly from this repo's own source files; the one external legal claim is anchored to the official Amazon Associates agreement/policy pages, fetched live)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Matriz de localización de `affiliate-links` (congelada — SC-3)
- **NO localizados**: `name` (identificador interno), `slug`, `program` (enum: amazon | kinsta | dinorank | digitalocean | other), `destinations` (array, campo `marketplace` + `url`, resuelto en render por `pickDestination()`), `cookieWindowDays`, `commissionNote`, `active` (checkbox, reemplaza drafts — no hay versiones), `placement` (enum: stack-page | inline-post | both), `order` (number, sort opcional).
- **Localizados** (prosa, solo ES/EN): `tagline`, `whyIUseIt`, `disclosureOverride`, `ctaLabel`.
- **Nunca campos del CMS**: `rel` (se emite desde el código en `AffiliateLink`), `price`.
- `cookieWindowDays` y `commissionNote` son campos internos, gateados por el helper de field-access existente (mismo patrón que ya usa el proyecto para otros campos internos).
- La colección se aprueba con `COUNT(*) = 0` — la migración se corre y se lee antes de cargar cualquier contenido real.

#### Disclosure — componente único reusable
- `AffiliateDisclosure` es un solo componente que recibe variant/context y se monta en dos lugares: la página `/stack` (Phase 48) y el bloque inline de afiliados en posts (Phase 48). Un solo texto legal fuente, sin deriva entre ambos lugares.
- Copy vive en `messages/{es,en}.json`, nunca en contenido del CMS. La frase textual requerida por Amazon Associates aparece verbatim en ambos idiomas donde haya links de Amazon.
- Restricción de cero tracking con consentimiento (sin GA4, sin píxeles, sin `document.cookie`/`localStorage` en la ruta de afiliado) es un constraint del milestone, no una elección de esta fase.

#### Phase Boundary (from CONTEXT.md `<domain>`)
Todo lo que un link de afiliado necesita para existir queda construido y aprobado antes de que se renderice el primero: disclosure bilingüe en código (nunca en el CMS), `/privacy` cubriendo el flujo de email, y la colección `affiliate-links` con su matriz de localización congelada y aprobada antes de cargar un solo documento, con su migración aditiva leída antes de aplicarse contra la base real (Dokploy, no hay sandbox).

Queda fuera: la ruta `/go` y el registro de clics (Phase 47), la página `/stack` y los links inline en contenido (Phase 48), cualquier programa de afiliados nuevo, cualquier cambio a rutas ya publicadas.

#### Specific Ideas
- Los links de Amazon se renderizan directos y sin cloaking, `tag=` visible, sin `referrerPolicy` override, sin pasar por `/go/` — las Program Policies del 2026-04-14 prohíben textualmente los Redirecting Links para Amazon. `/go/` es solo para programas no-Amazon (Phase 47).
- La migración es puramente aditiva: `CREATE TABLE`/`ADD COLUMN`/índices únicamente. Nada que toque una columna con datos.

#### Hard constraints carried from ROADMAP.md Phase 46 detail
- La matriz de localización campo por campo se congela y Juan la aprueba **antes** de crear un solo documento.
- `affiliateUrl` **no** se localiza: los destinos por mercado viven en un array NO localizado con clave `marketplace`, resueltos en render por `pickDestination()` en `src/lib/affiliate.ts`. Localizado (solo prosa): `tagline`, `whyIUseIt`, `disclosureOverride`, `ctaLabel`.
- `rel` nunca es un campo del CMS. `price` nunca es un campo.
- Los links de Amazon se renderizan directos y sin cloaking, con `tag=` visible, sin `referrerPolicy` override y sin pasar por `/go/`.
- Cero tracking que dispare consentimiento: sin GA4, sin píxeles, sin IDs de clic por usuario, sin `document.cookie`/`localStorage` en la ruta de afiliado.
- La migración es puramente aditiva (`CREATE TABLE`/`ADD COLUMN`/índices) y se lee línea por línea antes de correrla contra Neon/Postgres real.

### Claude's Discretion
- Nombres exactos de los enums internos (`program`, `placement`) más allá de los valores ya fijados arriba.
- Estructura interna del componente `AffiliateDisclosure` (props, variantes) mientras cumpla "un solo componente, un solo texto fuente".
- Redacción exacta de la prosa de `/privacy` sobre retención y proceso de baja, siempre que cubra Resend como encargado del tratamiento y sea verificable por curl sobre el HTML renderizado (SC-2).

### Deferred Ideas (OUT OF SCOPE)
- Ruta `/go`, fix de middleware, registro de clics — Phase 47.
- Página `/stack` y links inline en contenido — Phase 48.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEG-01 | Un componente de disclosure bilingüe se renderiza antes del primer link de afiliado en orden del DOM, con la copia en `messages/{es,en}.json` y no en contenido del CMS | Pattern 4 (`getTranslations` consumption, `ServiceScopeCard` precedent); Code Examples |
| LEG-02 | La frase textual de Amazon ("As an Amazon Associate I earn from qualifying purchases." y su versión en español) aparece donde haya links de Amazon | Summary (verbatim EN text confirmed live against the US Operating Agreement); Common Pitfalls #2; Assumptions A1; Open Question 2 |
| LEG-03 | `/privacy` queda actualizada cubriendo el formulario de email, Resend como encargado del tratamiento, retención de datos y proceso de baja | Summary (current `/privacy` content confirmed to NOT cover this yet); `scripts/humanize-legal-pages.ts`/`seed-legal-pages.ts` patterns; Recommended Project Structure (`scripts/update-privacy-resend.ts`) |
| LEG-04 | Queda escrita como restricción del milestone la prohibición de cualquier tracking que dispare consentimiento | Security Domain (Known Threat Patterns); User Constraints (Hard constraints) |
| AFF-01 | Existe la colección `affiliate-links` con la matriz de localización campo por campo congelada y aprobada antes de cargar cualquier contenido | Pattern 1/2; Code Examples (collection skeleton); Runtime State Inventory (`COUNT(*) = 0`) |
| AFF-02 | Los destinos por mercado viven en un array NO localizado con clave `marketplace`, resueltos en render por una función pura `pickDestination()` en `src/lib/affiliate.ts` | Architectural Responsibility Map (`pickDestination()` row); Code Examples (`pickDestination()`); Anti-Patterns |
| AFF-03 | El componente `AffiliateLink` emite `rel="sponsored nofollow noopener"` estructuralmente desde el código — nunca como campo editable en el CMS | Code Examples (`AffiliateLink`); Security Domain (Known Threat Patterns) |
| AFF-04 | Los links de Amazon se renderizan directos y sin cloaking, con el `tag=` visible y sin `referrerPolicy` override | Code Examples (`AffiliateLink`); Security Domain (Known Threat Patterns); User Constraints |
| AFF-05 | Las lecturas pasan por un único `getCachedAffiliateLinks()` con `overrideAccess: false`, con cache tags y hooks de revalidación | Pattern 3 (`getCached*` pattern); Code Examples |
| AFF-06 | La migración de esquema es puramente aditiva (`CREATE TABLE`/`ADD COLUMN`), leída antes de aplicarse contra la base real | Common Pitfalls #1; Sources (`20260820_155934_subscribers_collection.ts` reference shape); CLAUDE.md Database Safety workflow |
</phase_requirements>

## Summary

This phase has zero new libraries to install and zero new architectural risk — every pattern it needs already exists somewhere in this repo and just needs to be composed for a new collection (`affiliate-links`) and two new/updated surfaces (`AffiliateDisclosure` component, `/privacy` content). The collection pattern to imitate is `src/collections/Websites/index.ts` (explicit per-field `localized: true`, `slugField()` at the end, `access` built from small composable functions), but with one deliberate deviation: no `versions.drafts` at all, replaced by a plain `active: boolean` checkbox — a pattern that **does not exist anywhere else in this codebase today** and must be built fresh. The internal-field gating CONTEXT.md refers to ("mismo patrón que ya usa el proyecto para otros campos internos") is `src/fields/targetKeyword.ts`: a `FieldAccess` function checking `Boolean(req.user)`, applied via `access: { read: ... }` directly on the field config. The cache pattern for `getCachedAffiliateLinks()` is `src/lib/cache.ts`: wrap a `payload.find()` in `unstable_cache()` with an explicit `overrideAccess: false`, a cache-tag array, and `revalidate: CACHE_TTL_SECONDS`, paired with an `afterChange`/`afterDelete` hook pair in `src/lib/cache-tags.ts` that calls `revalidateTag()` + `revalidatePath('/', 'layout')`.

`/privacy` is not a code file with hardcoded copy — it is a `pages` collection document (slug `privacy`) whose body lives in a `Content` block's Lexical `richText` field, currently 6 sections (ES/EN) seeded by `scripts/seed-legal-pages.ts` and later humanized by `scripts/humanize-legal-pages.ts`. It does **not** currently mention Resend, retention for the newsletter, or an opt-out process — it only covers the contact form and page analytics. Meanwhile the newsletter double opt-in flow (`Subscribers` collection, `src/app/actions/subscribe.tsx`, `/api/newsletter/confirm`, `/api/newsletter/unsubscribe`) and the Resend email adapter are **already live in production** — this is pre-existing functionality unrelated to the affiliate/monetization milestone, which makes LEG-03 a real, currently-true gap, not a future-proofing exercise.

The one substantive external-legal finding: Juan's Amazon Associates account (`juantech02-20`, confirmed in Phase 44's `DECISIONS.md`) is a **US (amazon.com) Associates account**, governed by the US Operating Agreement. The verbatim required disclosure Section 5 of that agreement mandates is the English sentence "As an Amazon Associate I earn from qualifying purchases." — confirmed live against `affiliate-program.amazon.com/help/operating/agreement`. There is **no Spanish-language equivalent mandated by that same US agreement** — the Spanish sentence found in this research ("En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables") is the required text for a **different, separate program** (the EU/`amazon.es` Associates agreement, which Juan is not a party to). Using that EU sentence and calling it "the verbatim Spanish requirement" would misrepresent a different program's mandated text as Juan's own. The correct, honest move — and the one this research recommends — is a faithful human-reviewed Spanish **translation** of the English-mandated sentence, not an import of the EU program's own wording. This is flagged in the Assumptions Log below for Juan's explicit sign-off before it ships, per LEG-02/SC-1.

**Primary recommendation:** Build `affiliate-links` following the `Websites` collection's structural shape (explicit per-field localization, `slugField()`, `access` composed from small named functions) but swap `versions.drafts` for a bare `active` checkbox and a **new** `authenticatedOrActive` access function (mirroring the existing `authenticatedOrPublished.ts` 1:1, substituting `active: { equals: true }` for `_status: { equals: 'published' }` — this exact shape, `isPublic`/checkbox query-constraint access, is Payload's own documented pattern, not an invented one). Gate `cookieWindowDays`/`commissionNote` individually with the same `FieldAccess` function `targetKeyword.ts` already uses (`Boolean(req.user)`), applied per-field rather than wrapped in a group. Write `AffiliateDisclosure` as a plain async server component consuming `getTranslations('affiliateDisclosure')` from `messages/{es,en}.json`, following `ServiceScopeCard`'s exact `getTranslations` usage. Update `/privacy` via a new idempotent script modeled directly on `scripts/humanize-legal-pages.ts` (find-by-slug, reuse `blockId`/`columnId` across locale updates, append — not replace — the existing 6 sections). Generate the migration with `payload migrate:create`, read the SQL file yourself (it should look exactly like `20260820_155934_subscribers_collection.ts`'s shape: `CREATE TYPE` enums + `CREATE TABLE` + FK/index adds, zero `ALTER COLUMN`/`DROP`), then run `payload migrate` — additive-only, no confirmation gate required per `CLAUDE.md`'s Database Safety section, but confirm `COUNT(*) = 0` per SC-3 before seeding.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `affiliate-links` schema + admin CRUD | API/Backend (Payload collection) | Database (Postgres via Drizzle migration) | Payload collections ARE the backend tier in this architecture — Local API + admin both mount on the same Next.js process |
| Field-level internal-field gating (`cookieWindowDays`, `commissionNote`) | API/Backend (Payload `FieldAccess`) | — | Access control is evaluated server-side inside the Payload Local API / REST layer, never in the browser |
| `getCachedAffiliateLinks()` | API/Backend (Next.js Server Component data layer) | Database (reads via Local API) | `unstable_cache` wraps a Local API call; this is a server-only data-fetch function, never imported by a Client Component |
| `pickDestination()` | Browser/Client-safe pure function | — | CONTEXT.md and AFF-02 both specify "función pura, sin acceso a DB" — must be importable from a Client Component without pulling in `@payload-config` (same reason `service-slugs.ts` is split out from `services-data.ts` in this repo) |
| `AffiliateDisclosure` component | Frontend Server (SSR) | — | Renders static bilingual copy from `messages/*.json` via `getTranslations` (server-only next-intl API) — no client interactivity needed |
| `AffiliateLink` component (`rel` emission) | Frontend Server (SSR), rendered to static HTML | — | The `rel` attribute is baked into server-rendered HTML; no client JS is needed to emit it, keeping the ≤5KB client-JS budget for the milestone untouched |
| `/privacy` copy update | API/Backend (Payload `pages` doc, `Content` block richText) | Frontend Server (renders via `RenderBlocks`) | Content lives in Postgres as a CMS document, not in a `.tsx` file — updates go through the Local API via a script, exactly like the original `seed-legal-pages.ts` |
| Migration (`CREATE TABLE affiliate-links`) | Database (Postgres DDL via Drizzle) | — | Schema change only; `push: false` discipline applies |

## Standard Stack

No new libraries are required for this phase. Every capability (collection schema, field-level access, cache wrapper, next-intl message consumption, Lexical richText authoring via the Local API) is provided by packages already installed and pinned in `package.json`.

### Core (already installed — no action needed)
| Library | Version (installed) | Purpose in this phase | Why Standard |
|---------|---------|---------|--------------|
| `payload` | 3.85.2 [VERIFIED: package.json:43] | `affiliate-links` collection definition, field-level `access.read`, Local API reads/writes | Already the project's CMS; collection API is stable across the 3.85.x line |
| `@payloadcms/db-postgres` | 3.85.2 [VERIFIED: package.json:18] | Additive migration for the new table | Same adapter every prior collection (`Websites`, `Subscribers`, `SpeakingEvents`) used |
| `next-intl` | ^4.13.1 [VERIFIED: package.json:42] | `getTranslations('affiliateDisclosure')` inside the new server component | Already the project's i18n layer; `messages/{es,en}.json` is the established location for UI-string copy (as opposed to CMS content) |
| `next` | 15.4.11 [VERIFIED: package.json:41] | Hosts the server component tree | No routing changes needed this phase (no new route — `/privacy` already exists) |

### Supporting
None new. `tsx` (already a devDependency, used by every prior one-off content script) is the tool to run the `/privacy`-update script and any manual verification script (e.g. a `COUNT(*)` check before approving the migration).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bare `active: boolean` checkbox (no versions) | `versions.drafts` like every other content collection | CONTEXT.md explicitly rejects this — affiliate links have no editorial review workflow, and adding drafts would mean `getCachedAffiliateLinks()` needs `authenticatedOrPublished`-style `_status` logic for a collection that will never actually use draft/publish semantics. A checkbox is honest about what the collection actually does. |
| Field-level `access.read` gate (per targetKeyword.ts pattern) | `admin.group: 'Internal'` UI grouping only | UI grouping doesn't restrict the REST/GraphQL/Local API response — a non-authenticated caller of `getCachedAffiliateLinks()` (which sets `overrideAccess: false`) would still get `cookieWindowDays`/`commissionNote` back in the JSON. Field-level `access.read` is enforced at the data layer, not just the admin UI. |

**Installation:** None required.

**Version verification:** All four core packages confirmed directly from this repo's `package.json` (read this session) — no registry lookup needed, no new package to verify against npm.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero external packages — no `npm install` of any kind is part of its scope. Skipping the Package Legitimacy Gate per its own trigger condition ("whenever this phase installs external packages").

## Architecture Patterns

### System Architecture Diagram

```
Editor (Payload admin)
      │  create/update affiliate-links doc
      ▼
┌─────────────────────────────┐
│ affiliate-links collection   │  access.read = authenticatedOrActive (NEW, mirrors
│  - active checkbox (NEW      │    authenticatedOrPublished.ts 1:1, swaps _status
│    pattern, no drafts)       │    for `active`)
│  - cookieWindowDays/         │  field access.read = authenticated-only FieldAccess
│    commissionNote gated      │    (same fn shape as targetKeyword.ts)
│  - afterChange/afterDelete   │──────┐
│    hooks → cache-tags.ts     │      │ revalidateTag + revalidatePath
└─────────────────────────────┘      ▼
      │ Local API read                 Next.js cache invalidated
      │ (overrideAccess:false)
      ▼
┌─────────────────────────────┐
│ getCachedAffiliateLinks()    │  src/lib/cache.ts pattern:
│  unstable_cache(fetcher,     │  unstable_cache(fn, [keyParts], {tags, revalidate})
│  keyParts, {tags, revalidate})│
└─────────────────────────────┘
      │ returns doc(s)
      ▼
┌─────────────────────────────┐        ┌──────────────────────────────┐
│ pickDestination() (PURE)     │◄───────│ src/lib/affiliate.ts (NEW)    │
│  no DB import — resolves     │        │  client-safe, same split as   │
│  `destinations[]` by         │        │  service-slugs.ts / services- │
│  `marketplace` key           │        │  data.ts                       │
└─────────────────────────────┘        └──────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐        ┌──────────────────────────────┐
│ AffiliateLink component (NEW)│───────►│ rel="sponsored nofollow       │
│  renders <a> with resolved   │        │  noopener" ALWAYS emitted     │
│  URL, tag= visible for Amazon│        │  from code, never a CMS field │
│  no /go/, no cloaking        │        └──────────────────────────────┘
└─────────────────────────────┘
      │ mounted alongside
      ▼
┌─────────────────────────────┐        ┌──────────────────────────────┐
│ AffiliateDisclosure (NEW)     │───────►│ messages/{es,en}.json         │
│  server component,            │        │  affiliateDisclosure namespace│
│  getTranslations()            │        │  (NEW) — Amazon verbatim EN + │
│  variant/context prop          │        │  reviewed ES translation      │
└─────────────────────────────┘        └──────────────────────────────┘

Separately, unconnected to affiliate-links this phase:

Editor / one-off script (scripts/update-privacy-resend.ts, NEW)
      │ payload.update({ collection: 'pages', id: <privacy doc>, locale, data })
      ▼
`pages` doc (slug=privacy) → Content block richText, ES+EN
      │ existing revalidatePagesCache hook fires automatically
      ▼
/privacy and /en/privacy render updated HTML via existing RenderBlocks pipeline
```

### Recommended Project Structure
```
src/
├── collections/
│   └── AffiliateLinks/
│       └── index.ts          # NEW — modeled on Websites/index.ts shape
├── access/
│   └── authenticatedOrActive.ts   # NEW — mirrors authenticatedOrPublished.ts
├── fields/
│   └── (reuse targetKeyword.ts's FieldAccess SHAPE, do not import it —
│        it's field-specific; write a small shared `internalFieldAccess`
│        FieldAccess const, either inline in AffiliateLinks/index.ts or a
│        new src/fields/internalAccess.ts if reused by more than one field)
├── lib/
│   ├── affiliate.ts           # NEW — pure pickDestination(), no DB import
│   └── cache.ts                # EXTEND — add getCachedAffiliateLinks()
│   └── cache-tags.ts           # EXTEND — add CACHE_TAGS.affiliateLinks() +
│                                 revalidateAffiliateLinksCache hook pair
├── components/
│   ├── AffiliateDisclosure.tsx # NEW — server component, getTranslations
│   └── AffiliateLink.tsx       # NEW — server component, emits rel= from code
├── migrations/
│   └── <timestamp>_affiliate_links_collection.ts   # generated by payload migrate:create
messages/
├── es.json                     # EXTEND — new "affiliateDisclosure" namespace
└── en.json                     # EXTEND — same namespace, EN copy
scripts/
└── update-privacy-resend.ts    # NEW — modeled on humanize-legal-pages.ts,
                                   APPENDS Resend/retention/opt-out prose,
                                   does not replace the existing 6 sections
```

### Pattern 1: Collection with `active` checkbox instead of drafts (NEW to this repo)
**What:** A collection with no `versions` block at all; visibility to the public is governed by a plain `checkbox` field, checked via a collection-level `Access` function that returns a `Where` query constraint for unauthenticated requests.
**When to use:** Content with no editorial review workflow — a link either exists and is live, or it doesn't. This describes `affiliate-links` exactly (per CONTEXT.md: "no hay flujo de revisión editorial para links de afiliado").
**Example (existing pattern to imitate, `src/access/authenticatedOrPublished.ts`, read in full this session):**
```ts
// Source: src/access/authenticatedOrPublished.ts (this repo, read in full)
import type { Access } from 'payload'

export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```
**New function to write for this phase, same shape, substituting the checkbox** (the `isPublic` checkbox query-constraint pattern is Payload's own documented example, not invented for this project):
```ts
// Source: https://github.com/payloadcms/payload/blob/v3.85.0/docs/access-control/collections.mdx
// (fetched via Context7 this session — "Advanced Read Access Function")
import type { Access } from 'payload'

export const authenticatedOrActive: Access = ({ req: { user } }) => {
  if (user) return true
  return { active: { equals: true } }
}
```

### Pattern 2: Field-level access gating for internal-only fields
**What:** A field carries its own `access: { read: someFieldAccessFn }`, restricting who can even see the field's value in API responses — independent of the collection's own read access.
**When to use:** Exactly `cookieWindowDays` and `commissionNote` per CONTEXT.md ("campos internos, gateados por el helper de field-access existente").
**Example (existing pattern, `src/fields/targetKeyword.ts`, read in full this session — quoted verbatim):**
```ts
// Source: src/fields/targetKeyword.ts:1-17 (this repo, read in full)
import type { Field, FieldAccess } from 'payload'

const authenticatedFieldRead: FieldAccess = ({ req: { user } }) => Boolean(user)

export const targetKeywordField = (): Field => ({
  name: 'targetKeyword',
  type: 'group',
  label: { en: 'Target Keyword', es: 'Keyword objetivo' },
  access: {
    read: authenticatedFieldRead,
  },
  // ...
})
```
`targetKeyword.ts` wraps its gated content in a `group` field. `affiliate-links`' internal fields are flat, top-level fields per the frozen matrix (not grouped) — apply the identical `FieldAccess` function directly to each field's own `access.read`, e.g.:
```ts
const authenticatedFieldRead: FieldAccess = ({ req: { user } }) => Boolean(user)

{ name: 'cookieWindowDays', type: 'number', access: { read: authenticatedFieldRead } },
{ name: 'commissionNote', type: 'text', access: { read: authenticatedFieldRead } },
```
Confirmed applicable to primitive field types (not just groups) per official docs — [VERIFIED: Context7 /payloadcms/payload/v3.85.0, docs/fields/overview.mdx "Configuring Field-level Access Control" + docs/access-control/fields.mdx "Field Access Control Options"], both showing `access.read` directly on a `text`/generic `Field` config, not only on `group`.

### Pattern 3: Cached read layer (`getCached*`)
**What:** Wrap a `payload.find()`/`findGlobal()` call in `unstable_cache()`, always passing `overrideAccess: false` explicitly, tagged for `revalidateTag` invalidation, with a 60s TTL as a safety net.
**When to use:** Every public-facing read in this codebase — this is the established, non-negotiable pattern (see the SECURITY comment block at the top of `src/lib/cache.ts`, read in full this session, explaining WHY `overrideAccess: false` is mandatory: Payload's Local API defaults to `overrideAccess: true`, which would let a cached fetch leak a doc that should be gated).
**Example (existing pattern, `src/lib/cache.ts`, read in full this session):**
```ts
// Source: src/lib/cache.ts (this repo, read in full — getCachedCategories, adapted shape)
export function getCachedAffiliateLinks(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'affiliate-links',
        locale,
        limit: 100,
        overrideAccess: false,
      })
      return docs
    },
    ['affiliate-links', locale],
    { tags: [CACHE_TAGS.affiliateLinks()], revalidate: CACHE_TTL_SECONDS },
  )()
}
```
Paired hook wiring in `src/lib/cache-tags.ts`, following the exact `revalidateCategoriesCache`/`revalidateCategoriesCacheOnDelete` shape read in full this session (calls `safeRevalidateTag` + `safeRevalidateAllPaths`), then wired into the collection config's own `hooks.afterChange`/`hooks.afterDelete` array — exactly how `CaseStudies/index.ts` wires `revalidateCaseStudiesCache` (read in full this session), NOT via a plugin `overrides` block (that pattern is specific to `redirectsPlugin` because `Redirects` is a plugin-registered collection, not a hand-authored one).

### Pattern 4: next-intl UI-string copy (never CMS content) for legally-required text
**What:** A server component calls `getTranslations('namespaceName')` from `next-intl/server`; the namespace and its keys live in both `messages/es.json` and `messages/en.json`.
**When to use:** Exactly `AffiliateDisclosure` per CONTEXT.md ("Copy vive en `messages/{es,en}.json`, nunca en contenido del CMS").
**Example (existing pattern, `src/blocks/ServiceScopeCard/Component.tsx`, read in full this session):**
```tsx
// Source: src/blocks/ServiceScopeCard/Component.tsx:1-14 (this repo, read in full)
import { getTranslations } from 'next-intl/server'

export async function AffiliateDisclosure({ variant }: { variant: 'stack-page' | 'inline-post' }) {
  const t = await getTranslations('affiliateDisclosure')
  return (
    <p>
      {t('generalDisclosure')} {t('amazonDisclosure')}
    </p>
  )
}
```
Message file shape to add (existing `messages/es.json`/`messages/en.json`, both read in full this session — current top-level keys verbatim: `["nav", "home", "common", "servicesShowcase", "serviceScopeCard", "relatedCaseStudyBlock", "testimonialsCarousel"]` [VERIFIED: messages/es.json:1-32] — a new `"affiliateDisclosure"` sibling key follows the exact same shape as `"serviceScopeCard"` at that file's lines 20-25).

### Anti-Patterns to Avoid
- **Wrapping internal fields in a `group` when the frozen matrix specifies flat fields:** `targetKeywordField()` groups its gated content, but CONTEXT.md's matrix lists `cookieWindowDays` and `commissionNote` as independent top-level fields. Grouping them would change the matrix that Juan is meant to approve verbatim — apply the `FieldAccess` function per-field instead.
- **Reusing `versions.drafts` "just in case":** would add `_status` handling nobody asked for and give `getCachedAffiliateLinks()` two possible gating axes (`_status` AND `active`) instead of one, needlessly complicating both the collection and its access function.
- **Presenting the EU/`amazon.es` Spanish sentence as "verbatim required text":** it is verbatim for a different Amazon Associates program (the EU marketplaces agreement) that Juan is not party to. His account (`juantech02-20`) is governed by the US agreement, which only mandates the English sentence. See Assumptions Log.
- **Building `pickDestination()` inside `src/lib/affiliate.ts` with a `payload`/`@payload-config` import "for convenience":** breaks the "pure, no DB access" requirement (AFF-02) and risks becoming unimportable from a future Client Component, the exact reason `service-slugs.ts` was split out of `services-data.ts` in this repo.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gating a checkbox-visibility collection for anonymous reads | A custom middleware/route guard in front of the Local API | Payload's own collection-level `Access` function returning a `Where` query (the `isPublic` pattern) | It's the documented, first-class Payload mechanism — confirmed directly in the 3.85.0 docs this session, and it composes with `overrideAccess: false` for free |
| Restricting a field's visibility in API responses | Filtering the object manually after `payload.find()` returns | Field-level `access.read` (Pattern 2 above) | Manual post-filtering is easy to forget on a new call site; field-level access is enforced by Payload itself on every code path (REST, GraphQL, Local API with `overrideAccess: false`), including future ones nobody has written yet |
| Cache invalidation for the new collection | A bespoke `router.refresh()`/client-side revalidation | `unstable_cache` + `revalidateTag`/`revalidatePath` (Pattern 3) | Every other collection in this repo already solved this; a bespoke mechanism would be the only one of its kind and the first thing to drift |

**Key insight:** Every mechanism this phase needs is a straight copy of a pattern already proven in this exact repo, not a generic "best practice" pulled from outside it — the research effort here was locating the four existing files (`Websites/index.ts`, `authenticatedOrPublished.ts`, `targetKeyword.ts`, `cache.ts`/`cache-tags.ts`) rather than inventing anything new. The only genuinely new piece of engineering is the `active`-checkbox access function, and even that is a one-line substitution on an existing file plus a Payload-documented pattern.

## Runtime State Inventory

**Trigger check:** This phase is not a rename/refactor/migration of existing state — it is a net-new collection (`affiliate-links`, zero prior documents) and an additive content update to an existing `pages` doc (`/privacy`). Not a rename phase. Section included anyway per the "no sandbox" DB-safety framing in CONTEXT.md/CLAUDE.md, answered explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `affiliate-links` does not exist yet in any table; SC-3 explicitly requires `COUNT(*) = 0` at approval time | None (net-new, no backfill) |
| Live service config | None — no external service (Amazon, Kinsta, DinoRANK, DigitalOcean) has any config referencing this collection; those relationships are only created once real links are entered in Phase 48 | None |
| OS-registered state | None — no cron/task/process references this collection's name | None |
| Secrets/env vars | None — `affiliate-links` needs no new env var. The Resend transport (`RESEND_API_KEY`) already exists and is unaffected; the `/privacy` copy update only documents its use, doesn't touch its config | None |
| Build artifacts | None — no compiled/installed artifact carries a stale name here (no rename occurring) | None |

## Common Pitfalls

### Pitfall 1: Localizing a field that already has data (the 2026-07-12 incident pattern)
**What goes wrong:** A migration adds `localized: true` to a column that already has rows, and Payload's migration generator does not automatically back-fill the existing value into both locale rows — the old value gets dropped when the column is split into a locale-keyed table.
**Why it happens:** Drizzle/Payload generates the schema diff mechanically; it has no way to know the single existing value should be copied into every locale.
**How to avoid:** Not applicable in the literal sense this phase (the collection starts at zero rows, per SC-3), but the discipline still applies for real: freeze the localization matrix **before** the first document is created (already the explicit design of this phase), and never revisit that matrix after content exists without an explicit backfill migration.
**Warning signs:** A migration diff containing `ALTER TABLE ... ADD COLUMN` on a `_locales` table for a column that isn't brand new, without an accompanying `UPDATE ... SET` copying old values first.

### Pitfall 2: Confusing "verbatim required text" across two different Amazon Associates programs
**What goes wrong:** Copying the Spanish sentence used by the `amazon.es`/EU Associates program and presenting it as "the Spanish version of what Amazon requires me to say," when Juan's account is a US (`amazon.com`) account governed by a different agreement that only mandates the English sentence.
**Why it happens:** Both texts are genuinely official Amazon-authored strings, live on Amazon's own domains, which makes them look interchangeable at a glance — but they're the required disclosure for two separate contractual relationships.
**How to avoid:** Treat the English sentence as the only contractually-mandated string (Section 5, US Operating Agreement). Produce the Spanish copy as an explicitly-labeled faithful translation, not a "verbatim requirement," and have Juan sign off on the translation's wording before it ships (see Assumptions Log — this is the checkpoint the planner must add).
**Warning signs:** Any code comment or admin field description saying "verbatim Amazon-required Spanish text" without a citation to the specific US-agreement clause that would mandate it (there isn't one).

### Pitfall 3: Wiring `unstable_cache` invalidation via the wrong mechanism for a hand-authored collection
**What goes wrong:** Copying the `redirectsPlugin`'s `overrides.hooks` wiring style (in `payload.config.ts`) for a collection that isn't plugin-registered.
**Why it happens:** It's the most recently-read example in `payload.config.ts` and looks like "the" pattern at a glance.
**How to avoid:** For any collection defined by this repo directly (not registered by a plugin), wire `hooks.afterChange`/`hooks.afterDelete` **inside the collection config itself** — exactly as `CaseStudies/index.ts` and `Pages/index.ts` do. The `overrides.hooks` shape is specific to wrapping a plugin's own collection config from outside.
**Warning signs:** Trying to import `AffiliateLinks` into `payload.config.ts`'s plugin section instead of its `collections` array.

## Code Examples

### `affiliate-links` collection skeleton (field list per CONTEXT.md's frozen matrix, structural shape per `Websites/index.ts`)
```ts
// Structural pattern source: src/collections/Websites/index.ts (this repo, read in full)
// Access pattern source: src/access/authenticatedOrPublished.ts (this repo, read in full)
// Field-gate pattern source: src/fields/targetKeyword.ts (this repo, read in full)
import type { CollectionConfig, FieldAccess } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrActive } from '@/access/authenticatedOrActive' // NEW file, this phase
import { slugField } from '@/fields/slug'
import {
  revalidateAffiliateLinksCache,
  revalidateAffiliateLinksCacheOnDelete,
} from '@/lib/cache-tags' // NEW exports, this phase

const authenticatedFieldRead: FieldAccess = ({ req: { user } }) => Boolean(user)

export const AffiliateLinks: CollectionConfig = {
  slug: 'affiliate-links',
  labels: { singular: 'Affiliate Link', plural: 'Affiliate Links' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrActive,
    update: authenticated,
  },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'program', 'active', 'placement'] },
  hooks: {
    afterChange: [revalidateAffiliateLinksCache],
    afterDelete: [revalidateAffiliateLinksCacheOnDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true }, // NOT localized — internal identifier
    slugField(),
    {
      name: 'program',
      type: 'select',
      required: true,
      options: ['amazon', 'kinsta', 'dinorank', 'digitalocean', 'other'].map((v) => ({
        label: v,
        value: v,
      })),
    }, // NOT localized
    {
      name: 'destinations',
      type: 'array',
      fields: [
        { name: 'marketplace', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    }, // NOT localized — resolved by pickDestination()
    { name: 'cookieWindowDays', type: 'number', access: { read: authenticatedFieldRead } }, // internal
    { name: 'commissionNote', type: 'text', access: { read: authenticatedFieldRead } }, // internal
    { name: 'active', type: 'checkbox', defaultValue: false }, // replaces drafts
    {
      name: 'placement',
      type: 'select',
      options: ['stack-page', 'inline-post', 'both'].map((v) => ({ label: v, value: v })),
    }, // NOT localized
    { name: 'order', type: 'number' }, // NOT localized, optional sort
    { name: 'tagline', type: 'text', localized: true }, // prose
    { name: 'whyIUseIt', type: 'textarea', localized: true }, // prose
    { name: 'disclosureOverride', type: 'textarea', localized: true }, // prose
    { name: 'ctaLabel', type: 'text', localized: true }, // prose
    // Deliberately absent per constraints: `rel` (code-only), `price` (never a field)
  ],
}
```

### `pickDestination()` pure function
```ts
// Source pattern: src/lib/service-slugs.ts split-out convention (this repo)
// — NO `payload`/`@payload-config` import here, so this stays importable
// from a Client Component.
export type Destination = { marketplace: string; url: string }

export function pickDestination(destinations: Destination[], marketplace: string): Destination | undefined {
  return destinations.find((d) => d.marketplace === marketplace) ?? destinations[0]
}
```

### `AffiliateLink` component — `rel` emitted from code, Amazon rendered direct
```tsx
// AFF-03: rel is a hardcoded string literal, never a prop sourced from CMS data.
// AFF-04: no /go/ redirect for Amazon, no referrerPolicy override, tag= stays
// visible in the rendered href exactly as stored in `destinations[].url`.
export function AffiliateLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="sponsored nofollow noopener">
      {children}
    </a>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| N/A | N/A | — | This phase introduces a new pattern to the repo (checkbox-gated collection) rather than replacing an old one; there is no prior "affiliate link" implementation to compare against |

**Deprecated/outdated:** None relevant — no library versions changed for this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A faithful Spanish translation of "As an Amazon Associate I earn from qualifying purchases." (rather than the EU `amazon.es` program's own mandated Spanish sentence) is the correct approach for LEG-02's Spanish-language disclosure, since Juan's account (`juantech02-20`) is a US-agreement account with no Spanish-language requirement of its own [ASSUMED — reasoning is sound and grounded in two live-fetched official Amazon pages, but the exact translated wording itself has not been reviewed by Juan] | Summary; Common Pitfalls #2; Standard Stack | If Juan actually wants to align with the `amazon.es`-style phrasing (e.g. for brand-consistency with a future EU marketplace expansion), shipping a plain translation instead could read as slightly less "official-sounding" — low legal risk either way since English is the only contractually-mandated language, but a wording choice Juan should confirm before it's locked into `messages/es.json` |
| A2 | `authenticatedOrActive` (mirroring `authenticatedOrPublished`) is the correct/expected access-function name and shape for this phase — CONTEXT.md leaves "nombres exactos de los enums internos" as Claude's discretion but does not explicitly name this access function | Architecture Patterns Pattern 1 | Purely cosmetic risk — a differently-named function with the identical `{ active: { equals: true } }` query-constraint body satisfies AFF-05/SC-4/SC-5 equally; only the name is a discretionary choice |
| A3 | The two internal fields (`cookieWindowDays`, `commissionNote`) should be gated individually with a shared `FieldAccess` constant rather than wrapped in a `group` (unlike `targetKeywordField`'s shape) | Architecture Patterns Pattern 2; Code Examples | If the planner instead groups them, it would change the flat field list Juan is meant to approve in the frozen matrix — worth flagging explicitly rather than silently deviating from the CONTEXT.md field list |

**If this table is empty:** N/A — see above; both entries are naming/wording choices flagged for confirmation, not structural risks to SC-1 through SC-5.

## Open Questions

1. **Where does `AffiliateDisclosure` actually render before Phase 48 exists?**
   - What we know: SC-1 only requires the component exist and render correct bilingual copy; AFF-01 through AFF-06 don't require it be mounted on a live page yet (the `/stack` page and inline post block are explicitly Phase 48's scope, deferred per CONTEXT.md).
   - What's unclear: How the planner verifies SC-1 "renders" without a real page to `curl`. A temporary preview route, a Playwright-rendered snapshot of the isolated component, or simply verifying the compiled output/props contract may all satisfy it — this repo has no unit-test framework (`nyquist_validation: false` in config, confirmed — no `vitest`/`jest` config or test files found in the repo).
   - Recommendation: Plan a small in-repo verification (e.g., a throwaway admin-only preview render, or Playwright screenshot of the component mounted in isolation) rather than waiting for Phase 48's real page — SC-1 is scoped to this phase and needs its own verification method.

2. **Exact final wording of the Spanish Amazon disclosure sentence.**
   - What we know: The English sentence is fixed and non-negotiable (Section 5 of the Operating Agreement — quoted verbatim above). A faithful translation is the right category of solution (see Assumptions A1).
   - What's unclear: The precise Spanish wording Juan wants to ship — a literal translation ("Como Afiliado de Amazon, gano comisiones por las compras que califican.") versus something closer to the EU program's phrasing, versus Juan's own preferred voice.
   - Recommendation: Planner should insert a `checkpoint:human-verify` (or equivalent confirmation gate) specifically for the ES Amazon sentence's exact wording before it's written into `messages/es.json`, separate from the general disclosure prose (which is Claude's discretion per CONTEXT.md).

## Environment Availability

No external tool/service dependency is introduced by this phase beyond what already runs in this repo (Postgres via `DATABASE_URI`, already verified reachable per `CLAUDE.md`'s Database Safety section and `scripts/db/04-which-database.ts`). Skipping detailed environment audit — this phase is Node/Postgres/Payload only, all already confirmed operational by every prior phase's migrations.

## Validation Architecture

Skipped — `.planning/config.json` has `"nyquist_validation": false` [VERIFIED: .planning/config.json:22] (explicitly disabled, not merely absent).

## Security Domain

`security_enforcement` is `true` [VERIFIED: .planning/config.json:42] — included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No new auth surface — `authenticated` access fn (existing) gates admin writes, unchanged |
| V3 Session Management | No | No session changes |
| V4 Access Control | Yes | Collection-level `authenticatedOrActive` (new, mirrors documented Payload `Access` pattern) + field-level `access.read` on `cookieWindowDays`/`commissionNote` (existing `FieldAccess` pattern from `targetKeyword.ts`) |
| V5 Input Validation | Yes | Payload's built-in field-type validation (`select` enum options, `text`/`textarea` length via admin, `array` sub-field `required: true`) — no custom parser needed |
| V6 Cryptography | No | No secrets/crypto touched by this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cached draft/internal-field leak via `unstable_cache` (documented root-cause class in this repo's own `cache.ts` header comment) | Information Disclosure | Always pass `overrideAccess: false` explicitly in every `getCachedAffiliateLinks()` call, exactly as every existing fetcher in `src/lib/cache.ts` already does — this is not new guidance, it is the file's own established header-comment discipline |
| CMS-editable `rel` attribute enabling accidental removal of `nofollow`/`sponsored` | Tampering (of SEO-relevant markup, not security in the classic sense, but explicitly a hard constraint of this milestone) | `rel="sponsored nofollow noopener"` is a hardcoded string literal in the `AffiliateLink` component — never a field, never editable, per AFF-03 |
| Open redirect via a `url` field an editor could point anywhere | Tampering/Spoofing | Out of scope for this phase (no redirect route exists yet — that's Phase 47's `/go/[slug]`); this phase only stores `destinations[].url`, it renders it directly without any redirect hop for Amazon per AFF-04 |

## Sources

### Primary (HIGH confidence)
- `src/collections/Websites/index.ts` (this repo, read in full) — collection structural pattern
- `src/access/authenticatedOrPublished.ts` (this repo, read in full) — access-function shape to mirror for `authenticatedOrActive`
- `src/fields/targetKeyword.ts` (this repo, read in full) — field-level `FieldAccess` gating pattern
- `src/lib/cache.ts` (this repo, read in full) — `getCached*`/`unstable_cache` pattern, including its own header-comment security rationale
- `src/lib/cache-tags.ts` (this repo, read in full) — hook-pair wiring pattern
- `src/collections/CaseStudies/index.ts` (this repo, read in full, lines 1-50) — confirms hooks wired directly on hand-authored collections, not via plugin `overrides`
- `src/blocks/ServiceScopeCard/Component.tsx` (this repo, read in full) — `getTranslations` consumption pattern
- `messages/es.json` (this repo, read in full) — current namespace shape to extend
- `scripts/seed-legal-pages.ts` (this repo, read in full) — original `/privacy` content-authoring script and its Lexical-builder helpers
- `scripts/humanize-legal-pages.ts` (this repo, read in full, first ~100 lines) — most recent `/privacy` update script, current live copy (6 ES/EN sections, no Resend mention)
- `src/app/actions/subscribe.tsx` (this repo, read in full) — confirms the Resend-backed double opt-in flow is already live
- `src/collections/Subscribers/index.ts` (this repo, read in full) — confirms `status` field design, no `active` checkbox precedent found here either
- `src/migrations/20260820_155934_subscribers_collection.ts` (this repo, read in full) — reference shape for a clean additive `CREATE TABLE` migration
- `CLAUDE.md` (this repo, read in full) — Database Safety section, `payload migrate:create`/`migrate` workflow
- `.planning/phases/44-decisiones-de-monetizaci-n/DECISIONS.md` (this repo, read relevant sections) — confirms Amazon account `juantech02-20` is a US/amazon.com account
- Context7 `/payloadcms/payload/v3.85.0`, `docs/access-control/collections.mdx` "Advanced Read Access Function" — `isPublic` checkbox query-constraint pattern, version-matched to installed `payload@3.85.2`
- Context7 `/payloadcms/payload/v3.85.0`, `docs/fields/overview.mdx` + `docs/access-control/fields.mdx` — confirms `access.read` is valid on primitive field types, not only `group`
- `https://affiliate-program.amazon.com/help/operating/agreement` (fetched live this session) — verbatim English disclosure requirement, Section 5, "Last Updated: October 15, 2025"

### Secondary (MEDIUM confidence)
- `https://afiliados.amazon.es/help/operating/agreement` (fetched live this session) — verbatim Spanish disclosure text for the separate EU/`amazon.es` Associates agreement, "Last Updated: October 15, 2025" — cited to demonstrate this text exists and is official, NOT as Juan's own requirement (see Pitfall 2 / Assumption A1)
- `https://affiliate-program.amazon.com/help/operating/policies` (fetched live this session) — Redirecting Links / cloaking prohibition language, "Updated: April 14, 2026" — matches the date cited in ROADMAP.md's Phase 46/47 constraints

### Tertiary (LOW confidence)
- WebSearch summaries of third-party blog posts (TermsFeed, LegalClarity, Geniuslink, etc.) about Amazon disclosure requirements — used only to locate the correct official URLs, not cited as the source of any claim in this document

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages, every version confirmed directly from `package.json`
- Architecture: HIGH — every pattern read in full from this repo's own source this session, cross-checked against official Payload 3.85.0 docs via Context7
- Pitfalls: HIGH for Pitfalls 1 and 3 (grounded in this repo's own incident history and file structure); MEDIUM for Pitfall 2 (grounded in two live-fetched official Amazon pages, but the precise ES wording still needs Juan's sign-off — see Open Question 2)

**Research date:** 2026-09-03
**Valid until:** 30 days (stable domain — Payload/next-intl patterns won't drift; Amazon policy pages should be re-checked if Phase 48's actual publish date is materially later than this research, since Amazon updates these policy pages periodically)
