# Phase 38: Websites — Schema & Collection Design - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Crear la colección `Websites` en Payload (WEB-01..05): schema completo (título, slug, stack, screenshots, challenges, año, rol, industria, highlights técnicos), scores de Lighthouse + `lighthouseCapturedAt` obligatorio, relaciones opcionales `client`→Clientes y `relatedCaseStudy`→case-studies, registro en `payload.config.ts` y `@payloadcms/plugin-seo`, y `payload generate:types` corrido. Sin frontend ni contenido real — eso es Phase 39/40.

</domain>

<decisions>
## Implementation Decisions

### Versiones y Admin UI
- `versions.drafts` con `autosave` (interval 100) + `schedulePublish`, `maxPerDoc: 50` — mismo patrón que `CaseStudies`
- `admin.useAsTitle: 'title'`, `admin.defaultColumns: ['title', 'client', 'year', 'updatedAt']`
- Access control idéntico a `CaseStudies`: `create`/`delete`/`update` → `authenticated`, `read` → `authenticatedOrPublished`

### Campos de contenido
- `stack`: array simple de tags de texto (`{ name: 'tag', type: 'text', required: true }`) — no relationship/taxonomía nueva, 6 documentos no lo ameritan
- `challenges`: array reusando el shape de `CaseStudies.challenge` (`{ name: 'text', type: 'textarea', required: true, localized: true }`)
- `screenshots`: array de `upload` → `media` (múltiples screenshots reales por sitio)
- Campos localizados (`localized: true`) en todo texto editorial: `title`, `role`, `industry`, `highlights` — igual que `CaseStudies`
- `slug` vía `slugField()` existente (mismo helper que usa `CaseStudies`)

### Lighthouse
- Campo `group` `lighthouse` con 4 `number` fields (`performance`, `accessibility`, `bestPractices`, `seo`, rango 0-100) + `lighthouseCapturedAt` (`date`, `required: true`) al mismo nivel del grupo — nunca se guarda un score sin fecha

### Relaciones
- `client`: `relationship` → `clientes`, `hasMany: false`, `required: false`
- `relatedCaseStudy`: `relationship` → `case-studies`, `hasMany: false`, `required: false`, unidireccional (sin back-reference en `CaseStudies`)

### Claude's Discretion
- Nombres exactos de subcampos dentro de arrays (`challenges`, `stack`, `screenshots`) siguiendo convención camelCase ya usada en `CaseStudies`
- Orden de campos en el schema — seguir agrupación lógica (identidad → stack/challenges → media → lighthouse → relaciones → slug), igual estructura visual que `CaseStudies`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/collections/CaseStudies/index.ts` — patrón de referencia directo: access control, versions/drafts, `slugField()`, array `challenge` con `textarea` localizado
- `src/fields/slug.ts` (`slugField()`) — helper reusable para el campo slug
- `src/access/authenticated.ts`, `src/access/authenticatedOrPublished.ts` — access control compartido

### Established Patterns
- Colecciones se registran en `src/payload.config.ts`: import + entrada en array `collections: [...]` (línea ~77-84) + entrada en `seoPlugin({ collections: [...] })` (línea ~91-92)
- Campos editoriales de texto largo usan `localized: true`; relaciones y metadata técnica (fechas, scores) no se localizan

### Integration Points
- `src/payload.config.ts`: agregar `import { Websites } from './collections/Websites'`, agregar `Websites` al array `collections`, agregar `'websites'` a `seoPlugin({ collections: [...] })`
- Después de escribir el schema: correr `payload generate:types` para que `payload-types.ts` refleje la colección nueva

</code_context>

<specifics>
## Specific Ideas

No specific requirements adicionales — REQUIREMENTS.md (WEB-01..05) ya especifica el schema con suficiente detalle; esta fase sigue el patrón `CaseStudies` al pie de la letra.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
