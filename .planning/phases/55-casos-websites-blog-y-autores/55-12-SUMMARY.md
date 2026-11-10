---
phase: 55-casos-websites-blog-y-autores
plan: 12
subsystem: ui
tags: [authors, profile, timeline, mui-lab, json-ld, person, speaking-events, cache, mui, tracer, live-battery]
requires:
  - phase: 55-07
    provides: PostCard compartida, ScrollRegion y bloques del cuerpo en MUI
  - phase: 55-09
    provides: CaseCard, toCaseIndexProps y getCachedCaseStudiesIndex
  - phase: 55-11
    provides: getCachedBlogPostList como patron del select y del populate de posts, toPostItems y el ciclo push, despliegue y bateria en vivo
provides:
  - getCachedAuthorsIndex, getCachedAuthorBySlug y getCachedAuthorPosts en cache.ts (overrideAccess false y select explicito) y getCachedSpeakingEvents exportada desde about-data.ts
  - authors-data.ts con toAuthorsIndexProps, toAuthorProfileProps, pickAuthorCases, safeExternalUrl y el JSON-LD Person extraido (buildAuthorPersonJsonLd y buildOtherAuthorPersonJsonLd)
  - AuthorsIndexView, AuthorProfileView y AuthorTimeline en src/components/pages/authors
  - namespace authors (index y profile) en ES y EN y 55-authors-ssr.ts (69 comprobaciones con fixtures inventados y defectuosos)
affects: [55-13]
tech-stack:
  added: []
  patterns:
    - "El perfil lee posts por getCachedAuthorPosts (limit 0, pagination false) y casos por getCachedCaseStudiesIndex filtrado por autor en una funcion pura (pickAuthorCases): sin lectura nueva de casos"
    - "El JSON-LD Person vive en authors-data.ts con la lectura del autor del sitio inyectable, asi la prueba fija el @id sin base de datos"
    - "Los enlaces externos del perfil pasan por safeExternalUrl (sanitizeHref y solo http o https): sin URL segura queda el nombre de la plataforma como texto"
key-files:
  created:
    - src/lib/authors-data.ts
    - src/components/pages/authors/AuthorsIndexView.tsx
    - src/components/pages/authors/AuthorProfileView.tsx
    - src/components/pages/authors/AuthorTimeline.tsx
    - scripts/verify/55-authors-ssr.ts
  modified:
    - src/lib/cache.ts
    - src/lib/about-data.ts
    - src/app/(frontend)/[locale]/authors/page.tsx
    - src/app/(frontend)/[locale]/authors/[slug]/page.tsx
    - messages/es.json
    - messages/en.json
key-decisions:
  - "getCachedCaseStudiesIndex gana author: true con populate de authors limitado al nombre, en vez de una lectura nueva de casos por autor (el plan pedia reutilizarla)"
  - "Una etapa sin ninguna fecha NO se marca en curso: la ausencia de datos no afirma un estado. En curso es fin futuro, o inicio sin fin"
  - "El logo de las instituciones de educacion no se pinta: la linea de tiempo no lo lleva en el contrato del plan y el titulo ya nombra la institucion"
  - "El enlace a Sobre mi solo aparece en el perfil del autor del sitio (D-25: paginas separadas); el enlace al stack (STACK-05) aparece en todos"
  - "Las ponencias van en lang es en EN, igual que en Sobre mi (speaking-events no se localiza)"
requirements-completed: []
duration: 85min
completed: 2026-11-10
status: complete
commits: 5
plan_head_before: 8093c47a531da3aecbb9af832b5ad817c628f817
actuals:
  tokens: 19500
  tasks: 3
  commits: 5
---

# Phase 55 Plan 12: Indice de autores y perfil de Juan en MUI desde Authors Summary

El indice de autores y el perfil de Juan salen de la coleccion Authors en MUI, con credenciales, expertise, experiencia y educacion en lineas de tiempo de @mui/lab, eventos de SpeakingEvents y los 58 posts y 7 casos del autor enlazados en el HTML del servidor, con el JSON-LD Person, el SEO y las rutas intactos.

## Que quedo hecho

- **Tarea 1 (tracer), commit 7658da5:** `getCachedAuthorsIndex`, `getCachedAuthorBySlug` y `getCachedAuthorPosts` (cache.ts), `authors-data.ts` completo (props del indice y del perfil, JSON-LD extraido), `AuthorsIndexView` (h2 por autor con enlace estirado por `linkFor`, avatar con alt y medidas de Media, extracto con line-clamp, estado vacio) y la ruta `/authors` con `revalidate 60`, `generateStaticParams` vacio, `generateMetadata` y migas JSON-LD sin cambios. Namespace `authors` en ES y EN y `55-authors-ssr.ts`.
- **Tarea 2, commit 3289287:** `AuthorTimeline` (Timeline de @mui/lab como `ul` con `role="list"`, fecha dentro del contenido, h3 por etapa, punto en curso con texto para lectores de pantalla ademas del color) y `AuthorProfileView` (PageHero con cargo como lead, bio, anos, enlaces sociales y enlaces internos; secciones de credenciales, expertise, experiencia, educacion y eventos; cada seccion vacia omite su encabezado).
- **Tarea 3, commit 47c8a14:** la ruta `[slug]` lee por la cache, lista TODOS los posts (`limit: 0`, `pagination: false`) y casos del autor, y conserva `revalidate 60`, `generateStaticParams` vacio, `generateMetadata`, `notFound` y el JSON-LD Person (desde `buildAuthorPersonJsonLd`). `55-authors-ssr.ts` exige 58 enlaces a posts y falla con el fixture de 50.
- **Correcciones en vivo, commits 0c83b49 y 5b79918:** ver Deviations.

## Resultados de verificacion

| Comprobacion | Resultado |
|---|---|
| `npx tsc --noEmit` (tras cada tarea y cada correccion) | PASS |
| `55-authors-ssr.ts` | PASS: 69 comprobaciones con fixtures inventados (indice, perfil, timeline, enlaces externos, 58 posts, secciones vacias, JSON-LD) y fixtures defectuosos que fallan (dos h1, enlace faltante, imagen sin alt, sin rel noopener, encabezado huerfano, timeline sin role, href javascript, 50 posts) |
| `55-messages-parity`, `54-rsc-boundary`, `55-no-sandbox-data`, `53-write-gates`, `55-run-all --selftests` | PASS |
| `npm run build` con variables falsas (antes de cada push y tras la ultima correccion) | PASS, exit 0 |
| Precondicion de esquema (`git diff origin/feat/mui-redesign -- src/migrations src/collections src/globals`) | vacia en los dos push; `package.json` y `package-lock.json` sin cambios |

### Verificacion en vivo en https://dev.juan-tech.com

Despliegues: `PBy0B4kaCdS34rlEky2JZ` (47c8a14, done 07:33 UTC) y `z4sduBrBh39rb3ySAgM5k` (0c83b49, done 07:55 UTC, 6 min). Los dos terminaron en `done` sin cancelarse; no hizo falta `application.redeploy`. El tercer cambio (5b79918) quedo **sin empujar** por la instruccion de empujar una sola vez mas.

| Superficie | Resultado |
|---|---|
| Indice `/authors` y `/en/authors` | 200, un h1, jerarquia h1 y h2 sin saltos, un enlace al perfil de Juan, imagen con alt, noindex del preview, title y canonical iguales a produccion |
| Perfil `/authors/juan-carlos-angulo` y `/en/...` | 200, un h1, jerarquia sin saltos, 58 enlaces distintos a posts y 7 a casos (produccion: 58 y 7), 2 timelines de @mui/lab como `ul` con `role="list"` (experiencia con 3 etapas y educacion con 2), secciones de expertise, eventos, articulos y casos |
| JSON-LD Person | un nodo con `@id` `https://juan-tech.com/#person`, igual en profundidad al de produccion en ES y EN; BreadcrumbList igual; title, description y hreflang iguales |
| `/authors` contra `/sobre-mi` | paginas separadas: 200 las dos, title distinto, el perfil enlaza a `/sobre-mi` (no se unifican); `/authors/no-existe-xyz` responde 404 |
| Enlaces externos del perfil | los 4 (LinkedIn, GitHub, el evento y su video) llevan `target="_blank"` y `rel="noopener"`; sin `javascript:` |
| `55-run-all --live --no-wait` | todo PASS salvo 1 FAIL esperado de `55-post-contract`: las 3 anclas de `/en/blog/cs-fundamentals/recursividad` (contenido, ya registrado en 55-11). `55-seo-parity` 163 PASS, `55-content-parity` 117 PASS, `55-blog-search` 35 PASS, `55-page-contract` 49 PASS, `55-tracer-live` PASS, `53-crawl-parity` PASS, `53-write-gates` PASS y los 12 pasos de regresion de la 54 PASS |
| Desborde a 320, 375 y 768 px (indice y perfil, ES y EN, 12 cargas) | PASS tras la correccion; antes, el perfil desbordaba a 358 px en 320 px |
| Logs del preview (`application.readLogs`, solo lectura, tras el ultimo despliegue y las pruebas de autores) | 0 apariciones de permission denied, does not exist, 500 ni errores. La lectura cubre el contenedor del segundo despliegue (los logs del primero se perdieron al reemplazarlo) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Una URL pegada en la descripcion de una etapa ensanchaba el perfil a 358 px en 320 px**
- **Found during:** verificacion en vivo (desborde a 320 px)
- **Issue:** la experiencia "Senior Tech SEO Analyst" trae "Mas info: https://www.aprendoclub.com/diplomado" pegado en `description`. Sin espacios no hay donde partir la linea y el `li` de la linea de tiempo se salia del ancho.
- **Fix:** `overflowWrap: 'anywhere'` en el contenido de la linea de tiempo, en las tarjetas de eventos y en los parrafos de la bio. `55-authors-ssr` audita el estilo con una URL larga y trae un fixture defectuoso.
- **Files modified:** AuthorTimeline.tsx, AuthorProfileView.tsx, 55-authors-ssr.ts
- **Commit:** 0c83b49 (empujado y verificado en vivo)

**2. [Rule 2 - Correccion de correctitud] Una etapa sin fechas se marcaba como en curso y los puntos de la linea de tiempo medían distinto**
- **Found during:** revision visual en vivo del perfil
- **Issue:** la primera experiencia de Juan llega sin fecha de inicio ni de fin y `isCurrent` la marcaba actual por la sola ausencia de fecha de fin (punto naranja y texto "En curso" para lectores de pantalla): se afirmaba un estado que el dato no trae. Ademas el punto en curso medía 2 px menos que los demas y el texto de esa etapa quedaba corrido 2 px.
- **Fix:** en curso es "fin futuro" o "inicio sin fin"; sin ninguna fecha no se marca. Los dos estados del punto llevan el mismo borde. `55-authors-ssr` cubre la etapa sin fechas.
- **Files modified:** authors-data.ts, AuthorTimeline.tsx, 55-authors-ssr.ts
- **Commit:** 5b79918 (**sin empujar**: la orden era una sola re-publicacion; viaja con el siguiente push y no cambia datos ni rutas)

### Decisiones y diferencias dentro del margen del plan

- **`getCachedCaseStudiesIndex` tocada:** gana `author: true` y `populate` de `authors` limitado al nombre para que el perfil filtre los casos del autor con `pickAuthorCases`. El plan pedia reutilizarla; no se agrego una lectura nueva.
- **`getCachedSpeakingEvents`:** se exporta (antes `getCachedAboutEvents`, privada) y su `select` suma `link` para el enlace "ver mas" de los eventos. Sobre mi no lo usa y no cambia.
- **Logo de educacion:** el contrato del plan no lo incluye y no se pinta (el viejo mostraba un icono de reserva). El `select` lo sigue trayendo poblado con los campos publicos de Media.
- **Hero del perfil:** el lead es el cargo y la bio va como parrafos debajo, no todo en el lead (`PageHero` solo acepta un parrafo de lead).
- **Cortes de commits:** la tarea 1 carga tambien las tres lecturas de cache del perfil, el modulo `authors-data.ts` completo y todo el namespace `authors`: estaban entrelazados con el indice y separar los archivos habria obligado a commits que no compilan por separado.
- **Conteo de commits:** 5 medidos con el ledger y los 5 son propios.

## Authentication gates

Ninguno.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-55-43 (`javascript:` en un enlace social): `safeExternalUrl` deja pasar solo http y https; la prueba cubre `javascript:`, `data:` y `mailto:` y en vivo los 4 enlaces externos llevan `rel="noopener"`. T-55-44 (select amplio): `select` explicito en las tres lecturas y el indice deja fuera credenciales, educacion, experiencia y enlaces. T-55-45 (regresion del Person): el builder se extrajo sin cambiar un campo y en vivo el nodo es igual en profundidad al de produccion en ES y EN.

## Para la revision de Juan

1. **Mirar en el preview** `/authors` y `/authors/juan-carlos-angulo` en escritorio y en movil: hero con foto, cargo, bio, enlaces sociales y los dos botones; lineas de tiempo de experiencia y educacion; eventos en banda oscura; los 58 articulos y los 7 casos.
2. **Primera experiencia sin fechas:** "Senior Tech SEO Analyst" en aprendoclub llega sin fecha de inicio ni de fin en Payload, asi que su punto sale neutro y sin linea de fecha. Los textos de esa linea de tiempo cambian en la fase 56 (aprendoclub de nov 2022 a hoy; Loops Growth desde 2024, en paralelo); con inicio y sin fin saldra "nov 2022 a hoy" y el punto naranja.
3. **Credenciales vacias:** el campo `credentials` de Juan esta vacio en Payload, asi que no hay seccion de credenciales (sin encabezado huerfano). Se llena desde el admin cuando Juan lo decida.
4. **Cadenas nuevas del namespace `authors`** (EN pendiente de tu aprobacion): "Lista de autores", "Ver el perfil", "Credenciales", "Areas de especializacion", "Experiencia", "Educacion y certificaciones", "Eventos donde he sido ponente", "Articulos", "Casos de exito", "En curso", "Mas sobre mi", "Ver mi stack de herramientas", "Perfiles de {name} en otras plataformas", entre otras.
5. **Enlace a una URL en texto plano:** la descripcion de aprendoclub trae "https://www.aprendoclub.com/diplomado" como texto, no como enlace. Ahora parte la linea sin desbordar; convertirla en enlace es una decision de contenido.
6. **Los titulos de posts con dos puntos** que `55-page-contract` marca como WARN en el perfil (por ejemplo "Next.js CMS: La Combinacion Ideal...") son titulos reales del blog y la regla de voz de encabezados no los reescribe aqui.
7. **Lector de pantalla y teclado:** conviene recorrer con Tab los 4 enlaces externos y las tarjetas del indice, y escuchar las dos lineas de tiempo con NVDA o VoiceOver.
8. **Commit 5b79918 sin empujar:** el siguiente push (plan 55-13) lo despliega; vale volver a mirar el perfil en vivo despues.

## Self-Check: PASSED

Archivos creados (authors-data.ts, AuthorsIndexView.tsx, AuthorProfileView.tsx, AuthorTimeline.tsx, 55-authors-ssr.ts) existen; commits 7658da5, 3289287, 47c8a14, 0c83b49 y 5b79918 presentes en `git log`; los cuatro primeros empujados a `origin/feat/mui-redesign`; los dos despliegues en `done` y verificados en vivo.
