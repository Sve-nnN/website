# Phase 45 Regression Baseline

**Captured:** 2026-09-03, contra producción live `https://juan-tech.com` (sin build local, Hostinger/Dokploy sirve el sitio real), Chrome-for-Testing vía `scripts/lighthouse-mobile.mjs`, mobile form factor. Tres corridas por ruta (`lh-phase45-run1.json`, `run2`, `run3`); en 10 de las 14 rutas el spread de performance entre esas tres corridas superó los 15 puntos (regla de escalado de esta fase), así que esas 10 rutas se corrieron 2 veces más y su valor final es la mediana de 5 lecturas, no de 3. Las otras 4 rutas (`/`, `/en/services/ai-seo-geo`, `/seo-tecnico-madrid`, `/en/seo-tecnico-lima`) quedaron con la mediana de 3. Mediana calculada con este comando inline (mismo patrón que las Phases 28/32):

```
node -e "
const run1 = require('./.planning/phases/45-baseline-de-regresi-n/lh-phase45-run1.json');
const run2 = require('./.planning/phases/45-baseline-de-regresi-n/lh-phase45-run2.json');
const run3 = require('./.planning/phases/45-baseline-de-regresi-n/lh-phase45-run3.json');
const run4 = require('./.planning/phases/45-baseline-de-regresi-n/lh-phase45-run4-escalated.json'); // 10 rutas con spread > 15
const run5 = require('./.planning/phases/45-baseline-de-regresi-n/lh-phase45-run5-escalated.json'); // 10 rutas con spread > 15
const metrics = ['performance','accessibility','best-practices','seo','lcpMs','cls','tbtMs'];
function median(arr){ const s=[...arr].sort((a,b)=>a-b); const n=s.length; return n%2===1 ? s[(n-1)/2] : (s[n/2-1]+s[n/2])/2; }
const escalated = new Set(Object.keys(run4));
const out = {};
for (const r of Object.keys(run1)) {
  out[r] = {};
  const isEsc = escalated.has(r);
  for (const m of metrics) {
    const vals = isEsc ? [run1[r][m], run2[r][m], run3[r][m], run4[r][m], run5[r][m]] : [run1[r][m], run2[r][m], run3[r][m]];
    out[r][m] = median(vals);
  }
}
require('fs').writeFileSync('.planning/phases/45-baseline-de-regresi-n/lh-phase45-baseline.json', JSON.stringify(out, null, 2) + '\n');
"
```

Nota de lectura: esta serie es de laboratorio local contra un servidor remoto, así que no es directamente comparable con un score de PageSpeed Insights, que corre desde infraestructura de Google.

Purpose: foto del estado actual del sitio antes de que ninguna fase del milestone v2.1 (46-49) toque un byte renderizado. Contra este archivo compara el gate de cierre de la Phase 50. Mismo patrón que `32-REGRESSION-BASELINE.md` (Phase 32, v1.7).

Route set: las 14 rutas críticas del criterio 1, es decir Home y `/en`, las 4 landings de servicio en `/servicios/{slug}` y `/en/services/{slug}` (`seo-technical-audit`, `seo-consulting`, `fullstack-development`, `ai-seo-geo`), y las 2 geo `/seo-tecnico-madrid` / `/seo-tecnico-lima` con sus variantes `/en/`. Resolución confirmada por curl el 2026-09-03: las 14 dan `200` directo, sin redirect intermedio. `/es` no entra en la lista de medición: devuelve `308` permanente hacia `/` (next-intl `localePrefix: 'as-needed'` con `defaultLocale: 'es'`). Nota de continuidad: `32-REGRESSION-BASELINE.md` registró ese mismo redirect como `307` contra un build local en el puerto 3040; producción emite `308` permanente. La diferencia es esperada (Next distingue redirect temporal en dev vs. permanente en producción) y no debe leerse como un cambio en la Phase 50.

## Lighthouse Mobile (producción live, mediana de 3 corridas)

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| / | 71 | 100 | 96 | 100 | 5461ms (poor) | 0 (good) | 74ms (good) |
| /en | 72 | 100 | 96 | 100 | 5415ms (poor) | 0 (good) | 46ms (good) |
| /servicios/seo-technical-audit | 79 | 100 | 96 | 100 | 3713ms (needs-improvement) | 0 (good) | 48ms (good) |
| /servicios/seo-consulting | 72 | 100 | 96 | 100 | 4471ms (poor) | 0 (good) | 53ms (good) |
| /servicios/fullstack-development | 76 | 100 | 96 | 100 | 4992ms (poor) | 0 (good) | 51ms (good) |
| /servicios/ai-seo-geo | 77 | 100 | 96 | 100 | 4414ms (poor) | 0 (good) | 34ms (good) |
| /en/services/seo-technical-audit | 81 | 100 | 96 | 100 | 3727ms (needs-improvement) | 0 (good) | 44ms (good) |
| /en/services/seo-consulting | 64 | 100 | 96 | 100 | 4786ms (poor) | 0 (good) | 202ms (needs-improvement) |
| /en/services/fullstack-development | 87 | 100 | 96 | 100 | 3425ms (needs-improvement) | 0 (good) | 43ms (good) |
| /en/services/ai-seo-geo | 86 | 100 | 96 | 100 | 3544ms (needs-improvement) | 0 (good) | 107ms (good) |
| /seo-tecnico-madrid | 77 | 100 | 100 | 100 | 4047ms (poor) | 0 (good) | 30ms (good) |
| /seo-tecnico-lima | 72 | 100 | 100 | 100 | 4944ms (poor) | 0 (good) | 40ms (good) |
| /en/seo-tecnico-madrid | 79 | 100 | 100 | 100 | 4530ms (poor) | 0 (good) | 40ms (good) |
| /en/seo-tecnico-lima | 74 | 100 | 100 | 100 | 5463ms (poor) | 0 (good) | 47ms (good) |

Raw data: `lh-phase45-baseline.json` (mediana), `lh-phase45-run1.json`/`run2`/`run3` (las tres corridas base de todas las rutas), `lh-phase45-run4-escalated.json`/`run5-escalated.json` (dos corridas extra, solo para las 10 rutas escaladas), `lh-phase45-tracer.json` (pasada de calentamiento sobre `/`, no cuenta para ninguna mediana). LCP bands: good <=2500ms / needs-improvement <=4000ms / poor above. CLS: good <=0.1 / needs-improvement <=0.25 / poor above. TBT: good <=200ms / needs-improvement <=600ms / poor above.

Referencia de cordura: la auditoría del 2026-08-25 dejó la home en 94 en PageSpeed Insights (LCP 2,63s, TBT 156ms, TTFB 0,12s). La mediana de esta fase para `/` da 71 de performance con LCP de 5461ms, más lejos de esa referencia que lo esperado. La causa más probable, según lo que ya documentó 45-RESEARCH.md ("Trampa 1"), es contención de CPU en la laptop durante la captura: el TTFB medido por curl en la fase de research fue estable entre 0,71 y 0,92 segundos, así que el servidor no es la variable que se mueve. Diez de las catorce rutas necesitaron la mediana de 5 corridas en vez de 3 porque el spread de performance entre lecturas superó los 15 puntos en cada una de ellas (el detalle completo, con las cinco lecturas de cada ruta escalada, queda en el SUMMARY de este plan). Se deja anotado como advertencia de lectura para la Phase 50: si su propia medición muestra un salto de 20 o más puntos de performance en una sola ruta, primero hay que descartar contención de CPU antes de leerlo como regresión del sitio.

Nota de datos de campo (CrUX): `juan-tech.com` no tiene tráfico suficiente para que Chrome UX Report emita datos de campo. Todos los CWV de este baseline son de laboratorio (Lighthouse simulado); el TBT es el proxy de laboratorio de INP, no INP real. Esta ausencia se repite en la Phase 50 y no debe leerse como una regresión.

## H1 / JSON-LD Snapshot

| Route | H1 (count, text) | JSON-LD types |
|---|---|---|
| / | 1, "Construyo software rápido y hago que se encuentre en Google" | Person, WebSite, ProfessionalService |
| /en | 1, "Construyo software rápido y hago que se encuentre en Google" | Person, WebSite, ProfessionalService |
| /servicios/seo-technical-audit | 1, "Auditoría SEO Técnica" | Service, BreadcrumbList |
| /servicios/seo-consulting | 1, "Consultoría SEO" | Service, BreadcrumbList |
| /servicios/fullstack-development | 1, "Desarrollo Full-Stack con SEO integrado" | Service, BreadcrumbList |
| /servicios/ai-seo-geo | 1, "SEO para IA / GEO" | Service, BreadcrumbList |
| /en/services/seo-technical-audit | 1, "Technical SEO Audit" | Service, BreadcrumbList |
| /en/services/seo-consulting | 1, "SEO Consulting" | Service, BreadcrumbList |
| /en/services/fullstack-development | 1, "Full-Stack Development with SEO Built In" | Service, BreadcrumbList |
| /en/services/ai-seo-geo | 1, "AI SEO / GEO" | Service, BreadcrumbList |
| /seo-tecnico-madrid | 1, "SEO Técnico en Madrid / España" | Service |
| /seo-tecnico-lima | 1, "SEO Técnico en Lima" | Service |
| /en/seo-tecnico-madrid | 1, "Technical SEO in Madrid / Spain" | Service |
| /en/seo-tecnico-lima | 1, "Technical SEO in Lima" | Service |

Raw data: `45-baseline-content.json`. Las 14 rutas tienen exactamente un H1, sin duplicados ni ausencias. La home y `/en` emiten 3 bloques JSON-LD (Person, WebSite, ProfessionalService), las 8 landings de servicio 2 (Service, BreadcrumbList) y las 4 geo 1 (Service). Se anota como estado de base, no como hallazgo.

**Hallazgo real (no es un defecto de esta fase, es del sitio; no se toca, `src/` sigue en cero cambios):** el H1 de `/en` sale idéntico en español al de `/`, "Construyo software rápido y hago que se encuentre en Google", en vez de una versión en inglés. Confirmado dos veces por curl directo contra `https://juan-tech.com/en` el 2026-09-03. El resto de la página sí está en inglés (`<title>Technical SEO Consultant | Juan Carlos Angulo</title>`, `og:locale=en_US`), así que es un H1 puntual sin traducir en el Hero de Home, no un problema de ruteo ni de locale general. Queda registrado acá como línea base. Si se corrige en una fase futura, la Phase 50 tiene que leer ese cambio como una mejora esperada y no como una regresión de contenido.

## Canonical / hreflang

| Route | Canonical | hreflang (lang -> href) |
|---|---|---|
| / | https://juan-tech.com | es -> https://juan-tech.com, en -> https://juan-tech.com/en, x-default -> https://juan-tech.com |
| /en | https://juan-tech.com/en | es -> https://juan-tech.com, en -> https://juan-tech.com/en, x-default -> https://juan-tech.com |
| /servicios/seo-technical-audit | https://juan-tech.com/servicios/seo-technical-audit | es -> https://juan-tech.com/servicios/seo-technical-audit, en -> https://juan-tech.com/en/services/seo-technical-audit, x-default -> https://juan-tech.com/servicios/seo-technical-audit |
| /servicios/seo-consulting | https://juan-tech.com/servicios/seo-consulting | es -> https://juan-tech.com/servicios/seo-consulting, en -> https://juan-tech.com/en/services/seo-consulting, x-default -> https://juan-tech.com/servicios/seo-consulting |
| /servicios/fullstack-development | https://juan-tech.com/servicios/fullstack-development | es -> https://juan-tech.com/servicios/fullstack-development, en -> https://juan-tech.com/en/services/fullstack-development, x-default -> https://juan-tech.com/servicios/fullstack-development |
| /servicios/ai-seo-geo | https://juan-tech.com/servicios/ai-seo-geo | es -> https://juan-tech.com/servicios/ai-seo-geo, en -> https://juan-tech.com/en/services/ai-seo-geo, x-default -> https://juan-tech.com/servicios/ai-seo-geo |
| /en/services/seo-technical-audit | https://juan-tech.com/en/services/seo-technical-audit | es -> https://juan-tech.com/servicios/seo-technical-audit, en -> https://juan-tech.com/en/services/seo-technical-audit, x-default -> https://juan-tech.com/servicios/seo-technical-audit |
| /en/services/seo-consulting | https://juan-tech.com/en/services/seo-consulting | es -> https://juan-tech.com/servicios/seo-consulting, en -> https://juan-tech.com/en/services/seo-consulting, x-default -> https://juan-tech.com/servicios/seo-consulting |
| /en/services/fullstack-development | https://juan-tech.com/en/services/fullstack-development | es -> https://juan-tech.com/servicios/fullstack-development, en -> https://juan-tech.com/en/services/fullstack-development, x-default -> https://juan-tech.com/servicios/fullstack-development |
| /en/services/ai-seo-geo | https://juan-tech.com/en/services/ai-seo-geo | es -> https://juan-tech.com/servicios/ai-seo-geo, en -> https://juan-tech.com/en/services/ai-seo-geo, x-default -> https://juan-tech.com/servicios/ai-seo-geo |
| /seo-tecnico-madrid | https://juan-tech.com/seo-tecnico-madrid | es -> https://juan-tech.com/seo-tecnico-madrid, en -> https://juan-tech.com/en/seo-tecnico-madrid, x-default -> https://juan-tech.com/seo-tecnico-madrid |
| /seo-tecnico-lima | https://juan-tech.com/seo-tecnico-lima | es -> https://juan-tech.com/seo-tecnico-lima, en -> https://juan-tech.com/en/seo-tecnico-lima, x-default -> https://juan-tech.com/seo-tecnico-lima |
| /en/seo-tecnico-madrid | https://juan-tech.com/en/seo-tecnico-madrid | es -> https://juan-tech.com/seo-tecnico-madrid, en -> https://juan-tech.com/en/seo-tecnico-madrid, x-default -> https://juan-tech.com/seo-tecnico-madrid |
| /en/seo-tecnico-lima | https://juan-tech.com/en/seo-tecnico-lima | es -> https://juan-tech.com/seo-tecnico-lima, en -> https://juan-tech.com/en/seo-tecnico-lima, x-default -> https://juan-tech.com/seo-tecnico-lima |

Raw data: `45-baseline-headlinks.json`, capturado con el script hermano nuevo `scripts/capture-head-links-snapshot.mjs` (mismo contrato CLI que `capture-service-page-snapshot.mjs`, que queda sin modificar). Las 14 rutas emiten canonical propio y exactamente 3 variantes de hreflang (es/en/x-default). Estado de base limpio, sin ausencias. Nota de normalización: el canonical de la home sale sin barra final (`https://juan-tech.com`) mientras que Search Console reporta la misma URL con barra (`https://juan-tech.com/`). La sección Search Console de más abajo normaliza antes de cruzar los dos datasets; esto no es una inconsistencia del sitio.

## Search Console

Ventana: 2026-07-31 → 2026-08-27 (28 días), comparada contra 2026-07-03 → 2026-07-30 (28 días previos), la misma ventana que usó la auditoría SEO de agosto, para que las dos series sean comparables. Fuente: herramientas `gsc-juan-*` del hub MCP, `sc-domain:juan-tech.com` como siteOwner.

| Route | Impresiones | Clics | Posición media |
|---|---|---|---|
| / | 42 | 1 | 6,6 |
| /en | 20 | 0 | 3,5 |
| /servicios/seo-technical-audit | 83 | 0 | 49,7 |
| /servicios/seo-consulting | 9 | 0 | 6,3 |
| /servicios/fullstack-development | 12 | 0 | 15,8 |
| /servicios/ai-seo-geo | 7 | 0 | 28,9 |
| /en/services/seo-technical-audit | sin datos en la ventana | sin datos en la ventana | sin datos en la ventana |
| /en/services/seo-consulting | sin datos en la ventana | sin datos en la ventana | sin datos en la ventana |
| /en/services/fullstack-development | 1 | 0 | 10 |
| /en/services/ai-seo-geo | sin datos en la ventana | sin datos en la ventana | sin datos en la ventana |
| /seo-tecnico-madrid | sin datos en la ventana | sin datos en la ventana | sin datos en la ventana |
| /seo-tecnico-lima | 13 | 1 | 7,8 |
| /en/seo-tecnico-madrid | sin datos en la ventana | sin datos en la ventana | sin datos en la ventana |
| /en/seo-tecnico-lima | sin datos en la ventana | sin datos en la ventana | sin datos en la ventana |

8 de las 14 rutas críticas tienen datos en la ventana medida; las 6 restantes no aparecen entre las 190 páginas que Search Console reportó con métricas, y quedan marcadas `sin datos en la ventana` en vez de con la celda vacía, para que en la Phase 50 una ausencia repetida no se lea como regresión. Raw data: `45-gsc-snapshot.json`, con `p1_*`/`p2_*` crudos de las 190 páginas de la ventana (el campo `*_diff` que devuelve la herramienta viene calculado como período viejo menos período nuevo, signo invertido, y no se copió). Normalización aplicada al cruzar HTML con GSC: se quitó la barra final de ambas puntas antes de comparar (el canonical de `/` sale sin barra, GSC reporta la misma URL con barra).

Dato de canibalización confirmado en esta misma ventana, ya adelantado por la auditoría del 2026-08-25: `https://juan-tech.com/blog/pilas-y-colas` (URL vieja) tiene 150 impresiones y 4 clics contra 48 impresiones y 0 clics de `https://juan-tech.com/blog/cs-fundamentals/pilas-y-colas` (la canónica). La URL vieja sigue captando más del triple de impresiones que la que debería rankear. No es un hallazgo nuevo de esta fase, es la confirmación de que el problema sigue vivo al momento de este baseline.

## Trafico real y V

Los dos números van separados y sin mezclarse, como fija `45-CONTEXT.md`.

**(a) Tráfico orgánico real del sitio:** 22 clics y 6.328 impresiones en la ventana 2026-07-31 → 2026-08-27 (28 días), medido el 2026-09-03. Método: `gsc-juan-compare-search-periods` con `dimensions=date` sobre las mismas cuatro fechas de la sección anterior, devuelve 56 filas (28 días de cada período); las filas del período 2 traen `p1_clicks`/`p1_impressions` en cero estructural, así que sumar esos dos campos sobre las 56 filas da el total exacto del período 1 sin el filtrado por anonimización que castiga la suma por `dimensions=page`. `showing` (56) es igual a `total_items` (56), así que no hay truncamiento silencioso.

**(b) `V(stack) = 0`** a 2026-09-03. La página `/stack` no existe todavía, la construye la Phase 48. Cualquier proyección de qué fracción del tráfico del sitio llegaría ahí es un supuesto, nunca una medición, y no se declara ninguna en este documento.

Lectura frente al modelo de DEC-02: el tráfico orgánico real (22 clics/mes) queda muy por debajo incluso del primer tramo modelado (V = 1.000 visitas/mes). Es tráfico total del sitio, no visitas a la página de stack, así que no es directamente comparable con la tabla de tramos de DEC-02, pero sitúa la escala real del punto de partida. El detalle de cómo esto actualiza `DECISIONS.md` de la Phase 44 está en ese mismo documento, sección DEC-02.

## Phase 45 Verdict: Baseline captured, 14/14 routes clean

Las 14 rutas críticas quedan pobladas en las cuatro secciones de datos: Lighthouse mobile, H1/JSON-LD, canonical/hreflang y Search Console (con `sin datos en la ventana` explícito donde Google no reportó métricas, nunca una celda vacía). El tráfico orgánico real del sitio y `V(stack) = 0` quedan documentados por separado, y `DECISIONS.md` de la Phase 44 ya no tiene ninguna incógnita pendiente.

Ningún componente, contenido ni schema se modificó durante esta fase: es medición únicamente, per BASE-01, BASE-02, BASE-03 y el criterio de cierre de la fase. `git diff` sobre `src/` quedó vacío en las tres olas de ejecución (45-01, 45-02, 45-03). Este archivo y sus cinco JSON (`45-baseline-content.json`, `45-baseline-headlinks.json`, `lh-phase45-baseline.json`, `45-gsc-snapshot.json`, más las corridas crudas de Lighthouse) son el punto de comparación del gate de cierre de la Phase 50.

Dos hallazgos quedan anotados como estado de base, no como defectos de esta fase, para que la Phase 50 no los confunda con una regresión introducida por el milestone de monetización: el H1 de `/en` sale en español en vez de inglés, y la canibalización entre `/blog/pilas-y-colas` y su versión canónica sigue viva. Ninguno de los dos se corrigió acá; ambos están documentados con su evidencia en las secciones correspondientes de este mismo archivo.
