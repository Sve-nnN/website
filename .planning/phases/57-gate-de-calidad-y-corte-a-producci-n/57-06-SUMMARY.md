---
phase: 57-gate-de-calidad-y-corte-a-producci-n
plan: 06
subsystem: frontend
status: complete
tags: [cabeceras, isr, a11y, enlaces, rendimiento, gate]
requires: [57-01, 57-02, 57-03]
provides:
  - src/lib/client-hint-headers.mjs (filtro de la pista de tema de Payload)
  - scripts/verify/57-headers-check.mjs (--selftest, --static, vivo)
  - scripts/verify/57-link-targets.ts (destinos de enlace por idioma)
  - src/components/mui/rich-text/EmailCaptureState.tsx (estado de captura en el cliente)
  - evidence/57-findings-status.md (F1 a F5 y F13 medidos en el preview)
affects: [57-07, 57-08, 57-09, 57-11]
tech-stack:
  added: []
  patterns:
    - "Estado de URL leído en el cliente con useSearchParams dentro de Suspense para que la ruta siga en ISR"
    - "Corrección de enlaces de contenido al renderizar, sin escribir en la base"
key-files:
  created:
    - src/lib/client-hint-headers.mjs
    - scripts/verify/57-headers-check.mjs
    - scripts/verify/57-link-targets.ts
    - src/components/mui/rich-text/EmailCaptureState.tsx
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-findings-status.md
  modified:
    - next.config.mjs
    - src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx
    - src/components/mui/rich-text/blocks.tsx
    - src/components/mui/rich-text/MuiRichText.tsx
    - src/theme/theme.ts
    - src/i18n/navigation.ts
    - src/lib/translation-gaps.ts
    - scripts/verify/57-perf-compare.mjs
    - scripts/verify/57-a11y-sweep.mjs
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-gate-items.md
decisions:
  - "F2: la pista de tema sale de /:path* y queda solo en /admin/:path* (decisión 14), con un filtro sobre headers() y sin tocar node_modules"
  - "F1: el post vuelve a revalidate 60; el estado ?subscribed= se lee en el cliente y el HTML cacheado es el mismo para todos"
  - "F3 no aplica: el LCP de home, servicio y post no es una imagen"
  - "F4: un enlace a un gemelo EN noindex apunta a la versión ES canónica, resuelto en isPrefixableHref y al renderizar el texto enriquecido"
  - "Regla de rendimiento: producción + max(10%, 50 ms) en LCP, TTFB y TBT (decisión 11b)"
  - "El TTFB más alto de home, EN y servicio en 57-03 es entorno (STALE con poco tráfico), no código"
metrics:
  completed: 2026-11-17
actuals:
  tasks: 4
  commits: 8
plan_head_before: dea61a75fbf466e2b549b7e1a64bb15f43e86484
plan_head_after: 733302f
---

# Phase 57 Plan 06: cabeceras limpias, post en caché y correcciones del gate Summary

El preview ya no emite la pista de tema de Payload ni x-powered-by. El post sale de la caché incremental, con TTFB de 282 ms contra 1570 en producción. Ningún enlace interno da 404, y el foco de teclado se ve en toda la home. El arreglo de los últimos 8 enlaces a gemelos EN noindex está hecho, pero el disco del VPS impidió desplegarlo.

## Tareas

| Tarea | Commit | Resultado |
|---|---|---|
| 1. F2, F13 y F3 | 34c7ec0 | Filtro de cabeceras y poweredByHeader en false. F3 no aplica |
| 2. F1, post sin force-dynamic | 0bb2a29 | Estado de captura en el cliente; revalidate 60 |
| 3. Disco y push | push de d68832b | Disco antes: 78% y 17 GB libres. Build done. Producción respondió 200 en cada sondeo durante el build |
| 4. Medición en el preview | 733302f | evidence/57-findings-status.md con las seis filas |
| Extra 1, decisión 14 | 34c7ec0 | /admin conserva Accept-CH en vivo |
| Extra 2, enlaces internos | d7de694, b522695 | 17 fallos bajan a 8 en el preview (0 enlaces rotos); los 8 del cuerpo EN quedan resueltos en b522695, sin desplegar |
| Extra 3, foco de MUI | de0d228, 5c01dd0 | Home ES y EN pasan a 375 y 1280 px |
| Extra 4, regla max(10%, 50 ms) | d68832b | Registrada como decisión 11b en 57-gate-items.md |
| Extra 5, TTFB | 733302f | Entorno: con caché caliente el preview y producción quedan iguales (262 a 270 ms) |

## Verificación

- `57-headers-check.mjs` en vivo contra el preview: 9 de 9 PASS. `--selftest` y `--static` en PASS.
- Posts en el preview: 9 URLs en ES y EN dan 200 con `x-nextjs-cache: HIT`, entre ellas una con captura y otra con afiliados. El navegador confirma los cinco estados de `?subscribed=` sin errores de JS.
- `57-perf-compare`: las cuatro URLs pasan. El proxy de INP del preview sigue en 168 a 192 ms contra 64 ms en producción. Queda fuera de la regla, pero 57-09 debe verlo.
- `57-seo-parity-all`: 172 de 174 URLs sin diferencias. Las 2 restantes son conocidas: la categoría general, que Juan acepta en 57-09. Hay 8 fallos de enlaces, todos gemelos noindex que b522695 corrige.
- tsc, `56-run-all --selftests --strict` (159 PASS, 0 FAIL) y `57-link-targets` en PASS.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El barrido de accesibilidad marcaba tarjetas con anillo como FAIL**
- **Found during:** Tarea 4
- **Issue:** ProjectCard, CaseMetricCard y SiteCard dibujan el anillo en la tarjeta con `:has(a:focus-visible)`, pero el barrido solo miraba el enlace.
- **Fix:** el barrido cuenta un ancestro cercano que contiene el foco visible y tiene un outline de 2 px. Las autopruebas 6 y 6b cubren los dos casos.
- **Commit:** 5c01dd0

**2. [Rule 2] Comprobación estática de la ruta del post**
- `57-headers-check --static` también exige que la ruta no lea searchParams, que exporte revalidate y que la captura vaya dentro de Suspense (Pitfall 4).

### Desvíos de proceso

- El commit WIP del primer corte se reemplazó por commits limpios antes del push (reset suave, sin historia publicada).
- La primera corrida de paridad olvidó `EXPECT_PREVIEW=1`, y la segunda la sobrescribió.
- No hubo segundo push. Después del build el disco quedó en 81% de uso con 14 GB libres, fuera del umbral de Juan.

## Pendiente para Juan (57-09 y corte)

1. Liberar disco en el VPS (por ejemplo, la caché de build de 2,4 GB e imágenes viejas) y empujar b522695, 5c01dd0 y 733302f. Después, repetir `57-seo-parity-all` con `EXPECT_PREVIEW=1` para confirmar 0 gemelos noindex.
2. Tras el corte, revisar a mano el tema automático de /admin.
3. Confirmar el foco a ojo (punto 1 de 57-A11Y-MANUAL.md) y decidir sobre el proxy de INP.

## Threat Flags

Ninguna. El filtro conserva las cabeceras de seguridad (T-57-19), el HTML cacheado del post no depende del parámetro (T-57-20) y el disco se revisó antes del push (T-57-21).

## Self-Check: PASSED

- FOUND: 34c7ec0, 0bb2a29, de0d228, d7de694, d68832b, b522695, 5c01dd0 y 733302f en HEAD
- FOUND: los archivos creados y evidence/57-findings-status.md
