---
phase: 54-paginas-de-conversion-y-utilidad
plan: 04
subsystem: database
tags: [payload, seed-scripts, shadow-content, cloudinary, sharp, db-safety, selftest]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 02 (globals home-page y about-page, clientes.onDark, logo por herramienta en toolStack, migracion sin aplicar)
provides:
  - scripts/db/20 con la siembra de home-page, about-page y clientes.onDark, en dry-run por defecto
  - scripts/db/21 con la subida de las 4 fotos a Cloudinary y su enlace en los globals
  - scripts/db/22 con la subida de los 9 logos del stack y el enlace al doc live stack con guardia de diff
  - 54-seed-lib con las guardias de base, diff, fusion, nombres y chequeos de copy (puros, sin Payload)
  - HOME_COPY_ES, ABOUT_COPY_ES, SANDBOX_LOGOS, ON_DARK_FILES y MEDIA_MANIFEST
  - 54-seed-selftest con 33 casos PASS, sin tocar ninguna base ni la red
affects: [54-07, 54-08, 54-09, 54-10, 54-11, 54-12, 54-13, 54-14, 54-15, 54-16]

plan_head_before: 90704183fac93513a02d98ca3a7159ce6932f396
actuals:
  tokens: 21600
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Guardia de base antes de cualquier conexion: assertSafeTarget rechaza neon.tech, bases distintas de juantech y hosts desconocidos, y exige --db-checked con --apply; Payload se importa de forma dinamica solo despues"
    - "Grupo de global COMPLETO: lo leido se fusiona con el copy (mergeGroup) y nunca se envia un grupo parcial; cada escritura relee y compara"
    - "Plan de solo lectura antes de cualquier escritura: una ambiguedad en el mapeo de onDark aborta sin dejar los globals a medias"
    - "Imagenes preparadas en un directorio temporal del sistema con nombre propio p54-*, para que la busqueda de un asset ya subido no se confunda con otro doc de Media"

key-files:
  created:
    - scripts/db/data/54-seed-lib.ts
    - scripts/db/data/54-home-copy.ts
    - scripts/db/data/54-about-copy.ts
    - scripts/db/data/54-media-manifest.ts
    - scripts/db/20-phase54-seed-shadow-content.ts
    - scripts/db/21-phase54-upload-media.ts
    - scripts/db/22-phase54-stack-logos.ts
    - scripts/verify/54-seed-selftest.ts
  modified: []

key-decisions:
  - "Los helpers de imagen (prepareImage y findOrCreateMedia) viven en 54-seed-lib.ts y no en un archivo nuevo, para no ampliar la lista de archivos del plan; sharp se importa de forma dinamica y Payload llega como parametro, asi que el modulo sigue sin importar Payload"
  - "En el script 22 la escritura sigue el orden EN y luego ES, pero el ES se omite si tras escribir EN ya muestra los logos: logo no es un campo localizado y las filas de herramientas se comparten entre locales"
  - "El mapeo de onDark prueba el nombre de archivo y el alt de cada logo del sandbox; solo un logo del sandbox que coincide con mas de un cliente aborta, y los nombres repetidos entre clientes ajenos al sandbox se avisan sin abortar"
  - "Los titulos de seccion y de grupo no admiten punto ni coma; en los titulos de item se tolera el punto interior de un nombre propio (Next.js) pero no la coma ni el punto final"

patterns-established:
  - "Un script de siembra de la fase termina todo camino de aborto antes de abrir una conexion: sin DATABASE_URI valida, con base equivocada, sin credenciales de Cloudinary o sin --alts-confirmed no se carga Payload"

requirements-completed: []

duration: 25min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 04: Scripts de siembra del contenido sombra y de los medios Summary

**Tres scripts numerados (20 contenido, 21 fotos, 22 logos del stack) con guardia de base equivocada, dry-run por defecto, copy aprobado del sandbox solo en ES y una autoprueba de 33 casos; ninguno se ejecuto contra una base.**

## Performance

- **Duration:** unos 25 min
- **Completed:** 2026-11-08
- **Tasks:** 3 de 3
- **Files:** 8 creados, 0 modificados

## Accomplishments

- **Guardia de base (T-54-12).** `assertSafeTarget` rechaza la Neon abandonada del incidente del 2026-08-17, toda base que no se llame `juantech`, todo host fuera de 127.0.0.1, localhost y shared-postgres, y `--apply` sin `--db-checked`. Los tres scripts imprimen `host:puerto/base` (nunca usuario ni contrasena) y abortan antes de cargar Payload. Probado a mano con tres entornos falsos: sin `DATABASE_URI`, con una URI de neon.tech y con credenciales de Cloudinary ausentes; los tres salen con codigo 1 sin abrir conexion.
- **Copy verbatim.** `HOME_COPY_ES` cubre los 12 grupos del global home-page con los nombres exactos de campo de `src/globals/HomePage/index.ts`; `ABOUT_COPY_ES` cubre los 7 de about-page. No se siembra `sites.note` ni ninguna ranura de testimonio. El unico marcador pendiente es la fecha de la etapa de aprendoclub (`experience.stages[].when`), permitido por ruta.
- **Script 20.** Siembra home-page y about-page solo en ES, con el grupo completo leido y fusionado, relectura y comparacion tras escribir, e idempotencia. El plan de `clientes.onDark` corre en solo lectura ANTES de cualquier escritura, imprime la tabla completa de coincidencias, no coincidencias y ambiguedades, y aborta si hay ambiguedad.
- **Script 21.** Exige las tres variables `CLOUDINARY_*` y `--alts-confirmed` con `--apply`. Convierte `escritorio.png` (1,9 MB) a WebP de 1600 px o menos en un directorio temporal del sistema. Reutiliza un asset ya subido por nombre `p54-*` para que repetir tras un corte no lo duplique.
- **Script 22 (T-54-13).** Aborta si el layout nuevo difiere en algo mas que `logo` o si `_status` no es `published`; escribe EN y luego ES con `draft: false`, relee ambos locales tras cada escritura y, si algo no cuadra, se detiene sin escribir el locale que falta y reporta, sin caer a otra opcion.
- **Autoprueba.** 33 casos PASS: guardias, diff, fusion, nombres, caracteres prohibidos, conteos de items (5, 4, 4, 5, 3, 3 y 5 etapas), titulos sin puntuacion, listas cerradas de iconos y de slugs de servicio, nombres de campo contra `src/globals`, manifiesto de 4 fotos y 9 logos, rutas en disco, nombres de herramienta contra el seed de la fase 48, conversion real de `escritorio.png` y revision estatica de los tres scripts (sin operaciones de borrado, con `db-checked`, `fallbackLocale` y `assertSafeTarget`).

## Task Commits

1. **Task 1 (tracer): siembra minima de tagline y hero con guardias de base** - `d053282` (feat)
2. **Task 2: copy completo de home y Sobre mi, mapeo de clientes.onDark y siembra completa** - `fd9e807` (feat)
3. **Task 3: scripts de fotos (21) y logos del stack (22) con manifiesto, WebP y guardia de diff** - `8c500ae` (feat)

La rama NO se empujo (`feat/mui-redesign` sigue solo en local). Ningun script se ejecuto contra una base: solo los caminos de aborto y la autoprueba.

## Tracer

El tracer (tarea 1) paso su verificacion automatizada de punta a punta: autoprueba en PASS y `assertSafeTarget` rechazando la URI de la Neon abandonada. Se continuo con la expansion.

## Lo que debe hacer Juan en 54-07 (resumen para la revision)

1. Aplicar la migracion `phase54_shadow_content` (ya leida en 54-02), tras `04-which-database.ts`.
2. Correr el script 20 en dry-run y **revisar a mano la tabla de `clientes.onDark`** (supuesto A8). Solo `winaypaq.webp` tiene `onDark` verdadero en el sandbox; el script lo enlaza con el cliente cuyo nombre normalizado coincide.
3. Correr el script 21 en dry-run, **leer cada alt** (el de Sobre mi es un borrador de A11Y-DECISIONS) y luego `--apply --db-checked --alts-confirmed`. Requiere el script 20 aplicado antes (las tres filas de `about.photos`).
4. Correr el script 22. Si el diff no queda limpio, el script se detiene y reporta: la opcion B (servir los logos desde `public/img/stack`) la decide Juan.
5. Esperar 60 s del TTL y verificar contra el HTML servido.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `__dirname` no existe en el modulo ES de tsx**
- **Found during:** Tarea 2 (primera corrida de la autoprueba ampliada)
- **Issue:** la autoprueba y el script 21 usaban `__dirname`; falla con `ReferenceError` porque el repo corre scripts como modulo ES.
- **Fix:** `dirname(fileURLToPath(import.meta.url))` en la autoprueba y en los scripts 21 y 22.
- **Files modified:** `scripts/verify/54-seed-selftest.ts`, `scripts/db/21-phase54-upload-media.ts`, `scripts/db/22-phase54-stack-logos.ts`
- **Commit:** `fd9e807` y `8c500ae`

**2. [Rule 1 - Bug] El script 22 habria dado un falso fallo tras escribir EN**
- **Found during:** Tarea 3 (revision del diseno antes de commitear)
- **Issue:** el plan pide escribir EN y luego ES, pero `logo` no es un campo localizado y las filas de herramientas se comparten entre locales: tras escribir EN el ES ya muestra los logos, y mi comprobacion esperaba que el ES siguiera sin ellos, asi que habria detenido el script por error con el doc a medias. Ademas, un corte entre ambas escrituras habria dejado el estado "pendiente" en 0 calculado solo desde EN.
- **Fix:** el estado pendiente se recalcula con una lectura fresca por locale justo antes de escribir (el ES se omite si ya tiene todos los logos), y la comprobacion posterior acepta en el otro locale tanto los logos esperados como el estado previo, pero nada mas.
- **Files modified:** `scripts/db/22-phase54-stack-logos.ts`
- **Commit:** `8c500ae`

**3. [Rule 2 - Missing critical functionality] Busqueda de Media demasiado laxa para reutilizar un asset**
- **Found during:** Tarea 3
- **Issue:** buscar un doc de Media ya subido por `filename like "payload"` podia reutilizar un doc ajeno (cualquier archivo con "payload" en el nombre) y enlazar el logo equivocado.
- **Fix:** los archivos se preparan siempre en el directorio temporal con un nombre propio `p54-<clave>` y la busqueda usa ese nombre; si hay mas de un doc parecido el script lanza en lugar de elegir.
- **Files modified:** `scripts/db/data/54-seed-lib.ts`, `scripts/db/21-phase54-upload-media.ts`, `scripts/db/22-phase54-stack-logos.ts`
- **Commit:** `8c500ae`

**4. [Rule 2 - Missing critical functionality] Una ambiguedad de onDark abortaba despues de sembrar los globals**
- **Found during:** Tarea 2
- **Issue:** en el primer diseno el mapeo de clientes corria despues de escribir los globals, asi que una ambiguedad dejaba la siembra a medias.
- **Fix:** el plan de `clientes.onDark` (solo lectura) corre antes de cualquier escritura; la escritura de `onDark` va al final.
- **Files modified:** `scripts/db/20-phase54-seed-shadow-content.ts`
- **Commit:** `fd9e807`

**5. [Decision menor] Helpers de imagen dentro de `54-seed-lib.ts`**
- `prepareImage` y `findOrCreateMedia` se agregaron a `54-seed-lib.ts` en vez de crear un modulo no listado en `files_modified`. El modulo sigue sin importar Payload (llega como parametro) y `sharp` se carga de forma dinamica.

**Total:** 4 correcciones automaticas y 1 decision de ubicacion, todas dentro de los archivos del plan. Sin impacto en el esquema ni en ninguna base.

## Authentication Gates

Ninguno. No se toco ninguna base ni se uso ninguna credencial: los caminos de aborto se probaron con variables de entorno falsas y la autoprueba no abre conexiones.

## Known Stubs

Ninguno. `ABOUT_COPY_ES.experience.stages[2].when` lleva el marcador pendiente de la fecha del cambio de nombre de aprendoclub **a proposito** (CONTEXT, Contenido pendiente): se renderiza como esta en Payload y la fase 56 lo cierra. No es un stub de codigo.

## Threat Flags

Ninguno nuevo. Mitigaciones cumplidas: T-54-12 (guardia de base con autoprueba del caso del incidente), T-54-13 (`draft: false`, `_status` antes y despues, diff que ignora solo `logo`), T-54-14 (solo se comprueba presencia de `CLOUDINARY_*`; `safeTarget` oculta usuario y contrasena), T-54-15 (`--alts-confirmed` obligatorio; el dry-run lista cada alt).

## Next Phase Readiness

- Los scripts quedan listos para que Juan los corra en 54-07, tras aplicar la migracion y confirmar la base con `04-which-database.ts`.
- **No empujar la rama en este plan ni en 05 y 06**: el codigo nuevo consulta tablas que aun no existen en la base compartida. Solo 54-07 empuja tras aplicar la migracion.
- Los requisitos PAG-01, PAG-06, PAG-07 y PAG-08 NO se marcan como completos: todavia no existen las paginas que consumen este contenido.

## Self-Check: PASSED

- Archivos verificados en disco: los ocho creados.
- Commits `d053282`, `fd9e807` y `8c500ae` presentes en `git log`; `git rev-list --count 9070418..HEAD` da 3.
