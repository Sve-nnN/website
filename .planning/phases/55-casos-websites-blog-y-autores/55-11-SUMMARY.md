---
phase: 55-casos-websites-blog-y-autores
plan: 11
subsystem: ui
tags: [blog, post, toc, reading-progress, affiliate-disclosure, offers, related, author, mui, json-ld, tracer, live-battery]
requires:
  - phase: 55-05
    provides: MuiRichText con headingIds y ctx, h1 del cuerpo como nivel 2 y ids reservados
  - phase: 55-07
    provides: bloques del cuerpo en MUI (codigo, tabla, FAQ, afiliado inline, captura de email), ScrollRegion y PostCard
  - phase: 55-10
    provides: getCachedBlogPostList (lista ligera cacheada), BlogClosingMui, toClosingProps y el ciclo push, despliegue y bateria en vivo
provides:
  - toPostViewProps, buildArticleJsonLd (extraido sin cambios), pickPrevNext, pickRelated, categoryItems, toInlineOffer y toRailOffer en blog-data.ts
  - PostView (Server Component) con PostByline, PostAuthorAside, PostPrevNext, PostRelated, InlineOfferMui y RailOfferMui
  - ReadingProgress compartido con role progressbar, cinco atributos aria y useMotion
  - Toc con modo embebido y ids fijos del post reservados en lexical-toc
  - namespace post en ES y EN y 55-post-ssr.ts (fixtures inventados y defectuosos)
affects: [55-12, 55-13]
tech-stack:
  added: []
  patterns:
    - "El post es un Server Component que compone MuiRichText (servidor) con hojas cliente de props serializables; el mapa de ids se calcula UNA vez en la ruta sobre el contenido completo y viaja a las dos mitades del cuerpo"
    - "Relacionados y anterior o siguiente salen de la misma lista ligera cacheada que el indice (overrideAccess false), sin lectura nueva en cache.ts"
    - "Las funciones de datos de blog-data.ts siguen puras: lo que viene del servidor (SITE_URL, personRef, websiteRef) entra por argumento para que las vistas cliente puedan seguir importando el modulo"
key-files:
  created:
    - src/components/pages/blog/PostView.tsx
    - src/components/pages/blog/PostByline.tsx
    - src/components/pages/blog/PostAuthorAside.tsx
    - src/components/pages/blog/PostPrevNext.tsx
    - src/components/pages/blog/PostRelated.tsx
    - src/components/pages/blog/InlineOfferMui.tsx
    - src/components/pages/blog/RailOfferMui.tsx
    - src/components/mui/ReadingProgress.tsx
    - scripts/verify/55-post-ssr.ts
  modified:
    - src/lib/blog-data.ts
    - src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx
    - src/components/mui/rich-text/Toc.tsx
    - src/components/mui/rich-text/lexical-toc.ts
    - src/components/mui/rich-text/MuiRichText.tsx
    - messages/es.json
    - messages/en.json
    - scripts/verify/55-content-parity.mjs
key-decisions:
  - "No se toco cache.ts: relacionados y vecinos se derivan de getCachedBlogPostList, ya leida con overrideAccess false y select, asi que ningun borrador entra (T-55-42) y el post no suma una consulta"
  - "buildArticleJsonLd vive en blog-data.ts con SITE_URL, personRef, sitePersonSlug y websiteRef por argumento (sitemap-data y person importan payload y blog-data lo importan vistas cliente); el BreadcrumbList sigue saliendo de buildBlogTrail y buildBreadcrumbJsonLd, que ya eran funciones"
  - "La divulgacion de afiliados se calcula en la ruta con postHasAffiliateInline y postHasAmazonAffiliateInline sobre doc.content entero y se pinta antes del cuerpo y de la columna del indice"
  - "El indice (Toc) solo se pinta con al menos dos encabezados y al menos uno de nivel 2 (un h1 del cuerpo cuenta como h2); el sticky y el scroll los pone la columna que comparte el indice y la tarjeta de riel (Toc recibe embedded)"
  - "Las preguntas de FAQ cuentan como h3 en 55-content-parity: produccion las pinta como h4 y 55-07 las dejo en h3 para no saltar de h2 a h4"
requirements-completed: []
duration: 95min
completed: 2026-11-10
status: complete
commits: 5
plan_head_before: 8550c1b49ec2685784d5209d6a717cd12b2b2f41
actuals:
  tokens: 22700
  tasks: 3
  commits: 5
---

# Phase 55 Plan 11: Post en MUI con TOC, progreso de lectura, ofertas, autoria, relacionados y navegacion Summary

Los 58 posts en ES y EN responden desde MUI con su cuerpo completo, un unico mapa de ids compartido por las dos mitades del cuerpo y por el indice, barra de progreso con role progressbar, divulgacion de afiliados antes del cuerpo, ofertas MUI, autoria, relacionados, anterior y siguiente y un solo cierre, con el SEO de la ruta intacto, desplegado y verificado en vivo en dev.juan-tech.com.

## Que quedo hecho

- **Tarea 1 (tracer), commit 5ffda0b:** `toPostViewProps` (cabecera, autor, categorias, tiempo de lectura sobre el cuerpo completo, `headings` con h1 como nivel 2, aviso de traduccion) y `buildArticleJsonLd` extraido de la ruta sin cambiar un campo. `PostView` de servidor con las dos mitades de `MuiRichText` compartiendo `headingIds`, `PostByline` cliente y el indice. La ruta conserva `force-dynamic`, la redireccion 308 a la categoria primaria, `generateMetadata` (canonical de la categoria primaria, `omitEn`, robots noindex y follow para los 17 EN incompletos) y los dos JSON-LD. `Toc` recibe `embedded` (sin sticky propio) y `lexical-toc` reserva los ids fijos `post-*`.
- **Tarea 2, commit 1353caa:** `ReadingProgress` (`role="progressbar"`, aria-label, min 0, max 100 y `aria-valuenow` entero, requestAnimationFrame, `useMotion` y `prefers-reduced-motion` sin transicion, `transform` en vez de ancho), divulgacion de afiliados (`role="note"` con el texto del namespace `affiliateDisclosure`) antes del cuerpo, `InlineOfferMui` entre las mitades y `RailOfferMui` en la columna del indice desde `lg`, alimentadas con blog-promo.
- **Tarea 3, commit fdca33d:** `pickPrevNext`, `pickRelated` y `categoryItems`, `PostAuthorAside` (E-E-A-T con enlace al perfil), `PostRelated` con PostCard (h3), `PostPrevNext` en una `nav` etiquetada y `BlogClosingMui` como unico cierre.
- **Correcciones en vivo, commits 79a913f y 7a7a133:** ver Deviations.

## Resultados de verificacion

| Comprobacion | Resultado |
|---|---|
| `npx tsc --noEmit` (tras cada tarea y cada correccion) | PASS |
| `55-post-ssr.ts` | PASS: fixtures inventados para cabecera, ids, TOC, progreso, afiliados, ofertas, relacionados, vecinos, autoria, cierre, captura de email y enlaces del sitio, mas 20 fixtures defectuosos que fallan |
| `55-richtext-ssr`, `55-richtext-blocks-ssr`, `54-richtext-toc`, `54-legal-ssr` | PASS (sin regresion del motor) |
| `55-messages-parity`, `54-rsc-boundary`, `53-write-gates`, `55-no-sandbox-data` | PASS |
| `55-run-all --selftests` | PASS |
| `npm run build` con variables falsas (antes de cada push) | PASS, exit 0 |
| Precondicion de esquema (`git diff origin/feat/mui-redesign -- src/migrations src/collections src/globals`) | vacia en los dos push |

### Verificacion en vivo en https://dev.juan-tech.com

Despliegues: `gj5MlRV82odqIa44-Jn_6` (fdca33d, done 06:35:24 UTC, 6 min) y `JWqyPZNRUMhrOspX2sXQV` (7a7a133, done 07:00:37 UTC, 5,8 min). Los dos terminaron en `done` sin cancelarse; no hizo falta `application.redeploy`.

| Superficie | Resultado |
|---|---|
| `55-post-contract --preview-only` (58 posts en ES y EN, progressbar, TOC, ids unicos, anclas, noindex del preview, 4 redirecciones 308) | 119 PASS y 1 FAIL esperado: `/en/blog/cs-fundamentals/recursividad`, 3 anclas sin destino (ver Para la revision de Juan). Antes de 55-11: 4 PASS y 231 FAIL |
| `55-content-parity` (58 x 2) | 117 PASS tras la correccion de FAQ (antes 107 PASS y 9 FAIL por las preguntas de FAQ) |
| `55-seo-parity` | 163 PASS, 0 FAIL (title, description, canonical, hreflang, Open Graph y JSON-LD iguales a produccion, incluido el Article) |
| `55-page-contract --require-home-sections` | 49 PASS, 0 FAIL |
| `55-tracer-live`, `55-blog-search` | 2 PASS y 35 PASS |
| `53-crawl-parity` (169 URLs), `53-write-gates` | PASS |
| Regresion de la 54 (page-contract, notfound, dual-urls, crawl-parity, search, stack-affiliate, contact-form, faq-ssr, about, shell-contract, computed-styles, write-gates) | PASS |
| Desborde a 320, 375 y 768 px en 42 rutas de post (ES y EN: los mas largos, tablas anchas, bloques de codigo anchos, el de afiliado, el de captura, los de h1 en el cuerpo y el que no tiene h2) | PASS en 126 cargas tras la correccion; antes, `/blog/development/que-es-css` y su EN desbordaban a 403 px |
| Afiliado en vivo (`guia-keyword-research`, ES y EN) | divulgacion antes del primer enlace `/go/`, `rel="sponsored nofollow noopener"`, un h1, una barra de progreso |
| Captura en vivo (`technical-seo-checklist`, ES y EN) | campos `email` y `company_website` y oculto `postPath` con la ruta del post |
| Logs del preview (`application.readLogs`, solo lectura, dos lecturas: tras el despliegue y tras la bateria) | 0 apariciones de permission denied, does not exist, 500 ni errores |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Texto largo sin espacios ensanchaba el post a 403 px**
- **Found during:** verificacion en vivo (desborde a 320 y 375 px)
- **Issue:** `/blog/development/que-es-css` trae un parrafo y una lista con URLs pegadas como texto markdown ("[MDN Web Docs](https://develop..."). Sin espacios no hay donde partir la linea y el articulo se salia del ancho.
- **Fix:** `overflowWrap: 'break-word'` en la raiz de `MuiRichText` (parte solo cuando no cabe y no cambia el ancho minimo de las tablas, que siguen desplazandose en ScrollRegion). La inyeccion previa del mismo estilo en la pagina viva dio 320 y 375 de scrollWidth. `55-post-ssr` audita la fuente y trae un fixture defectuoso.
- **Files modified:** src/components/mui/rich-text/MuiRichText.tsx, scripts/verify/55-post-ssr.ts
- **Commit:** 79a913f

**2. [Rule 1 - Bug] 55-content-parity esperaba h3 como produccion y 55-07 mueve las preguntas de FAQ a h3**
- **Found during:** verificacion en vivo (9 posts ES con FAQ: 25 h3 contra 20 de produccion, etc.)
- **Issue:** produccion pinta cada pregunta de FAQ como h4 (salto de h2 a h4); 55-07 las dejo como h3 para respetar la jerarquia (A11Y.md). Al pasar los posts a MUI, la expectativa vieja marcaba como defecto la mejora.
- **Fix:** el script espera `h3 de produccion + preguntas de FAQ del post` y el selftest modela produccion con h4 y el preview con h3. No relaja la prueba: sigue fallando con un h3 de mas o de menos (selftest `h3 de mas`).
- **Files modified:** scripts/verify/55-content-parity.mjs
- **Commit:** 7a7a133

### Decisiones y diferencias dentro del margen del plan

- **Sin cambios en `cache.ts`.** El plan permitia agregar una lectura de relacionados; no hizo falta porque la lista ligera de 55-10 ya los trae con `overrideAccess: false`.
- **`buildArticleJsonLd` recibe `refs`** (SITE_URL, personRef, sitePersonSlug, websiteRef) en vez de importarlos: blog-data.ts lo importan vistas cliente y los modulos de origen traen `payload`. `buildBreadcrumbJsonLd` y `buildBlogTrail` ya estaban extraidos y se reutilizan.
- **`Toc` gana la prop `embedded`** y `lexical-toc` reserva `post-body`, `post-disclosure`, `post-author-t`, `post-related-t` y `post-nav-t`. Privacy y Terms no cambian (prueba `54-legal-ssr` en PASS).
- **El indice solo se pinta con al menos un h2** (un h1 del cuerpo cuenta como h2), como pide el plan; un cuerpo solo con h3 no lo pinta.
- **Archivos extra** fuera de la lista del plan: PostByline, PostAuthorAside, PostPrevNext, PostRelated, Toc.tsx, lexical-toc.ts, MuiRichText.tsx y 55-content-parity.mjs.
- **Imagen de portada:** el post no pinta la imagen de respaldo por slug que la cabecera vieja usaba de fondo (ningun post tiene portada real). Se sigue enviando al JSON-LD y a Open Graph; es una decision visual para Juan.
- **Push:** los dos push llevaron tambien los dos commits `docs` previos de otro proceso (`3c373c2`, `8550c1b`); solo tocan `.planning` y `research`.
- **Conteo de commits:** 5 medidos con el ledger y los 5 son propios.

## Authentication gates

Ninguno.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-55-39 (regresion de SEO): `55-seo-parity` 163 PASS con el Article y el BreadcrumbList iguales a produccion y la prueba SSR compara `buildArticleJsonLd` campo por campo. T-55-40 (divulgacion tardia): exigida por la prueba SSR (orden en el DOM con el bloque en la segunda mitad) y comprobada en vivo en ES y EN. T-55-41 (escritura desde el preview): la captura sigue en `?subscribed=pending` bajo `isPreviewReadonly()` y `53-write-gates` queda en PASS. T-55-42 (borrador en relacionados): la lista ligera se lee con `overrideAccess: false`.

## Para la revision de Juan

1. **Mirar en el preview** un post largo en escritorio (`/blog/seo/guia-keyword-research`): indice a la derecha que se fija y sigue el scroll, barra de progreso naranja arriba, nota de afiliado antes del cuerpo (este post tiene el bloque de DinoRANK), autoria, relacionados y cierre. En movil, el indice es un acordeon.
2. **Tarjeta de oferta del riel:** va debajo del indice dentro de la misma columna fija. En posts con un indice largo (por ejemplo la guia de keyword research) queda al final de esa columna y solo se ve al desplazarla; en indices cortos se ve completa. Dime si la prefieres en otro lugar.
3. **`/en/blog/cs-fundamentals/recursividad`** conserva 3 de los 7 enlaces de ancla del cuerpo sin destino (`#common-recursion-algorithms`, `#best-practices-for-writing-recursive-functions`, `#conclusion`). Los otros 4 ya resuelven porque los encabezados ahora llevan id. Esas tres secciones no existen en la traduccion al ingles (el post esta en `EN_TRANSLATION_INCOMPLETE`, 22 por ciento del espanol): es contenido, no codigo, y se cierra traduciendo el articulo. Hasta entonces `55-post-contract --preview-only` seguira dando ese unico FAIL; para el plan 55-13 conviene decidir si se tolera por lista o se traduce.
4. **Aviso de traduccion en los 17 EN incompletos:** usa el texto existente ("Esta pagina todavia no esta disponible en ingles. Estas viendo el contenido en espanol"). Es exacto para los 7 que sirven el espanol entero, pero 10 de los 17 estan traducidos a medias. No se agrego `lang="es"` al cuerpo por la misma razon: la lista no distingue unos de otros.
5. **Cadenas nuevas del namespace `post`** (EN pendiente de tu aprobacion): "Tabla de contenidos", "Progreso de lectura", "Informacion destacada", "Sobre el autor", "Credenciales", "Ver el perfil de {name}", "{years}+ anos de experiencia", "Articulos relacionados", "Entrada anterior y siguiente", "Anterior", "Siguiente", "Categorias del articulo" y "{minutes} min de lectura".
6. **Contenido de produccion con defectos que el rediseño no corrige:** el titulo de `/blog/cs-fundamentals/complejidad-algoritmica` termina en "rendim..." en Payload (igual en produccion); `que-es-css` trae URLs como texto markdown (ahora no desbordan); el namespace `emailCapture` (oferta del checklist) conserva guiones largos de antes de la fase (copy de la fase 56).
7. **Enlaces absolutos a juan-tech.com dentro del cuerpo** salen en la misma pestana y llevan a produccion, no al preview (decision de 55-05, pregunta abierta 3).
8. **Lector de pantalla y teclado:** conviene escuchar el post con NVDA o VoiceOver (nota de afiliado, indice, `progressbar`, autoria, anterior y siguiente) y recorrer con Tab la columna del indice cuando es mas alta que la pantalla (es una region con scroll que contiene enlaces).

## Self-Check: PASSED

Archivos creados (PostView, PostByline, PostAuthorAside, PostPrevNext, PostRelated, InlineOfferMui, RailOfferMui, ReadingProgress, 55-post-ssr.ts) existen; commits 5ffda0b, 1353caa, fdca33d, 79a913f y 7a7a133 presentes en `git log` y empujados a `origin/feat/mui-redesign`; los dos despliegues en `done` y verificados en vivo.
