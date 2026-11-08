---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
reviewed: 2026-11-07T00:00:00Z
depth: standard
files_reviewed: 48
files_reviewed_list:
  - next.config.mjs
  - package.json
  - postcss-tailwind-layer.cjs
  - postcss.config.js
  - scripts/verify/53-computed-styles.mjs
  - scripts/verify/53-crawl-parity.mjs
  - scripts/verify/53-layer-check.mjs
  - scripts/verify/53-messages-parity.mjs
  - scripts/verify/53-motion-script.ts
  - scripts/verify/53-nav-links.ts
  - scripts/verify/53-preview-contract.mjs
  - scripts/verify/53-shell-contract.mjs
  - scripts/verify/53-wait-preview.mjs
  - scripts/verify/53-write-gates.mjs
  - src/app/(frontend)/[locale]/layout.tsx
  - src/app/(frontend)/[locale]/page.tsx
  - src/app/actions/contact.ts
  - src/app/actions/subscribe-lead-magnet.tsx
  - src/app/actions/subscribe.tsx
  - src/app/api/newsletter/confirm/route.ts
  - src/app/api/newsletter/unsubscribe/route.ts
  - src/app/globals.css
  - src/app/go/[slug]/route.ts
  - src/app/preview-blocked/route.ts
  - src/app/robots.ts
  - src/components/HeroGrainGradientShader.tsx
  - src/components/MotionProvider.tsx
  - src/components/shell/FooterView.tsx
  - src/components/shell/HeaderView.tsx
  - src/components/shell/LanguageSwitcher.tsx
  - src/components/shell/MotionToggle.tsx
  - src/components/shell/SiteFooter.tsx
  - src/components/shell/SiteHeader.tsx
  - src/components/shell/SkipLink.tsx
  - src/globals/Footer/index.ts
  - src/globals/Header/index.ts
  - src/lib/cache-tags.ts
  - src/lib/cache.ts
  - src/lib/nav-links.ts
  - src/lib/preview.ts
  - src/middleware.ts
  - src/theme/augment.d.ts
  - src/theme/motion-init.ts
  - src/theme/motion.tsx
  - src/theme/Providers.tsx
  - src/theme/theme.ts
  - src/theme/tokens.ts
  - tsconfig.json
findings:
  critical: 1
  warning: 10
  info: 5
  total: 16
status: issues_found
---

# Phase 53: Code Review Report

**Reviewed:** 2026-11-07
**Depth:** standard
**Files Reviewed:** 48
**Status:** issues_found

## Summary

Se revisó la base del rediseño: compuertas de solo lectura del preview, rewrites y headers, tema MUI, capas CSS Tailwind y MUI, shell (header, footer, selector de idioma, toggle de movimiento) y los scripts de verificación. `tsc --noEmit` pasa limpio.

Las seis compuertas `isPreviewReadonly()` están bien colocadas respecto de la primera escritura, y el contrato de rewrites cubre los casos principales. Los problemas reales están en tres zonas:

1. La inversión de capas (`tailwind` por debajo de `mui`) deja que los resets globales de `CssBaseline` aplasten utilidades Tailwind de las páginas heredadas. Es una regresión visible y comprobable en el contenido del blog.
2. La bandera del preview falla abierta (comparación estricta con `'true'`) y vive en dos momentos distintos (build para rewrites y headers, runtime para el código), sin ninguna comprobación cruzada en el servidor.
3. Hay huecos en la auditoría estática `53-write-gates.mjs` y defectos heredados que esta fase tocó sin cerrar (`postPath` sin validar, degradación de suscriptores confirmados).

## Structural Findings (fallow)

No se entregó bloque `<structural_findings>` en esta ejecución.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Los resets de `CssBaseline` (capa `mui`) aplastan las utilidades Tailwind de las páginas heredadas

**File:** `src/theme/theme.ts:46-49` (afecta a `src/components/Prose.tsx:31-32` y `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx:254`)
**Issue:** `postcss-tailwind-layer.cjs` mete todo Tailwind en `@layer tailwind`, declarada por debajo de `mui`. Con capas CSS, la capa posterior gana siempre sin importar la especificidad. `MuiCssBaseline.styleOverrides` emite dentro de `@layer mui` la regla `ul, ol { list-style: none; margin: 0; padding: 0 }`. Esa regla vence a cualquier utilidad Tailwind sobre listas, incluidas las variantes arbitrarias con mayor especificidad:

- `Prose.tsx` usa `[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4` y `[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4`. Todas las listas del cuerpo de los posts pierden viñetas, números y sangría.
- `case-studies/[slug]/page.tsx:254` usa `list-disc pl-6 space-y-2` y queda igual.

Lo mismo aplica al `:focus-visible` global (línea 48), que supera a `focus:outline-none` y a los anillos `focus-visible:ring-*` de Tailwind en todo el sitio heredado. Ninguna verificación lo detecta: `53-layer-check.mjs` valida la forma del CSS compilado y `53-computed-styles.mjs` solo mide el fondo del `body` y de un botón. Si esta rama llega a producción tal cual, el blog sale con listas rotas.
**Fix:** Acotar los resets globales para que no pisen contenido heredado, o declarar la excepción dentro de la capa que corresponda. Por ejemplo, quitar `'ul, ol'` de `MuiCssBaseline` y aplicar el reset solo en los componentes del shell (`Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}`). Después añadir a `53-computed-styles.mjs` una comprobación con un post real:

```js
const listStyle = await page.evaluate(() =>
  getComputedStyle(document.querySelector('article ul')).listStyleType)
if (listStyle === 'none') fail('las listas del contenido perdieron list-style (capa mui aplasta a Tailwind)')
```

## Warnings

### WR-01: El shader del hero ignora la decisión explícita de reanudar

**File:** `src/components/HeroGrainGradientShader.tsx:215`
**Issue:** `reducedMotion || paused` detiene el shader si el sistema pide reducir movimiento aunque la persona haya pulsado "reanudar". El resto de la fase respeta esa elección: `motion-init.ts` da prioridad al valor guardado, `MotionProvider` pasa `'never'` al reanudar y `globals.css` exenta `data-motion='running'`. Con preferencia de sistema `reduce` y `jt-motion=running`, el shader queda congelado en el frame 0 y contradice D-15, D-16 y SC 2.2.2 en su lectura de "elección explícita".
**Fix:** Usar solo el estado global, que ya incorpora la preferencia del sistema como valor inicial:

```tsx
const motionProps = paused ? { speed: 0, frame: 0 } : { speed: variantConfig.speed }
```

Eliminar el `useState`/`useEffect` de `matchMedia` o conservar `reducedMotion` solo para el atributo `data-motion` del contenedor.

### WR-02: La bandera de solo lectura falla abierta con cualquier valor distinto de la cadena exacta `'true'`

**File:** `src/lib/preview.ts:19` y `next.config.mjs:12`
**Issue:** `process.env.PREVIEW_READONLY === 'true'`. Valores como `TRUE`, `True`, `1`, `true ` (espacio final, habitual al pegar en Dokploy) o una comilla sobrante dejan la bandera en `false`. Resultado: el preview escribe contra la base de producción, los formularios mandan correo real y se registran clics de afiliado. Los mensajes de error serían invisibles porque todo "funciona". Para una compuerta de seguridad, el default correcto ante ambigüedad es cerrar, no abrir. Además la condición está duplicada en dos archivos que hoy coinciden por casualidad.
**Fix:** Normalizar y fallar cerrado ante valores que parezcan intención de activar:

```ts
export function isPreviewReadonly(): boolean {
  const raw = process.env.PREVIEW_READONLY?.trim().toLowerCase()
  return raw !== undefined && raw !== '' && raw !== 'false' && raw !== '0'
}
```

Aplicar la misma regla en `next.config.mjs` (compartir una función `.mjs` pura que importen ambos).

### WR-03: Los rewrites y headers se fijan en build, el código lee la bandera en runtime, y nada comprueba que coincidan

**File:** `next.config.mjs:12,43-95`, `src/middleware.ts:71-85`
**Issue:** `rewrites()` y `headers()` se evalúan una vez en `next build`. `isPreviewReadonly()` se evalúa en cada request. Si `PREVIEW_READONLY=true` llega solo como variable de runtime (no como variable de build en Dokploy/Nixpacks), el código queda en solo lectura pero los rewrites no existen: `/admin`, la API REST y GraphQL de Payload quedan expuestas en `dev.juan-tech.com` contra la base de producción, y el `X-Robots-Tag` de `headers()` falta (el middleware lo compensa solo en las rutas que el matcher cubre). El matcher excluye `api` y `admin`, así que el middleware no puede cerrar ese hueco. La protección real pasa a depender solo del rol Postgres sin escritura. `53-wait-preview.mjs` no lo detecta (ver IN-02).
**Fix:** Añadir una guarda de runtime independiente del build en las rutas de Payload, por ejemplo en `src/app/(payload)/api/[...slug]/route.ts`, `api/graphql/route.ts`, `api/graphql-playground/route.ts` y `(payload)/layout.tsx`:

```ts
if (isPreviewReadonly()) return new Response('Not Found', { status: 404 })
```

Y documentar en el runbook que la variable debe estar marcada como build-time. Ejecutar `53-preview-contract.mjs` contra la URL desplegada como paso obligatorio.

### WR-04: El alta a lead magnet degrada a suscriptores `confirmed` y rota su token (sabotaje con solo conocer el correo)

**File:** `src/app/actions/subscribe-lead-magnet.tsx:122-165`
**Issue:** `alreadyHasThisMagnet` solo cubre `confirmed` + `optInReason === 'lead-magnet'` + mismo magnet. Cualquier otro suscriptor existente, incluido uno `confirmed` del newsletter, cae en `payload.update` que fija `status: 'pending'`, `confirmedAt: null` y un `token` nuevo. Quien envíe el correo de otra persona por este formulario (límite de 5 por 10 minutos por IP) consigue dos efectos: la víctima deja de recibir el newsletter hasta que confirme de nuevo, y los enlaces de baja de correos anteriores dejan de funcionar porque el token cambió. `subscribeAction` evita justo esto con el retorno temprano para `confirmed` (subscribe.tsx:111-115).
**Fix:** No tocar `status`, `token` ni `confirmedAt` de un suscriptor `confirmed`. Para ese caso, enviar el correo de entrega del magnet con un token de descarga sin degradar la ficha, o añadir el magnet solo tras la confirmación:

```ts
if (current?.status === 'confirmed') {
  // registrar leadMagnet sin cambiar estado ni token; entregar vía correo
}
```

### WR-05: `postPath` del formulario va sin validar al `redirect()` y se guarda sin límite de longitud

**File:** `src/app/actions/subscribe-lead-magnet.tsx:67,74,83,95,159,175`
**Issue:** `postPath` viene directo del `FormData` y se usa en `redirect(\`${postPath}?subscribed=...\`)`. Un valor como `//otro.sitio/x` o `https://otro.sitio/` produce una redirección a otro origen. Next valida el `Origin` en server actions, lo que reduce la explotación cruzada, pero el valor no debería ser controlable. Además se persiste en `source` sin `.slice(...)` (a diferencia de `subscribe.tsx:76`, que corta a 200), lo que permite guardar cadenas arbitrariamente largas en la base.
**Fix:**

```ts
const rawPath = String(formData.get('postPath') ?? '/blog')
const postPath = /^\/(?!\/)[^\s\\]*$/.test(rawPath) ? rawPath.slice(0, 200) : '/blog'
```

### WR-06: `sanitizeHref` deja pasar `/\t/host` y `/\n/host`, que el navegador normaliza a `//host`

**File:** `src/lib/nav-links.ts:40-41`
**Issue:** El filtro de protocol-relative compara `href.startsWith('//')`. Los navegadores eliminan tabulaciones y saltos de línea dentro de una URL antes de parsearla, así que `/<TAB>/evil.com` pasa el filtro (empieza con `/`, segundo carácter es tab), entra por `normalizeServiceHref` y se renderiza como `href` que el navegador resuelve a `//evil.com`. El editor del admin es de confianza, pero el módulo declara T-53-20 (ASVS V5) como control y la prueba `53-nav-links.ts` solo cubre `//evil.com` y `/\evil.com`.
**Fix:** Quitar caracteres de control y espacios internos antes de evaluar, y rechazar si los hubo:

```ts
const href = raw.trim()
if (/[\u0000-\u001f\u007f]/.test(href)) return null
```

Añadir `'/\t/evil.com'` y `'/\n/evil.com'` a la lista de casos malos de `53-nav-links.ts`.

### WR-07: La auditoría `53-write-gates.mjs` tiene puntos ciegos que dan falsos OK

**File:** `scripts/verify/53-write-gates.mjs:25-26,64-72,81-88`
**Issue:**
- `SCAN_DIRS` solo mira `src/app/go`, `src/app/actions` y `src/app/api/newsletter`. Una server action nueva en otra carpeta o un `'use server'` dentro de `src/components` pasa sin revisión.
- `WRITE_CALLS` no incluye operaciones de escritura reales de Payload: `.updateGlobal(`, `.duplicate(`, `.restoreVersion(`, `.login(`, `.forgotPassword(`, `.resetPassword(`, `.jobs.queue(` ni acceso directo a `payload.db`.
- El orden se decide por posición textual (`gate > write`), no por flujo de control. Una escritura en una rama anterior al texto de la compuerta se detecta, pero una compuerta dentro de un `if` que no cubre todas las rutas pasa.
- Una escritura delegada a un helper importado (`import { saveSubscriber } from '@/lib/...'`) no contiene `.create(` en el archivo y queda fuera.
**Fix:** Ampliar el escaneo a todo `src/` buscando `'use server'` y `export async function (GET|POST|PUT|PATCH|DELETE)`, ampliar `WRITE_CALLS` con las operaciones anteriores y añadir una lista cerrada de módulos helper que escriben, exigiendo que sus llamadores importen `isPreviewReadonly`.

### WR-08: `SiteFooter` es todo-o-nada, salta la capa de caché y puede emitir enlaces `/case-studies/null`

**File:** `src/components/shell/SiteFooter.tsx:71-116,142-196`
**Issue:**
- Todo el cálculo está en un solo `try`. Si falla una sola consulta de columna dinámica, se descartan también las columnas del CMS, los enlaces legales y las redes, aunque ya estaban resueltos. Usar `Promise.allSettled` evitaría perderlo todo.
- `resolveDynamicColumn` llama `payload.find` directo, sin `unstable_cache` y sin `overrideAccess: false`, a diferencia de todo `src/lib/cache.ts`, cuyo encabezado (T-43-02) exige `overrideAccess: false` en cada lectura pública. Hoy se compensa con el filtro `_status: published`, pero es la única lectura pública fuera de esa disciplina, y además consulta con profundidad por defecto sin `select`.
- Si `doc.slug` es `null`, el href sale como `/case-studies/null` (línea 113) o `blogPostPath(..., '')` (línea 92), sin filtrar.
**Fix:** Mover las dos consultas a `cache.ts` con `overrideAccess: false` y `select: { title, slug, categories }`, filtrar `docs.filter((d) => d.slug)` antes de mapear y resolver las secciones con `Promise.allSettled`.

### WR-09: El Drawer móvil pone `aria-label` en un `div` sin rol

**File:** `src/components/shell/HeaderView.tsx:193-198`
**Issue:** Para un `Drawer` temporal, MUI usa `role="presentation"` en la raíz del Modal y el `Paper` es un `div` sin rol. Un `aria-label` sobre un elemento genérico no se anuncia (ARIA prohíbe nombrar `generic`). Tampoco declara `aria-modal`. El botón de menú apunta con `aria-controls="menu-movil"` a ese `div`. El proyecto exige las reglas de A11Y.md, y la comprobación `drawer` de `53-computed-styles.mjs` solo valida visibilidad, Escape y foco, no el nombre accesible.
**Fix:**

```tsx
slotProps={{ paper: { id: 'menu-movil', role: 'dialog', 'aria-modal': true, 'aria-label': t('landmarks.menu') } }}
```

### WR-10: El plugin PostCSS decide por sufijo de nombre de archivo, no por la ruta exacta

**File:** `postcss-tailwind-layer.cjs:27`
**Issue:** `/globals\.css$/.test(file)` captura cualquier archivo cuyo nombre termine en `globals.css` (por ejemplo `my-globals.css` o el `globals.css` de una dependencia importada desde el admin). El comentario del propio plugin promete no tocar CSS de terceros (T-53-02), pero la guarda real es más amplia que la promesa. Un CSS de terceros metido en `@layer tailwind` quedaría por debajo de `mui` y de cualquier regla sin capa, cambiando su cascada sin ningún error de build.
**Fix:**

```js
const TARGET = require('node:path').resolve(__dirname, 'src/app/globals.css')
if (!file || require('node:path').resolve(file) !== TARGET) return
```

## Info

### IN-01: Referencia `aria-controls` colgante y listas sin semántica en Safari

**File:** `src/components/shell/HeaderView.tsx:185,133`, `src/components/shell/FooterView.tsx:130,178`
**Issue:** El botón de menú declara `aria-controls="menu-movil"` aunque el Drawer no está montado mientras está cerrado, así que el ID no existe en el DOM. Además `CssBaseline` quita `list-style` de `ul, ol` y Safari con VoiceOver deja de anunciar esas listas como listas.
**Fix:** Poner `aria-controls` solo cuando `open` es verdadero y añadir `role="list"` a los `ul` del shell.

### IN-02: `53-wait-preview.mjs` puede dar OK con un build sin rewrites

**File:** `scripts/verify/53-wait-preview.mjs:16-21`
**Issue:** Solo consulta `/` y exige `X-Robots-Tag: noindex`. Esa cabecera también la pone el middleware en runtime, por lo que pasa aunque el build no tuviera la bandera y por tanto falten los rewrites de `/admin` y `/api` (ver WR-03).
**Fix:** Exigir además que `/admin` responda 404 y que `/api/users` responda 404 antes de imprimir `OK`.

### IN-03: `53-crawl-parity.mjs` no decodifica entidades XML ni maneja índices de sitemap

**File:** `scripts/verify/53-crawl-parity.mjs:19-22`
**Issue:** Extrae `<loc>` con regex y no decodifica `&amp;`, así que cualquier URL con parámetros se sondea mal. Si algún día `sitemap.xml` pasa a ser un índice, las `<loc>` serían archivos sitemap y el crawl compararía los sitemaps, no las páginas.
**Fix:** Reemplazar `&amp;` por `&` (y demás entidades) antes de construir la URL y, si el XML contiene `<sitemapindex`, descender a cada sitemap hijo.

### IN-04: Dependencias sin fijar y script que ejecuta código remoto sin versión

**File:** `package.json:14,58-67`
**Issue:** `@types/node`, `@types/react`, `@types/react-dom` y `tsx` usan `"latest"`; el script `doctor` ejecuta `npx react-doctor@latest`. El `package-lock.json` fija las instalaciones con `npm ci`, pero cualquier regeneración del lock puede traer saltos mayores sin aviso, y `@latest` en `npx` ejecuta código remoto sin versión.
**Fix:** Fijar rangos (`^22` para `@types/node`, `^19` para los tipos de React, `^4` para `tsx`) y fijar `react-doctor` a una versión concreta.

### IN-05: El selector de idioma secuestra Ctrl/Cmd+clic cuando hay hash

**File:** `src/components/shell/LanguageSwitcher.tsx:45-53`
**Issue:** Si `window.location.hash` no está vacío, `handleClick` hace `preventDefault()` y `router.push`, incluso con Ctrl, Cmd o botón central. La persona pierde la apertura en pestaña nueva solo en páginas con ancla.
**Fix:** Salir antes si `event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0`.

---

_Reviewed: 2026-11-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
