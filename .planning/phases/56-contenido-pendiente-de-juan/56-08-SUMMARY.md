---
phase: 56-contenido-pendiente-de-juan
plan: 08
subsystem: frontend
tags: [legal, privacy, terms, effective-date, a11y, fallback, d-02, d-09, cont-03]
requires:
  - phase: 56-01
    provides: clave de messages legal.effectiveOn y guardia de contenido
  - phase: 56-03
    provides: global legal-pages y getCachedLegalPages (todo null si la tabla falta)
provides:
  - pickLegalSource y legalEffective (helper puro compartido por privacy y terms)
  - LegalView con linea de fecha efectiva accesible (time con dateTime) solo cuando hay dato
  - privacy y terms leen el global con respaldo al doc pages del mismo idioma
  - 56-legal-ssr.ts, autoprueba de render sin red (privacy y terms, es y en)
affects: [56-12, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "El texto legal sale del global si el cuerpo de ESE idioma tiene texto; si no, del doc pages del mismo idioma"
    - "Title, meta, Open Graph y migas siguen saliendo del doc pages (paridad de SEO de 54-16)"
    - "Fecha efectiva formateada en UTC con Intl.DateTimeFormat para que el dia no se corra en America"
key-files:
  created:
    - src/lib/legal-source.ts
    - scripts/verify/56-legal-ssr.ts
  modified:
    - src/components/pages/LegalView.tsx
    - src/app/(frontend)/[locale]/privacy/page.tsx
    - src/app/(frontend)/[locale]/terms/page.tsx
key-decisions:
  - "La fecha efectiva viaja solo con el texto del global; el texto del doc pages (el de producción hoy) nunca muestra fecha"
  - "legalEffective acepta el timestamp ISO que entrega Payload (2026-11-30T00:00:00.000Z) o YYYY-MM-DD, valida el día real y devuelve null si no es una fecha"
  - "La linea de fecha va como hijo de PageHero (slot children existente), sin tocar PageHero"
requirements-completed: []
duration: 25min
completed: 2026-11-10
status: complete
commits: 2
plan_head_before: 834196da6a8a818501c22b3b388401b346d45e97
actuals:
  tokens: 4400
  tasks: 2
  commits: 2
---

# Phase 56 Plan 08: Rutas legales con global sombra y fecha efectiva Summary

Privacy y terms leen el texto legal nuevo del global `legal-pages` con respaldo al doc `pages` del mismo idioma, y LegalView muestra "Vigente desde el {fecha}" solo cuando Juan fija la fecha el día del corte.

## Qué se hizo

- **`src/lib/legal-source.ts`** (puro, sin Payload): `pickLegalSource(doc, legal, key)` devuelve `richTexts`, `effectiveDate` y `source` (`global` o `pages`). `legalEffective(raw, locale)` normaliza la fecha y la formatea en UTC.
- **`LegalView`**: props opcionales `effectiveLabel` y `effectiveDateIso`. Con ambas renderiza, dentro del PageHero compacto, un `Typography body2` con color `text.secondary` que contiene `<time dateTime="YYYY-MM-DD">`. Sin dato no renderiza nada. Se actualizó el comentario de cabecera: el slot ya existe y nunca usa `updatedAt`.
- **`privacy/page.tsx` y `terms/page.tsx`**: piden en paralelo el doc `pages` y `getCachedLegalPages(locale)`, llaman al helper con su clave y pasan texto y fecha a LegalView. `generateMetadata`, title, migas, eyebrow y tocLabel no cambiaron.
- **`scripts/verify/56-legal-ssr.ts`**: 52 comprobaciones sin red, por clave y por idioma.

## Verificaciones

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | sin errores |
| `tsx scripts/verify/56-legal-ssr.ts` (también con `TZ=America/Bogota`) | PASS, casos a a g en privacy y terms |
| `tsx scripts/verify/54-legal-ssr.ts` (contra producción, solo lectura) | PASS, sigue exigiendo cero fecha con el doc de hoy |
| `node scripts/verify/54-rsc-boundary.mjs` | PASS |
| `node scripts/verify/56-content-guard.mjs` | PASS |
| `npm run build` con variables falsas | exit 0, cero errores, cero rutas privacy o terms en el prerender-manifest, ningún intento de leer la base |

Casos de la autoprueba: global ausente o con cuerpo vacío cae al doc pages sin fecha (incluso si el global trae fecha pero no cuerpo); cuerpo sin fecha no pinta línea; `2026-11-30` sale como "30 de noviembre de 2026" en ES y "November 30, 2026" en EN con `dateTime="2026-11-30"`; un solo h1, ningún main, ids sin repetir y cada href del índice apunta a un id; HTML en el texto no se inyecta; el centinela de `updatedAt` nunca aparece; las dos rutas usan `pickLegalSource` y no `extractLegalRichTexts` ni `updatedAt`, y `generateMetadata` no toca el global.

## Deviations from Plan

- **Terms editada junto con privacy.** Apliqué el cambio a las dos rutas antes del primer commit porque el helper y la autoprueba cubren ambas claves; los commits quedan separados por tarea (privacy y base en el primero, terms en el segundo).
- **`legalEffective` vive en `legal-source.ts`.** El plan pedía solo `pickLegalSource`; el formateo UTC y la validación de fecha se extrajeron ahí para compartirlos entre las dos rutas y probarlos sin red.
- Sin otras desviaciones. Sin stubs. Sin superficie de amenaza nueva (no hay endpoints ni cambios de acceso).

## Known Stubs

Ninguno. La fecha ausente es el comportamiento especificado, no un stub.

## Para Juan

1. Este plan no se puede empujar solo: el código ya lee `legal-pages`, pero la tabla no existe hasta que se aplique la migración del plan 56-12. Mientras la tabla no exista, `getCachedLegalPages` devuelve todo null (registra `legal-pages: lectura fallida...` en la salida de errores) y las rutas muestran el doc `pages` de siempre, así que el orden de despliegue no rompe nada.
2. La fecha efectiva se escribe una sola vez en el global el día del corte (campo `effectiveDate`, solo día). Hasta entonces el texto nuevo, si ya está cargado, se muestra sin fecha.
3. En el chequeo de paridad de SEO de 56-12 (`55-seo-parity`) conviene confirmar que title y meta de privacy y terms siguen igual a producción.

## Self-Check: PASSED

- FOUND: src/lib/legal-source.ts, scripts/verify/56-legal-ssr.ts
- FOUND commits: 8c0d451, 1ed58f5
