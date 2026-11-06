# Phase 53: Base del rediseño: rama, preview, tema y shell - Research

**Researched:** 2026-11-06
**Domain:** MUI v9 sobre Next 15.4 + Payload 3.85 (CSS en capas, shell RSC/cliente), preview de solo lectura en Dokploy contra Postgres compartido, next-intl
**Confidence:** MEDIUM (stack y código HIGH; acceso a la DB y a Dokploy no se pudo probar desde esta sesión, ver Assumptions Log)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Preview y solo lectura (BASE-01)**
- Aplicación nueva en Dokploy desde `feat/mui-redesign`, mismo Dockerfile y misma red que producción, dominio `dev.juan-tech.com`.
- Rol Postgres nuevo con `SELECT` únicamente y `default_transaction_read_only=on` (cambio aditivo en la DB compartida, sin tocar datos).
- Con `PREVIEW_READONLY=true`, las rutas que escriben quedan inertes: `/go` redirige sin registrar clic, doble opt-in, suscriptores y formulario responden éxito simulado sin escribir.
- `/admin` y `/api` de Payload responden 404 en el preview (el login escribe sesiones). El admin real sigue en producción.
- `noindex` en meta y cabecera `X-Robots-Tag`, `robots.txt` con `Disallow: /` y sin sitemap en el preview.

**Tema MUI y aislamiento (BASE-02)**
- `AppRouterCacheProvider` (`enableCssLayer`) y `ThemeProvider` oscuro se montan en `src/app/(frontend)/[locale]/layout.tsx`, nunca en `(payload)`.
- Tailwind convive solo dentro de la rama: `globals.css` sigue cargando en `(frontend)` y se retira en la fase 57 (CAL-03). Nada de esa convivencia llega a producción.
- `tokens.ts`, `theme.ts` y `augment.d.ts` se copian del sandbox a `src/theme/`. Geist por `next/font`.
- Next se queda en 15.4.11 (límite de `@payloadcms/next`). Se verifica que MUI 9.5 compila. `@mui/lab` (beta) solo para Timeline.

**Nav y footer desde Payload (BASE-03)**
- Los enlaces salen de los globals Header y Footer por Local API, reusando los helpers de slugs localizados (`src/lib/service-slugs.ts`).
- `SiteHeader` y `SiteFooter` nuevos en MUI con el mismo contrato de datos. Los viejos se borran en la fase 57.
- La revalidación de los globals sigue por `revalidateTag` en `afterChange`. Se prueba cambiando un enlace en el admin real y viendo el preview.
- Se conserva el enlace "saltar al contenido" y se agregan landmarks `header`, `nav`, `main` y `footer` con `aria-label` (A11Y.md).

**Idioma y movimiento (BASE-03)**
- El selector usa `Link` de `next-intl/navigation` con `usePathname` para ir a la ruta equivalente, respetando slugs localizados.
- El toggle de movimiento es un contexto cliente que escribe `localStorage` y un atributo `data-motion` en `<html>`. Valor inicial desde `prefers-reduced-motion`.
- Al pausar: `animation-play-state: paused`, transiciones desactivadas por variables CSS del tema y aviso a los shaders.
- `MotionProvider` actual se reemplaza por el contexto nuevo. El viejo queda hasta la fase 57.

### Claude's Discretion
Detalles de nombres de archivos, estructura interna de `src/theme/` y orden de las tareas.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BASE-01 | Existe la rama `feat/mui-redesign` y un preview en `dev.juan-tech.com` (Dokploy) que lee la DB de producción en solo lectura, con `noindex` y fuera del sitemap. | Secciones "Preview de solo lectura", rol Postgres, inventario de escrituras, gating por `PREVIEW_READONLY`, alta en Dokploy, DNS. Hallazgos críticos: no hay Dockerfile (build Nixpacks), el matcher del middleware excluye `/api`, `/admin`, `/go` y robots, `robots.ts` es estático. |
| BASE-02 | El tema MUI v9 (solo oscuro, tokens y Geist del sandbox) está montado en el layout de `(frontend)` sin afectar el admin de Payload. | Secciones "Capas CSS Tailwind v3 vs MUI" (hallazgo crítico), proveedores, `InitColorSchemeScript`, aislamiento de `(payload)` por layouts raíz separados. |
| BASE-03 | Nav, footer, selector de idioma y toggle de movimiento funcionan con los globals Header y Footer de Payload y con `[locale]` real EN/ES. | Contrato de datos de Header/Footer, resolución de enlaces, `normalizeServiceHref`, `usePathname` de next-intl, contexto de movimiento, revalidación real (los globals NO tienen hooks hoy), `<main>` duplicado en 22 páginas. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Base de datos: `DATABASE_URI` de `.env` apunta a la Postgres de producción en Dokploy (`shared-postgres`). Antes de escribir o migrar correr `node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts`. Si el host no es el de Dokploy, parar.
- Migraciones aditivas y escrituras normales de contenido no piden confirmación; `DROP COLUMN`, `DROP TABLE`, `TRUNCATE`, `delete` o reformas con pérdida de datos exigen aprobación nombrada de Juan. Esta fase solo agrega un rol Postgres (aditivo), no toca tablas.
- Payload con `push: false`; migraciones generadas con `payload migrate:create` y leídas antes de aplicar.
- Next fijado en 15.4.11 (peer de `@payloadcms/next@3.85.2` excluye 15.5.x). No subir.
- Frontend: seguir estrictamente A11Y.md (WCAG 2.2 AA). Landmarks con nombre distinto, foco visible, objetivos táctiles mínimos.
- Todo entregable escrito pasa por humanizer, sin guiones largos ni cortos; voz de Juan: encabezados y meta títulos sin puntos ni comas. Cadenas de UI en `messages/{es,en}.json` bajo el namespace `shell`.
- Antes de editar archivos arrancar por un comando GSD (`/gsd:execute-phase` para el trabajo planificado).
- Dokploy despliega producción solo al mergear a `master`; el preview es una aplicación aparte. Validar contra el sitio desplegado, no contra local.
- Contexto operativo (memoria): el clasificador de auto-mode bloquea que Claude levante el relay o el `ssh -L`; Juan corre `./scripts/db/tunnel.sh`. Lo mismo aplica para ejecutar SQL en `shared-postgres`: se planifica como paso manual de Juan.

## Summary

El trabajo se divide en tres frentes casi independientes: (1) infraestructura del preview (rama, rol Postgres de solo lectura, aplicación Dokploy, DNS, variables), (2) código de gating `PREVIEW_READONLY` (noindex, robots, sitemap, 404 en `/admin` y `/api`, rutas que escriben inertes), y (3) tema MUI más shell (proveedores, tema, header, footer, idioma, movimiento). Los frentes 2 y 3 no se tocan entre sí y se pueden planificar en paralelo; el 1 tiene pasos manuales de Juan (DNS, token Dokploy, SQL en el VPS).

Hay cuatro hallazgos que cambian el plan respecto a CONTEXT.md y UI-SPEC.md. **Primero**, el proyecto usa Tailwind v3.4.19, cuya salida no usa `@layer` nativo (medido compilando en local: 0 ocurrencias de `@layer`). Con `enableCssLayer: true` los estilos de MUI quedan en `@layer mui`, y el CSS sin capa de Tailwind (preflight: `button { background-color: transparent }`, `a { color: inherit; text-decoration: inherit }`, `body` con `bg-background`) gana siempre sobre cualquier capa. El orden `@layer theme, base, mui, components, utilities` de UI-SPEC es receta de Tailwind v4 y aquí no funciona. La solución verificada es envolver la salida de `globals.css` en `@layer tailwind` con un plugin PostCSS local y declarar `@layer tailwind, mui;`. **Segundo**, el repo no tiene Dockerfile: producción se construye con Nixpacks (`npm run build`), así que el preview se crea como aplicación Nixpacks, no "mismo Dockerfile". **Tercero**, los globals Header y Footer no tienen hooks `afterChange` ni usan `revalidateTag` hoy (verificado: solo BlogPromo y FeaturedContent los tienen), y el preview es otro proceso: nunca recibirá `revalidateTag` desde el admin de producción, solo expira por TTL (ISR de 60 s). **Cuarto**, el matcher del middleware excluye `api`, `admin`, `go/`, `robots.txt` y los sitemaps, así que el gating de esas rutas no puede vivir en el middleware sin ampliar el matcher de producción.

Payload en producción con `push: false` no escribe al arrancar ni al leer (verificado en `@payloadcms/db-postgres@3.85.2` `connect.js` y sin `jobs.autoRun` en la config). Las únicas escrituras de la app son seis puntos en `src/app` (clic de `/go`, `subscribe`, `subscribe-lead-magnet`, `contact`, `/api/newsletter/confirm` y `unsubscribe`), todos enumerados abajo. El rol de solo lectura con `GRANT SELECT` es la barrera real; `default_transaction_read_only` es un seguro adicional que una sesión puede revertir con `SET TRANSACTION`.

**Primary recommendation:** Desplegar primero un preview con solo el gating y la infraestructura (plan temprano, valida Dokploy, DNS y rol de lectura), luego montar MUI con el plugin PostCSS de capas como primera tarea con un spike de verificación en computed styles, y construir el shell como "server component que lee Payload + vista cliente MUI" con `<main>` único en el layout.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Lectura de Header y Footer | API / Backend (Local API en server component) | Database / Storage | `payload.findGlobal` corre en el servidor; nunca en cliente |
| Tema, tokens, CSS en capas | Browser / Client (ThemeProvider cliente) | Frontend Server (SSR de Emotion por `AppRouterCacheProvider`) | Emotion necesita cliente; SSR inyecta estilos por `useServerInsertedHTML` |
| Selector de idioma | Browser / Client (`usePathname`) | Frontend Server (href canónico SSR) | La ruta actual solo se conoce en cliente; el `href` se calcula de forma pura para que SSR lo emita |
| Toggle de movimiento | Browser / Client | Frontend Server (script inline en `<head>`) | Estado en `localStorage`; el script evita el parpadeo antes del primer pintado |
| noindex, `X-Robots-Tag`, robots, sitemap 404 | Frontend Server (route handlers, middleware) | CDN / Static (`next.config` headers, build-time) | Algunas rutas no pasan por el middleware (matcher) |
| 404 de `/admin` y `/api` en preview | Frontend Server (`next.config` rewrites a ruta 404) | ninguno | El middleware no cubre esas rutas |
| Escrituras inertes (`/go`, suscripción, contacto) | API / Backend (server actions y route handlers) | ninguno | Se corta antes de `payload.create/update/sendEmail` |
| Solo lectura de la DB | Database / Storage (rol Postgres con `GRANT SELECT`) | API / Backend (gating) | La barrera real es el privilegio, no el código |
| Dominio y TLS | CDN / Static (Cloudflare DNS) | Dokploy / Traefik (Let's Encrypt) | Registro A en Cloudflare, certificado en Traefik |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@mui/material` | 9.5.0 | Componentes y tema | Aprobado en el sandbox; peers `react ^19`, `@emotion/*` opcionales [VERIFIED: npm view @mui/material@9.5.0 peerDependencies] |
| `@mui/material-nextjs` | 9.5.0 | `AppRouterCacheProvider` (`v15-appRouter`) | Peer `next ^13 \|\| ^14 \|\| ^15 \|\| ^16`, compatible con 15.4.11 [VERIFIED: npm view @mui/material-nextjs@9.5.0 peerDependencies]. `v15-appRouter` reexporta `v13-appRouter` (leído en el tarball) |
| `@emotion/react` | 11.14.0 | Motor de estilos | Peer de MUI [VERIFIED: npm view @emotion/react version] |
| `@emotion/styled` | 11.14.1 | `styled()` | Peer de MUI [VERIFIED: npm view @emotion/styled version] |
| `@emotion/cache` | 11.14.0 | Lo importa `AppRouterCacheProvider` en su código | Es peer opcional de `material-nextjs`, pero el código hace `require("@emotion/cache")`; el sandbox lo instala [VERIFIED: tarball @mui/material-nextjs@9.5.0 v13-appRouter/appRouterV13.js; designs/design-system-mui/package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next-intl` | 4.13.4 (instalado vía lockfile) | `Link`, `usePathname` locale-aware | Selector y nav [VERIFIED: package-lock.json node_modules/next-intl] |
| `lucide-react` | ya instalado | Iconos del shell (`aria-hidden`) | Pause/Play, Menu, X, Check |
| `postcss` | ya instalado (^8.5.16) | Plugin local de capas | Envolver Tailwind v3 en `@layer tailwind` |
| `@mui/lab` | 9.0.0-beta.10 | Solo `Timeline` | NO se instala en la fase 53 (decisión de UI-SPEC) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plugin PostCSS que envuelve Tailwind en `@layer tailwind` | Quitar `enableCssLayer` y confiar en especificidad | Contradice una decisión bloqueada de Juan; deja a CssBaseline y a `body` dependientes del orden de inyección. Solo como plan B con confirmación de Juan |
| Plugin PostCSS | `corePlugins.preflight: false` + `important: '#__next'` (receta MUI para Tailwind v3) | Rompe las páginas sin migrar (sin `border-style: solid` global, sin reset de encabezados y listas) y `#__next` no existe en App Router |
| Gating de `/admin` y `/api` en `next.config` rewrites | Ampliar el matcher del middleware | Toca el camino caliente de producción que el propio middleware documenta como no ampliable (SEO-39 y 47-CONTEXT) |

**Installation:**
```bash
npm install @mui/material@9.5.0 @mui/material-nextjs@9.5.0 @emotion/react@11.14.0 @emotion/styled@11.14.1 @emotion/cache@11.14.0
# Antes: npm view @mui/material@9.5.0 version && npm audit (gate de UI-SPEC Registry Safety)
```

**Version verification:** `@mui/material` 9.5.0 publicado 2026-10-09 (línea 9.0.0 desde 2026-04-07); `@mui/material-nextjs` 9.5.0 2026-10-09; Emotion sin cambios desde 2024-2025. Next 15.4.11 y React 19.2.7 coinciden con el lockfile del repo [VERIFIED: package-lock.json; npm view].

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@mui/material` | npm | línea 9.x desde 2026-04; paquete de años | 13.7M/sem | github.com/mui/material-ui | SUS (`too-new`, por la fecha del último publish) | Aprobado con checkpoint: es el paquete oficial de MUI, el flag mide la antigüedad de la versión y no del paquete |
| `@mui/material-nextjs` | npm | 9.5.0 publicado 2026-10-09; paquete de años | 1.07M/sem | github.com/mui/material-ui | SUS (`too-new`, misma causa) | Aprobado con checkpoint |
| `@emotion/react` | npm | años | 27.4M/sem | github.com/emotion-js/emotion | OK | Approved |
| `@emotion/styled` | npm | años | 17.5M/sem | github.com/emotion-js/emotion | OK | Approved |
| `@emotion/cache` | npm | años | 31.6M/sem | github.com/emotion-js/emotion | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@mui/material`, `@mui/material-nextjs` [WARNING: flagged as suspicious por el sello `too-new` del seam. Verificar antes de instalar]. El planner inserta una tarea `checkpoint:human-verify` antes del `npm install` que muestre `npm view <pkg>@9.5.0 version dist.integrity repository.url`, `npm view <pkg>@9.5.0 scripts.postinstall` (vacío en ambos, verificado) y `npm audit`. Los nombres vienen de la documentación oficial de MUI vía Context7 y del sandbox ya aprobado por Juan; el flag es solo de frescura de versión. `postinstall`: null en los cinco [VERIFIED: gsd-tools package-legitimacy check].

## Architecture Patterns

### System Architecture Diagram

```
Navegador ──► Cloudflare DNS (dev.juan-tech.com A 116.203.79.125, solo DNS)
                │
                ▼
          Traefik (Let's Encrypt) ──► contenedor Next (app Dokploy "preview", Nixpacks, rama feat/mui-redesign)
                                          │
        ┌─────────────────────────────────┼───────────────────────────────────────┐
        │ next.config (build-time, PREVIEW_READONLY=true)                           │
        │   headers: X-Robots-Tag en /:path*                                        │
        │   rewrites beforeFiles: /admin, /api (salvo redirects-lookup, newsletter) │
        │                         /sitemap.xml, /sitemap.html ──► /preview-blocked  │
        ▼                                                                           │
   middleware (Edge, runtime env)                                                   │
     /es/* ─308─► sin prefijo                                                       │
     fetch loopback /api/redirects-lookup ──► (lectura DB)                          │
     next-intl rewrite ──► (frontend)/[locale]/...   + X-Robots-Tag en preview      │
        │                                                                           │
        ▼                                                                           │
   (frontend)/[locale]/layout.tsx  [RAIZ html del sitio]                            │
     <html lang data-motion> <head> script data-motion </head>                      │
     <body> InitColorSchemeScript                                                   │
       AppRouterCacheProvider(enableCssLayer) ─► Providers(cliente: ThemeProvider,  │
         CssBaseline, GlobalStyles, MotionProvider nuevo)                           │
         NextIntlClientProvider ─► MotionProvider viejo (LazyMotion)                │
           SkipLink, SiteHeader(server: findGlobal header ─► HeaderView cliente MUI)│
           <main id="main-content"> {page} </main>                                  │
           SiteFooter(server: findGlobal footer + Local API posts ─► FooterView)    │
           MotionToggle                                                             │
        │                                                                           │
        ▼ Local API (SELECT)                                                        │
   Postgres shared-postgres  ◄── rol juantech_preview_ro (SELECT, read-only) ───────┘

   (payload)/layout.tsx  [OTRA raíz html: admin de Payload, sin Emotion ni MUI]
   Escrituras (/go, subscribe, lead magnet, contact, newsletter confirm/unsubscribe)
     ──► isPreviewReadonly() ? respuesta de éxito simulada : payload.create/update/sendEmail
```

### Recommended Project Structure
```
src/
├── theme/
│   ├── tokens.ts            # copia literal del sandbox
│   ├── theme.ts             # 'use client', copia del sandbox
│   ├── augment.d.ts         # copia literal
│   ├── Providers.tsx        # 'use client': ThemeProvider + CssBaseline + GlobalStyles + MotionStateProvider
│   └── motion.tsx           # contexto nuevo (useMotion) + script de data-motion
├── components/shell/        # SiteHeader (server), HeaderView (client), SiteFooter (server), FooterView (client),
│                            # LanguageSwitcher (client), MotionToggle (client), SkipLink
├── lib/
│   ├── preview.ts           # isPreviewReadonly(), sin imports (apto Edge y cliente)
│   └── nav-links.ts         # resolveLinkHref(link, locale) para Header/Footer
├── app/preview-blocked/route.ts   # GET -> 404 (destino de las rewrites del preview)
└── postcss-tailwind-layer.cjs     # (raíz del repo o src/) plugin PostCSS local
messages/{es,en}.json        # namespace "shell"
```

### Pattern 1: Tailwind v3 dentro de una capa nativa bajo MUI
**What:** Un plugin PostCSS local, que corre después de `tailwindcss`, envuelve todo el CSS de `globals.css` en `@layer tailwind { ... }` y antepone `@layer tailwind, mui;`.
**When to use:** Mientras Tailwind v3 y MUI convivan (fases 53 a 56). Se borra con Tailwind en la fase 57.
**Evidencia:** compilar `@tailwind base; @tailwind components; @tailwind utilities; @layer base { body { color: red } }` con `tailwindcss@3.4.19` produce 0 `@layer` en la salida y deja `button { ... }` y `a { ... }` sin capa [VERIFIED: ejecutado en local con tailwindcss@3.4.19]. Con el plugin de abajo la salida empieza con `@layer tailwind, mui;` y todo el contenido queda dentro de `@layer tailwind { ... }` [VERIFIED: ejecutado en local]. MUI no envuelve en `@layer mui` los estilos que son una sentencia `@layer a, b;` sin llaves (regex `/^@layer\s+[^{]*$/`), así que declarar el orden desde `GlobalStyles` también funciona [VERIFIED: tarball @mui/material-nextjs@9.5.0 v13-appRouter/appRouterV13.js:44-45].
**Example:**
```js
// postcss-tailwind-layer.cjs  (CommonJS: package.json tiene "type": "module")
// Source: probado en local con tailwindcss@3.4.19 y postcss@8
module.exports = () => ({
  postcssPlugin: 'wrap-tailwind-in-layer',
  OnceExit(root, { AtRule }) {
    const file = root.source && root.source.input && root.source.input.file
    // Solo globals.css: no tocar @payloadcms/next/css ni otros CSS
    if (!file || !/globals\.css$/.test(file)) return
    const layer = new AtRule({ name: 'layer', params: 'tailwind' })
    root.nodes.slice().forEach((node) => { node.remove(); layer.append(node) })
    root.append(new AtRule({ name: 'layer', params: 'tailwind, mui' })) // orden: tailwind debajo de mui
    root.append(layer)
  },
})
module.exports.postcss = true
```
```js
// postcss.config.js  (Next resuelve los plugins por nombre con require.resolve relativo al proyecto;
// no acepta funciones: Next lanza "must be provided as a string" si le pasas un require())
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    './postcss-tailwind-layer.cjs': {},
  },
}
```
Next carga plugins con `require.resolve(pluginName, { paths: [dir] })` y rechaza funciones [VERIFIED: designs/design-system-mui/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js, Next 15.5.29; el repo corre 15.4.11, mismo código de carga esperado]. El orden de las claves del objeto se conserva. **Gate:** el primer plan verifica en `next build` real que `.next/static/css/*.css` contiene `@layer tailwind` y que un `Button contained` conserva su fondo.

### Pattern 2: Shell = server component que lee Payload + vista cliente MUI
**What:** `SiteHeader` y `SiteFooter` siguen siendo server components async (Local API, try/catch con shell mínimo en error). Pasan props serializables a `HeaderView` y `FooterView` marcados `'use client'`.
**Why:** `component={NextLink}`, callbacks de `sx` y `theme.vars` no cruzan limpio la frontera servidor a cliente; el sandbox ya es todo cliente. Mantiene la lectura de datos en servidor sin enviar el SDK de Payload al bundle.
**Example:**
```tsx
// Source: patrón existente src/components/SiteHeader.tsx (server) + SiteHeaderChrome.tsx (client)
export async function SiteHeader({ locale }: { locale: 'es' | 'en' }) {
  try {
    const payload = await getPayload({ config })
    const header = await payload.findGlobal({ slug: 'header', depth: 1, locale })
    const items = (header.navItems ?? []).flatMap((it) => {
      const href = resolveLinkHref(it.link, locale)   // maneja reference y custom, luego normalizeServiceHref
      const label = it.link?.label?.trim()
      return href && label ? [{ id: it.id ?? href, href, label, newTab: !!it.link?.newTab }] : []
    })
    return <HeaderView locale={locale} items={items} cta={header.ctaButton ?? null} logo={...} />
  } catch (err) {
    console.error('[shell] header', err)
    return <HeaderView locale={locale} items={[]} cta={null} logo={null} minimal />
  }
}
```

### Pattern 3: Providers y layout raíz
**What:** Réplica del sandbox con las diferencias del repo: `AppRouterCacheProvider` en el servidor, `Providers` cliente con `ThemeProvider` (`defaultMode="dark"`), `CssBaseline enableColorScheme`, `GlobalStyles`. El `theme` vive en un módulo `'use client'`: se importa solo desde archivos cliente (un tema tiene funciones y no se puede pasar como prop desde el servidor).
**Example:**
```tsx
// src/app/(frontend)/[locale]/layout.tsx (esqueleto)
// Source: designs/design-system-mui/src/app/layout.tsx + docs MUI v9 css-layers
<html lang={locale} suppressHydrationWarning className={`${array.variable} ${khand.variable} ${geistSans.variable}`}>
  <head><script dangerouslySetInnerHTML={{ __html: MOTION_INIT_SCRIPT }} /></head>
  <body>
    <InitColorSchemeScript attribute="data" defaultMode="dark" />
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <Providers>
        <NextIntlClientProvider>
          <MotionProvider /* viejo: LazyMotion + MotionConfig */>
            <SkipLink locale={locale} />
            <SiteHeader locale={locale} />
            <Box component="main" id="main-content" tabIndex={-1} aria-label={...} sx={{ outline: 'none' }}>{children}</Box>
            <SiteFooter locale={locale} />
            <MotionToggle />
          </MotionProvider>
        </NextIntlClientProvider>
      </Providers>
    </AppRouterCacheProvider>
  </body>
</html>
```
`InitColorSchemeScript` debe ser el primer hijo de `<body>`, y `colorSchemeSelector` del tema debe coincidir con `attribute` (el tema del sandbox ya usa `colorSchemeSelector: 'data'`) [CITED: mui.com docs InitColorSchemeScript vía Context7 /mui/material-ui/v9.2.0]. El viejo `MotionProvider` (LazyMotion con `strict`) debe seguir envolviendo el árbol: los componentes `m.*` sin migrar lanzan error sin él.

### Pattern 4: Gating de preview en tres capas
1. **Código, en runtime** (siempre correcto): `isPreviewReadonly()` en server actions, `/go`, `/api/newsletter/*`, rutas de sitemap y `robots.ts` (con `export const dynamic = 'force-dynamic'`).
2. **Middleware, en runtime**: agrega `X-Robots-Tag` a las respuestas de páginas. El sandbox Edge copia `process.env` real al arrancar, así que lee la variable en `next start` [VERIFIED: designs/design-system-mui/node_modules/next/dist/server/web/sandbox/context.js:100-111, Next 15.5.29].
3. **`next.config.mjs`, en build** (cubre lo que el matcher excluye): `X-Robots-Tag` en `/:path*` y `rewrites().beforeFiles` hacia `/preview-blocked` para `/admin`, `/api` (salvo `redirects-lookup` y `newsletter`), `/sitemap.xml` y `/sitemap.html`. Requiere `PREVIEW_READONLY=true` presente al construir (ver Assumptions A3 y la verificación de despliegue).

### Anti-Patterns to Avoid
- **Rewrite a `/preview-blocked` sin ruta propia:** `/<un-segmento>` cae en `[locale]/page.tsx`, el layout llama `notFound()` y, al ser la raíz del árbol, Next responde 500 (documentado en `src/middleware.ts` SEO-39). Crear `src/app/preview-blocked/route.ts` que devuelva 404; una ruta estática gana sobre `[locale]`.
- **Ampliar el matcher del middleware de producción** para cubrir `/admin` y `/api`: toca el camino caliente de producción y el matcher actual tiene tres comentarios que lo desaconsejan.
- **`GlobalStyles` con `@layer theme, base, mui, components, utilities;`:** receta de Tailwind v4. Aquí el orden útil es `tailwind, mui`.
- **Pasar `locale` explícito al `Link` de next-intl para cambiar de idioma:** emite `/es/...` no canónico con 308 (documentado en `src/components/LocaleSwitcher.tsx`). Construir el `href` como cadena canónica.
- **`useSearchParams` en el shell** (por ejemplo para conservar `?q=` al cambiar de idioma): fuerza render dinámico de todas las páginas ISR (`revalidate = 60`) y exige `Suspense`. Conservar solo el hash con un `onClick`.
- **Importar `@/components/ui` (shadcn) en el shell nuevo:** UI-SPEC lo prohíbe.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSR de Emotion en App Router | Extraer estilos a mano con `useServerInsertedHTML` | `AppRouterCacheProvider` de `@mui/material-nextjs/v15-appRouter` | Maneja flush en streaming y la hidratación |
| Parpadeo de esquema de color | Script propio de tema | `InitColorSchemeScript attribute="data" defaultMode="dark"` | Debe coincidir con `colorSchemeSelector` del tema |
| Trampa de foco y Escape en el menú móvil | Foco manual | `Drawer` y `Menu` de MUI (traen trampa, Escape y retorno de foco) | A11Y.md exige estos comportamientos |
| Slugs duales servicios | Tabla nueva | `normalizeServiceHref`, `buildServiceHref`, `buildServicesIndexHref` en `src/lib/service-slugs.ts` | Ya resuelve `/servicios` vs `/en/services` y es módulo puro apto para cliente |
| Decidir si un href lleva prefijo de idioma | Regex nueva | `isPrefixableHref` de `src/i18n/navigation.ts` | Cubre absolutas, `//`, `mailto:`, `#` y `/en/...` ya prefijados sin confundir `/entrevistas` con `/en` |
| Resolver `link.reference` (pages y posts) | Lógica nueva | Replicar `CMSLink` (`reference.value.slug`, prefijo `/blog` para posts) en `resolveLinkHref` | El header actual solo lee `link.url` y descarta enlaces de tipo `reference` |
| Aislar el admin de los estilos | Overrides CSS | Layouts raíz separados: `(payload)/layout.tsx` y `(frontend)/[locale]/layout.tsx` son dos `<html>` | El proveedor solo existe bajo `(frontend)`; no hay nada que filtrar |
| Bloquear escrituras en DB | Solo `if` en el código | `GRANT SELECT` únicamente al rol del preview | El `if` falla en silencio si alguien agrega una escritura nueva; el privilegio no |

**Key insight:** casi todo el valor de esta fase está en reusar piezas que ya resuelven casos de borde del repo (slugs duales, prefijos de idioma, fallback de locale) y en no confiar en la receta genérica de MUI para Tailwind, que asume v4.

## Runtime State Inventory

No aplica: no es una fase de renombrado ni migración de datos. El único estado nuevo en runtime es el rol Postgres `juantech_preview_ro` (aditivo), la aplicación Dokploy del preview y el registro DNS; todos están en la sección de infraestructura.

## Common Pitfalls

### Pitfall 1: Tailwind v3 sin capa aplasta a MUI
**What goes wrong:** Con `enableCssLayer`, el preflight de Tailwind (sin capa) gana sobre `@layer mui`: botones MUI `contained` quedan transparentes, `Link` pierde el subrayado, `body` toma el fondo claro `#FAFAF7` de `globals.css` en vez del `#181818` del tema.
**Why it happens:** Una declaración sin capa vence siempre a una con capa, sin importar especificidad ni orden. Tailwind v3 no emite capas nativas.
**How to avoid:** Pattern 1 (plugin PostCSS). Declarar `@layer tailwind, mui;` en el PostCSS y repetirlo en `GlobalStyles` (idempotente).
**Warning signs:** `getComputedStyle(button).backgroundColor === 'rgba(0, 0, 0, 0)'` en un `Button contained`; `body` claro; `.next/static/css/*.css` sin `@layer tailwind`.

### Pitfall 2: Propiedades `!important` y capas
**What goes wrong:** En capas, `!important` invierte la precedencia: una capa anterior gana a una posterior. La regla `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important } }` de `src/app/globals.css:159` queda en `@layer tailwind` y seguirá matando animaciones aunque Juan pulse "reanudar", contra el contrato SC 2.2.2 de UI-SPEC ("El CSS no vuelve a forzar la pausa después de esa elección").
**How to avoid:** En la rama, acotar esa regla a `html:not([data-motion='running'])` o borrarla (el toggle la reemplaza). El script inicial siempre fija `data-motion`.
**Warning signs:** con `data-motion="running"` y SO en movimiento reducido, las transiciones siguen a 0.01 ms.

### Pitfall 3: `<main>` duplicado
**What goes wrong:** UI-SPEC pide un único `<main id="main-content">` en el layout, pero 22 páginas de `src/app/(frontend)/[locale]/**` ya declaran su propio `<main>` (44 coincidencias entre apertura y cierre). Anidar dos `main` es HTML inválido y rompe landmarks.
**How to avoid:** Mismo plan que cambia el layout convierte `<main`/`</main>` en `<div`/`</div>` en esas 22 páginas (cambio mecánico; las fases 54 y 55 las reescriben). Verificar con `grep -c '<main' ` sobre el HTML servido (contar con `grep -o '<main' | wc -l`, no `grep -c`: el HTML viene en una línea).
**Warning signs:** dos `<main` en el HTML renderizado.

### Pitfall 4: `robots.ts` es estático
**What goes wrong:** `src/app/robots.ts` no usa APIs dinámicas, así que Next lo prerrenderiza en build con el entorno de ese momento; además hoy lee `NEXT_PUBLIC_SERVER_URL`.
**How to avoid:** `export const dynamic = 'force-dynamic'` y devolver `{ rules: { userAgent: '*', disallow: '/' } }` sin `sitemap` cuando `isPreviewReadonly()`.

### Pitfall 5: La bandera solo existe en runtime o solo en build
**What goes wrong:** `next.config.mjs` se evalúa al construir y queda fijo en el manifiesto; el código de servidor lee `process.env` en runtime.
**How to avoid:** Cargar `PREVIEW_READONLY=true` en el entorno de Dokploy antes del primer build (Nixpacks lo expone al build, ver A3) y verificar con `curl -I` y `/admin`. Si falla, repetir la variable en `buildArgs` de `application.saveEnvironment`.

### Pitfall 6: `NEXT_PUBLIC_SERVER_URL` del preview
**What goes wrong:** `src/lib/sitemap-data.ts` lanza error en producción si falta, y define `SITE_URL` que usa `metadataBase` y canonicals. UI-SPEC exige que el preview no cambie canonicals (la fase 57 los compara).
**How to avoid:** `NEXT_PUBLIC_SERVER_URL=https://juan-tech.com` en el preview. `publicOrigin` y `resolveSiteUrl` prefieren el host reenviado, así que los redirects del preview siguen siendo de `dev.juan-tech.com`.

### Pitfall 7: El lead magnet escribe aunque no haya Resend
**What goes wrong:** Sin `RESEND_API_KEY`, `subscribe-lead-magnet.tsx` marca al suscriptor `confirmed` y entrega la descarga en el mismo request (rama MAIL-04). En el preview eso sería una escritura real.
**How to avoid:** El gating va antes de cualquier `payload.find/create/update`, y devuelve el mismo `target` del camino feliz (`?subscribed=pending`).

### Pitfall 8: Header y Footer no tienen hooks de revalidación
**What goes wrong:** CONTEXT dice que la revalidación "sigue por `revalidateTag` en `afterChange`", pero `src/globals/Header/index.ts` y `src/globals/Footer/index.ts` no declaran `hooks` y `SiteHeader`/`SiteFooter` leen con `payload.findGlobal` directo, sin `unstable_cache`. Hoy los cambios salen por el ISR de 60 s de cada página. Además, el preview es otro proceso: aunque se agreguen hooks, un `revalidateTag` del admin de producción nunca llega al preview.
**How to avoid:** Aceptar y documentar que el preview refleja un cambio de enlace en 60 a 120 s (TTL de ISR más TTL de `unstable_cache` si se agrega). Para producción, agregar `getCachedHeader/getCachedFooter` en `src/lib/cache.ts` con tags `header` y `footer` y `GlobalAfterChangeHook` en `src/lib/cache-tags.ts` (mismo patrón que `revalidateBlogPromoCache`, con `safeRevalidateTag` y `safeRevalidateAllPaths`). Es aditivo y deja a producción mejor que hoy.

### Pitfall 9: Rol de lectura y tablas sensibles
**What goes wrong:** `GRANT SELECT ON ALL TABLES` también expone `users` (hash y salt), `users_sessions`, `subscribers` (correos), `payload_mcp_api_keys` a quien comprometa el contenedor del preview. `ALTER DEFAULT PRIVILEGES` además concede `SELECT` en tablas futuras (fases 54 y 55 crean tablas).
**How to avoid:** Tras el `GRANT`, `REVOKE SELECT` sobre esas tablas, y verificar con el crawl completo de sitemap contra el preview que ninguna lectura las necesita (ver A5). `default_transaction_read_only` no es una barrera: "cualquier cambio posterior equivale a SET TRANSACTION" [CITED: postgresql.org/docs/17/runtime-config-client.html]; la barrera es que el rol no tiene `INSERT/UPDATE/DELETE`.

### Pitfall 10: `useSearchParams`, hash y `usePathname`
**What goes wrong:** `usePathname` de `next-intl/navigation` devuelve la ruta sin prefijo y sin query ni hash. En `/en/services` devuelve `/services`; en `/servicios` devuelve `/servicios`.
**How to avoid:** Construir el destino con prefijo según idioma y pasar por `normalizeServiceHref(raw, target)`. El hash se conserva con un `onClick` que lee `window.location.hash`. `?q=` de `/search` se pierde (aceptable, documentar).

### Pitfall 11: `--font-geist-mono` sin definir
**What goes wrong:** `font.mono` del tema usa `var(--font-geist-mono), "Geist Mono", ...`. Si la variable no existe, un `var()` sin respaldo invalida la declaración y el componente hereda la fuente del padre.
**How to avoid:** No afecta al shell (no usa mono). Al copiar `tokens.ts`, cambiar a `var(--font-geist-mono, ui-monospace)` o declarar Geist Mono cuando un componente la use.

### Pitfall 12: Build sin DB en Dokploy
**What goes wrong:** El build de Nixpacks no alcanza `dokploy-network`. Si el shell nuevo consulta Payload durante `next build` (por ejemplo una página que pase a prerender estático), el build falla.
**How to avoid:** `SiteHeader` y `SiteFooter` solo corren en request o ISR. No agregar `generateStaticParams` con datos ni quitar `revalidate`/`force-dynamic` de las páginas existentes [CITED: infra/apps/RUNBOOK-payload-node.md sección 4 en github.com/Sve-nnN/hosting; src/lib/cache.ts cabecera].

### Pitfall 13: Disco y CPU del VPS compartido
**What goes wrong:** Cada push a `feat/mui-redesign` dispara un build Next en el mismo VPS que sirve producción; el 2026-08-25 el disco llegó a 100% por logs de Docker sin rotar y `shared-postgres` entró en loop de recuperación. La rotación de logs seguía sin arreglar en esa fecha.
**How to avoid:** Revisar `df -h /` antes del primer build y tras varios; considerar `docker builder prune` programado. No se pudo verificar el estado actual desde esta sesión.

## Code Examples

### `src/lib/preview.ts`
```ts
// Sin imports: lo usan middleware (Edge), server actions, route handlers y robots.ts.
export function isPreviewReadonly(): boolean {
  return process.env.PREVIEW_READONLY === 'true'
}
```

### `next.config.mjs` (adiciones, solo si la bandera está al construir)
```js
const isPreview = process.env.PREVIEW_READONLY === 'true'

// dentro de headers(): agregar a la lista de /:path*
//   ...(isPreview ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),

async rewrites() {
  if (!isPreview) return []
  const blocked = '/preview-blocked'
  return {
    beforeFiles: [
      { source: '/admin', destination: blocked },
      { source: '/admin/:path*', destination: blocked },
      { source: '/api', destination: blocked },
      // Deja pasar lo que el middleware y los correos usan: lectura de redirects y rutas newsletter (inertes por código)
      { source: '/api/:path((?!redirects-lookup(?:/|$)|newsletter(?:/|$)).+)', destination: blocked },
      { source: '/sitemap.xml', destination: blocked },
      { source: '/sitemap.html', destination: blocked },
    ],
  }
},
```
```ts
// src/app/preview-blocked/route.ts
export const dynamic = 'force-dynamic'
export function GET() { return new Response('Not Found', { status: 404 }) }
export const POST = GET
```
Probar la expresión de `:path((?!...).+)` en el build real: es sintaxis path-to-regexp con lookahead dentro de un grupo y no se pudo ejecutar en esta sesión (A4).

### `src/middleware.ts` (envoltorio mínimo)
```ts
import { isPreviewReadonly } from './lib/preview'
// Renombrar la función actual a `handle` y exportar:
export async function middleware(request: NextRequest) {
  const response = await handle(request)
  if (isPreviewReadonly()) response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}
// NO tocar `config.matcher`.
```

### `src/app/robots.ts`
```ts
import type { MetadataRoute } from 'next'
import { isPreviewReadonly } from '@/lib/preview'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (isPreviewReadonly()) return { rules: { userAgent: '*', disallow: '/' } } // sin sitemap
  /* ...cuerpo actual sin cambios... */
}
```

### Metadata en el layout
```ts
export const metadata: Metadata = {
  /* ...actual... */
  ...(isPreviewReadonly() ? { robots: { index: false, follow: false } } : {}),
}
// viewport.themeColor: '#181818'
```

### Puntos de escritura y su respuesta inerte
| Archivo | Escribe | Respuesta en preview (mismo texto de éxito real) |
|---------|---------|--------------------------------------------------|
| `src/app/go/[slug]/route.ts` (líneas 79 `payload.create` en `after()`) | `affiliate-clicks` | Mantener el 302; saltar el `after()` (`shouldLog && !isPreviewReadonly()`) |
| `src/app/actions/subscribe.tsx` (112 `update`, 127 `create`, 145 `sendEmail`) | `subscribers` + correo | `return { status: 'success' }` tras validar el correo y el honeypot |
| `src/app/actions/subscribe-lead-magnet.tsx` (143, 159, 184) | `subscribers` + correo, o entrega directa sin Resend | `redirect(`${postPath}?subscribed=pending`)` antes de cualquier `payload.*` |
| `src/app/actions/contact.ts` (102 `sendEmail`) | correo vía Resend | `redirect(`${redirectBase}?sent=true`)` tras validar |
| `src/app/api/newsletter/confirm/route.ts` (51 `update`) | `subscribers` | Redirigir a `/blog?newsletter=confirmed` (o `/en/blog`) sin consultar |
| `src/app/api/newsletter/unsubscribe/route.ts` (41 `update`) | `subscribers` | Redirigir a `/blog?newsletter=unsubscribed` sin consultar |

Lectura verificada línea a línea de cada archivo. No hay escrituras en `afterRead`/`beforeRead` (grep sin coincidencias) y `Header`/`Footer` no tienen hooks.

### Selector de idioma (cálculo del href canónico)
```tsx
'use client'
import { usePathname } from '@/i18n/navigation'          // ruta sin prefijo de idioma
import { normalizeServiceHref } from '@/lib/service-slugs'

function targetHref(stripped: string, target: 'es' | 'en') {
  const raw = target === 'es' ? stripped : `/en${stripped === '/' ? '' : stripped}`
  return normalizeServiceHref(raw, target) || '/'
}
// <MenuItem component={NextLink} href={targetHref(pathname, other)} hrefLang={other} lang={other} aria-current={...}>
```
`normalizeServiceHref('/services/seo-consulting', 'es')` devuelve `/servicios/seo-consulting`; con `'en'` y `/en/servicios` devuelve `/en/services` [VERIFIED: src/lib/service-slugs.ts:62-77, leído completo].

### Script inicial y contexto de movimiento
```ts
export const MOTION_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('jt-motion');var m=(s==='paused'||s==='running')?s:(matchMedia('(prefers-reduced-motion: reduce)').matches?'paused':'running');document.documentElement.setAttribute('data-motion',m)}catch(e){document.documentElement.setAttribute('data-motion','running')}})()`
// Contexto: useSyncExternalStore sobre document.documentElement.dataset.motion (snapshot de servidor 'running'),
// toggle escribe localStorage['jt-motion'] y el atributo. Mismo patrón useSyncExternalStore que SiteHeaderChrome.tsx.
// Integración sugerida: <MotionConfig reducedMotion={paused ? 'always' : 'user'}> en el MotionProvider viejo.
```

### Rol Postgres de solo lectura (lo corre Juan en el VPS, aditivo)
```bash
# Mismo patrón que infra/db/new-tenant-postgres.sh (psql -U postgres dentro de shared-postgres).
# Contraseña hex: base64 puede traer / + = y rompe la URI (lección del skill dokploy-deploy).
PW="$(openssl rand -hex 24)"
docker exec -i shared-postgres psql -U postgres -v ON_ERROR_STOP=1 <<SQL
CREATE ROLE juantech_preview_ro WITH LOGIN ENCRYPTED PASSWORD '${PW}' NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 8;
ALTER ROLE juantech_preview_ro SET default_transaction_read_only = on;
GRANT CONNECT ON DATABASE juantech TO juantech_preview_ro;
\c juantech
GRANT USAGE ON SCHEMA public TO juantech_preview_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO juantech_preview_ro;
ALTER DEFAULT PRIVILEGES FOR ROLE juantech_user IN SCHEMA public GRANT SELECT ON TABLES TO juantech_preview_ro;
REVOKE SELECT ON users, users_sessions, subscribers, payload_mcp_api_keys, payload_preferences, payload_preferences_rels FROM juantech_preview_ro;
SQL
echo "DATABASE_URI=postgresql://juantech_preview_ro:${PW}@shared-postgres:5432/juantech"
# Verificación: psql como el rol: INSERT debe fallar con "permission denied" y SELECT sobre pages debe funcionar.
```
Se asume que `juantech_user` es el dueño de las tablas (el script de tenant hace `ALTER DATABASE ... OWNER TO juantech_user` y las migraciones corren con ese usuario), PG 17 y contenedor `shared-postgres` (A1, A2).

### Verificación del despliegue del preview (comandos)
```bash
curl -sI https://dev.juan-tech.com/ | grep -i x-robots-tag          # noindex, nofollow
curl -s  https://dev.juan-tech.com/robots.txt                        # Disallow: /  y sin Sitemap
curl -s -o /dev/null -w '%{http_code}\n' https://dev.juan-tech.com/sitemap.xml   # 404
curl -s -o /dev/null -w '%{http_code}\n' https://dev.juan-tech.com/admin/login   # 404
curl -s -o /dev/null -w '%{http_code}\n' https://dev.juan-tech.com/api/users     # 404
curl -s https://dev.juan-tech.com/ | grep -o '<main' | wc -l                      # 1
curl -s https://dev.juan-tech.com/ | grep -o 'name="robots"[^>]*'                 # noindex, nofollow
curl -s https://juan-tech.com/admin/login | grep -c 'data-emotion'                # 0 (admin sin MUI; contar líneas es suficiente aquí para 0)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MUI con Tailwind v3: `preflight: false` + `important: '#__next'` + `StyledEngineProvider injectFirst` | Capas CSS nativas (`enableCssLayer`) con Tailwind v4 | Docs MUI v9: la guía de capas es solo Tailwind v4; v3 figura como "legacy" | Con Tailwind v3 hay que envolver su salida en capa propia (Pattern 1) |
| Props de sistema en `Stack`, `Box`, `Grid` | `sx` | MUI v9 las elimina | `Stack` no acepta `alignItems`, `flexWrap`: van en `sx` [CITED: docs MUI upgrade-to-v9] |
| `components`/`componentsProps` en `Tooltip` | `slots`/`slotProps` | MUI v9 | No usar la API vieja |
| Edge middleware con env inlined en build | `process.env` real en el sandbox de `next start` | Next 15 | Se puede leer `PREVIEW_READONLY` en runtime en middleware |

**Deprecated/outdated:**
- Receta "Tailwind v3 con MUI" de la doc (`important: '#__next'`): `#__next` no existe en App Router.
- Orden de capas de UI-SPEC nota 2 (`theme, base, mui, components, utilities`): asume Tailwind v4, sustituir por `tailwind, mui`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `shared-postgres` es Postgres 17, el contenedor se llama `shared-postgres` y `psql -U postgres` entra como superusuario | Rol Postgres | El script falla; Juan lo ajusta. No se pudo verificar: SSH al VPS denegado por el clasificador en esta sesión. Versión tomada del skill `dokploy-deploy` y de `infra/db/new-tenant-postgres.sh` |
| A2 | `juantech_user` es dueño de las tablas del esquema `public` de `juantech` | `ALTER DEFAULT PRIVILEGES FOR ROLE juantech_user` | Si las migraciones corren con otro rol, las tablas nuevas no heredarían `SELECT`; el preview daría errores en tablas de fases 54 y 55 |
| A3 | Dokploy con Nixpacks expone las variables del Environment también durante el build | Pattern 4 capa 3, Pitfall 5 | `X-Robots-Tag` de `next.config` y las rewrites no se aplicarían; mitigación: repetir en `buildArgs` y la verificación con `curl` lo detecta |
| A4 | La expresión `/api/:path((?!redirects-lookup(?:/\|$)\|newsletter(?:/\|$)).+)` es válida en `rewrites` de Next 15.4 | Code Examples | Habría que listar rutas permitidas de otra forma (por ejemplo bloquear `/api/users`, `/api/graphql`, etc. por separado) |
| A5 | Ninguna lectura pública toca `users`, `users_sessions`, `subscribers`, `payload_mcp_api_keys` ni `payload_preferences*` | Rol Postgres, Pitfall 9 | Páginas con 500 en el preview; mitigación: crawl del sitemap completo (194 URLs el 2026-08-18) y quitar el `REVOKE` de la tabla culpable |
| A6 | La aplicación de producción en Dokploy se construye con Nixpacks (no hay Dockerfile en el repo) | Resumen, Dokploy | Si prod usa otro `buildType`, el preview debe copiarlo. Verificar con `application.one` del app de producción (requiere token) |
| A7 | Con `@mui/material-nextjs@9.5.0` y Next 15.4.11 el build compila y el SSR de Emotion funciona | Standard Stack | Peer declara `next ^15`; el sandbox usa 15.5.29. Verificar en el primer plan con `next build` real (decisión de CONTEXT ya lo pide) |
| A8 | Un rewrite a una ruta estática `/preview-blocked` gana sobre `[locale]` y responde 404 sin pasar por el layout | Anti-Patterns | Si pasara por el layout daría 500 (SEO-39); se detecta con `curl` en la verificación |
| A9 | Las credenciales `CLOUDINARY_*` del preview pueden ser las de producción o valores ficticios mientras el nombre de nube sea real (solo se usa `cloudinary.url` para armar URLs) | Env vars del preview | Imágenes rotas en el preview. `hasCloudinaryCreds` exige las tres variables no vacías |
| A10 | `PAYLOAD_SECRET` distinto en el preview no rompe nada porque no hay sesiones ni admin; `mintDownloadToken` firma con el secret, así que los tokens de producción no valen en el preview | Seguridad | Sin impacto funcional esperado |

## Open Questions

1. **¿Se protege el preview con acceso (Basic Auth de Traefik o Cloudflare Access)?**
   - What we know: CONTEXT solo pide noindex y solo lectura; el preview servirá contenido publicado de producción, nada confidencial.
   - What's unclear: si Juan quiere ocultar el diseño nuevo antes del corte.
   - Recommendation: no bloquear la fase; dejarlo como decisión de Juan. Basic Auth rompería el crawl comparativo de la fase 57 salvo que se pasen credenciales.

2. **Token de Dokploy y tipo de build de producción.**
   - What we know: el skill `dokploy-deploy` pide un token de API; no hay Dockerfile en el repo.
   - What's unclear: `buildType` real del app de producción y `githubId` del proveedor GitHub.
   - Recommendation: tarea manual de Juan que entrega el token en la sesión; el plan consulta `application.one` y `github.githubProviders` antes de crear el preview.

3. **¿Agregar hooks de revalidación a Header y Footer en esta fase?**
   - What we know: hoy no existen; el preview no los recibiría de todos modos.
   - What's unclear: si Juan los considera parte de BASE-03 ("con revalidación").
   - Recommendation: incluirlos (aditivo, bajo riesgo) y documentar que el preview se actualiza por TTL de 60 a 120 s.

4. **Lectores de pantalla (NVDA+Firefox, VoiceOver+Safari).** Pendiente de Juan según UI-SPEC; tratar como supuesto.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build local | ✓ | v24.13.0 (el repo pide 22 en `.node-version`) | `nvm use 22` para igualar CI |
| `node_modules` del repo | tsc, build local | ✗ | no instalado en esta copia | `npm ci` (primer paso de cualquier tarea de código) |
| `gh` | consultar repo `hosting` | ✓ | instalado | ninguno |
| `psql` local | probar el rol por túnel | ✓ | /opt/homebrew/bin/psql | ninguno |
| `docker` local | no requerido | ✓ | instalado | ninguno |
| Acceso SSH al VPS (`~/.ssh/sapling_ed25519`) | crear el rol, relay, túnel | Parcial | la llave existe en la lista de `~/.ssh` de memoria, pero el clasificador de auto-mode denegó el SSH desde esta sesión | Juan corre el SQL y `./scripts/db/tunnel.sh` |
| Token API de Dokploy | crear la aplicación y el dominio | ✗ | no disponible en sesión | Juan lo entrega o crea la app por UI siguiendo el mismo orden |
| Registro DNS `dev.juan-tech.com` | dominio y TLS | ✗ | `dig +short dev.juan-tech.com` vacío; el apex resuelve a 116.203.79.125 sin proxy, `www` va por Cloudflare | Juan crea `A dev -> 116.203.79.125` en modo solo DNS (nube gris) hasta emitir el certificado |
| Cloudflare (DNS de `juan-tech.com`) | registro A | ✓ (NS cruz/vasilii.ns.cloudflare.com) | manual | ninguno |

**Missing dependencies with no fallback:** ninguna que bloquee el código; el despliegue del preview depende de acciones de Juan (DNS, token, SQL).
**Missing dependencies with fallback:** `node_modules` (`npm ci`), SSH desde la sesión (Juan ejecuta), token Dokploy (UI).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (admin 404 en preview, sin login) | `/admin` y `/api` bloqueados por rewrite |
| V3 Session Management | no | Sin sesiones en preview |
| V4 Access Control | yes | Rol Postgres con `GRANT SELECT` únicamente; `REVOKE` sobre tablas sensibles; lecturas de la app con `overrideAccess:false` (solo publicado) |
| V5 Input Validation | yes | Las rutas inertes conservan validación de correo, honeypot y rate limit antes de responder éxito simulado |
| V6 Cryptography | no (no se agrega) | `PAYLOAD_SECRET` propio del preview; contraseña del rol generada con `openssl rand -hex 24` |
| V14 Configuration | yes | Secretos solo en el Environment de Dokploy; `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `RESEND_FROM_EMAIL` sin definir en el preview |

### Known Threat Patterns for Next + Payload + Postgres compartido

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Escritura accidental a producción desde el preview | Tampering | Rol sin `INSERT/UPDATE/DELETE`; gating por código; sin Resend |
| Fuga de credenciales o correos por compromiso del contenedor del preview | Information disclosure | `REVOKE SELECT` sobre `users`, `users_sessions`, `subscribers`, `payload_mcp_api_keys`; `CONNECTION LIMIT 8` |
| Indexación del preview y canibalización con producción | Repudiation / SEO | noindex en meta, `X-Robots-Tag`, `robots.txt Disallow: /`, sin sitemap; canonicals sin cambio |
| Agotar conexiones de `shared-postgres` | Denial of service | Pool `max: 5` ya definido en `payload.config.ts:77`; límite de conexión del rol |
| Open redirect en `/go` | Tampering | El destino sale solo de `affiliate-links` (diseño existente); el preview mantiene el mismo código |
| Credenciales en logs del VPS | Information disclosure | No imprimir `DATABASE_URI` ni el token de Dokploy en la sesión; guardar el token en archivo temporal fuera del repo |

## Sources

### Primary (HIGH confidence)
- Código del repo leído esta sesión: `src/middleware.ts`, `next.config.mjs`, `src/payload.config.ts`, `src/app/robots.ts`, `src/app/go/[slug]/route.ts`, `src/app/actions/{contact,subscribe,subscribe-lead-magnet}`, `src/app/api/newsletter/{confirm,unsubscribe}/route.ts`, `src/globals/{Header,Footer}/index.ts`, `src/components/{SiteHeader,SiteHeaderChrome,SiteFooter,LocaleSwitcher,MotionProvider,CMSLink}.tsx`, `src/i18n/*`, `src/lib/{service-slugs,cache-tags,cache,public-origin,resolve-site-url,sitemap-data}.ts`, `src/app/globals.css`, `src/app/(frontend)/[locale]/layout.tsx`, `src/app/(payload)/layout.tsx`, `src/fonts.ts`, `postcss.config.js`, `designs/design-system-mui/src/{app,theme}`.
- Ejecución local: `tailwindcss@3.4.19` compilado (0 `@layer` en la salida) y plugin de envoltura probado con postcss 8.
- `@payloadcms/db-postgres@3.85.2` `dist/connect.js:108-121` y `@payloadcms/drizzle@3.85.2` `dist/postgres/createExtensions.js`; `payload@3.85.2` `dist/index.js:238` (`_initializeCrons` solo con `jobs.autoRun`).
- Tarball `@mui/material-nextjs@9.5.0` (`v13-appRouter/appRouterV13.js:44-45`, `v15-appRouter/index.js`).
- Next 15.5.29 en `designs/design-system-mui/node_modules` (`css/plugins.js`, `sandbox/context.js:100-111`).
- Context7 `/mui/material-ui/v9.2.0` (css-layers, Tailwind v3 y v4, InitColorSchemeScript, upgrade-to-v9).
- npm registry: `npm view` de `@mui/*`, `@emotion/*`, `@payloadcms/next@3.85.2` (peer `next >=15.4.11 <15.5.0`).
- postgresql.org/docs/17/runtime-config-client.html (`default_transaction_read_only`).
- `gh api repos/Sve-nnN/hosting`: `infra/db/new-tenant-postgres.sh`, `infra/apps/RUNBOOK-payload-node.md`.

### Secondary (MEDIUM confidence)
- Skill `dokploy-deploy` (flujo `application.create`, `saveGithubProvider`, `saveEnvironment`, `domain.create`, DNS en modo solo DNS para el primer certificado).
- Memorias del proyecto: acceso a la DB por SSH y relay, incidente de disco del VPS, deploy solo a master.

### Tertiary (LOW confidence)
- Comportamiento de Dokploy/Nixpacks con variables en build (A3), sintaxis de rewrite con lookahead (A4), versión y roles de `shared-postgres` (A1, A2): no verificados en esta sesión.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, versiones y peers verificados contra el registro y el sandbox que compila.
- Architecture: MEDIUM, el plugin de capas y el `rewrite` se probaron en piezas aisladas pero no en un `next build` de este repo (`node_modules` ausente).
- Pitfalls: HIGH para los derivados del código (Tailwind sin capa, `<main>`, hooks ausentes, matcher, `robots.ts`, escrituras); MEDIUM para los de infraestructura.

**Research date:** 2026-11-06
**Valid until:** 2026-12-06 (stack estable; revisar si MUI publica 9.6 o si Payload publica soporte para Next 15.5)
