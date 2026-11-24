---
phase: 54-paginas-de-conversion-y-utilidad
plan: 11
subsystem: ui
tags: [mui, search, ssr-selftest, a11y, seo, payload-search]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 05 (PageHero compact, Crumbs), plan 06 (lists, links) y plan 07 (namespace search de messages)
provides:
  - SearchView, vista cliente de la busqueda con formulario, region de estado, tarjetas, vacio y error
  - La ruta de busqueda reescrita sobre SearchView con consulta, hrefFor, robots y force-dynamic intactos
  - 54-search-ssr.ts, autoprueba de render con 75 comprobaciones en es y en
  - 54-search.mjs, contrato HTTP para el preview con selftest

affects: [54-14, 54-16]

plan_head_before: e0993aec68f986a63fb24ad23d4b30d994295ecb
actuals:
  tokens: 9700
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "La ruta arma un arreglo plano de resultados (id, type, title, description, href) y la vista no conoce la forma del doc de Payload"
    - "El contrato HTTP exporta su funcion de chequeo y la autoprueba de render le pasa el HTML real de la vista"

key-files:
  created:
    - src/components/pages/SearchView.tsx
    - scripts/verify/54-search-ssr.ts
    - scripts/verify/54-search.mjs
  modified:
    - src/app/(frontend)/[locale]/search/page.tsx

key-decisions:
  - "Las migas usan common.breadcrumbHome desde la propia vista (useTranslations('common')) en lugar de recibirlas por props, porque la ruta no tiene otra cosa que pasar"
  - "El chip del tipo solo se dibuja para posts, case-studies y authors; un tipo desconocido muestra la tarjeta sin chip en vez de una clave de mensaje rota"
  - "El limite de 200 caracteres lo recorta la ruta y no se exporta una funcion auxiliar (un archivo de ruta de Next no admite exports extra); la autoprueba comprueba que la ruta conserva constante y recorte, y 54-search.mjs mide el efecto real con una consulta de 300 caracteres"

patterns-established:
  - "Un script de contrato HTTP se valida tambien contra el render real de la vista, no solo contra fixtures escritos a mano"

requirements-completed: []

duration: 20min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 11: Busqueda MUI Summary

**La busqueda usa SearchView con PageHero compact, formulario role search, conteo con plural ICU en una region status y tarjetas con enlace estirado, sin tocar el where de la consulta, el robots index false y follow true, ni force-dynamic.**

## Accomplishments

- `SearchView` cubre los cuatro estados: sin consulta (solo h1 y formulario, sin region de estado), con resultados (region `role="status"` `aria-live="polite"` con "N resultados", `UL` de `Card` con `Chip` de tipo, h2 variante h6 con enlace estirado, descripcion con `-webkit-line-clamp: 3` y el texto completo en el DOM), sin resultados (h2 con la consulta, cuerpo y dos botones outlined a Blog y Casos de exito) y falla (`Alert severity="error"` con `role="alert"`, sin region de estado).
- El foco se dibuja en la tarjeta con `:has(a:focus-visible)` (2px `accentText`, offset 2px) y el enlace pierde su outline solo ahi. El hover cambia el borde a `text.primary`.
- La ruta pierde la constante `copy` y toma las cadenas del namespace `search` (incluido el titulo de `generateMetadata`). El diff de la ruta no toca `runSearch` salvo por `overrideAccess: false`: mismo where de cuatro `like`, `pagination: false`, sin `depth` ni `select`. `hrefFor`, `MAX_QUERY_LENGTH`, `force-dynamic` y el bloque de robots con su comentario quedan intactos.
- `54-search-ssr.ts`: 75 comprobaciones en PASS, salida 0 (sin consulta, tres resultados, un resultado en singular, cero resultados, falla, escape de una consulta con `<script>`, version en ingles con prefijo `/en`, limite en la ruta, y el HTML real de la vista pasado por el contrato HTTP).
- `54-search.mjs --selftest`: 5 fixtures validos sin fallos y 14 defectuosos detectados, salida 0. En vivo comprueba `/search`, `/en/search`, `/search?q=seo` (resultados, conteo, los primeros tres href responden 200), `/search?q=zzzzqx` y su version EN (vacio y enlaces de salida), una consulta de 300 caracteres que debe llegar con 200, y noindex y follow en todas (`EXPECT_PREVIEW=1` exige tambien `x-robots-tag`).

## Task Commits

1. **Task 1 (tracer): busqueda de punta a punta con consulta conservada y vista MUI** - `ce960a6` (feat)
2. **Task 2: contrato HTTP de la busqueda para el preview** - `439ad28` (feat)

La rama NO se empujo (regla de la fase: el empuje final lo hacen 54-14 o 54-16).

## Verificacion

- `node_modules/.bin/tsx scripts/verify/54-search-ssr.ts`: PASS en todos los casos, salida 0.
- `node scripts/verify/54-search.mjs --selftest`: PASS, salida 0. `node --check` sin errores.
- `npx tsc --noEmit`: salida 0. `node scripts/verify/53-layer-check.mjs`: OK.
- Criterios de aceptacion de la tarea 1 y de la tarea 2 (`overrideAccess: false`, `like: query`, `useTranslations('search')`, sin `const copy`, `zzzzqx` y `EXPECT_PREVIEW` en el script): todos cumplen. `SearchView` no declara main.
- No hubo lectura de `home_page*` ni de `about_page*` en este plan (la busqueda lee la coleccion `search`), asi que el supuesto A7 no aplica aqui y no hizo falta revisar los logs del preview.
- El contrato en vivo no se corrio: el preview sigue en el SHA 5fa327d con la busqueda vieja. Queda para 54-16, ya con la rama empujada.

## Cadenas nuevas sin aprobar (para Juan)

Salen de `messages/{es,en}.json` (plan 54-03), son supuestos del planificador de UI-SPEC y no tienen aprobacion de Juan:

| Clave | ES | EN |
|-------|----|----|
| `search.submit` | Buscar en el sitio | Search the site |
| `search.resultCount` | {count, plural, one {# resultado} other {# resultados}} | {count, plural, one {# result} other {# results}} |
| `search.fieldLabel` | Buscar | Search |
| `search.formAria` | Búsqueda en el sitio | Site search |
| `search.blogLink` / `casesLink` | Blog / Casos de éxito | Blog / Case studies |

Las traducciones EN de estas filas tambien son supuestos. Se reutilizaron sin cambios `title`, `placeholder`, `noResultsHeading`, `noResultsBody`, `errorHeading` y `typeLabels`, que ya existian en la ruta.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dos comprobaciones de la autoprueba contaban de mas**
- **Found during:** Tarea 1 (primera corrida)
- **Issue:** `MuiChip-root` aparece tambien en el CSS en linea de emotion (17 coincidencias para 3 chips), y los `li` incluian los de las migas (6 para 3 resultados).
- **Fix:** el conteo de chips y de botones outlined se ancla a la etiqueta de apertura (`<div class="...MuiChip-root`, `<a class="...MuiButton-outlined`) y los `li` se cuentan dentro de la lista con `role="list"`.
- **Files modified:** `scripts/verify/54-search-ssr.ts`
- **Commit:** `ce960a6`

### Ajustes dentro del alcance

- **Limite de largo (T-54-43):** el plan pedia usar la funcion de recorte exportada "si existe". No existe y no se puede exportar desde una ruta de Next, asi que la autoprueba lee el archivo de la ruta y comprueba constante y recorte, y el efecto sobre el `defaultValue` se mide en vivo con la consulta de 300 caracteres de `54-search.mjs` (esto ultimo es una comprobacion extra respecto al plan).
- **Contrato validado contra el render real:** se agrego a `54-search-ssr.ts` el caso que pasa el HTML real de la vista (es y en, tres estados) por `checkSearchPage`, para que el script de 54-16 no dependa solo de fixtures escritos a mano. Es la unica razon por la que `54-search-ssr.ts` importa `54-search.mjs`.
- **EN en el contrato:** se agrego `/en/search?q=zzzzqx` a las rutas en vivo (el plan solo nombra `/search?q=zzzzqx`).

## Supuestos que quedan para el preview

- **A3 (depth y select):** no se tocaron; si la consulta resulta pesada en el preview se evalua en 54-16, no aqui.
- **Forma del HTML real de Next:** el contrato se valido contra el render de la vista envuelto en un shell minimo, no contra el HTML completo del preview (region de estado, h2 y enlaces se localizan entre el `role="status"` y el `<footer`).
- Los dos criterios `backstop` del plan (la ruta dinamica sigue respondiendo 200 sin `loading` ni Suspense) se miden con `54-search.mjs` en el preview.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno. T-54-43 (recorte a 200), T-54-44 (consulta escapada, probado con una consulta con `<script>`), T-54-45 (`overrideAccess: false`) y T-54-46 (robots conservado) quedan mitigados como indica el plan.

## Self-Check: PASSED

- FOUND: src/components/pages/SearchView.tsx, scripts/verify/54-search-ssr.ts, scripts/verify/54-search.mjs, src/app/(frontend)/[locale]/search/page.tsx
- FOUND: commits ce960a6 y 439ad28
