# Phase 53: Base del rediseño: rama, preview, tema y shell - Pattern Map

**Mapped:** 2026-11-06
**Files analyzed:** 38 (nuevos y modificados, ver tabla)
**Analogs found:** 34 / 38 (4 sin analog: infra manual de Dokploy, DNS, rol Postgres y plugin PostCSS)

## Avisos para el planner (leer primero)

1. **El sandbox `designs/design-system-mui/` NO está trackeado en git.** `git status` lo muestra como `??` y `git check-ignore` devuelve exit 1 (no está ignorado, solo sin commit). No es un espejo gitignored, así que sirve como fuente de copia, pero hay que copiarlo a `src/theme/` **antes** de que algo dependa de él, y no se puede citar desde un plan que corra en otra copia del repo sin los archivos. Todos los analogs de `src/**`, `scripts/**`, `next.config.mjs`, `postcss.config.js` y `messages/**` sí están trackeados (verificado con `git ls-files`).
2. **El sandbox usa helpers que NO existen en el repo real**: `@/lib/i18n` (`localeOf`, `stripLocale`, `withLocale`, `tr`) y `@/data/home`. No se copian. Se sustituyen por `usePathname` de `@/i18n/navigation`, `normalizeServiceHref` de `@/lib/service-slugs`, `isPrefixableHref` de `@/i18n/navigation` y cadenas de `messages/{es,en}.json` namespace `shell`.
3. **Conflicto resuelto entre CONTEXT y código real (selector de idioma):** CONTEXT dice "usa `Link` de `next-intl/navigation`". `src/components/LocaleSwitcher.tsx:3-9` documenta que pasar `locale` explícito a ese `Link` emite `/es/...` (308, no canónico). UI-SPEC lo resuelve: usar `usePathname` de `@/i18n/navigation` para la ruta sin prefijo y entregar un `href` canónico en cadena a `next/link` plano. Copiar `LocaleSwitcher.tsx:33-41`.
4. **Tailwind v3 sin `@layer`:** el orden `theme, base, mui, components, utilities` de UI-SPEC nota 2 no sirve; RESEARCH Pattern 1 manda `@layer tailwind, mui;` con plugin PostCSS local. No hay analog en el repo (ver "No Analog Found").
5. **Header y Footer globals no tienen hooks `afterChange`.** El analog de hooks es `BlogPromo` + `revalidateBlogPromoCache` (ver Pattern 17).
6. **No hay tests automatizados ni vitest/playwright en el repo.** La verificación es por `curl` (RESEARCH "Verificación del despliegue") y por scripts `scripts/db/NN-*.ts` en el estilo de `04-which-database.ts`. No inventar infraestructura de tests.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/preview.ts` (new) | utility | request-response | `src/lib/public-origin.ts` (módulo puro de una función) | role-match |
| `src/middleware.ts` (mod) | middleware | request-response | él mismo (`stripIntlAlternateLinks` es un post-procesador de response) | exact (mismo archivo) |
| `next.config.mjs` (mod: headers + rewrites) | config | request-response | él mismo (`headers()` y `redirects()` existentes) | exact |
| `src/app/preview-blocked/route.ts` (new) | route | request-response | `src/app/go/[slug]/route.ts:47-49` (404 plano con `NextResponse`) | role-match |
| `src/app/robots.ts` (mod) | route | request-response | él mismo | exact |
| `src/app/go/[slug]/route.ts` (mod) | route | CRUD (write en `after()`) | él mismo | exact |
| `src/app/actions/subscribe.tsx` (mod) | server action | CRUD (write + email) | él mismo (honeypot ya devuelve éxito silencioso) | exact |
| `src/app/actions/subscribe-lead-magnet.tsx` (mod) | server action | CRUD (write + email) | él mismo + `subscribe.tsx` | exact |
| `src/app/actions/contact.ts` (mod) | server action | request-response (email) | él mismo (honeypot redirect `?sent=true`) | exact |
| `src/app/api/newsletter/confirm/route.ts` (mod) | route | CRUD (update) | él mismo | exact |
| `src/app/api/newsletter/unsubscribe/route.ts` (mod) | route | CRUD (update) | él mismo | exact |
| `src/app/sitemap.xml/route.ts` y `sitemap.html/route.ts` (mod opcional) | route | request-response | `src/app/robots.ts` | role-match |
| `src/app/(frontend)/[locale]/layout.tsx` (mod) | layout | request-response | él mismo + `designs/design-system-mui/src/app/layout.tsx` | exact |
| `src/theme/tokens.ts` (new, copia) | config | transform | `designs/design-system-mui/src/theme/tokens.ts` | exact (copia literal) |
| `src/theme/theme.ts` (new, copia) | config | transform | `designs/design-system-mui/src/theme/theme.ts` | exact (copia literal) |
| `src/theme/augment.d.ts` (new, copia) | config | transform | `designs/design-system-mui/src/theme/augment.d.ts` | exact (copia literal) |
| `src/theme/Providers.tsx` (new) | provider | event-driven | `designs/design-system-mui/src/app/providers.tsx` | exact |
| `src/theme/motion.tsx` (new: contexto + script) | provider | event-driven | `src/components/SiteHeaderChrome.tsx:61-76` (`useSyncExternalStore`) + `MotionProvider.tsx` | role-match |
| `src/fonts.ts` (mod, solo si hace falta Geist Mono) | config | n/a | él mismo | exact |
| `src/components/shell/SiteHeader.tsx` (new, server) | component (server) | CRUD (read) | `src/components/SiteHeader.tsx` | exact |
| `src/components/shell/HeaderView.tsx` (new, client MUI) | component (client) | request-response | `designs/design-system-mui/src/components/home/HomeNav.tsx` + `src/components/SiteHeaderChrome.tsx` | exact |
| `src/components/shell/SiteFooter.tsx` (new, server) | component (server) | CRUD (read) | `src/components/SiteFooter.tsx` | exact |
| `src/components/shell/FooterView.tsx` (new, client MUI) | component (client) | request-response | `designs/design-system-mui/src/components/home/Footer.tsx` | exact |
| `src/components/shell/LanguageSwitcher.tsx` (new, client) | component (client) | request-response | `designs/design-system-mui/src/components/site/LanguageSwitcher.tsx` + `src/components/LocaleSwitcher.tsx` | exact (fusión) |
| `src/components/shell/MotionToggle.tsx` (new, client) | component (client) | event-driven | `designs/design-system-mui/src/components/home/MotionToggle.tsx` | exact |
| `src/components/shell/SkipLink.tsx` (new) | component | request-response | `[locale]/layout.tsx:91-96` (skip link actual) + `SiteShell.tsx:12` del sandbox | exact |
| `src/lib/nav-links.ts` (new: `resolveLinkHref`) | utility | transform | `src/components/CMSLink.tsx:30-52` | exact |
| `messages/es.json`, `messages/en.json` (mod, namespace `shell`) | config | n/a | entradas existentes (`nav`, `common`) | exact |
| `src/lib/cache-tags.ts` (mod: `revalidateHeaderCache`/`revalidateFooterCache`) | hook | event-driven | `revalidateBlogPromoCache` (`cache-tags.ts:165-169`) | exact |
| `src/lib/cache.ts` (mod: `getCachedHeader`/`getCachedFooter`) | service | CRUD (read) | `getCachedBlogPromo` (`cache.ts:105-113`) | exact |
| `src/globals/Header/index.ts`, `src/globals/Footer/index.ts` (mod: `hooks` + `access.read`) | model (global) | CRUD | `src/globals/BlogPromo/index.ts:28-33` | exact |
| 22 páginas `src/app/(frontend)/[locale]/**/page.tsx` (mod: `<main>` a `<div>`) | page | request-response | `[locale]/page.tsx:88,107`, `contact/page.tsx:99,117` | exact (cambio mecánico) |
| `src/app/globals.css` (mod: regla reduced-motion) | config | n/a | él mismo, líneas 157-167 | exact |
| `scripts/db/20-verify-preview.ts` (new, verificación) | utility (script) | request-response | `scripts/db/04-which-database.ts` | role-match |
| `postcss-tailwind-layer.cjs` + `postcss.config.js` (new/mod) | config | transform | `postcss.config.js` (solo la forma del objeto de plugins) | partial |
| Rol Postgres `juantech_preview_ro`, app Dokploy, DNS `dev` | infra | n/a | ninguno en el repo | none |

## Pattern Assignments

### `src/lib/preview.ts` (utility, request-response)

**Analog:** `src/lib/public-origin.ts` (módulo puro, función única exportada, docblock largo que explica el por qué).

**Core pattern** (RESEARCH "Code Examples", sin imports, apto Edge, servidor y cliente):
```ts
// Sin imports: lo usan middleware (Edge), server actions, route handlers y robots.ts.
export function isPreviewReadonly(): boolean {
  return process.env.PREVIEW_READONLY === 'true'
}
```
Convención del repo: docblock en español que explica la causa (ver `public-origin.ts:2-23`). No leer `NEXT_PUBLIC_*` aquí: debe leerse en runtime.

---

### `src/middleware.ts` (middleware, request-response) — envoltorio mínimo

**Analog:** el mismo archivo. Patrón de post-procesar una response: `stripIntlAlternateLinks` (`src/middleware.ts:61` y `87-103`).

**Excerpt a modificar** (`src/middleware.ts:27, 61`):
```ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  ...
  return stripIntlAlternateLinks(intlMiddleware(request))
}
```
**Cambio:** renombrar a `handle` y exportar un `middleware` que añada `X-Robots-Tag` si `isPreviewReadonly()` (código en RESEARCH "src/middleware.ts (envoltorio mínimo)").

**Restricción dura:** NO tocar `export const config.matcher` (`src/middleware.ts:151-156`). Los comentarios de las líneas 105-150 lo prohíben (SEO-39, 47-CONTEXT). El matcher excluye `api|admin|go/|robots.txt|sitemap.xml|sitemap.html`, por eso el 404 de esas rutas vive en `next.config.mjs`, no aquí. Importar con ruta relativa: `import { isPreviewReadonly } from './lib/preview'` (el archivo ya usa `./i18n/routing`).

---

### `next.config.mjs` (config, request-response)

**Analog:** el mismo archivo. Estructura a imitar: `headers()` con `source: '/:path*'` (`next.config.mjs:35-56`) y `redirects()` (`57-97`). Comentarios largos en español justificando cada entrada.

**Headers** (insertar en la lista de `/:path*`, `next.config.mjs:39-53`):
```js
const isPreview = process.env.PREVIEW_READONLY === 'true'
...
headers: [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ...
  ...(isPreview ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
],
```
**Rewrites** (nueva función, no existe hoy; sintaxis y riesgo A4 en RESEARCH "Code Examples"): `async rewrites()` que devuelve `{ beforeFiles: [...] }` solo si `isPreview`, hacia `/preview-blocked`, dejando pasar `/api/redirects-lookup` (lo llama el middleware por loopback, `src/middleware.ts:49`) y `/api/newsletter`.

**Export final** (`next.config.mjs:100`): se mantiene `export default withPayload(withNextIntl(nextConfig))`.

---

### `src/app/preview-blocked/route.ts` (route, request-response)

**Analog:** `src/app/go/[slug]/route.ts:10-13, 47-49`.

**Imports/config pattern** (`go/[slug]/route.ts:10-13`):
```ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```
**404 plano** (`go/[slug]/route.ts:47-49`):
```ts
return new NextResponse('Not Found', { status: 404 })
```
**Código:** RESEARCH "src/app/preview-blocked/route.ts" (`GET` y `POST` devuelven 404). Debe ser ruta estática de primer nivel: una ruta propia gana sobre `[locale]` (SEO-39 documenta el 500 si cae al layout). Fuera de `(frontend)` y de `(payload)`.

---

### `src/app/robots.ts` (route, request-response)

**Analog:** el mismo archivo, completo (`src/app/robots.ts:1-14`):
```ts
import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/go'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```
**Cambio (Pitfall 4):** añadir `import { isPreviewReadonly } from '@/lib/preview'`, `export const dynamic = 'force-dynamic'` y, al inicio de `robots()`, `if (isPreviewReadonly()) return { rules: { userAgent: '*', disallow: '/' } }` (sin `sitemap`). El cuerpo actual queda intacto.

---

### `src/app/go/[slug]/route.ts` (route, CRUD con escritura en `after()`)

**Analog:** el mismo archivo. Punto de corte, `go/[slug]/route.ts:72-84`:
```ts
const userAgent = request.headers.get('user-agent')
const clientIp = extractClientIp(request.headers)
const shouldLog = !isBotUserAgent(userAgent) && !clickThrottle.isThrottled(clientIp)

if (shouldLog) {
  after(async () => {
    const payload = await getPayload({ config })
    await payload.create({ collection: 'affiliate-clicks', data: { slug, userAgent: userAgent ?? undefined } })
  })
}
```
**Cambio:** `const shouldLog = !isPreviewReadonly() && !isBotUserAgent(...) && !clickThrottle.isThrottled(clientIp)`. El 302 sigue saliendo (GO-04: "la respuesta 302 SIEMPRE sale"). Importar `isPreviewReadonly` con alias `@/lib/preview` (el archivo ya usa `@/lib/...`).

---

### `src/app/actions/subscribe.tsx` (server action, CRUD)

**Analog:** el mismo archivo. Orden de validación a respetar (`subscribe.tsx:69-91`): honeypot, parseo de email, `EMAIL_PATTERN`, `resolveSiteUrl`, `isRateLimited`. **Punto de corte** justo después de `isRateLimited` (línea 91) y antes del `try` de la línea 93:
```ts
if (await isRateLimited()) return { status: 'error' }

try {
  const payload = await getPayload({ config })
```
**Cambio:** insertar `if (isPreviewReadonly()) return { status: 'success' }` entre ambos (RESEARCH tabla "Puntos de escritura"). Mismo valor `{ status: 'success' }` que ya devuelven el honeypot (línea 71) y el caso `confirmed` (línea 108); el texto de éxito real no cambia y nunca dice "simulado". Mantiene V5 (validación, honeypot y rate limit antes del éxito simulado).

---

### `src/app/actions/subscribe-lead-magnet.tsx` (server action, CRUD)

**Analog:** el mismo archivo + `subscribe.tsx`. Estructura: `let target = \`${postPath}?subscribed=error\`` (línea ~94) y luego un `try` con `payload.find/create/update/sendEmail` (líneas 96-200). **Corte:** antes de ese `try`, `if (isPreviewReadonly()) redirect(\`${postPath}?subscribed=pending\`)` (Pitfall 7: sin gate, con `RESEND_API_KEY` ausente la rama MAIL-04 marcaría `confirmed` y escribiría). `redirect()` lanza internamente, por eso va fuera del `try` (mismo criterio que el comentario del archivo, líneas 90-93). Leer las líneas 1-90 antes de editar para ubicar `postPath`, `locale` y los chequeos previos (no se leyeron aquí).

---

### `src/app/actions/contact.ts` (server action, request-response)

**Analog:** el mismo archivo. Secuencia (`contact.ts:76-93`): rate limit, honeypot, validación de campos, `CONTACT_TO_EMAIL`. **Corte:** tras la validación de campos (línea 86) y antes de `CONTACT_TO_EMAIL`/`try` (línea 88):
```ts
if (!name || !email || !message || !EMAIL_REGEX.test(email)) {
  redirect(`${redirectBase}?sent=false`)
}
// ← aquí
if (isPreviewReadonly()) redirect(`${redirectBase}?sent=true`)
```
`redirect` ya está importado (`contact.ts:4`). No tocar el `let sendSucceeded` posterior (`redirect` fuera del try, líneas 95-114).

---

### `src/app/api/newsletter/confirm/route.ts` y `unsubscribe/route.ts` (route, CRUD update)

**Analog:** ellos mismos. Ambos empiezan igual (`confirm/route.ts:26-33`, `unsubscribe/route.ts:21-28`):
```ts
const token = request.nextUrl.searchParams.get('token')
const origin = publicOrigin(request)
const home = new URL('/', origin)
if (!token) return NextResponse.redirect(home)
```
**Cambio:** justo después del `if (!token)`, `if (isPreviewReadonly())` redirige sin consultar:
- confirm: `new URL('/blog', origin)` con `searchParams.set('newsletter', 'confirmed')`.
- unsubscribe: igual con `'unsubscribed'`.
Reusar `publicOrigin` (ya importado) para que el redirect quede en `dev.juan-tech.com`. `export const runtime = 'nodejs'` y `dynamic = 'force-dynamic'` ya están.

---

### `src/app/(frontend)/[locale]/layout.tsx` (layout, request-response)

**Analog:** el mismo archivo (`layout.tsx:1-107`) + sandbox `designs/design-system-mui/src/app/layout.tsx:1-27`.

**Imports actuales a conservar** (`layout.tsx:1-14`): `hasLocale, NextIntlClientProvider`, `setRequestLocale`, `array, khand, geistSans` de `@/fonts`, `routing`, `SITE_URL`, `BRAND`, `BRAND_SUFFIX`, `'../../globals.css'`. El viejo `MotionProvider` (LazyMotion `strict`) debe seguir envolviendo el árbol.

**Sandbox: proveedores y script** (`design-system-mui/src/app/layout.tsx:3-4, 18-25`):
```tsx
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
...
<html lang="es" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
  <body>
    <InitColorSchemeScript attribute="data" defaultMode="dark" />
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <Providers>{children}</Providers>
    </AppRouterCacheProvider>
  </body>
</html>
```
**Cambios sobre el layout real:**
- `<html lang={locale} suppressHydrationWarning className={...array/khand/geistSans}>` más `<head><script dangerouslySetInnerHTML={{ __html: MOTION_INIT_SCRIPT }} /></head>`.
- `<body>` sin `className="font-sans"` (UI-SPEC nota 4). `InitColorSchemeScript` primer hijo de `<body>`.
- Anidación (RESEARCH Pattern 3): `AppRouterCacheProvider` > `Providers` (cliente) > `NextIntlClientProvider` > `MotionProvider` viejo > `SkipLink`, `SiteHeader`, `<Box component="main" id="main-content" tabIndex={-1} aria-label=... sx={{ outline: 'none' }}>`, `SiteFooter`, `MotionToggle`.
- Sustituir `<div id="main-content" tabIndex={-1}>` (`layout.tsx:98-100`) por el `<main>` y el skip link Tailwind (`layout.tsx:91-96`) por `SkipLink`.
- `viewport.themeColor` (`layout.tsx:55-57`): `'#F7581E'` pasa a `'#181818'`.
- `metadata` (`layout.tsx:19-50`): añadir `...(isPreviewReadonly() ? { robots: { index: false, follow: false } } : {})`. `metadataBase` y `title` quedan.
- `generateStaticParams`, `hasLocale`/`notFound`, `setRequestLocale` (`layout.tsx:59-76`) intactos.
- Importar `'../../globals.css'` se mantiene (Tailwind convive hasta fase 57).

**Ancla del `(payload)`:** `src/app/(payload)/layout.tsx:21-27` es otra raíz `<html>` (`RootLayout` de Payload). No tocarlo: el aislamiento del admin sale de que los proveedores solo viven aquí.

---

### `src/theme/tokens.ts`, `src/theme/theme.ts`, `src/theme/augment.d.ts` (config, copia)

**Analog:** `designs/design-system-mui/src/theme/{tokens,theme,augment.d}.ts` (49, 111 y 13 líneas). Copia literal, con dos ajustes:
- `tokens.ts:8` (Pitfall 11): `mono: 'var(--font-geist-mono), "Geist Mono", ...'` pasa a `var(--font-geist-mono, ui-monospace), ...` porque el repo no declara Geist Mono (`src/fonts.ts` solo tiene Sans y un comentario que lo rechaza a propósito).
- `theme.ts` debe leer duraciones desde variables CSS para el toggle de movimiento (UI-SPEC "Toggle de movimiento": `--jt-motion-fast/base/slow`). Hoy `theme.ts:57` usa `motion.base` literal en `transition`. Reemplazar por `var(--jt-motion-base, 300ms)` o declarar las variables en `GlobalStyles` (ver Providers).

**Excerpts clave que se copian sin cambiar** (`theme.ts:21-25, 44-51`): `cssVariables: { colorSchemeSelector: 'data', cssVarPrefix: 'jt' }`, `defaultColorScheme: 'dark'`, `colorSchemes: { dark: scheme(dark, true) }`, y `MuiCssBaseline.styleOverrides` con `html.scrollPaddingTop`, `:focus-visible` (anillo 2 px `accentText`) y `'ul, ol': { listStyle: 'none', margin: 0, padding: 0 }`.
- Ajuste UI-SPEC: `scrollPaddingTop` de 96 ya existe (`theme.ts:46`); añadir `scrollPaddingBottom: 72`. El `'ul, ol'` global afecta a las páginas sin migrar en la rama; es aceptado (solo preview).
- `theme.ts` es `'use client'` (línea 1): importarlo solo desde archivos cliente. No pasarlo como prop desde servidor.

---

### `src/theme/Providers.tsx` (provider, event-driven)

**Analog exacto:** `designs/design-system-mui/src/app/providers.tsx:1-13`:
```tsx
'use client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@/theme/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="dark">
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
```
**Añadir:** `GlobalStyles` con `@layer tailwind, mui;` (idempotente con el PostCSS), reglas `html[data-motion="paused"]` (`animation-play-state: paused !important`, `scroll-behavior: auto`, hover sin `translateY`) y variables `--jt-motion-fast|base|slow` (200/300/500 en `running`, `0ms` en `paused`), más el `MotionStateProvider` nuevo (de `src/theme/motion.tsx`). Estilo del repo: sin punto y coma (el sandbox usa `;`; el repo no).

---

### `src/theme/motion.tsx` (provider, event-driven)

**Analog:** patrón `useSyncExternalStore` con snapshot de servidor explícito de `src/components/SiteHeaderChrome.tsx:61-76, 109-113`:
```tsx
function subscribeToScroll(callback: () => void) {
  window.addEventListener('scroll', callback, { passive: true })
  return () => { window.removeEventListener('scroll', callback) }
}
function getScrolledSnapshot() { return window.scrollY > SCROLL_THRESHOLD }
function getServerScrolledSnapshot() { return false }
const scrolled = useSyncExternalStore(subscribeToScroll, getScrolledSnapshot, getServerScrolledSnapshot)
```
**Segundo analog (forma del proveedor):** `src/components/MotionProvider.tsx:20-26` (`'use client'`, `{ children }`, docblock explicando el por qué). El viejo se queda; el nuevo se nombra distinto (p. ej. `MotionStateProvider`) para no chocar hasta la fase 57.

**Código a escribir** (RESEARCH "Script inicial y contexto de movimiento"): exportar `MOTION_INIT_SCRIPT` (lee `localStorage['jt-motion']`, cae a `prefers-reduced-motion`, fija `data-motion` en `<html>`), un contexto con `useMotion(): { paused, toggle }` leyendo `document.documentElement.dataset.motion` vía `useSyncExternalStore` (snapshot de servidor `'running'`) y `toggle` que escribe `localStorage` y el atributo. Integración opcional con el viejo: `<MotionConfig reducedMotion={paused ? 'always' : 'user'}>`.

---

### `src/components/shell/SiteHeader.tsx` (component server, CRUD read)

**Analog exacto:** `src/components/SiteHeader.tsx:1-38`:
```tsx
import { getPayload } from 'payload'
import config from '@/payload.config'
import { normalizeServiceHref } from '@/lib/service-slugs'

export async function SiteHeader({ locale }: { locale: string }) {
  const payload = await getPayload({ config })
  const header = await payload.findGlobal({ slug: 'header', depth: 1, locale: locale as 'en' | 'es' })
  const logo = typeof header.logo === 'object' ? header.logo : null
  const navItems = (header.navItems ?? []).map((item) => ({
    ...item,
    link: item.link?.url ? { ...item.link, url: normalizeServiceHref(item.link.url, locale as 'es' | 'en') } : item.link,
  }))
  return <SiteHeaderChrome navItems={navItems} ctaButton={header.ctaButton ?? null} logo={logo} locale={locale} />
}
```
**Cambios (RESEARCH Pattern 2, UI-SPEC "Error state"):**
- Envolver en `try/catch`; en error `console.error('[shell] header', err)` y devolver `HeaderView` con `items=[]`, `cta=null`, `minimal`. Nunca 500.
- Resolver cada enlace con `resolveLinkHref(it.link, locale)` (de `src/lib/nav-links.ts`), que además maneja `type: 'reference'` (el header actual solo lee `link.url` y descarta referencias). Descartar ítems con `label` vacío (locale sin traducción: omitir, nunca mostrar slug).
- Pasar solo props serializables (`{ id, href, label, newTab }[]`, `cta`, `logo`).
- Opcional (Pitfall 8): leer vía `getCachedHeader(locale)` de `src/lib/cache.ts` en lugar de `findGlobal` directo.

---

### `src/components/shell/HeaderView.tsx` (component client MUI)

**Analog exacto (estructura MUI):** `designs/design-system-mui/src/components/home/HomeNav.tsx:35-64`:
```tsx
<Box component="header" sx={{ position: 'fixed', top: 16, left: 0, right: 0, zIndex: 1100, display: 'flex', justifyContent: 'center', px: 2, pointerEvents: 'none' }}>
  <Box component="nav" aria-label="Principal" sx={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 9999, border: 1, borderColor: 'divider',
    bgcolor: 'color-mix(in srgb, var(--jt-palette-background-default) 72%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', maxWidth: '100%' }}>
    <Link component={NextLink} href={...} underline="none" aria-label="Juan Angulo" sx={{ display: 'flex', ... }}>...</Link>
    <Stack component="ul" direction="row" sx={{ display: { xs: 'none', md: 'flex' }, ml: 1 }}>...</Stack>
    <Box sx={{ display: { xs: 'none', md: 'block' } }}><LanguageSwitcher /></Box>
    <Button component={NextLink} href=... variant="contained" size="small" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>...</Button>
    <IconButton aria-label=... aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpen(true)} sx={{ display: { md: 'none' } }}><Menu size={20} aria-hidden="true" /></IconButton>
  </Box>
  <Drawer anchor="top" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { id: 'menu-movil', 'aria-label': 'Menú' } }}>...</Drawer>
</Box>
```
**Qué NO copiar del sandbox / diferencias obligatorias (UI-SPEC):**
- Sin `nav` importado de `@/data/home`; recibir `items` por props. Sin scrollspy (`HomeNav.tsx:24-31`).
- Enlace de nav: `px: 1` (no 1.75), `fontWeight: 400` (no 500), `minHeight: 40`, `display: 'flex'`, `alignItems: 'center'` (`HomeNav.tsx:47` usa 500 y `py: 1`).
- Hrefs: `Link` MUI con `component={NextLink}` (de `next/link`) con el href canónico ya resuelto; los internos pasan por `isPrefixableHref` (de `@/i18n/navigation`) para decidir `LocaleLink` frente a `PlainLink`, igual que `SiteHeaderChrome.tsx:123` (`const CtaLink = isPrefixableHref(ctaHref) ? LocaleLink : PlainLink`). Externos o `newTab`: `rel="noopener"` y sufijo "(se abre en otra pestaña)" del namespace `shell`.
- `aria-current="page"` con comparación contra la ruta normalizada: copiar `normalizePath` de `SiteHeaderChrome.tsx:80-89` y `isActive` de `125-129`, pero tomando `usePathname` de `@/i18n/navigation` (devuelve la ruta sin prefijo).
- Landmarks: `header` con `aria-label` ("Cabecera"/"Header"), `nav` ("Principal"/"Main"), Drawer ("Menú"/"Menu"). Textos desde `useTranslations('shell')` (los hardcodeados `'Principal'`, `'Menú'` del sandbox se mueven a mensajes).
- Cerrar el Drawer al cambiar `usePathname` (UI-SPEC): `useEffect(() => setOpen(false), [pathname])`.
- Logo: `Image`/`img` con `alt=""` decorativo y `aria-label` "Juan Angulo, inicio" en el enlace. Logo viene de `header.logo` (como `SiteHeaderChrome.tsx:158-162`), con fallback al avatar.
- No importar nada de `@/components/ui` (shadcn) ni `Container` de `@/components/Container`.
- Si `items` está vacío, no renderizar la `ul` (empty state UI-SPEC).
- Valor del CTA: `ctaButton?.href ?? '/contact'` y label con fallback a `shell.ctaFallback` (`SiteHeaderChrome.tsx:122` hace lo mismo con `?? '/contact'`).

---

### `src/components/shell/LanguageSwitcher.tsx` (component client)

**Analog primario (UI MUI):** `designs/design-system-mui/src/components/site/LanguageSwitcher.tsx:12-40`:
```tsx
<Button onClick={(e) => setAnchor(e.currentTarget)} aria-haspopup="menu" aria-expanded={!!anchor} aria-controls="menu-idioma" aria-label={...}
  startIcon={<Globe size={16} aria-hidden="true" />} size="small" variant="text" sx={{...}}>{loc.toUpperCase()}</Button>
<Menu id="menu-idioma" anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ list: { 'aria-label': ... } }}>
  {opts.map((o) => (
    <MenuItem key={o.code} component={NextLink} href={...} lang={o.code} hrefLang={o.code} selected={o.code === loc} aria-current={o.code === loc ? 'true' : undefined} onClick={() => setAnchor(null)} sx={{ gap: 1.5, minWidth: 160 }}>
```
y variante `inDrawer` (`role="group"`, un `Button` por idioma, `contained` el activo, `outlined` el otro).

**Analog secundario (cálculo del href canónico, es lo que reemplaza `withLocale`):** `src/components/LocaleSwitcher.tsx:33-41`:
```tsx
const stripped = routing.locales.reduce(
  (path, locale) => (path.startsWith(`/${locale}`) ? path.slice(`/${locale}`.length) || '/' : path),
  pathname,
)
const rawTarget = otherLocale === routing.defaultLocale ? stripped : `/${otherLocale}${stripped === '/' ? '' : stripped}`
const target = normalizeServiceHref(rawTarget, otherLocale as 'es' | 'en')
// <Link href={target || '/'} hrefLang={otherLocale} ...>
```
**Fusión (RESEARCH "Selector de idioma"):** `usePathname` de `@/i18n/navigation` (ya sin prefijo) → `targetHref(stripped, target)` con `normalizeServiceHref(raw, target) || '/'` → `MenuItem component={NextLink}` (plano, nunca la prop `locale`). El locale actual sale de `useLocale()` de `next-intl`, no de parsear la ruta como hace el sandbox (`localeOf`). Hash: conservar con `onClick` que lee `window.location.hash` (no `useSearchParams`). Importar `normalizeServiceHref` desde `@/lib/service-slugs` (módulo puro; `services-data.ts` arrastraría el SDK de Payload al bundle cliente, ver `LocaleSwitcher.tsx:22-24`).

---

### `src/components/shell/MotionToggle.tsx` (component client, event-driven)

**Analog:** `designs/design-system-mui/src/components/home/MotionToggle.tsx:9-21`:
```tsx
<Button variant="outlined" size="small" aria-pressed={paused} onClick={() => setPaused((p) => !p)}
  startIcon={paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
  sx={{ position: 'fixed', left: 16, bottom: 16, zIndex: 1200, bgcolor: 'background.paper', borderColor: 'divider', '&:hover': { bgcolor: 'background.paper' } }}>
  {tr(paused ? 'Reanudar animaciones' : 'Pausar animaciones', loc)}
</Button>
```
**Diferencias obligatorias (UI-SPEC "Desviación deliberada"):**
- Etiqueta constante "Pausar animaciones"/"Pause animations" (`shell.motionToggle`), NO cambiar a "Reanudar". El estado lo lleva solo `aria-pressed`.
- El estado viene de `useMotion()` de `src/theme/motion.tsx`, no de `useState` + `document.body.classList.toggle('paused')` (sandbox, líneas 12-13). El efecto va por `data-motion` en `<html>`.
- Sin `useEffect`/`matchMedia` local: el script inline ya fijó el valor inicial.

---

### `src/components/shell/SkipLink.tsx` (component)

**Analogs:** `src/app/(frontend)/[locale]/layout.tsx:91-96` (comportamiento actual, texto por locale) y sandbox `SiteShell.tsx:12`:
```tsx
<Link href="#contenido" sx={{ position: 'absolute', left: 8, top: -64, zIndex: 1300, bgcolor: 'background.paper', p: 1.5, borderRadius: 1, '&:focus': { top: 8 } }}>Saltar al contenido</Link>
```
**Ajustes (UI-SPEC):** `href="#main-content"` (el id actual, no `#contenido`), `p: 2`, `borderRadius: '4px'`, `color: 'accentText'`, texto desde `shell.skipLink`. Primer elemento enfocable del documento.

---

### `src/components/shell/SiteFooter.tsx` (component server, CRUD read)

**Analog exacto:** `src/components/SiteFooter.tsx` (reutilizar la lógica de datos casi tal cual, mover solo el JSX a `FooterView`).

**Reusar sin cambios (datos):**
- `resolveServicesColumn` (`SiteFooter.tsx:73-129`): columna de servicios derivada de `SERVICE_SLUGS` + `LOCAL_LANDINGS` (no de los globals).
- `resolveDynamicColumn` (`131-181`): `payload.find` con `where: { _status: { equals: 'published' } }` para `latestPosts` y `latestCaseStudies`.
- Lectura principal (`183-198`):
```tsx
const footer = await payload.findGlobal({ slug: 'footer', depth: 1, locale: typedLocale })
const [servicesColumn, dynamicColumns] = await Promise.all([
  resolveServicesColumn(typedLocale),
  Promise.all((footer.dynamicColumns ?? []).map((entry) => resolveDynamicColumn(entry, typedLocale)))
    .then((cols) => cols.filter((col): col is DynamicColumnResult => col !== null)),
])
```
- Admin-authored hrefs: guard `isPrefixableHref(href) ? LocaleLink : PlainLink` (`SiteFooter.tsx:260-261, 349`).
- Servicios: `buildServiceHref`/`buildServicesIndexHref` ya son locale-correctos y van con enlace plano (`SiteFooter.tsx:243-256`).

**Cambios:** `try/catch` con footer mínimo en error (UI-SPEC, sin 500); pasar a `FooterView` solo datos serializables (`columns`, `dynamicColumns`, `servicesColumn`, `socialLinks`, `legalLinks`, `copyrightText`); el copy hardcodeado `closingCopy` (`41-60`) se sustituye por `messages shell` donde aplique (tagline, labels). Quitar la banda CTA de cierre de la versión Tailwind (UI-SPEC no la lista). Fallback `copyrightText` vacío: "Juan Carlos Angulo".

---

### `src/components/shell/FooterView.tsx` (component client MUI)

**Analog exacto (estructura MUI):** `designs/design-system-mui/src/components/home/Footer.tsx:19-43`:
```tsx
<Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 8 }}>
  <Container maxWidth="lg">
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '1.4fr repeat(3, minmax(0,1fr))' }, gap: 4 }}>
      <Box> {/* marca: avatar decorativo 32px + tagline maxWidth 280 */} </Box>
      {cols.map((c) => (
        <Box key={c.h}>
          <Typography variant="overline" component="h3" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>{c.h}</Typography>
          <Box component="ul" sx={{ display: 'grid', gap: 1 }}>...<Link ... underline="hover" sx={{ color: 'text.primary' }}>...</Link></Box>
        </Box>
      ))}
    </Box>
    <Box sx={{ mt: 6, pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 3, color: 'text.secondary' }}>...</Box>
  </Container>
</Box>
```
**Diferencias obligatorias (UI-SPEC):**
- No hay `cols` hardcodeadas: columnas vienen de props (`columns` + `dynamicColumns` + `servicesColumn`). Grilla `repeat(auto-fit, minmax(160px, 1fr))` en lugar de `1.4fr repeat(3, ...)`; una sola columna en móvil.
- Cada columna es `nav` con `aria-label` ("Enlaces del pie"/"Footer links" por grupo, patrón `t.groupLabel(title)` de `SiteFooter.tsx:47,227`) con `Typography overline component="h3"`; enlaces con `minHeight: 32`, `display: 'inline-flex'`, `alignItems: 'center'`.
- `footer` con `aria-label` "Pie de página"/"Site footer" (`SiteFooter.tsx:206`).
- Barra inferior: copyright, `legalLinks` (`legal.href` pasa por `isPrefixableHref`), `socialLinks` con `SocialIcon` y `socialLabels` de `src/components/SocialIcon.tsx:31-36, 41-50` (44x44, `aria-label` con sufijo "(se abre en otra pestaña)", `rel="noopener noreferrer"`).
- Cada bloque solo se renderiza si su array tiene datos (empty states, zero-one-many).
- `normalizeServiceHref` a los hrefs de columnas del CMS (el footer actual NO lo hace para `footer.columns`; UI-SPEC lo exige).

---

### `src/lib/nav-links.ts` (utility, transform)

**Analog exacto:** `src/components/CMSLink.tsx:30-52`:
```tsx
let href = url ?? '#'
if (type === 'reference' && reference?.value) {
  const slug = typeof reference.value === 'object' ? reference.value.slug : undefined
  const collectionPath = reference.relationTo === 'posts' ? '/blog' : ''
  href = slug ? `${collectionPath}/${slug}` : '#'
}
const LinkComponent = isPrefixableHref(href) ? LocaleLink : PlainLink
```
**Forma del helper:** `resolveLinkHref(link, locale): string | null` que reproduce ese cálculo (sin JSX), devuelve `null` cuando el resultado es `'#'` vacío y aplica al final `normalizeServiceHref(href, locale)` de `src/lib/service-slugs.ts:62-77`. Módulo puro (sin imports de Payload), igual que `service-slugs.ts:1-7`. Tipos de enlace: copiar `HeaderLink` de `SiteHeaderChrome.tsx:25-32`.

---

### `messages/es.json` y `messages/en.json` (config)

**Analog:** entradas existentes (`nav`, `common`, `servicesShowcase`...), objetos planos por namespace; claves en camelCase; `src/i18n/request.ts:9` carga `messages/${locale}.json`. Añadir un namespace `shell` en ambos con: `skipLink`, `brandAria`, `openMenu`, `closeMenu`, `langButtonAria`, `langGroup`, `motionToggle`, `ctaFallback`, `tagline`, `opensInNewTab`, `landmarks.{header,navMain,menu,navFooter,footer,main}`. Textos exactos en UI-SPEC "Copywriting Contract". Sin guiones largos ni cortos, sin puntos finales en el tagline. Los componentes cliente usan `useTranslations('shell')` (`NextIntlClientProvider` ya envuelve el árbol en `layout.tsx:84`).

---

### `src/lib/cache-tags.ts`, `src/lib/cache.ts`, `src/globals/{Header,Footer}/index.ts` (hook, cache y global)

**Analogs exactos:**

Hook (`cache-tags.ts:165-169`):
```ts
export const revalidateBlogPromoCache: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidateTag(CACHE_TAGS.blogPromo())
  safeRevalidateAllPaths()
  return doc
}
```
Tag (`cache-tags.ts:74-85`): añadir `header: () => 'header'`, `footer: () => 'footer'` en `CACHE_TAGS`.

Fetcher cacheado (`cache.ts:105-113`):
```ts
export function getCachedBlogPromo(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      return payload.findGlobal({ slug: 'blog-promo', locale, overrideAccess: false })
    },
    ['blog-promo', locale],
    { tags: [CACHE_TAGS.blogPromo()], revalidate: CACHE_TTL_SECONDS },
  )()
}
```
Global con hook (`globals/BlogPromo/index.ts:3, 28-33`):
```ts
import { revalidateBlogPromoCache } from '@/lib/cache-tags'
access: { read: () => true },
hooks: { afterChange: [revalidateBlogPromoCache] },
```
**Aplicar a Header y Footer:** `revalidateHeaderCache` y `revalidateFooterCache` (o uno compartido) con `hooks.afterChange`; `getCachedHeader(locale)`/`getCachedFooter(locale)` con `depth: 1`. **Cuidado:** `access.read: () => true` solo hace falta si el fetcher usa `overrideAccess: false`; los globals actuales se leen con `findGlobal` sin esa opción, así que verificar que añadir `access.read` abierto no exponga nada nuevo (los datos ya son públicos). Importar `cache-tags` desde un global es lo que el archivo documenta como seguro (módulo puro, líneas 1-14); NO importar `@payload-config` desde `cache-tags.ts`. El preview NO recibe `revalidateTag` del admin de producción (proceso distinto): se actualiza por TTL de 60 a 120 s (Pitfall 8).

---

### 22 páginas `src/app/(frontend)/[locale]/**/page.tsx` (page, cambio mecánico)

**Analog:** `src/app/(frontend)/[locale]/page.tsx:88,107` y `contact/page.tsx:99,117` (`<main>` ... `</main>`). Lista completa (22): `page.tsx`, `seo-tecnico-madrid`, `contact`, `privacy`, `authors`, `authors/[slug]`, `servicios`, `servicios/[slug]`, `terms`, `blog`, `blog/[category]`, `blog/[category]/[slug]`, `blog/confirm`, `case-studies`, `case-studies/[slug]`, `search`, `seo-tecnico-lima`, `stack`, `services`, `services/[slug]`, `websites`, `websites/[slug]`. **Cambio:** `<main` → `<div` y `</main>` → `</div>` (con sus atributos). Verificar con `grep -o '<main' | wc -l` sobre el HTML servido (no `grep -c`, el HTML viene en una línea). Puede haber varios `<main>` por archivo (44 coincidencias entre apertura y cierre): revisar cada archivo, no asumir uno.

---

### `src/app/globals.css` (config) — regla reduced-motion

**Analog:** el mismo archivo, `globals.css:157-167`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
**Cambio (Pitfall 2):** acotar a `html:not([data-motion='running']) *` (y pseudo-elementos) o borrar la regla. Dentro de `@layer`, `!important` invierte la precedencia y esta regla seguiría matando animaciones tras "reanudar", contra SC 2.2.2.

---

### `scripts/db/20-verify-preview.ts` (script, request-response) — opcional

**Analog:** `scripts/db/04-which-database.ts` (docblock con el porqué, "READ-ONLY", `VERIFY_BASE_URL` por env, nunca imprimir credenciales, ejecución con `node --env-file=.env node_modules/.bin/tsx scripts/db/NN-....ts`). Estructura: constante `LIVE_BASE = process.env.VERIFY_BASE_URL ?? '...'` (línea 38), función `safeTarget` (40-49) y fetch real. Para el preview: `VERIFY_BASE_URL=https://dev.juan-tech.com` y comprobar `X-Robots-Tag`, `/robots.txt`, 404 de `/admin/login`, `/api/users` y `/sitemap.xml`, un solo `<main`. Numeración siguiente libre: `20`. Alternativa sin script: los `curl` de RESEARCH "Verificación del despliegue".

---

## Shared Patterns

### Gating `isPreviewReadonly()` antes de cualquier escritura
**Source:** `src/lib/preview.ts` (nuevo)
**Apply to:** `go/[slug]/route.ts`, `actions/{subscribe,subscribe-lead-magnet,contact}`, `api/newsletter/{confirm,unsubscribe}`, `robots.ts`, `layout.tsx` (`metadata.robots`), `middleware.ts`.
Regla: el corte va **después** de validación (email, honeypot, rate limit) y **antes** de cualquier `payload.find/create/update/sendEmail`; la respuesta usa el mismo texto/redirect de éxito real. La barrera real es el rol Postgres sin `INSERT/UPDATE/DELETE`; el `if` es la segunda capa.

### Enlaces administrados: `isPrefixableHref` + `normalizeServiceHref`
**Source:** `src/i18n/navigation.ts:46-60`, `src/lib/service-slugs.ts:62-77`
**Apply to:** `SiteHeader`, `HeaderView`, `SiteFooter`, `FooterView`, `LanguageSwitcher`, `nav-links.ts`.
```tsx
const LinkComponent = isPrefixableHref(href) ? LocaleLink : PlainLink   // CMSLink.tsx:52
```
Nunca pasar `locale` explícito a `Link` de next-intl para cambiar de idioma (`LocaleSwitcher.tsx:3-9`). Importar solo módulos puros desde cliente (`service-slugs.ts`, nunca `services-data.ts`).

### Shell = servidor que lee Payload + vista cliente MUI
**Source:** `src/components/SiteHeader.tsx` (servidor) + `src/components/SiteHeaderChrome.tsx` (cliente, docblock `91-97`).
**Apply to:** `shell/SiteHeader` + `HeaderView`, `shell/SiteFooter` + `FooterView`.
Props solo serializables. `try/catch` con shell mínimo y `console.error('[shell] ...')` (UI-SPEC "Error state"). No agregar `generateStaticParams` con datos ni quitar `revalidate`/`force-dynamic` de páginas (Pitfall 12, build sin DB).

### Estilo MUI (todo el shell)
**Source:** sandbox `HomeNav.tsx`, `Footer.tsx`, `theme.ts`.
- `sx` con tokens del tema (`'text.secondary'`, `'raised'`, `'divider'`, `'accentText'`), nunca colores literales, salvo el `color-mix(...)` del pill (`HomeNav.tsx:38`).
- Iconos `lucide-react` siempre `aria-hidden="true"`.
- En v9, `Stack` no acepta props de sistema: `alignItems`, `flexWrap` van en `sx`.
- `Link component={NextLink}` o `Button component={NextLink}`; focus ring global del tema, no suprimir `outline`.
- Cadenas por `useTranslations('shell')`, no diccionario inline (`tr()` del sandbox).

### i18n y landmarks
**Source:** `src/i18n/{routing,navigation,request}.ts`, `[locale]/layout.tsx:84` (`NextIntlClientProvider`), `SiteFooter.tsx:206` (`aria-label` en `footer`), `SiteHeaderChrome.tsx:152-153` (`aria-label` en `nav`).
Cada landmark con nombre distinto; `<html lang={locale}>`; un solo `<main id="main-content" tabIndex={-1}>` en el layout.

### Revalidación de globals
**Source:** `src/lib/cache-tags.ts:42-72, 165-169`, `src/lib/cache.ts:105-113`.
`safeRevalidateTag` y `safeRevalidateAllPaths` envuelven en try/catch (scripts standalone no tienen contexto de request). TTL `CACHE_TTL_SECONDS = 60` (`cache-tags.ts:25`).

### Seguridad de la DB compartida
**Source:** CLAUDE.md sección "Database Safety" + `scripts/db/04-which-database.ts`.
Antes de cualquier escritura de contenido o migración: `node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts`. Esta fase solo añade un rol Postgres (aditivo, lo corre Juan por SSH/relay; el clasificador bloquea a Claude para el relay/`ssh -L`). `DATABASE_URI` del preview: `postgresql://juantech_preview_ro:<pw>@shared-postgres:5432/juantech`, contraseña con `openssl rand -hex 24`. Pool `max: 5` ya en `payload.config.ts:77`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `postcss-tailwind-layer.cjs` (+ clave nueva en `postcss.config.js`) | config | transform | No existe ningún plugin PostCSS local. Usar el código de RESEARCH Pattern 1. Solo hay que respetar la forma del objeto `plugins` de `postcss.config.js` (`tailwindcss: {}`, `autoprefixer: {}`) y que `package.json` tiene `"type": "module"` (el plugin debe ser `.cjs`; el config lo referencia por nombre de cadena `'./postcss-tailwind-layer.cjs': {}`, Next rechaza funciones). Gate: `next build` real y `.next/static/css/*.css` con `@layer tailwind`. |
| Rol Postgres `juantech_preview_ro` | infra | n/a | Sin analog en el repo; está en el repo externo `Sve-nnN/hosting` (`infra/db/new-tenant-postgres.sh`). SQL en RESEARCH "Rol Postgres de solo lectura". Paso manual de Juan; incluir `REVOKE SELECT` sobre `users`, `users_sessions`, `subscribers`, `payload_mcp_api_keys`, `payload_preferences*`. |
| App Dokploy `dev.juan-tech.com` (Nixpacks, rama `feat/mui-redesign`) + DNS Cloudflare | infra | n/a | No hay Dockerfile ni infra versionada en el repo (el repo no tiene `infra/`). Flujo en el skill `dokploy-deploy` y RESEARCH "Environment Availability". Variables del preview: `PREVIEW_READONLY=true`, `NEXT_PUBLIC_SERVER_URL=https://juan-tech.com`, `DATABASE_URI` del rol de solo lectura, `PAYLOAD_SECRET` propio, sin `RESEND_API_KEY`/`CONTACT_TO_EMAIL`. Pasos manuales de Juan (token Dokploy, DNS A `dev` a `116.203.79.125` en modo solo DNS). |
| Tests automatizados | test | n/a | El repo no tiene vitest ni playwright (`package.json` solo define `dev/build/start/generate:*/doctor`). La verificación son `curl` y scripts `scripts/db/*`. |

## Metadata

**Analog search scope:** `src/app`, `src/components`, `src/lib`, `src/i18n`, `src/globals`, `src/middleware.ts`, `next.config.mjs`, `postcss.config.js`, `messages/`, `scripts/db/`, `designs/design-system-mui/src/{app,theme,components}`.
**Files scanned:** ~45 leídos o listados; los analogs citados están trackeados (`git ls-files` verificado para los de `src/`, `scripts/` y configs). El sandbox `designs/design-system-mui/` es untracked, no ignorado (aviso 1).
**Pattern extraction date:** 2026-11-06
