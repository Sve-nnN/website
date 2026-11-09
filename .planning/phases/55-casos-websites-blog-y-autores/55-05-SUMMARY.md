---
phase: 55-casos-websites-blog-y-autores
plan: 05
subsystem: ui
tags: [richtext, lexical, mui, a11y, toc, email-capture, ssr-test]
requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: MuiRichText, lexical-toc, UL y OL, Section, arnés SSR 54
  - phase: 55-casos-websites-blog-y-autores
    provides: nota de 55-01 sobre filename en populate de media (no aplica a este plan, no lee media)
provides:
  - MuiRichText con enlaces del propio sitio en la misma pestaña, prop headingIds y prop ctx
  - lexical-toc con h1 como nivel 2, niveles por defecto [1, 2, 3] y RESERVED_IDS
  - UL y OL con role list por defecto (IN-08) y Section con labelledBy opcional (IN-09)
  - 55-richtext-ssr.ts, prueba SSR del motor con fixtures inventados y fixtures defectuosos
affects: [55-10 (post con TOC y cuerpo partido), 55-06, 55-08, Privacy, Terms]
tech-stack:
  added: []
  patterns:
    - "Un solo mapa de ids por referencia de nodo calculado sobre el cuerpo completo y compartido por las dos mitades del cuerpo partido"
    - "Componentes asíncronos de servidor se prueban llamándolos directamente y renderizando el árbol que devuelven; next-intl/server se sustituye con Module.registerHooks"
key-files:
  created:
    - scripts/verify/55-richtext-ssr.ts
    - scripts/verify/55-stub-next-intl-server.cjs
  modified:
    - src/components/mui/rich-text/MuiRichText.tsx
    - src/components/mui/rich-text/lexical-toc.ts
    - src/components/mui/lists.tsx
    - src/components/mui/Section.tsx
    - src/components/home/Services.tsx
    - src/components/home/About.tsx
    - src/components/home/AuditorHighlightCard.tsx
    - scripts/verify/54-richtext-toc.ts
key-decisions:
  - "Los niveles por defecto de extractHeadings y buildHeadingIdMap pasan a [1, 2, 3]; el filtro mira la etiqueta real y el h1 se reporta como nivel 2. Un llamador con niveles explícitos (ServiceProblem usa [2]) no ve el h1"
  - "Los enlaces absolutos a juan-tech.com y www.juan-tech.com se mantienen idénticos a producción (misma pestaña, href intacto); en el preview llevan a producción (pregunta abierta 3 de RESEARCH, sin reescritura de origen)"
  - "El id reservado se resuelve como un duplicado (contacto pasa a contacto-2)"
requirements-completed: []
duration: 40min
completed: 2026-11-09
status: complete
commits: 3
plan_head_before: 71d92b0e30563684a60189fd10f26ec7d41c6448
actuals:
  tokens: 5600
  tasks: 3
  commits: 3
---

# Phase 55 Plan 05: Motor de prosa compartido Summary

Motor de prosa corregido para los 58 posts: enlaces al propio sitio en la misma pestaña, ids de encabezado únicos sobre el cuerpo completo con h1 como nivel 2 e ids reservados, convertidor de captura de email vía ctx, y role list y labelledBy en las primitivas.

## Qué quedó hecho

- **Tarea 1 (tracer), commit cf6d82d:** `renderLink` clasifica por hostname exacto contra `{juan-tech.com, www.juan-tech.com}` (T-55-17). Un enlace del sitio sale como `Link` de MUI sin target, sin rel y sin sufijo, con el href de producción. El externo y `fields.newTab` conservan `target="_blank"`, `rel` y el sufijo accesible. El href `javascript:` sigue quedando como texto (T-55-16).
- **Tarea 2, commit 46e7b12:** `lexical-toc.ts` con `DEFAULT_LEVELS = [1, 2, 3]`, h1 como nivel 2 y `RESERVED_IDS`. `MuiRichText` acepta `headingIds` (mapa por referencia) y `ctx`, y con `ctx` compone sobre `buildRichTextConverters`. Un h1 con id se renderiza h2 con id. No se importa `RichTextRenderer`, `AffiliateDisclosure` ni el FAQ viejo (T-55-18).
- **Tarea 3, commit 3b18809:** `UL` y `OL` con `role="list"` antes de `{...rest}` (se puede sobrescribir). `Section` con `labelledBy` y sin `aria-labelledby` cuando no hay `title` ni `labelledBy`. Services, About y AuditorHighlightCard pasan `labelledBy` (`servicios-t`, `sobre-t`, `auditor-t`). Solo esos tres llamadores usaban `Section` sin `title`.

## Resultados de verificación

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | PASS (tras cada tarea) |
| `55-richtext-ssr.ts` | PASS, 28 comprobaciones, incluidos 2 fixtures defectuosos que fallan |
| `54-richtext-toc.ts` | PASS (con una expectativa actualizada, ver desviaciones) |
| `54-legal-ssr.ts`, `54-primitives-ssr.ts`, `54-home-ssr.ts`, `54-home-b-ssr.ts` | PASS |
| `54-index-ssr`, `54-service-ssr`, `54-stack-ssr`, `54-local-ssr`, `54-search-ssr`, `54-contact-ssr`, `54-about-ssr`, `54-conversion-ssr` | PASS (sin FAIL; usan las primitivas y lexical-toc) |
| `54-rsc-boundary.mjs` | PASS |
| Criterios de aceptación por grep (regla vieja ausente, RESERVED_IDS, headingIds, buildRichTextConverters, sin RichTextRenderer ni AffiliateDisclosure, role list, labelledBy en los 4 archivos) | PASS |

Lo que cubre `55-richtext-ssr.ts`: enlace a `juan-tech.com` y a `www.juan-tech.com` sin target ni rel; externo con target, rel y sufijo; `javascript:` sin enlace; `juan-tech.com.evil.com` tratado como externo; `fields.newTab` abre pestaña nueva; h1 en el TOC como nivel 2 con id y renderizado h2; duplicados con `-2` y `-3`; "Contacto" no usa el id reservado; cuerpo partido con `splitContentForOffer` y el mismo `headingIds` sin ids repetidos; el mismo cuerpo partido sin `headingIds` falla (fixture defectuoso); bloque `email-capture` con `ctx` produce `name="email"`, `name="company_website"` y los ocultos `postPath` y `locale`; sin `ctx` el bloque no se pinta y Payload avisa "no converter".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Expectativa de la fase 54 contradecía el cambio pedido por el plan**
- **Found during:** Tarea 2
- **Issue:** `54-richtext-toc.ts` afirmaba "h1 y h4 no entran al índice". El plan exige que el h1 del cuerpo entre al TOC y reciba id, así que esa aserción pasaba a FAIL y el verify de la tarea 2 exige que el script siga en PASS.
- **Fix:** la aserción ahora dice "h1 entra al índice (55-05) y h4 no" y espera `["titulo","seccion"]`. Es el cambio de comportamiento pedido, no una relajación de la prueba.
- **Files modified:** scripts/verify/54-richtext-toc.ts
- **Commit:** 46e7b12

**2. [Rule 3 - Blocking] El bloque email-capture no se podía renderizar en el arnés SSR**
- **Found during:** Tarea 2
- **Issue:** `EmailCaptureCard` es un Server Component asíncrono que llama a `getLocale` de `next-intl/server`; fuera de Next ese módulo resuelve a un stub que lanza, y `renderToString` no resuelve componentes asíncronos.
- **Fix:** `55-stub-next-intl-server.cjs` sustituye ese especificador con `Module.registerHooks` (getLocale devuelve `es`, getTranslations devuelve la clave) y la prueba llama al componente directamente y renderiza el árbol que devuelve. Para la ruta por `MuiRichText` con `ctx`, la prueba comprueba que el render llega al componente asíncrono (renderToString suspende) y que Payload no registra "no converter".
- **Files modified:** scripts/verify/55-stub-next-intl-server.cjs (nuevo), scripts/verify/55-richtext-ssr.ts
- **Commit:** 46e7b12

### Decisiones dentro del margen del plan

- Los niveles por defecto cambian a `[1, 2, 3]` (no solo se "aceptan"). Así el TOC de Privacy y Terms (`LegalView`, que usa los valores por defecto) y `MuiRichText` siguen sacando los ids de la misma función. Los llamadores con niveles explícitos (`ServiceProblem` usa `[2]`) conservan su comportamiento porque el filtro mira la etiqueta real.
- Conteo de commits: el checkout es compartido con otros ejecutores, así que `git rev-list plan_head_before..HEAD` incluye commits de 55-03 y 55-04. Los commits propios son 3 (`git log --grep "(55-05)"`).

## Elementos para la revisión humana de Juan

1. En el preview (`dev.juan-tech.com`), los enlaces absolutos a `https://juan-tech.com/...` dentro de un cuerpo de post llevan a producción, no a `dev.juan-tech.com`. Es lo que pide la regla de paridad (producción los sirve así, 204 enlaces ES y 120 EN). Si prefiere que en el preview sean relativos, es una reescritura de origen condicionada a `isPreviewReadonly()` y se decide en 55-10.
2. Los 12 posts ES y 10 EN con h1 en el cuerpo van a mostrar ese h1 como entrada del TOC y como h2 con ancla, igual que el TOC por DOM de producción.
3. Esta entrega no toca ninguna página nueva: no hay nada que mirar en el preview hasta que 55-10 use el motor.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-55-16 (href `javascript:`), T-55-17 (subdominio falso) y T-55-18 (importación circular) mitigados y cubiertos por la prueba SSR o por `tsc`.

## Self-Check: PASSED

Archivos `55-richtext-ssr.ts`, `55-stub-next-intl-server.cjs` y los 8 modificados existen; commits cf6d82d, 46e7b12 y 3b18809 verificados con `git log`.
