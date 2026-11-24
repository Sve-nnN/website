---
phase: 54-paginas-de-conversion-y-utilidad
plan: 09
subsystem: ui
tags: [mui, payload-pages, service-landing, slots, lexical, ssr-selftest, a11y, seo]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 05 (Section, FaqAccordion, IconTile, lists), plan 06 (MuiRichText, LogoMarquee, TestimonialCards, CaseMetricCard, CtaSection, getCtaData) y plan 07 (messages y migracion de la fase)
provides:
  - composeServiceSlots y el tipo ServiceSection (src/lib/service-slots.ts), modulo puro
  - ServiceDetailPage, Server Component compartido por /servicios/[slug] y /services/[slug]
  - Ocho secciones MUI en src/components/pages/service (hero, problema, que incluye, como trabajo, extras, banda, prueba de caso, otros servicios)
  - service-view-data (iconos por slug, otros servicios, logos, testimonios, caso)
  - 54-service-slots.ts y 54-service-ssr.ts, autopruebas contra los docs reales de produccion
affects: [54-10, 54-14, 54-16]

plan_head_before: ab711c7ab5e214c2724d6bf4b37366ecf6e3f50a
actuals:
  tokens: 17100
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Composicion por ranuras: posicion y blockType decidan la seccion, nunca el texto del encabezado; un blockType desconocido cae a generic y se pinta con el registro anterior"
    - "Server Components con sx planos para las secciones de texto; los componentes que reciben una funcion como component (linkFor) son use client"
    - "Texto del editor como hijo servidor: ServiceCtaBand y FaqAccordion reciben MuiRichText ya renderizado como children o answer"
    - "Cada lectura secundaria (logos, testimonios, caso, otros servicios, cierre) falla por separado con console.error('[services]') y omite su seccion"

key-files:
  created:
    - src/lib/service-slots.ts
    - src/lib/service-view-data.ts
    - src/components/pages/ServiceDetailPage.tsx
    - src/components/pages/service/ServiceHero.tsx
    - src/components/pages/service/ServiceProblem.tsx
    - src/components/pages/service/ServiceIncludes.tsx
    - src/components/pages/service/ServiceHow.tsx
    - src/components/pages/service/ServiceExtras.tsx
    - src/components/pages/service/ServiceCtaBand.tsx
    - src/components/pages/service/ServiceCaseProof.tsx
    - src/components/pages/service/OtherServices.tsx
    - src/components/pages/service/column-parts.ts
    - scripts/verify/54-service-slots.ts
    - scripts/verify/54-service-ssr.ts
  modified:
    - src/app/(frontend)/[locale]/servicios/[slug]/page.tsx
    - src/app/(frontend)/[locale]/services/[slug]/page.tsx

key-decisions:
  - "Solo el SEGUNDO content puede ser twoColumns (y solo con dos columnas); cualquier otro content posterior es prose, asi un tercer content con dos columnas no se confunde con Que incluye"
  - "Un segundo hero o un segundo serviceScopeCard cae a generic en vez de descartarse, para no perder ningun bloque"
  - "Que incluye y Como trabajo toman todo nodo con texto de la columna como item (no solo parrafos), omitiendo parrafos vacios; el primer heading es el h2 de la seccion"
  - "El CTA del aside del hero es el enlace del primer callToAction del layout; el cierre se pinta al final con el unico formulario"
  - "El boton de Extras apunta a AUDITOR_URL (dato fijo del producto de Juan) con los textos de messages auditorCallout"

patterns-established:
  - "La fase 54 reutiliza esta composicion por ranuras para Casos y Sitios si sus docs tambien son bloques"
  - "Una autoprueba que baja el doc real de la API publica comprueba la estructura contra el contenido de verdad, no contra un fixture"

requirements-completed: []

duration: 45min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 09: Landing de servicio en MUI por ranuras Summary

**Las cuatro landings de servicio se componen por posicion y blockType desde el doc de Payload, bajo las dos URLs duales y con metadata, ISR y JSON-LD de Service y BreadcrumbList intactos: cabecera con alcance, problema, que incluye con marca de verificacion, como trabajo numerado, extras, prueba social, caso, FAQ, otros servicios y un unico formulario de cierre.**

## Performance

- **Duration:** unos 45 min
- **Completed:** 2026-11-08
- **Tasks:** 3 de 3 (la 1 es tracer)
- **Files:** 14 creados, 2 modificados

## Accomplishments

- `composeServiceSlots(layout)` devuelve `{ hero, scope, sections }` sin leer ningun texto: hero y scope a su ranura, primer `content` a problem, segundo `content` con exactamente dos columnas a twoColumns, resto a prose, `callToAction` con `closing` solo el ultimo, y cada blockType conocido a su kind. Lo desconocido va a `generic`. Las secciones conservan el orden del layout.
- `ServiceDetailPage` lee con `getServicePage`, llama `notFound()` sin doc y emite los mismos `JsonLd` con los mismos argumentos (`buildServiceJsonLd(locale, slug, title, meta.description)` y `buildBreadcrumbJsonLd(trail)`). Las dos rutas gemelas quedaron en `revalidate = 60`, `generateStaticParams` vacio, `generateMetadata` con `getServiceMetadata` y un default export de una linea. El diff de cada ruta solo quita el cuerpo de render y los imports que ya no usa.
- `ServiceHero`: `PageHero` con las migas de `buildTrail` y un aside `Card component="aside"` con `aria-labelledby`, dos h3 (incluye y logra), el tiempo en caja `raised` y un boton contained con el enlace del primer callToAction (saneado con `resolveLinkHref`). Sin scope el hero queda en una columna.
- Que incluye: `UL` con circulo de 32px y `Check` decorativo, cada item es un nodo de la columna renderizado con `MuiRichText` sobre una raiz sintetica de un solo nodo (conserva negritas y enlaces), sin tarjetas. Como trabajo: `OL` con numeral mono de 36px `aria-hidden`. Ambos promueven el h3 de la columna a h2.
- Banda intermedia sin formulario, prueba de caso con `CaseMetricCard` y `splitHeroMetric`, FAQ con `FaqAccordion` (resumenes h3, paneles cerrados en el HTML), testimonios en franja band, marquesina de logos, otros servicios derivados de `SERVICE_SLUGS` y cierre con `CtaSection` y `getCtaData`.

## Task Commits

1. **Task 1 (tracer): landing por ranuras con hero y alcance, probada contra docs reales** - `438ed8e` (feat)
2. **Task 2: Problema, Que incluye, Como trabajo y Extras** - `09c94dd` (feat)
3. **Task 3: banda, prueba de caso, FAQ, otros servicios y cierre** - `4bd3f6f` (feat)

La rama NO se empujo (regla de la fase). No se escribio en ninguna base, no se leyo `.env` y no se toco el preview ni la app `web` de produccion.

## Verificacion

- `tsx scripts/verify/54-service-slots.ts`: 13 casos en PASS (5 sinteticos y los cuatro slugs en es y en contra la API publica de produccion). Para seo-technical-audit la secuencia exacta es problem, cta, twoColumns, auditor, logos, testimonials, caseProof, faq, cta con closing; en los ocho docs hay hero, scope, un solo problem, cero generic y `sections + 2` igual al largo del layout.
- `tsx scripts/verify/54-service-ssr.ts`: 46 casos en PASS (23 por idioma sobre el doc real de seo-technical-audit): un solo h1, niveles h1 a h3 sin saltos, ul con tantos li como nodos de la columna 1, ol con numerales `aria-hidden`, aside con `aria-labelledby` que resuelve, Problema nombrado con el id de su primer h2, paneles cerrados del FAQ en el HTML, hrefs duales de Otros servicios, ids unicos, sin `main` ni `{{`.
- `npx tsc --noEmit`: salida 0.
- `npm run build` (variables de solo build): salida 0.
- Greps de aceptacion de las tres tareas en verde (sin `main`, sin `component="ul|ol"` fuera de `lists.tsx`, sin `use client` en las cuatro secciones de texto, sin `<Form` en la banda).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Section no puede nombrar la region de Problema**
- **Found during:** Tarea 2
- **Issue:** el plan pide `Section` sin title con `aria-labelledby` igual al id del primer h2 del rich text, pero `Section` arma siempre `aria-labelledby={`${id}-t`}` y el id del h2 sale del texto (`slugify`). El enlace habria quedado colgando.
- **Fix:** `ServiceProblem` usa `Box component="section"` con `aria-labelledby` igual al id real que calcula `extractHeadings` (el mismo que pone `MuiRichText`). Sin h2 no declara `aria-labelledby`. La autoprueba comprueba que el id coincide.
- **Files modified:** `src/components/pages/service/ServiceProblem.tsx`
- **Commit:** `09c94dd`

**2. [Rule 2 - Missing critical] Ningun texto del editor se pierde en columnas y nodos no previstos (SEO-03)**
- **Issue:** el plan habla de "parrafos" y de la columna 1; un `content` de problema con varias columnas, o una columna con una lista o un segundo encabezado, habria perdido texto.
- **Fix:** Problema renderiza todas las columnas de su bloque; Que incluye y Como trabajo toman todo nodo con texto (no solo paragraph) y omiten solo los parrafos vacios; `prose` renderiza todas las columnas. Helper puro `column-parts.ts` (`splitColumn`, `singleNodeRoot`).
- **Files modified:** `src/components/pages/service/ServiceProblem.tsx`, `ServiceIncludes.tsx`, `ServiceHow.tsx`, `column-parts.ts`, `src/components/pages/ServiceDetailPage.tsx`
- **Commit:** `09c94dd`

**3. [Rule 2 - Missing critical] Titulo de respaldo para marquesina, testimonios, caso y FAQ**
- **Issue:** `LogoMarquee` y `Section` exigen titulo (el h2 es su nombre accesible) y el bloque lo trae opcional. Omitir la seccion perderia logos y citas.
- **Fix:** se usa el titulo del bloque y, si falta, texto que ya existe en messages: `home.marquee.groupLabel` para los logos, `testimonialsCarousel.title`, `relatedCaseStudyBlock.title` y `services.detail.faqTitle`. No se inventa copy. En el FAQ el titulo del bloque tiene prioridad sobre `faqTitle` porque es contenido del editor (el plan pedia `faqTitle` a secas).
- **Commit:** `4bd3f6f`

**4. [Rule 1 - Bug] Una funcion no cruza de servidor a cliente: OtherServices es use client**
- **Issue:** el plan no fija si `OtherServices` es servidor o cliente; usa `linkFor(href)` como `component` de `Link`, que es una funcion y no se puede pasar desde un Server Component a un componente MUI cliente.
- **Fix:** `OtherServices` es `use client` y recibe solo datos planos. `ServiceCtaBand` ya era cliente por el mismo motivo y recibe el texto como `children` renderizado en servidor.
- **Commit:** `4bd3f6f`

**5. [Rule 2 - Missing critical] `role="list"` en UL y OL con `list-style: none`**
- **Issue:** Safari con VoiceOver quita la semantica de lista cuando `list-style` es none.
- **Fix:** `role="list"` en las listas de Que incluye, Como trabajo y Otros servicios.
- **Commit:** `09c94dd` y `4bd3f6f`

**6. [Interpretacion] Fuente de datos de logos y testimonios**
- El bloque `clientLogosBlock` de los docs reales trae `clients: []` y `testimonialsCarousel` solo `limit`, asi que el servidor lee la coleccion `clientes` (todos, como el componente anterior) y `testimonials` (`limit` del bloque o 8) con `overrideAccess: false` y `select` minimo en clientes. Los mapeadores puros `toMarqueeLogos` y `toTestimonialItems` omiten entradas sin logo con url o sin cita.

**7. [Interpretacion] Cierre y cola de la pagina**
- El `callToAction` con `closing: true` se pinta siempre al final (despues de Otros servicios), con el texto plano de su richText como lead; si `getCtaData` devuelve null (sin copy o sin correo) se omite y la pagina queda sin formulario. En EN con copy de respaldo en espanol el cierre va envuelto en `lang="es"` y usa el lead de `getCtaData` para que el bloque sea coherente.
- El enlace del callToAction de cierre (por ejemplo "Pedir una auditoria" hacia `/contact`) no se pinta: `CtaPanel` solo trae el formulario. El texto del bloque si se conserva como lead.

**Total:** 5 correcciones o ampliaciones automaticas y 2 interpretaciones. El contrato de SEO (metadata, ISR, JSON-LD) no cambia.

## Interpretaciones a revisar

- UI-SPEC deja sin resolver la fidelidad de Que incluye: se asumio que cada nodo bajo el h3 es un item de la lista. Si Juan prefiere tarjetas o dos columnas, es un cambio en `ServiceIncludes` y en la convencion del editor.
- Los h2 de Problema salen de `MuiRichText` (variante h4 del tema) y los de Que incluye y Como trabajo usan la variante h3; mantienen el nivel semantico h2 pero no el mismo tamano. Se deja para el repaso visual de 54-16.
- El hero real de las cuatro landings no trae `links`, por eso el aside usa el enlace del primer callToAction (`/contact` en los docs de hoy).

## Lo que la autoprueba no puede probar

- Contraste, solape y escala a 375, 900 y 1280 px (criterios `backstop` de UI-SPEC), el hover y el foco de las tarjetas de Otros servicios y del caso, y la marquesina en movimiento: quedan para el preview en 54-16.
- La lectura real con Payload (`getOtherServices`, `getServiceLogos`, `getServiceTestimonials`, `getCaseProof`, `getCtaData`) necesita la base. La autoprueba usa la forma ya mapeada a partir de la API publica. En el preview hay que confirmar que los cuatro servicios y los dos idiomas devuelven logos, citas y caso.
- La comparacion de tipos `ld+json` contra produccion es del plan 54-16 (T-54-39).

## Authentication Gates

Ninguno. No se leyo `.env`, no se escribio en la base, no se empujo la rama y no se toco el preview ni la app `web` de produccion.

## Supuesto A7 (rol de solo lectura del preview)

No aplica en este plan: la landing de servicio lee `pages`, `clientes`, `testimonials`, `case-studies` y, por `getCtaData`, `home_page*` (ya cubierto en 54-06). La rama no se empuja, asi que el preview sigue en `5fa327d` y no ejecuta este codigo. La revision de logs por `permission denied` queda para el despliegue que publique la home completa (54-14 o 54-16).

## Known Stubs

Ninguno. Ningun dato del sandbox ni de muestra: toda cifra, cita, logo y enlace sale del doc o de las colecciones.

## Threat Flags

Ninguno nuevo. T-54-35 (enlaces del callToAction pasan por `resolveLinkHref`; el del auditor es `AUDITOR_URL` fijo con `rel="noopener noreferrer"`), T-54-36 (todo rich text por `MuiRichText`, sin HTML en crudo), T-54-37 (la prueba de ranuras exige que ningun bloque se pierda y `generic` cae al registro anterior), T-54-38 (cada lectura con `try` y `catch`) y T-54-39 (mismas funciones y argumentos de JSON-LD) quedan mitigados.

## Issues Encountered

Ninguno. Ninguna lectura de `.env` ni de la base fue necesaria; las autopruebas usan solo la API publica anonima.

## Next Phase Readiness

- Las cuatro landings estan listas para el repaso visual y de JSON-LD en 54-16.
- Los requisitos PAG-* no se marcan: la fase los verifica al cerrar.
- `ServiceDetailPage` ya es la unica vista de servicio; el indice `/servicios` es de otro plan.

## Self-Check: PASSED

- 14 archivos creados y 2 modificados verificados en disco.
- Commits `438ed8e`, `09c94dd` y `4bd3f6f` presentes en `git log`; `git rev-list --count` desde `plan_head_before` da 3.
