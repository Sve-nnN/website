---
phase: 54-paginas-de-conversion-y-utilidad
plan: 13
subsystem: ui
tags: [mui, mui-lab, timeline, about, sobre-mi, shadow-content, preview-only-nav, ssr-selftest]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 05 (PageHero, Section, GrainBlob, lists, links, TranslationNotice, CtaSection), plan 07 (global about-page sembrado y foto de Sobre mi, media 76) y plan 04 (copy ABOUT_COPY_ES)
provides:
  - "@mui/lab 9.0.0-beta.10 con version exacta (solo Timeline y sus partes, solo en AboutView)"
  - getAboutData, assembleAboutData, formatDateRange, splitParagraphs y splitTalkTitle en src/lib/about-data.ts
  - AboutView, vista MUI de Sobre mi con timeline, areas, educacion, ponencias y cierre
  - Ruta /sobre-mi y /en/sobre-mi (ISR, metadata de Payload, canonical e hreflang, sin JSON-LD y fuera del sitemap)
  - Enlace Sobre mi del nav inyectado solo con isPreviewReadonly()
  - 54-about-ssr.ts (75 comprobaciones) y 54-about.mjs (contrato HTTP, desborde a 320px y sitemap live, con selftest)

affects: [54-14, 54-16, 56, 57]

plan_head_before: 24af0ec60f234ca62b6f674ab8aeb14b7787a6eb
actuals:
  tokens: 17500
  tasks: 3
  commits: 3

tech-stack:
  added:
    - "@mui/lab 9.0.0-beta.10 (exacta)"
  patterns:
    - "El mapeador es una funcion pura exportada (assembleAboutData) y el lector que toca el CMS (getAboutData) protege cada fuente por separado con guarded(): un fallo deja solo esa seccion en null"
    - "La fecha de una etapa viaja como texto y nunca entra a un atributo: la autoprueba lo comprueba con una regex sobre aria-label, title y aria-labelledby"
    - "Un contrato HTTP exporta su funcion de chequeo y la autoprueba de render le pasa el HTML real de la vista (patron de 54-11 y 54-12)"

key-files:
  created:
    - src/lib/about-data.ts
    - src/components/pages/AboutView.tsx
    - "src/app/(frontend)/[locale]/sobre-mi/page.tsx"
    - scripts/verify/54-about-ssr.ts
    - scripts/verify/54-about.mjs
  modified:
    - package.json
    - package-lock.json
    - src/components/shell/SiteHeader.tsx

key-decisions:
  - "@mui/lab compila con Next 15.4.11 (supuesto A5 confirmado): npm run build termina en 0 y la ruta pesa 9.7 kB mas 213 kB de primera carga"
  - "La aprobacion del checkpoint de legitimidad fue delegada por Juan al orquestador; la evidencia queda abajo y la reversion es npm uninstall @mui/lab"
  - "Sobre mi vive en el global about-page y nunca en pages: el sitemap no se toca y 54-about.mjs exige cero apariciones de sobre-mi en el sitemap de produccion"
  - "El enlace del nav se inyecta en SiteHeader (servidor) y no en el global Header, que se comparte con produccion"
  - "Las ponencias van siempre en lang es en la pagina EN porque speaking-events no se localiza"

patterns-established:
  - "Seccion sin titulo o sin items no se dibuja: ni h2 huerfano ni lista vacia"
  - "dl de contadores con dt primero en el codigo fuente y la cifra primero en pantalla por order, para que el lector lea etiqueta y valor en un orden valido"

requirements-completed: []

duration: 14min
completed: 2026-11-09
status: complete
---

# Phase 54 Plan 13: Sobre mi con timeline Summary

**Sobre mi sale de un global privado, de authors, de speaking-events y del conteo de clientes, con un Timeline de @mui/lab, la foto nueva con alt de Media y un enlace de nav que solo existe en el preview; el sitemap live y el global Header quedan intactos.**

## Performance

- **Tasks:** 3 de 3 (la Tarea 1 era el checkpoint de legitimidad, resuelto por delegacion)
- **Commits de codigo:** 3, medidos contra `plan_head_before` (`24af0ec`)
- **Files:** 5 creados, 3 modificados

## Accomplishments

- **Tarea 1 (checkpoint de legitimidad):** aprobado por delegacion, evidencia en la seccion siguiente.
- **Tarea 2 (tracer):** instalacion exacta de `@mui/lab`, `getAboutData`, `AboutView` con PageHero, foto, bio, contadores y Timeline, y la ruta `/sobre-mi`. Compila con Next 15.4.11.
- **Tarea 3:** areas en franja, educacion, ponencias, cierre con `CtaSection`, aviso EN, enlace del nav solo en el preview y el contrato `54-about.mjs`.
- **Lectura de datos:** `getAboutData` junta `getCachedAboutPage` (con `isFallback`), el autor `juan-carlos-angulo` (cache propia de 60 s, `overrideAccess: false`, `select` minimo), `speaking-events` ordenados por fecha descendente y el conteo de `clientes` por `workType` seo y desarrollo. Cada lectura va en `guarded()`: registra `console.error('[about]', err)` y deja su seccion en null. Solo devuelve null (404) si no hay ni global ni autor.
- **Timeline:** `Timeline position="right"` con `aria-label` de `about.timelineLabel`, renderizado como `ul` con un `li` por etapa. Fecha en overline dentro del contenido (acento si es actual), rol en h3, organizacion en 600, cuerpo y enlace externo opcional con `target _blank`, `rel noopener noreferrer` y el sufijo de nueva pestaña. Punto decorativo: relleno `primary.main` si es actual, aro de 3px `divider` si no. La fecha pendiente se muestra tal como llega.
- **Foto:** `figure` con `img` 4 por 5, ancho y alto de Media (1122 por 1402 si faltan), `loading="eager"`, `fetchPriority="high"`, radio de 24px y sombra sobre `GrainBlob`. Sin url o sin alt no se renderiza la figura.
- **Contadores:** 4+ (solo si `yearsExperience` es un numero), 15 SEO y 13 desarrollo. Una tarjeta sin valor o sin rotulo no se dibuja, y sin ninguna tarjeta no queda `dl`.

## Evidencia del checkpoint de legitimidad de @mui/lab@9.0.0-beta.10

Aprobacion delegada: Juan autorizo al orquestador a hacer lo necesario y el orquestador verifico el paquete en el registro de npm el 2026-11-08. Este plan no esperó un "approved" literal de Juan. Si quieres revertirla: `npm uninstall @mui/lab` y reemplazar el timeline de `AboutView.tsx` por una lista propia (cambio localizado en una sola vista, ningun otro archivo de `src` importa el paquete).

| Dato | Valor |
|------|-------|
| Nombre y licencia | `@mui/lab`, MIT |
| Repositorio | `git+https://github.com/mui/material-ui.git` |
| Publicacion | 2026-10-09 (la marca too-new es por ser una beta de hace un mes) |
| Mantenedores | equipo de MUI (diego@mui.com, mnajdova, michaldudak, siriwatknp, aarongarciah, oliviertassinari y otros) |
| `peerDependencies` | `@mui/material ^9.5.0` (el instalado es 9.5.0), React 17 a 19 |
| `scripts.postinstall` | vacio |
| `dist.integrity` | `sha512-XLjMJRiOQfD2p5YIorNuymI3CZqrAIAZJsaaeoomMEwAp3p1VwpSmR072VZZr+PfB1r2aUvouxmCXQNGHyw4qw==` |

Este plan volvio a comprobar en la maquina, con solo lecturas, que `npm view` devuelve la misma version, el mismo `dist.integrity` y el mismo repositorio, y que el lock quedo con esa misma integridad.

- **Instalacion:** `npm install --save-exact @mui/lab@9.0.0-beta.10`, luego `npx -y npm@10.9.2 install --package-lock-only --ignore-scripts --no-audit --no-fund` (Nixpacks usa npm 10.9.2) y `npx -y npm@10.9.2 ci --dry-run --ignore-scripts` sin faltantes (salida 0).
- **Diff del lock:** 45 lineas anadidas, ninguna eliminada, todas del bloque `node_modules/@mui/lab` y de su entrada en el paquete raiz. Sus dependencias (`@mui/system`, `@mui/types`, `@mui/utils`, `clsx`, `prop-types`, `@babel/runtime`) ya estaban en el arbol.
- **npm audit --omit=dev:** 44 vulnerabilidades antes (4 low, 22 moderate, 14 high, 4 critical) y 44 despues, con el mismo desglose. Ningun aviso nuevo.

## Task Commits

1. **Dependencia: @mui/lab 9.0.0-beta.10 con version exacta** - `a7efe35` (chore)
2. **Task 2 (tracer): Sobre mi con timeline, foto con alt y contadores desde datos** - `1a236d7` (feat)
3. **Task 3: areas, educacion, ponencias, cierre, aviso EN, enlace de nav solo en el preview y contrato** - `bd814ce` (feat)

La rama NO se empujo (regla de la fase: el empuje final lo hacen 54-14 o 54-16). No se escribio en la base ni se leyo `.env`.

## Verificacion

- `node_modules/.bin/tsx scripts/verify/54-about-ssr.ts`: 75 PASS, salida 0. Cubre fechas (es y en, sin dos espacios), el mapeo, el h1 con el nombre del autor, una lista de cinco items con `aria-label`, el punto relleno de las etapas actuales (leido de las reglas de Emotion), la fecha pendiente en el texto y jamas en un atributo, la foto con alt y sin alt, los contadores con y sin años, las cuatro tarjetas de areas, educacion y ponencias con y sin datos, el cierre, el orden de las secciones, EN con y sin `isFallback` y el contrato de `54-about.mjs` sobre el render real en es y en.
- `node scripts/verify/54-about.mjs --selftest`: 20 PASS, salida 0 (5 validos y 15 defectuosos detectados, mas el conteo de apariciones). `node --check` OK.
- `npx tsc --noEmit`: salida 0.
- `npm run build` con las variables de la tarea: salida 0 con Next 15.4.11 (supuesto A5 confirmado).
- Comprobacion extra en Chromium real: el HTML renderizado de la vista (con el CSS de Emotion en linea) mide `scrollWidth` igual a `innerWidth` a 320, 768 y 1280 px. No es el contrato en vivo, que corre en 54-16 contra el preview.
- Regresion: `53-layer-check.mjs`, `53-nav-links.ts`, `54-primitives-ssr.ts`, `54-home-ssr.ts`, `54-contact-ssr.ts`, `54-stack-ssr.ts` y `54-conversion-ssr.ts` siguen en salida 0.
- Criterios de aceptacion por `grep`: `@mui/lab/Timeline` y `position="right"` en la vista, un solo archivo de `src` importa `@mui/lab`, `buildAlternates` y `notFound` en la ruta, `sobre-mi` ausente de `src/lib/sitemap-data.ts`, `isPreviewReadonly` en `SiteHeader.tsx`, ninguna lista suelta ni `main` en la vista, `CtaSection` en la vista y `getCtaData` en la ruta.
- No se corrio contra el preview: sigue en el SHA 5fa327d y este plan no empuja. Los contratos en vivo quedan para 54-16.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El chip de asistentes llevaba `lang` en la pagina ES**
- **Found during:** Tarea 3 (primera corrida de la autoprueba ampliada)
- **Issue:** puse `lang={locale}` en el chip de asistentes para marcar el idioma de la interfaz dentro del bloque de ponencias en español, pero en ES eso añadia `lang="es"` a un contenedor que ya estaba en español.
- **Fix:** `lang={talksLang ? locale : undefined}`, asi solo aparece en EN, donde el padre va en `lang="es"` y el texto del chip esta en inglés.
- **Files modified:** `src/components/pages/AboutView.tsx`
- **Commit:** `bd814ce`

### Ajustes dentro del alcance

- **La dependencia se commiteo aparte.** El plan la metia en la Tarea 2; quedo en un commit propio (`a7efe35`) para que revertirla sea un `git revert` limpio.
- **Criterio de aceptacion no literal:** `git diff master --numstat -- src/globals/Header/index.ts` no esta vacio, pero las 4 lineas son del hook `revalidateHeaderCache` del plan 53-03 (`41d93bf`). Este plan no toca ese archivo ni `sitemap-data.ts` (diff contra `a7efe35`: vacio). El global Header no cambia de contenido.
- **El autor no trae `avatar`.** El plan lo listaba en el `select`, pero la foto sale de `aboutPage.hero.photo` y el avatar no se muestra, asi que no se lee ni se cachea.
- **Las ponencias van en `lang="es"` en EN siempre.** `speaking-events` no tiene campos localizados, asi que su texto sale en español aunque `about-page` ya tenga EN. El aviso `TranslationNotice` sigue ligado solo a `isFallback`, como pedia el plan.
- **Titulo y organizador de las ponencias.** El titulo real trae el sufijo "(por DinoRANK)"; `splitTalkTitle` lo separa para mostrar el organizador debajo con `about.by`, como el sandbox. Sin sufijo el titulo queda entero.
- **La cifra de años lleva "+".** La spec nombra "4+" y el campo `yearsExperience` es un numero, asi que la vista agrega el signo. Hoy el campo es null en la base, por lo que la tarjeta no se muestra.
- **Seccion sin titulo no se dibuja.** Areas, experiencia, educacion y ponencias necesitan el titulo del global; si falta, la seccion se omite en vez de usar texto inventado.
- **El orden del `dl` es dt, dd en el codigo fuente.** La cifra va primero en pantalla por `order`. El sandbox ponia dd primero en el HTML, que no es un grupo valido de `dl`.

**Total:** 1 autocorreccion de bug y 8 ajustes dentro del alcance. Sin cambios de arquitectura.

## Authentication Gates

Ninguno. La aprobacion del checkpoint de legitimidad llego delegada, no como una puerta de autenticacion.

## Known Stubs

Ninguno. El marcador `{{pendiente}} fecha del cambio de nombre` de la etapa de aprendoclub se renderiza tal cual llega de Payload, como pide CONTEXT, y la fase 56 lo cierra. Lo registra la autoprueba y nunca entra a title, meta ni aria-label.

## Threat Flags

Ninguno nuevo. T-54-SC mitigado (checkpoint resuelto con evidencia, version exacta, lock revisado, audit sin cambios), T-54-52 (la pagina no esta en el sitemap; `54-about.mjs` exige cero apariciones en el sitemap de produccion), T-54-53 (`sanitizeHref` antes del boton, probado con `javascript:alert(1)`), T-54-54 (el enlace sale solo con `isPreviewReadonly()` y el global Header no cambia), T-54-55 (cada lectura protegida, sin 500) y T-54-56 (sin alt no hay figura).

## Supuesto A7 (pendiente, no medido)

Sobre mi lee `about_page*` (y el cierre lee `home_page*`) en cuanto el preview corra este codigo. Este plan no empuja, asi que el preview no ha leido esas tablas con el codigo nuevo y no hubo logs que revisar. Cuando 54-14 o 54-16 empujen, hay que revisar por SSH (solo lectura) los logs del contenedor del preview y confirmar 0 `permission denied`. Si aparece, el arreglo es un `GRANT SELECT` que decide Juan. El codigo ya lo tolera: sin el global, la pagina sale con h1, bio y contadores y registra `[about]`, sin 500.

## Pendiente para 54-14 o 54-16

- Correr `BASE_URL=https://dev.juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/54-about.mjs` tras el empuje (comprueba 200, h1, foto con alt, timeline, enlace en el header del preview, desborde a 320px y que el sitemap de `https://juan-tech.com` no contenga sobre-mi).
- Revisar los logs del preview por A7 (arriba).
- Revision humana abierta: lector de pantalla en el timeline y el `dl` de contadores, y los alt de la foto de Sobre mi (borrador que Juan confirmo, la fase 56 lo revisa).
- Retirar la inyeccion de `SiteHeader.tsx` en el corte de la fase 57, cuando el enlace real entre al global Header.

## Self-Check: PASSED

- FOUND: src/lib/about-data.ts, src/components/pages/AboutView.tsx, src/app/(frontend)/[locale]/sobre-mi/page.tsx, scripts/verify/54-about-ssr.ts, scripts/verify/54-about.mjs, src/components/shell/SiteHeader.tsx
- FOUND: commits a7efe35, 1a236d7 y bd814ce
- Conteo medido: `git rev-list --count 24af0ec..HEAD` = 3
