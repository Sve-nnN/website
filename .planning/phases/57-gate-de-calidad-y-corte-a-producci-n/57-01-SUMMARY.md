---
phase: 57-gate-de-calidad-y-corte-a-producci-n
plan: 01
subsystem: infra
status: complete
tags: [dokploy, vps, disco, preview, seo-02, gate]
requires: []
provides:
  - scripts/verify/57-dokploy-status.mjs (estado de despliegue y contenedor, solo GET, --wait, --selftest)
  - scripts/verify/57-vps-disk-check.mjs (disco del VPS por SSH o --from-file, umbral A9, --selftest)
  - evidence/57-baseline-preview.md (línea base, SEO-02, causa de cada FAIL)
affects: [57-05, 57-08, 57-11]
tech-stack:
  added: []
  patterns:
    - "Credenciales parseadas del archivo línea por línea y redactadas antes de imprimir"
    - "Último despliegue por createdAt descendente, nunca el primero de la lista"
key-files:
  created:
    - scripts/verify/57-dokploy-status.mjs
    - scripts/verify/57-vps-disk-check.mjs
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-baseline-preview.md
  modified: []
decisions:
  - "57-dokploy-status sale con 2 mientras el despliegue sigue en curso y, con --wait, reintenta también cuando la API rechaza conexiones porque Dokploy se reinicia bajo carga"
  - "No se disparó un despliegue nuevo del preview para pasar de cancelled a done: el código servido ya coincide con HEAD y otro build en el VPS hoy reinició producción"
metrics:
  duration: 25min
  completed: 2026-11-17
actuals:
  tokens: 9500
  tasks: 4
  commits: 3
plan_head_before: 78d8c4eac927094f214d8bec2396a4ed01ebfc49
plan_head_after: 13a5bc142173563f34dd704ca5a862063ec7995a
---

# Phase 57 Plan 01: herramientas de Dokploy y de disco, línea base del preview Summary

Dos herramientas de solo lectura (estado de Dokploy por API con redacción del token, y disco del VPS por SSH con umbral de 80% y 15 GB) y la línea base del preview: SEO-02 sin cambios contra master, batería viva de la 56 en 24 de 27, y el hallazgo de que un build del preview reinicia todos los servicios del VPS, producción incluida.

## Tareas

| Tarea | Nombre | Commit | Archivos |
|---|---|---|---|
| 1 | Herramientas de solo lectura de Dokploy y del disco | f1703c9, 501286d | scripts/verify/57-dokploy-status.mjs, scripts/verify/57-vps-disk-check.mjs |
| 2 | Línea base y SEO-02 por diff | 13a5bc1 | evidence/57-baseline-preview.md |
| 3 | Checkpoint de disco y push | resuelto antes del plan | ver abajo |
| 4 | Espera del despliegue, contenedor y batería después del push | 13a5bc1 (misma evidencia) | evidence/57-baseline-preview.md |

### Tarea 3: checkpoint resuelto

Juan autorizó en el chat del 2026-11-17 ("si limpia el disco"). El orquestador corrió `sudo docker builder prune -af` (7.75 GB liberados, disco al 73%) y empujó `feat/mui-redesign`. Comprobado aquí: `git log origin/feat/mui-redesign..HEAD` estaba vacío al arrancar, y `57-vps-disk-check` dio PASS a las 16:57 UTC (75%, 19 GB libres) y a las 17:04 UTC (77%, 17 GB libres).

## Resultados

- Selftests: 15 PASS en 57-dokploy-status y 8 PASS en 57-vps-disk-check. Los greps de aceptación (sin POST, sin `application.deploy`, sin limpiezas) pasan. Ninguna salida guardada contiene el token.
- SEO-02: `git diff --stat master...HEAD` de sitemap.xml, sitemap.html, llms.txt, llms-full.txt y sitemap-data.ts sale vacío.
- `53-wait-preview` OK y `53-preview-contract` todo en PASS.
- Batería 56 en vivo: 24 PASS y 3 FAIL. Los 4 FAIL de despliegue del handoff ya pasan. Quedan: 55-seo-parity (500 y 502 del reinicio; al repetirla, 152 de 156 con 4 diferencias de `dateModified` por una edición de dos posts a las 17:11 UTC), 55-content-parity (6 posts EN enlazan `/services/...`, una diferencia aceptable) y 54-about (alt EN vacío en la foto de Sobre mí, posible defecto de contenido que 57-05 confirma).
- `57-dokploy-status --app web`: PASS, done y contenedor running.
- `57-dokploy-status --app preview`: **FAIL**, el último despliegue (78d8c4e, 16:54 UTC) quedó cancelled.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 57-dokploy-status se colgaba o fallaba mientras Dokploy se reiniciaba**
- **Found during:** Tarea 4
- **Issue:** una consulta tardó más de 120 s sin respuesta y después la API devolvió ECONNREFUSED durante el reinicio de Dokploy, así que `--wait` abortaba en lugar de esperar.
- **Fix:** plazo de 45 s por GET con `AbortSignal.timeout` y, con `--wait`, reintento de los errores de red hasta el plazo.
- **Files modified:** scripts/verify/57-dokploy-status.mjs
- **Commit:** 501286d

### Desvíos de proceso

- La sección "Antes del push" no tiene foto del preview viejo: el orquestador ya había empujado. Queda la referencia del handoff (23 PASS y 4 FAIL).
- Tareas 2 y 4 escriben el mismo archivo de evidencia y comparten el commit 13a5bc1.

## Hallazgo bloqueante para el must-have del preview

El build de 78d8c4e cargó el VPS (load 29, 8 GB sin swap). A las 17:02:41 Swarm reprogramó las tareas de todos los servicios del nodo, mató el `npm run build` y reinició Dokploy, dokploy-postgres y el `web` de producción. Al arrancar, Dokploy canceló el despliegue en curso. `dmesg` muestra además un OOM kill del `web` de producción el 2026-11-17 a las 04:34, durante el despliegue del preview de las 04:29.

El preview sirve la imagen del despliegue done de 1ef3cc4 (16:44 UTC), y entre ese commit y HEAD no cambia nada en `src`. El código servido es el final, pero el must-have "el despliegue terminó en done" no se cumple. No empujé para no disparar otro build con este riesgo para producción. Juan decide antes del próximo push. Opciones: redeploy en una hora de poca carga, limitar la memoria del build o compilar fuera del VPS. El orquestador o 57-11 lo tienen que tener en cuenta: el deploy de `web` del corte usa el mismo VPS.

## Threat Flags

Ninguno nuevo. Los dos scripts solo leen: la API de Dokploy por GET y el VPS por SSH con `df`, `docker system df` y `find`.

## Self-Check: PASSED

- FOUND: scripts/verify/57-dokploy-status.mjs, scripts/verify/57-vps-disk-check.mjs, evidence/57-baseline-preview.md
- FOUND: f1703c9, 501286d, 13a5bc1 en HEAD
