# Phase 53: Base del rediseño: rama, preview, tema y shell - Context

**Gathered:** 2026-11-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Juan abre `dev.juan-tech.com` y ve el shell MUI funcionando con datos reales de Payload, sin que el admin ni producción cambien. Entrega: rama `feat/mui-redesign`, preview en Dokploy en solo lectura con `noindex`, tema MUI v9 oscuro montado en `(frontend)`, nav y footer desde los globals Header y Footer, selector de idioma EN/ES y toggle de movimiento. No migra páginas (fases 54 y 55).

</domain>

<decisions>
## Implementation Decisions

### Preview y solo lectura (BASE-01)
- Aplicación nueva en Dokploy desde `feat/mui-redesign`, mismo Dockerfile y misma red que producción, dominio `dev.juan-tech.com`.
- Rol Postgres nuevo con `SELECT` únicamente y `default_transaction_read_only=on` (cambio aditivo en la DB compartida, sin tocar datos).
- Con `PREVIEW_READONLY=true`, las rutas que escriben quedan inertes: `/go` redirige sin registrar clic, doble opt-in, suscriptores y formulario responden éxito simulado sin escribir.
- `/admin` y `/api` de Payload responden 404 en el preview (el login escribe sesiones). El admin real sigue en producción.
- `noindex` en meta y cabecera `X-Robots-Tag`, `robots.txt` con `Disallow: /` y sin sitemap en el preview.

### Tema MUI y aislamiento (BASE-02)
- `AppRouterCacheProvider` (`enableCssLayer`) y `ThemeProvider` oscuro se montan en `src/app/(frontend)/[locale]/layout.tsx`, nunca en `(payload)`.
- Tailwind convive solo dentro de la rama: `globals.css` sigue cargando en `(frontend)` y se retira en la fase 57 (CAL-03). Nada de esa convivencia llega a producción.
- `tokens.ts`, `theme.ts` y `augment.d.ts` se copian del sandbox a `src/theme/`. Geist por `next/font`.
- Next se queda en 15.4.11 (límite de `@payloadcms/next`). Se verifica que MUI 9.5 compila. `@mui/lab` (beta) solo para Timeline.

### Nav y footer desde Payload (BASE-03)
- Los enlaces salen de los globals Header y Footer por Local API, reusando los helpers de slugs localizados (`src/lib/service-slugs.ts`).
- `SiteHeader` y `SiteFooter` nuevos en MUI con el mismo contrato de datos. Los viejos se borran en la fase 57.
- La revalidación de los globals sigue por `revalidateTag` en `afterChange`. Se prueba cambiando un enlace en el admin real y viendo el preview.
- Se conserva el enlace "saltar al contenido" y se agregan landmarks `header`, `nav`, `main` y `footer` con `aria-label` (A11Y.md).

### Idioma y movimiento (BASE-03)
- El selector usa `Link` de `next-intl/navigation` con `usePathname` para ir a la ruta equivalente, respetando slugs localizados.
- El toggle de movimiento es un contexto cliente que escribe `localStorage` y un atributo `data-motion` en `<html>`. Valor inicial desde `prefers-reduced-motion`.
- Al pausar: `animation-play-state: paused`, transiciones desactivadas por variables CSS del tema y aviso a los shaders.
- `MotionProvider` actual se reemplaza por el contexto nuevo. El viejo queda hasta la fase 57.

### Claude's Discretion
Detalles de nombres de archivos, estructura interna de `src/theme/` y orden de las tareas.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Sandbox `designs/design-system-mui/` con `src/theme/{tokens,theme,augment.d}.ts`, `providers.tsx` y `layout.tsx`.
- `src/i18n/{routing,navigation,request}.ts` de next-intl, `src/lib/service-slugs.ts`, `src/lib/cache-tags.ts`, `src/lib/public-origin.ts`.
- Globals `src/globals/{Header,Footer}` y componentes `SiteHeader`, `SiteFooter`, `LocaleSwitcher`, `MotionProvider`.

### Established Patterns
- `src/app/(frontend)/[locale]/layout.tsx` es la raíz del frontend (sin layout raíz superior); `metadataBase` y título se definen ahí.
- Middleware en Edge con next-intl; `/es/*` redirige 308 a la ruta sin prefijo (español sin prefijo).
- Payload en proceso con Local API, `push:false`, migraciones aditivas únicamente.
- `DATABASE_URI` de `.env` debe verificarse con `scripts/db/04-which-database.ts` antes de escribir.

### Integration Points
- `src/app/robots.ts` y `src/app/sitemap.xml` para el modo preview.
- Rutas que escriben: `src/app/go`, `src/app/actions`, `src/app/api/newsletter`.
- Deploy en Dokploy (ver skill `dokploy-deploy`) y acceso a la DB por SSH/relay (memoria `reference_prod_db_access`).

</code_context>

<specifics>
## Specific Ideas

Diseño aprobado por Juan en `designs/design-system-mui/` (solo oscuro, tokens y Geist del sandbox). Preview siempre contra producción en solo lectura, nunca contra una DB distinta.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
