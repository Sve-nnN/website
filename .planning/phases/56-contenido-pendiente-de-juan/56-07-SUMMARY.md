---
phase: 56-contenido-pendiente-de-juan
plan: 07
subsystem: content
tags: [alt-text, a11y, headings, voice, decisions-registry, d-17, d-18]
requires:
  - phase: 56-01
    provides: registro de decisiones, 56-gate, 56-content-guard y 56-review-export
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: 54-media-manifest (alt vigentes de las fotos) y 54-page-contract (origen de la tabla de encabezados)
provides:
  - PHOTO_ALTS y CAPTURE_ALTS con ES, EN propuesto y respaldo del valor actual (10 decisiones ALT-)
  - HEADINGS con antes, propuesta, ruta, grupo, dónde vive y acción (7 decisiones HEAD-)
  - 56-alts-selftest.ts con reglas de alt y de la tabla de encabezados
affects: [56-14, 57]
tech-stack:
  added: []
  patterns:
    - "Cada alt se redacta después de abrir la imagen real, bajada a un directorio temporal fuera del repo"
    - "La tabla de encabezados se reproduce desde 54-page-contract contra dev, no desde un número recordado"
key-files:
  created:
    - scripts/db/data/56-alt-texts.ts
    - scripts/db/data/56-headings-table.ts
    - scripts/verify/56-alts-selftest.ts
  modified: []
key-decisions:
  - "El alt de la captura de Juan Tech queda pendiente y no cargable: el archivo que sirve dev es una página de Vercel pausada, no el sitio"
  - "El alt vacío del avatar junto al nombre se deja así a propósito (decorativo); no existe una segunda foto de Sobre mí"
  - "La tabla cuenta 39 encabezados reales, no 36 ni 40: el Dr. Vargas es un falso positivo por abreviatura"
  - "Ningún encabezado que master sirve se cambia: cada grupo queda pendiente con default no tocar"
requirements-completed: []
duration: 55min
completed: 2026-11-10
status: complete
commits: 6
plan_head_before: 54357b8ee1d5c49f01fb826697793e305848589f
actuals:
  tokens: 11500
  tasks: 2
  commits: 2
---

# Phase 56 Plan 07: Alt de fotos y capturas y tabla de encabezados Summary

Diez textos alternativos redactados mirando cada imagen real, con EN propuesto y respaldo del valor que sirve hoy, y una tabla de 52 encabezados únicos reproducida desde el contrato contra dev, con una propuesta por cada uno de los 39 reales y una decisión por grupo. No se cambió ningún encabezado, ningún alt en vivo ni la base. La tarea 3 (decisión de Juan) queda abierta.

## Qué quedó hecho

**Task 1 (tracer): un alt de foto y uno de captura de punta a punta.** El tipo `AltRow` guarda ES, EN, el alt vigente en ambos idiomas, estado, si es cargable y qué se vio. La autoprueba rechaza los prefijos "imagen de", "foto de" y "captura de", el EN igual al ES, rayas, marcador, "portfolio", los vacíos, el exceso de largo y las capturas sin valor actual. Barrera del tracer: con `AUTO_CFG` falso y `HUMAN_VERIFY_MODE=end-of-phase` se volvió a correr la verificación automatizada completa y pasó antes de expandir.

**Task 2: los diez alt y la tabla de encabezados.**

| Clave | ES propuesto | Cambia respecto al vigente |
|---|---|---|
| about-hero | se conserva el borrador de A11Y-DECISIONS | No. Coincide con la foto; falta el EN |
| home-about-taller | "...de pie con un micrófono junto a una pantalla con la diapositiva Introducción al SEO técnico" | Sí: la diapositiva está a su izquierda, no detrás de él |
| home-about-escritorio | se conserva | No. Falta el EN |
| home-about-retrato | "...con gafas y chaqueta oscura, sonriendo, frente a ramas con musgo y luces cálidas" | Sí: se agregan las gafas y las ramas |
| apturio, aprendoclub, ariannalupi, drmanuelvargashidalgo, estylopia | "Inicio de ..." con titular, rasgos visibles y secciones | Sí: hoy dicen "<Nombre> raya captura de pantalla completa" en ES y EN |
| juan-tech | pendiente, no cargable | Ver hallazgo 1 |

**Tabla de encabezados.** `BASE_URL=https://dev.juan-tech.com node scripts/verify/54-page-contract.mjs` (solo lectura): 66 avisos, 52 textos únicos, 13 falsos positivos (".js", ".txt", separador de miles de 86,000, abreviatura Dr. e inicial A.) y 39 reales. Se cruzó la tabla contra la salida viva: 52 de 52 textos y todas las rutas coinciden. Con las 2 lecciones nuevas del plan 56-06 (ya resueltas allí) la tabla lista 41 reales. Grupos: legal 25 (se reemplazan al cortar por el texto nuevo), lecciones 2, bloque CodeFixes 2, landings de servicio 6, stack 3, títulos de posts en la búsqueda 3. Cada fila lleva una propuesta sin punto, coma, dos puntos ni puntos suspensivos, en primera persona donde aplica.

## Hallazgos para Juan

1. **La captura de Juan Tech es una página de Vercel pausada.** El archivo que sirve dev (1000 por 563 px, 5 KB) muestra "This deployment is temporarily paused" sobre fondo blanco. El alt no es el problema: hay que recapturar juan-tech.com. No se redactó un alt de memoria porque el sandbox muestra otro titular ("Construyo software rápido...") que ya no es el aprobado.
2. **El alt vacío de /sobre-mi es el avatar de 32 px junto al nombre escrito, no una foto del taller.** Es decorativo y vacío es lo correcto. La foto del taller vive en la home y ya tiene alt.
3. **Tres capturas salen con zonas vacías.** Arianna Lupi (franjas crema entre secciones), Dr. Vargas (feed de Instagram y seguros sin cargar) y Estylopia (las tarjetas del blog son degradados grises). El alt solo menciona lo que se ve, pero conviene recapturar esperando la carga.
4. **El título del post "Topic clusters SEO..." ya está cortado en la base** (post id 39, termina en "con..."). No es la vista: es el dato. La propuesta lo completa y hay que confirmar el texto original.
5. **El número 36 no se reproduce.** El resultado reproducible es 39 reales (40 si cuentas al Dr. Vargas, cuyo punto es de la abreviatura).
6. **El gate sin bandera sale 1 por un archivo ajeno.** `56-legal-lexical.ts` (otro plan en curso) no exporta `DECISIONS`. No es de este plan y no lo toqué.

## Decisión pendiente de Juan (tarea 3, checkpoint)

Se lee con `node_modules/.bin/tsx scripts/verify/56-review-export.ts --only ALT HEAD`. Responde con `alts=aprobado|cambios(clave: texto)|defaults`, `encabezados=no-tocar|cambiar(lista de ids HEAD)` y `alcance=39-reales|36(pega la lista)`. Con `defaults` los alt quedan propuestos y los encabezados de master en no tocar. Con tu respuesta se actualizan los estados en `56-alt-texts.ts` y `56-headings-table.ts` y se vuelve a correr la autoprueba. Recomendación: aprobar los alt, no tocar los encabezados que master sirve (son SEO), dejar que los legales se arreglen solos con el texto nuevo y recapturar Juan Tech.

## Verificación

- `tsx scripts/verify/56-alts-selftest.ts`: 27 casos PASS, 0 FAIL.
- `node scripts/verify/56-content-guard.mjs --data`: PASS (12 archivos de datos, sin rayas ni marcadores).
- `56-gate.ts --json`: sin problemas de forma en `56-alt-texts.ts` ni en `56-headings-table.ts`; los ALT y HEAD salen como propuesto o pendiente con la acción esperada.
- `npx tsc --noEmit`: sale 0.
- `56-review-export.ts --only ALT HEAD`: 10 decisiones ALT y 7 HEAD con el actual y el propuesto.
- `git status --short -- src messages`: sin cambios de este plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RESEARCH 9 describía una segunda foto de Sobre mí que no existe**
- **Found during:** Task 2, al listar las imágenes de /sobre-mi y /websites.
- **Issue:** el alt vacío que la investigación atribuía a "la foto del taller de Sobre mí" es el avatar decorativo del cierre.
- **Fix:** se registra como imagen decorativa en `DECORATIVE_IMAGES` y no como fila de alt; la autoprueba exige que no aparezca también como fila.
- **Files modified:** `scripts/db/data/56-alt-texts.ts`
- **Commit:** 22c1185

**2. [Rule 1 - Bug] La cifra de 40 encabezados reales cuenta un falso positivo**
- **Found during:** Task 2, al cruzar la tabla con la salida viva.
- **Issue:** RESEARCH 7 da 40 reales pero descuenta el Dr. Vargas como falso positivo en su lista; sumado, son 39.
- **Fix:** la tabla usa 39 y lo explica en la nota de la fila H-43 y en la decisión `HEAD-alcance`.
- **Files modified:** `scripts/db/data/56-headings-table.ts`
- **Commit:** 22c1185

### Decisión de interpretación

- El plan pedía dejar "después" vacío en lo que master sirve. El encargo de la orquestación pidió una propuesta por encabezado con una decisión. Se hizo lo segundo: todas las propuestas están en la tabla, ninguna se aplica y los grupos de master quedan `pendiente` con default `no-tocar`.
- `commits: 6` es el conteo medido de `git rev-list` desde `plan_head_before`. Dos son de este plan (8746afe, 22c1185). Los otros cuatro son de los planes 56-05 y 56-06 que corren en paralelo sobre la misma rama. `actuals.commits: 2` cuenta solo los de este plan.

## Known Stubs

Ninguno. La fila `juan-tech` es un defecto de datos documentado, no un stub: el alt describe el archivo actual y está marcada como no cargable hasta recapturar.

## Auth gates

Ninguno. Solo se hicieron lecturas HTTP de dev, de producción (un GET público a `/api/posts`) y de Cloudinary para ver las imágenes. Cero escrituras, cero acceso a la base y cero secretos.

## Self-Check: PASSED

- FOUND: scripts/db/data/56-alt-texts.ts
- FOUND: scripts/db/data/56-headings-table.ts
- FOUND: scripts/verify/56-alts-selftest.ts
- FOUND: commits 8746afe y 22c1185
