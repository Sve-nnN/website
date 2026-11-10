---
phase: 55-casos-websites-blog-y-autores
plan: 10
subsystem: ui
tags: [blog, category, search, newsletter, mui, payload, unstable_cache, a11y, tracer, live-battery]
requires:
  - phase: 55-07
    provides: PostCard compartida, ScrollRegion y MuiRichText con bloques MUI
  - phase: 55-09
    provides: patron de lectura cacheada con overrideAccess false, ruta que conserva su SEO y arnes SSR por superficie
  - phase: 55-01
    provides: nota de filename en el populate de media y ciclo push, despliegue y verificacion en vivo
provides:
  - getCachedBlogPostList(locale) con overrideAccess false, select, populate con filename y tags posts y categories
  - blog-data.ts con toPostItem, toCategoryProps, listableCategories, toNavItems, toBlogIndexProps, toClosingProps, parseNewsletterNotice, normalizeQuery y filterPosts (puras, importables desde el cliente)
  - CategoryNav, CategoryPageView, BlogIndexView, BlogSearch, BlogNewsletter y BlogClosingMui
  - namespace blog (nav, category, index, newsletter, closing, search) en ES y EN
  - 55-blog-ssr.ts (indice, categoria, newsletter, cierre y busqueda sin consulta) y 55-blog-search.mjs (navegador, con --selftest)
affects: [55-11, 55-12, 55-13]
tech-stack:
  added: []
  patterns:
    - "Una sola lectura ligera cacheada por idioma (58 posts) sirve al indice, a las cinco categorias y a la busqueda; la ruta deja propagar el error (500) en vez de servir una lista vacia"
    - "Isla de busqueda que recibe las secciones del servidor como children: sin consulta renderiza solo el arbol del servidor con la region de estado vacia; con consulta lo cambia por los resultados"
    - "Formulario que funciona sin JavaScript: form role search con action a /search y method get; con JavaScript solo se evita el envio"
key-files:
  created:
    - src/lib/blog-data.ts
    - src/components/pages/blog/CategoryNav.tsx
    - src/components/pages/blog/CategoryPageView.tsx
    - src/components/pages/blog/BlogIndexView.tsx
    - src/components/pages/blog/BlogSearch.tsx
    - src/components/pages/blog/BlogNewsletter.tsx
    - src/components/pages/blog/BlogClosingMui.tsx
    - scripts/verify/55-blog-ssr.ts
    - scripts/verify/55-blog-search.mjs
  modified:
    - src/lib/cache.ts
    - src/components/mui/PostCard.tsx
    - src/components/mui/CaseMetricCard.tsx
    - src/app/(frontend)/[locale]/blog/page.tsx
    - src/app/(frontend)/[locale]/blog/[category]/page.tsx
    - messages/es.json
    - messages/en.json
    - scripts/verify/55-home-fallback-ssr.ts
key-decisions:
  - "La entrada destacada no se repite en la fila de su categoria y 'Ver mas' aparece solo si quedan entradas fuera de las seis mostradas (sin contar la destacada), asi ningun enlace lleva a una pagina que no agrega nada"
  - "Una sola lista ligera para todo el blog; la categoria filtra por slug de categoria y general queda con lista vacia y 200"
  - "El cierre es una sola banda MUI alimentada con blog-promo (con la version de la categoria en las paginas de categoria); sin CtaSection generico"
  - "El campo de busqueda va justo bajo el hero y la navegacion de categorias, dentro de la isla; los resultados reemplazan a las secciones solo en el cliente"
  - "?category= de la URL vieja deja de leerse: las categorias son paginas y la fila del indice nunca lo uso; el destacado se muestra siempre"
requirements-completed: []
duration: 80min
completed: 2026-11-10
status: complete
commits: 5
plan_head_before: 37c62f74d2d00312435edce6c2bd5dc75da0c151
actuals:
  tokens: 25000
  tasks: 3
  commits: 4
---

# Phase 55 Plan 10: Indice del blog con busqueda, ver mas por categoria y paginas de categoria en MUI Summary

Indice del blog y paginas de categoria en MUI desde Payload, con todas las entradas de cada categoria en el HTML del servidor, seis por categoria con un "Ver mas" real en el indice, busqueda cliente con anuncio de resultados que sin JavaScript llega a /search, newsletter inerte en el preview y un solo cierre, verificados en vivo en dev.juan-tech.com junto con el trabajo de 55-07 a 55-09 que aun no se habia visto desplegado.

## Que quedo hecho

- **Tarea 1 (tracer), commit 4207086:** `getCachedBlogPostList` (clave `['blog-post-list', locale]`, tags `posts` y `categories`, `overrideAccess: false`, `select` sin `content`, `populate` de categoria y de media con `filename`, `limit: 0`, `pagination: false`). `toCategoryProps` lista TODAS las entradas de la categoria; `toNavItems` y `listableCategories` excluyen `general`. `CategoryNav` (enlaces reales, `aria-current`, 40 px), `CategoryPageView` (sin `useState` ni `slice`, estado vacio para `general`) y `BlogClosingMui`. La ruta conserva `legacyPostRedirectPath` con `permanentRedirect`, `generateMetadata`, `revalidate = 60` y el JSON-LD de migas; solo cambia el cuerpo.
- **Tarea 2, commit 0b80bc7:** `toBlogIndexProps` (h1 y subtitulo del bloque hero del documento Pages blog, orden de `categoryOrder`, seis por categoria, textos del bloque newsletter). `BlogIndexView` (destacada, secciones con `h2`, "Ver mas" con `linkFor`), `BlogNewsletter` (misma accion `subscribeAction`, campos `email`, `locale`, `source` y honeypot `company_website`, avisos de `?newsletter=` con `role="status"` o `role="alert"`) y cierre unico. La ruta conserva `force-dynamic`. `PostCard` acepta `featured` para poner la portada al lado desde `md`.
- **Tarea 3, commit c01864c:** `normalizeQuery` y `filterPosts` puras (cada palabra en titulo o resumen, sin tildes). `BlogSearch`: `form role="search"` con `action` a `/search` (`/en/search` en ingles), `method="get"`, `name="q"`, etiqueta visible, Escape que vacia, region `role="status"` con `aria-live="polite"` y enlace a `/search?q=` cuando no hay coincidencias. `55-blog-search.mjs` con Playwright y `--selftest`.
- **Correccion, commit 6227e0c:** la tarjeta de caso de la home se salia a 443 px a 320 px (ver Deviations).

## Resultados de verificacion

| Comprobacion | Resultado |
|---|---|
| `npx tsc --noEmit` (tras cada tarea) | PASS |
| `55-blog-ssr.ts` | PASS, 102 comprobaciones sobre fixtures inventados (20 entradas, general vacio, seis por categoria, ver mas, h1 del documento, newsletter, un cierre, busqueda sin consulta y 19 fixtures defectuosos que fallan) |
| `55-blog-search.mjs --selftest` | PASS |
| `55-messages-parity.mjs`, `54-rsc-boundary.mjs`, `53-write-gates.mjs`, `55-no-sandbox-data.mjs` | PASS |
| `55-run-all.mjs --selftests` | PASS (completo) |
| `npm run build` con variables falsas (antes de cada push) | PASS, exit 0 |
| Precondicion de esquema (`git diff origin/feat/mui-redesign -- src/migrations src/collections src/globals`) | vacia en los dos push |

### Verificacion en vivo en https://dev.juan-tech.com

Despliegues: `_BMeD5pz3E13Ni2HYsb4Y` (c01864c, done 05:18:56 UTC, 6,8 min). El segundo, `pv9GG22k-4TtKAY4DUUca` (6227e0c), quedo en `cancelled` por una interrupcion de la API de Dokploy, y se relanzo con `application.redeploy` sobre la app del preview: `KTm_rxAYHYo3YH1N5XkNI`, done 05:54:16 UTC, con 6227e0c.

| Superficie | Resultado |
|---|---|
| `55-blog-search.mjs` (ES y EN, 17 comprobaciones por idioma) | PASS: anuncio 22 (ES) y 21 (EN) igual a las tarjetas visibles, Escape y Backspace restauran, cero anuncia cero, sin JavaScript Enter llega a `/search?q=seo` y `/en/search?q=seo` |
| `/blog` y `/en/blog` | PASS: 200, un h1 ("Blog", del documento), 4 secciones con 6 tarjetas, Ver mas a las 4 categorias, sin enlace a general, form `role="search"` con action `/search` o `/en/search`, campos del newsletter, sin saltos de encabezado, 0 imagenes con src null |
| `/blog?newsletter=confirmed`, `unsubscribed`, `invalid` (ES y EN) | PASS: 200 con aviso |
| Categorias `tech-seo`, `seo`, `development`, `cs-fundamentals` (ES y EN) | PASS: 16, 11, 9 y 22 enlaces a posts en el HTML (coinciden con la API y el HTML de produccion), un h1, `aria-current` |
| `/blog/general` y `/en/blog/general` | PASS: 200 con estado vacio, cero enlaces a posts |
| Legado `/blog/algoritmos-estructuras-datos` | PASS: 308 a `/blog/cs-fundamentals/algoritmos-estructuras-datos` |
| `/websites/apturio-com` y `/en/websites/apturio-com` | PASS: 200, un h1, sin saltos, captura de Cloudinary, seccion de puntajes, sin marco de telefono |
| `/websites/juan-tech-com` y EN | PASS: 200, sin seccion de puntajes |
| Los seis detalles de sitio en ES y EN | PASS: 200, un h1, sin src null |
| `/case-studies` y `/en/case-studies` | PASS: 7 tarjetas en una lista, un h1 |
| Los siete detalles de caso en ES y EN | PASS: 200, un h1, sin saltos, sin seccion de lecciones (D-10) |
| `/` y `/en` | PASS: `id="casos"` con 3 tarjetas y `id="sitios"` con 5 |
| Desborde a 320, 375 y 768 px en 44 rutas (home, blog, categorias, casos, sitios, ES y EN) | PASS tras la correccion; antes, la home fallaba a 320 px |
| `55-run-all.mjs --live --no-wait` (batería final) | 21 pasos PASS, 1 FAIL esperado (abajo): 55-page-contract con `--require-home-sections` 49 PASS, 55-seo-parity 163 PASS, 55-tracer-live, 55-content-parity 117 PASS, 55-blog-search 35 PASS, 53-crawl-parity (169 URLs), 53-write-gates y la regresion completa de la 54 (54-page-contract, notfound, dual-urls, crawl-parity, search, stack-affiliate, contact-form, faq-ssr, about, shell-contract, computed-styles, write-gates) |
| Logs del preview (`application.readLogs`, solo lectura, dos lecturas) | 0 apariciones de permission denied, does not exist, 500 ni errores |

El unico FAIL de la bateria es `55-post-contract --preview-only` (4 PASS, 231 FAIL): 116 `falta role="progressbar"` y 113 `el cuerpo tiene h2 y falta la lista del TOC`, es decir, exactamente lo que construye 55-11 (el post sigue con la ruta vieja). Las cuatro redirecciones del contrato pasan y ningun post responde distinto de 200. Hay una comprobacion mas que 55-11 debe vigilar: `/en/blog/cs-fundamentals/recursividad` trae 7 enlaces de ancla del cuerpo sin destino (`#what-is-recursion`, `#the-mechanics-of-recursion`, `#types-of-recursion`, entre otros).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tarjeta de caso de la home desbordaba a 443 px con 320 px de ancho**
- **Found during:** verificacion en vivo (53-computed-styles en la regresion de la 54: `scrollWidth 443 supera innerWidth 320`). Aparecio al activar en el preview el respaldo D-26 de 55-08, que mostro por primera vez sectores reales.
- **Issue:** `CaseMetricCard` es un grid de una columna implicita y el `Chip` del sector ("Manufactura / Materiales de construccion artesanal") es `nowrap`; la tarjeta crecia con su contenido.
- **Fix:** columna `minmax(0,1fr)`, `minWidth: 0` en la tarjeta y rotulo del chip con `whiteSpace: normal`. La auditoria de fuente de `55-home-fallback-ssr.ts` falla si alguien lo quita (con dos fixtures defectuosos).
- **Files modified:** src/components/mui/CaseMetricCard.tsx, scripts/verify/55-home-fallback-ssr.ts
- **Commit:** 6227e0c

### Decisiones y diferencias dentro del margen del plan

- **No se partio la tarea 3.** Las 14 archivos del plan entraron en 3 commits mas la correccion. Archivos fuera de la lista del plan: `PostCard.tsx` (prop `featured`), `CaseMetricCard.tsx` y `55-home-fallback-ssr.ts` (correccion).
- **`BlogClosingMui` se creo en la tarea 1**, no en la 2, para que la pagina de categoria no pierda su cierre en el commit del tracer.
- **`toCategoryProps` recibe tambien las categorias** (4 argumentos) para armar la navegacion en la misma llamada.
- **Sin `CategoryBridge` aparte.** La navegacion de categorias (con "Todas") queda arriba y el estado vacio de `general` ofrece "Ver todo el blog"; el puente inferior habria repetido los mismos enlaces.
- **Redespliegue manual.** El segundo despliegue automatico quedo `cancelled` (la API de Dokploy dio un error de red); se relanzo con `application.redeploy` solo en la app del preview, sin un tercer push.
- **Conteo de commits:** 4 propios (3 de tareas y 1 de correccion). El rango medido da 5 porque otro proceso agrego `3c373c2 docs(56)` en el mismo checkout; ese commit no se empujo.
- **Sin secciones del sandbox sin equivalente en Payload** (eyebrows y leads): "Lo mas reciente" y el conteo por categoria son etiquetas de interfaz en `messages` (D-28).

## Authentication gates

Ninguno.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-55-35 (XSS por la consulta): la consulta solo es texto, React la escapa y el enlace de salida usa `encodeURIComponent`; el fixture con `<script>` no filtra nada. T-55-36 (borrador en la lista): `overrideAccess: false` y `select` dentro de `getCachedBlogPostList`. T-55-37 (recorte de enlaces): la categoria tiene todas las entradas (16, 11, 9 y 22 en vivo) y la prueba falla con un listado de 9. T-55-38 (alta desde el preview): misma accion `subscribeAction` con `PREVIEW_READONLY`; `53-write-gates` sigue en OK.

## Para la revision de Juan

1. **Mirar en el preview:** `/blog` (entrada destacada con la portada al lado, cuatro secciones de seis, franja de newsletter y cierre oscuro), `/blog/development` y `/en/blog/cs-fundamentals` (lista completa), y la busqueda escribiendo "seo" y luego Escape. La posicion del campo de busqueda (bajo el hero y la navegacion, no dentro del hero) es una decision mia; dime si lo quieres dentro del hero como en el sandbox.
2. **Cadenas nuevas en ingles del namespace `blog`**, pendientes de tu aprobacion. En espanol: "Todas", "Categorias del blog", "Todavia no hay articulos en esta categoria", "Ver todo el blog", "Lo mas reciente", "Ver mas", "Buscar articulos", "Buscar", "Resultados de la busqueda", "No hay articulos que coincidan con tu busqueda", "Buscar en todo el sitio", "Puntos clave" y los avisos del newsletter (los mismos textos del bloque anterior).
3. **Lector de pantalla:** conviene escuchar el anuncio "N resultados" de la busqueda con NVDA y Firefox o VoiceOver y Safari (la region es `aria-live="polite"`).
4. **El destacado ya no se repite en su categoria** y "Ver mas" solo aparece cuando hay mas de seis entradas fuera del destacado; hoy las cuatro categorias lo muestran.
5. **`/blog?category=` ya no hace nada.** Ningun enlace del sitio lo usa y la fila del indice nunca lo leia.
6. **Para 55-11:** el contrato de post sigue en FAIL por TOC y barra de progreso (es su alcance) y hay 7 anclas rotas en el cuerpo de `/en/blog/cs-fundamentals/recursividad`.
7. **Avisos de la bateria (87 lineas WARN en 55-page-contract):** son encabezados de contenido de Payload con punto o coma ("Dr. Manuel A. Vargas Hidalgo", "Renderizado hibrido con Next.js"); no son defectos de esta fase.

## Self-Check: PASSED

Archivos creados verificados (blog-data.ts, CategoryNav, CategoryPageView, BlogIndexView, BlogSearch, BlogNewsletter, BlogClosingMui, 55-blog-ssr.ts, 55-blog-search.mjs) y commits 4207086, 0b80bc7, c01864c y 6227e0c presentes en `git log`; los dos ultimos desplegados y verificados en vivo.
