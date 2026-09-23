# Phase 46: Disclosure Legal + Esquema de Links de Afiliado - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — 2 áreas presentadas, ambas aceptadas por Juan sin cambios

<domain>
## Phase Boundary

Todo lo que un link de afiliado necesita para existir queda construido y aprobado antes de que se renderice el primero: disclosure bilingüe en código (nunca en el CMS), `/privacy` cubriendo el flujo de email, y la colección `affiliate-links` con su matriz de localización congelada y aprobada antes de cargar un solo documento, con su migración aditiva leída antes de aplicarse contra la base real (Dokploy, no hay sandbox).

Queda fuera: la ruta `/go` y el registro de clics (Phase 47), la página `/stack` y los links inline en contenido (Phase 48), cualquier programa de afiliados nuevo, cualquier cambio a rutas ya publicadas.

</domain>

<decisions>
## Implementation Decisions

### Matriz de localización de `affiliate-links` (congelada — SC-3)
- **NO localizados**: `name` (identificador interno), `slug`, `program` (enum: amazon | kinsta | dinorank | digitalocean | other), `destinations` (array, campo `marketplace` + `url`, resuelto en render por `pickDestination()`), `cookieWindowDays`, `commissionNote`, `active` (checkbox, reemplaza drafts — no hay versiones), `placement` (enum: stack-page | inline-post | both), `order` (number, sort opcional).
- **Localizados** (prosa, solo ES/EN): `tagline`, `whyIUseIt`, `disclosureOverride`, `ctaLabel`.
- **Nunca campos del CMS**: `rel` (se emite desde el código en `AffiliateLink`), `price`.
- `cookieWindowDays` y `commissionNote` son campos internos, gateados por el helper de field-access existente (mismo patrón que ya usa el proyecto para otros campos internos).
- La colección se aprueba con `COUNT(*) = 0` — la migración se corre y se lee antes de cargar cualquier contenido real.

### Disclosure — componente único reusable
- `AffiliateDisclosure` es un solo componente que recibe variant/context y se monta en dos lugares: la página `/stack` (Phase 48) y el bloque inline de afiliados en posts (Phase 48). Un solo texto legal fuente, sin deriva entre ambos lugares.
- Copy vive en `messages/{es,en}.json`, nunca en contenido del CMS. La frase textual requerida por Amazon Associates aparece verbatim en ambos idiomas donde haya links de Amazon.
- Restricción de cero tracking con consentimiento (sin GA4, sin píxeles, sin `document.cookie`/`localStorage` en la ruta de afiliado) es un constraint del milestone, no una elección de esta fase.

### Claude's Discretion
- Nombres exactos de los enums internos (`program`, `placement`) más allá de los valores ya fijados arriba.
- Estructura interna del componente `AffiliateDisclosure` (props, variantes) mientras cumpla "un solo componente, un solo texto fuente".
- Redacción exacta de la prosa de `/privacy` sobre retención y proceso de baja, siempre que cubra Resend como encargado del tratamiento y sea verificable por curl sobre el HTML renderizado (SC-2).

</decisions>

<code_context>
## Existing Code Insights

- `src/collections/Websites/index.ts` — patrón de referencia más reciente para una colección nueva: `access` con `authenticated`/`authenticatedOrPublished`, `admin.useAsTitle`, campos localizados explícitos por campo (no por colección), arrays con sub-fields, `slugField()` al final. `affiliate-links` sigue esta forma pero con `active` (checkbox) en vez de `versions.drafts` — no hay flujo de revisión editorial para links de afiliado.
- El incidente del 2026-07-12 (`CLAUDE.md`, sección Database Safety) es la razón directa de congelar la matriz antes de cargar contenido: una migración que localiza un campo ya poblado sin backfill borró el CTA de Home en producción. Esta fase no tiene ese riesgo — parte de cero documentos — pero la migración igual se lee línea por línea antes de aplicarse, por disciplina.
- `src/lib/affiliate.ts` (no existe todavía) es donde vive `pickDestination()` — función pura, sin acceso a DB, que resuelve el array `destinations` por mercado.
- `getCachedAffiliateLinks()` (no existe todavía) es la única lectura permitida de la colección — `overrideAccess: false`, cache tags, hooks de revalidación. Mismo patrón de cache que ya debería existir para otras colecciones públicas del proyecto (revisar en research/planning).

</code_context>

<specifics>
## Specific Ideas

- Los links de Amazon se renderizan directos y sin cloaking, `tag=` visible, sin `referrerPolicy` override, sin pasar por `/go/` — las Program Policies del 2026-04-14 prohíben textualmente los Redirecting Links para Amazon. `/go/` es solo para programas no-Amazon (Phase 47).
- La migración es puramente aditiva: `CREATE TABLE`/`ADD COLUMN`/índices únicamente. Nada que toque una columna con datos.

</specifics>

<deferred>
## Deferred Ideas

- Ruta `/go`, fix de middleware, registro de clics — Phase 47.
- Página `/stack` y links inline en contenido — Phase 48.

</deferred>
