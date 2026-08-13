# Phase 2: Bilingüe + SEO - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

El sitio tiene routing y contenido bilingüe EN/ES con paridad completa, y la capa de SEO técnico (metas, sitemaps, llms.txt, JSON-LD, redirects) queda operativa antes de que exista contenido migrado. Entrega: `[locale]` routing vía next-intl, localización nativa de Payload en los campos, `@payloadcms/plugin-seo` tabbed, sitemap.xml/robots.ts hand-built, llms.txt/llms-full.txt, JSON-LD hand-written, plugin-redirects con middleware que ejecuta los redirects. No incluye: storage Cloudinary real (Fase 3), contenido migrado (Fase 4), páginas públicas completas (Fase 5 — esta fase valida el routing/SEO plumbing con contenido placeholder/de prueba, no con el contenido real todavía).

</domain>

<decisions>
## Locale por defecto y estrategia de prefijo (heredado del sitio actual — no es una decisión nueva)

- `defaultLocale: 'es'`, `locales: ['es', 'en']` — igual que JuanPortfolio (`src/payload.config.ts:103-113`)
- Prefijo de URL "as-needed": español SIN prefijo (`/`, `/blog/...`), inglés CON prefijo (`/en/`, `/en/blog/...`) — confirmado en `JuanPortfolio/src/middleware.ts` (reescribe `/es/*` a `/*` internamente, nunca expone `/es/` al usuario)
- Esto es una constraint de paridad de URLs (PROJECT.md), no una preferencia de diseño — cambiar este comportamiento rompería el inventario de URLs que se congela en Fase 4 para preservar rankings

## next-intl + Payload localization (combinación, no alternativas — confirmado en research/ARCHITECTURE.md y research/SUMMARY.md)

- next-intl maneja: routing `[locale]` segment, strings de UI/interfaz (botones, labels, nav)
- Payload localization (`localized: true` en campos) maneja: contenido editorial (títulos, rich text, metas SEO por idioma)
- Patrón confirmado funcionando en apturio (referencia de producción real), no es teórico

## SEO plugin y metas (research/PLUGINS.md, ya resuelto)

- `@payloadcms/plugin-seo` tabbed en Pages, Posts, CaseStudies — únicas 3 colecciones que necesitan pestaña SEO (Authors/Categories/Testimonials/Clientes no la necesitan)
- No existe plugin oficial de sitemap — patrón confirmado: `app/sitemap.ts` (o route handler si se necesita bypass de cache estático) consultando Payload Local API directo, con `alternates` para el par de locales EN/ES
- `app/robots.ts` — convención nativa de Next.js 15, ~10 líneas, sin plugin
- JSON-LD: escrito a mano por tipo de contenido (Person para el sitio en general/home, Article para posts, potencialmente CreativeWork/breadcrumb para case studies) — reutiliza los mismos campos que ya gestiona plugin-seo (title, description, OG image), no un dependency nuevo

## Redirects (research/ARCHITECTURE.md)

- `@payloadcms/plugin-redirects` gestiona la colección de redirects en el admin
- El plugin NO ejecuta los redirects por sí solo — se necesita un middleware o route handler explícito que lea la colección y haga el redirect real en runtime
- Alcance de esta fase: el plumbing (colección + middleware funcionando con al menos un redirect de prueba). Los redirects reales masivos (URLs que cambiaron en la migración) se generan en Fase 4 (MIGR-06) y se consumen aquí

## llms.txt / llms-full.txt

- Global de Payload (`Llms`, ya en el patrón de aprendoclub) + route handler que sirve el contenido en texto plano
- Mantener el mismo concepto que JuanPortfolio ya tiene (`src/app/(frontend)/llms.txt`, `llms-full.txt`) pero generado dinámicamente desde el global, no estático

### Claude's Discretion

- Estructura interna de los archivos de i18n (`src/i18n/request.ts`, `messages/es.json`, `messages/en.json` — cuántas keys, cómo se organizan)
- Implementación exacta del middleware de next-intl (siempre que preserve el comportamiento "es sin prefijo, en con prefijo")
- Formato exacto del JSON-LD (siempre que sea válido schema.org y use los campos ya definidos en las colecciones)
- Contenido de prueba/placeholder usado para validar el routing bilingüe en esta fase (no hay contenido real migrado todavía — eso es Fase 4)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/middleware.ts` — patrón de rewrite es-sin-prefijo/en-con-prefijo a replicar (adaptar, simplificar si aplica a next-intl moderno)
- `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/i18n/translations.ts` — referencia de qué strings de UI existen hoy
- `/Users/juan/Documents/Codigo/Arianna/apturio/website/src/i18n` — patrón de producción real de next-intl + Payload localization combinados
- `/Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/app/(frontend)/llms.txt`, `llms-full.txt` — contenido/formato de referencia

### Established Patterns

- Colecciones ya tienen campos `localized: true` donde corresponde desde Fase 1 (revisar cuáles faltan marcar — puede requerir un ajuste menor a colecciones existentes en esta fase, no un rediseño)

### Integration Points

- `next.config.mjs` necesita el wrapper `createNextIntlPlugin`
- `payload.config.ts` necesita el bloque `localization` (locales + defaultLocale)
- Middleware en la raíz del proyecto (`src/middleware.ts`)

</code_context>

<specifics>
## Specific Ideas

- El comportamiento de URLs debe ser indistinguible del sitio actual para no romper SEO — este es el requirement más estricto de la fase

</specifics>

<deferred>
## Deferred Ideas

- Contenido real bilingüe — llega en Fase 4 (migración) y Fase 5 (páginas públicas). Esta fase solo prueba el plumbing técnico.

</deferred>
