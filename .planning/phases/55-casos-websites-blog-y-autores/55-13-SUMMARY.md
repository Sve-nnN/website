---
phase: 55-casos-websites-blog-y-autores
plan: 13
subsystem: verification
tags: [verify, preview, seo-parity, a11y, deploy, live-battery, dokploy, allowlist, closing]
requires:
  - phase: 55-casos-websites-blog-y-autores
    provides: planes 01 a 12 (scripts 55-*, vistas MUI de casos, websites, blog y autores, migración aditiva aplicada, namespaces de mensajes)
provides:
  - batería sin conexión en modo estricto: 55 pasos PASS, 0 SKIP
  - batería en vivo contra dev.juan-tech.com: 22 pasos PASS, 0 FAIL, 0 SKIP
  - lista explícita y acotada de anclas sin destino toleradas (DANGLING_ANCHOR_ALLOWLIST en 55-post-contract.mjs)
  - deferred-items.md con los pendientes de las fases 56 y 57
  - las listas de revisión para Juan (cadenas EN, decisiones reversibles, pendientes)
affects: [fase 56, fase 57]
tech-stack:
  added: []
  patterns:
    - "Una excepción de verificación se registra como dato (ruta, anclas exactas, motivo, dueña) y falla ante cualquier ancla fuera de la lista, en otra ruta o de más"
key-files:
  created: []
  modified:
    - scripts/verify/55-post-contract.mjs
    - .planning/phases/55-casos-websites-blog-y-autores/deferred-items.md
key-decisions:
  - "Las 3 anclas sin destino de /en/blog/cs-fundamentals/recursividad se toleran por lista explícita (decisión del orquestador): es contenido (EN al 22 por ciento) que ya estaba roto en producción; la lista no admite otro post ni una ancla más"
  - "55-run-all.mjs no cambió: su lista de pasos ya coincidía con los scripts reales (22 pasos live y 55 selftests)"
requirements-completed: []
duration: 32min
completed: 2026-11-10
status: complete
commits: 1
plan_head_before: f9820ac36563011cbb91ab770f262e027e80be44
actuals:
  tokens: 7000
  tasks: 3
  commits: 1
---

# Phase 55 Plan 13: Prueba de la fase completa contra el preview Summary

La fase 55 queda desplegada en el preview y demostrada con evidencia ejecutable: 55 autopruebas estrictas sin SKIP, 22 pasos en vivo en verde (paridad profunda de SEO con producción, 58 posts en ES y EN, crawl de paridad, compuertas de escritura y la regresión completa de la fase 54) y logs del preview sin permission denied.

## Que quedo hecho

- **Tarea 1 (tracer), compuerta sin conexión:** `npx tsc --noEmit` PASS, `npm run build` con variables falsas PASS (exit 0), `55-messages-parity.mjs --final` PASS (los seis namespaces cases, websites, blog, post, authors y richText con paridad ES y EN), `55-no-sandbox-data.mjs` PASS (370 archivos de `src` limpios) y `55-run-all.mjs --selftests --strict` PASS: 55 pasos PASS, 0 FAIL, 0 SKIP (corrido antes y después de la excepción de anclas). La lista de pasos de `55-run-all.mjs` coincidía con los scripts reales y no hizo falta tocarla.
- **Excepción de anclas, commit ecb1574:** ver Deviations.
- **Tarea 2, push y batería en vivo:** precondición de esquema vacía (`git diff origin/feat/mui-redesign -- src/migrations src/collections src/globals package.json package-lock.json` sin líneas). Un solo push a `feat/mui-redesign` (`0c83b49..ecb1574`), que llevó los commits 5b79918, los docs de 55-12 y el de esta ola. `git log origin/feat/mui-redesign -1` coincide con `HEAD` (ecb1574f). Master y la app `web` de producción no se tocaron. Despliegue `8cTLjpi4VLKnbTcfaAjMM` en `done` a las 08:10:54 UTC (5,7 min, sin cancelarse; no hizo falta `application.redeploy`).
- **Tarea 3:** `deferred-items.md` con la excepción de recursividad, los pendientes de la fase 56 y los de la fase 57; las tres listas para Juan van abajo.

## Bateria final

### Sin conexión: `55-run-all --selftests --strict`

`# Resumen --selftests: 55 pasos PASS, 0 pasos FAIL, 0 pasos SKIP` (los 22 pasos de la fase 55, incluidos los nueve arneses SSR, más la regresión de la 54 con `54-rsc-boundary`).

### En vivo: `BASE_URL=https://dev.juan-tech.com PROD_BASE=https://juan-tech.com EXPECT_PREVIEW=1 55-run-all --live --no-wait`

`# Resumen --live: 22 pasos PASS, 0 pasos FAIL, 0 pasos SKIP`

| Paso | Resultado |
|---|---|
| 53-layer-check | PASS |
| 55-page-contract --require-home-sections | PASS, 49 PASS, 0 FAIL, 87 WARN (encabezados de contenido de Payload con punto o coma, no son defectos de la fase) |
| 55-seo-parity | PASS, 163 PASS, 0 FAIL (igualdad profunda de title, description, canonical, hreflang, og, twitter y JSON-LD contra producción) |
| 55-tracer-live | PASS, 2 PASS |
| 55-post-contract --preview-only | PASS, 121 PASS, 0 FAIL, 1 WARN (la excepción de recursividad, ver abajo) |
| 55-content-parity | PASS, 117 PASS, 0 FAIL |
| 55-blog-search | PASS, 35 PASS, 0 FAIL |
| 53-crawl-parity | PASS: ninguna URL del sitemap de producción cambia de estado |
| 53-write-gates | PASS: las rutas que escriben siguen inertes |
| 54 regresión (12 pasos: layer-check, page-contract 61 PASS, notfound-status, dual-urls, crawl-parity, search, stack-affiliate, contact-form sin enviar, faq-ssr, about, shell-contract, computed-styles, write-gates) | PASS los 12 |

Evidencia dirigida, corrida aparte sobre el mismo despliegue:

| Comprobación | Resultado |
|---|---|
| 58 posts en dos idiomas (`55-post-contract --preview-only`) | 116 líneas `PASS ... contrato de post` (58 ES y 58 EN, URLs EN derivadas de las ES) más 4 redirecciones: 120 PASS, 0 FAIL |
| Home `id="casos"` e `id="sitios"` | presentes en `/` y `/en` (1 cada uno por URL); `55-page-contract --require-home-sections` PASS con `/` y `/en` (lang, un h1, un main, sin marcadores) |
| A7 final, logs del preview (`application.readLogs`, tail 1000, solo lectura) | 0 apariciones de permission denied, does not exist, Error ni 500. Los logs del contenedor posterior al despliegue contienen solo el arranque de Next (08:10:52 a 08:10:55): la app no escribe una línea por petición, de modo que el 0 significa que ninguna lectura de las cuatro tablas nuevas lanzó un error de base (un permission denied de una consulta habría salido como error de render), a la vez que las páginas de casos respondieron 200 con datos. No hizo falta `df -h /` en el VPS: el plan no lo pide |
| Perfil de autor tras 5b79918 (`/authors/juan-carlos-angulo` y `/en/...`) | 200, un h1, 58 enlaces distintos a posts y 7 a casos, 2 timelines de `@mui/lab`; la etapa sin fechas ya no sale en curso (de 5 puntos, 4 con el estilo neutro y 1 con el estilo en curso; el texto "En curso" aparece una sola vez en la lista) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug de verificación, decisión del orquestador] El único FAIL conocido de `55-post-contract` impedía el verde completo**
- **Found during:** cierre de 55-11 y 55-12 (se arrastraba como FAIL esperado)
- **Issue:** `/en/blog/cs-fundamentals/recursividad` conserva 3 anclas sin destino (`#common-recursion-algorithms`, `#best-practices-for-writing-recursive-functions`, `#conclusion`). Las secciones no existen en la traducción EN (22 por ciento del español, post en `EN_TRANSLATION_INCOMPLETE`): es contenido y ya estaba roto en producción.
- **Fix:** `DANGLING_ANCHOR_ALLOWLIST` en `55-post-contract.mjs` con ruta, las tres anclas exactas, motivo y dueña (fase 56, contenido). Solo aplica con `--preview-only` y solo a esa ruta. Falla si (a) otro post tiene una ancla sin destino, (b) ese post tiene cualquier ancla fuera de las tres. Si el post resuelve alguna, avisa con WARN para retirar la entrada. Autoprueba con 7 casos (las tres anclas toleradas con un WARN que nombra el motivo, otro post con la misma ancla falla, otro post ES falla, una ancla de más falla, menos anclas no falla, aviso de retiro).
- **Files modified:** `scripts/verify/55-post-contract.mjs` (fuera de `files_modified` del plan, que listaba `55-run-all.mjs`; esa pieza no cambió)
- **Commit:** ecb1574

### Decisiones y diferencias dentro del margen del plan

- **Los dos archivos `scripts/_tmp-dump-b0303.ts` y `scripts/_tmp-extract-b0303.ts`** aparecen sin versionar en `git status`; no son de la fase 55 (ya estaban en el estado inicial del árbol) y no se tocaron. El criterio "sin cambios sin commitear en src, scripts y messages" se cumple para todo lo que produjo la fase.
- **Orden del árbol de trabajo:** `.planning/state.json`, `research/JUAN-PROFILE.md` y `research/voice-and-tone-juan.md` aparecían modificados antes de empezar y no se incluyeron en ningún commit.
- **El plan pedía `55-run-all --live` sin `--strict`:** la batería live no usa `--strict` (la bandera es de la compuerta sin conexión); los 22 pasos corrieron y 0 quedaron en SKIP.
- **Conteo de commits:** 1 medido con el ledger (ecb1574). Los commits de documentación de cierre van aparte.

## Authentication gates

Ninguno.

## Known Stubs

Ninguno. Los datos pendientes (lecciones sin cargar, perfil sin credenciales) son contenido de la fase 56 y están en `deferred-items.md`.

## Threat Flags

Ninguno nuevo. T-55-46 (regresión de SEO): `55-seo-parity` 163 PASS y `53-crawl-parity` PASS, 58 posts en dos idiomas. T-55-47 (escritura desde el preview): `53-write-gates` PASS y logs sin permission denied; los scripts solo hacen GET. T-55-48 (master): solo se empujó `feat/mui-redesign` y `origin/feat/mui-redesign` coincide con `HEAD`. T-55-49 (falso verde): la compuerta sin conexión corrió con `--strict` y 0 SKIP, y la batería en vivo confirmó contra el preview real.

## Marca de requisitos

**PAG-01** queda cerrado en lo técnico por D-26: `id="casos"` e `id="sitios"` están presentes en `/` y `/en` con datos reales de las colecciones. **PAG-03, PAG-04, PAG-05 y PAG-10** quedan demostrados con evidencia ejecutable (criterios 1 a 4 de ROADMAP). Este plan no los marca como completos: lo hace el verificador.

## Lista 1: cadenas nuevas en EN pendientes de aprobacion de Juan

Las 169 claves de los seis namespaces son nuevas en la fase (el EN y el ES no existían antes del plan 55-01). La paridad ES y EN y las reglas de voz pasan con `--final`; lo que falta es que Juan apruebe el inglés. En ES son las etiquetas de interfaz de cada plan (por ejemplo "Todos los casos", "Ver el caso completo", "Lecciones aprendidas", "Tabla de contenidos", "Credenciales", "Eventos donde he sido ponente").

### websites (48)

- `websites.index.listTitle`: Projects
- `websites.index.listLabel`: Project list
- `websites.index.filterLabel`: Filter projects by technology
- `websites.index.filterAll`: All
- `websites.index.filterOption`: {label} ({count})
- `websites.index.kinds.nextjs`: Next.js
- `websites.index.kinds.wordpress`: WordPress
- `websites.index.kinds.other`: Other technologies
- `websites.index.count`: {count, plural, one {# project} other {# projects}}
- `websites.index.countWithKind`: {count, plural, one {# project} other {# projects}} with {kind}
- `websites.index.featured`: Featured project
- `websites.index.viewProject`: View the project
- `websites.index.emptyTitle`: Coming soon
- `websites.index.emptyText`: I'm preparing new website case studies. Check back soon.
- `websites.index.screenshotAlt`: Screenshot of {domain}
- `websites.index.stackLabel`: Technologies
- `websites.index.scoresLabel`: PageSpeed Insights scores
- `websites.index.scoreSuffix`: out of 100
- `websites.index.scoresNote`: PageSpeed Insights scores, measured on {date}.
- `websites.index.rings.performance`: Performance
- `websites.index.rings.accessibility`: Accessibility
- `websites.index.rings.bestPractices`: Best practices
- `websites.index.rings.seo`: SEO
- `websites.detail.visit`: Visit the site
- `websites.detail.opensInNewTab`: opens in a new tab
- `websites.detail.externalNotice`: This link goes to an external site and opens in a new tab (sin uso hoy)
- `websites.detail.screenshotAlt`: Desktop screenshot of {domain}
- `websites.detail.buildTitle`: What I built and what challenges it had
- `websites.detail.highlightsTitle`: Highlights
- `websites.detail.challengesTitle`: Challenges
- `websites.detail.stackTitle`: Technology stack
- `websites.detail.stackLabel`: Technologies
- `websites.detail.screenshotsTitle`: Screenshots (sin uso hoy)
- `websites.detail.scoresTitle`: Measured performance
- `websites.detail.scoresLabel`: PageSpeed Insights scores
- `websites.detail.scoreSuffix`: out of 100
- `websites.detail.scoresNote`: PageSpeed Insights scores, measured on {date}.
- `websites.detail.rings.performance`: Performance
- `websites.detail.rings.accessibility`: Accessibility
- `websites.detail.rings.bestPractices`: Best practices
- `websites.detail.rings.seo`: SEO
- `websites.detail.relatedCaseTitle`: Related case study
- `websites.detail.relatedCaseLink`: View the case study
- `websites.detail.navLabel`: Navigate between projects
- `websites.detail.previous`: Previous: {title}
- `websites.detail.next`: Next: {title}
- `websites.detail.moreTitle`: More projects
- `websites.detail.viewAll`: View all

### cases (35)

- `cases.index.listTitle`: All case studies
- `cases.index.listLabel`: Case study list
- `cases.index.viewCase`: View the full case study
- `cases.index.emptyTitle`: Coming soon
- `cases.index.emptyText`: I'm preparing new case studies. Check back soon.
- `cases.detail.statsTitle`: The numbers behind the case
- `cases.detail.contextTitle`: The client and the challenge
- `cases.detail.clientTitle`: The client
- `cases.detail.challengeTitle`: The challenge
- `cases.detail.solutionTitle`: The solution
- `cases.detail.resultsTitle`: Results
- `cases.detail.periodBefore`: Before: {period}.
- `cases.detail.periodAfter`: After: {period}.
- `cases.detail.before`: Before
- `cases.detail.after`: After
- `cases.detail.resultsCaption`: Case results, before and after
- `cases.detail.metricColumn`: Metric
- `cases.detail.changeColumn`: Change
- `cases.detail.noBase`: No baseline to compare
- `cases.detail.conclusionTitle`: Conclusions
- `cases.detail.authorLabel`: About the author
- `cases.detail.moreTitle`: More case studies
- `cases.detail.viewAll`: View all
- `cases.detail.compareTitle`: How it compares with my other cases
- `cases.detail.compareCaption`: Annual organic clicks for each case, the previous year against the measured period
- `cases.detail.compareRankBoth`: This case ranks number {pct} of {pctTotal} in percentage growth and number {abs} of {absTotal} in absolute clicks.
- `cases.detail.compareRankAbs`: This case ranks number {abs} of {absTotal} in absolute clicks. It has no percentage growth because it started from zero.
- `cases.detail.compareNote`: Cases that measure a different metric, such as monthly traffic, are left out of this comparison of annual clicks.
- `cases.detail.compareScrollLabel`: Comparison table with horizontal scrolling
- `cases.detail.compareThis`: This case
- `cases.detail.compareNoBase`: No baseline
- `cases.detail.caseColumn`: Case
- `cases.detail.sectorColumn`: Sector
- `cases.detail.scaleColumn`: Scale
- `cases.detail.lessonsTitle`: Lessons learned

### blog (31)

- `blog.nav.label`: Blog categories
- `blog.nav.all`: All
- `blog.category.listTitle`: Posts in this category
- `blog.category.listLabel`: List of posts in the category
- `blog.category.count`: {count, plural, one {# post} other {# posts}}
- `blog.category.emptyTitle`: No posts in this category yet
- `blog.category.emptyText`: Browse the rest of the blog in the meantime.
- `blog.category.backToBlog`: Browse the whole blog
- `blog.closing.pointsLabel`: Key points
- `blog.index.latestTitle`: Latest
- `blog.index.sectionListLabel`: Posts about {category}
- `blog.index.count`: {count, plural, one {# post} other {# posts}}
- `blog.index.viewMore`: View more
- `blog.newsletter.emailLabel`: Your email
- `blog.newsletter.submitLabel`: Subscribe
- `blog.newsletter.sending`: Sending…
- `blog.newsletter.success`: Check your inbox: I sent you a link to confirm. Without that click the signup is not active.
- `blog.newsletter.invalid`: That email doesn't look valid. Check it and try again.
- `blog.newsletter.error`: Couldn't complete the signup. Try again in a bit.
- `blog.newsletter.unconfigured`: Signup is unavailable right now. Reach me through the contact form instead.
- `blog.newsletter.confirmed`: Confirmed. You will get new articles from now on.
- `blog.newsletter.unsubscribed`: You are unsubscribed. No more emails from me.
- `blog.newsletter.invalidLink`: That link is no longer valid. If you wanted to subscribe, leave your email again below.
- `blog.newsletter.honeypotLabel`: Company website
- `blog.search.formAria`: Search the blog
- `blog.search.fieldLabel`: Search posts
- `blog.search.submit`: Search
- `blog.search.resultCount`: {count, plural, =0 {No results} one {# result} other {# results}}
- `blog.search.resultsTitle`: Search results
- `blog.search.noResults`: No posts match your search.
- `blog.search.siteSearch`: Search the whole site

### post (14)

- `post.toc.label`: Table of contents
- `post.readingTime`: {minutes} min read
- `post.categoriesLabel`: Post categories
- `post.progress.label`: Reading progress
- `post.offer.label`: Featured information
- `post.author.title`: About the author
- `post.author.credentialsLabel`: Credentials
- `post.author.years`: {years}+ years of experience
- `post.author.profile`: View {name}'s profile
- `post.related.title`: Related posts
- `post.related.listLabel`: List of related posts
- `post.nav.label`: Previous and next post
- `post.nav.previous`: Previous
- `post.nav.next`: Next

### authors (33)

- `authors.index.listLabel`: List of authors
- `authors.index.emptyTitle`: Coming soon
- `authors.index.emptyText`: There are no published authors yet.
- `authors.index.viewProfile`: View profile
- `authors.profile.credentialsTitle`: Credentials
- `authors.profile.credentialsLabel`: List of credentials
- `authors.profile.expertiseTitle`: Areas of expertise
- `authors.profile.expertiseLabel`: List of areas of expertise
- `authors.profile.experienceTitle`: Experience
- `authors.profile.experienceLabel`: Professional experience
- `authors.profile.educationTitle`: Education and certifications
- `authors.profile.educationLabel`: Education and certifications
- `authors.profile.eventsTitle`: Speaking events
- `authors.profile.eventsLabel`: List of events
- `authors.profile.postsTitle`: Posts
- `authors.profile.postsLabel`: List of the author's posts
- `authors.profile.casesTitle`: Case studies
- `authors.profile.casesLabel`: List of the author's case studies
- `authors.profile.dateRange`: {from} to {to}
- `authors.profile.dateRangeOpen`: {from} to today
- `authors.profile.current`: Ongoing
- `authors.profile.years`: {years}+ years of experience
- `authors.profile.by`: by {name}
- `authors.profile.attendees`: {count, plural, one {# attendee} other {# attendees}}
- `authors.profile.coSpeakers`: With {names}
- `authors.profile.eventLink`: Learn more
- `authors.profile.socialLabel`: {name} on other platforms
- `authors.profile.platforms.linkedin`: LinkedIn
- `authors.profile.platforms.github`: GitHub
- `authors.profile.platforms.x`: X
- `authors.profile.platforms.website`: Website
- `authors.profile.aboutLink`: More about me
- `authors.profile.stackLink`: See my tool stack

### richText (8)

- `richText.copyCode`: Copy
- `richText.codeNoun`: code
- `richText.codeCopied`: Copied
- `richText.codeCopiedStatus`: Code copied
- `richText.codeCopyFailedStatus`: The code could not be copied
- `richText.codeRegionLabel`: Code with horizontal scrolling
- `richText.tableRegionLabel`: Table with horizontal scrolling
- `richText.readPost`: Read the article

Las que más conviene mirar: `websites.index.emptyText`, `websites.index.kinds.other`, `websites.detail.buildTitle`, `cases.detail.compareRankBoth` y `compareRankAbs`, `blog.newsletter.success`, `authors.profile.current` ("Ongoing") y `authors.profile.eventsTitle` ("Speaking events").

## Lista 2: decisiones que Juan puede revertir

1. **Campo `lessons` como array de `title` y `body`** (localizados y obligatorios por fila) en vez de solo `text` (D-10): cambiarlo cuesta otra migración y, por el `DROP` de un campo, necesita su aprobación por nombre.
2. **Lecciones ocultas hasta la fase 56:** la tabla existe y está vacía; el preview no muestra "Lecciones aprendidas" hasta que se carguen las aprobadas.
3. **Comparación de casos calculada en el servidor** a partir de `results.metrics` de los demás casos (D-09); un caso que no mide clics queda fuera, con nota.
4. **Puntajes y capturas de Payload, no los del sandbox** (D-13): los medidos el 14 de julio de 2026; `juan-tech-com` no muestra puntajes (los cuatro son null).
5. **Búsqueda del blog en el cliente** sobre título y extracto, con anuncio `aria-live` (D-17); sin consulta el HTML ya trae todas las tarjetas.
6. **"Ver más" por enlace con 6 por categoría** (D-18): el índice muestra seis fuera del destacado y la categoría lista todo; `/blog?category=` ya no hace nada.
7. **Respaldo de la home con los más recientes** (D-26) cuando `featured-content` está vacío: 3 casos y 5 sitios reales; no escribe en el global.
8. **Un solo cierre en las superficies del blog** (el cierre oscuro con puntos clave) en vez de los cierres y ofertas viejos.
9. **Enlaces absolutos del cuerpo** (`https://juan-tech.com/...`) llevan a producción desde el preview, en la misma pestaña: es la regla de paridad (pregunta abierta 3); se podrían reescribir como relativos solo en el preview.
10. **h1 del blog tomado de Pages** y la posición del campo de búsqueda bajo el hero y la navegación (no dentro del hero, como en el sandbox).
11. **Etiquetas de métricas con guion largo verbatim de Payload:** salen tal cual, sin acortar (pregunta abierta 7); si alguna desborda una tarjeta se ve en el detalle.
12. **Nota de medición sin afirmar que sea móvil** (solo "PageSpeed Insights, medidos el {fecha}"), repetida en cada tarjeta del índice.
13. **Ítems de 54-REVIEW:** IN-05 a IN-09 plegados (hooks y tags, `limit` 0 y locale, `role="list"`, `Section`, `assertSafeTarget`); IN-01 a IN-04 diferidos a la fase 57 porque ningún plan tocó esos archivos.
14. **Aviso de traducción en los 17 EN incompletos:** usa el texto existente, exacto para los 7 que sirven el español entero pero impreciso para los 10 traducidos a medias (sin `lang="es"` en el cuerpo por la misma razón).
15. **Tolerancia por lista de las 3 anclas de recursividad EN** hasta que la fase 56 traduzca el artículo o quite los enlaces.
16. **Logo de educación no se pinta** en la línea de tiempo del perfil, y las ponencias van en `lang="es"` también en EN (igual que Sobre mí).

## Lista 3: pendientes que cierran las fases 56 y 57

- **Fase 56 (contenido):** cargar las lecciones aprobadas en el corte; puntajes Lighthouse y capturas nuevos; marcadores `{{pendiente}}`; curar `featured-content`; fechas de la experiencia "Senior Tech SEO Analyst" y credenciales vacías de Juan; traducir `recursividad` al inglés (o quitar los tres enlaces) y borrar la entrada de la lista; guiones largos del namespace `emailCapture`; título cortado de `complejidad-algoritmica`.
- **Fase 57 (corte):** retirar `RichTextRenderer`, `PostCard` vieja, `CaseStudyCard`, `CaseStudyResultsChart`, `WebsiteCard`, `AuthorCard`, `BlogCategoryTabs`, `CategoryBridge`, `InlineOffer`, `RailOffer` y `BlogClosing` vieja (los bloques de `src/blocks/*` y `richTextBlockConverters.tsx` aún los importan); IN-01 a IN-04; compuerta humana de revalidación de admin a preview en vivo; corregir el comentario de `sitemap-data.ts`; claves de mensajes sin uso; decidir sobre `scripts/_tmp-*-b0303.ts`.

## Revision humana (no bloqueante, UAT)

1. **Lectores de pantalla:** NVDA con Firefox y VoiceOver con Safari sobre el anuncio de resultados de la búsqueda del blog, la barra de progreso del post, el TOC y su acordeón móvil, la tabla comparativa de casos y las dos líneas de tiempo del perfil de autor.
2. **Visual en el preview** a 375, 900, 1024 y 1280 px, con zoom de 200 por ciento y 320 px sin scroll horizontal fuera de tablas y código, objetivos táctiles de 40 y 44 px y foco no tapado por el header.
3. **Enlace absoluto del cuerpo de un post** en el preview: confirmar que lleva a juan-tech.com (decisión de paridad).
4. **Revalidación de admin a preview** (los hooks nuevos no cruzan procesos): compuerta humana de la fase 57.
5. **Perfil de Juan:** la etapa "Ingeniero de software" sale "may 2022 a ago 2028 (En curso)" porque Payload trae una fecha de fin futura; confirmar si es la fecha que quieres mostrar. La etapa de aprendoclub sigue sin fechas (punto neutro) y el campo `credentials` está vacío.
6. **Tarjeta de oferta del riel** del post: queda bajo el índice dentro de la columna fija; en índices largos solo se ve al desplazar esa columna. Dime si la prefieres en otro lugar.
7. **Tablas del cuerpo:** sin caption (Payload no guarda título de tabla) y sin el color de fondo por celda del editor; confirmar que ninguna tabla real dependa de ese color.

## Self-Check: PASSED

`scripts/verify/55-post-contract.mjs` y `deferred-items.md` existen y están modificados; el commit ecb1574 está en `git log` y en `origin/feat/mui-redesign` (coincide con `HEAD` al empujar); el despliegue `8cTLjpi4VLKnbTcfaAjMM` terminó en `done`; la batería sin conexión (55 PASS, 0 SKIP) y la en vivo (22 PASS, 0 FAIL, 0 SKIP) están en verde; `deferred-items.md` y este resumen no contienen guiones largos ni cortos en las cadenas en español.
