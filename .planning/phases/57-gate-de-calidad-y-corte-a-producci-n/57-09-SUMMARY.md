---
phase: 57-gate-de-calidad-y-corte-a-producci-n
plan: 09
subsystem: verificacion
status: complete
tags: [gate, precondiciones, excepciones, snapshot, cal-01-diferido]
requires: [57-05, 57-08]
provides:
  - evidence/57-pre-merge-checklist.md (23 precondiciones con estado honesto)
  - evidence/57-prod-snapshot-pre.json (línea base de producción previa al corte, D-13)
  - evidence/57-exceptions.md (respuestas literales de Juan del 2026-11-24)
  - 57-GATE-REPORTE.md regenerado sobre 19d0a09
affects: [57-10, 57-11, 57-12]
actuals:
  tokens: 14000
  tasks: 3
  commits: 2
plan_head_before: 19d0a093515998b6235c30fec847f51193278386
plan_head_after: e5c3a69
key-files:
  created:
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-pre-merge-checklist.md
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-prod-snapshot-pre.json
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-exceptions.md
  modified:
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/57-GATE-REPORTE.md
decisions:
  - "La fecha efectiva legal es el día del merge: Juan dijo \"Hoy, 2026-11-24\"; 57-11 debe detenerse y avisar si el merge cae otro día"
  - "El alt EN de la foto de Sobre mí se escribe de forma aditiva en el Media p54-about-hero en el paso del cargador (57-10 o 57-12), no antes"
  - "Las diferencias de palabras de /blog/general (-11,1% ES, -10,1% EN) quedan aceptadas: falta solo el contador \"0 artículos\" y una fila repetida"
  - "T-55-15 (revalidación de admin) se ejecuta tras el corte como cambio inocuo y reversible"
  - "CAL-01 queda abierto: Juan difirió la revisión humana a producción tras el corte"
requirements-completed: []
coverage:
  - id: D1
    description: "Checklist de precondiciones del merge y snapshot de producción previo al corte"
    verification:
      - kind: other
        ref: "test -s evidence/57-prod-snapshot-pre.json && node scripts/verify/57-run-all.mjs --selftests --strict"
        status: pass
    human_judgment: false
  - id: D2
    description: "Una respuesta escrita de Juan por cada excepción y diferencia del reporte"
    requirement: "GO-02"
    verification: []
    human_judgment: true
    rationale: "Las respuestas son decisiones de Juan; la constancia está en 57-exceptions.md. GO-02 sigue pendiente de la frase del merge en 57-10."
  - id: D3
    description: "Revisión humana de accesibilidad y diseño (CAL-01)"
    requirement: "CAL-01"
    verification: []
    human_judgment: true
    rationale: "No hecha. Diferida por Juan a producción tras el corte; ninguna herramienta la reemplaza (T-57-34)."
---

# Phase 57 Plan 09: precondiciones del merge, snapshot de producción y excepciones firmadas Summary

La checklist de 23 precondiciones y el snapshot de producción previo al corte existen, Juan respondió por escrito cada excepción el 2026-11-24, y la revisión humana (CAL-01) queda explícitamente diferida a producción, no cumplida.

## Tareas

| Tarea | Commit | Resultado |
|---|---|---|
| 1. Precondiciones y snapshot de producción | 49d716e | Snapshot de 174 URLs y sitemap de 166 locs, solo GET. Checklist con 23 filas. Reporte regenerado sobre `19d0a09`. Autotests `--selftests --strict` en 0 (15 PASS) |
| 2. Revisión humana de accesibilidad y diseño | sin commit | **DIFERIDA por Juan.** Literal, 2026-11-24: "con respecto a la revision humana difierela y la reviso todo en produccion." No se creó `57-human-review.md` porque no hay hallazgos que registrar |
| 3. Aceptación escrita de excepciones | e5c3a69 | `57-exceptions.md` con cada respuesta literal y fecha; checklist actualizada |

## Respuestas de Juan (2026-11-24, literales)

| ID | Respuesta | Efecto |
|---|---|---|
| `CUT-legal-date-efectiva` | "Hoy, 2026-11-24" | La fecha efectiva es el día del merge. 57-11 se detiene y avisa si el merge cae otro día |
| `54-about` alt EN | "Escribirlo en 57-10" | Escritura aditiva en el Media `p54-about-hero`, en el paso del cargador. No hecha todavía |
| `/blog/general` y `/en/blog/general` palabras | "Acepto la excepción" | Falta el contador "0 artículos" y una fila repetida; el copy propio es idéntico |
| F1, F2, F3, F4, F5, F13, proxy de INP, 10 ítems `propuesto`, T-55-15 | "Acepto todo, ejecuta T-55-15" | F1 a F5 y F13 no necesitan excepción; INP aceptado; los 10 ítems van al handoff; T-55-15 corre tras el corte |

## Estado de requisitos

- **CAL-01: ABIERTO, diferido, no cumplido.** La revisión con NVDA, VoiceOver, 375/900/1024/1280 px, zoom al 200% y teclado no se hizo. Juan la hará en producción tras el corte. Cualquier hallazgo que bloquee aparecerá con el sitio ya publicado; la salida es `57-ROLLBACK.md`. El 100 de Lighthouse y axe cubren solo parte de WCAG, por eso no se da por cumplido (T-57-34).
- **GO-02: pendiente.** La frase literal del merge se pide en 57-10, tarea 3.

## Deviations from Plan

### Decisiones del usuario que cambian el plan

**1. [Decisión de Juan] Tarea 2 diferida a producción**
- **Found during:** Tarea 2
- **Issue:** el plan marca la revisión humana como condición de CAL-01 antes del merge.
- **Fix:** Juan la difirió por escrito. Se registra como riesgo aceptado, CAL-01 sigue abierto y no se marca en REQUIREMENTS.md.
- **Files modified:** `57-pre-merge-checklist.md`, `57-exceptions.md`
- **Commit:** e5c3a69

**2. [Decisión de Juan] T-55-15 pasa de "antes del corte" a "tras el corte"**
- **Issue:** el plan la ejecuta contra el preview con escritura en producción antes del merge.
- **Fix:** Juan pidió ejecutarla; se hace tras el corte, cuando admin y sitio comparten proceso. No hay escrituras en producción desde este plan.

**Total deviations:** 2 decisiones del usuario, 0 auto-fixes. **Impact:** el merge puede pedirse sin revisión humana previa solo porque Juan asumió ese riesgo por escrito.

## Known Stubs

Ninguno. Este plan no crea código de interfaz.

## Estado del gate de decisiones

`tsx scripts/verify/56-gate.ts --gate` sale 1 con un solo ítem bloqueante: `CUT-legal-date-efectiva`. Está respondido (fecha del día del merge), pero el ítem pasa a `aprobado` en el código solo en 57-11, el día del merge, con la fecha real. Es el diseño de D-07 y 57-11, no una precondición olvidada.

## Self-Check: PASSED

- `evidence/57-pre-merge-checklist.md`, `evidence/57-prod-snapshot-pre.json`, `evidence/57-exceptions.md`: presentes.
- Commits 49d716e y e5c3a69: presentes en la rama `feat/mui-redesign`.
