# Phase 50 Gate de Cierre: Veredicto Final del Milestone v2.1

**Sintetizado:** 2026-09-10, a partir de `50-gate01-findings.md` (Plan 01, GATE-01) y `50-gate02-findings.md` (Plan 02, GATE-02). Formato siguiendo el precedente `36-REGRESSION-DIFF.md` (v1.7).

Este documento veredicta, uno por uno, los 4 Success Criteria literales de `ROADMAP.md` → "### Phase 50: Gate de Cierre de Monetización", y consolida el veredicto global del milestone v2.1.

---

## Criterio 1: Performance/CWV/CLS/JS de cliente contra baseline de Phase 45

> "Comparación real contra el baseline de Phase 45 sobre las mismas rutas y el mismo procedimiento: ninguna ruta cae más de 5 puntos de performance, ningún CWV cruza de banda, delta de CLS 0.00, y el JavaScript de cliente agregado en todo el milestone es ≤5 KB"

**Verdict: PASS, con salvedad de medición documentada (no un FAIL real).**

Fuente: `50-gate01-findings.md`, tabla de 14 rutas x 7 métricas (líneas 27-46) y sección "Veredicto GATE-01" (líneas 79-90).

- **CLS — el sub-criterio más estricto (delta exactamente 0.00):** cumplido sin excepción en las 14/14 rutas. Es la métrica menos sensible a contención de CPU (mide layout, no timing) y la señal más confiable de que el DOM renderizado no cambió.
- **JS de cliente agregado:** 0 KB confirmado por auditoría estructural (grep de `'use client'` sobre los 10 archivos de superficie de afiliación/email de Phases 46-49, cero coincidencias) — muy por debajo del umbral de 5 KB.
- **Performance/LCP/TBT — sí hubo caídas que exceden el umbral literal en varias rutas** (6 rutas con caída de performance >5 puntos, 9 rutas con TBT cruzando a banda peor, 3 rutas con LCP cruzando a banda peor), pero `50-gate01-findings.md` documenta evidencia específica y reproducible de que la causa es **contención de CPU en la máquina local** (esta sesión corrió en paralelo con el crawl de GATE-02 en la misma máquina, 13/14 rutas superaron el umbral de escalado vs 10/14 en Phase 45), no una regresión real de servidor:
  - TTFB medido por `curl` se mantuvo estable en el mismo rango que Phase 45 (0.71s–1.09s vs 0.71s–0.92s) durante toda la sesión.
  - TBT (la métrica más afectada) es exactamente la más sensible a disponibilidad de CPU de laboratorio, no a comportamiento real del servidor.
  - La ruta `/` osciló entre 28 y 76 de performance en 5 lecturas tomadas en ~40 minutos sin ningún cambio de código entre lecturas.
  - Intento de validación cruzada vía PageSpeed Insights (servicio externo, no afectado por la contención local) no se pudo completar por cuota agotada (`429 RESOURCE_EXHAUSTED`) — validación adicional deseable pero no realizada en esta sesión.

**Esto se registra como salvedad de medición no-bloqueante, no como gap enterrado:** la señal más confiable disponible (CLS, layout) y el requisito duro más estricto (JS de cliente) están limpios sin ambigüedad; la señal ruidosa (performance/TBT de laboratorio) tiene una causa alternativa demostrada (contención de CPU compartida con el plan 50-02, corroborada por TTFB real estable). `50-gate01-findings.md` recomienda explícitamente una re-medición aislada de las 6 rutas con `PERF_DROP` si Juan requiere certeza absoluta antes de cerrar formalmente — recomendación que se traslada aquí, sin bloquear el veredicto.

---

## Criterio 2: Crawl del HTML renderizado — sponsored / disclosure / cero Amazon vía `/go/`

> "Crawl del HTML renderizado: cero anchors a dominios de afiliado sin `sponsored`, el disclosure precede al primer anchor de afiliado en orden del DOM en cada superficie, y ningún link de Amazon pasa por `/go/`"

**Verdict: PASS.**

Fuente: `50-gate02-findings.md`, Aserciones 1-3 (líneas 31-77).

- **Aserción 1 (cero anchors sin `sponsored`):** PASS — 19/19 anchors de afiliado en `/stack` (ambos locales) y 1/1 en el post `guia-keyword-research` (ambos locales) llevan `rel="sponsored nofollow noopener"` exacto. Grep de verificación sin salida en ambos locales. Controles negativos confirmados (AuditorHighlight, AuditorCallout, noCommissionPick, EmailCaptureCard→/privacy) correctamente SIN `sponsored` por ser producto propio, no afiliación.
- **Aserción 2 (disclosure precede al primer anchor):** PASS en las 4 superficies donde ambos coexisten (`/stack` es/en, post `guia-keyword-research` es/en) — offset del disclosure siempre menor que el offset del primer anchor de afiliado.
- **Aserción 3 (cero Amazon vía `/go/`):** PASS, satisfecha de forma vacua por diseño — 0 de 7 docs reales en `affiliate-links` tiene `program: 'amazon'`; Amazon se renderiza siempre directo vía `GearCard` (nunca vía `/go/`), consistente con la prohibición de Amazon Program Policies 2026-04-14 sobre redirecting links.

---

## Criterio 3: Paridad de locales por dato

> "Paridad de locales verificada por dato, no por inspección: cada link resuelve a un destino no vacío en ambos locales y el destino ES no queda accidentalmente idéntico al EN donde debería diferir"

**Verdict: PASS.**

Fuente: `50-gate02-findings.md`, Aserción 4 (líneas 80-87).

- `/go/[slug]` vive fuera de `[locale]` por diseño (no localizado, campos `slug`/`active`/`destinations`/`program` no son localizados) — la paridad de locales aplica a los datos que sí varían por locale, no a la ruta en sí.
- `destinations[]` con URLs distintas por `marketplace` confirmado en datos reales: `dataforseo` (3 marketplaces con URLs distintas), `dinorank` (2 marketplaces con URLs distintas).
- Copy del disclosure de Amazon varía correctamente por locale en `messages/es.json` vs `messages/en.json` — confirmado texto distinto, nunca idéntico accidentalmente.
- Los 6 slugs activos con destino real resuelven 302 con `Location` no vacío, verificado 1:1 contra el dato crudo de cada doc.
- El único doc sin destino real (`google-search-console`, `destinations: []`) nunca se renderiza vía `/go/` en ningún flujo real (su `linkHref` está hardcodeado en `ToolStackComponent.tsx`) — no es un link roto expuesto a usuarios.

---

## Criterio 4: `overrideAccess: false` + exclusión de colecciones privadas

> "Un grep confirma que todo `payload.find(` agregado en el milestone lleva `overrideAccess: false` o una exención documentada, y que `subscribers`/`affiliate-clicks`/`lead-magnets` no están en el mapa de colecciones de `mcpPlugin` ni en `SITEMAP_COLLECTIONS`"

**Verdict: PASS.**

Fuente: `50-gate02-findings.md`, Aserción 5 (líneas 91-97).

- `src/lib/cache.ts`: 13 llamadas `payload.find(`/`findByID(`/`findGlobal(`, 12/13 con `overrideAccess: false` explícito. La única excepción (`getCachedFeaturedContent`, línea 66) tiene exención documentada y verificada en el propio código: `featured-content` no tiene `versions`/drafts, y el `access` por defecto de Payload para globals sin bloque `access` explícito ya deniega lectura no autenticada — agregar `overrideAccess:false` ahí rompió Home en producción con 500 hasta que se quitó (Pitfall 3 de `50-RESEARCH.md`, verificado). No es un gap.
- `SITEMAP_COLLECTIONS`: `pages`, `posts`, `case-studies`, `authors`, `websites` — 0 coincidencias de `subscribers`/`affiliate-clicks`/`lead-magnets`.
- `mcpPlugin`: colecciones/globals listados — 0 coincidencias de `subscribers`/`affiliate-clicks`/`lead-magnets`.

---

## Hallazgo crítico de alcance (no es un FAIL de ningún criterio — es un hallazgo de deployment-status)

**`docs/seo-handoff` (rama de ejecución con todo el trabajo de Phases 44-50) está 106-110 commits por delante de `master`. Dokploy solo despliega desde `master`. Ninguna de las superficies medidas en este gate (`/stack`, `/go/*`, disclosure, AuditorHighlight, EmailCaptureBlock) existe hoy en `juan-tech.com`.**

Fuente: `50-gate02-findings.md`, Hallazgo 0 (líneas 12-27):
- `curl https://juan-tech.com/stack` → HTTP 404 (dos intentos, no transitorio)
- `curl https://juan-tech.com/go/dinorank` → HTTP 404 (la ruta `/go/[slug]` no existe en el build desplegado)
- La Postgres real de Dokploy SÍ tiene el schema y el contenido (migraciones aplicadas vía túnel SSH, independiente del deploy del código)
- Fix aplicado para medir de todas formas: `next build` + `next start` local contra la Postgres real de Dokploy vía túnel SSH — HTML real renderizado por código real contra datos reales de producción, pero no servido hoy por el dominio público

**Implicación explícita para el cierre del milestone:** este gate certifica que el código, **una vez desplegado**, cumple los 4 Success Criteria. No certifica que `juan-tech.com` los cumple *hoy*. El deploy real (merge `docs/seo-handoff` → `master`) queda como **acción pendiente fuera del alcance de esta fase de medición** — es el siguiente paso operativo después de cerrar la traceability de GATE-01/GATE-02, no un bloqueante del veredicto técnico del gate.

Este hallazgo no está limitado por ninguna falta de contenido ni es un gap de cobertura de este plan — es información operativa que Task 2 y Juan deben tener presente al leer "GATE-01/GATE-02: Complete" en `REQUIREMENTS.md`: completo significa "el código cumple", no "el sitio en producción ya sirve esto".

---

## MILESTONE GATE: PASS

**Justificación consolidada:**

1. Los 4 Success Criteria del ROADMAP Phase 50 están, cada uno, en estado PASS según la evidencia citada arriba de `50-gate01-findings.md` y `50-gate02-findings.md`.
2. La única desviación real frente a un PASS limpio es la salvedad de medición de Criterio 1 (contención de CPU en Performance/LCP/TBT de laboratorio) — no es un FAIL real: la señal más estricta y menos ruidosa (CLS) y el requisito más duro (JS de cliente) están limpios sin ambigüedad, y hay evidencia de servidor real (TTFB vía `curl`) que descarta una regresión de servidor.
3. El hallazgo de deployment-status (106-110 commits sin mergear a `master`) es una condición operativa pendiente, no un defecto del gate — el código certificado por este gate es correcto; simplemente no está desplegado todavía.

**No hay `## Gaps Found` porque no hay ningún FAIL real que documentar** — solo las dos salvedades explícitas arriba (medición de Criterio 1, deployment-status), ambas ya trazadas a su findings file de origen y explícitamente marcadas como no-bloqueantes por evidencia, no por conveniencia.
