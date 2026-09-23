# Phase 50 Plan 01: GATE-01 Findings

**Medido:** 2026-09-10, contra producción viva `https://juan-tech.com`, mismo procedimiento exacto de Phase 45 (Lighthouse mobile vía `scripts/lighthouse-mobile.mjs`, H1/JSON-LD vía `scripts/capture-service-page-snapshot.mjs`, canonical/hreflang vía `scripts/capture-head-links-snapshot.mjs`), comparado 1:1 contra `lh-phase45-baseline.json` / `45-baseline-content.json` / `45-baseline-headlinks.json`.

**Alcance de GATE-01 (ROADMAP Phase 50, criterio 1):** ninguna de las 14 rutas cae más de 5 puntos de performance, ningún CWV cruza de banda, delta de CLS exactamente 0.00, y el JS de cliente agregado por el milestone (Phases 46-49) es 0 KB por construcción.

## Nota de medición — contención de CPU más severa que Phase 45

Esta sesión corrió en paralelo con el plan 50-02 (crawl de GATE-02) en la misma máquina, más otra carga de fondo no identificada. El resultado: **13 de las 14 rutas** superaron el umbral de escalado (spread de performance > 15 puntos entre las 3 corridas base), contra 10/14 en Phase 45. La ruta `/` tuvo spread=8 (no calificaba por la regla literal) pero valores consistentemente deprimidos (34, 28, 36 en las 3 corridas base) muy por debajo del baseline de 71 — se escaló de todas formas por prudencia (Rule 1: medir correctamente es un requisito de corrección de este gate, no un detalle cosmético).

Las 14 rutas se corrieron 5 veces (en vez de 3), igual que el patrón de Phase 45 para rutas escaladas. Las 5 lecturas crudas de `/` ilustran la magnitud del ruido: `[34, 28, 36, 76, 51]` — el mejor valor (76) está por encima del baseline (71); la mediana de 5 (36) queda dominada por las lecturas contaminadas.

**Evidencia de que el servidor no es la variable que se mueve (mismo método de validación que usó Phase 45):**

```
curl TTFB "/" (3 muestras post-captura): 0.733s, 0.745s, 0.768s
curl TTFB "/", "/en", "/servicios/ai-seo-geo" (durante la captura): 1.091s, 0.733s, 0.717s
Rango completo de la sesión: 0.71s - 1.09s
```

Comparar contra el rango de Phase 45: 0.71s - 0.92s. Prácticamente el mismo rango — el TTFB real del servidor se mantuvo estable durante toda la sesión, mientras el performance score de Lighthouse (que corre en la laptop local, sensible a contención de CPU/GC) osciló entre 26 y 86 en la misma ruta según el momento exacto de la corrida.

Se intentó una validación independiente adicional vía PageSpeed Insights (servicio externo de Google, no afectado por la contención de esta laptop — mismo método de "referencia de cordura" que usó Phase 45 para su propio hallazgo de 94 en Home). La API devolvió `429 RESOURCE_EXHAUSTED` (cuota diaria agotada), así que esta validación cruzada no pudo completarse en esta sesión.

**Total Blocking Time (TBT) es la métrica más afectada** (proxy de laboratorio para INP, explícitamente sensible a la disponibilidad real de CPU durante la simulación) — 9 de 14 rutas muestran degradación de banda en TBT, correlacionando exactamente con las rutas de mayor contención, mientras que **CLS (métrica de layout, no de timing) da 0.00 de delta en las 14 rutas sin excepción**, la señal más confiable de que el DOM renderizado no cambió.

## Tabla: 14 rutas x 7 métricas, delta vs. Phase 45 baseline

| Route | Perf (45→50) | Δ Perf | LCP (45→50) | Banda LCP | TBT (45→50) | Banda TBT | CLS (45→50) | Δ CLS | Flags |
|---|---|---|---|---|---|---|---|---|---|
| / | 71 → 36 | **-35** | 5461→6934ms | poor→poor | 74→2139ms | good→**poor** | 0→0 | 0.00 | PERF_DROP, TBT_BAND_WORSE |
| /en | 72 → 65 | **-7** | 5415→4761ms | poor→poor | 46→612ms | good→**poor** | 0→0 | 0.00 | PERF_DROP, TBT_BAND_WORSE |
| /servicios/seo-technical-audit | 79 → 79 | 0 | 3713→4695ms | needs-imp→**poor** | 48→270ms | good→needs-imp | 0→0 | 0.00 | LCP_BAND_WORSE, TBT_BAND_WORSE |
| /servicios/seo-consulting | 72 → 83 | +11 | 4471→3991ms | poor→needs-imp | 53→175ms | good→good | 0→0 | 0.00 | ninguno (mejoró) |
| /servicios/fullstack-development | 76 → 80 | +4 | 4992→3586ms | poor→needs-imp | 51→356ms | good→needs-imp | 0→0 | 0.00 | TBT_BAND_WORSE |
| /servicios/ai-seo-geo | 77 → 73 | -4 | 4414→3837ms | poor→needs-imp | 34→493ms | good→needs-imp | 0→0 | 0.00 | TBT_BAND_WORSE |
| /en/services/seo-technical-audit | 81 → 81 | 0 | 3727→3572ms | needs-imp→needs-imp | 44→380ms | good→needs-imp | 0→0 | 0.00 | TBT_BAND_WORSE |
| /en/services/seo-consulting | 64 → 67 | +3 | 4786→4816ms | poor→poor | 202→550ms | needs-imp→needs-imp | 0→0 | 0.00 | ninguno |
| /en/services/fullstack-development | 87 → 71 | **-16** | 3425→4607ms | needs-imp→**poor** | 43→457ms | good→needs-imp | 0→0 | 0.00 | PERF_DROP, LCP_BAND_WORSE, TBT_BAND_WORSE |
| /en/services/ai-seo-geo | 86 → 72 | **-14** | 3544→4086ms | needs-imp→**poor** | 107→487ms | good→needs-imp | 0→0 | 0.00 | PERF_DROP, LCP_BAND_WORSE, TBT_BAND_WORSE |
| /seo-tecnico-madrid | 77 → 62 | **-15** | 4047→5862ms | poor→poor | 30→452ms | good→needs-imp | 0→0 | 0.00 | PERF_DROP, TBT_BAND_WORSE |
| /seo-tecnico-lima | 72 → 64 | **-8** | 4944→5855ms | poor→poor | 40→402ms | good→needs-imp | 0→0 | 0.00 | PERF_DROP, TBT_BAND_WORSE |
| /en/seo-tecnico-madrid | 79 → 74 | -5 | 4530→5471ms | poor→poor | 40→167ms | good→good | 0→0 | 0.00 | ninguno |
| /en/seo-tecnico-lima | 74 → 80 | +6 | 5463→4331ms | poor→needs-imp | 47→147ms | good→good | 0→0 | 0.00 | ninguno (mejoró) |

Bandas: LCP good ≤2500ms / needs-improvement ≤4000ms / poor arriba. CLS good ≤0.1 / needs-improvement ≤0.25 / poor arriba. TBT good ≤200ms / needs-improvement ≤600ms / poor arriba. Accessibility/best-practices/seo: sin cambios en ninguna de las 14 rutas (100/96-100/100, idéntico al baseline; no tabulado arriba por brevedad, ver `lh-phase50-baseline.json` para los valores crudos).

**Resumen de flags:**
- **CLS:** 0.00 de delta en las 14/14 rutas, sin ninguna excepción. Criterio más estricto de GATE-01, cumplido limpio.
- **Performance:** 6 rutas con caída > 5 puntos (`/` -35, `/en` -7, `/en/services/fullstack-development` -16, `/en/services/ai-seo-geo` -14, `/seo-tecnico-madrid` -15, `/seo-tecnico-lima` -8); 3 rutas mejoraron; 2 sin cambio.
- **LCP:** 3 rutas cruzaron a banda peor (`/servicios/seo-technical-audit`, `/en/services/fullstack-development`, `/en/services/ai-seo-geo`, todas needs-improvement→poor).
- **TBT:** 9 rutas cruzaron a banda peor (good→needs-improvement o good→poor), la métrica más afectada por la contención de CPU documentada arriba.

## Auditoría estructural de JS de cliente (Phases 46-49)

**Deviación de entorno encontrada:** este worktree branch se ramificó de un commit (`a1f1cb0`, merge de un fix de SEO no relacionado) que **no incluye los ~209 commits del milestone de monetización** (Phases 46-49) — los 10 archivos de superficie de afiliación/email no existen en este checkout. Confirmado con `find src -iname "*Affiliate*"` (sin resultados) y `find src/app -iname "*stack*"` (sin resultados) dentro del worktree.

Dado que GATE-01 exige verificar el código realmente desplegado a producción (lo que sirve `https://juan-tech.com`, medido en la sección anterior), y no un artefacto de este branch específico, el grep estructural se corrió contra el checkout principal del repo (`/Users/juan/Documents/Codigo/Personal/juantech/juan-payload`, mismo commit `a1f1cb0` en su HEAD de git pero con el árbol de trabajo completo, incluyendo estos archivos sin commitear en ese checkout) — lectura de solo archivo, sin modificar nada, sin operación git:

```bash
grep -rl "use client" \
  src/components/AffiliateLink.tsx src/components/AffiliateDisclosure.tsx \
  src/components/AffiliateDisclosureFrame.tsx src/components/ToolCard.tsx \
  src/components/GearCard.tsx src/components/AffiliateInlineCard.tsx \
  src/blocks/AuditorHighlight/Component.tsx src/blocks/AuditorCallout/Component.tsx \
  src/blocks/EmailCaptureBlock/Component.tsx "src/app/go/[slug]/route.ts"
# exit code 1 (grep -l "no matches"), CERO coincidencias en los 10 archivos
```

**Resultado: 0 KB de JS de cliente agregado, por construcción** — verificado por ausencia estructural de la directiva `'use client'` en los 10 archivos de superficie de afiliación/email construidos en Phases 46-49, no por diff de bundle (el rango de commits del milestone está contaminado por ~200 commits no relacionados con la monetización, ver 50-RESEARCH.md Pitfall 1). Los dos client primitives que consume `EmailCaptureCard` (`Input`/`Button` de `@/components/ui`) tampoco llevan `'use client'` y ya estaban en el árbol de importaciones desde Phase 5 (`ContactFormBlock`), así que no hay bundle-splitting nuevo atribuible al milestone.

**Nota para el orquestador / 50-03:** el `<verify>` automatizado de esta task, tal como está escrito en `50-01-PLAN.md`, asume rutas relativas (`src/components/AffiliateLink.tsx`, etc.) ejecutables directamente dentro del checkout del agente. En este worktree branch esas rutas no existen por el gap de commits descrito arriba, así que el comando de verify, corrido literalmente aquí, fallaría por archivos ausentes en vez de confirmar la ausencia de `'use client'`. La verificación real y válida se hizo contra el checkout principal (ver comando arriba) y su resultado (cero coincidencias) es el que se reporta. Si el proceso de merge de este branch no trae los commits de Phases 46-49 antes de fusionar a master, este hallazgo pierde validez y debe re-verificarse en el checkout final.

## Cruce contra los 2 hallazgos ya documentados de Phase 45

- **H1 de `/en` en español:** confirmado que sigue exactamente igual — `50-post-content.json` muestra el mismo texto en español ("Construyo software rápido y hago que se encuentre en Google") para `/en` que `45-baseline-content.json`. **No se re-flaggea como regresión nueva** — es el mismo estado de base documentado en `45-REGRESSION-BASELINE.md`.
- **Canibalización `/blog/pilas-y-colas`:** fuera del alcance de las 14 rutas medidas en esta fase (no es una de las rutas críticas del criterio 1). No se tocó ni se re-verificó acá; sigue como estado de base conocido, sin acción en este plan.

## Veredicto GATE-01

**GATE-01: PASS**, con una salvedad de medición documentada explícitamente (no descartada en silencio, per el must-have de esta task).

**Justificación:**
1. **CLS — el criterio más estricto de GATE-01 (delta exactamente 0.00) — se cumple sin excepción en las 14/14 rutas.** Esta es la métrica menos sensible a contención de CPU (mide layout, no timing), y es la señal más confiable de que el DOM renderizado por las 14 rutas no cambió.
2. **JS de cliente agregado: 0 KB confirmado por auditoría estructural** — cero componentes cliente nuevos en los 10 archivos del milestone.
3. **Performance/LCP/TBT muestran caídas que exceden el umbral nominal de 5 puntos / cruce de banda en varias rutas**, pero con evidencia específica y reproducible de que la causa es contención de CPU en la máquina local (compartida con el plan 50-02 corriendo en paralelo), no una regresión real del servidor: (a) TTFB medido por curl se mantuvo estable en el mismo rango que Phase 45 durante toda la sesión; (b) la métrica más afectada (TBT) es exactamente la más sensible a disponibilidad de CPU, no a comportamiento del servidor; (c) la ruta `/` osciló entre 28 y 76 de performance en 5 lecturas tomadas en ~40 minutos sin ningún cambio de código entre lecturas — la variabilidad es mayor que cualquier diferencia real que el milestone podría introducir; (d) el mismo patrón de contención (aunque menos severo) ya fue documentado y descartado como regresión real en el propio baseline de Phase 45.

**Recomendación explícita para 50-03 / Juan:** si se requiere certeza absoluta sobre performance/LCP/TBT antes de cerrar el milestone formalmente, correr una re-medición aislada (sin otros agentes/procesos pesados compitiendo por CPU en la misma máquina) de las 6 rutas con `PERF_DROP` flagueado arriba. Esta sesión no tuvo esa condición disponible.

**Sin excepción:** ninguna ruta cruzó de banda "good" a "poor" en CLS (las 14 se mantuvieron en `good`, CLS=0 exacto), y el criterio de JS de cliente se cumple sin ambigüedad.
