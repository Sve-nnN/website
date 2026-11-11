---
phase: 56-contenido-pendiente-de-juan
plan: 04
subsystem: contenido-sobre-mi
tags: [about-page, timeline, d-11, d-12, d-14, content-guard, verifiers]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: 56-content-decisions (registro con estado), 56-gate, 56-content-guard y 56-review-export del plan 56-01
provides:
  - 56-about-copy.ts con ABOUT_TIMELINE (D-11), ALLOWED_WHEN, ABOUT_COPY_ES y ABOUT_COPY_EN de cuatro etapas y DECISIONS
  - 54-about-copy.ts convertido en reexport, para que todo importador de la 54 siga funcionando
  - Verificadores que ya no permiten el marcador de fecha en ninguna ruta ni cablean cinco etapas
affects: [56-12, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "El conteo de etapas, de etapas actuales y de la etapa con enlace se deriva de la constante del copy"
    - "Lista cerrada de fechas (ALLOWED_WHEN) verificada por autoprueba: no se inventa ninguna fecha"
key-files:
  created:
    - scripts/db/data/56-about-copy.ts
  modified:
    - scripts/db/data/54-about-copy.ts
    - scripts/db/data/54-seed-lib.ts
    - scripts/verify/54-seed-selftest.ts
    - scripts/verify/54-page-contract.mjs
    - scripts/verify/54-about-ssr.ts
    - scripts/db/23-phase54-verify-schema.ts
    - scripts/db/20-phase54-seed-shadow-content.ts
key-decisions:
  - "D-11 (cuatro etapas) pasa a estado aprobado: Juan lo aprobo el 2026-11-10 en aprobaciones-juan.md, asi que el checkpoint:decision del plan quedo resuelto sin volver a preguntar"
  - "La opcion cinco-etapas queda documentada pero sin datos: exige una fecha que Juan no dio, y stagesFor() lanza un error explicito si alguien la elige"
  - "El lead nuevo de Experiencia (D-11-lead) queda propuesto con gate propuesto, porque Juan aprobo la estructura de la linea de tiempo pero no vio ese texto"
  - "ABOUT-EN queda propuesto con gate aprobado: la copia EN espera la aprobacion de Juan antes de que 56-12 la siembre"
requirements-completed: []
duration: 25min
completed: 2026-11-10
status: complete
commits: 4
plan_head_before: 03c13df722eae8a6e51f031e2936abad23b6650f
actuals:
  tokens: 9100
  tasks: 3
  commits: 2
---

# Phase 56 Plan 04: Linea de tiempo de Sobre mi con cuatro etapas Summary

Linea de tiempo de Sobre mi con aprendoclub como una sola etapa continua (nov 2022 a hoy), Loops Growth en paralelo (2024 a hoy) con la frase aprobada de D-12, cero marcadores y verificadores endurecidos para que el marcador sea FAIL en cualquier ruta. Copia EN preparada como traduccion fiel en estado propuesto. Sin escrituras a la base y sin acceso a ella.

## Que quedo hecho

**Task 1 (tracer), commit ab0e198.**
- `56-about-copy.ts` aloja el copy de Sobre mi. El texto ES de hero, bio, contadores, especialidades, educacion y ponencias no cambio. Solo se reescribio `experience`.
- Cuatro etapas en orden cronologico: Cripto Avances y Nakama Digital (ene 2022 a sept 2022), aprendoclub (nov 2022 a hoy, rol Senior Tech SEO Analyst), Loops Growth (2024 a hoy, frase de D-12 tal cual seguida de "Sigo trabajando ahí.") y coach del diplomado (mar 2025 a hoy, con su enlace).
- El cuerpo de aprendoclub reordena frases ya aprobadas del copy anterior y no agrega ningun hecho nuevo.
- El lead ya no afirma que las tres marcas son el mismo equipo: "Trabajo en dos empresas de SEO a la vez: aprendoclub desde noviembre de 2022 y Loops Growth desde 2024."
- `ABOUT_COPY_EN` traduce todo el ES (fiel), con `hero.lead` no vacio como centinela del respaldo de idioma y la frase EN de D-12 tal cual. Omite los campos no localizados (`icon`, `current`, `linkHref`).
- `DECISIONS`: D-11 (aprobado), D-11-lead (propuesto), D-11-ingeniero (aprobado) y ABOUT-EN (propuesto, gate aprobado).
- `54-about-copy.ts` reexporta `ABOUT_COPY_ES` y `ABOUT_PENDING_PATHS` (vacio). `evaluateShadowState` recibe `expectedStages` (por defecto 4).
- La autoprueba de la 54 exige cero marcadores, cada `when` dentro de `ALLOWED_WHEN` (y el EN dentro de `ALLOWED_WHEN_EN`), una sola etapa de aprendoclub, ausencia de "mismo equipo" en el lead y misma cantidad de etapas en EN y ES. El conteo de etapas sale de la constante.

**Task 2 (auto), commit 050ce4f.**
- `54-page-contract.mjs`: se borro `KNOWN_PENDING` y su bucle. La autoprueba da FAIL esperado para el marcador en `/sobre-mi`, `/en/sobre-mi` y otra ruta; el caso "un WARN y ningun fallo" desaparecio.
- `54-about-ssr.ts`: etapas, etapas actuales (3) y pasadas (1) y la etapa con enlace salen de `ABOUT_COPY_ES`. La exigencia del marcador se invirtio: no debe estar en el texto ni en ningun atributo. Se conservan las comprobaciones de aria-label y title.
- `23-phase54-verify-schema.ts`: el fixture y `expectedStages` se derivan del copy.
- `20-phase54-seed-shadow-content.ts`: solo una nota en el encabezado (la siembra de about-page ya no pasa por este script porque `mergeGroup` se niega a reducir etapas de 5 a 4).

**Task 3 (checkpoint:decision): resuelto sin preguntar.** Juan ya lo respondio en `.planning/phase-56-prep/aprobaciones-juan.md`:
1. Linea de tiempo: cuatro etapas aprobada.
2. "Ingeniero de software" con fin 2028 es un titulo universitario en curso y se conserva como educacion (no como cargo).
3. Fila de autor: la experiencia de aprendoclub dice "nov 2022 a feb 2026" y contradice "nov 2022 a hoy". Va como insumo para 56-14 (se corrige en el corte).
4. Copia EN: sigue en estado propuesto, a la espera de su aprobacion.

## Verificacion

- `54-seed-selftest.ts`: Todos los casos en PASS.
- `56-content-guard.mjs` (`--data` y sin banderas): PASS, 3 archivos de datos 56 revisados.
- `56-gate.ts`: sin problemas de forma; avisos y un INFO esperados (D-11-lead, ABOUT-EN, las seis MSG).
- `54-page-contract.mjs --selftest`: PASS, con el marcador en `/sobre-mi` y `/en/sobre-mi` como FAIL esperado.
- `54-about-ssr.ts`: sale 0 con 76 casos PASS y cuatro etapas.
- `23-phase54-verify-schema.ts --selftest`: 3 PASS.
- `56-run-all.mjs --selftests`: PASS completo, incluida la regresion de la 55 y la 54.
- `npx tsc --noEmit`: sin errores.
- `56-review-export.ts --only D-11 ABOUT`: imprime la propuesta de cuatro etapas.
- Barrera del tracer: con `AUTO_CFG` falso y `HUMAN_VERIFY_MODE=end-of-phase` se volvio a correr la verificacion automatizada de Task 1 y paso antes de expandir.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El estado D-11 de la propuesta pasa a aprobado**
- **Found during:** Task 1.
- **Issue:** el plan describe D-11 como `propuesto` y la linea de tiempo como pendiente. La instruccion del orquestador y `aprobaciones-juan.md` ya la dan por aprobada, y dejarla `propuesto` habria hecho fallar el gate de la fase 57 sin motivo.
- **Fix:** `ABOUT_TIMELINE` con `status: 'aprobado'`, `gate: 'aprobado'`. El lead nuevo y la copia EN conservan `propuesto`.
- **Files modified:** `scripts/db/data/56-about-copy.ts`
- **Commit:** ab0e198

**2. [Rule 2 - Missing critical] Decisiones adicionales D-11-lead y D-11-ingeniero**
- **Found during:** Task 1.
- **Issue:** el lead nuevo es texto redactado por Claude que Juan no vio, y la confirmacion de "Ingeniero de software" debia quedar registrada para el gate.
- **Fix:** dos entradas extra en `DECISIONS` con prefijo D-11 (convencion del registro).
- **Files modified:** `scripts/db/data/56-about-copy.ts`
- **Commit:** ab0e198

### Notas de proceso

- `commits: 4` es el conteo medido de `git rev-list` desde `plan_head_before`. Solo dos son de este plan (ab0e198 y 050ce4f). Los otros dos (cf5379a y 16df8c1) son de los planes 56-03 y 56-02, que corrian en paralelo en el mismo checkout. `actuals.commits` cuenta los dos propios.
- La Task 3 no se ejecuto como parada: la respuesta de Juan ya existia en el registro de aprobaciones.
- `evaluateShadowState` solo se importa desde los scripts 20 y 23 y la autoprueba; ningun otro consumidor cableaba el 5.

## Auth gates

Ninguno. El plan no abre la base ni la red.

## Known Stubs

Ninguno. La opcion `cinco-etapas` no es un stub: queda sin datos a proposito y `stagesFor()` falla con un mensaje claro si alguien la elige.

## Threat Flags

Ninguno. No hay endpoints, rutas de autenticacion ni acceso a archivos nuevos. T-56-12, T-56-13 y T-56-14 quedan mitigados: lista cerrada de fechas verificada, marcador FAIL en toda ruta y ningun script de este plan escribe en la base.

## Items abiertos para Juan

1. **Copia EN de Sobre mi (ABOUT-EN):** traduccion fiel en estado propuesto. Se lee con `node_modules/.bin/tsx scripts/verify/56-review-export.ts --only ABOUT`. Hasta que la apruebes, el gate de la fase 57 la marca.
2. **Lead de Experiencia (D-11-lead):** "Trabajo en dos empresas de SEO a la vez: aprendoclub desde noviembre de 2022 y Loops Growth desde 2024." Es texto nuevo, propuesto.
3. **Fila de autor de aprendoclub:** dice "nov 2022 a feb 2026". Se corrige a "nov 2022 a hoy" en el corte (plan 56-14), y esa correccion necesita tu aprobacion cuando se cargue.
4. **Siembra con recorte (plan 56-12):** bajar de 5 a 4 etapas exige bandera explicita y tu aprobacion nombrada, porque `mergeGroup` se niega a reducir filas. Este plan no escribe en la base.
5. **EN de `when`:** usa "Jan 2022 to Sep 2022", "Nov 2022 to today", "2024 to today" y "Mar 2025 to today", alineado con `dateRange` de `messages/en.json`.

## Self-Check: PASSED

Archivos presentes: `56-about-copy.ts`, `54-about-copy.ts`, `54-seed-lib.ts`, `54-seed-selftest.ts`, `54-page-contract.mjs`, `54-about-ssr.ts`, `23-phase54-verify-schema.ts`, `20-phase54-seed-shadow-content.ts`. Commits ab0e198 y 050ce4f presentes en la rama feat/mui-redesign.
