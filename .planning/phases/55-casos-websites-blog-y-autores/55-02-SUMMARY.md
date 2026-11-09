---
phase: 55-casos-websites-blog-y-autores
plan: 02
subsystem: testing
tags: [verification, seo-parity, json-ld, blog, selftest, orchestrator]
requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: 54-page-contract (extractMeta, checkContract), 54-run-all, 54-messages-parity, 54-no-sandbox-data
  - phase: 55-casos-websites-blog-y-autores
    provides: 55-01 tracer (55-tracer-live, 55-websites-ssr) que el orquestador ya incluye
provides:
  - 55-page-contract.mjs con la lista de rutas de las superficies 55 construida desde produccion y --require-home-sections
  - 55-seo-parity.mjs con igualdad profunda de title, description, canonical, hreflang, og:*, twitter:*, robots y JSON-LD completo
  - 55-post-contract.mjs sobre los 58 posts en es y en, con 308 heredado y de categoria no primaria
  - 55-content-parity.mjs con texto, h2 y h3, pre, table, FAQ y enlaces internos por post
  - 55-run-all.mjs (--selftests, --live, --strict) que corre la bateria 54 como regresion
  - 55-no-sandbox-data.mjs y 55-messages-parity.mjs (--final)
affects: [55-03, 55-06, 55-08, 55-10, 55-11, 55-12, 55-13]
tech-stack:
  added: []
  patterns:
    - "Comparador validado contra si mismo: BASE_URL igual a PROD_BASE debe dar cero fallos antes de apuntarlo al preview"
    - "Script ausente en el orquestador es SKIP; --strict lo convierte en FAIL (lo exige el ultimo plan)"
    - "Las URLs EN de los posts se derivan de las ES con /en, nunca del sitemap EN"
key-files:
  created:
    - scripts/verify/55-page-contract.mjs
    - scripts/verify/55-seo-parity.mjs
    - scripts/verify/55-post-contract.mjs
    - scripts/verify/55-content-parity.mjs
    - scripts/verify/55-run-all.mjs
    - scripts/verify/55-no-sandbox-data.mjs
    - scripts/verify/55-messages-parity.mjs
  modified: []
key-decisions:
  - "Los helpers HTTP y de HTML (parseAttrs, openTags, getPage, pool, fetchPostPaths, surfaceRoutes) viven en 55-page-contract.mjs y los demas scripts los importan; no se tocaron archivos de la fase 54"
  - "Un enlace interno de mas en un post es WARN en 55-content-parity; solo un enlace de produccion que falta es FAIL"
  - "Las anclas sin destino son WARN contra produccion y FAIL con --preview-only"
  - "55-run-all agrega un --selftest propio de la logica de SKIP y --strict"
requirements-completed: []
duration: 60min
completed: 2026-11-09
status: complete
commits: 3
plan_head_before: 799f30eab45c398cca177c5c2a20b61b61030060
actuals:
  tokens: 25000
  tasks: 3
  commits: 3
---

# Phase 55 Plan 02: Bateria de verificacion de la fase 55 Summary

Siete scripts de solo lectura (HTTP contra preview y produccion, mas analisis estatico) con autopruebas de fixture valido y defectuosos de un solo campo, y todos probados contra produccion como espejo de si misma antes de apuntarlos al preview.

## Que quedo hecho

- **Tarea 1 (tracer), commit 0ed7a2b:** `55-page-contract.mjs` arma las 46 rutas de las superficies (indices, slugs de las APIs publicas, cinco categorias incluida `general`, autores, es y en) y aplica `checkContract` de 54 mas la revision de activos del sandbox; `--require-home-sections` suma `/` y `/en` y exige `id="casos"` e `id="sitios"`. `55-seo-parity.mjs` compara por igualdad profunda (con `deepDiff` que imprime campo, ruta y ambos valores) y aplana `@graph`, omite `@context` y ordena claves, de modo que un campo distinto con los mismos tipos falla (la fase 54 solo comparaba tipos).
- **Tarea 2, commit 9c8c8c3:** `55-post-contract.mjs` y `55-content-parity.mjs` sobre los 58 posts en dos idiomas. Los slugs de `EN_TRANSLATION_INCOMPLETE` se leen del archivo por expresion (17 slugs).
- **Tarea 3, commit f5321a7:** `55-no-sandbox-data.mjs` (lee en tiempo de ejecucion 21 titulos de leccion y 7 slugs de caso del sandbox y comprueba que ninguno aparece como literal en `src`), `55-messages-parity.mjs` (seis espacios nuevos, `--final` los exige) y `55-run-all.mjs`.

## Resultados de verificacion

| Comprobacion | Resultado |
|---|---|
| `55-page-contract --selftest` | PASS (18 casos) |
| `55-seo-parity --selftest` | PASS (22 casos, incluye JSON-LD con un campo distinto y mismos tipos, og:image, twitter:card, hreflang, robots, x-robots-tag) |
| `55-post-contract --selftest` | PASS (36 casos) |
| `55-content-parity --selftest` | PASS (17 casos) |
| `55-no-sandbox-data --selftest` y real | PASS (340 archivos de `src`, 0 hallazgos) |
| `55-messages-parity --selftest` y real | PASS (hoy solo existe `websites`; con `--final` falla por los cinco que faltan, como corresponde) |
| `55-run-all --selftest` | PASS (SKIP, `--strict` y orden de pasos live) |
| `55-run-all --selftests` | PASS, exit 0 (SKIP de los scripts de planes posteriores; la regresion 54 completa pasa) |
| `55-run-all --selftests --strict` | exit 1 con 7 FAIL por scripts ausentes: es el comportamiento esperado |
| `55-seo-parity` produccion contra produccion, todas las rutas | PASS, 162 rutas (46 superficies mas 116 URLs de posts), 0 FAIL |
| `55-page-contract` contra produccion | PASS, 46 rutas, 0 FAIL, 54 WARN (encabezados con punto o coma, que se revisan en la fase 56) |
| `55-post-contract` produccion contra produccion, completo | PASS, 120 PASS (116 paginas y 4 redirecciones), 0 FAIL, 1 WARN |
| `55-content-parity` produccion contra produccion, completo | PASS, 116 PASS, 0 FAIL |

## Hallazgos sobre produccion

- **Anclas sin destino en `/en/blog/cs-fundamentals/recursividad`:** 7 enlaces `#what-is-recursion`, `#the-mechanics-of-recursion` y otros escritos a mano en el cuerpo EN apuntan a encabezados que en produccion no llevan `id` (los encabezados de produccion no tienen ids en ningun post). Es un defecto del sitio actual y el post es EN incompleto con noindex. Por eso la comprobacion es WARN contra produccion y FAIL con `--preview-only`: el diseno nuevo asigna ids a los encabezados y deberia resolverlos.
- **Location duplicado en la primera respuesta de una URL heredada:** cuando `/blog/<slug>` no esta en la cache de ruta de Next, la primera respuesta 308 llega con `location: /x, /x` (valor repetido e identico; las siguientes salen limpias). `checkRedirect` deduplica valores identicos y falla solo con valores distintos. No cambio nada en produccion.
- **Ningun post tiene mas de una categoria hoy** (los 58 tienen exactamente una). La prueba de categoria no primaria usa cualquier otra categoria del conjunto sobre el primer post, porque la ruta redirige cualquier segmento distinto de la primaria.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Las anclas sin destino fallaban contra produccion por un defecto previo del sitio**
- **Found during:** Tarea 2 (corrida completa de `55-post-contract` sobre produccion)
- **Issue:** el criterio de anclas daba FAIL en `/en/blog/cs-fundamentals/recursividad`, rompiendo el espejo prod contra prod que el plan exige en verde.
- **Fix:** WARN sin `--preview-only`, FAIL con `--preview-only`; autoprueba que cubre las dos ramas.
- **Files modified:** scripts/verify/55-post-contract.mjs
- **Commit:** 9c8c8c3

**2. [Rule 1 - Bug] El Location repetido de la primera respuesta 308 daba un falso FAIL**
- **Found during:** Tarea 2 (`--limit 5`, primera corrida)
- **Fix:** deduplicacion de valores identicos en `checkRedirect`, con autoprueba de dos valores distintos que sigue fallando.
- **Commit:** 9c8c8c3

### Interpretaciones del plan

- **Archivos de apoyo:** los helpers compartidos (`parseAttrs`, `openTags`, `getPage`, `pool`, `fetchPostPaths`, `surfaceRoutes`, `postPathsFromSitemap`) se exportan desde `55-page-contract.mjs` porque `54-page-contract.mjs` no los exporta y no quise modificar archivos de la fase 54. `55-seo-parity` conserva el vinculo con `extractMeta` de 54.
- **`55-seo-parity` incluye por defecto los 116 URLs de posts** ademas de las superficies (D-04: la paridad de los 58 posts es criterio de aceptacion); `--no-posts` los omite.
- **`55-content-parity`:** "mismo conjunto de enlaces internos" se aplica como FAIL si falta uno de produccion y WARN si sobra uno, para que un enlace agregado por el diseno nuevo (por ejemplo al autor) no obligue a quitarlo. Los h2 y h3 dentro de `nav` y `aside` no cuentan (rotulo del TOC, relacionados). El cuerpo es `article#post-body`, luego el primer `article`, luego `main`: si 55-11 cambia ese marcado, debe conservar un `article`.
- **`55-post-contract` en el preview:** con `EXPECT_PREVIEW=1` no se exige `follow` en los EN incompletos porque el layout del preview impone `noindex, nofollow`; el `follow` se prueba contra produccion. Tambien se exige, fuera del preview, que un post completo no lleve noindex y que su pagina ES anuncie hreflang en.
- **`55-run-all --selftest` propio** (no pedido): prueba la logica de SKIP y `--strict` con pasos simulados.
- **Medicion de `commits`:** el checkout es compartido con los ejecutores de 55-03, 55-04 y 55-05, pero entre `plan_head_before` y HEAD solo hay los 3 commits de este plan, asi que el conteo es limpio.

## Notas para los planes siguientes

- Cada plan de vista corre `55-seo-parity --routes <ruta>` y `55-page-contract --routes <ruta>` contra el preview apenas despliega.
- `55-post-contract --preview-only` exige `role="progressbar"` en cada post y una `ol` con enlaces de ancla (TOC) cuando el cuerpo tiene h2 y al menos dos encabezados h1, h2 o h3 (un h1 del cuerpo cuenta como h2).
- El ultimo plan debe correr `55-run-all.mjs --selftests --strict` y `55-messages-parity.mjs --final`.
- Para el DNS del preview usar `NODE_OPTIONS="--require <scratchpad>/dnsfix.cjs"`; ese archivo nunca entra al repo.

## Elementos para la revision humana de Juan

1. Decidir si el WARN de anclas sin destino en `recursividad` EN (defecto del sitio actual) se corrige en el contenido o se deja a que lo resuelva el diseno nuevo.
2. Confirmar la interpretacion de enlaces internos (falta es FAIL, sobra es WARN) en `55-content-parity`.

## Known Stubs

Ninguno. Ningun script usa datos del sandbox ni valores falsos: el chequeo adicional de `55-no-sandbox-data` lee los archivos del sandbox solo para comparar y no copia su texto.

## Threat Flags

Ninguno. T-55-05 mitigado (igualdad profunda de og, twitter y JSON-LD, autoprueba con defectos de un campo), T-55-06 (58 posts en dos idiomas, 308 y noindex de los 17 EN incompletos), T-55-07 (ningun script importa payload, usa `--env-file` ni abre base de datos; solo GET) y T-55-08 (`--strict` convierte SKIP en FAIL).

## Self-Check: PASSED

Los siete scripts existen y los commits 0ed7a2b, 9c8c8c3 y f5321a7 estan en el historial de `feat/mui-redesign`.
