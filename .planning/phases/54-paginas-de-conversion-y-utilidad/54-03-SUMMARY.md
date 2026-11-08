---
phase: 54-paginas-de-conversion-y-utilidad
plan: 03
subsystem: ui
tags: [next-intl, messages, i18n, ssr-harness, parity-guard, mui]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 01 (namespace notFound, scripts 54-*) y plan 02 (globals sombra con el copy de contenido)
provides:
  - namespaces common (ampliado), home (ampliado), services, about, contact, stack, legal y search en messages/es.json y messages/en.json
  - 54-messages-parity.mjs, guardia de paridad es y en con reglas de voz y autoprueba
  - 54-ssr-harness.ts, arnés de render de servidor con tema real, next-intl y mensajes reales
affects: [54-04, 54-05, 54-06, 54-08, 54-09, 54-10, 54-11, 54-12, 54-13, 54-14, 54-15, 54-16]

plan_head_before: f086eb28ec3bfe8ec0f00dab8763396c1f34ef27
actuals:
  tokens: 8900
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Cadenas de interfaz en messages y contenido en Payload: las vistas no llevan texto en constantes"
    - "Autoprueba de vistas sin base de datos: renderToHtml(createElement(...)) con el tema y los mensajes reales"
    - "Guardia de paridad por namespaces con extractor ICU que entiende plurales"

key-files:
  created:
    - scripts/verify/54-messages-parity.mjs
    - scripts/verify/54-ssr-harness.ts
  modified:
    - messages/es.json
    - messages/en.json

key-decisions:
  - "search.errorHeading conserva su nombre (lo consume 54-11) y queda en una lista de exenciones de la regla de encabezados, porque su valor es una oracion existente con punto que se muestra en un Alert, no un encabezado"
  - "Las claves common.copyEmail y common.emailCopied se reutilizan desde contact y CtaPanel en lugar de duplicarse en contact"
  - "El conteo de resultados usa la variable ICU count con plural one y other; el de asistentes tambien"
  - "Los nombres de clave que los planes 54-08 a 54-15 ya citan (home.vitals.ariaLabel, home.areasLabel, services.index.*, services.detail.*, stack.chip.*, about.dateRange*, about.timelineLabel, about.crumb, contact.eyebrow) quedaron fijados tal cual"

patterns-established:
  - "Un plan de vista que necesite una clave nueva la agrega a messages y debe pasar 54-messages-parity.mjs"
  - "Un Accordion de MUI aporta un h3 en cada resumen; el arnés lo cuenta como encabezado"

requirements-completed: []

duration: 25min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 03: Mensajes de la fase, guardia de paridad y arnés de render Summary

**Todo el vocabulario de interfaz de la fase en ES y EN (nueve namespaces), una guardia de paridad con reglas de voz y un arnés de render de servidor con el tema real, para que los planes de vista prueben estructura sin base de datos y no compitan por los dos JSON.**

## Performance

- **Duration:** unos 25 min
- **Completed:** 2026-11-08
- **Tasks:** 2 de 2
- **Files:** 2 creados, 2 modificados

## Accomplishments

- `54-ssr-harness.ts` exporta `renderToHtml(element, locale)`, `countOf`, `hasId`, `headingLevels` y `textOf`. Su autoprueba demuestra que `useTranslations('common')` resuelve `breadcrumbHome` desde los archivos reales ("Inicio" en ES, "Home" en EN), que el `Link` de `@/i18n/navigation` renderiza `/servicios` en ES y `/en/servicios` en EN, y que el texto de un panel de Accordion cerrado está en el HTML.
- `54-messages-parity.mjs` revisa common, home, services, about, contact, stack, legal, search y notFound. Comprueba mismo conjunto de claves, valores no vacíos, mismas variables ICU y misma forma de plural, ausencia de guion largo y corto, ausencia de marcadores de llaves dobles y que las claves que terminan en Heading o Title no lleven punto ni coma. Su autoprueba usa un fixture válido y cuatro defectuosos del plan (clave ausente, variable distinta, guion largo, coma en Title), más tres casos extra (marcador pendiente, exención de errorHeading, namespace requerido ausente).
- Namespaces escritos en los dos idiomas, solo con cadenas de interfaz (etiquetas, nombres accesibles, estados, columnas, cabeceras fijas); títulos, leads, pasos y preguntas siguen viviendo en los globals de Payload del plan 54-02.
- `shell`, `stackPage`, `affiliateDisclosure`, `serviceScopeCard`, `relatedCaseStudyBlock`, `auditorCallout`, `testimonialsCarousel` y `notFound` no se tocaron. `53-messages-parity.mjs` sigue en OK.

## Task Commits

1. **Task 1 (tracer): guardia de paridad, arnés de render y namespaces common y search** - `73cec0a` (feat)
2. **Task 2: namespaces home, services, about, contact, stack y legal** - `5b49ccd` (feat)

La rama NO se empujó.

## Verificación

- `tsx scripts/verify/54-ssr-harness.ts --selftest`: PASS.
- `node scripts/verify/54-messages-parity.mjs --selftest`: PASS (9 casos).
- `node scripts/verify/54-messages-parity.mjs`: PASS para los nueve namespaces.
- `node scripts/verify/53-messages-parity.mjs`: OK.
- Los tres criterios de aceptación de la tarea 2 y los dos de la tarea 1 salen 0.
- `npx tsc --noEmit`: exit 0.

## Revisión de Juan: cadenas EN y cadenas sin aprobar

Según UI-SPEC (Pendiente 2 y 3), todo el EN de abajo es una traducción literal y simple, hecha por mí, que Juan debe aprobar en el UAT o en la fase 56. La traducción de `search.typeLabels`, `search.noResultsHeading`, `search.noResultsBody`, `search.errorHeading` y `search.placeholder` sale tal cual de la constante `copy` de `search/page.tsx` (copy existente en EN, ya aprobado).

**Cadenas nuevas sin aprobar de UI-SPEC (Pendiente 3), también en ES:**

| Clave | ES | EN |
|-------|----|----|
| `search.resultCount` | "{count, plural, one {# resultado} other {# resultados}}" | "{count, plural, one {# result} other {# results}}" |
| `search.submit` | "Buscar en el sitio" | "Search the site" |
| `services.index.talkCta` | "Hablar con Juan" | "Talk to Juan" |

"Escribir a Juan" ya existe como `notFound.writeToJuan` (plan 54-01), con EN "Write to Juan".

**Cadenas ES que escribí yo (no vienen literales del sandbox ni de UI-SPEC), de interfaz y funcionales:**

- `search.formAria` ("Búsqueda en el sitio", nombre accesible del formulario), `search.blogLink` y `search.casesLink` (nombres del nav).
- `common.translationNotice.text` en ES ("Esta página todavía no está disponible en inglés. Estás viendo el contenido en español."). El EN es el texto del aviso del sandbox. `common.translationNotice.link` es "Ver en español" en ambos idiomas, a propósito (el enlace lleva `lang="es"`).
- `home.vitals.groupLabel`, `home.taglineLabel` (el sandbox decía "Lo que prometo"), `home.marquee.groupLabel` ("Logos de clientes", del sandbox), `home.codeFixes.regionLabel` ("Código del arreglo {name}"), `home.sites.scoresLabel` ("Puntajes de PageSpeed en móvil", del sandbox).
- `services.detail.durationLabel` ("Duración") y `stack.toolsLabel` ("Herramientas de {category}").
- `contact.sectionLabel` ("Formulario y datos de contacto", del sandbox), `contact.cta.sectionLabel` ("Contacto", del sandbox), `contact.cta.formLabel` ("Formulario de contacto") y `contact.form.honeypotLabel` ("Sitio web de la empresa", el campo trampa es invisible y aria-hidden).
- `legal.tocAria` ("Índice del documento").

**Claves nuevas con su EN, por namespace (todas literales y simples):**

- `common`: Ruta de navegación / Breadcrumb; se abre en otra pestaña / opens in a new tab; se abre en otra pestaña, enlace de afiliado / opens in a new tab, affiliate link; Paso {n} / Step {n}; Ver servicio / View service; Temas / Topics; Copiar correo / Copy email; Correo copiado / Email copied.
- `home`: Áreas / Areas; Lo que prometo / What I promise; retrato ASCII / Portrait of Juan Carlos Angulo drawn with ASCII characters; Logos de clientes / Client logos; plantilla de Vitals ("{name} for juan-tech.com: {label}, within the good range"); Captura de {domain} / Screenshot of {domain}; nota de PageSpeed con {date}; de 100 / out of 100; Rendimiento, Accesibilidad, Buenas prácticas / Performance, Accessibility, Best practices; "{role} de {company}" / "{role} at {company}".
- `services`: Lo que hago / What I do; Qué servicio es para ti / Which service is for you; columnas Servicio, Te sirve si, Qué vas a lograr, Tiempo estimado / Service, It fits if, What you will achieve, Estimated time; cierre de la tabla ("Not sure which service you need? Tell me what problem you have and I'll tell you where to start."); Servicio, Preguntas frecuentes, Otros servicios / Service, Frequently asked questions, Other services.
- `about`: Sobre mí / About me; Ver servicios / View services; Mi stack / My stack; Recorrido profesional / Professional timeline; por {name} / by {name}; "{from} a {to}" / "{from} to {to}"; "{from} a hoy" / "{from} to today"; plural de asistentes.
- `contact`: Hablemos / Let's talk; Correo / Email; Escribir un correo / Write an email; "¿Todavía no sabes cuál servicio necesitas?" / "Still don't know which service you need?"; Mira los servicios / See the services; todo el bloque `form.*` (título, etiquetas, cuatro errores, éxito, fallo con {email}) y `cta.responseNote` ("I usually reply within 48 hours.").
- `stack`: Herramientas / Tools; Categorías del stack / Stack categories; chips "Enlace de afiliado" / "Affiliate link" y "Sin programa de afiliados" / "No affiliate program".
- `legal`: Legal / Legal; En este documento / In this document; Índice del documento / Document index.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El plan pedía `search.errorHeading` y a la vez prohibía punto en claves Heading**
- **Found during:** Tarea 1 (diseño de la guardia)
- **Issue:** el valor movido desde `search/page.tsx` es una oración ("La búsqueda no está disponible por el momento. Intenta de nuevo en unos minutos.") y lleva punto; la regla del plan lo habría marcado como FAIL. El plan 54-11 ya consume la clave con ese nombre y UI-SPEC lo cita así.
- **Fix:** la guardia lleva una lista explícita `HEADING_RULE_EXEMPT = ['search.errorHeading']` con la razón en un comentario. La autoprueba cubre ambos sentidos (con exención pasa, sin exención falla). El texto no se cambió porque es copy existente aprobado.
- **Files modified:** `scripts/verify/54-messages-parity.mjs`
- **Commit:** `73cec0a`

**2. [Rule 1 - Bug] El primer chequeo de marcadores `{{ }}` marcaba como defecto cualquier plural ICU**
- **Found during:** Tarea 1 (primera corrida de la autoprueba de la guardia)
- **Issue:** un plural válido termina en `}}` ("... other {# resultados}}"), así que buscar el cierre doble suelto daba falsos positivos.
- **Fix:** el marcador pendiente es ahora la expresión `{{texto sin llaves}}`; un plural nunca la cumple.
- **Files modified:** `scripts/verify/54-messages-parity.mjs`
- **Commit:** `73cec0a`

**3. [Rule 1 - Bug] Dos fallos de la autoprueba del arnés en la primera corrida**
- **Found during:** Tarea 1
- **Issue:** `useTranslations` registraba `ENVIRONMENT_FALLBACK` por falta de `timeZone`, y los niveles de encabezado daban `[3,1,2,3]` porque el resumen del Accordion de MUI ya viene envuelto en un h3.
- **Fix:** el proveedor lleva `timeZone: 'UTC'`; la autoprueba mide los encabezados sobre un fragmento aparte y afirma que el Accordion aporta un h3.
- **Files modified:** `scripts/verify/54-ssr-harness.ts`
- **Commit:** `73cec0a`

**4. [Ajuste de alcance, sin riesgo] La guardia exige los nueve namespaces solo desde la tarea 2**
- En la tarea 1 la lista requerida eran common, search y notFound (los únicos presentes); la tarea 2 la amplió a los nueve junto con los namespaces. El plan pedía que el verify de la tarea 1 pasara con la guardia sin namespaces aún escritos.

**Total:** 3 correcciones automáticas dentro de los scripts de verificación y un ajuste de orden. Sin impacto en producción.

## Authentication Gates

Ninguno. No se tocó ninguna base de datos ni se empujó la rama.

## Known Stubs

Ninguno. Todas las claves tienen valor ES y EN reales; los textos sin aprobar están listados arriba para revisión.

## Threat Flags

Ninguno nuevo. T-54-10 mitigado: la guardia compara variables ICU y forma de plural por clave en los dos idiomas, y next-intl escapa los valores al renderizar. T-54-11 aceptado: el correo solo viaja como variable `{email}`.

## Next Phase Readiness

- Los planes de vista pueden usar `renderToHtml` del arnés en sus autopruebas (importar con ruta relativa desde `scripts/verify`, correr con `node_modules/.bin/tsx`).
- Si un plan de vista necesita una clave que falta, la agrega a ambos JSON y corre `node scripts/verify/54-messages-parity.mjs`.
- No empujar la rama hasta que 54-07 aplique la migración.

## Self-Check: PASSED

- Archivos verificados en disco: `scripts/verify/54-messages-parity.mjs`, `scripts/verify/54-ssr-harness.ts`, `messages/es.json`, `messages/en.json`.
- Commits `73cec0a` y `5b49ccd` presentes en `git log`.
