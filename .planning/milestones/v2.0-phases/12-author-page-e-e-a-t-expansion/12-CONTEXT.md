# Phase 12: Author Page E-E-A-T Expansion - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Authors collection recupera `expertise[]`, `education[]`, `experience[]` (recortados a propósito en Phase 1). Author page gana 3 secciones nuevas (Expertise, Educación y Certificaciones, Experiencia) diseñadas con `ui-ux-pro-max` sobre los primitivos shadcn ya tokenizados. Person JSON-LD enriquecido con `sameAs`/`knowsAbout`/`hasCredential`. Contenido 100% real (no placeholder) — confirmado disponible vía `localhost:3000/api/authors` (sitio de referencia real, JuanPortfolio).

</domain>

<decisions>
## Implementation Decisions

### Contenido — fuente y localización
- Contenido real ya existe en `localhost:3000/api/authors` (bio, expertise×4, education×2, experience×2, avatar Cloudinary ya migrado en Phase 4) — se copia/adapta directo, sin placeholder
- Los 8 items de expertise/education/experience se TRADUCEN a EN ahora (el sitio viejo no los traduce — se cierra ese gap en el rebuild, no se replica)
- Avatar: reusar el mismo asset Cloudinary ya migrado (`portfolio/juan-angulo-portrait.avif`) — confirmar que ya está en la Media collection actual antes de re-subir
- ids Mongo de los sub-arrays del sitio viejo (`698b...`) se descartan; Postgres/Payload genera sus propios ids

### Diseño visual (3 secciones nuevas)
- `ui-ux-pro-max` diseña la composición/layout, pero construida sobre primitivos shadcn ya tokenizados (`Card`, `Badge`, tokens Phase 7-8: `font-heading`, `shadow-*`, `duration-fast`) — consistencia con el resto del sitio, no un sistema visual paralelo
- Expertise → tags con `Badge` (mismo patrón que `credentials` en `AuthorCard.tsx` actual)
- Educación → grid de tarjetas (`md:grid-cols-2`, logo+degree+institution+fecha), mismo shape que el sitio de referencia, sobre `Card` shadcn
- Experiencia → timeline visual (línea + puntos conectores) diseñada por `ui-ux-pro-max` — upgrade real sobre la lista `<ul>` plana del sitio viejo

### Población de datos
- Script seed dedicado `scripts/seed-author-eeat.ts`, patrón ya usado en Phases 4/10.x — Payload Local API, idempotente (upsert por slug `juan-carlos-angulo`)
- Traducciones EN se escriben directamente en el seed script, no vía admin
- JSON-LD generado server-side en `authors/[slug]/page.tsx`, mismo patrón que el `personData` actual del archivo — agregar `sameAs` (array de `socialLinks[].url`), `knowsAbout` (desde `expertise[].topic`), `hasCredential` (desde `education[]`: name=degree, organization=institution, datePublished=endDate)
- `education[].logo` portado como upload opcional (`relationTo: media`)
- `certificate` upload del sitio viejo NO se porta — no hay archivos reales de certificados disponibles

### Claude's Discretion
- Copy exacto de las traducciones EN de expertise/education/experience — traducción profesional coherente con el tono ya establecido en `jobTitle`/`bio` EN existente
- Espaciado/orden exacto de las 3 secciones nuevas dentro de la página (después del `AuthorCard` existente, antes de posts/case studies — orden lógico E-E-A-T primero)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/AuthorCard.tsx` — patrón de referencia: `Card` shadcn, `Badge` para credentials, `Avatar`, iconos `lucide-react` (sin brand icons), tokens `duration-fast`/`shadow-focus`
- `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` — página actual: `AuthorCard` + grids de posts/case studies + `JsonLd` con `personData` mínimo (name/jobTitle/url) — se extiende ahí mismo
- `src/collections/Authors/index.ts` — colección actual trimmed (name/jobTitle/bio/avatar/credentials/yearsExperience/socialLinks/slug) — se le agregan los 3 arrays nuevos

### Established Patterns
- Seed scripts idempotentes vía Payload Local API (visto en Phase 4 migración y Phase 10.x gap-fill)
- JSON-LD generado inline en cada page.tsx, sin librería (`generatePersonSchema` no existe en este proyecto — es del sitio viejo; acá se arma el objeto a mano como ya hace `personData`)

### Integration Points
- `src/collections/Authors/index.ts` — agregar campos
- `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` — agregar 3 secciones + enriquecer `personData`
- `scripts/seed-author-eeat.ts` (nuevo) — población de datos reales

</code_context>

<specifics>
## Specific Ideas

Contenido real fuente exacta (español, vía `localhost:3000/api/authors`, slug `juan-carlos-angulo`):
- jobTitle ES: "Ingeniero de Software y Consultor SEO Técnico"
- jobTitle EN: "Software Engineer & Technical SEO Consultant"
- expertise ES: SEO Técnico Avanzado (Rastreo e indexación) / Rendimiento Web (WPO & Core Web Vitals) / Algoritmia y Estructuras de Datos / Optimización de Tasa de Conversión (CRO)
- education ES: Ingeniero de software @ Universidad Peruana de Ciencias Aplicadas (UPC), 2022-05→2028-08; Técnico en informática @ Universidad Politécnica Territorial del Estado Bolívar, 2018-02→2020-08
- experience ES: Especialista en Tech SEO @ AprendoSEO, 2022-11→2026-02; Desarrollador Web @ Cripto Avances & Nakama Digital, 2022-01→2022-09
- socialMedia: linkedin=linkedin.com/in/juancangulo, github=github.com/sve-nnn, website=juan-tech.com

</specifics>

<deferred>
## Deferred Ideas

None — discusión se mantuvo dentro del alcance de la fase.

</deferred>
