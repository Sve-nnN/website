---
phase: 54-paginas-de-conversion-y-utilidad
plan: 16
subsystem: verification
tags: [verify, preview, seo-parity, a11y, deploy, live-battery, dokploy]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: planes 01 a 15 (primitivas, vistas MUI, contenido sombra sembrado, scripts 54-* individuales)
provides:
  - 54-page-contract.mjs (contrato HTML por ruta y locale con paridad de SEO contra produccion)
  - 54-no-sandbox-data.mjs (auditoria estatica de datos y rutas del sandbox en src)
  - 54-faq-ssr.mjs (texto de acordeones cerrados en el HTML servido)
  - 54-run-all.mjs (--selftests con 31 pasos y --live con 14 pasos)
  - la rama feat/mui-redesign desplegada en el preview con la bateria en vivo en verde
affects: [fase 55, fase 56, fase 57]

plan_head_before: 26481e88296499aedc34245a736dddf059c28f91
actuals:
  tokens: 11900
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "La bateria en vivo corre cada script como proceso hijo y no se detiene en el primer fallo; el formulario de Contacto nunca se envia desde ella"
    - "Un marcador pendiente que CONTEXT permite renderizar es WARN solo en su ruta; cualquier otro es FAIL"
    - "El texto solo para lector de pantalla se define con '1px' y nunca con el numero 1: en sx un numero entre 0 y 1 es un porcentaje"

key-files:
  created:
    - scripts/verify/54-page-contract.mjs
    - scripts/verify/54-no-sandbox-data.mjs
    - scripts/verify/54-faq-ssr.mjs
    - scripts/verify/54-run-all.mjs
  modified:
    - scripts/verify/54-stack-ssr.ts
    - scripts/verify/53-computed-styles.mjs
    - src/components/shell/FooterView.tsx
    - src/components/shell/HeaderView.tsx
    - src/components/home/HomeView.tsx
    - src/components/mui/ScoreRing.tsx
    - src/components/mui/rich-text/MuiRichText.tsx
    - src/components/pages/contact/CopyEmailButton.tsx
    - src/components/pages/service/ServiceExtras.tsx
    - src/components/pages/stack/StackToolCard.tsx
    - .planning/phases/54-paginas-de-conversion-y-utilidad/deferred-items.md

key-decisions:
  - "Los encabezados de columna del pie pasan de h3 a h2: subir de nivel nunca rompe la jerarquia, y una pagina sin h2 (busqueda vacia) saltaba de h1 a h3"
  - "La fecha pendiente de aprendoclub en Sobre mi es WARN y no FAIL, solo en /sobre-mi y /en/sobre-mi, porque CONTEXT exige renderizarla tal como llega de Payload"
  - "El minimo de 100 palabras por narrativa (STACK-02) se agrega a 54-stack-ssr.ts y cierra el hueco de 54-14"

patterns-established:
  - "Un error de verificacion que toca el shell (pie, texto oculto) se corrige en el origen y no se relaja el verificador"

requirements-completed: []

duration: unas 2 h (incluye dos despliegues de unos 7 min cada uno)
completed: 2026-11-09
status: complete
---

# Phase 54 Plan 16: Bateria de verificacion y despliegue final Summary

**Cuatro scripts nuevos prueban la fase completa (contrato por ruta con paridad de SEO contra produccion, auditoria sin datos del sandbox, acordeones con texto en el HTML y un orquestador), la rama se empujo, el preview corre el SHA ce96ad3 y la bateria en vivo termina con 14 de 14 pasos en PASS tras corregir un desborde horizontal real y un salto de encabezados que la propia bateria destapo.**

## Performance

- **Duration:** unas 2 h (dos despliegues de Dokploy de unos 7 min cada uno, un crawl de paridad de unos 2 min por pasada)
- **Completed:** 2026-11-09
- **Tasks:** 3 de 3 (la 1 es tracer)
- **Files:** 4 scripts creados, 2 scripts y 8 archivos de src modificados

## Accomplishments

- `54-page-contract.mjs`: 30 rutas (15 en es y 15 en en). Por ruta exige estado 200, `lang`, un h1, encabezados sin saltos hacia abajo, un main, noindex en meta y cabecera con `EXPECT_PREVIEW=1`, cero marcadores pendientes, cero `lorem` y ningun activo `/img/` o `/logos/` que devuelva 404. La paridad con produccion compara title, description, canonical, el conjunto de hreflang y el conjunto de tipos ld+json (aplana `@graph`). Probado primero produccion contra produccion (5 rutas, PASS) antes de aplicarlo al preview. Los h2 y h3 con punto o coma salen como WARN (fallan solo con `--strict-headings`).
- `54-no-sandbox-data.mjs`: recorre 334 archivos de `src` sin importaciones de `designs` ni `@/data`, sin rutas `/img/` o `/logos/` sin archivo en `public/` y sin marcadores `{{texto}}`. Excluye el atajo `value={{ config }}` de JSX con un lookbehind (primer falso positivo, en `src/components/ui/chart.tsx`).
- `54-faq-ssr.mjs`: 12 rutas (home, contacto y cuatro landings, en es y en). Por cada resumen `MuiAccordionSummary-root` con `aria-controls` exige un elemento con ese id, con texto, y que el id sea unico. Exige al menos un acordeon por pagina.
- `54-run-all.mjs`: `--selftests` corre 31 pasos y `--live` corre 14 en el orden de RESEARCH; resume y sale con 1 si algo falla. `--no-wait` y `--verbose` como extras.
- `54-stack-ssr.ts` comprueba ahora el minimo de 100 palabras por narrativa (STACK-02) sobre el doc real: todas cumplen. Cierra el hueco que dejo 54-14.

## Task Commits

1. **Task 1 (tracer): contrato por ruta y locale con paridad de SEO** - `0b4e9e4` (test)
2. **Task 2: auditoria del sandbox, acordeones en el HTML y orquestador** - `7dacff6` (test)
3. **Task 3, correccion de codigo: texto oculto sin desborde y pie en h2** - `8820c1f` (fix)
4. **Task 3, correccion de verificadores: espera de dos cuadros y marcador conocido** - `ce96ad3` (test)

**SHA desplegado en juantech-preview:** `ce96ad333e2c84c32647a39b1d1ae82faab56615` (deploy `PYgAqy-I5nZmVRZiV_oIj`, estado `done`). `git log origin/feat/mui-redesign -1` coincide con `git rev-parse HEAD`. El primer push (`5fa327d..7dacff6`) llevo de golpe los planes 08 a 16; el segundo (`7dacff6..ce96ad3`) llevo las correcciones. Solo se empujo `feat/mui-redesign`; la app `web` de produccion de Dokploy no se toco.

## Verificacion

**Sin conexion al preview** (`54-run-all.mjs --selftests`): 31 de 31 pasos PASS, 0 FAIL. Incluye los selftest de los siete verificadores `.mjs`, la paridad de mensajes de 53 y de 54, la migracion aditiva (con su selftest), los 14 verificadores de render con `tsx` y la auditoria del sandbox. `npx tsc --noEmit` sin errores y `npm run build` con salida 0 antes de cada push.

**En vivo contra https://dev.juan-tech.com con PROD_BASE=https://juan-tech.com y EXPECT_PREVIEW=1** (`54-run-all.mjs --live`, segunda pasada, SHA ce96ad3): 14 de 14 pasos PASS, 0 FAIL.

| Paso | PASS | FAIL |
|------|------|------|
| 54-notfound-status --wait | 7 | 0 |
| 53-layer-check | salida 0 | 0 |
| 54-page-contract (30 rutas, paridad con produccion en 28 y dos rutas nuevas) | 60 | 0 (64 WARN) |
| 54-notfound-status | 6 | 0 |
| 54-dual-urls | 24 | 0 |
| 53-crawl-parity (sitemap de produccion contra preview) | 1 | 0 |
| 54-search | 9 | 0 |
| 54-stack-affiliate | 2 | 0 |
| 54-contact-form (sin enviar) | 8 | 0 |
| 54-faq-ssr | 12 | 0 |
| 54-about | 5 | 0 |
| 53-shell-contract | 2 | 0 |
| 53-computed-styles (REQUIRE_BUTTON=1) | 7 | 0 |
| 53-write-gates | salida 0 | 0 |

La primera pasada (SHA 7dacff6) dio 12 de 14: fallaron `54-page-contract` y `53-computed-styles`. Las causas y arreglos estan en Deviations. La paridad de title, description, canonical, hreflang y ld+json con produccion paso en las 28 rutas que existen en ambos sitios desde la primera pasada: no hay regresion de SEO. 53-crawl-parity confirma que ningun URL del sitemap de produccion cambia de estado.

**Criterios de ROADMAP cubiertos por evidencia ejecutable:** 1 (auditoria del sandbox, HTML sin marcadores, home con el contenido sembrado en el HTML: "Medición antes de tocar el código" y "Mi proceso de la auditoría a la medición"), 2 (servicios, landings, Lima, Madrid y busqueda en 200 en es y en; busqueda con resultados; URLs duales), 3 (sobre-mi en 200 en ambos idiomas y sin entrar al sitemap de produccion), 4 (formulario, FAQ y afiliados), 5 (Privacy, Terms y 404 con estado real).

## Supuesto A7 (rol juantech_preview_ro lee home_page* y about_page*)

**Confirmado, sin necesidad de GRANT.** Tras el despliegue de ce96ad3 y despues de la segunda pasada completa de la bateria, los logs del contenedor del preview (leidos por SSH, solo lectura) muestran 0 lineas `permission denied`, 0 `does not exist` y 0 lineas de las vistas (`[home]`, `[about]`, `[contact]`, `[services]`, `[stack]`, `[cta]`, `[search]`). Ademas la home sirve el contenido sembrado y no el respaldo vacio, y `/sobre-mi` sirve el timeline sembrado (con la fecha pendiente de aprendoclub tal como llega). El contenedor tiene 18 lineas de log en total; las unicas con la palabra error son dos `Failed to find Server Action "x"` (una peticion de accion invalida de una de las pruebas, no relacionada con permisos). Nota: el contenedor del primer despliegue (7dacff6) ya no existia cuando revise los logs tras su bateria, asi que la evidencia de A7 es la del segundo contenedor, que recibio una pasada completa. `df -h /` del VPS: 75% usado antes (19G libres) y 78% despues (16G libres), sin alarma.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Desborde horizontal en la home en todos los anchos (SC 1.4.10)**
- **Found during:** Task 3 (53-computed-styles, seccion overflow: scrollWidth 328 a 320 px, 916 a 900, 1040 a 1024, 1336 a 1280)
- **Issue:** el texto solo para lector de pantalla estaba definido con `width: 1, height: 1, margin: -1`. En `sx` de MUI un numero entre 0 y 1 es un porcentaje, asi que el span absoluto medía 100% del bloque contenedor y, dentro de un ancestro sin posicion, sobresalia del viewport (de 8 a 56 px). Los dos casos medidos estaban en `<p>` del Tagline y en un enlace de `#codigo`.
- **Fix:** `width: '1px'`, `height: '1px'`, `margin: '-1px'` en los ocho archivos que lo repetian (incluidos HeaderView y FooterView de la fase 53, que no desbordaban solo porque su ancestro era relativo).
- **Files modified:** `src/components/home/HomeView.tsx`, `src/components/mui/ScoreRing.tsx`, `src/components/mui/rich-text/MuiRichText.tsx`, `src/components/pages/contact/CopyEmailButton.tsx`, `src/components/pages/service/ServiceExtras.tsx`, `src/components/pages/stack/StackToolCard.tsx`, `src/components/shell/FooterView.tsx`, `src/components/shell/HeaderView.tsx`
- **Commit:** `8820c1f`

**2. [Rule 1 - Bug] Salto de encabezados h1 a h3 en /search y /en/search**
- **Found during:** Task 3 (54-page-contract)
- **Issue:** sin consulta, la busqueda no tiene h2 y las cinco columnas del pie usaban h3.
- **Fix:** los titulos de columna del pie pasan a `component="h2"` (subir de nivel nunca introduce un salto).
- **Files modified:** `src/components/shell/FooterView.tsx`
- **Commit:** `8820c1f`

**3. [Rule 1 - Bug] Medicion del foco antes de terminar la transicion del enlace de salto (verificador 53)**
- **Found during:** Task 3 (53-computed-styles, seccion focus: "parada 1 queda fuera del viewport", intermitente, 7 de 12 en una prueba aislada)
- **Issue:** con movimiento pausado las transiciones duran 0.01 ms pero no terminan en el mismo tick; el enlace de salto (`top` de -64 a 8 px al recibir el foco) se medía todavia fuera de pantalla. El foco si estaba en el elemento y 500 ms despues `top` valia 8 px: es una carrera de la prueba, no un defecto del enlace.
- **Fix:** el verificador espera dos cuadros de animacion antes de medir cada parada. Cuatro corridas seguidas en PASS.
- **Files modified:** `scripts/verify/53-computed-styles.mjs`
- **Commit:** `ce96ad3`

**4. [Rule 2 - Missing critical] Marcador pendiente permitido en Sobre mi**
- **Found during:** Task 3 (54-page-contract FAIL en /sobre-mi y /en/sobre-mi por `{{pendiente}} fecha del cambio de nombre`)
- **Issue:** el plan exige cero marcadores en todas las rutas, pero CONTEXT y el seed de 54-04 renderizan a proposito esa fecha tal como llega de Payload hasta la fase 56.
- **Fix:** lista `KNOWN_PENDING` por ruta: ese texto exacto es WARN solo en esas dos rutas; cualquier otro marcador, o ese en otra ruta, sigue siendo FAIL (con casos de autoprueba para los tres sentidos).
- **Files modified:** `scripts/verify/54-page-contract.mjs`
- **Commit:** `ce96ad3`

### Otras desviaciones menores

- El plan lista `54-migration-additive` entre los pasos `tsx`; el archivo es `.mjs`, asi que el orquestador lo corre con `node` (con y sin `--selftest`). Tambien se agrego `53-messages-parity` y las dos pasadas de `54-messages-parity`, y los `--selftest` de `54-no-sandbox-data`.
- `54-no-sandbox-data.mjs` tiene `--selftest` propio (no estaba en el plan).
- Para leer los logs del contenedor del preview por SSH use un archivo temporal en `/tmp` del VPS en la primera lectura (lo borre en el mismo comando); las lecturas siguientes fueron por tuberia. No se escribio nada mas en el VPS ni en ninguna base de datos, y no se leyo `.env`.
- Para esperar el despliegue use la API de Dokploy (`application.one`) y el ultimo elemento por `createdAt`, no el ultimo de la lista (la lista no viene ordenada). El script de espera de 54-notfound-status paso a la primera una vez desplegado.
- No hizo falta el preload de DNS: dev.juan-tech.com resolvio desde esta maquina.

## Gaps abiertos (con evidencia, no ocultos)

1. **El EN de las secciones sombra de la home y de Sobre mi sirve texto en espanol.** `curl https://dev.juan-tech.com/en` devuelve en h2 "Medición antes de tocar el código", "Servicios de SEO técnico y desarrollo", "Mi proceso de la auditoría a la medición", "Ingeniero de software que trabaja el SEO", "Clientes que trabajaron conmigo" y "Preguntas frecuentes", mezclados con h2 en ingles de bloques existentes ("Who I have worked with", "Real bugs, with the commit that fixes them"). El seed de 54-04 solo cargo `HOME_COPY_ES` y `ABOUT_COPY_ES`; el global cae al español por fallback de idioma. Ningun script de la bateria lo detecta porque los h2 en espanol pasan el contrato. Hace falta decidir y aprobar el copy EN (Juan) o mostrar el aviso de traduccion; queda como pendiente para la fase 56 o antes del corte de la 57.
2. **Heading con punto o coma (64 WARN, 36 textos unicos) para la fase 56**, listados abajo.
3. **Revisiones manuales** del bloque `human-check` del plan: ninguna se marca como hecha (ver lista de Juan).

## Para Juan

### (1) Claves nuevas del EN y cadenas sin aprobar de UI-SPEC (Pendiente 3)

Origen: Resumenes 54-03, 54-11 y 54-12. Todo el EN es una traduccion literal hecha por el planificador y necesita tu aprobacion en el UAT o en la fase 56.

| Clave | ES | EN |
|-------|----|----|
| `search.resultCount` | {count, plural, one {# resultado} other {# resultados}} | {count, plural, one {# result} other {# results}} |
| `search.submit` | Buscar en el sitio | Search the site |
| `search.fieldLabel` | Buscar | Search |
| `search.formAria` | Búsqueda en el sitio | Site search |
| `search.blogLink` / `search.casesLink` | Blog / Casos de éxito | Blog / Case studies |
| `services.index.talkCta` | Hablar con Juan | Talk to Juan |
| `services.index.viewService` | Ver servicio | View service |
| `notFound.writeToJuan` | Escribir a Juan | Write to Juan |
| `common.translationNotice.text` | Esta página todavía no está disponible en inglés. Estás viendo el contenido en español. | texto del aviso del sandbox |

Tambien tienen EN literal sin aprobar los namespaces `common`, `home`, `services`, `about`, `contact`, `stack` y `legal` (lista completa por namespace en la seccion "Revisión de Juan" de `54-03-SUMMARY.md`), por ejemplo "I usually reply within 48 hours." y el cierre de la tabla de servicios.

### (2) Decisiones de la spec que puedes revertir

1. Orden de la home: los tres bloques existentes (codigo, auditor, oferta de auditoria) van despues de Vitals, Casos y Testimonios.
2. Marquesina de logos estatica cuando el movimiento esta en pausa.
3. Chips-enlace de 40 px en lugar de los 24 px del sandbox.
4. Escala de tipografia de 4 tamaños (12, 14, 16 y 20) y pesos 400 y 600 (Chip y mono bajaron de 500 a 400 en `src/theme/theme.ts`; se revierte con una linea).
5. `rel="sponsored nofollow noopener"` en vez de `sponsored noopener`.
6. Ruta `/sobre-mi` igual en ambos idiomas.
7. Contador "4+ años" oculto mientras `authors.yearsExperience` sea `null`.
8. Formulario de Contacto sin select de servicio ni campo de sitio web.
9. h1 de Contacto = titulo del doc ("Contacto" / "Contact") y sin lead, porque el copy "Charlemos sobre tu próximo proyecto" no esta en Payload.
10. Chips "Donde lo use" muestran la ruta (`/case-studies`) y no las etiquetas del sandbox, a falta del EN aprobado.
11. Pie: titulos de columna ahora son h2 (cambio de este plan, reversible en `FooterView.tsx`).

### (3) Pendientes que cierra la fase 56

- **Marcadores pendientes:** `{{pendiente}} fecha del cambio de nombre` (aprendoclub, Sobre mi, ES y EN); en produccion siguen `[PLACEHOLDER]` en Lima (dos estadisticas y la cita) y en Madrid (todo), que las vistas filtran y nunca pintan.
- **Copy EN de las secciones sombra** de home y Sobre mi (gap 1).
- **Textos legales** (Privacy y Terms: fecha de ultima actualizacion sin fuente, texto de infraestructura).
- **Alt de las fotos** de Sobre mi (borrador que confirmaste, revision final en 56) y de las fotos #76 a #79.
- **Encabezados con punto o coma** que imprimio `54-page-contract` (h2 y h3, es y en):
  - Home: "Errores reales, con el commit que los corrige"; "Desarrollo con Next.js y Payload".
  - Servicios: "También tengo un auditor automatizado, gratis"; "Migración a Next.js sin perder tráfico orgánico" (en las cuatro landings); "El informe envejece, el sitio no deja de cambiar"; "Si tu contenido no es citable, la respuesta cita a otro"; "¿Por qué Next.js/Payload en vez de WordPress?"; "¿Qué es exactamente el archivo llms.txt?"; "What I'd choose today, starting from zero"; "Do you just hand off a report, or do you also implement the fixes?".
  - Stack: "Desarrollo, CMS y medios" y su EN.
  - Privacy y Terms: todos los h2 numerados ("1. Información que Recopilamos" a "8. Retención y Baja", y "1. Aceptación de los Términos" a "5. Contacto"), en es y en.
  - Resultados de busqueda con titulos de articulos y casos (por ejemplo "Estrategia SEO Global 2026: Arquitectura, Contenido y Autoridad"); son titulos de contenido, no de plantilla.
  - Salida completa: `54-page-contract.mjs` (64 WARN).

### Revisiones manuales abiertas (human-check, no bloqueantes; las recoge el UAT)

No las marque como hechas.

1. Lectores de pantalla (NVDA con Firefox y VoiceOver con Safari) sobre acordeones, timeline de Sobre mi, formulario de Contacto y estados `aria-live`.
2. Revision visual en el preview a 375, 900, 1024 y 1280 px, zoom de 200 % y 320 px. La bateria midio overflow y foco con Chromium en los cuatro anchos de la home y no hubo desborde, pero la revision de tablas, collage de Sobre mi y objetivos tactiles de 40, 44 y 56 px es visual. Tambien: foco no tapado por el header en Servicios de la home, Stack y Legal, y contraste del texto secundario del nav sobre el blob mas claro de cada hero.
3. Criterio 1 de ROADMAP, revalidacion: edita en el admin real un campo que master ya conoce (un testimonio, un cliente o el titulo de un servicio), espera de 60 a 120 s y recarga el preview.
4. Revisar las tres listas de arriba. El correo real de Contacto se prueba una sola vez contra produccion en la fase 57; esta bateria nunca envio el formulario.

## Authentication Gates

Ninguno.

## Known Stubs

Ninguno nuevo. Los marcadores `[PLACEHOLDER]` de Lima y Madrid siguen en la base de produccion y las vistas no los pintan; la fecha de aprendoclub se renderiza a proposito (CONTEXT).

## Threat Flags

Ninguno: no hay endpoints, rutas ni accesos a archivos nuevos. T-54-67 mitigado (la bateria corre `54-contact-form.mjs` sin `--submit`, el orquestador no lo pasa), T-54-68 (54-about cuenta sobre-mi en el sitemap de produccion: PASS), T-54-69 (paridad de metadatos en 28 rutas y crawl de estados: PASS), T-54-71 (53-write-gates PASS y 0 `permission denied` en los logs del preview). T-54-70 aceptado: las pruebas de render que descargan docs publicos pasaron en las dos corridas.

## Self-Check: PASSED

- Archivos creados: `54-page-contract.mjs`, `54-no-sandbox-data.mjs`, `54-faq-ssr.mjs` y `54-run-all.mjs` existen en `scripts/verify/`.
- Commits `0b4e9e4`, `7dacff6`, `8820c1f` y `ce96ad3` presentes en `git log`; `origin/feat/mui-redesign` apunta a `ce96ad3`.
