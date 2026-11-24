---
phase: 57-gate-de-calidad-y-corte-a-producci-n
plan: 02
subsystem: verify
status: complete
tags: [seo, paridad, tailwind, cal-03, gate, snapshot]
requires:
  - 57-01 (preview actualizado y línea base)
provides:
  - scripts/verify/57-seo-parity-all.mjs (paridad SEO de toda la superficie, --selftest, --snapshot, --live-prod --vs-snapshot, --out)
  - scripts/verify/57-new-routes.mjs (contrato de rutas nuevas y --derive desde el árbol [locale])
  - scripts/verify/57-legacy-render-sweep.mjs (barrido de clases Tailwind con control positivo, --report-fallback)
  - evidence/57-seo-parity-preview.json y .md (primera corrida clasificada)
  - evidence/57-legacy-render-sweep-preview.json
affects: [57-06, 57-09, 57-11, 57-03]
tech-stack:
  added: []
  patterns:
    - "Extractor de head y JSON-LD importado de 55-seo-parity.mjs, sin modificarlo"
    - "EN_TRANSLATION_INCOMPLETE leído del .ts como texto, sin comentarios"
    - "Clasificación a/b/c de diferencias en una tabla KNOWN_DIFFERENCES dentro del script"
    - "Clases Tailwind contadas por token completo, no por subcadena"
key-files:
  created:
    - scripts/verify/57-seo-parity-all.mjs
    - scripts/verify/57-new-routes.mjs
    - scripts/verify/57-legacy-render-sweep.mjs
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-seo-parity-preview.json
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-seo-parity-preview.md
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-legacy-render-sweep-preview.json
  modified:
    - scripts/verify/55-content-parity.mjs
decisions:
  - "Las palabras indexables se cuentan dentro de <main> cuando ambos entornos lo tienen: el rediseño cambió cabecera y pie, y contar el body mediría el menú. El total del body queda en el JSON"
  - "En --live-prod los h1 y saltos se comparan de forma relativa al snapshot (solo falla lo que empeoró); contra el preview son absolutos"
  - "Los enlaces /go/* (afiliados, 302 hacia fuera, Disallow en robots) no se sondean, y /sitemap.xml y /sitemap.html tampoco en el preview porque allí se reescriben a /preview-blocked"
  - "Presupuesto del autor: 500.000 bytes sin comprimir"
metrics:
  duration: 50min
  completed: 2026-11-17
actuals:
  tokens: 73500
  tasks: 3
  commits: 4
plan_head_before: b31a6bc9be2faa553b2f3968be453dca7bf0ee9f
plan_head_after: e1ef7cd6ab1df571006764bf005a82573882ddc1
---

# Phase 57 Plan 02: paridad SEO de toda la superficie y barrido de Tailwind Summary

Tres scripts de solo lectura con autopruebas: la paridad SEO de las 166 URLs del sitemap de producción más 6 rutas fuera del sitemap, 2 rutas nuevas y 38 redirects, con snapshot y comparación de producción para el corte. Junto a ellos, el barrido de clases Tailwind con control positivo. En la primera corrida el head y el JSON-LD del preview coinciden con producción en todas las URLs. Quedan 17 enlaces internos para 57-06 y 2 diferencias del rediseño que Juan tiene que aceptar.

## Tareas

| Tarea | Nombre | Commit | Archivos |
|---|---|---|---|
| 1 | 57-seo-parity-all.mjs y 57-new-routes.mjs | 6f8628d | scripts/verify/57-seo-parity-all.mjs, scripts/verify/57-new-routes.mjs |
| 2 | 57-legacy-render-sweep.mjs con control positivo | 9d461e5 | scripts/verify/57-legacy-render-sweep.mjs |
| 3 | Primera corrida contra el preview y clasificación | e1ef7cd | evidence/57-seo-parity-preview.json y .md, evidence/57-legacy-render-sweep-preview.json, reglas de clasificación en 57-seo-parity-all.mjs |
| extra | Normalización de /services en 55-content-parity | 6c4773f | scripts/verify/55-content-parity.mjs |

## Resultados de la corrida (2026-11-17, preview https://dev.juan-tech.com)

- **53-crawl-parity:** 166 URLs y 0 diferencias de estado.
- **57-seo-parity-all:** 172 de 174 URLs sin diferencias en title, description, canonical, hreflang, og, twitter, JSON-LD, h1, saltos de encabezado y palabras. Los 38 redirects de la colección dan el mismo estado y destino. `/sobre-mi` y `/en/sobre-mi` cumplen su contrato.
- **F5 (autor):** 359.166 bytes en el preview contra 2.785.019 en producción. PASS con el presupuesto de 500 KB.
- **F4 y F12 (enlaces):** se revisaron 194 destinos internos y fallaron 17.
- **CAL-03:** 0 clases utilitarias en 174 URLs del preview, incluidas 404, búsqueda, privacidad, términos, contacto y Sobre mí en ES y EN. El control positivo da 1408, 942, 747 y 411 coincidencias en producción. Ninguna URL cae en el respaldo RenderBlocks.
- **55-content-parity**, después de la normalización: 110 PASS y 0 FAIL. Los 6 posts EN que 57-01 marcaba ya pasan.

### Diferencias clasificadas (19, todas con clase)

| Clase | Cantidad | Qué es | Dónde se resuelve |
|---|---|---|---|
| a | 14 | Enlaces internos a gemelos EN noindex de `EN_TRANSLATION_INCOMPLETE`. Los dos del pie EN (`estrategia-seo`, `technical-seo-guide`) salen en 80 páginas, el resto en el listado y los relacionados del blog EN. Producción tiene los mismos 14 | 57-06 |
| a | 1 | El pie EN enlaza `/en/sitemap.html`, que da 404 también en producción | 57-06 |
| a | 2 | `/en/services/ai-seo-geo` enlaza `/en/llms.txt` y `/en/llms-full.txt` (404). Producción enlaza la ruta sin prefijo: es una regresión del preview | 57-06 |
| b | 2 | `/blog/general` y `/en/blog/general` tienen entre 10% y 11% menos palabras. La categoría está vacía y el rediseño quita el contador "0 artículos" y la fila repetida "Otros temas del blog". El copy propio es idéntico | Juan la acepta en 57-09 |
| c | 0 | Los dos falsos positivos de la prueba previa (`/go/*` y `/sitemap.html` en el preview) ya se corrigieron en el script | - |

### Peso de HTML (Pitfall 10, para 57-03)

En casi todas las plantillas el preview pesa de 1,5 a 3 veces más que producción. Ejemplos de medias: servicios 191 KB contra 87 KB, landing local 208 KB contra 102 KB, home 365 KB contra 205 KB, sitio 216 KB contra 75 KB. El post baja (305 KB contra 339 KB) y el autor baja mucho. La tabla completa está en `57-seo-parity-preview.md`. Sirve como dato para fijar el presupuesto en la medición de rendimiento.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 55-content-parity marcaba como perdidos enlaces que el preview localiza**
- **Found during:** tarea 3, por instrucción del orquestador
- **Issue:** los posts EN de producción enlazan `/servicios/...` y el preview enlaza `/en/services/...`. Es la misma página, pero la comparación lo contaba como enlace perdido (3 FAIL de la batería 56 en 57-01).
- **Fix:** `normalizeInternalLink` trata `/services` como `/servicios`, con aserciones nuevas en el selftest.
- **Files modified:** scripts/verify/55-content-parity.mjs
- **Commit:** 6c4773f

**2. [Rule 1 - Bug] Falsos positivos de enlaces en la prueba previa**
- **Found during:** tarea 1, en la prueba con 6 URLs
- **Issue:** los enlaces de afiliado `/go/*` (302 a propósito) y `/sitemap.html` (bloqueado solo en el preview) salían como redirect o enlace roto.
- **Fix:** `skipProbe` los excluye, con su prueba en el selftest. `/en/sitemap.html` se sigue sondeando, porque está roto de verdad.
- **Commit:** 6f8628d

### Ajustes de alcance

- El sitemap de producción lista hoy 166 URLs, no 169. El script siempre lee el sitemap vivo.
- Además del sitemap, la paridad cubre 6 rutas que producción sirve con 200 fuera del sitemap (`/search`, `/blog/confirm`, `/services`, `/en/servicios` y sus pares) y los 38 orígenes de la colección pública de redirects. `57-new-routes --derive` las encontró.
- Las palabras se cuentan en `<main>` y no en el body (ver decisiones).
- Agregué `evidence/57-legacy-render-sweep-preview.json` como evidencia del barrido. El plan solo pedía el JSON de paridad.
- `node_modules` aparece como no rastreado en el worktree: el enlace simbólico no coincide con la regla de `.gitignore`. Nunca entró en un commit.

## Notas para los planes siguientes

- **57-06:** las 17 diferencias de clase a. Con el pie EN se resuelven 3 de golpe (dos gemelos y `/en/sitemap.html`). El prefijo `/en` en los enlaces a `.txt` viene del texto enriquecido EN.
- **57-09:** Juan acepta o rechaza por escrito la diferencia de `/blog/general`.
- **57-11:** `node scripts/verify/57-seo-parity-all.mjs --snapshot <archivo>` antes del corte, y después `--live-prod --vs-snapshot <archivo> --out <archivo>`. Antes del corte hay que agregar `--skip-new-routes`, porque `/sobre-mi` da 404 en producción.
- Observación sin acción: producción sirve `/services` y `/en/servicios` con 200 fuera del sitemap (pares cruzados de idioma). El preview hace lo mismo y la paridad no ve diferencia.

## Threat Flags

Ninguno. Los tres scripts solo hacen GET a sitios públicos y a la API pública de redirects. No guardan cookies ni cabeceras de sesión, y el grep de aceptación (`env-file|DATABASE_URI|set-cookie`) da vacío. La concurrencia es de 4, como en 53.

## Self-Check: PASSED

- FOUND: scripts/verify/57-seo-parity-all.mjs, 57-new-routes.mjs, 57-legacy-render-sweep.mjs
- FOUND: evidence/57-seo-parity-preview.json, .md y 57-legacy-render-sweep-preview.json
- FOUND: 6f8628d, 9d461e5, 6c4773f y e1ef7cd en HEAD
- Selftests en PASS: 57-seo-parity-all, 57-new-routes, 57-legacy-render-sweep, 55-seo-parity y 55-content-parity
