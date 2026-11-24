# Phase 45: Baseline de Regresión - Mapa de Patrones

**Mapped:** 2026-08-30
**Files analyzed:** 8 artefactos (1 script nuevo, 6 artefactos de planning, 1 doc a editar)
**Analogs found:** 7 / 8 (el único sin analog es la agregación de medianas)

> **Gate de la fase:** ningún archivo bajo `src/` aparece en este mapa, ni puede aparecer en el plan. `git diff --stat src/` debe quedar vacío de principio a fin. El único código nuevo vive bajo `scripts/`; todo lo demás vive bajo `.planning/phases/45-baseline-de-regresi-n/`.

## File Classification

| Archivo nuevo/modificado | Rol | Flujo de datos | Analog más cercano | Calidad del match |
|---|---|---|---|---|
| `scripts/capture-head-links-snapshot.mjs` | script standalone (utility CLI) | fetch HTTP → parse regex → JSON a disco | `scripts/verify-live-jsonld-meta.mjs` | exacto (mismo precedente declarado: "script hermano, original sin tocar") |
| `scripts/capture-head-links-snapshot.mjs` (2º analog) | — | — | `scripts/capture-service-page-snapshot.mjs` | exacto en forma de CLI y shape de salida por ruta |
| `.../lh-phase45-run1.json`, `run2`, `run3` | artefacto de datos crudos | salida directa de Lighthouse | salida de `scripts/lighthouse-mobile.mjs` (sin modificar) | exacto |
| `.../lh-phase45-baseline.json` | artefacto de datos agregado | mediana sobre 3 archivos | `lh-phase32-baseline.json` (shape) | exacto en shape, **sin analog en el cómputo** |
| `.../45-baseline-content.json` | artefacto de datos | salida de `capture-service-page-snapshot.mjs`, condensada | `32-baseline-content.json` | exacto |
| `.../45-baseline-headlinks.json` | artefacto de datos | salida del script nuevo | ninguno (sección nueva de Phase 45) | sin analog directo; hereda shape del capturador |
| `.../45-gsc-snapshot.json` | artefacto de datos externo | JSON-RPC → dump crudo | ninguno en el repo | sin analog |
| `.../45-REGRESSION-BASELINE.md` | documento entregable | lectura de los JSON → markdown | `.planning/milestones/v1.7-phases/32-regression-baseline/32-REGRESSION-BASELINE.md` | exacto |
| `.planning/phases/44-decisiones-de-monetizaci-n/DECISIONS.md` | documento existente (edición puntual) | edición in situ de 3 líneas | — | edición dirigida, ver RESEARCH `## Dónde vive V` |

---

## Pattern Assignments

### `scripts/capture-head-links-snapshot.mjs` (script standalone, fetch → regex → JSON)

**Analog primario:** `scripts/verify-live-jsonld-meta.mjs`
**Analog secundario (shape de salida por ruta):** `scripts/capture-service-page-snapshot.mjs`

#### 1. Encabezado que declara el precedente (`verify-live-jsonld-meta.mjs:1-14`)

Copiar este bloque, adaptando la fase y el propósito. La frase "that file is not modified" es exactamente lo que justifica crear el hermano en vez de tocar el original:

```js
#!/usr/bin/env node
/**
 * Phase 30 Plan 04 — live curl-based verification of JSON-LD validity and
 * meta.title/meta.description integrity across every route touched by
 * ...
 * Standalone Node script (ESM, pure `fetch`, no Payload/DB import) — same
 * CLI shape as scripts/capture-service-page-snapshot.mjs (extended, that
 * file is not modified): `--base-url`, `--out`, `--routes`.
 *
 * Usage:
 *   node scripts/verify-live-jsonld-meta.mjs --base-url http://localhost:3000
 */
import { writeFile } from 'node:fs/promises'
```

#### 2. Parseo de argumentos — copiar literal (`verify-live-jsonld-meta.mjs:109-120`, idéntico a `capture-service-page-snapshot.mjs:26-43`)

Los dos archivos tienen exactamente el mismo bloque. No inventar variantes: los tres flags son `--base-url`, `--out`, `--routes`, y `--routes` vacío vuelve a `null` a propósito.

```js
function parseArgs(argv) {
  const args = { baseUrl: 'http://localhost:3000', out: null, routes: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base-url') args.baseUrl = argv[++i]
    else if (argv[i] === '--out') args.out = argv[++i]
    else if (argv[i] === '--routes') {
      const raw = argv[++i]
      args.routes = raw ? raw.split(',').map((r) => r.trim()).filter(Boolean) : null
    }
  }
  return args
}
```

**Lista `URLS` / `ROUTES` por defecto:** ambos analogs declaran una constante hardcodeada arriba del archivo y hacen `args.routes ?? URLS` en `main`. El script nuevo debe declarar las 14 rutas del criterio 1 como default (no las 8 del capturador de servicios), para que corra sin flags y para que la lista quede versionada.

#### 3. Funciones de extracción — forma a imitar (`capture-service-page-snapshot.mjs:45-59`)

Nota el `gi` en ambas y el comentario que explica la tolerancia:

```js
// Tolerant of nested spans/classes inside the h1 tag content, and of
// attributes on the opening tag itself.
function extractH1s(html) {
  const matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
  const texts = matches.map((m) => m[1].replace(/<[^>]+>/g, '').trim())
  return { count: texts.length, texts }
}
```

Y el patrón de extractor con `match` simple + `null` como no-encontrado (`verify-live-jsonld-meta.mjs:137-145`):

```js
function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i)
  return m ? m[1].trim() : null
}

function extractMetaDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)
  return m ? m[1].trim() : null
}
```

Las dos funciones nuevas siguen esa misma forma. **La landmine verificada:** producción emite el atributo como `hrefLang` en camelCase, así que el flag `i` no es opcional — sin él, la regex devuelve cero resultados y el baseline registra "sin hreflang" en las 14 rutas.

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

#### 4. Fetch por ruta con chequeo de status (`capture-service-page-snapshot.mjs:61-71`)

```js
async function captureUrl(baseUrl, path) {
  const url = `${baseUrl}${path}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`GET ${url} returned ${res.status}`)
  }
  const html = await res.text()
  const h1 = extractH1s(html)
  const jsonLd = extractJsonLd(html)
  return { h1, jsonLd }
}
```

Para el script nuevo el retorno pasa a ser `{ canonical, hreflang }`.

#### 5. Loop de `main`, manejo de error por ruta y escritura (`capture-service-page-snapshot.mjs:73-112`)

Este es el bloque completo a replicar. Fijarse en tres detalles: el error se guarda **dentro** del objeto de esa ruta y el loop continúa; `--out` ausente imprime a stdout; el `process.exitCode = 1` va al final, no aborta.

```js
async function main() {
  const args = parseArgs(process.argv.slice(2))
  const snapshot = {}
  let hadFailure = false
  const targets = args.routes ?? URLS

  for (const path of targets) {
    try {
      const entry = await captureUrl(args.baseUrl, path)
      snapshot[path] = entry
      const jsonLdTypes = entry.jsonLd.map((j) => j.type)
      console.log(`${path}: h1Count=${entry.h1.count} jsonLdTypes=[${jsonLdTypes.join(', ')}]`)
      if (entry.h1.count === 0) {
        console.error(`  FAILED: ${path} has zero <h1> elements`)
        hadFailure = true
      }
    } catch (err) {
      console.error(`  FAILED for ${path}:`, err.message)
      snapshot[path] = { error: err.message }
      hadFailure = true
    }
  }

  if (args.out) {
    await writeFile(args.out, JSON.stringify(snapshot, null, 2))
    console.log(`\nSnapshot written to ${args.out}`)
  } else {
    console.log(JSON.stringify(snapshot, null, 2))
  }

  if (hadFailure) {
    console.error('\nOne or more URLs failed to fetch or had zero H1 elements.')
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('capture-service-page-snapshot.mjs crashed:', err)
  process.exit(1)
})
```

La condición de fallo equivalente para el script nuevo: `canonical === null` (canonical ausente en una ruta que debe tenerlo) marca `hadFailure`. Que `hreflang` venga vacío en alguna ruta se registra pero conviene decidirlo en el plan, no en la ejecución.

#### 6. Resolución del path de `--out`

Ninguno de los tres scripts resuelve rutas ni crea directorios: pasan el string tal cual a `writeFile` (`capture-service-page-snapshot.mjs:97`, `verify-live-jsonld-meta.mjs:235`, `lighthouse-mobile.mjs:132`). Es decir, el path es relativo al cwd desde donde se invoca. El plan debe fijar que todos los comandos se corren desde la raíz del repo y pasar el path completo `.planning/phases/45-baseline-de-regresi-n/45-baseline-headlinks.json`. El directorio ya existe, así que no hace falta `mkdir`.

#### 7. Shape de salida sugerido

```json
{
  "/servicios/seo-technical-audit": {
    "canonical": "https://juan-tech.com/servicios/seo-technical-audit",
    "hreflang": [
      { "lang": "es", "href": "https://juan-tech.com/servicios/seo-technical-audit" },
      { "lang": "en", "href": "https://juan-tech.com/en/services/seo-technical-audit" },
      { "lang": "x-default", "href": "https://juan-tech.com/servicios/seo-technical-audit" }
    ]
  }
}
```

Objeto keyed por path, igual que `capture-service-page-snapshot.mjs` y a diferencia de `verify-live-jsonld-meta.mjs`, que devuelve un **array** de resultados con `path` adentro. Para un baseline diffeable conviene el objeto keyed: es lo que hace comparable `lh-phase32-baseline.json` con su sucesor.

---

### `scripts/lighthouse-mobile.mjs` — analog de **solo lectura**, no se modifica

**Contrato verificado (`lighthouse-mobile.mjs:39-57`):** flags `--base-url`, `--out`, `--routes-only`. Ojo con el nombre: acá es `--routes-only`, no `--routes`. Es la única inconsistencia de CLI entre los tres scripts y es fácil de equivocar al escribir el comando.

Salida por ruta (`lighthouse-mobile.mjs:94-105`), y esta es exactamente la forma que debe tener `lh-phase45-baseline.json`:

```js
return {
  performance: Math.round(categories.performance.score * 100),
  accessibility: Math.round(categories.accessibility.score * 100),
  'best-practices': Math.round(categories['best-practices'].score * 100),
  seo: Math.round(categories.seo.score * 100),
  lcpMs: safeNumeric(audits, 'largest-contentful-paint'),
  cls: safeNumeric(audits, 'cumulative-layout-shift', 3),
  // Total Blocking Time (ms) is Lighthouse's lab-metric proxy for INP —
  // true INP requires real-user field data (Chrome UX Report), which a
  // pre-production local build cannot produce.
  tbtMs: safeNumeric(audits, 'total-blocking-time'),
}
```

Escritura del `--out` (`lighthouse-mobile.mjs:131-142`): un solo `writeFile` al final que **sobrescribe**. De ahí que las 3 pasadas exijan 3 `--out` distintos.

El comentario de las líneas 101-104 es la fuente literal para la nota de CrUX del baseline: TBT es el proxy de laboratorio de INP, no INP real.

**Landmine de sizing (`lighthouse-mobile.mjs:84-108`):** `launch()` y `chrome.kill()` están dentro de `runLighthouse`, o sea una instancia de Chrome por ruta. 14 rutas × 3 pasadas = 42 arranques. El plan debe aislar la captura de Lighthouse en su propia tarea, porque un fallo tardío obliga a repetir 70-90 minutos.

---

### `.../45-REGRESSION-BASELINE.md` (documento entregable)

**Analog:** `.planning/milestones/v1.7-phases/32-regression-baseline/32-REGRESSION-BASELINE.md` (37 líneas, leído completo)

Estructura literal a replicar, en orden:

```markdown
# Phase 32 Regression Baseline

**Captured:** 2026-07-14, production build (`npx next build` + `PORT=3040 npx next start`, `caffeinate -u` held throughout), Chrome-for-Testing via `scripts/lighthouse-mobile.mjs`, mobile form factor.

Purpose: snapshot the site's current state before any v1.7 phase (33-36) touches a component. Compared against this file at Phase 36's Regression Gate. Same pattern as `28-REGRESSION-DIFF.md`.

Route set: home (ES/EN) + all 4 locale combinations of ... Route resolution confirmed via curl: `/` and `/en` are 200 (canonical), `/es` 307-redirects to `/` (next-intl `localePrefix: 'as-needed'` with `defaultLocale: 'es'`).

## Lighthouse Mobile (production build, port 3040)

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| / | 84 | 96 | 96 | 100 | 4094ms (poor) | 0 (good) | 154ms (good) |

Raw data: `lh-phase32-baseline.json`. LCP bands: good <=2500ms / needs-improvement <=4000ms / poor above. CLS: good <=0.1 / needs-improvement <=0.25 / poor above. TBT: good <=200ms / needs-improvement <=600ms / poor above.

## H1 / JSON-LD Snapshot

| Route | H1 (count, text) | JSON-LD types |
|---|---|---|
| / | 1, "Juan Carlos Angulo: Ingeniero de Software y Experto SEO" | Person |

Raw data: `32-baseline-content.json`. All 6 routes have exactly one H1 ... noted for Phase 36 comparison, not a defect).

## Phase 32 Verdict: Baseline captured, 6/6 routes clean

No component or content was modified during this phase — measurement only, per REG-01 and the phase's success criteria.
```

Convenciones no obvias que hay que copiar:

- **Valores de CWV = número + banda entre paréntesis en la misma celda**: `4094ms (poor)`, `0 (good)`, `154ms (good)`. Nunca el número solo.
- **La línea de bandas va inmediatamente debajo de la tabla**, en una sola línea, empezando por `Raw data: \`<archivo>\`.` Copiar los umbrales verbatim para que Phase 50 lea la misma escala.
- **Cada sección de tabla cierra con un párrafo** que nombra el JSON crudo y aclara qué no es un defecto sino estado de base (línea 33 del analog es el ejemplo exacto).
- **El H1 va como `count, "texto"`** en una sola celda; `none` en minúscula para JSON-LD ausente.
- **El veredicto va en el propio `##`**, con el conteo (`6/6 routes clean` → `14/14`), y el párrafo final declara explícitamente que no se modificó nada.
- El doc del analog está en inglés. Los artefactos de esta fase van en español neutro por CLAUDE.md; se conserva la estructura, se traduce la prosa, y los identificadores/nombres de archivo quedan como están.

Secciones que Phase 32 no tenía y Phase 45 agrega (definidas en RESEARCH `## Formato del artefacto`): `## Canonical / hreflang`, `## Search Console`, `## Tráfico real y V`, más la nota explícita de CrUX. Todas siguen la misma regla: fila por cada una de las 14 rutas siempre, y `sin datos en la ventana` escrito en la celda en vez de dejarla vacía.

En la línea `**Captured:**` cambia el procedimiento: producción live `https://juan-tech.com`, mediana de 3 corridas, los tres archivos crudos nombrados, y la nota de que es laboratorio local y no comparable directo con un score de PSI.

---

### Artefactos JSON del directorio de fase

#### `lh-phase45-baseline.json` — shape exacto de `lh-phase32-baseline.json`

Objeto keyed por path, valores numéricos planos, sin metadata ni envoltorio:

```json
{
  "/": {
    "performance": 84,
    "accessibility": 96,
    "best-practices": 96,
    "seo": 100,
    "lcpMs": 4094,
    "cls": 0,
    "tbtMs": 154
  }
}
```

Es idéntico a lo que emite `lighthouse-mobile.mjs`, así que la mediana debe producir el mismo shape para que Phase 50 pueda diffear archivo contra archivo. Los tres crudos `lh-phase45-run{1,2,3}.json` son salida directa del script y ya tienen ese shape.

#### `45-baseline-content.json` — atención, el shape del artefacto **no** es el del script

Esto es un hallazgo, no un detalle. `capture-service-page-snapshot.mjs:61-71` devuelve:

```json
{ "/": { "h1": { "count": 1, "texts": ["..."] }, "jsonLd": [{ "type": "Person", "raw": { } }] } }
```

Pero `32-baseline-content.json` está guardado **condensado**, sin el `raw` del JSON-LD:

```json
{
  "/": {
    "h1Count": 1,
    "h1": ["Juan Carlos Angulo: Ingeniero de Software y Experto SEO"],
    "jsonLdCount": 1,
    "jsonLdTypes": ["Person"]
  }
}
```

Alguien lo transformó a mano o con un `node -e` en Phase 32. El plan tiene que decidir cuál de los dos shapes se commitea y decirlo explícito. Recomendación: guardar el **condensado** (mismo shape que `32-baseline-content.json`) para que la serie 32 → 45 → 50 sea diffeable, y ese es también el motivo por el que el archivo es de 955 bytes y no de cientos de KB: el `raw` de tres bloques LD+JSON por ruta × 14 rutas infla el archivo sin aportar al gate. Nota: en el analog el texto quedó con entidades HTML sin decodificar (`"Software Engineer &amp; SEO Expert"`); replicar ese comportamiento en vez de "arreglarlo", o Phase 50 va a leer un cambio donde no lo hay.

#### `45-baseline-headlinks.json` y `45-gsc-snapshot.json`

Sin analog en el repo. Heredan la convención general de los artefactos de fase: objeto keyed por path (o por URL absoluta normalizada, en el caso de GSC), `JSON.stringify(x, null, 2)`, commiteado junto al `.md`.

Para el de GSC, RESEARCH ya fija el contenido crítico: guardar `p1_*` y `p2_*` crudos y **no** los campos `*_diff`, que vienen invertidos (`p2 − p1`). Y ningún artefacto de esta fase puede contener el bearer del hub.

---

## Shared Patterns

### Estructura común de los tres scripts `scripts/*.mjs` de captura

**Fuente:** `capture-service-page-snapshot.mjs`, `verify-live-jsonld-meta.mjs`, `lighthouse-mobile.mjs`
**Aplica a:** el script nuevo

1. Shebang `#!/usr/bin/env node` + docblock que nombra la fase y el plan que lo creó, con bloque `Usage:` copiable.
2. ESM puro. `import { writeFile } from 'node:fs/promises'` y `fetch` nativo. Cero dependencias nuevas, cero import de Payload, cero contacto con la DB.
3. Constante de rutas hardcodeada arriba, con comentario que explica de dónde salió la lista.
4. `parseArgs` manual sobre `process.argv.slice(2)`. Nada de `commander` ni `node:util parseArgs`.
5. Error por ruta capturado y guardado en el resultado; el loop nunca aborta.
6. `process.exitCode = 1` al final si hubo fallos; nunca `process.exit(1)` en medio del loop.
7. `main().catch(...)` al pie con `console.error('<nombre-del-archivo>.mjs crashed:', err)` y `process.exit(1)`.

### Convención de "script hermano" en vez de modificar el original

**Fuente:** `verify-live-jsonld-meta.mjs:8-11`
**Aplica a:** la decisión central de esta fase

El repo ya estableció la regla y la dejó escrita en el encabezado del archivo: cuando hace falta extraer algo más, se crea un hermano con la misma forma de CLI y el original queda intacto, para que las capturas viejas sigan siendo comparables byte a byte. Esa es la justificación de `capture-head-links-snapshot.mjs` frente a la frase de CONTEXT.md "no se escribe un capturador nuevo".

### Comentarios que explican el porqué, no el qué

**Fuente:** `lighthouse-mobile.mjs:44-49`, `capture-service-page-snapshot.mjs:31-36`, `verify-live-jsonld-meta.mjs:18-22`

Todos los scripts del repo comentan las decisiones raras, no la sintaxis: por qué el fallback de `--routes` es `null`, por qué TBT es proxy de INP, por qué una lista vacía significa "por diseño no hay JSON-LD". El script nuevo debe comentar el camelCase de `hrefLang` con esa misma voz, porque es exactamente el tipo de cosa que el repo documenta en línea.

---

## No Analog Found

| Archivo / paso | Rol | Flujo | Motivo |
|---|---|---|---|
| Agregación de medianas → `lh-phase45-baseline.json` | utility | 3 JSON → 1 JSON | **No existe ningún helper de mediana ni de agregación numérica en el repo.** Se buscó por `median`/`mediana` en `scripts/` y los únicos aciertos son ruido de contenido de posts de blog (`humanize-posts-batch-*`). Lo más cercano en espíritu es `scripts/diff-humanization-snapshots.ts`, que compara dos snapshots JSON, pero es un diff de texto localizado, no una agregación numérica: no aporta código reusable |
| `45-gsc-snapshot.json` | artefacto de datos externo | JSON-RPC → JSON | Ningún artefacto de Search Console fue commiteado antes en este repo. El shape lo define el plan desde cero, siguiendo la regla de guardar `p1_*`/`p2_*` crudos |

### Recomendación sobre la mediana

Hay dos precedentes en el repo y apuntan en direcciones distintas:

- **Inline `node -e`** — es lo que hicieron las Phases 25/28/32. `32-CONTEXT.md:25` lo dice literal: *"Phase 28's H1/JSON-LD diff pattern (inline `node -e` against a running server) — reused verbatim"*.
- **Script dedicado bajo `scripts/`** — `diff-humanization-snapshots.ts` cuando el paso es lo bastante complejo y se va a repetir.

**Recomendación: inline `node -e`**, con el bloque escrito verbatim dentro del plan y copiado también a la sección `**Captured:**` de `45-REGRESSION-BASELINE.md`. Tres razones: es el precedente explícito de la serie 28 → 32 que esta fase continúa; la lógica son ~15 líneas (mediana de 3 números sobre 7 métricas × 14 rutas, sin casos borde más allá de saltear las claves con `error`); y esta fase ya gasta su presupuesto de archivo nuevo en `capture-head-links-snapshot.mjs`, que sí necesita justificación ante Juan. Dejar el comando embebido en el baseline resuelve además la reproducibilidad para Phase 50, que es el único argumento fuerte a favor del script.

Si el plan prefiere garantizar esa reproducibilidad con un archivo versionado, la alternativa es `scripts/median-lighthouse-runs.mjs` siguiendo los siete puntos de `## Shared Patterns` y con flags `--runs a.json,b.json,c.json --out baseline.json`. Es una decisión del plan, no de la ejecución.

---

## Metadata

**Ámbito de búsqueda:** `scripts/` (128 entradas listadas), `.planning/milestones/v1.7-phases/32-regression-baseline/`, `.planning/phases/44-decisiones-de-monetizaci-n/`, `.planning/` para precedentes de `node -e`.
**Archivos leídos completos:** `scripts/verify-live-jsonld-meta.mjs` (250 líneas), `scripts/capture-service-page-snapshot.mjs` (112), `scripts/lighthouse-mobile.mjs` (148), `32-REGRESSION-BASELINE.md` (37), `lh-phase32-baseline.json`, `32-baseline-content.json`, cabecera de `scripts/diff-humanization-snapshots.ts`.
**Archivos modificados por este agente:** ninguno bajo `src/`, ninguno bajo `scripts/`. Solo se escribió este PATTERNS.md.
**Fecha de extracción:** 2026-08-30
