---
phase: 56-contenido-pendiente-de-juan
plan: 09
subsystem: content-data
tags: [home-copy, contact-copy, cta-lote1, en-copy, d-14, d-15, d-22, d-23]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: 56-options-home (D-22a a D-22g), 56-cta-lote1 y 56-juan-inputs.json (plan 56-02), 56-content-decisions y 56-gate (plan 56-01)
provides:
  - 56-home-copy.ts con buildHomeCopy(locale), HOME_COPY_ES, HOME_COPY_EN y la decision HOME-EN
  - 54-home-copy.ts convertido en reexport de HOME_COPY_ES (SANDBOX_LOGOS y ON_DARK_FILES se quedan)
  - Tabla del lote 1 de CTAs aprobada por Juan cargada en el archivo de entrada y en el JSON (resuelve las filas pendientes de 56-02)
  - 56-home-copy-selftest con D-23, paridad ES y EN, centinela, cierre, rayas, marcadores y href
affects: [56-12, 56-13, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "El copy se arma desde constantes de decision: cambiar la eleccion es cambiar una linea de textos-pendientes-juan.md y regenerar el JSON"
    - "Los valores que se quitan viajan como cadena vacia, no como clave omitida, porque mergeGroup conserva las claves que el copy no trae"
key-files:
  created:
    - scripts/db/data/56-home-copy.ts
    - scripts/verify/56-home-copy-selftest.ts
  modified:
    - scripts/db/data/54-home-copy.ts
    - scripts/verify/54-home-ssr.ts
    - scripts/verify/56-home-inputs-selftest.ts
    - .planning/phase-56-prep/textos-pendientes-juan.md
    - scripts/db/data/56-juan-inputs.json
key-decisions:
  - "Los dos checkpoint:decision del plan (elecciones D-22 y aprobacion del lote 1) quedan resueltos por aprobaciones-juan.md y opciones-home.md: no se volvio a preguntar a Juan"
  - "El hero sale sin estadistica (D-22c ninguna): statValue y statCaption van como cadena vacia y Hero.tsx no pinta la tarjeta"
  - "Las notas Bueno: hasta se quitan con note vacio, no omitiendo la clave: mergeGroup dejaria vivas las de la base"
  - "El EN de la home y de Contacto queda propuesto con gate aprobado (HOME-EN): traduccion fiel, espera la aprobacion de Juan antes de que 56-12 lo siembre"
requirements-completed: []
duration: 35min
completed: 2026-11-10
status: complete
commits: 2
plan_head_before: db207940f10e96da2058bf339139bf828548716e
actuals:
  tokens: 11000
  tasks: 2
  commits: 2
---

# Phase 56 Plan 09: Copy ES y EN de la home y de Contacto Summary

El copy de la home y de Contacto se arma ahora desde las decisiones de Juan y la tabla del lote 1: titulo A en dos lineas, sin cifra en el hero, tagline 2, medicion 3 y 2, servicios 3, item SEO tecnico nuevo, cierre de D-15, sin notas "Bueno: hasta" ni frase de Googlebot. El EN es traduccion fiel en estado propuesto. Cero escrituras a la base y cero acceso a ella.

## Que quedo hecho

**Resolucion previa de 56-02 (commit 834196d).** La tabla del lote 1 que Juan aprobo ("del resto lo veo bien", un solo cambio en la fila 3) estaba solo en `aprobaciones-juan.md`. Se cargo en `textos-pendientes-juan.md` y se regenero `56-juan-inputs.json`: 22 filas, 14 aprobadas con ES y EN. Las 13 filas de la tabla se reparten asi:
- Fila 1 (boton del hero y del encabezado) cubre `hero-cta` y `header-cta`.
- Filas 2 a 6, 7 y 9 mapean a `cierre-titulo`, `cierre-lead`, `services-cta`, `cases-cta`, `sites-cta`, `services-index-talk` y `auditor-cta`.
- Filas 8, 10, 11, 12 y 13 no tenian id y se crearon: `service-card-cta`, `auditor-notice-cta`, `stack-tool-link`, `stack-amazon` y `contact-response-note`, con su origen en messages o en la sombra home-page.
- Siguen pendientes: `contact-step-1..3` (lote 2), `audit-offer-cta`, `contact-write-email`, `contact-submit`, `emailcapture-submit` y `newsletter-submit`.
- La autoprueba de 56-02 se actualizo al nuevo conteo (22 filas, 14 aprobadas).

**Task 1 (tracer) y Task 2 (EN), commit 570c3f0.**
- `56-home-copy.ts`: `buildHomeCopy(locale)` arma todo con `resolveDecision` y las filas del lote 1; lo que Juan no pidio cambiar se conserva verbatim del copy de la 54.
- `hero.titleLine1/2`: "Consultor SEO técnico" / "que también programa" (EN "Technical SEO consultant" / "who also codes"). `splitHeroTitle` divide tambien las opciones B a E sin perder texto, por si Juan cambia de opcion.
- Hero sin estadistica. La etiqueta "Ingeniero de software" se conserva (decision de Juan).
- Medicion: titulo 3, texto 2, notas vacias, descripciones de LCP, CLS, TBT y TTFB intactas.
- Servicios: lead 3 e item SEO tecnico con el texto nuevo; `stripGooglebot` queda como red de seguridad si una decision cae al valor vigente.
- Cierre: titulo "Hablemos de tu sitio" y lead de D-15 exacto en ES y EN.
- EN: traduccion fiel de tagline, hero, vitals, services, cases, process, sites, about, testimonials, faq, cta y contact (pasos, filas de informacion). Omite icon, tags, servicePage, porcentajes y ctaHref. Tagline y hero.lead EN siempre llenos (centinela de cache.ts).
- `54-home-copy.ts` reexporta `HOME_COPY_ES`; `54-home-ssr.ts` ya no fija la cifra +406 ni las notas viejas (la tarjeta de cifra es opcional y se comprueba que no sobreviva "Bueno: hasta").
- `56-home-copy-selftest.ts`: 59 casos PASS.

## Verificacion

- `tsx 56-home-copy-selftest.ts`: PASS (todos los casos, ES y EN).
- `tsx 54-seed-selftest.ts`, `54-home-ssr.ts`, `54-home-b-ssr.ts`, `54-contact-ssr.ts`, `55-home-fallback-ssr.ts`: PASS.
- `tsx 56-home-inputs-selftest.ts`, `node 56-inputs-check.mjs --selftest`: PASS.
- `node 56-content-guard.mjs --data` y sin banderas: PASS (15 archivos de datos).
- `npx tsc --noEmit`: sin errores.
- `56-review-export.ts --only D-22` y `--only HOME-EN`: imprimen valores, opciones y el EN completo para revision.
- `56-gate.ts`: HOME-EN aparece como INFO (propuesto con gate aprobado). Sin problemas de forma.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Notas y estadistica vacian con cadena vacia, no omitiendo la clave**
- **Found during:** Task 1.
- **Issue:** el plan dice "omite la clave note". `mergeGroup` de `54-seed-lib.ts` conserva las claves que el copy no trae, asi que la siembra de 56-12 habria dejado vivas las notas "Bueno: hasta" y el +406 % en la base.
- **Fix:** `note`, `statValue` y `statCaption` van como `''`; la autoprueba exige que las notas esten vacias y que ninguna cadena diga "Bueno: hasta". Vitals.tsx y Hero.tsx solo pintan cuando hay texto.
- **Files modified:** `56-home-copy.ts`, `56-home-copy-selftest.ts`, `54-home-ssr.ts`
- **Commit:** 570c3f0

**2. [Rule 3 - Blocking] La tabla del lote 1 traia 5 filas sin id en el archivo de entrada**
- **Found during:** resolucion de 56-02.
- **Issue:** las filas 8, 10, 11, 12 y 13 (tarjeta de servicio, aviso del auditor, enlaces del stack, nota de respuesta) no estaban entre los 17 ids.
- **Fix:** cinco ids nuevos con su origen verificado en `messages/es.json`; el lote pasa de 17 a 22 filas.
- **Commit:** 834196d

**3. [Rule 1 - Bug] Placeholder `{tool}` en la fila 11**
- **Issue:** la tabla escribe "Probar {herramienta}", pero el mensaje real usa `{tool}`; copiarlo tal cual rompe el ICU.
- **Fix:** se cargo "Probar {tool}" y "Try {tool}".
- **Commit:** 834196d

**4. [Rule 2 - Missing critical] Autoprueba de 56-02 y de 54-home-ssr actualizadas**
- 56-home-inputs-selftest fijaba 17 filas; 54-home-ssr fijaba statValue y las notas. Se ajustaron solo esas comprobaciones.

### Notas de proceso

- Task 1 y Task 2 van en un solo commit (570c3f0): el constructor ES y el EN viven en el mismo archivo y la autoprueba cubre ambos, asi que no habia un corte limpio sin dejar el tracer a medias.
- `commits: 2` es el conteo propio. `git rev-list` desde `plan_head_before` cuenta mas porque 56-08, 56-10 y 56-11 corren en la misma rama.
- Las dos tareas `checkpoint:decision` no pararon: Juan ya respondio en `aprobaciones-juan.md`.

## Auth gates

Ninguno. El plan no abre la base ni la red.

## Known Stubs

Ninguno. Las filas del lote 1 sin texto son datos pendientes (estado `pendiente`), no stubs.

## Threat Flags

Ninguno. T-56-29 mitigado (el copy es subconjunto del global y no trae title ni meta); T-56-30 (ninguna opcion ni cifra inventada); T-56-31 (ctaHref solo `#contacto`, autoprueba rechaza esquemas no permitidos); T-56-32 (tagline EN siempre lleno y verificado).

## Items para Juan

1. **Copia EN de la home y de Contacto (HOME-EN):** traduccion fiel en estado propuesto. Se lee con `node_modules/.bin/tsx scripts/verify/56-review-export.ts --only HOME-EN`. Hasta que la apruebes, el gate de la fase 57 la marca y 56-12 no debe sembrarla.
2. **Pasos de Contacto (contact-step-1..3):** siguen con el texto vigente en ES. Mi traduccion EN propuesta es "You tell me about the project", "I look at what Google sees today" y "I tell you where to start". Pendientes de tu aprobacion.
3. **Boton del encabezado:** la fila 1 de tu tabla dice "Botón del hero y del encabezado". Cargue `header-cta` con "Pedir auditoría 360" / "Request a 360 audit", que reemplaza al "Hablemos" actual. Se carga en el corte; confirma que es lo que querias.
4. **Siembra (56-12):** como el hero queda sin cifra y sin notas, la siembra debe enviar `statValue`, `statCaption` y las `note` vacias (ya vienen asi en el copy). Verifica en vivo que ya no aparece el +406 % ni "Bueno: hasta".
5. **audit-offer-cta ("Pedir la auditoría"), correo, envio del formulario, checklist y newsletter:** no estaban en la tabla aprobada y siguen pendientes.

## Self-Check: PASSED

Archivos presentes: `56-home-copy.ts`, `56-home-copy-selftest.ts`, `54-home-copy.ts`, `54-home-ssr.ts`, `56-home-inputs-selftest.ts`, `textos-pendientes-juan.md`, `56-juan-inputs.json`. Commits 834196d y 570c3f0 presentes en la rama feat/mui-redesign.
