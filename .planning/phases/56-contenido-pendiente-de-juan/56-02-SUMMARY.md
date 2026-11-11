---
phase: 56-contenido-pendiente-de-juan
plan: 02
subsystem: content-data
tags: [home-copy, decisions-registry, cta, tracer, d-15, d-22, inputs-check]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: 56-content-decisions (tipos y helpers), 56-gate (descubre scripts/db/data/56-*.ts), 56-content-guard --data y 56-review-export (plan 56-01)
provides:
  - Archivo de entrada textos-pendientes-juan.md ya cargado con las decisiones de la home que Juan tomo el 2026-11-10
  - 56-inputs-check.mjs (tabla de casillas, rayas, marcadores, porcentajes recalculados, --emit-json, --require-filled, --selftest)
  - 56-juan-inputs.json generado, fuente unica de los datos tipados
  - HOME_DECISIONS y DECISIONS de D-22a a D-22g, mas D-22g-item, todos aprobados con la opcion que eligio Juan
  - CTA_LOTE1 y DECISIONS (CTA-<id>) con el cierre de la home aprobado y el resto pendiente
affects: [56-09, 56-10, 56-12, 56-13, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "El archivo markdown de Juan es la fuente; el JSON se genera y no se edita a mano; los .ts solo lo leen"
    - "Opcion elegida sin texto cae a la opcion vigente con estado pendiente (regla D-22)"
key-files:
  created:
    - .planning/phase-56-prep/textos-pendientes-juan.md
    - scripts/verify/56-inputs-check.mjs
    - scripts/db/data/56-juan-inputs.json
    - scripts/db/data/56-options-home.ts
    - scripts/db/data/56-cta-lote1.ts
    - scripts/verify/56-home-inputs-selftest.ts
  modified: []
key-decisions:
  - "Los checkpoint:decision y el checkpoint:human-action de este plan quedan resueltos por aprobaciones-juan.md y opciones-home.md: no se volvio a preguntar a Juan"
  - "56-options-home.ts no importa 54-home-copy.ts: el plan 56-09 lo convierte en reexport de 56-home-copy.ts y el import seria circular; los valores vigentes salen del JSON"
  - "El item SEO tecnico es una decision aparte (D-22g-item) en lugar de recortar la frase de Googlebot"
patterns-established:
  - "Estadistica elegida ninguna: la opcion existe sin ES ni EN y HERO_MUESTRA_ESTADISTICA es falso"
requirements-completed: []
duration: 40min
completed: 2026-11-10
status: complete
commits: 7
plan_head_before: ab0e198c1af2fc5360025a9b86dadc024cf95c13
actuals:
  tokens: 12500
  tasks: 3
  commits: 2
---

# Phase 56 Plan 02: Textos de la home y lote 1 de CTAs como datos tipados Summary

El archivo de entrada de Juan nace ya cargado con sus decisiones de la home, un verificador lo lee y emite un JSON, y de ahi salen las ocho decisiones D-22 aprobadas y las 17 filas del lote 1 de CTAs con estado. Cero escrituras a la base y cero acceso a ella.

## Qué quedó hecho

**Task 1 (tracer): archivo de entrada y verificador, de punta a punta.** Commit 16df8c1.
- `textos-pendientes-juan.md`: sección LOTE1 con 17 filas (id, origen, carga, texto vigente, ES y EN) y secciones D-22a a D-22g, mas D-22g-item. Se precargó desde `opciones-home.md` y `aprobaciones-juan.md`, con la línea `Elegida:` y `Estado:` por sección.
- `56-inputs-check.mjs`: cuenta casillas llenas y vacías por sección, rechaza rayas largas y medias y la apertura de marcador, recalcula cada porcentaje de D-22c desde `desde` y `hasta`, valida que `Elegida` y `Recomendada` existan, y exige las ocho secciones obligatorias. Banderas `--require-filled`, `--emit-json` y `--selftest` (13 casos).
- Barrera del tracer: `AUTO_CFG` falso y `HUMAN_VERIFY_MODE=end-of-phase`; la verificación automatizada corrió de punta a punta y pasó antes de seguir.

**Task 2 (checkpoint:human-action): resuelto sin preguntar.** Juan ya había decidido todo el copy de la home. Se cargaron esas decisiones en el archivo y quedó solo lo que Juan no tiene en el repo (ver "Items para Juan").

**Task 3: datos tipados.** Commit 276e733.
- `56-juan-inputs.json` generado con `--emit-json`.
- `56-options-home.ts`: `HOME_DECISIONS` y `DECISIONS` con estas elecciones, todas `aprobado` con gate `aprobado`:

| Id | Elegida |
|----|---------|
| D-22a título | A, ES "Consultor SEO técnico que también programa", EN "Technical SEO consultant who also codes" |
| D-22b texto | 2 (más de 18 clientes internacionales, confirmado) |
| D-22c estadística | ninguna (el hero no muestra cifra; `HERO_MUESTRA_ESTADISTICA` es falso) |
| D-22d tagline | 2 |
| D-22e título de medición | 3 |
| D-22f texto de medición | 2 |
| D-22g lead de servicios | 3 |
| D-22g-item SEO técnico | texto nuevo |

  También exporta `QUITAR_FRASE_GOOGLEBOT` (verdadero), `QUITAR_NOTAS_BUENO_HASTA` (verdadero) y `HERO_STATS` con las candidatas y sus cifras de origen. La autoprueba recalcula +309, +406, +143, +104 y +68 y confirma que "+18 clientes" no tiene respaldo medido.
- `56-cta-lote1.ts`: `CTA_LOTE1` y `DECISIONS`. `cierre-lead` queda `aprobado` con el texto de D-15 en ES y EN. Las otras 16 filas quedan `pendiente` con su texto vigente y sin EN. `loadAt` es `corte` para header-cta, audit-offer-cta y auditor-cta (los lee master) y `ahora` para el resto.
- `56-home-inputs-selftest.ts`: cubre los cinco tests del plan más las elecciones de Juan (38 casos PASS).

## Verificación

- `56-inputs-check --selftest` (13 PASS), `56-inputs-check` (tabla: lote 1 con 2 casillas llenas y 32 vacías, D-22 sin casillas vacías), `56-content-guard --data` (7 archivos de datos revisados, PASS).
- `tsx 56-home-inputs-selftest.ts`: PASS.
- `tsx 56-gate.ts`: lista las ocho decisiones D-22 y las 17 filas CTA con su estado. `56-review-export --only D-22` imprime las ocho decisiones con sus opciones.
- `npx tsc --noEmit`: sin errores.
- `node scripts/verify/56-run-all.mjs --selftests`: 68 PASS, 0 FAIL, 11 SKIP (scripts de planes posteriores).
- `grep -c "(pega aquí)"` en el archivo de Juan: 18 líneas (las filas del lote 1 sin texto).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Los criterios de aceptación de la Task 1 describían un estado anterior**
- **Found during:** Task 1.
- **Issue:** el plan decía que las opciones B a E del título quedaban vacías. Juan ya las había listado en `opciones-home.md` y decidió todo el copy, así que dejarlas vacías habría borrado decisiones aprobadas.
- **Fix:** se cargaron todas las opciones y elecciones. `grep -c "(pega aquí)" > 0` se sigue cumpliendo por las filas del lote 1 sin texto, y la tabla del verificador muestra `cierre-lead` y la opción A como llenas.
- **Files modified:** `.planning/phase-56-prep/textos-pendientes-juan.md`
- **Commit:** 16df8c1

**2. [Rule 2 - Missing critical] Decisión extra D-22g-item**
- **Found during:** Task 3.
- **Issue:** Juan aprobó un texto nuevo para el ítem SEO técnico. El plan solo preveía quitar la frase de Googlebot, lo que habría dejado a 56-09 recortando texto en vez de usar el aprobado.
- **Fix:** sección y decisión `D-22g-item` aprobada. El prefijo `D-22` la incluye en `56-review-export --only D-22`.
- **Files modified:** `textos-pendientes-juan.md`, `56-options-home.ts`
- **Commit:** 16df8c1, 276e733

**3. [Rule 2 - Missing critical] Autoprueba de los datos**
- **Issue:** la Task 3 es `tdd="true"` y su `<files>` no incluye un archivo de prueba.
- **Fix:** `scripts/verify/56-home-inputs-selftest.ts` (fuera de `files_modified`, aditivo). No se editó `56-run-all.mjs` (es del plan 56-01); este paso queda por declarar si el orquestador lo quiere.
- **Commit:** 276e733

**4. [Rule 1 - Bug] 56-options-home.ts no importa 54-home-copy.ts**
- **Issue:** el plan decía leer los valores vigentes de `54-home-copy.ts`, pero 56-09 lo convierte en reexport de `56-home-copy.ts`, que importa este archivo: import circular.
- **Fix:** los vigentes viajan en el JSON (línea `Vigente` de cada sección, copiada literal de 54-home-copy.ts).

### Notas de proceso

- `commits: 7` es el conteo medido desde `plan_head_before`, pero la rama es compartida con los planes 56-03 y 56-04, que corren en paralelo. Los commits de este plan son dos: 16df8c1 y 276e733 (`actuals.commits: 2`).
- `.planning/phase-56-prep/opciones-home.md` sigue sin seguimiento en git; no es de este plan y no lo agregué.

## Auth gates

Ninguno. El plan no abre la base ni la red.

## Known Stubs

Ninguno de código. Las 16 filas del lote 1 sin texto son datos pendientes, no stubs: quedan con el texto vigente y estado `pendiente`, y el gate del corte las lista.

## Threat Flags

Ninguno. El plan no agrega endpoints, rutas de autenticación ni acceso a archivos fuera del repo.

## Items para Juan

1. **Lote 1 de CTAs: faltan 16 de 17 filas.** `aprobaciones-juan.md` dice que el resto del lote está aprobado con el inglés propuesto, pero esos textos ES y EN no están en el repo, solo en la conversación. Pégalos en la sección LOTE1 de `.planning/phase-56-prep/textos-pendientes-juan.md` (reemplaza cada "(pega aquí)") y corre `node scripts/verify/56-inputs-check.mjs --emit-json`. Mientras tanto quedan `pendiente` con el texto vigente y el gate del corte (fase 57) falla por ellas. Esto incluye el título del cierre de la home ("Hablemos de tu sitio" hoy) y los CTAs de header, oferta de auditoría y auditor, que se cargan en el corte.
2. **Etiqueta sobre el título del hero** se conserva como "Ingeniero de software" (tu decisión); no hay decisión registrada para cambiarla.
3. **`<title>` y meta descripción de la home** no se tocaron (D-23).

## Self-Check: PASSED

Archivos presentes: `textos-pendientes-juan.md`, `56-inputs-check.mjs`, `56-juan-inputs.json`, `56-options-home.ts`, `56-cta-lote1.ts`, `56-home-inputs-selftest.ts`. Commits 16df8c1 y 276e733 presentes en la rama feat/mui-redesign.
