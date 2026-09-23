# Phase 45: Baseline de Regresión — Research

**Researched:** 2026-08-30
**Domain:** Medición de regresión (Lighthouse mobile + snapshot de HTML renderizado + Search Console). Fase de solo medición, cero cambio en `src/`.
**Confidence:** HIGH — todo lo crítico se verificó ejecutando contra producción y contra los archivos reales del repo en esta sesión.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Alcance y método del baseline**
- Entran las 14 rutas que pide el criterio 1: `/`, `/en`, las 4 landings de servicio en `/servicios/{slug}` y `/en/services/{slug}`, y las 2 geo `/seo-tecnico-madrid` y `/seo-tecnico-lima` con sus variantes `/en/`. Confirmar la resolución de cada una por curl antes de medir, porque `/es` redirige a `/` por el `localePrefix: 'as-needed'` de next-intl.
- Lighthouse se corre solo en mobile, igual que las Phases 32 y 36, para que el gate de la Phase 50 compare contra la misma serie.
- Se reusan los scripts que ya existen y están probados: `scripts/lighthouse-mobile.mjs` y `scripts/capture-service-page-snapshot.mjs`, que ya acepta `--base-url` y `--routes`. No se escribe un capturador nuevo.
- La medición va contra producción live, `https://juan-tech.com`, que es lo que ven Google y los usuarios y es el mismo blanco contra el que va a comparar la Phase 50. No se levanta build local.
- Tres corridas por ruta, y se guarda la mediana. Contra producción hay ruido de red que una sola corrida no filtra; las Phases 32 y 36 midieron contra localhost, donde una alcanzaba.

**El número V y los artefactos**
- La incógnita `V` del modelo de DEC-02 son visitas a la página de stack, que todavía no existe. Se escriben los dos números por separado y sin mezclarlos: el tráfico orgánico real del sitio medido en Search Console, y `V(stack) = 0` a la fecha, con el supuesto de qué fracción del tráfico podría llegar ahí declarado explícitamente como supuesto y no como medición.
- Los artefactos viven en el directorio de la fase, mismo patrón que la Phase 32: un `45-REGRESSION-BASELINE.md` legible, más `lh-phase45-baseline.json`, `45-baseline-content.json` y el snapshot de GSC en JSON.
- `DECISIONS.md` de la Phase 44 se actualiza reemplazando la incógnita por el número real con su fecha, pero la tabla paramétrica queda intacta para poder recalcular cuando el tráfico cambie.
- Ventana de Search Console: 28 días, 2026-07-31 a 2026-08-27, contra los 28 previos (2026-07-03 a 2026-07-30). Es la misma ventana que usó la auditoría de agosto, así las dos series son comparables.

### Claude's Discretion

No se declaró un área explícita de discreción en CONTEXT.md. En la práctica queda a criterio: la forma exacta de cerrar el hueco de canonical/hreflang (ver `## El hueco real`) y el método aritmético para derivar el número de tráfico desde GSC.

### Deferred Ideas (OUT OF SCOPE)

- Dar de alta `juan-tech.com` como proyecto en Ahrefs. Sería el camino duradero y repetible para el gate de la Phase 50, pero requiere acción de Juan y el hub MCP ya cubre la necesidad de esta fase.
- Reconectar mcp-hub con `/mcp` para tener las herramientas de Search Console como tools nativas en vez de por JSON-RPC directo.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Descripción | Soporte de este research |
|----|-------------|--------------------------|
| BASE-01 | Baseline de Lighthouse/CWV + H1 + JSON-LD + canonical/hreflang de las rutas críticas, capturado antes de cualquier cambio renderizado, siguiendo el patrón REG-01/REG-02 de v1.7 | Lista de 14 rutas resuelta por curl (`## Lista final de rutas`); contrato CLI exacto de los dos scripts (`## Contrato de los scripts`); hueco de canonical/hreflang identificado con fix mínimo propuesto (`## El hueco real`); formato 1:1 a replicar (`## Formato del artefacto`) |
| BASE-02 | Snapshot de Search Console (impresiones, clics, posición media) de esas mismas rutas | Acceso al hub verificado y probado end-to-end (`## Acceso a Search Console`), con el contrato de argumentos real y tres trampas del formato de respuesta documentadas |
| BASE-03 | Tráfico mensual real documentado con número | Método verificado para derivar el número (`## De dónde sale el número de tráfico`) y ubicación exacta de `V` en `DECISIONS.md` de la Phase 44 (`## Dónde vive V`) |
</phase_requirements>

## Summary

Esta fase no tiene incertidumbre técnica: las herramientas existen, están instaladas y funcionan. Lo que sí tiene son **cuatro trampas concretas** que, si el plan no las nombra, cuestan una ronda de ejecución cada una.

La primera y más importante: `scripts/capture-service-page-snapshot.mjs` **no extrae canonical ni hreflang**. Extrae únicamente `<h1>` y bloques `<script type="application/ld+json">`. El criterio 1 pide canonical/hreflang explícitamente, así que hay un hueco real entre lo que CONTEXT.md asume ("se reusan los scripts que ya existen") y lo que los scripts hacen. El repo ya tiene un precedente de cómo resolverlo sin romper nada: `scripts/verify-live-jsonld-meta.mjs` se creó como script hermano con la misma forma de CLI y dejó el original intacto a propósito.

La segunda: **la varianza de Lighthouse contra producción es brutal**. Dos corridas de la home, con la misma configuración y separadas por minutos, dieron performance 47 y 86 (LCP 6435ms vs 3249ms, TBT 781ms vs 224ms). No es una regresión del sitio ni una mala configuración del throttling — el throttling es el `mobileSlow4G` simulado estándar en ambas. Es ruido de contención de CPU en la laptop. Tres corridas con mediana es el mínimo, no el ideal, y el plan tiene que guardar las tres corridas crudas, no solo la mediana.

La tercera: `lighthouse-mobile.mjs` **no tiene noción de corridas múltiples ni de mediana**. Cada invocación sobrescribe el `--out`. Tres pasadas exigen tres archivos separados y un paso de agregación aparte.

La cuarta: las herramientas de Search Console funcionan por JSON-RPC directo, pero el argumento `dimensions` es un **string**, no un array, y los campos `*_diff` están calculados como `p2 − p1`, es decir **período viejo menos período nuevo** — el signo es el inverso de lo intuitivo. Copiar esas columnas tal cual al baseline invierte la lectura de toda la tabla.

**Primary recommendation:** reusar `lighthouse-mobile.mjs` sin tocarlo (3 pasadas → 3 archivos → agregación externa), reusar `capture-service-page-snapshot.mjs` sin tocarlo para H1/JSON-LD, y crear un script hermano nuevo bajo `scripts/` para canonical/hreflang siguiendo el precedente de `verify-live-jsonld-meta.mjs`. Nada de esto toca `src/`.

## Architectural Responsibility Map

| Capacidad | Tier primario | Tier secundario | Razón |
|---|---|---|---|
| Medición de performance/CWV | Cliente headless (Chrome-for-Testing local) | — | Lighthouse lab corre en la máquina de Juan contra el HTML servido por producción; no hay código de sitio involucrado |
| Extracción de H1 / JSON-LD / canonical / hreflang | Script Node standalone (`fetch` + regex) | — | Ya es la arquitectura establecida en Phases 25/30/32: ESM puro, sin importar Payload, sin tocar la DB |
| Datos de Search Console | Servicio externo vía MCP hub (JSON-RPC sobre HTTP) | — | Google Search Console API detrás del hub; ninguna credencial vive en el repo |
| Persistencia del baseline | Sistema de archivos (`.planning/phases/45-.../`) | git | Mismo patrón que Phase 32; los artefactos se commitean (`commit_docs: true`) |
| Superficie de producción medida | Servidor Node en Dokploy (`https://juan-tech.com`) | — | Solo lectura. La fase no despliega, no migra, no escribe DB |

**Nota de límite:** ningún tier de aplicación cambia en esta fase. Todo lo que se escribe vive bajo `.planning/` y, en el caso del script nuevo, bajo `scripts/`.

## Lista final de rutas

Verificado con `curl` contra producción el 2026-08-30. Las 14 rutas del criterio 1 resuelven **200 directo**, sin un solo redirect intermedio.

| # | Ruta | Status | TTFB observado |
|---|---|---|---|
| 1 | `/` | 200 | 0,72s |
| 2 | `/en` | 200 | 0,72s |
| 3 | `/servicios/seo-technical-audit` | 200 | 0,72s |
| 4 | `/servicios/seo-consulting` | 200 | 0,72s |
| 5 | `/servicios/fullstack-development` | 200 | 0,79s |
| 6 | `/servicios/ai-seo-geo` | 200 | 0,72s |
| 7 | `/en/services/seo-technical-audit` | 200 | 0,75s |
| 8 | `/en/services/seo-consulting` | 200 | 0,71s |
| 9 | `/en/services/fullstack-development` | 200 | 0,79s |
| 10 | `/en/services/ai-seo-geo` | 200 | 0,73s |
| 11 | `/seo-tecnico-madrid` | 200 | 0,74s |
| 12 | `/seo-tecnico-lima` | 200 | 0,78s |
| 13 | `/en/seo-tecnico-madrid` | 200 | 0,75s |
| 14 | `/en/seo-tecnico-lima` | 200 | 0,75s |

`[VERIFIED: curl -s -o /dev/null -w "%{http_code}" contra https://juan-tech.com, 2026-08-30]`

**`/es` NO entra en la lista de medición.** Devuelve `308` permanente a `https://juan-tech.com/`. `[VERIFIED: curl, 2026-08-30]`. Ojo con un detalle de continuidad: `32-REGRESSION-BASELINE.md` registró ese redirect como **307** medido contra localhost; producción emite **308**. La diferencia es esperada (Next emite permanente en producción) y el baseline nuevo debe anotarla para que la Phase 50 no la lea como un cambio.

**Los 4 slugs de servicio son reales y salen del sitemap vivo**, no de memoria: `seo-technical-audit`, `seo-consulting`, `fullstack-development`, `ai-seo-geo`. Los slugs geo son idénticos en ambos locales: `seo-tecnico-madrid`, `seo-tecnico-lima`. `[VERIFIED: https://juan-tech.com/sitemap.xml, 2026-08-30]`

Cadena copiable para ambos scripts (`--routes-only` en Lighthouse, `--routes` en el capturador):

```
/,/en,/servicios/seo-technical-audit,/servicios/seo-consulting,/servicios/fullstack-development,/servicios/ai-seo-geo,/en/services/seo-technical-audit,/en/services/seo-consulting,/en/services/fullstack-development,/en/services/ai-seo-geo,/seo-tecnico-madrid,/seo-tecnico-lima,/en/seo-tecnico-madrid,/en/seo-tecnico-lima
```

## Contrato de los scripts

### `scripts/lighthouse-mobile.mjs`

`[VERIFIED: scripts/lighthouse-mobile.mjs:1-148, leído completo en esta sesión]`

| Propiedad | Valor real |
|---|---|
| Flags | `--base-url`, `--out`, `--routes-only` |
| Default `--base-url` | `http://localhost:3000` |
| Default `--out` | `null` → imprime el JSON a stdout en vez de escribirlo |
| Default `--routes-only` | `null` → usa la lista `ROUTES` hardcodeada (6 rutas de Phase 11, no sirven acá) |
| Formato de `--routes-only` | Lista separada por comas; valor vacío o ausente vuelve a `ROUTES` |
| Forma de salida | `{ "<ruta>": { performance, accessibility, "best-practices", seo, lcpMs, cls, tbtMs } }` |
| Resolución de `--out` | Path tal cual, vía `writeFile`; no crea directorios ni resuelve relativo al repo |
| Manejo de error | Por ruta: escribe `{ error: "..." }` en esa clave y sigue; al final `process.exitCode = 1` si hubo alguna |
| Chrome | Resuelve/descarga Chrome-for-Testing stable en `.lighthouse-chrome/` vía `@puppeteer/browsers`; lanza y mata una instancia **por ruta** |
| Config Lighthouse | `extends: 'lighthouse:default'`, `formFactor: 'mobile'`, `screenEmulation` 375×812 @2x |

**Dependencias: instaladas y funcionando.** `lighthouse@13.4.1`, `chrome-launcher@1.2.1`, `@puppeteer/browsers@3.0.6` presentes en `node_modules`. La caché `.lighthouse-chrome/` ya tiene tres builds (`mac_arm-150.0.7871.115`, `mac_arm-151.0.7922.34`, `mac_arm-152.0.7977.64`). `[VERIFIED: node_modules + ls .lighthouse-chrome, 2026-08-30]`

**Lo que el script NO hace y la fase necesita:** no corre N veces, no calcula mediana, no guarda `benchmarkIndex`, no guarda `server-response-time`. Cada `--out` sobrescribe.

**Fix sin tocar el script:** tres invocaciones a tres archivos distintos y un paso de agregación aparte.

```bash
R="/,/en,/servicios/seo-technical-audit,...,/en/seo-tecnico-lima"   # la cadena de arriba
for n in 1 2 3; do
  node scripts/lighthouse-mobile.mjs \
    --base-url https://juan-tech.com \
    --routes-only "$R" \
    --out .planning/phases/45-baseline-de-regresi-n/lh-phase45-run$n.json
done
```

Después se computa la mediana por ruta y por métrica sobre los tres archivos y se escribe `lh-phase45-baseline.json` con la misma forma plana que produce el script (para que la Phase 50 pueda diffear contra un archivo de forma idéntica a `lh-phase32-baseline.json`). Los tres crudos se conservan como evidencia de la varianza.

### `scripts/capture-service-page-snapshot.mjs`

`[VERIFIED: scripts/capture-service-page-snapshot.mjs:1-112, leído completo en esta sesión]`

| Propiedad | Valor real |
|---|---|
| Flags | `--base-url`, `--out`, `--routes` |
| Default `--base-url` | `http://localhost:3000` |
| Default `--out` | `null` → stdout |
| Default `--routes` | `null` → 8 URLs hardcodeadas (las 4 landings de servicio × 2 locales) |
| Forma de salida | `{ "<ruta>": { h1: { count, texts[] }, jsonLd: [{ type, raw }] } }` |
| Extracción de H1 | `/<h1[^>]*>([\s\S]*?)<\/h1>/gi`, strip de tags anidados |
| Extracción de JSON-LD | `/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi` + `JSON.parse` **sin try/catch** — un bloque malformado tira toda la ruta |
| Manejo de error | Guarda `{ error }` por ruta; `process.exitCode = 1` si alguna ruta falla o tiene 0 `<h1>` |
| Dependencias | Ninguna. ESM puro con `fetch` nativo |

**Este script sí sirve tal cual para las 14 rutas** vía `--routes`, sin modificación.

## El hueco real: canonical y hreflang

**`capture-service-page-snapshot.mjs` no extrae canonical ni hreflang. Solo `<h1>` y JSON-LD.** `[VERIFIED: scripts/capture-service-page-snapshot.mjs:47-73 — las únicas dos funciones de extracción son `extractH1s` y `extractJsonLd`]`

El criterio 1 y BASE-01 los piden explícitamente. Este es el hallazgo central de este research.

### Lo que producción realmente emite

```html
<link rel="canonical" href="https://juan-tech.com/servicios/seo-technical-audit"/>
<link rel="alternate" hrefLang="es" href="https://juan-tech.com/servicios/seo-technical-audit"/>
<link rel="alternate" hrefLang="en" href="https://juan-tech.com/en/services/seo-technical-audit"/>
<link rel="alternate" hrefLang="x-default" href="https://juan-tech.com/servicios/seo-technical-audit"/>
```

`[VERIFIED: curl https://juan-tech.com/servicios/seo-technical-audit, 2026-08-30]`

**Trampa de parsing:** el atributo sale literalmente como `hrefLang` en camelCase, no `hreflang`. HTML no distingue mayúsculas en nombres de atributo, así que Google lo lee bien, pero **cualquier regex que busque `hreflang="` en minúsculas literal devuelve cero resultados**. El flag `i` es obligatorio.

Nota adicional sobre el shape: el canonical de la home es `https://juan-tech.com` **sin barra final**, mientras que la URL que reporta Search Console es `https://juan-tech.com/` **con barra**. Al cruzar el snapshot de HTML con el de GSC hay que normalizar. `[VERIFIED: curl / + respuesta de gsc-juan-compare-search-periods, 2026-08-30]`

### Fix mínimo propuesto

**No modificar `capture-service-page-snapshot.mjs`.** El repo ya estableció la convención opuesta y por una razón buena: `scripts/verify-live-jsonld-meta.mjs` documenta en su propio encabezado que tiene *"same CLI shape as scripts/capture-service-page-snapshot.mjs (extended, that file is not modified)"*. `[VERIFIED: scripts/verify-live-jsonld-meta.mjs:8-11]`. Mantener el original intacto es lo que garantiza que la serie Phase 32 → 36 → 45 → 50 sea comparable byte a byte.

Recomendación: **script hermano nuevo**, `scripts/capture-head-links-snapshot.mjs`, con exactamente los mismos tres flags (`--base-url`, `--out`, `--routes`) y la misma forma de salida por ruta. Es un archivo nuevo bajo `scripts/`, no bajo `src/` — permitido, pero el plan debe declararlo explícitamente porque CONTEXT.md dice "no se escribe un capturador nuevo" y esta es la excepción justificada por el criterio 1.

Las dos funciones que faltan, con el `i` que importa:

```js
function extractCanonical(html) {
  const m = html.match(/<link[^>]*\brel="canonical"[^>]*\bhref="([^"]*)"[^>]*>/i)
  return m ? m[1] : null
}

function extractHreflang(html) {
  // OJO: producción emite hrefLang en camelCase. El flag `i` NO es opcional.
  const matches = [...html.matchAll(/<link[^>]*\brel="alternate"[^>]*\bhreflang="([^"]*)"[^>]*\bhref="([^"]*)"[^>]*>/gi)]
  return matches.map(([, lang, href]) => ({ lang, href }))
}
```

Salida sugerida por ruta: `{ canonical: string|null, hreflang: [{lang, href}] }`, escrita a `45-baseline-headlinks.json`.

**Alternativa considerada y descartada:** agregar las dos funciones dentro de `capture-service-page-snapshot.mjs` y ampliar su objeto de salida. Es menos código, pero cambia el shape del JSON que produjeron Phase 25/30/32 y rompe la comparación directa con `32-baseline-content.json`. No vale el ahorro.

## Formato del artefacto a replicar

`[VERIFIED: .planning/milestones/v1.7-phases/32-regression-baseline/32-REGRESSION-BASELINE.md, leído completo en esta sesión]`

Estructura exacta de `32-REGRESSION-BASELINE.md`, en orden:

1. **`# Phase 32 Regression Baseline`** (H1)
2. **Línea `**Captured:**`** — fecha + descripción literal del procedimiento (comando de build, puerto, `caffeinate -u`, Chrome-for-Testing vía `scripts/lighthouse-mobile.mjs`, form factor mobile)
3. **Párrafo `Purpose:`** — para qué existe y contra qué fase se compara
4. **Párrafo `Route set:`** — qué rutas y por qué, más la resolución confirmada por curl incluyendo el redirect de `/es`
5. **`## Lighthouse Mobile (production build, port 3040)`** — tabla de 8 columnas:
   `| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |`
   Valores de CWV escritos como `4094ms (poor)`, `0 (good)`, `154ms (good)` — número + banda entre paréntesis, en la misma celda.
6. **Línea de bandas justo debajo de la tabla**, literal:
   > Raw data: `lh-phase32-baseline.json`. LCP bands: good <=2500ms / needs-improvement <=4000ms / poor above. CLS: good <=0.1 / needs-improvement <=0.25 / poor above. TBT: good <=200ms / needs-improvement <=600ms / poor above.
7. **`## H1 / JSON-LD Snapshot`** — tabla de 3 columnas:
   `| Route | H1 (count, text) | JSON-LD types |`
   con celdas del tipo `1, "Juan Carlos Angulo: Ingeniero de Software y Experto SEO"` y `Person` / `none`.
8. **Párrafo de cierre de esa sección** referenciando el JSON crudo por nombre (`32-baseline-content.json`) y anotando lo que no es defecto sino estado de base.
9. **`## Phase 32 Verdict: Baseline captured, 6/6 routes clean`** — veredicto + declaración explícita de que no se modificó nada.

**Réplica para Phase 45.** El plan debe pedir un `45-REGRESSION-BASELINE.md` con esa misma estructura, con estas adiciones obligadas por el alcance de esta fase:

- Una sección **`## Canonical / hreflang`** nueva (Phase 32 no la tenía), con columnas `| Route | Canonical | hreflang (lang → href) |`.
- Una sección **`## Search Console`** con `| Route | Impresiones | Clics | Posición media |` y la ventana declarada en el encabezado de la sección.
- Una sección **`## Tráfico real y V`** con los dos números separados (ver más abajo).
- Una nota de **datos de campo (CrUX)** — ver `## Trampas conocidas`.
- En la línea `**Captured:**`, en vez de "production build, port 3040", el procedimiento real de esta fase: producción live, mediana de 3 corridas, con los tres archivos crudos nombrados.

Los nombres de archivo del directorio de fase, siguiendo el patrón de Phase 32 (`lh-phase32-baseline.json`, `32-baseline-content.json`):

- `45-REGRESSION-BASELINE.md`
- `lh-phase45-baseline.json` (mediana) + `lh-phase45-run1.json`, `run2`, `run3` (crudos)
- `45-baseline-content.json` (H1 + JSON-LD)
- `45-baseline-headlinks.json` (canonical + hreflang)
- `45-gsc-snapshot.json`

## Acceso a Search Console

El cliente MCP hizo timeout con `mcp-hub` al arrancar la sesión, así que las tools `gsc-juan-*` **no están cargadas como tools nativas**. El servidor sí responde. Se llega por JSON-RPC directo con el helper que ya existe.

**Smoke test: funcionó.** `gsc-juan-list-properties` devolvió 11 propiedades, entre ellas `{'site_url': 'sc-domain:juan-tech.com', 'permission_level': 'siteOwner'}`. `[VERIFIED: llamada real vía hub.py, 2026-08-30]`

### El helper

Vive en `/private/tmp/claude-501/-Users-juan-Documents-Codigo-Personal-juantech-juan-payload/399d1850-e86d-495b-80c6-2e889395d1cb/scratchpad/hub.py`. Lee la URL y el header de autorización desde `mcpServers["mcp-hub"]` en `~/.claude.json`, hace el `initialize` al importarse, y expone `hub.tools(prefix)` y `hub.call(name, args)`. `[VERIFIED: leído en esta sesión]`

> **El token nunca se escribe.** Ni en un archivo, ni en un log, ni en el baseline. El helper lo lee de `~/.claude.json` en runtime. Si el scratchpad de esta sesión ya no existe cuando corra la ejecución, se recrea con el mismo contenido; nunca se hardcodea la credencial.

Invocación copiable (hay que ejecutar desde el directorio donde vive `hub.py`, porque el import es por path relativo):

```bash
cd <dir-de-hub.py> && python3 -c "
import hub, json
r = hub.call('gsc-juan-compare-search-periods', {
    'site_url': 'sc-domain:juan-tech.com',
    'period1_start': '2026-07-31', 'period1_end': '2026-08-27',
    'period2_start': '2026-07-03', 'period2_end': '2026-07-30',
    'dimensions': 'page',
    'limit': 250,
})
print(r['result']['content'][0]['text'])
"
```

### Contrato real de las herramientas

`[VERIFIED: tools/list vía hub.py, 2026-08-30]`

| Tool | Required | Opcionales |
|---|---|---|
| `gsc-juan-list-properties` | — | — |
| `gsc-juan-compare-search-periods` | `site_url`, `period1_start`, `period1_end`, `period2_start`, `period2_end` | `dimensions` (**string**), `limit` (integer) |
| `gsc-juan-get-search-by-page-query` | `site_url`, `page_url` | `days` (integer), `row_limit` (integer) |
| `gsc-juan-inspect-url-enhanced` | `site_url`, `page_url` | — |
| `gsc-juan-batch-url-inspection` | `site_url`, `urls` (**string**) | — |
| `gsc-juan-list-sitemaps-enhanced` | `site_url` | `sitemap_index` |

### Cuatro trampas verificadas

1. **`dimensions` es un string, no un array.** Pasar `['page']` devuelve el texto `Input validation error: ['page'] is not of type 'string'`. Hay que pasar `'page'`. `[VERIFIED: llamada fallida real, 2026-08-30]`

2. **Los errores no vienen como error de JSON-RPC.** Vienen como texto plano dentro de `result.content[0].text`. Un `json.loads()` directo sobre esa respuesta explota con un `JSONDecodeError` engañoso en vez de mostrar el mensaje de validación. Hay que envolver el parse en try/except e imprimir el texto crudo cuando falle.

3. **Los campos `*_diff` y `*_pct` están calculados como `p2 − p1`, o sea período viejo menos período nuevo.** Ejemplo real de la home: `p1_impressions: 42`, `p2_impressions: 29`, `imp_diff: -13`. Las impresiones **subieron** de 29 a 42, pero la columna dice `-13`. Copiar esas columnas al baseline invierte la lectura de toda la tabla. **El baseline debe reportar `p1_*` y `p2_*` crudos y calcular el delta por su cuenta.** `[VERIFIED: respuesta real, 2026-08-30]`

4. **`limit` trunca en silencio.** Con `dimensions='page'` la respuesta trae `total_items: 190`; con el default el `showing` es mucho menor. Con `dimensions='date'` devuelve `total_items: 56` (los 28 días de cada período mezclados en una sola lista) y con `limit: 40` reportó `showing: 40` — dieciséis filas perdidas sin ninguna advertencia. **Siempre pasar `limit` por encima de `total_items` y verificar que `showing == total_items` antes de usar los números.** `[VERIFIED: llamadas reales, 2026-08-30]`

**Sobre `gsc-juan-get-search-by-page-query`:** acepta `days` (entero relativo a hoy), **no** bordes de fecha explícitos. No puede expresar la ventana fija 2026-07-31 → 2026-08-27 que fija CONTEXT.md. Sirve para el desglose por query de una URL puntual, pero **el snapshot por ruta de BASE-02 tiene que salir de `compare-search-periods` con `dimensions='page'`**, que es la única que acepta fechas explícitas.

### Confirmación del dato de canibalización

Ya verificado en esta sesión, sin necesidad de recapturar: en la ventana 2026-07-31→2026-08-27, `https://juan-tech.com/blog/pilas-y-colas` tiene **150 impresiones** (p1) y 4 clics. Coincide exactamente con el dato de CONTEXT.md. `total_items: 190` páginas con métricas también coincide. `[VERIFIED: gsc-juan-compare-search-periods, 2026-08-30]`. La contraparte canónica (`/blog/cs-fundamentals/pilas-y-colas`, 48 impresiones) está más abajo en el ranking y sale en la captura completa con `limit: 250`.

## De dónde sale el número de tráfico

BASE-03 pide un número, no un adjetivo. El método con menos ambigüedad:

**Total del sitio → `dimensions='date'`, `limit: 60`.** Devuelve 56 filas (28 días de cada período). Las filas cuya fecha pertenece al período 2 traen `p1_clicks: 0` / `p1_impressions: 0` (ceros estructurales, no datos reales), así que **sumar `p1_clicks` y `p1_impressions` sobre las 56 filas da el total exacto del período 1**. `[VERIFIED: estructura de respuesta real, 2026-08-30]`

Este camino es preferible a sumar las 190 filas de `dimensions='page'`: la dimensión página está sujeta al filtrado por anonimización de Google y suma por debajo del total real. La dimensión fecha no.

> El plan debe declarar en el baseline **el método usado y su ventana**, no solo el número. Un número de tráfico sin método declarado no es comparable en la Phase 50.

Los dos números van **separados y sin mezclarse**, como fija CONTEXT.md:

- **Tráfico orgánico real del sitio:** clics e impresiones del período 2026-07-31 → 2026-08-27, con fecha de medición.
- **`V(stack) = 0`** a 2026-08-30, porque la página `/stack` no existe todavía (la construye la Phase 48). Cualquier proyección de qué fracción del tráfico llegaría ahí va etiquetada como **supuesto**, nunca como medición.

## Dónde vive V

Archivo: `.planning/phases/44-decisiones-de-monetizaci-n/DECISIONS.md`
`[VERIFIED: leído en esta sesión, sección DEC-02]`

`V` aparece en **cinco lugares**. Estas son las líneas exactas, citadas verbatim:

| Línea | Texto verbatim | Qué hacer |
|---|---|---|
| 55 | `Esto es un modelo **paramétrico, no una medición**. La única entrada real que falta es `V`, y llega en Phase 45.` | Reescribir: ya no falta. Referenciar `45-REGRESSION-BASELINE.md` y la fecha |
| 60 | `V                = visitas mensuales a la página de stack        [INCÓGNITA → Phase 45]` | Reemplazar `[INCÓGNITA → Phase 45]` por `V(stack) = 0 a 2026-08-30 (la página no existe; se construye en Phase 48)` |
| 66 | `Ventas/mes    = V × CTR × Conversión        = V × 0,0004 a V × 0,0025` | **No tocar.** Es la fórmula paramétrica |
| 73 | `| `V` (visitas/mes) | Ventas/mes | Ingreso/mes | Tiempo hasta 3 ventas |` | **Tabla intacta**, decisión explícita de CONTEXT.md. Los tramos 1.000 / 10.000 se quedan para poder recalcular |
| 94 | `Sustituir `V` por el número real y recalcular la tabla de tramos. Nada más de este documento cambia.` | Es el encabezado de la subsección `### Qué actualizar en Phase 45`. Cerrarla marcando qué se hizo y con qué fecha |

**Tensión a resolver en el plan, no en la ejecución.** La línea 94 dice "recalcular la tabla de tramos", pero CONTEXT.md dice "la tabla paramétrica queda intacta". CONTEXT.md es la decisión de Juan y gana. La lectura coherente: la tabla de tramos se conserva tal cual **y se agrega una fila o una nota indicando en qué tramo cae el sitio hoy** según el tráfico real medido. Nada se borra.

Contexto útil que también menciona `V` sin nombrarlo, en la sección de riesgo (alrededor de la línea 46): *"es un riesgo real que se dimensiona recién cuando Phase 45 entregue el número de tráfico"*. Vale actualizarla con el número, porque con `V(stack) = 0` el riesgo de plazo es mayor que el modelado, no menor.

## Trampas conocidas

### Trampa 1: la varianza de Lighthouse contra producción es enorme

**Qué pasa:** dos corridas de `/` con la misma configuración, minutos de diferencia:

| Corrida | Performance | LCP | TBT | CLS |
|---|---|---|---|---|
| 1 | **47** | 6435ms | 781ms | 0 |
| 2 | **86** | 3249ms | 224ms | 0 |

`[VERIFIED: dos ejecuciones reales de scripts/lighthouse-mobile.mjs contra https://juan-tech.com/, 2026-08-30]`

**Por qué pasa:** no es el throttling. Se verificó que el config efectivo es el mismo en las dos: `throttlingMethod: "simulate"`, `rttMs: 150`, `throughputKbps: 1638.4`, `cpuSlowdownMultiplier: 4`, UA `moto g power (2022)` — es decir, el preset mobile estándar, el mismo que usa PageSpeed Insights. `[VERIFIED: lhr.configSettings de una corrida instrumentada, 2026-08-30]`. La causa es contención de CPU en la laptop: `throttlingMethod: simulate` extrapola desde el tiempo real de CPU de la máquina, así que cualquier otro proceso pesado degrada el resultado. La corrida 1 además incluyó la descarga de un Chrome nuevo (`mac_arm-152.0.7977.64`) compitiendo por CPU.

**Cómo evitarlo:**
- Correr las 3 pasadas en serie, con la máquina lo más ociosa posible, con `caffeinate -u` sostenido como hizo Phase 32.
- Descartar una pasada de calentamiento antes de las 3 que cuentan (fuerza la resolución/descarga de Chrome y calienta la caché de producción).
- **Guardar las 3 corridas crudas**, no solo la mediana. Si la dispersión entre run1 y run3 supera ~15 puntos de performance en una ruta, esa ruta necesita corridas extra antes de darse por buena.
- Anotar en el baseline que la serie es de laboratorio local contra producción y por lo tanto **no es directamente comparable con un score de PageSpeed Insights**, que corre desde infraestructura de Google.

**Señal de alarma:** si la mediana de `/` queda cerca de 47 y no cerca de 85-90, la medición está contaminada. La auditoría del 2026-08-25 dejó la home en **94 en PSI mobile** (LCP 2,63s, TBT 156ms, TTFB 0,12s). La corrida 2 de esta sesión (86 / 3249ms / 224ms) es consistente con ese estado descontando el overhead local. Un 47 no significa que el sitio se rompió.

### Trampa 2: CrUX no tiene datos de campo para este dominio

`juan-tech.com` no tiene suficiente tráfico para que Chrome UX Report emita datos de campo, según la auditoría del 2026-08-25. `[ASSUMED]` — proviene del historial del proyecto, no se re-verificó contra la API de CrUX en esta sesión.

**El baseline debe decirlo con una frase explícita, no dejar celdas vacías.** En la Phase 50 la ausencia se va a repetir y una celda en blanco se lee como regresión. Todos los CWV del baseline son **lab (Lighthouse simulado)**, y el TBT es el proxy de laboratorio de INP, no INP real — cosa que el propio `lighthouse-mobile.mjs` ya documenta en un comentario. `[VERIFIED: scripts/lighthouse-mobile.mjs:103-105]`

### Trampa 3: normalización de URLs entre HTML y GSC

El canonical de la home sale sin barra (`https://juan-tech.com`) y GSC la reporta con barra (`https://juan-tech.com/`). Los scripts trabajan con paths (`/`, `/en`) y GSC con URLs absolutas. El cruce necesita una normalización declarada, o el baseline va a mostrar la home dos veces o ninguna.

### Trampa 4: `extractJsonLd` no tolera JSON malformado

En `capture-service-page-snapshot.mjs` el `JSON.parse` está fuera de try/catch: un solo bloque LD+JSON roto convierte la ruta entera en `{ error }`. Producción hoy emite 3 bloques en `/` y `/en`, 1 en las geo y 1 en las landings de servicio, todos parseables. `[VERIFIED: curl + conteo, 2026-08-30]`. No es un problema hoy, pero si aparece un `error` inesperado en una ruta, ese es el primer sospechoso — no la red.

### Trampa 5: el script mata y relanza Chrome por cada ruta

`runLighthouse` hace `launch()` y `chrome.kill()` dentro del loop de rutas. Eso suma varios segundos por ruta y hace que el tiempo total sea bastante mayor que la suma de los tiempos de auditoría. No es un defecto, pero afecta el sizing.

## Sizing de la captura

Una corrida completa (Chrome resuelto + lanzado + auditoría + kill) de **una** ruta contra producción tardó **~82 segundos** de reloj. `[VERIFIED: `time node scripts/lighthouse-mobile.mjs --routes-only /`, 2026-08-30]`

Proyección: 14 rutas × 3 pasadas = **42 corridas ≈ 55-60 minutos** de Lighthouse puro, más overhead. Con la pasada de calentamiento sugerida, **planificar 70-90 minutos de reloj solo para la parte de Lighthouse**, con la máquina dedicada.

Implicación para el plan: la captura de Lighthouse merece ser **su propia tarea**, separada de la captura de HTML (segundos) y del snapshot de GSC (segundos). Meterlas juntas en una tarea hace que un fallo tardío obligue a repetir la hora entera.

## Package Legitimacy Audit

Esta fase **no instala ningún paquete**. `lighthouse`, `chrome-launcher` y `@puppeteer/browsers` ya están en `package.json` y en `node_modules`, y se usaron sin cambios en Phases 11, 17, 32 y 36. `[VERIFIED: package.json + node_modules, 2026-08-30]`

| Paquete | Registry | Versión instalada | Veredicto | Disposición |
|---|---|---|---|---|
| `lighthouse` | npm | 13.4.1 (`^13.4.0`) | OK — preexistente | Sin cambios |
| `chrome-launcher` | npm | 1.2.1 (`^1.2.1`) | OK — preexistente | Sin cambios |
| `@puppeteer/browsers` | npm | 3.0.6 (`^3.0.6`) | OK — preexistente | Sin cambios |

**Paquetes removidos por veredicto SLOP:** ninguno.
**Paquetes marcados como sospechosos:** ninguno.

## Runtime State Inventory

No aplica: esta fase no renombra, no refactoriza y no migra nada. No escribe en la base, no toca configuración de servicios vivos, no registra nada a nivel de sistema operativo y no genera artefactos de build.

Único estado externo tocado, **en modo lectura**: la API de Google Search Console vía el hub MCP, y el HTML servido por `https://juan-tech.com`.

## Environment Availability

| Dependencia | Requerida por | Disponible | Versión | Fallback |
|---|---|---|---|---|
| `node` | Ambos scripts | ✓ | v24.13.0 | — |
| `lighthouse` | Captura de CWV | ✓ | 13.4.1 | — |
| `chrome-launcher` | Captura de CWV | ✓ | 1.2.1 | — |
| `@puppeteer/browsers` | Resolución de Chrome | ✓ | 3.0.6 | — |
| Chrome for Testing | Captura de CWV | ✓ | mac_arm 150/151/152 en `.lighthouse-chrome/` | Se autodescarga |
| `python3` | Helper del hub MCP | ✓ | 3.14.5 (Homebrew) | — |
| `curl` | Verificación de rutas | ✓ | sistema | — |
| Producción `https://juan-tech.com` | Todo el baseline | ✓ | 200 en las 14 rutas, TTFB ~0,72-0,79s | Ninguno; sin esto la fase no arranca |
| MCP hub / `gsc-juan-*` | BASE-02, BASE-03 | ✓ (JSON-RPC directo) | `sc-domain:juan-tech.com` como `siteOwner` | Si se reconecta con `/mcp`, quedan como tools nativas y es el camino preferible |
| Proyecto en Ahrefs | — | ✗ | — | Diferido en CONTEXT.md; el hub cubre la necesidad |

**Dependencias faltantes sin fallback:** ninguna.
**Dependencias faltantes con fallback:** el acceso nativo a las tools MCP; el fallback JSON-RPC ya está probado y funcionando.

## Security Domain

`security_enforcement` está en `true` con `security_asvs_level: 1`. Esta fase no escribe código de aplicación, no expone endpoints y no procesa entrada de usuarios, así que casi todas las categorías quedan fuera.

| Categoría ASVS | Aplica | Control |
|---|---|---|
| V2 Authentication | no | No hay superficie de auth en esta fase |
| V3 Session Management | no | No hay sesiones |
| V4 Access Control | no | Solo lectura de HTML público y de la API de GSC ya autorizada |
| V5 Input Validation | no | Sin entrada de usuario; las rutas son una lista fija verificada por curl |
| V6 Cryptography | no | Sin criptografía propia; TLS lo maneja `fetch`/`curl` |
| **V14 Config / gestión de secretos** | **sí** | El bearer del hub se lee de `~/.claude.json` en runtime. **No se copia a ningún archivo del repo, ni al baseline, ni a un log, ni a un mensaje.** Ningún artefacto de esta fase debe contener credenciales |

Un riesgo adicional que vale nombrar: los artefactos de esta fase **se commitean** (`commit_docs: true`). El snapshot de GSC es data de negocio, no secreto, pero conviene revisar que ningún JSON capturado arrastre headers, tokens o URLs firmadas antes de commitear.

## Project Constraints (from CLAUDE.md)

| Directiva | Cómo la respeta esta fase |
|---|---|
| Sin herramientas de SEO tooling en vivo / recurrente | La captura es puntual y manual, disparada una sola vez. No se instala nada que corra en el sitio |
| `push: false`, migraciones revisadas, confirmación para operaciones destructivas | No aplica: cero contacto con la base de datos |
| Verificar contra producción live, no contra local (memoria del proyecto: deploy Dokploy en merge a master) | CONTEXT.md ya lo fija: se mide contra `https://juan-tech.com` |
| Confirmar contra qué base se está trabajando antes de escribir | No aplica; no hay escritura de contenido |
| Humanizar todo entregable escrito | `45-REGRESSION-BASELINE.md` es un entregable escrito: pasa por el skill humanizer antes de darse por terminado |
| Español neutro, sin voceo | Todos los artefactos de esta fase |
| Trabajo dentro de flujos GSD | La fase corre por `/gsd:execute-phase` |

**Gate propio de la fase:** `git diff --stat src/` vacío en todo momento. Estado al cierre de este research: **vacío**, y `git status --porcelain src/` también vacío. `[VERIFIED: ejecutado 2026-08-30]`

## Assumptions Log

| # | Afirmación | Sección | Riesgo si es falsa |
|---|---|---|---|
| A1 | CrUX no tiene datos de campo para `juan-tech.com` | Trampa 2 | Bajo. Si sí los tuviera, el baseline gana una fila en vez de perder una. Se confirma en la propia ejecución |
| A2 | La medida de 94 en PSI mobile del 2026-08-25 sigue vigente y sirve como referencia de sanidad | Trampa 1 | Bajo. Es una referencia de cordura, no un umbral de gate |
| A3 | La varianza observada (47 vs 86) se explica por contención de CPU y no por inestabilidad del servidor de producción | Trampa 1 | Medio. Si el origen fuera el servidor, la mediana de 3 sería un promedio de un servicio inestable. Mitigación: el TTFB medido por curl fue estable (0,71-0,79s en 15 pedidos), lo que apunta al cliente y no al servidor |
| A4 | Crear un script hermano nuevo bajo `scripts/` es aceptable pese a que CONTEXT.md dice "no se escribe un capturador nuevo" | El hueco real | Medio. Es la única forma de cumplir el criterio 1 sin romper la comparabilidad con Phase 32. **Merece un `checkpoint:decision` con Juan** antes de escribirlo |
| A5 | La tabla de tramos de DEC-02 se conserva y solo se le anota el tramo actual, en vez de recalcularse | Dónde vive V | Bajo. CONTEXT.md es explícito ("queda intacta"); la línea 94 de DECISIONS.md es la que está desactualizada |

## Open Questions

1. **¿El script hermano para canonical/hreflang necesita aprobación explícita de Juan?**
   - Lo que se sabe: el criterio 1 exige canonical/hreflang; ningún script existente los extrae; el repo tiene el precedente de crear hermanos en vez de modificar (`verify-live-jsonld-meta.mjs`).
   - Lo que no está claro: CONTEXT.md dice "no se escribe un capturador nuevo", pensando en no reinventar la rueda, no en prohibir cerrar un hueco.
   - Recomendación: el plan incluye un `checkpoint:decision` corto, presentando el hueco y las dos opciones (hermano nuevo vs extender el original). Es una decisión de 30 segundos que evita una discusión en verificación.

2. **¿3 corridas alcanzan dada la varianza medida?**
   - Lo que se sabe: se observó un spread de 39 puntos de performance entre dos corridas.
   - Lo que no está claro: si con la máquina dedicada y una pasada de calentamiento el spread cae a algo tolerable.
   - Recomendación: mantener las 3 que fija CONTEXT.md, pero guardar las 3 crudas y agregar una regla de escalado: si en alguna ruta `max − min > 15` puntos de performance, esa ruta se recorre 2 veces más y se toma la mediana de 5. Documentarlo en el baseline.

3. **¿La sección `## Search Console` cubre las 14 rutas o solo las que tienen datos?**
   - Lo que se sabe: hay 190 páginas con métricas en la ventana; no todas las 14 rutas críticas necesariamente aparecen.
   - Recomendación: filas para las 14 siempre, y las que no aparezcan en GSC se marcan `sin datos en la ventana` explícitamente. Misma lógica que el caso de CrUX: una celda vacía en la Phase 50 se lee como regresión.

## Sources

### Primary (HIGH confidence)
- `scripts/lighthouse-mobile.mjs` (leído completo) — contrato CLI, forma de salida, config de Lighthouse
- `scripts/capture-service-page-snapshot.mjs` (leído completo) — contrato CLI, funciones de extracción, hueco de canonical/hreflang
- `scripts/verify-live-jsonld-meta.mjs:8-11, 116-146` — precedente de "script hermano, original sin tocar" y patrón de regex de extracción
- `.planning/milestones/v1.7-phases/32-regression-baseline/32-REGRESSION-BASELINE.md` (leído completo) — estructura exacta a replicar y bandas de CWV
- `.planning/phases/44-decisiones-de-monetizaci-n/DECISIONS.md`, sección DEC-02 — ubicación exacta de `V`
- `.planning/phases/45-baseline-de-regresi-n/45-CONTEXT.md` — decisiones bloqueadas
- `.planning/REQUIREMENTS.md:12-14` — texto de BASE-01/02/03
- `.planning/ROADMAP.md`, `### Phase 50` — qué va a comparar el gate de cierre
- Ejecuciones reales contra `https://juan-tech.com` (curl × 15 rutas, sitemap.xml, 2 corridas de Lighthouse, 1 corrida instrumentada) — 2026-08-30
- Llamadas reales a `gsc-juan-list-properties`, `gsc-juan-compare-search-periods` (dims `page`, `date`, y sin dims) y `tools/list` vía JSON-RPC — 2026-08-30

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — historial de la auditoría del 2026-08-25 (score 94 en PSI, LCP/TBT/TTFB)

### Tertiary (LOW confidence)
- Ninguna. Nada de este documento se apoya en búsqueda web.

## Metadata

**Desglose de confianza:**
- Lista de rutas y resolución: HIGH — 15 curl ejecutados contra producción, slugs confirmados contra el sitemap vivo
- Contrato de los scripts: HIGH — ambos archivos leídos completos en esta sesión
- Hueco de canonical/hreflang: HIGH — verificado por ausencia en el código y por presencia en el HTML de producción
- Formato del artefacto: HIGH — `32-REGRESSION-BASELINE.md` leído completo
- Acceso a GSC: HIGH — smoke test más cuatro llamadas reales, incluida una que falló y reveló el contrato de `dimensions`
- Ubicación de `V`: HIGH — leído verbatim en DEC-02
- Varianza de Lighthouse: HIGH en la observación (dos corridas reales), MEDIUM en la atribución de causa (ver A3)
- Ausencia de datos de CrUX: MEDIUM — heredado del historial, no re-verificado

**Research date:** 2026-08-30
**Valid until:** 2026-09-29. Ojo con dos cosas que caducan antes: la ventana de GSC se corre día a día (las fechas están congeladas por CONTEXT.md, así que el snapshot sigue siendo reproducible), y el canal stable de Chrome for Testing puede resolver a un build nuevo, lo que dispara una descarga en la primera corrida.

**Gate de la fase al cierre de este research:** `git diff --stat src/` vacío. `git status --porcelain src/` vacío. Confirmado 2026-08-30.
