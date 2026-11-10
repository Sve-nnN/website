---
phase: 55-casos-websites-blog-y-autores
plan: 09
subsystem: ui
tags: [case-studies, mui, payload, unstable_cache, comparison, before-after, lessons, a11y, tracer]
requires:
  - phase: 55-03
    provides: campo lessons de CaseStudies (array title y body localizados) y su migracion
  - phase: 55-06
    provides: migracion de lessons aplicada y verificada con los dos roles (el preview lee las tablas)
  - phase: 55-07
    provides: ScrollRegion, PostCard y MuiRichText con bloques MUI
  - phase: 55-08
    provides: patron de lectura cacheada con overrideAccess false, ruta que conserva su SEO y arnes SSR
provides:
  - getCachedCaseStudiesIndex y getCachedCaseStudyBySlug con overrideAccess false, select y populate con filename
  - case-study-data.ts con toCaseIndexProps, toCaseDetailProps, buildCaseComparison, parseMetricNumber, changeRatio, pickRelatedCases y buildCaseStudyJsonLd (extraido sin cambios)
  - BeforeAfter, CaseCard, CaseStudiesIndexView, CaseDetailView y CaseCompareTable
  - namespace cases (index y detail) en ES y EN
  - 55-cases-ssr.ts con 105 comprobaciones sobre fixtures inventados
affects: [55-10, 55-13]
tech-stack:
  added: []
  patterns:
    - "Un Server Component pasa el rich text ya renderizado (MuiRichText) como ReactNode a la vista cliente; la vista no importa componentes de servidor"
    - "Alternativa textual de un grafico: la parte visual completa va aria-hidden y una tabla con caption y scope, visualmente oculta, lleva los datos"
    - "Seccion condicional: la vista no emite encabezado cuando los datos son null, undefined o un arreglo vacio; la prueba busca encabezados huerfanos con una funcion y un fixture defectuoso"
key-files:
  created:
    - src/lib/case-study-data.ts
    - src/components/mui/BeforeAfter.tsx
    - src/components/pages/cases/CaseCard.tsx
    - src/components/pages/cases/CaseStudiesIndexView.tsx
    - src/components/pages/cases/CaseDetailView.tsx
    - src/components/pages/cases/CaseCompareTable.tsx
    - scripts/verify/55-cases-ssr.ts
  modified:
    - src/lib/cache.ts
    - src/app/(frontend)/[locale]/case-studies/page.tsx
    - src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx
    - messages/es.json
    - messages/en.json
key-decisions:
  - "Lecciones: la vista las renderiza solo si hay; ninguna del sandbox se copia ni siembra, y hasta la fase 56 el preview no muestra la seccion (D-10)"
  - "BeforeAfter oculta a la tecnologia asistiva toda la parte grafica y expone una sola tabla con caption y scope; las filas sin base numerica muestran sus valores sin barra ni porcentaje"
  - "Una comparacion con una sola fila (o sin indice por un fallo de lectura) no se renderiza: no hay con que comparar"
  - "El detalle sigue el orden de D-08 (KPIs, contexto, solucion, testimonio, resultados, comparativos, lecciones, conclusion) y no el del sandbox, que junta resultados con KPIs y el testimonio con la conclusion"
  - "Las etiquetas de metricas y KPIs salen verbatim de Payload (pregunta abierta 7 de RESEARCH)"
requirements-completed: []
duration: 55min
completed: 2026-11-10
status: complete
commits: 3
plan_head_before: c4b4647a678d4194c1bcce2dfb0a8dc03b99ff9c
actuals:
  tokens: 30000
  tasks: 3
  commits: 3
---

# Phase 55 Plan 09: Casos de exito en MUI con comparativos en el servidor y lecciones preparadas Summary

Indice y detalle de casos de exito en MUI desde Payload, con KPIs, contexto, solucion, testimonio, resultados antes y despues con tabla como alternativa textual, comparacion de clics organicos calculada en el servidor (ES y EN, 47,108, 533K y 1.25M, ranking por porcentaje y por valor absoluto), seccion de lecciones lista pero oculta hasta la fase 56 y SEO sin cambios.

## Que quedo hecho

- **Tarea 1 (tracer), commit 7bd3f7d:** `getCachedCaseStudiesIndex` (clave `['case-studies-index', locale]`, tag `CACHE_TAGS.caseStudies()`, `overrideAccess: false`, `sort: '-createdAt'`, `select` con `results` para la comparacion). `toCaseIndexProps` con `splitHeroMetric` y `formatSector`. `CaseCard` (cifra a 72 px, sector, subtitulo, enlace estirado con foco por `:has`) y `CaseStudiesIndexView` (una sola lista, el caso mas reciente a ancho completo, estado vacio). La ruta conserva `revalidate = 60`, `generateStaticParams` vacio, `generateMetadata` y el JSON-LD de migas tal cual. Tracer verificado de punta a punta con `HUMAN_VERIFY_MODE=end-of-phase` y verificacion automatica: se re-ejecuto y paso, se siguio con el detalle.
- **Tarea 2, commit 3f459b2:** `getCachedCaseStudyBySlug` (tags `caseStudies` y `caseStudy(slug)`, `select` con todos los campos del detalle, `lessons`, `meta`, `createdAt` y `updatedAt`, `populate` con `filename` para Media y avatar del autor). Sustituye a `getCachedCaseStudy`, que no tenia `select` ni se usaba en otro lugar. `toCaseDetailProps`, `buildCaseStudyJsonLd` (el mismo `CreativeWork` que construia la ruta, con el autor nombrado y sin `datePublished`) y `pickRelatedCases`. `BeforeAfter` y `CaseDetailView` con aside de autor para E-E-A-T y "Mas casos de exito". La ruta conserva `revalidate`, `generateStaticParams`, `generateMetadata`, `notFound` y no agrega aviso de traduccion (D-31).
- **Tarea 3, commit 0b7cb78:** `buildCaseComparison` pura (reconocedor `^(clics org[aá]nicos anuales|annual organic clicks)`, `num` con miles por coma y sufijos K y M, NaN para guion o texto, porcentaje null con `before` 0 o menor, ranking por porcentaje y por valor absoluto). `CaseCompareTable` con caption, `scope="col"` y `scope="row"`, dentro de `ScrollRegion`, barras `aria-hidden` y caso actual marcado con texto y `aria-current`. Seccion de lecciones solo con datos. La ruta calcula la comparacion desde el indice cacheado.

## Resultados de verificacion

| Comprobacion | Resultado |
|---|---|
| `npx tsc --noEmit` (tras cada tarea) | PASS |
| `55-cases-ssr.ts` | PASS, 105 comprobaciones (indice, detalle, comparacion, lecciones, JSON-LD y 20 fixtures defectuosos que fallan) |
| `55-messages-parity.mjs` | PASS (cases en ES y EN, sin guiones largos ni cortos) |
| `54-rsc-boundary.mjs` | PASS |
| `55-no-sandbox-data.mjs` | PASS (351 archivos, sin titulos de leccion ni slugs del sandbox) |
| `55-cache-tags.ts` | PASS |
| `55-websites-ssr.ts`, `55-home-fallback-ssr.ts`, `55-richtext-blocks-ssr.ts` | PASS (sin regresiones) |
| `npm run build` con variables falsas (cierre de la ola) | PASS, exit 0 (frontera RSC real) |
| Aceptacion por grep (`overrideAccess: false`, `sort: '-createdAt'`, `revalidate = 60`, `notFound`, `lessons` en cache.ts, `scope=`, `caption`, `annual organic clicks`, `scope="row"`, `ScrollRegion`, sin `designs/` ni `@/data/`) | PASS |
| Verificacion en vivo en dev.juan-tech.com | No hecha: el plan no tiene paso de push |

Lo que cubre `55-cases-ssr.ts` con casos inventados: indice (un h1, un enlace por caso, cifra y sector sin guion largo, estado vacio); detalle (un h1, sin saltos de encabezado, sin encabezados huerfanos, KPIs con dt antes de dd, testimonio, aside de autor, tabla de resultados con caption y scope, titulo de seccion de contexto segun lo que exista); comparacion (dos casos con etiqueta ES y EN, caso con `before` 0 sin porcentaje y ordenado solo por valor absoluto, fila de posicion no numerica, caso de migracion sin clics sin seccion ni nota, valor no numerico excluido, caso actual fuera de la lista); lecciones (aparecen con datos; `undefined`, `[]` y `null` no emiten encabezado, id ni texto); JSON-LD extraido (autor nombrado, referencia `@id` al autor del sitio, sin `datePublished`).

## Deviations from Plan

### Auto-fixed Issues

Ninguno: no hubo errores que corregir fuera de las tareas.

### Decisiones dentro del margen del plan

- **El select del indice no trae `client`.** El plan lo listaba, pero ninguna tarjeta ni la comparacion lo usan; traerlo solo agregaba datos a la cache.
- **`getCachedCaseStudy` se reemplazo por `getCachedCaseStudyBySlug`** (misma clave de cache, mas tags) porque la ruta era su unico llamador.
- **La ruta [slug] se toco tambien en la tarea 3** (el plan no la listaba en esa tarea) para calcular y pasar la comparacion.
- **Orden del detalle segun D-08**, no el del sandbox. Resultados quedan despues del testimonio y los comparativos antes de las lecciones y la conclusion.
- **Cifras largas.** Una `heroMetric` que no se separa de su etiqueta (por ejemplo "0 a 56 clics") baja de 72 px a 48 px (escala display aceptada) para no desbordar la tarjeta de tres columnas.
- **Titulo de la seccion de contexto segun datos.** Con cliente y reto dice "El cliente y el reto"; con solo uno de los dos dice "El cliente" o "El reto" y no repite un h3 igual al h2.
- **El aside de autor lleva avatar, nombre con enlace al perfil, cargo y biografia.** No trae credenciales ni redes: el enlace lleva al perfil completo (plan 55-12). `alt` vacio en el avatar porque el nombre esta al lado.
- **La ruta no muestra `heroImage`.** Ningun caso de produccion tiene una; el JSON-LD y Open Graph la siguen usando.
- **Sin etiquetas de seccion del sandbox que Payload no tiene** (overlines "1. Estadisticas", "Quien escribe" y similares, D-28).
- Conteo de commits: 3 propios; el checkout no se compartio con otro plan en esta ola.

## Authentication gates

Ninguno.

## Known Stubs

Ninguno. La seccion de lecciones oculta es intencional y esta documentada (D-10): la fase 56 carga las lecciones aprobadas.

## Threat Flags

Ninguno nuevo. Mitigaciones del plan: T-55-31 (`overrideAccess: false` y `select` dentro de las dos funciones cacheadas), T-55-32 (ninguna leccion del sandbox en codigo ni en pruebas, `55-no-sandbox-data` en PASS, seccion oculta sin datos), T-55-33 (JSON-LD extraido sin cambios y con prueba de forma; la paridad contra produccion sigue en 55-13), T-55-34 (`parseMetricNumber` devuelve NaN y el caso se excluye, porcentaje null con `before` 0 o menor).

## Para la revision de Juan

1. **Lecciones aprendidas no aparece en el preview** hasta la fase 56 (D-10). Es lo esperado: el campo existe, la tabla esta migrada y la vista esta lista.
2. **Etiquetas de interfaz nuevas en ingles** (namespace `cases`), pendientes de tu aprobacion. En espanol: "Todos los casos", "Ver el caso completo", "Los numeros del caso", "El cliente y el reto", "La solucion", "Resultados", "Conclusiones", "Sobre el autor", "Mas casos de exito", "Como se compara con mis otros casos", "Lecciones aprendidas" y las frases de ranking y de la nota de casos excluidos.
3. **Etiquetas largas de metricas** (por ejemplo las de KPIs): salen tal cual de Payload, sin acortar (pregunta abierta 7). Si alguna desborda una tarjeta, se ve al abrir el detalle.
4. **Mirar en el preview tras el siguiente push** (la ola 5 no empuja; el plan que cierre la ola debe esperar el estado `done` en Dokploy): `/case-studies` (siete tarjetas, la primera a ancho completo), el detalle del caso de talleres (porcentaje ausente y frase de "partio de cero"), el de migracion (sin seccion de comparacion ni nota) y la tabla comparativa en movil (debe enfocarse con Tab solo si desborda).
5. **El hero no muestra `heroImage`** (ningun caso la tiene hoy). Si quieres una imagen cuando un caso la tenga, se agrega despues.

## Self-Check: PASSED

Archivos creados verificados y commits 7bd3f7d, 3f459b2 y 0b7cb78 presentes en `git log`. Sin push en este plan.
