---
phase: 57-gate-de-calidad-y-corte-a-producci-n
plan: 05
subsystem: gate-de-decisiones
status: complete
tags: [gate, decisiones, aprobaciones, sombra, go-02]
requires:
  - 57-01 (scripts de disco y despliegue, línea base del preview)
provides:
  - evidence/57-gate-items.md (lista vigente del gate, respuestas de Juan, decisiones de la fase 57, cierre del checkpoint de la sombra)
  - sección fechada 2026-11-17 en .planning/phase-56-prep/aprobaciones-juan.md
affects: [57-02, 57-03, 57-06, 57-08, 57-09]
tech-stack:
  added: []
  patterns:
    - "La lista de abiertos sale siempre de la salida vigente de 56-gate.ts --gate, nunca de memoria"
key-files:
  created:
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-gate-items.md
  modified:
    - .planning/phase-56-prep/aprobaciones-juan.md
decisions:
  - "Tolerancia de rendimiento del preview contra producción: 10% (PERF_TOLERANCE=0.1), aprobada por Juan el 2026-11-17"
  - "Umbral de disco del VPS antes de cada build: menos de 80% de uso y más de 15 GB libres, aprobado el 2026-11-17"
  - "Tolerancia de palabras indexables 2% (WORDS_TOLERANCE=0.02) y presupuesto de HTML del autor 500 KB, aprobados el 2026-11-17"
  - "Quitar Accept-CH, Vary y Critical-CH de Sec-CH-Prefers-Color-Scheme del sitio público y conservarlas solo en /admin/:path*; lo implementa 57-06"
  - "Fecha de corte D = 2026-12-01 como propuesta, antes si el gate queda en verde (D-15)"
metrics:
  duration: 20min
  completed: 2026-11-17
actuals:
  tokens: 9000
  tasks: 4
  commits: 2
plan_head_before: b31a6bc9be2faa553b2f3968be453dca7bf0ee9f
plan_head_after: 6f417ef0443b94ca5b66b78e91b26a3a721c9986
---

# Phase 57 Plan 05: Gate de decisiones y sombra de la 56 Summary

Juan ya contestó todo: el gate de decisiones de la 56 tiene un solo ítem abierto, `CUT-legal-date-efectiva`, que por diseño se fija el día del corte. Los umbrales de la fase 57 quedaron escritos y la sombra sembrada se confirmó en vivo en dev.

## Qué se hizo

**Tarea 1.** Corrí `56-gate.ts --gate` y guardé la salida íntegra en `evidence/57-gate-items.md`. De 100 filas, 89 están en aprobado, 10 en propuesto con gate propuesto (WARN, no bloquean) y 1 en pendiente. Lo aceptado en bloque el 2026-11-10 ya estaba aprobado desde el commit 33c7a41, y lo del chat del 14 al 16 de noviembre desde f85744a, 3d58bf8, 4db5641 y 62c1b2f. Por eso ningún archivo de datos cambió. La evidencia trae la tabla de lo abierto con la pregunta por ítem.

**Tarea 2 (checkpoint:decision).** Juan lo resolvió en el chat. Los puntos 1 a 10 remiten a sus respuestas del 14 al 16 de noviembre y los puntos 11 a 16 se aprobaron el 2026-11-17. No le volví a preguntar nada.

**Tarea 3.** Agregué a `aprobaciones-juan.md` la sección "Checkpoint de 57-05, respuestas de Juan (2026-11-17)". La evidencia suma la tabla de respuestas 1 a 10 y la sección "Decisiones de la fase 57" con cada valor y el plan que lo consume. `56-gate.ts` sin banderas sale con 0, `56-cutover-selftest.ts` también y `56-content-guard.mjs --scripts` da PASS. `56-gate.ts --gate` sale con 1 por un único ítem, `CUT-legal-date-efectiva`.

**Tarea 4 (checkpoint:human-action).** Ya estaba resuelta antes de este plan. La migración `20261110_220805_phase56_legal_shadow` se aplicó el 2026-11-15 y `25-phase56-verify-schema.ts` la verificó. La siembra de home-page y legal-pages en ES y EN se hizo el 2026-11-15, y la de about-page el 2026-11-16, después de la frase literal de Juan. Volví a correrla en vivo contra dev, solo con GET, a las 17:25 UTC: 56-no-marker-live dio 20 PASS, 56-cta-live 15 PASS y 56-legal-live 5 PASS, sin ningún FAIL.

## Dónde van los umbrales (no se tocó ningún script)

| Valor | Variable o regla | Plan |
|-------|------------------|------|
| 10% de rendimiento | `PERF_TOLERANCE=0.1` por defecto | 57-03, citado en 57-08 |
| Disco < 80% y > 15 GB | `DISK_MAX_PCT=80`, `DISK_MIN_FREE_GB=15` (ya por defecto) | 57-01; el comentario y la línea "supuesto A9, Juan lo confirma en 57-05" de `57-vps-disk-check.mjs` quedaron viejos, conviene actualizarlos cuando otro plan toque el script |
| Palabras 2% | `WORDS_TOLERANCE=0.02` por defecto | 57-02 |
| HTML del autor 500 KB | presupuesto de F5 | 57-02 |
| Pista de tema | regla aparte para `/admin/:path*` | 57-06 |

## Deviations from Plan

**1. [Rule 3 - Bloqueo] Worktree en una base equivocada.** El worktree arrancó en 6e9b02a (master viejo), sin el directorio de la fase 57. Hice `git reset --hard feat/mui-redesign` al arrancar, antes de cualquier trabajo, y quedó en b31a6bc.

**2. Sin commit de datos en la tarea 1.** El plan esperaba un commit que pasara a aprobado lo aceptado en bloque. Ese commit ya existía (33c7a41, que cita la línea del 2026-11-10), así que la tarea 1 solo commiteó la evidencia.

**3. Sin `git rm` en la tarea 3.** Los dos `scripts/_tmp-*-b0303.ts` no estaban versionados y el orquestador ya los había borrado.

**4. Las tareas 3 y 4 comparten commit.** El cierre del checkpoint de la sombra vive en la misma evidencia que las decisiones.

## Lo que sigue abierto

- `CUT-legal-date-efectiva`: el plan del corte fija `LEGAL_EFFECTIVE_DATE` en `56-legal-copy.ts` justo antes del merge. Mientras tanto, `--gate` sale con 1.
- Patricia Ibarra tiene que confirmar la cita optimizada antes del corte, porque va firmada con su nombre. El gate ya la tiene en aprobado.

## Self-Check: PASSED

- FOUND: .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-gate-items.md
- FOUND: .planning/phase-56-prep/aprobaciones-juan.md (sección del 2026-11-17)
- FOUND: aa3a2ad, 6f417ef en HEAD
