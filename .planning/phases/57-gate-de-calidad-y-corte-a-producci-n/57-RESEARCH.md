# Phase 57: Gate de calidad y corte a producción - Research

**Researched:** 2026-11-10
**Domain:** verificación de paridad (SEO, a11y, rendimiento) de un preview Next 15 + Payload 3 contra producción, retirada de Tailwind/shadcn, corte con Dokploy y rollback
**Confidence:** MEDIUM-HIGH (las mediciones públicas y la lectura de código son directas; la solución de TTFB del blog y el comportamiento de cabeceras combinadas quedan como `[ASSUMED]` hasta probarlas en el preview)

Convenciones de etiquetas: `[VERIFIED: ...]` salió de una herramienta en esta sesión (lectura del archivo con Read o `curl` público de solo lectura el 2026-11-10). `[CITED: ...]` viene de un documento del repo. `[ASSUMED]` es criterio propio sin verificar. Esta investigación no tocó ninguna base de datos, no usó `--env-file=.env`, no cambió código y solo hizo `curl` público de solo lectura contra `dev.juan-tech.com` y `juan-tech.com`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01 a D-15, resumen fiel; el texto completo vive en 57-CONTEXT.md)
- D-01: paridad SEO de las 169 URLs contra producción con `53-crawl-parity.mjs` ampliado (title, meta description, canonical, hreflang, OG, JSON-LD, H1 único, jerarquía de encabezados, palabras indexables). Sitemap, robots, `llms.txt`, redirects y revalidación con curl contra el preview. Reporte legible por Juan (GO-01).
- D-02: axe (o Lighthouse a11y) por plantilla más recorrido de teclado automatizado. NVDA, VoiceOver, 375/900/1024/1280 px y zoom 200% quedan como checkpoints de Juan.
- D-03: LCP, TTFB, TBT, CLS e INP del preview contra producción en home, una página de servicio y un post (mobile, varias corridas, mediana). El preview no puede ser peor que el baseline (CAL-02).
- D-04: verificar si el rediseño corrige los cinco hallazgos de la muestra de auditoría (LCP/TTFB del blog, `Critical-CH` y su 307, imagen LCP sin `fetchpriority`, 17 posts solo en español con gemelo EN `noindex`, autor de 2,7 MB). Cada uno es un gate: se arregla en esta fase o queda como excepción aceptada por Juan por escrito.
- D-05: sobras de `deferred-items.md` de 54 y 55 (IN-01 a IN-04 y el resto), comentario del sitemap-data, gate de revalidación del admin al preview y estilo A7 entran como tareas de limpieza o se descartan con motivo documentado.
- D-06: retirar Tailwind, shadcn/Radix y componentes sin referencias con `53-layer-check.mjs` y chequeos de bundle antes y después, en un plan propio, después del gate de paridad visual y antes del reporte final, sin cambiar el aspecto.
- D-07: pendientes de Juan salen de `tsx scripts/verify/56-gate.ts --gate`. Con ítems abiertos no hay corte.
- D-08: prueba real del formulario de contacto, una sola vez contra producción, a `hello@juan-tech.com`. Checkpoint de Juan.
- D-09: el cargador `scripts/db/28-phase56-cutover-load.ts --apply` es checkpoint de Juan con aprobaciones nombradas. Antes se corre `04-which-database.ts` y se confirma el host de Dokploy. `--env-file` solo si Juan lo autoriza.
- D-10: backups de base verificados antes del `--apply`.
- D-11: merge a master SOLO con confirmación escrita explícita de Juan.
- D-12: verificación del deploy de la app `web` por la API de Dokploy (credenciales en `~/.config/juantech/dokploy.env`, nunca imprimir). Revisión de disco del VPS antes de cada build.
- D-13: validación live posterior con el mismo crawl y la misma medición, reenvío de sitemap en Search Console, plan de monitoreo de 404 e indexación.
- D-14: rollback documentado y ensayado en lo posible.
- D-15: la fecha D = 2026-12-01 es una propuesta, no un compromiso.

### Claude's Discretion
Herramientas concretas de medición (Lighthouse CLI, axe-core, Playwright), formato del reporte y nombres de scripts nuevos (prefijo `57-`), siguiendo el patrón de `scripts/verify/`.

### Deferred Ideas (OUT OF SCOPE)
- Phase 58 (prueba y confianza) entera.
- Next 16 u otras mejoras de plataforma.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Descripción | Respaldo de esta investigación |
|----|-------------|--------------------------------|
| SEO-01 | Title, description, canonical, hreflang, OG y JSON-LD idénticos a producción en cada URL del sitemap | `55-seo-parity.mjs` ya compara en profundidad (incluye JSON-LD parseado) pero solo para superficies de la 55 y 58 posts. Falta un runner sobre las 169 URLs, más la lista de URLs nuevas que producción no tiene (por ejemplo `/sobre-mi`). Ver "Qué herramientas existen y cuáles faltan" |
| SEO-02 | Sitemap, robots, `llms.txt`, redirects y revalidación ISR iguales | El preview bloquea `/sitemap.xml` a propósito. Se demuestra con `git diff master...HEAD` (sitemap, llms y `sitemap-data.ts` sin cambios) y con curl live tras el deploy |
| SEO-03 | Un solo H1, jerarquía y contenido indexable no menor | No existe script. Hay que escribirlo (H1, saltos de nivel, conteo de palabras visibles, enlaces internos a URLs `noindex`) |
| CAL-01 | WCAG 2.2 AA, Lighthouse a11y 100, teclado | Lighthouse 13.4.1, Playwright 1.62.0 y axe-core 4.12.1 ya están en `node_modules`. No hace falta paquete nuevo |
| CAL-02 | Lighthouse mobile no empeora (LCP, CLS, INP) | Lighthouse local, 5 corridas intercaladas, mediana. INP no se mide en laboratorio: se usa TBT más un proxy con Playwright |
| CAL-03 | Sin Tailwind ni shadcn/Radix sin usar en el bundle | Hallazgo clave: hay 0 clases tipo Tailwind en el HTML de las 169 URLs del preview, pero `RenderBlocks` sigue como respaldo en servicio y landings Lima y Madrid. Ver sección propia |
| GO-01 | Reporte de gate legible por Juan | Un script agregador `57-gate-report.mjs` que escribe un `.md` en español |
| GO-02 | Confirmación explícita antes del merge | Checkpoint bloqueante, con frase literal |
| GO-03 | Validación live post-deploy y rollback documentado | Dokploy API, `git revert -m 1`, backup `pg_dump` verificado |
</phase_requirements>

## Resumen

El preview ya iguala a producción en lo estructural. Con una comparación rápida de nueve URLs (title, description, canonical, H1, hreflang, OG y tipos de JSON-LD) solo difirió `/sobre-mi`, que producción devuelve como 404 porque es una página nueva del rediseño. En las 169 URLs del sitemap de producción, el HTML del preview no contiene ninguna clase tipo Tailwind, mientras que el control positivo en producción da 74 a 237 coincidencias por página. Esto indica que el retiro de Tailwind es viable, pero `ServiceDetailPage.tsx` y `LocalLandingPage.tsx` conservan `RenderBlocks` como respaldo (`default:` "Bloques sin vista propia: el registro anterior, para no perder texto"), así que un documento con un bloque sin vista propia seguiría necesitando los componentes viejos.

De los cinco hallazgos de la muestra de auditoría, el rediseño corrige uno de forma comprobada (autor de 2,7 MB, ahora 366 KB), deja uno coherente por diseño (gemelos EN `noindex`, sin enlaces internos nuevos hacia ellos en las páginas medidas) y NO corrige tres: `Critical-CH` (lo emite `@payloadcms/next` en `withPayload`, no el código del repo), el TTFB del blog (la ruta es `force-dynamic`, `cache-control: no-store`) y la prioridad de la imagen LCP (no hay `fetchpriority="high"` en home, servicio ni post, aunque el post no tiene imagen hero). Esos tres son tareas de código de esta fase, antes del corte.

El corte es sobre todo coordinación: empujar la rama (53 commits locales sin `origin`), esperar el deploy del preview, correr la batería, tres checkpoints de Juan con base de datos (migración sombra 56-12, respaldo `pg_dump`, cargador `--apply`), merge con frase escrita, deploy de `web` por la API de Dokploy con revisión de disco antes, validación live y rollback por `git revert -m 1` más redeploy.

**Recomendación principal:** construir tres scripts nuevos con prefijo `57-` (`57-seo-parity-all.mjs`, `57-perf-compare.mjs`, `57-a11y-sweep.mjs`) más un agregador de reporte, sin dependencias nuevas; arreglar `Critical-CH` con un filtro sobre `withPayload` en `next.config.mjs` y el TTFB del blog moviendo la lectura de `searchParams` fuera del servidor; hacer el retiro de Tailwind solo después de que un barrido de HTML demuestre que ninguna URL cae en el respaldo `RenderBlocks`.

## Mapa de responsabilidad arquitectónica

| Capacidad | Tier principal | Tier secundario | Razón |
|-----------|---------------|-----------------|-------|
| Cabeceras `Accept-CH`, `Critical-CH`, `Vary` | Config de Next (`next.config.mjs` `headers()`) | Paquete `@payloadcms/next` (origen actual) | Las inyecta `withPayload`; el repo solo puede filtrarlas al exportar la config |
| TTFB y caché del post del blog | Frontend server (SSR/ISR de Next) | Base de datos (`unstable_cache`) | La ruta es `force-dynamic` y por eso no se cachea la respuesta |
| Prioridad de imagen LCP | Browser / HTML servido | Frontend server | `fetchPriority` y `loading` salen en el marcado |
| hreflang y `noindex` de posts solo ES | Frontend server (metadata) | `src/lib/translation-gaps.ts` | Lista `EN_TRANSLATION_INCOMPLETE` decide `omitEn` y `noindex` |
| Sitemap, robots, `llms.txt` | Frontend server (route handlers) | Base de datos | No cambian respecto a master; en el preview se bloquean por diseño |
| Retiro de Tailwind y shadcn | Build (PostCSS, `globals.css`) | Frontend server (componentes) | El CSS entra por `layout.tsx` y `global-not-found.tsx` |
| Deploy, estado y logs | Dokploy API | VPS (Docker, disco) | Token en `~/.config/juantech/dokploy.env` |
| Datos del corte | Base de datos (Postgres en Dokploy) | Scripts `scripts/db/*` | Solo con checkpoint de Juan |

## Qué herramientas existen y cuáles faltan

| Necesidad | Existe hoy | Qué falta | Acción para el plan |
|-----------|-----------|-----------|---------------------|
| Estado HTTP y redirects de las 169 URLs | `53-crawl-parity.mjs` `[VERIFIED: scripts/verify/53-crawl-parity.mjs, 2497 bytes]`. Solo compara estado y `location` de cada ruta del sitemap de producción, con 4 en paralelo | No mira HTML | Reusar tal cual como primer paso del crawl |
| SEO profundo (title, description, canonical, hreflang, `og:*`, `twitter:*`, robots, JSON-LD parseado y ordenado) | `55-seo-parity.mjs` (382 líneas) `[VERIFIED: encabezado del archivo]`. Con `EXPECT_PREVIEW=1` ignora solo robots y `x-robots-tag`. Cubre superficies de la 55 y 58 posts es/en | Un modo "todas las rutas del sitemap" y las rutas nuevas del rediseño | Crear `57-seo-parity-all.mjs` que reuse su extractor (importarlo o extraerlo a un módulo compartido) y agregue las 169 URLs |
| H1 único, saltos de nivel, palabras indexables | `54-page-contract.mjs` y `55-page-contract.mjs` revisan contratos por página (CONTEXT las cita) | Un barrido uniforme sobre las 169 URLs con conteo de palabras preview vs producción | Escribir en el mismo script `57-seo-parity-all.mjs` |
| Enlaces internos a URLs `noindex` o redirigidas | No existe | Hallazgos F4 y F12 | Medir en el crawl: enlaces internos hacia gemelos EN de `EN_TRANSLATION_INCOMPLETE` y hacia redirects. Meta: 0 |
| Accesibilidad | Ninguno en `scripts/verify` `[VERIFIED: ls scripts/verify, sin coincidencias de axe, lighthouse ni perf]` | Barrido por plantilla y recorrido de teclado | `57-a11y-sweep.mjs` con Playwright 1.62.0 más `axe-core` ya instalado (ver abajo) |
| Rendimiento | Ninguno | Comparación preview vs producción | `57-perf-compare.mjs` con el CLI de Lighthouse 13.4.1 local |
| Contrato del preview | `53-preview-contract.mjs`, `53-wait-preview.mjs` | n/a | Reusar para esperar el deploy |
| Gate de decisiones | `56-gate.ts --gate` sale 1 con 70 problemas al cerrar 56-14 `[CITED: 56-CUTOVER-HANDOFF.md]` | Pasar a `aprobado` lo aceptado en bloque (commit que cite la línea del 2026-11-10 de `aprobaciones-juan.md`) | Tarea previa al corte |
| Batería completa | `node scripts/verify/56-run-all.mjs --selftests --strict` (79 pasos PASS) y `--live` con `BASE_URL`, `PROD_BASE`, `EXPECT_PREVIEW=1` | n/a | Correr como regresión antes y después de cada cambio de código de esta fase |
| Retiro de Tailwind | `53-layer-check.mjs` (exige `@layer tailwind, mui;` y que todo `globals.css` quede en `@layer tailwind`) | Falla por diseño cuando Tailwind desaparece | Reemplazar o retirar en el mismo plan (ver Pitfall 5) |

Dependencias de medición ya presentes `[VERIFIED: ls node_modules y package.json]`: `lighthouse` 13.4.1, `playwright` 1.62.0, `axe-core` 4.12.1 (transitiva de Lighthouse), Chromium de Playwright en `~/Library/Caches/ms-playwright`, Chrome de escritorio y Node v24.13.0. No se propone ningún paquete nuevo. `@axe-core/playwright` 4.14.0 existe en el registro pero no hace falta: se inyecta `axe-core` con `page.addScriptTag({ path: require.resolve('axe-core') })`.

## Estado de los hallazgos de la muestra de auditoría (D-04)

Mediciones públicas del 2026-11-10 contra el preview `dev.juan-tech.com` (compilación anterior a la fase 56, con la 55 incluida) y producción. Hay que repetirlas cuando el preview tenga el código final.

| # | Hallazgo | Estado en el preview | Evidencia | Acción |
|---|----------|----------------------|-----------|--------|
| F1 | LCP 9,3 s y TTFB 1,8 a 2,2 s en el post | NO corregido | TTFB del post en preview: 1,66 s, 1,20 s, 1,12 s. Producción 1,98 s. `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` en el post del preview. La ruta declara `export const dynamic = 'force-dynamic'` `[VERIFIED: src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx:72]`. HTML del post: 332.115 bytes en preview contra 295.472 en producción | Tarea de código (ver abajo) |
| F2 | `Critical-CH` y 307 interno | NO corregido | Preview y producción devuelven `accept-ch`, `critical-ch` y `vary: Sec-CH-Prefers-Color-Scheme, ...`. Ni `src` ni `next.config.mjs` contienen esas cadenas. Las emite `@payloadcms/next` 3.85.2 en `withPayload.js` | Tarea de código (ver abajo) |
| F3 | Imagen LCP sin `fetchpriority` | No corregido en HTML medido, pero el elemento LCP puede no ser una imagen | Preview: 0 `fetchpriority="high"` y 0 precargas de imagen en `/`, post y `/servicios`. Home trae 65 `<img>`, las 65 con `loading="lazy"`. `PostView` no tiene imagen hero (sin `<img>` ni `loading=` en `src/components/pages/blog`). Sí existe el patrón correcto en `Frames.tsx`, `AboutView.tsx` y `AuthorProfileView.tsx` | Verificar con Lighthouse cuál es el elemento LCP de la home. Si es una imagen, marcarla `eager` y `fetchPriority="high"`. Si es texto, F3 no aplica y se documenta |
| F4 | 17 posts solo ES con gemelo EN `noindex` y enlaces internos hacia él | Coherente por diseño, enlaces a revisar en crawl completo | `/en/blog/development/react-19` en preview y producción: 200, `noindex, follow`, canonical propio, hreflang solo `es` y `x-default`. Enlaces a `/en/blog/*` desde el post `react-19`: 0 en preview, 1 en producción. Desde `/blog` y el autor: 0 en ambos. La lista vive en `EN_TRANSLATION_INCOMPLETE` (`src/lib/translation-gaps.ts`) | Gate: en el crawl completo, 0 enlaces internos hacia gemelos de esa lista. La política `noindex` más hreflang reducido se mantiene (decisión ya tomada en `translation-gaps.ts`) |
| F5 | Autor de 2,7 MB de HTML | CORREGIDO | `/authors/juan-carlos-angulo`: 366.831 bytes en preview contra 2.704.962 en producción | Gate de presupuesto: HTML del autor no mayor que 500 KB sin comprimir |

Otras diferencias observadas que el gate debe vigilar:
- Peso de HTML: `/servicios` 191.593 bytes en preview contra 86.980 en producción (2,2 veces). Puede empujar TBT. Lo decide la medición.
- `x-powered-by: Next.js, Payload` sigue en el preview (F13). `poweredByHeader: false` en `next.config.mjs` lo apaga, porque `withPayload` solo agrega esa cabecera si `poweredByHeader !== false` `[VERIFIED: withPayload.js líneas 88-103]`.
- `alt=""`: más en el preview (`/blog` 25 contra 13, autor 59 contra 50). Es F9 y la fase 56 (plan 56-07) lo trata. No bloquea, pero el reporte debe mostrarlo.
- Las URLs nuevas del rediseño no existen en producción (por ejemplo `/sobre-mi` da 404 allí, preview 200 con title "Juan Carlos Angulo"). La paridad exige una lista aparte de rutas nuevas con contrato propio, porque el crawl se arma desde el sitemap de producción.

### Arreglo de F2 (`Critical-CH`)

`withPayload` agrega una regla `source: '/:path*'` con tres cabeceras, lectura directa del archivo:

```js
headers: [{
  key: 'Accept-CH',
  value: 'Sec-CH-Prefers-Color-Scheme'
}, {
  key: 'Vary',
  value: 'Sec-CH-Prefers-Color-Scheme'
}, {
  key: 'Critical-CH',
  value: 'Sec-CH-Prefers-Color-Scheme'
}, ...(nextConfig.poweredByHeader !== false ? [poweredByHeader] : [])],
source: '/:path*'
```
`[VERIFIED: node_modules/@payloadcms/next/dist/withPayload/withPayload.js:93-105]`. `getRequestTheme.js` del mismo paquete lee esa pista para el tema "auto" del admin.

Recomendación: en `next.config.mjs`, no exportar `withPayload(...)` directo. Guardar el resultado, envolver su `headers` para quitar de la regla `/:path*` las tres claves cuando el valor sea `Sec-CH-Prefers-Color-Scheme`, y agregar `poweredByHeader: false` a `nextConfig`. El sitio público usa tema oscuro único y no necesita la pista. Riesgo: el admin pierde esa pista para su primer pintado en modo automático `[ASSUMED]`. Si Juan lo nota, se vuelve a agregar solo para `/admin/:path*`.
Verificación: `curl -sD - https://dev.juan-tech.com/ | grep -iE "critical-ch|accept-ch|^vary|x-powered"` no debe devolver `critical-ch` ni `accept-ch`, y el `vary` no debe contener `Sec-CH-Prefers-Color-Scheme`. Cómo combina Next dos reglas que repiten `Vary` es `[ASSUMED]`: se prueba en el preview, no se supone. El admin no se puede revisar en el preview (404 a propósito), así que se confirma tras el deploy con una carga manual de `/admin`.

### Arreglo de F1 (TTFB del post)

El comentario de la ruta explica por qué es `force-dynamic` `[VERIFIED: page.tsx:36-72]`: leer `searchParams` (estado `pending/already/error` del `EmailCaptureBlock`, Phase 49-02) provoca `DynamicServerError` en el fallback ISR y devolvió 500 en todas las rutas de post. Por eso no basta agregar `export const revalidate`. Los datos ya van por `unstable_cache`, así que el costo restante es el render en cada petición más `no-store`.

Camino recomendado `[ASSUMED]`, necesita un spike pequeño en el preview: sacar la lectura de `searchParams` del componente de servidor y leerla en el cliente con `useSearchParams` dentro de `Suspense` (solo el bloque de captura de correo la usa), y entonces volver a `generateStaticParams` vacío más `revalidate` para que el post salga de la caché incremental con `s-maxage`. Beneficios: baja TTFB y elimina `no-store`, que bloquea la caché de ida y vuelta (F7). Criterio de aceptación: `curl -sI` del post devuelve `s-maxage` y no `no-store`, y TTFB mediano en caché caliente menor que 0,6 s (la plantilla de servicios mide 0,8 a 1,0 s hoy, así que el umbral exacto lo fija la línea base medida, no este número). Si el spike falla, la salida honesta es una excepción aceptada por Juan por escrito (D-04).

## Pila estándar

### Core (sin paquetes nuevos)
| Herramienta | Versión | Uso | Fuente |
|-------------|---------|-----|--------|
| `lighthouse` | 13.4.1 (en `node_modules`; registro: 13.6.0) | Rendimiento y accesibilidad por plantilla | `[VERIFIED: node_modules/lighthouse/package.json]` |
| `playwright` | 1.62.0 | Navegación, recorrido de teclado, proxy de INP, inyección de axe | `[VERIFIED: node_modules/playwright/package.json]` |
| `axe-core` | 4.12.1 | Reglas WCAG 2.2 AA (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`) | `[VERIFIED: node_modules/axe-core/package.json:4]` |
| Node `fetch` | Node 24 | Crawl HTTP de solo lectura | `[VERIFIED: node --version]` |

### Alternativas consideradas
| En lugar de | Opción | Compromiso |
|-------------|--------|-----------|
| axe-core inyectado | `@axe-core/playwright` 4.14.0 | Mismo motor, API más cómoda, pero es un paquete nuevo que exige pasar el gate de legitimidad y un checkpoint. No aporta nada que el inyectado no dé |
| Lighthouse local | PageSpeed Insights API | La muestra de auditoría recibió 429 por cuota agotada. No depender de ella |

**Instalación:** ninguna. No se agregan paquetes, así que no hay auditoría de legitimidad de paquetes que correr. Si el plan decide agregar `@axe-core/playwright`, debe correr `gsd-tools query package-legitimacy check --ecosystem npm @axe-core/playwright` y poner un `checkpoint:human-verify` antes de instalar.

## Package Legitimacy Audit

No se recomienda instalar ningún paquete externo nuevo. Tabla omitida a propósito. Paquetes mencionados como alternativa (`@axe-core/playwright`) llevan `[ASSUMED]` hasta pasar el gate.

## Patrones de arquitectura

### Diagrama de flujo del gate

```
 push de feat/mui-redesign
        |
        v
 Dokploy (app preview, PREVIEW_READONLY=true) ---> dev.juan-tech.com
        |                                              |
        |   53-wait-preview.mjs (espera estado done)   |
        v                                              v
 sitemap de producción (169 URLs) + lista de rutas nuevas del rediseño
        |
        +--> 53-crawl-parity.mjs ......... estado y redirects (preview vs prod)
        +--> 57-seo-parity-all.mjs ....... head, OG, JSON-LD, H1, encabezados,
        |                                  palabras, enlaces a noindex
        +--> 57-a11y-sweep.mjs ........... axe por plantilla + teclado (Playwright)
        +--> 57-perf-compare.mjs ......... Lighthouse x5 intercalado, mediana
        +--> 56-run-all.mjs --live ....... regresión de 53 a 56
        v
 57-gate-report.mjs ---> reporte .md en español (GO-01)
        |
        v
 Checkpoints de Juan (gate 56, base, respaldo, cargador, formulario)
        |
        v
 Confirmación escrita (GO-02) ---> merge a master ---> Dokploy deploy web
        |
        v
 Validación live (mismo crawl y medición) ---> Search Console ---> monitoreo
        |
        +--> falla: git revert -m 1 + redeploy + restaurar datos del respaldo
```

### Estructura recomendada de scripts
```
scripts/verify/
├── 57-seo-parity-all.mjs      # 169 URLs + rutas nuevas, solo HTTP
├── 57-a11y-sweep.mjs          # Playwright + axe-core + teclado
├── 57-perf-compare.mjs        # Lighthouse CLI, mediana, preview vs prod
├── 57-bundle-weight.mjs       # CSS y JS servidos (antes y después de CAL-03)
├── 57-legacy-render-sweep.mjs # busca clases Tailwind en el HTML de todas las URLs
├── 57-gate-report.mjs         # agrega salidas y escribe el reporte para Juan
└── 57-run-all.mjs             # orquestador al estilo 56-run-all.mjs
```
Seguir el patrón de `56-run-all.mjs`: cada paso como proceso hijo, PASS o FAIL por paso, sigue tras un fallo, `--selftests` sin red, `--live` con `BASE_URL` y `PROD_BASE`, `--strict`. Cada script nuevo trae `--selftest` con un caso válido y defectuosos de un solo campo, como `55-seo-parity.mjs`.

### Patrón 1: medición de rendimiento comparable
**Qué:** 5 corridas de Lighthouse por URL y entorno, intercaladas (preview, prod, preview, prod...), una petición de calentamiento antes, mediana por métrica, registro de `x-nextjs-cache` de cada respuesta.
**Cuándo:** home `/`, un servicio concreto (tomar el slug del sitemap de producción), el post `/blog/seo/estrategia-seo` (mismo que la muestra) y, para CAL-02, también la home EN.
**Reglas obligatorias:**
- En el preview, correr solo las categorías `performance` y `accessibility`. La categoría SEO falla `is-crawlable` porque el preview es `noindex` a propósito, y daría un falso negativo `[VERIFIED: next.config.mjs, cabecera X-Robots-Tag con isPreview]`.
- Emulación móvil por defecto de Lighthouse, igual que la muestra de auditoría (Lighthouse 13.4.1 móvil).
- Mismo equipo y misma red para ambos entornos. El preview y producción comparten VPS y base de datos `[CITED: 56-CUTOVER-HANDOFF.md, preview lee la base de producción]`, así que no correr las 10 corridas en paralelo.
- INP es métrica de campo. En laboratorio se reporta TBT y un proxy: Playwright abre el menú y el selector de idioma y lee `PerformanceObserver({ type: 'event', durationThreshold: 16 })`. Etiquetar el resultado como "proxy de INP" en el reporte `[ASSUMED]`.
- Regla de "no peor que el baseline" propuesta: mediana del preview menor o igual a 1,10 veces la de producción en LCP, TTFB y TBT, y CLS menor o igual que el mayor entre el de producción y 0,1. El 10% de tolerancia es `[ASSUMED]` y lo confirma Juan en el reporte de planificación.

### Patrón 2: barrido de accesibilidad por plantilla
**Qué:** Playwright carga cada plantilla en ES y EN, inyecta `axe-core`, corre con etiquetas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` y registra violaciones por regla y por URL. Además Lighthouse a11y debe dar 1,00 (CAL-01 lo pide literal).
**Recorrido de teclado automático:** desde el inicio de la página, pulsar Tab hasta cerrar el ciclo, registrar en cada parada `document.activeElement`, si tiene indicador de foco visible (`outline` o `box-shadow` calculado distinto de ninguno) y que la primera parada sea el enlace de salto. Fallar si una parada no tiene nombre accesible o si el foco queda atrapado.
**Plantillas:** home, servicios (índice y detalle), landing Lima y Madrid, blog (índice, categoría, post), casos (índice y detalle), websites (índice y detalle), autores (índice y perfil), Sobre mí, Contacto, Stack, Búsqueda, Privacidad, Términos, 404 `[ASSUMED, derivado de src/app/(frontend)/[locale]/]`.
**Limitación honesta:** axe detecta una parte de los fallos WCAG. Contraste sobre degradados, orden de lectura y significado de los `alt` requieren a Juan (ver checkpoints).

### Patrón 3: crawl de solo lectura con extractor estricto
Parsear los `<script type="application/ld+json">` como bloques JSON, no contar la cadena `application/ld+json`. En la prueba de esta sesión, contar la cadena dio 4 contra 5 en el post y el autor del preview contra producción, pero los bloques reales eran idénticos (`Article | BreadcrumbList` y `Person | BreadcrumbList`): la diferencia era una referencia a la cadena dentro del payload RSC. El extractor de `55-seo-parity.mjs` ya parsea bloques; reusarlo evita ese falso positivo `[VERIFIED: ld.mjs en el scratchpad de esta sesión]`.

### Anti-patrones
- **Comparar sitemap preview contra producción:** el preview reescribe `/sitemap.xml` y `/sitemap.html` a `/preview-blocked` y su `robots.txt` es `Disallow: /` `[VERIFIED: next.config.mjs rewrites y curl dev robots]`. Siempre usar el sitemap de producción como fuente de URLs.
- **Medir solo una corrida:** el LCP del laboratorio varía entre corridas. Usar mediana de 5.
- **Dar por bueno un OK del cargador:** verificar contra el HTML servido y esperar el TTL de 60 s del `unstable_cache` `[CITED: 56-CUTOVER-HANDOFF.md]`.
- **Escribir la regex de clases Tailwind sin control positivo:** en esta sesión se validó contra producción (4 de 4 páginas con coincidencias, 74 a 237 cada una) antes de confiar en el 0 del preview.

## No reescribir a mano

| Problema | No construir | Usar | Por qué |
|----------|--------------|------|---------|
| Reglas WCAG | Revisores propios de contraste, labels, roles | `axe-core` 4.12.1 y el auditor de Lighthouse | Cientos de reglas mantenidas |
| Métricas de laboratorio | Cronometraje propio con `performance.now` | Lighthouse CLI | Emulación móvil y desglose del LCP consistentes con la muestra de auditoría |
| Comparación profunda de JSON-LD y OG | Un diff nuevo | El extractor de `55-seo-parity.mjs` | Ya normaliza `@graph`, orden de claves y `@context` |
| Espera de despliegue | Sleep fijo | `53-wait-preview.mjs` y `application.one` de Dokploy | Un `done` no garantiza contenedor sano (ver Pitfalls) |
| Sustitución de cabeceras de Payload | Parchear `node_modules` | Un filtro sobre `headers()` en `next.config.mjs` | Un parche se pierde en el siguiente `npm ci` |

## Retirada de Tailwind, shadcn y componentes viejos (CAL-03)

### Inventario medido

| Elemento | Detalle | Fuente |
|----------|---------|--------|
| Dependencias | `tailwindcss ^3.4.19`, `tailwindcss-animate ^1.0.7`, `tailwind-merge ^3.6.0`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `autoprefixer ^10.5.2`, `postcss ^8.5.16`, y seis `@radix-ui/react-*` (`avatar`, `dialog`, `navigation-menu`, `separator`, `slot`, `tabs`) | `[VERIFIED: package.json, salida del grep]` |
| `lucide-react ^1.24.0` | 63 archivos lo importan, incluidos componentes nuevos (`mui/PostCard`, `mui/Crumbs`, `mui/ContactForm`, `mui/IconTile`, `pages/ServicesIndexView`, `pages/ContactView`...). No es Tailwind ni Radix | `[VERIFIED: grep]` |
| Configuración | `tailwind.config.ts`, `postcss.config.js` (con el plugin propio `postcss-tailwind-layer.cjs`), `components.json`, `src/app/globals.css` (174 líneas, empieza con `@tailwind base; @tailwind components; @tailwind utilities;`) | `[VERIFIED: ls y cat]` |
| Quién importa el CSS | `src/app/(frontend)/[locale]/layout.tsx:12` y `src/app/global-not-found.tsx:7`, ambos `globals.css` | `[VERIFIED: grep]` |
| `src/components/ui/*` | 23 archivos fuera de `ui/` lo importan (entre ellos `SiteHeaderChrome`, `ToolCard`, `AuthorCard`, `GearCard`, `WebsiteCard`, `blocks/ContactFormBlock`, `blocks/NewsletterBlock`, `blocks/EmailCaptureBlock`) | `[VERIFIED: grep]` |
| `cn` | `src/lib/utils.ts` usa `clsx` y `tailwind-merge`; 7 archivos importan `cn` | `[VERIFIED: grep y lectura]` |
| Respaldo `RenderBlocks` | `ServiceDetailPage.tsx:170` y `LocalLandingPage.tsx:140` renderizan `<RenderBlocks key={key} blocks={[s.block]} />` en el `default:` del switch, con el comentario "Bloques sin vista propia: el registro anterior, para no perder texto". `blockRegistry.tsx` registra 28 bloques viejos | `[VERIFIED: lectura de líneas 150-172 y grep]` |
| Barrido de HTML del preview | 169 URLs del sitemap de producción: 0 con clases tipo Tailwind. Control positivo en producción: `/` 237, `/stack` 189, el post 125, `/servicios` 74 | `[VERIFIED: tw.mjs y twc.mjs en el scratchpad, 2026-11-10]` |

### Lectura del hallazgo

El 0 es una buena señal, pero cubre solo URLs del sitemap. Quedan fuera: 404, búsqueda, privacidad, términos, `/sobre-mi`, contacto y rutas que dependen de documentos que aún no existen o que solo Juan crea desde el admin. Además, un documento futuro con un bloque sin vista propia volvería a caer en `RenderBlocks`. Qué tipos de bloque existen en documentos reales no se puede saber sin leer la base, lo cual esta investigación tenía prohibido.

Recomendación por orden:
1. Ampliar `57-legacy-render-sweep.mjs` a todas las rutas del sitemap más las nuevas (`/sobre-mi`, `/contact`, `/search`, `/privacy`, `/terms`, una 404 y `/en/*` equivalentes), con control positivo contra producción.
2. Decisión de diseño (Claude, sin necesidad de Juan): reemplazar el `default:` de ambos switches por `return null` más un `console.warn` en el servidor, o por una vista MUI mínima de texto. Así ningún documento nuevo reintroduce Tailwind. Esto cambia el comportamiento solo si hoy existe un documento con bloque sin vista; el barrido de HTML dice que no existe ninguno en el sitemap.
3. Orden del plan propio de retiro: (a) quitar el `default:` y los componentes sin importadores, (b) quitar los importadores de `components/ui` que sobrevivan, (c) quitar `@tailwind` de `globals.css` y convertir lo que queda en CSS plano o en `GlobalStyles` de MUI, (d) quitar `tailwind.config.ts`, `postcss.config.js`, `postcss-tailwind-layer.cjs`, `components.json`, (e) quitar dependencias, (f) `npm ci` y compilación completa en Dokploy, (g) repetir crawl, a11y y rendimiento y comparar con las cifras previas.
4. Componentes candidatos a retiro ya nombrados en `55-deferred-items.md`: `RichTextRenderer`, `PostCard` vieja, `CaseStudyCard`, `CaseStudyResultsChart`, `WebsiteCard`, `AuthorCard`, `BlogCategoryTabs`, `CategoryBridge`, `InlineOffer`, `RailOffer`, `BlogClosing` vieja, y de la 54: `ToolCard`, `GearCard`, `StackHighlightCallout`, `AffiliateDisclosureFrame`. Antes de borrar, el script de alcance debe confirmar cero importadores desde `src/app/(frontend)` y `src/app/global-not-found.tsx` (análisis estático con la API del compilador de TypeScript y los alias de `tsconfig.json`, `[ASSUMED]`). Los esquemas de bloque en `src/blocks/*/config` los usa el admin de Payload y no se borran: solo se retiran los `Component.tsx` sin vista.
5. `lucide-react` se queda: CAL-03 nombra Tailwind y shadcn/Radix, y lucide ya vive en los componentes MUI. Confirmar con Juan solo si quiere cambiarlo (no está en el alcance).
6. `src/app/(payload)` importa `@payloadcms/next/css` y no depende de Tailwind `[VERIFIED: grep de layout.tsx]`. El admin debe verse igual: comprobación manual de Juan tras el deploy del preview, aunque el admin esté bloqueado allí, así que la revisión real es en producción tras el corte (ver checkpoints).

### Chequeo de bundle antes y después (sin base de datos)
Medir lo que el navegador descarga, desde el HTML público del preview, con `57-bundle-weight.mjs`: lista de `<link rel="stylesheet">` y `<script src>` por plantilla, tamaño sin comprimir y con gzip (`Accept-Encoding: gzip` y `Content-Length`). Guardar la medición "antes" en el reporte y repetirla "después". No hace falta `next build` local, que requeriría variables y acceso a base de datos. `.next` existe en el repo local con un `BUILD_ID` de una compilación previa, útil solo como referencia ocasional `[VERIFIED: ls .next]`.

## Sobras diferidas (D-05)

| Ítem | Origen | Qué hacer | Evidencia |
|------|--------|-----------|-----------|
| IN-01 copiar correo duplicado en `CtaPanel` y `CopyEmailButton` | `54-REVIEW.md`, listado en `55-deferred-items.md` | Tarea de limpieza: unificar en un componente | `[CITED: 55-deferred-items.md]` |
| IN-02 el formulario pierde el mensaje al fallar | idem | Tarea de código con prueba en `54-contact-form.mjs`. Toca el formulario, cuidado con la prueba real D-08 | idem |
| IN-03 `key` de `StackView` | idem | Corrección trivial | idem |
| IN-04 cadenas fijas en `service-view-data.ts` y `CodeFixes.tsx` | idem | Mover a `messages` ES y EN con paridad (`53-messages-parity.mjs` sigue vigente) | idem |
| Comentario de `sitemap-data.ts` líneas 118 a 129 | `55-deferred-items.md` | Corregir el texto ("Authors/Websites have no cache-tag hooks at all" ya es falso) y decidir si el sitemap suma `CACHE_TAGS.websites()` y `CACHE_TAGS.authors()`. Recomendación: corregir solo el comentario, porque el sitemap no cambia respecto a master y SEO-02 exige igualdad. Verificado que el archivo no cambió desde master | `[VERIFIED: sed 112-132 de src/lib/sitemap-data.ts; git diff master...HEAD sin cambios en ese archivo]` |
| Revalidación de admin a preview (T-55-15) | `55-deferred-items.md` | Compuerta humana: Juan publica un cambio en un Website, un Author y un SpeakingEvent desde el admin de producción y se comprueba el preview sin esperar. Los hooks `afterChange` corren en el proceso de producción, el preview se entera por TTL de 60 s más ventana ISR de 60 s. Después del corte esta compuerta desaparece, porque admin y sitio comparten proceso | `[CITED: 55-deferred-items.md]` |
| Verificadores de la fase 48 (`verify-stack-word-count.ts`, `verify-stack-page.ts`) | `54-deferred-items.md` | Borrarlos junto con `ToolCard`, `GearCard`, `StackHighlightCallout`, `AffiliateDisclosureFrame` | `[CITED: 54-deferred-items.md]` |
| Claves `websites.detail.screenshotsTitle` y `websites.detail.externalNotice` | `55-deferred-items.md` | Quitar de `messages/es.json` y `en.json` a la vez (paridad) | `[CITED]` |
| `scripts/_tmp-dump-b0303.ts` y `scripts/_tmp-extract-b0303.ts` | `git status` | Sin versionar y ajenos a la fase: decisión de Juan (borrar o commitear). No tocar sin su respuesta | `[VERIFIED: git status inicial]` |
| Supuesto A7 (rol `juantech_preview_ro` lee `home_page*` y `about_page*`) | `54-deferred-items.md` | Se confirma al cargar la home real del preview: si `/` y `/sobre-mi` muestran contenido de Payload y no el respaldo, el rol lee. No requiere acceso a la base | `[CITED]` |

## Dokploy: deploy, estado y rollback

Credenciales: `~/.config/juantech/dokploy.env` exporta `DOKPLOY_URL` y `DOKPLOY_TOKEN` `[VERIFIED: nombres de variable leídos con sed, sin imprimir valores]`. Se cargan con `set -a; . ~/.config/juantech/dokploy.env; set +a`, cabecera `x-api-key`, nunca se imprimen ni se escriben en el repo `[CITED: memoria reference_dokploy_token_archivo]`.

Llamadas documentadas en la skill `dokploy-deploy` `[CITED: ~/.claude/skills/dokploy-deploy/SKILL.md]`:
- Base `$DOKPLOY_URL/api/<router>.<procedure>`; GET para consultas y POST con JSON para mutaciones.
- `project.all` para ubicar los `applicationId` de la app `web` de producción y del preview. No hay IDs en el repo: se descubren en la ejecución.
- `application.deploy {applicationId}` encola el despliegue; `application.one?applicationId=` devuelve `applicationStatus` (`idle`, `running`, `done`, `error`).
- `deployment.all?applicationId=` ordenado por `createdAt` y `deployment.readLogs?deploymentId=&tail=200` para el build.
- `docker.getContainers` para el estado real: un `done` puede ser un contenedor en bucle de reinicios.
- Dokploy no ejecuta comandos dentro del contenedor: lo que requiera `payload migrate` o scripts lo corre Juan por SSH.

Despliegue: el sitio se despliega al mergear a `master` en `github.com/Sve-nnN/website`; el CI de GitHub solo hace typecheck y build `[CITED: memoria project_deploy_dokploy_master]`, `[VERIFIED: git remote -v, origin https://github.com/Sve-nnN/website.git]`. El `build` de `package.json` es solo `next build` `[VERIFIED: package.json líneas 6-14]`: no ejecuta migraciones. Las migraciones aditivas de 54, 55 y la `phase56_legal_shadow` (`20261110_220805`) existen en `src/migrations` y la de la 56 está pendiente de aplicar (checkpoint 56-12 sin correr). Orden obligatorio: aplicar la migración sombra antes del merge, porque es aditiva y master no lee esas tablas `[CITED: 56-CUTOVER-HANDOFF.md]`. Qué comando de build y qué variables usa Dokploy hoy `[ASSUMED]`: se confirma leyendo `application.one` del preview y de `web` (sin imprimir secretos).

Estado previo conocido: la rama local lleva 53 commits sin empujar a `origin/feat/mui-redesign` `[VERIFIED: git log origin/feat/mui-redesign..HEAD, 53]` (el handoff decía 49). El preview sirve una compilación anterior a la fase 56. Primer paso del plan: empujar, esperar `done` del preview (ordenar por `createdAt`) y comprobar con `53-preview-contract.mjs`.

Rollback `[ASSUMED]` salvo lo marcado:
1. Código: `git revert -m 1 <merge>` en master, push, Dokploy redespliega. Alternativa: `application.deploy` tras restablecer master al commit anterior. Dokploy puede tener una función de rollback por imagen (router `rollback`); no está documentada en la skill, se consulta el código fuente con `gh api repos/Dokploy/dokploy/contents/apps/dokploy/server/api/routers/` como indica la skill antes de depender de ella.
2. Datos: el cargador no tiene modo de restauración `[CITED: 56-CUTOVER-HANDOFF.md]`. Tres caminos: versiones de Payload (`websites`, `case-studies`), reescribir a mano desde `~/respaldo-fase56-corte-AAAAMMDD.json` (`media`, `authors`, `testimonials`, `header`, `legal-pages`) o restaurar un volcado.
3. Volcado: el handoff no encontró rutina de volcados de `shared-postgres` y lo deja como confirmación pendiente de la 57. Propuesta: Juan corre `pg_dump -Fc` por el túnel (`scripts/db/tunnel.sh`) a un archivo fuera del repo y verifica con `pg_restore --list`. Los backups nativos de Dokploy (router `backup`, destino Cloudflare R2) pueden no cubrir `shared-postgres` porque se despliega como Compose `[ASSUMED, de la skill]`. El incidente del 2026-07-12 se recuperó con restauración a un punto en el tiempo en Neon; hoy la base es la de Dokploy.
4. Ensayo posible sin tocar producción: en el preview, el mismo `git revert` en la rama y redeploy del preview, y medir cuánto tarda (el preview no escribe). Sirve para documentar tiempos.

## Disco del VPS antes de cada build (D-12)

Método de lectura, solo lectura, a ejecutar antes de cada deploy de `web` y del preview:

```bash
ssh -i ~/.ssh/sapling_ed25519 juan@116.203.79.125 "df -h /; sudo docker system df; sudo find /var/lib/docker/containers -name '*-json.log' -printf '%s %p\n' | sort -rn | head -5"
```
La llave `sapling_ed25519` con usuario `juan` es la que autentica; `dokploy_ed25519` fue rechazada para `juan` y `root` el 2026-11-07 `[CITED: memoria reference_ssh_key_dokploy y reference_prod_db_access]`. Umbral propuesto: continuar solo con menos de 80% de uso y más de 15 GB libres `[ASSUMED]`. Si falta espacio: `docker builder prune -af` y `docker image prune -a` (12 GB liberados el 2026-11-10). El interruptor de limpieza diaria incorporado de Dokploy debe seguir apagado porque puede borrar volúmenes `[CITED: skill dokploy-deploy]`.

Riesgos conocidos `[CITED: memoria project_vps_disco_lleno_logs_docker]`: sin `/etc/docker/daemon.json`, los logs crecen sin techo (el incidente del 2026-08-25 fue un contenedor de otra app con 23 GB en `json.log`). La rotación y el bucle de Redis seguían sin arreglar en esa fecha, así que el disco puede volver a subir sin relación con esta fase. Cuando el disco llega a 100%, `shared-postgres` entra en recuperación y Dokploy cancela despliegues sin avisar: tras cada `application.deploy`, leer `deployment.all` y comprobar que el estado no sea `cancelled`. Si algún chequeo SSH queda bloqueado en el entorno, lo corre Juan y pega la salida.

## Pitfalls comunes

### Pitfall 1: el preview no es lo que se cree
El preview sirve una compilación anterior a la 56 y 53 commits locales no están en `origin`. Medir antes del push da cifras de otro código. **Evitar:** primer plan = push, espera de `done`, `53-preview-contract.mjs`. **Señal:** `56-no-marker-live`, `56-cta-live` y `56-legal-live` en FAIL `[CITED: handoff]`.

### Pitfall 2: Lighthouse SEO en el preview siempre falla
El preview emite `X-Robots-Tag: noindex, nofollow` y robots `Disallow: /`. **Evitar:** categorías `performance` y `accessibility` solo; la paridad SEO se mide con el crawl.

### Pitfall 3: comparar medias con ruido de red
La muestra de auditoría ya avisó que las cifras de laboratorio varían entre corridas. **Evitar:** 5 corridas intercaladas, mediana, calentamiento, registrar `x-nextjs-cache` (`HIT`, `MISS`, `STALE`). El preview vio `STALE` y producción `HIT` en la misma hora.

### Pitfall 4: arreglar el TTFB solo con `revalidate`
Agregar `export const revalidate` al post devolvió 500 en todos los posts en la fase 49-03 `[VERIFIED: page.tsx:43-72]`. **Evitar:** quitar primero la lectura de `searchParams` del servidor.

### Pitfall 5: `53-layer-check.mjs` y las baterías 54 y 55 fallan al quitar Tailwind
`53-layer-check.mjs` exige `@layer tailwind, mui;` y el plugin `postcss-tailwind-layer.cjs`, y `54-run-all.mjs`, `55-run-all.mjs` y `53-computed-styles.mjs` lo mencionan `[VERIFIED: grep -rln en scripts/verify]`. **Evitar:** en el mismo plan de retiro, reemplazarlo por una comprobación inversa (no existen `@tailwind` ni `tailwind.config.ts`, y `globals.css` ya no declara la capa) y actualizar los orquestadores. Sin eso la regresión queda en rojo por un motivo correcto.

### Pitfall 6: contar `application/ld+json` como cadena
Da diferencias falsas por el payload RSC. **Evitar:** parsear bloques de `<script>`.

### Pitfall 7: confiar en el OK del cargador y del deploy
Un `done` de Dokploy no prueba contenedor sano, y un OK del cargador no prueba que producción sirva el valor nuevo (incidente del 2026-08-17 con la base equivocada). **Evitar:** `docker.getContainers` más verificación contra el HTML servido, y `04-which-database.ts` antes de escribir.

### Pitfall 8: rutas nuevas sin línea base
`/sobre-mi` y otras no existen en producción; un diff contra producción las marcaría 404 o las omitiría. **Evitar:** lista explícita de rutas nuevas con contrato propio (title, H1, canonical, hreflang, JSON-LD esperado) y comparación contra `54-page-contract.mjs`.

### Pitfall 9: guardar un caso desde el admin de master pierde lecciones
Master no conoce `case-studies.lessons`. **Evitar:** el cargador corre justo después del deploy, no antes `[CITED: handoff]`.

### Pitfall 10: más peso de HTML en servicios
191 KB contra 87 KB en `/servicios`. Puede degradar TBT aunque el SEO sea idéntico. **Evitar:** incluir peso de HTML y de JS en el reporte de rendimiento y fijar un presupuesto tras la primera medición.

## Ejemplos de código

### Barrido de HTML por clases Tailwind (con control positivo)
```js
// Fuente: prueba de esta sesión (tw.mjs). La regex es deliberadamente amplia.
const re = /class="[^"]*\b(?:flex|grid|px-\d|py-\d|mt-\d|mb-\d|gap-\d|text-(?:sm|base|lg|xl|muted-foreground)|bg-(?:background|muted|card|primary)|rounded-(?:md|lg|xl)|container|items-center|justify-between)\b[^"]*"/g
// Resultado 2026-11-10: preview 0 en 169 URLs, producción 74 a 237 por página (control).
```

### Inyección de axe-core sin paquete nuevo
```js
// Fuente: patrón estándar de axe-core, adaptado; la ruta sale de node_modules/axe-core (4.12.1).
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
await page.addScriptTag({ path: require.resolve('axe-core') })
const results = await page.evaluate(() =>
  // @ts-ignore
  axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }),
)
```
`[ASSUMED]`: el patrón de inyección es conocimiento previo, no verificado en esta sesión con documentación. Verificarlo con `--selftest` sobre una página con un fallo conocido antes de confiar en un 0.

### Medición de TTFB y caché desde curl
```bash
curl -s -o /dev/null -D - -w "ttfb=%{time_starttransfer} size=%{size_download}\n" https://dev.juan-tech.com/blog/seo/estrategia-seo | grep -iE "x-nextjs-cache|cache-control|ttfb"
```

### Filtro de cabeceras en `next.config.mjs` (esbozo, no aplicado)
```js
// ESBOZO [ASSUMED]: validar en el preview cómo Next combina reglas y Vary.
const CH_KEYS = new Set(['Accept-CH', 'Critical-CH'])
const withPayloadConfig = withPayload(withNextIntl(nextConfig))
export default {
  ...withPayloadConfig,
  async headers() {
    const rules = await withPayloadConfig.headers()
    return rules.map((rule) =>
      rule.source === '/:path*'
        ? { ...rule, headers: rule.headers.filter((h) => !CH_KEYS.has(h.key) && !(h.key === 'Vary' && h.value === 'Sec-CH-Prefers-Color-Scheme')) }
        : rule,
    )
  },
}
```

## Estado del arte

| Antes | Ahora | Cuándo | Impacto |
|-------|-------|--------|---------|
| Tailwind v3 bajo capas de MUI | MUI 9.5 con tema oscuro propio, Tailwind sin clases visibles en el HTML | Phases 53 a 55 | CAL-03 pasa a ser retirada de código muerto |
| Autor con `limit: 50` y 2,7 MB | Autor con todos los posts, 366 KB | Phase 55 | F5 resuelto |
| Hardcodear la fecha de corte | Fecha D = 2026-12-01 es una propuesta | D-15 | Sin compromiso |

**Obsoleto o por retirar:** `53-layer-check.mjs` (tras CAL-03), verificadores de la fase 48, `RenderBlocks` como respaldo de servicios.

## Registro de supuestos

| # | Afirmación | Sección | Riesgo si es falsa |
|---|------------|---------|--------------------|
| A1 | Quitar `Critical-CH` solo afecta el primer pintado del tema automático del admin | F2 | Admin con parpadeo de tema; se recupera la regla solo para `/admin/:path*` |
| A2 | Next combina dos reglas de `headers()` con `Vary` sin conflicto con el filtro propuesto | F2 | Cabecera persiste; se prueba en el preview con `curl` |
| A3 | Mover `searchParams` al cliente permite `revalidate` e ISR en el post | F1 | TTFB sigue alto; se pide excepción a Juan |
| A4 | Tolerancia de 10% y presupuesto de HTML de 500 KB para autor | Patrón 1 | Gate demasiado laxo o estricto; Juan lo confirma |
| A5 | El proxy de INP con `PerformanceObserver` aproxima el INP de campo | Patrón 1 | Cifra engañosa; se etiqueta como proxy |
| A6 | La inyección de axe con `addScriptTag` funciona con 4.12.1 y cubre `wcag22aa` | Ejemplos | Barrido vacío; el `--selftest` con fallo conocido lo detecta |
| A7 | Los backups nativos de Dokploy no cubren `shared-postgres` | Rollback | Existe un respaldo que no se usó; se confirma en la UI |
| A8 | Dokploy puede tener rollback por imagen | Rollback | Se usa `git revert` en su lugar |
| A9 | Umbral de disco 80% y 15 GB libres | Disco | Build falla o se bloquea sin motivo |
| A10 | Un análisis estático con la API de TypeScript alcanza para saber qué componentes son inalcanzables | CAL-03 | Se borra algo vivo; la regresión de la 54 a la 56 lo detecta |
| A11 | El comando de build de Dokploy es `next build` sin migraciones | Dokploy | Una migración se aplicaría sola en el deploy; revisar con `application.one` |
| A12 | Plantillas listadas para el barrido de accesibilidad | Patrón 2 | Falta una plantilla |

## Preguntas abiertas

1. **Elemento LCP real de la home y del servicio.**
   - Sabemos: 65 imágenes, todas `lazy`, 0 `fetchpriority`; el post no tiene hero.
   - No sabemos: si el LCP es texto o imagen.
   - Recomendación: leer `largest-contentful-paint-element` del JSON de Lighthouse antes de tocar nada.
2. **Documentos reales con bloques sin vista propia.**
   - Sabemos: ninguna URL del sitemap renderiza clases Tailwind.
   - No sabemos: si `pages` o `services` tienen documentos fuera del sitemap con esos bloques.
   - Recomendación: el barrido de HTML y el `default:` a `null` con aviso; si Juan quiere certeza, una consulta de solo lectura por su túnel.
3. **¿Existe un respaldo reciente de `shared-postgres`?** Sin evidencia en el repo. Juan confirma en el panel de Dokploy o corre `pg_dump`.
4. **Ruta de `A11Y.md`.** La regla global de CLAUDE.md exige seguir `A11Y.md` (fecarrico/A11Y.md). No se descargó en esta sesión. El planner debe incluir una tarea que lo lea y derive la lista manual de Juan.
5. **Rutas nuevas del rediseño.** Falta la lista exacta de URLs que existen en el preview y no en producción (hay al menos `/sobre-mi`). Se obtiene del árbol `src/app/(frontend)/[locale]/` y de la comparación de rutas.
6. **Fuente de `x-nextjs-cache: STALE` en la primera respuesta del preview.** Producción mostró `HIT`. Probablemente el TTL de 60 s; no afecta el gate, pero conviene registrarlo.

## Disponibilidad del entorno

| Dependencia | Requerida por | Disponible | Versión | Alternativa |
|-------------|---------------|-----------|---------|-------------|
| Node | Todos los scripts | Sí | v24.13.0 | n/a |
| Lighthouse CLI | CAL-02, CAL-01 | Sí | 13.4.1 | PSI (cuota agotada), no recomendada |
| Playwright y Chromium | A11y, INP, teclado | Sí | 1.62.0 (chromium 1208, 1234, 1243 en caché) | Chrome de escritorio presente |
| axe-core | CAL-01 | Sí | 4.12.1 | Lighthouse a11y |
| `curl` y `fetch` | Crawl, cabeceras | Sí | n/a | n/a |
| Acceso SSH al VPS | Disco, logs, relay de base | Sí con `sapling_ed25519` y usuario `juan` (verificado el 2026-08-17, no vuelto a probar hoy) | n/a | Juan pega la salida |
| Túnel y base de datos | Cargador, respaldo, migración 56-12 | Solo Juan | n/a | No hay alternativa |
| Dokploy API | Deploy, estado, logs | Credenciales presentes (solo nombres leídos) | n/a | UI de Dokploy |
| Chrome headless en CI | n/a | n/a | n/a | n/a |

**Faltantes sin alternativa:** el túnel a la base solo lo abre Juan, y el clasificador del entorno bloquea que Claude levante el relay `[CITED: memoria reference_prod_db_access]`.
**Con alternativa:** SSH al VPS, si queda bloqueado lo corre Juan.

## Arquitectura de validación

`workflow.nyquist_validation` es `false` en `.planning/config.json`, pero la solicitud pidió esta sección de forma explícita, por eso se incluye.

### Marco de pruebas
| Propiedad | Valor |
|-----------|-------|
| Marco | Scripts Node `.mjs` y `tsx` con salida PASS o FAIL por paso (patrón `scripts/verify/*-run-all.mjs`); sin Jest ni Vitest |
| Config | Ninguna; variables `BASE_URL`, `PROD_BASE`, `PREVIEW_BASE`, `EXPECT_PREVIEW=1` |
| Comando rápido | `node scripts/verify/56-run-all.mjs --selftests --strict` (sin red ni base, 79 pasos PASS al cerrar 56-14) |
| Suite completa | `BASE_URL=https://dev.juan-tech.com PROD_BASE=https://juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/56-run-all.mjs --live --no-wait --strict` más el nuevo `57-run-all.mjs --live` |

### Requisitos a pruebas
| Req | Comportamiento | Tipo | Comando | Existe |
|-----|---------------|------|---------|--------|
| SEO-01 | Head, OG y JSON-LD iguales en 169 URLs y rutas nuevas con contrato | integración HTTP | `node scripts/verify/57-seo-parity-all.mjs` | No, Wave 0 |
| SEO-01 | Estado y redirects iguales | integración HTTP | `PREVIEW_BASE=... PROD_BASE=... node scripts/verify/53-crawl-parity.mjs` | Sí |
| SEO-02 | Sitemap, llms y `sitemap-data.ts` sin cambios; robots y middleware solo con bandera de preview | estático | `git diff --stat master...HEAD -- src/app/sitemap.xml src/app/sitemap.html src/app/llms.txt src/app/llms-full.txt src/lib/sitemap-data.ts` (debe estar vacío) | Sí (comando) |
| SEO-02 | Sitemap, robots, llms, redirects en vivo | integración HTTP | `57-seo-parity-all.mjs --live-prod` tras el deploy | No, Wave 0 |
| SEO-03 | H1 único, sin saltos, palabras no menores, 0 enlaces a `noindex` | integración HTTP | `57-seo-parity-all.mjs` | No, Wave 0 |
| CAL-01 | axe sin violaciones AA y Lighthouse a11y 1,00 por plantilla, teclado sin trampas | e2e Playwright | `node scripts/verify/57-a11y-sweep.mjs` | No, Wave 0 |
| CAL-02 | LCP, TTFB, TBT, CLS y proxy de INP no peores | rendimiento | `node scripts/verify/57-perf-compare.mjs` | No, Wave 0 |
| CAL-03 | 0 clases Tailwind en HTML, sin dependencias ni configs, peso CSS y JS no mayor | integración HTTP y estático | `57-legacy-render-sweep.mjs`, `57-bundle-weight.mjs`, `grep -c tailwind package.json` | No, Wave 0 |
| D-04 F1 a F5 | Cada hallazgo corregido o excepción firmada | integración HTTP | `curl` de cabeceras y tamaños, `57-perf-compare.mjs` | Parcial |
| GO-01 | Reporte en español | script | `node scripts/verify/57-gate-report.mjs` | No, Wave 0 |
| GO-03 | Validación live idéntica | integración HTTP | mismas órdenes con `BASE_URL=https://juan-tech.com` | Mismos scripts |

### Frecuencia de muestreo
- Tras cada commit de tarea: autopruebas de los scripts tocados (`--selftest`) y `56-run-all.mjs --selftests --strict`.
- Tras cada oleada: batería viva contra el preview, solo lectura.
- Puerta de fase: batería completa en verde, reporte generado y revisado por Juan antes de `/gsd-verify-work`.

### Huecos de Wave 0
- [ ] `scripts/verify/57-seo-parity-all.mjs` (SEO-01, 02, 03) con `--selftest`.
- [ ] `scripts/verify/57-a11y-sweep.mjs` (CAL-01) con `--selftest` sobre una página con fallo conocido.
- [ ] `scripts/verify/57-perf-compare.mjs` (CAL-02).
- [ ] `scripts/verify/57-legacy-render-sweep.mjs` y `57-bundle-weight.mjs` (CAL-03).
- [ ] `scripts/verify/57-gate-report.mjs` y `57-run-all.mjs`.
- [ ] Lista de rutas nuevas del rediseño con contrato propio.
- [ ] Instalación de marco: ninguna.

## Dominio de seguridad

`security_enforcement` es `true` en `.planning/config.json`.

### Categorías ASVS aplicables
| Categoría | Aplica | Control estándar |
|-----------|--------|------------------|
| V2 Autenticación | No directamente | El token de Dokploy y la llave SSH no se imprimen ni se escriben en el repo |
| V3 Sesión | No | n/a |
| V4 Control de acceso | Sí | El preview no escribe (`PREVIEW_READONLY`); admin y API bloqueados allí. Los scripts de la fase son GET |
| V5 Validación de entradas | Sí | Prueba real del formulario de contacto una sola vez (D-08) |
| V6 Criptografía | No | HSTS ya presente (`max-age=63072000; includeSubDomains; preload`) |
| V14 Configuración | Sí | Quitar `x-powered-by`; vigilar `Content-Security-Policy-Report-Only` como mejora opcional (F8, fuera del alcance de paridad) |

### Amenazas conocidas
| Patrón | STRIDE | Mitigación |
|--------|--------|-----------|
| Escribir en la base equivocada y "verificar" OK | Tampering | `04-which-database.ts` antes de cada escritura y verificación contra el HTML servido |
| Imprimir secretos en logs del reporte | Information disclosure | Los scripts nunca leen `.env`; el reporte excluye cabeceras `set-cookie` y tokens |
| Cargador destructivo sin aprobación | Tampering | Solo `--apply` con frase literal de Juan para recortes y `--overwrite-lessons` |
| Relé de base abierto | Elevation | Relay solo en loopback del VPS, lo abre Juan y se borra al salir |
| Disco lleno tumba Postgres | Denial of service | Revisión de disco antes de cada build |

## Pasos de Juan (lista de checkpoints)

Cada uno bloquea el avance. Ninguno lo ejecuta Claude con base de datos.

1. **Empujar la rama.** Aprobar el push de `feat/mui-redesign` (53 commits) para que Dokploy despliegue el preview. Ya hay autorización de uso del token para desplegar `[CITED: memoria]`; confirmar el push.
2. **Cerrar el gate de decisiones.** Revisar `tsx scripts/verify/56-gate.ts --gate` (salía 1 con 70 problemas) y responder lo abierto: 21 lecciones, `HOME-EN`, `ABOUT-EN`, `LEGAL-PRIVACY-ES/EN`, `LEGAL-TERMS-ES/EN`, textos de Arianna Lupi, stack de Juan Tech (Cloudinary y Resend), Neon en aprendoclub y Apturio, cita real de Patricia Ibarra, renombrar AprendoSEO, título original del post "Topic clusters SEO", recaptura de imágenes. Pasar lo ya aceptado en bloque a `aprobado` en un commit.
3. **Migración y siembra sombra (56-12).** Con túnel en terminal A, `DATABASE_URI` sacada en vivo por ssh, `04-which-database.ts`, y la frase literal "apruebo recortar etapas de about-page de 5 a 4" para el paso destructivo `[CITED: memoria project_fase_56_estado_y_pendientes]`.
4. **Simulacro del cargador (56-14, tarea 4).** Dry-run contra la base y pegar la salida en el handoff.
5. **Excepciones D-04 por escrito.** Si F1, F2 o F3 no se corrigen, aceptar la excepción con nombre.
6. **Revisión humana de accesibilidad y diseño.** NVDA, VoiceOver, 375, 900, 1024 y 1280 px, zoom 200%, y la lista derivada de `A11Y.md`.
7. **Revalidación admin a preview.** Publicar un cambio en un Website, un Author y un SpeakingEvent desde el admin de producción y comprobar el preview sin esperar.
8. **Decisiones pequeñas.** Borrar o commitear los dos `scripts/_tmp-*`, tolerancia de rendimiento (10%), si el admin conserva la pista de tema.
9. **Respaldo verificado (D-10).** `pg_dump -Fc` de `juantech` a un archivo fuera del repo y `pg_restore --list`, más el JSON de `28-phase56-cutover-load.ts --print-current`.
10. **Fecha legal del día del corte.** Fijar `LEGAL_EFFECTIVE_DATE` en `scripts/db/data/56-legal-copy.ts` y commit.
11. **Confirmación escrita del merge (GO-02, D-11).** Frase explícita de Juan en el chat; sin ella no hay merge.
12. **Cargador `--apply` (D-09).** Túnel, pre-flight, `04-which-database.ts`, dry-run, `--apply --db-checked --only ...`, y las dos cargas destructivas solo con su frase literal.
13. **Prueba real del formulario (D-08).** Una sola, contra producción, a `hello@juan-tech.com`.
14. **Search Console.** Reenviar el sitemap y abrir el monitoreo de 404 e indexación.
15. **Cierre del túnel.** Ctrl-C en la terminal A y `unset DATABASE_URI PAYLOAD_SECRET NEXT_PUBLIC_SERVER_URL`.

Propuesta de estructura de planes (el planner decide): (1) push, espera del preview y línea base; (2) tres scripts de gate y reporte; (3) correcciones de F1, F2, F3 y F13; (4) limpieza D-05; (5) checkpoint de decisiones y migración sombra; (6) retiro de Tailwind (D-06); (7) reporte final y checkpoint de merge; (8) corte, validación live, monitoreo y rollback documentado.

## Fuentes

### Primarias (HIGH)
- Lectura directa de `57-CONTEXT.md`, `56-CUTOVER-HANDOFF.md`, `54-deferred-items.md`, `55-deferred-items.md`, `aprobaciones-juan.md`, `founder/kit-confianza/muestra-auditoria-juan-tech.md`, `next.config.mjs`, `package.json`, `scripts/verify/53-crawl-parity.mjs`, `53-layer-check.mjs`, `55-seo-parity.mjs` (encabezado), `56-run-all.mjs` (encabezado), `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx`, `src/components/pages/ServiceDetailPage.tsx`, `node_modules/@payloadcms/next/dist/withPayload/withPayload.js`.
- `curl` público de solo lectura contra `dev.juan-tech.com` y `juan-tech.com` el 2026-11-10 (cabeceras, tamaños, TTFB, head, hreflang, JSON-LD, 169 URLs para el barrido de clases).

### Secundarias (MEDIUM)
- Memorias del proyecto: deploy Dokploy, acceso a base, disco del VPS, token y llave SSH, estado de la fase 56.
- Skill `dokploy-deploy` para los nombres de endpoints de la API.

### Terciarias (LOW)
- Patrones de inyección de axe, proxy de INP y rollback por imagen de Dokploy, sin verificar con documentación en esta sesión (A5, A6, A8).

## Metadatos

**Desglose de confianza:**
- Pila estándar: ALTA, todo está instalado y se leyó su versión.
- Arquitectura y estado de F1 a F5: ALTA para el diagnóstico, MEDIA para las soluciones propuestas.
- Pitfalls: ALTA, salen de código y de incidentes documentados.
- Rollback y Dokploy: MEDIA, endpoints de la skill y la memoria, sin llamadas a la API en esta sesión.

**Fecha de investigación:** 2026-11-10
**Válido hasta:** 2026-11-24 para cifras de rendimiento y cabeceras (el preview cambia con cada push); 30 días para el resto.
