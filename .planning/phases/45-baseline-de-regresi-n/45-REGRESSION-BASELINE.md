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

Route set: las 14 rutas críticas del criterio 1 — Home y `/en`, las 4 landings de servicio en `/servicios/{slug}` y `/en/services/{slug}` (`seo-technical-audit`, `seo-consulting`, `fullstack-development`, `ai-seo-geo`), y las 2 geo `/seo-tecnico-madrid` / `/seo-tecnico-lima` con sus variantes `/en/`. Resolución confirmada por curl el 2026-09-03: las 14 dan `200` directo, sin redirect intermedio. `/es` no entra en la lista de medición: devuelve `308` permanente hacia `/` (next-intl `localePrefix: 'as-needed'` con `defaultLocale: 'es'`). Nota de continuidad: `32-REGRESSION-BASELINE.md` registró ese mismo redirect como `307` contra un build local en el puerto 3040; producción emite `308` permanente. La diferencia es esperada (Next distingue redirect temporal en dev vs. permanente en producción) y no debe leerse como un cambio en la Phase 50.

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

Raw data: `45-baseline-content.json`. Las 14 rutas tienen exactamente un H1, sin duplicados ni ausencias. La home y `/en` emiten 3 bloques JSON-LD (Person, WebSite, ProfessionalService), las 8 landings de servicio 2 (Service, BreadcrumbList) y las 4 geo 1 (Service) — se anota como estado de base, no como hallazgo.

**Hallazgo real (no es un defecto de esta fase, es del sitio — no se toca, `src/` sigue en cero cambios):** el H1 de `/en` sale idéntico en español al de `/`, "Construyo software rápido y hago que se encuentre en Google", en vez de una versión en inglés. Confirmado dos veces por curl directo contra `https://juan-tech.com/en` el 2026-09-03. El resto de la página sí está en inglés (`<title>Technical SEO Consultant | Juan Carlos Angulo</title>`, `og:locale=en_US`), así que es un H1 puntual sin traducir en el Hero de Home, no un problema de ruteo ni de locale general. Queda registrado acá como línea base — si se corrige en una fase futura, la Phase 50 tiene que leer ese cambio como una mejora esperada y no como una regresión de contenido.

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

Raw data: `45-baseline-headlinks.json`, capturado con el script hermano nuevo `scripts/capture-head-links-snapshot.mjs` (mismo contrato CLI que `capture-service-page-snapshot.mjs`, que queda sin modificar). Las 14 rutas emiten canonical propio y exactamente 3 variantes de hreflang (es/en/x-default) — estado de base limpio, sin ausencias. Nota de normalización: el canonical de la home sale sin barra final (`https://juan-tech.com`) mientras que Search Console reporta la misma URL con barra (`https://juan-tech.com/`) — la sección Search Console de más abajo normaliza antes de cruzar los dos datasets, esto no es una inconsistencia del sitio.

## Search Console

Ventana: 2026-07-31 → 2026-08-27 (28 días), comparada contra 2026-07-03 → 2026-07-30 (28 días previos) — misma ventana que usó la auditoría SEO de agosto, para que las dos series sean comparables. Fuente: herramientas `gsc-juan-*` del hub MCP, `sc-domain:juan-tech.com` como siteOwner.

| Route | Impresiones | Clics | Posición media |
|---|---|---|---|
| / | TBD | TBD | TBD |
| /en | TBD | TBD | TBD |
| /servicios/seo-technical-audit | TBD | TBD | TBD |
| /servicios/seo-consulting | TBD | TBD | TBD |
| /servicios/fullstack-development | TBD | TBD | TBD |
| /servicios/ai-seo-geo | TBD | TBD | TBD |
| /en/services/seo-technical-audit | TBD | TBD | TBD |
| /en/services/seo-consulting | TBD | TBD | TBD |
| /en/services/fullstack-development | TBD | TBD | TBD |
| /en/services/ai-seo-geo | TBD | TBD | TBD |
| /seo-tecnico-madrid | TBD | TBD | TBD |
| /seo-tecnico-lima | TBD | TBD | TBD |
| /en/seo-tecnico-madrid | TBD | TBD | TBD |
| /en/seo-tecnico-lima | TBD | TBD | TBD |

Se completa en 45-03. Las rutas sin datos en la ventana se marcan explícitamente `sin datos en la ventana`, nunca con la celda vacía. Raw data: `45-gsc-snapshot.json`, con `p1_*`/`p2_*` crudos (el campo `*_diff` que devuelve la herramienta viene calculado como período viejo menos período nuevo, signo invertido — no se copia tal cual).

## Trafico real y V

TBD — se completa en 45-03 con el número real de tráfico orgánico del sitio (clics e impresiones del período 2026-07-31 → 2026-08-27, con el método declarado) y con `V(stack) = 0` a la fecha de captura, separado y sin mezclar con la medición real. `DECISIONS.md` de la Phase 44 se actualiza en 45-03 reemplazando la incógnita `V` por este valor.

## Phase 45 Verdict: TBD

Se completa al cierre de 45-03, cuando las 14 rutas estén pobladas en las 4 secciones de datos. Ningún componente ni contenido se modificó durante esta fase — medición únicamente, per BASE-01/02/03 y el criterio de cierre de la fase (`git diff` sobre `src/` vacío).
