---
phase: 54-paginas-de-conversion-y-utilidad
plan: 05
subsystem: ui
tags: [mui, primitives, ssr-selftest, accordion, a11y, theme]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 01 (GrainBlob, lists, links), plan 02 (shadow-icons) y plan 03 (messages y arnes de render)
provides:
  - Crumbs, PageHero y Section portados del sandbox con los cambios obligatorios de UI-SPEC
  - IconTile, TechChips, ScoreRing, TranslationNotice y FaqAccordion
  - 54-primitives-ssr.ts, autoprueba de 27 casos con el tema y los mensajes reales
  - tema en dos pesos (400 y 600)
affects: [54-06, 54-08, 54-09, 54-10, 54-11, 54-12, 54-13, 54-14, 54-15, 54-16, 55]

plan_head_before: 41794d471374951bf940b8f5d11c30c75efae39a
actuals:
  tokens: 6600
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Primitivas sin texto propio: nombres accesibles desde messages y etiquetas por props"
    - "Enlace de migas con linkFor; enlace al idioma contrario con next/link plano"
    - "Autoprueba de primitivas con renderToHtml y React global (tsx con jsx preserve)"

key-files:
  created:
    - scripts/verify/54-primitives-ssr.ts
    - src/components/mui/Crumbs.tsx
    - src/components/mui/PageHero.tsx
    - src/components/mui/Section.tsx
    - src/components/mui/IconTile.tsx
    - src/components/mui/TechChips.tsx
    - src/components/mui/ScoreRing.tsx
    - src/components/mui/TranslationNotice.tsx
    - src/components/mui/FaqAccordion.tsx
  modified:
    - src/theme/theme.ts

key-decisions:
  - "TranslationNotice usa next/link plano para el enlace Ver en español: con el Link de next-intl, en una página EN, el href de la versión en español recibe el prefijo /en y apunta a la misma página"
  - "IconTile e Icon aceptan name como string y devuelven null ante un nombre fuera de shadow-icons (valor viejo de un select)"
  - "TechChips exige la etiqueta por prop (sin valor por defecto en español dentro del componente)"
  - "FaqAccordion acepta defaultOpen false para dejar todos los paneles cerrados"

patterns-established:
  - "Un componente de la fase no declara main ni importa de @/components/ui"
  - "ScoreRing recibe srSuffix desde messages (home.* de 100) y se omite con null"

requirements-completed: []

duration: 15min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 05: Primitivas de layout compartidas Summary

**Crumbs, PageHero, Section, IconTile, TechChips, ScoreRing, TranslationNotice y FaqAccordion portados del sandbox, probados con render de servidor (tema, next-intl y mensajes reales) y con el tema en dos pesos.**

## Performance

- **Duration:** unos 15 min
- **Completed:** 2026-11-08
- **Tasks:** 3 de 3
- **Files:** 9 creados, 1 modificado

## Accomplishments

- `PageHero` emite exactamente un h1 (`#page-title`, resuelto por `aria-labelledby`), migas con el nombre accesible de `common.breadcrumbsLabel` (ES y EN) y la última miga con `aria-current="page"`. Lead de 20/30, paddings pt 128 y 160, pb 48 y 80.
- `Section` con lead de 20/30 (el sandbox usaba 18/28) y `aria-labelledby` al id `${id}-t`.
- `FaqAccordion` mantiene en el HTML servido el texto de los paneles cerrados (supuesto A6 confirmado por la autoprueba), con ids y `aria-controls` explícitos, h3 por defecto (h2 con `headingLevel`), un panel abierto a la vez y el icono Plus que rota 45 grados.
- `ScoreRing` no produce marcado con `null`; la leyenda mide 12px; el sufijo accesible llega por `srSuffix`.
- `IconTile` resuelve los 11 nombres de `shadow-icons` y devuelve null ante uno desconocido.
- `TranslationNotice` con `role="note"`, texto en `lang="en"` y enlace con `lang="es"` y `hrefLang="es"`; no toca el idioma del documento.
- `54-primitives-ssr.ts` corre 27 casos en PASS con salida 0. Ninguna primitiva contiene main, listas sueltas, `unmountOnExit` ni importa de `@/components/ui`.

## Task Commits

1. **Task 1 (tracer): PageHero, Crumbs y Section con autoprueba** - `6859386` (feat)
2. **Task 2: IconTile, TechChips, ScoreRing, TranslationNotice y FaqAccordion** - `95cf250` (feat)
3. **Task 3: pesos del tema en 400 y 600** - `5b131a2` (style)

La rama NO se empujó (regla de la fase: solo 54-07 empuja).

## Decisión reversible para Juan

Pesos del tema: `typography.mono` y `MuiChip.root` bajaron de 500 a 400 para dejar el sitio en dos pesos (400 y 600); se revierte con una línea en `src/theme/theme.ts` (UI-SPEC, Decisiones de la spec, punto 9).

## Verificación

- `node_modules/.bin/tsx scripts/verify/54-primitives-ssr.ts`: 27 PASS, salida 0.
- `npx tsc --noEmit`: salida 0.
- `npm run build` (variables de solo build): salida 0.
- `node scripts/verify/53-layer-check.mjs`: OK.
- `grep -c fontWeight src/theme/theme.ts` sigue en 12 (solo cambiaron valores) y no queda `fontWeight: 500`.
- Sin main, sin `component="ul|ol"` fuera de `lists.tsx`, sin `unmountOnExit`, sin `documentElement` en `TranslationNotice`.
- Los dos criterios `backstop` (contraste del nav sobre el blob del PageHero y que el aviso no tape el h1 a 375, 900 y 1280 px) quedan para el preview en 54-16.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsx no define `React` para los componentes .tsx**
- **Found during:** Tarea 1 (primera corrida)
- **Issue:** con `jsx: preserve` tsx usa el runtime clásico y los componentes fallan con `React is not defined` al renderizar.
- **Fix:** la autoprueba asigna `globalThis.React = React` antes de renderizar. Solo afecta al script, no al código de producción.
- **Files modified:** `scripts/verify/54-primitives-ssr.ts`
- **Commit:** `6859386`

**2. [Rule 1 - Bug] El enlace de TranslationNotice recibía el prefijo /en**
- **Found during:** Tarea 2 (autoprueba)
- **Issue:** el plan pedía `Link` de MUI sobre la ruta en español; con `linkFor` (Link de next-intl) en una página EN el href salía `/en/sobre-mi`, o sea la misma página, y el aviso no llevaba a la versión en español.
- **Fix:** el componente usa `next/link` plano y `esHref` es la URL canónica en español (mismo criterio que `LanguageSwitcher` del shell). El caso de la autoprueba lo cubre.
- **Files modified:** `src/components/mui/TranslationNotice.tsx`
- **Commit:** `95cf250`

**3. [Ajuste menor] Expresiones de la autoprueba**
- El nav no empieza con `aria-label` (lleva `class` antes) y el CSS global de Emotion viaja en una etiqueta `style` dentro del HTML; la autoprueba busca por expresión sobre el `nav` y descarta las etiquetas `style` antes de medir salidas vacías o la leyenda de 11px.

**Total:** 2 correcciones automáticas y un ajuste de la autoprueba. Sin impacto en el contrato de UI-SPEC.

## Authentication Gates

Ninguno. No se tocó ninguna base de datos, no se corrió ningún script de escritura (20, 21, 22) ni migración y no se empujó la rama.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-54-17: `Crumbs` y `TranslationNotice` no construyen URLs; los llamadores deben pasar los hrefs por `sanitizeHref` (queda como regla para los planes de vista). T-54-19: ningún componente usa `dangerouslySetInnerHTML`.

## Next Phase Readiness

- Los planes de vista importan de `src/components/mui/` y prueban su estructura con `renderToHtml` del arnés; para componentes .tsx hay que asignar `globalThis.React` como hace `54-primitives-ssr.ts`.
- `TechChips` exige `label`; `ScoreRing` exige `srSuffix`; `TranslationNotice` exige `esHref` en canónico (español sin prefijo).
- Los requisitos PAG-* no se marcan: las páginas todavía no existen.

## Self-Check: PASSED

- Archivos verificados en disco (nueve creados y `src/theme/theme.ts` modificado).
- Commits `6859386`, `95cf250` y `5b131a2` presentes en `git log`; `git rev-list --count` desde `plan_head_before` da 3.
