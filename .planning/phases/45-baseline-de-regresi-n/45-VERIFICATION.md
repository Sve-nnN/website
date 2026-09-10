---
phase: 45-baseline-de-regresi-n
verified: 2026-09-03T00:00:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Revisar `45-REGRESSION-BASELINE.md` sección Lighthouse Mobile: la mediana de performance de `/` da 71 (LCP 5461ms), mientras que el propio plan 45-03 (Task 3, human-check de fin de fase) esperaba un número plausible 'cerca de 85-90, no cerca de 47' frente a la referencia de 94 en PageSpeed Insights del 2026-08-25."
    expected: "Juan confirma si 71 es plausible dado lo que sabe del estado real del sitio (atribuido en el documento a contención de CPU local, con el TTFB de 0,71-0,92s como evidencia de que el servidor no es la variable que se mueve) o si amerita re-captura en condiciones de menor carga."
    why_human: "Es un juicio de plausibilidad de una medición de laboratorio con alta varianza (10/14 rutas escalaron a 5 lecturas por spread >15 puntos), no algo que un grep o assertion pueda decidir. El propio plan declaró explícitamente `human_verify_mode = end-of-phase` para este punto."
  - test: "Revisar que el número de tráfico orgánico real (22 clics / 6.328 impresiones en 28 días) coincide con el modelo mental de Juan del sitio, y que la prosa de `45-REGRESSION-BASELINE.md` suena a su voz y no a IA."
    expected: "Confirmación de Juan de que el número y el tono son correctos."
    why_human: "Juicio de voz/tono y de plausibilidad de negocio — mismo human-check de fin de fase declarado en el plan 45-03 (Task 3), no verificable por automatización."
---

# Phase 45: Baseline de Regresión Verification Report

**Phase Goal:** Existe la foto medible del estado actual del sitio contra la cual el gate de cierre va a comparar: Lighthouse/CWV, H1, JSON-LD, canonical/hreflang, el snapshot de Search Console y el tráfico mensual real con número.
**Verified:** 2026-09-03
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Existe un artefacto de baseline con Lighthouse/CWV + H1 + JSON-LD + canonical/hreflang de las 14 rutas críticas, medido contra producción, mismo procedimiento de Phase 32/36 | ✓ VERIFIED | `45-REGRESSION-BASELINE.md` tiene las 4 secciones completas con 14 filas cada una. `45-baseline-content.json` (14 rutas, H1 count>=1, sin `{error}`), `45-baseline-headlinks.json` (14 rutas, canonical + 3 hreflang cada una), `lh-phase45-baseline.json` (mediana de 3 o 5 lecturas por ruta según spread, 14 rutas, shape idéntico a `lh-phase32-baseline.json`), `lh-phase45-run1/2/3.json` + `run4/5-escalated.json` (0 errores confirmado por assertion directa sobre los JSON) |
| 2 | Existe un snapshot guardado de Search Console (impresiones, clics, posición media, ventana temporal declarada) de esas mismas rutas | ✓ VERIFIED | `45-gsc-snapshot.json` (190 páginas + `_meta`, 34.7KB de datos reales, no un stub). Sección `## Search Console` del baseline documenta ventana 2026-07-31→2026-08-27, 8/14 rutas críticas con datos, 6 marcadas explícitamente "sin datos en la ventana" (no celdas vacías) |
| 3 | El tráfico mensual real del sitio queda escrito con número, y `DECISIONS.md` de Phase 44 se actualiza reemplazando la incógnita `V` | ✓ VERIFIED | Sección `## Trafico real y V`: "22 clics y 6.328 impresiones en la ventana 2026-07-31 → 2026-08-27" con método declarado. `DECISIONS.md` de Phase 44 confirmado sin ninguna ocurrencia de `INCOGNITA`/`INCÓGNITA` (grep negativo), con `V(stack) = 0` y el número real escrito en 4 puntos distintos del documento; fórmula paramétrica y tabla de tramos preservadas verbatim |
| 4 | `git diff` sobre `src/` queda vacío en toda la fase — ningún cambio renderizado precedió a la captura | ✓ VERIFIED | `git log --oneline 73f745f..HEAD -- src/` no devuelve ningún commit; `git diff --stat 73f745f HEAD -- src/` vacío. Verificado sobre el rango completo de la fase (13 commits desde el contexto/desbloqueo hasta el cierre del plan 03), no solo sobre los commits declarados en los SUMMARY |

**Score:** 4/4 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `45-REGRESSION-BASELINE.md` | Documento con 6 secciones (Lighthouse, H1/JSON-LD, Canonical/hreflang, Search Console, Tráfico real y V, Veredicto) | ✓ VERIFIED | Las 6 secciones presentes, 14 filas cada tabla, veredicto "14/14 routes clean", 0 marcadores TBD/FIXME/TODO/XXX residuales, 0 em-dash/en-dash (pasada de humanización confirmada por conteo directo) |
| `45-baseline-content.json` | H1 + JSON-LD de 14 rutas | ✓ VERIFIED | 14 keys, todas con `h1Count>=1`, sin `{error}` |
| `45-baseline-headlinks.json` | Canonical + hreflang de 14 rutas | ✓ VERIFIED | 14 keys, todas con canonical string y hreflang array (3 elementos) |
| `45-gsc-snapshot.json` | Snapshot de Search Console | ✓ VERIFIED | 190 páginas + `_meta`, datos reales (URLs del sitio real, no fixtures) |
| `lh-phase45-baseline.json` | Mediana de Lighthouse por ruta | ✓ VERIFIED | 14 rutas, shape idéntico a `lh-phase32-baseline.json`, 7 métricas por ruta |
| `scripts/capture-head-links-snapshot.mjs` | Script hermano nuevo para canonical/hreflang | ✓ VERIFIED | 122 líneas, mismo contrato CLI (`--base-url`/`--out`/`--routes`) que `capture-service-page-snapshot.mjs`, el cual queda sin modificar (confirmado: no aparece en ningún commit de la fase) |
| `.planning/phases/44-decisiones-de-monetizaci-n/DECISIONS.md` | V resuelto | ✓ VERIFIED | Modificado en commit `18f8852`, sin `src/` afectado, incógnita reemplazada por número real |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `scripts/lighthouse-mobile.mjs` | `lh-phase45-run{1,2,3,4,5}.json` | Ejecución CLI contra `https://juan-tech.com`, 14 rutas | WIRED | Script preexistente reutilizado sin modificar, salidas con datos numéricos reales y variados (no estáticos) |
| `scripts/capture-head-links-snapshot.mjs` | `45-baseline-headlinks.json` | Ejecución CLI, fetch HTML real | WIRED | Nuevo script, salida con 14 URLs distintas de canonical y hreflang reales, no un valor repetido/hardcodeado |
| GSC vía hub MCP (`gsc-juan-compare-search-periods`) | `45-gsc-snapshot.json` | JSON-RPC directo (fallback documentado en 45-RESEARCH.md) | WIRED | 190 páginas con datos `p1_*`/`p2_*` distintos por página, consistente con datos reales de la propiedad `sc-domain:juan-tech.com` |
| `45-REGRESSION-BASELINE.md` (número de tráfico) | `DECISIONS.md` (Phase 44) | Cita cruzada + valor idéntico (22 clics/mes) | WIRED | Mismo número (22 clics, 6.328 impresiones) aparece en ambos documentos, con referencia cruzada explícita |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| BASE-01 | 45-01, 45-02 | Baseline Lighthouse/CWV + H1 + JSON-LD + canonical/hreflang | ✓ SATISFIED | Ver Truth 1 |
| BASE-02 | 45-03 | Snapshot de Search Console | ✓ SATISFIED | Ver Truth 2 |
| BASE-03 | 45-03 | Tráfico mensual real con número | ✓ SATISFIED | Ver Truth 3 |

No hay requirements huérfanos: REQUIREMENTS.md solo mapea BASE-01/02/03 a Phase 45, y las tres aparecen declaradas en los tres planes.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | Ninguno en los artefactos entregados (`45-REGRESSION-BASELINE.md`, JSON, script nuevo) | — | Las menciones de "TBD"/"placeholder" encontradas por grep viven únicamente en `45-01-PLAN.md` (instrucciones de planificación, ya resueltas), no en el documento final |

Nota informativa (no bloqueante): `ROADMAP.md` línea 87 todavía marca la Phase 45 con checkbox `- [ ]` pese a que `STATE.md` y los tres SUMMARY confirman la fase cerrada (3/3 planes). Es un desfase de bookkeeping en el checkbox de la lista corta, no afecta ninguno de los 4 criterios de éxito ni los artefactos verificados.

### Human Verification Required

### 1. Plausibilidad del número de Lighthouse mobile en `/`

**Test:** Revisar `45-REGRESSION-BASELINE.md` sección Lighthouse Mobile — la mediana de performance de `/` da 71 (LCP 5461ms).
**Expected:** El propio plan 45-03 (Task 3, human-check declarado como `human_verify_mode = end-of-phase`) esperaba un número "cerca de 85-90, no cerca de 47" frente a la referencia de 94 en PageSpeed Insights del 2026-08-25. El resultado real (71) no cae en ninguna de las dos bandas que el plan anticipaba como señal de lectura correcta — Juan debe confirmar si 71 es aceptable como baseline o si amerita re-captura.
**Why human:** Juicio de plausibilidad de una medición de laboratorio con varianza alta (10/14 rutas escalaron a 5 lecturas), explícitamente diferido por el propio plan a revisión humana de fin de fase, no verificable por assertion automática.

### 2. Plausibilidad del número de tráfico real y de la voz de la prosa

**Test:** Revisar que 22 clics/6.328 impresiones mensuales coincide con el modelo mental de Juan del sitio, y que la prosa de `45-REGRESSION-BASELINE.md` suena a su voz.
**Expected:** Confirmación explícita de Juan.
**Why human:** Mismo human-check de fin de fase declarado en el plan 45-03 (Task 3) — juicio de negocio y de voz, no automatizable.

### Gaps Summary

No hay gaps. Los 4 criterios de éxito del ROADMAP y los 3 requirements (BASE-01/02/03) están verificados contra artefactos reales en disco, con datos sustantivos (no stubs) y sin ningún cambio en `src/` durante toda la fase (confirmado sobre el rango completo de 13 commits, no solo los declarados en los SUMMARY). El único motivo por el que el estado no es `passed` es que el propio plan 45-03 diseñó un human-check de fin de fase (Lighthouse plausible + voz de la prosa) que todavía no tiene la confirmación explícita de Juan registrada en ningún artefacto — ese ítem, por diseño de la fase, se resuelve en la revisión humana orquestada al cierre, no en este reporte.

---

*Verified: 2026-09-03*
*Verifier: Claude (gsd-verifier)*
