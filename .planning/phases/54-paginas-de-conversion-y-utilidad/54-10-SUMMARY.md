---
phase: 54-paginas-de-conversion-y-utilidad
plan: 10
subsystem: ui
tags: [mui, lexical, rich-text, toc, legal, privacy, terms, ssr-selftest, a11y, seo]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 05 (PageHero compact, Crumbs), plan 06 (MuiRichText, Toc, lexical-toc) y plan 07 (messages legal)
provides:
  - LegalView, Server Component compartido por /privacy y /terms, con extractLegalRichTexts y combineRichTexts como exports auxiliares
  - Las rutas privacy y terms reescritas sobre getCachedPageBySlug, con generateMetadata, ISR y canonical intactos
  - 54-legal-ssr.ts, autoprueba contra los docs reales de privacy y terms en es y en
affects: [54-14, 54-16, 56]

plan_head_before: f5f6315a211691777037b84daa042772a939f98f
actuals:
  tokens: 5300
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Los rich text de todas las columnas se combinan en una raiz sintetica antes de extraer el indice y de renderizar: el deduplicado de ids es global y el indice coincide con el texto"
    - "La extraccion de rich text de los bloques content vive en LegalView.tsx y las dos rutas la comparten"

key-files:
  created:
    - src/components/pages/LegalView.tsx
    - scripts/verify/54-legal-ssr.ts
  modified:
    - src/app/(frontend)/[locale]/privacy/page.tsx
    - src/app/(frontend)/[locale]/terms/page.tsx

key-decisions:
  - "El cuerpo de LegalView es un Box sin landmark propio (el sandbox usaba section con aria-label): el hero ya es una region con el h1 y asi no hay dos regiones con el mismo nombre"
  - "getPage de las dos rutas pasa a llamar getCachedPageBySlug (con overrideAccess false). Antes usaban payload.find con acceso abierto, asi que un borrador legal ya no se serviria a anonimos; generateMetadata no cambia de forma"
  - "Las migas usan common.breadcrumbHome con href '/' y linkFor resuelve el prefijo de idioma"

patterns-established:
  - "Plan 56 puede agregar la fecha legal en LegalView sin tocar las rutas"

requirements-completed: []

duration: 25min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 10: Privacy y Terms con indice de anclas Summary

**LegalView con PageHero compact, texto de Payload sin modificar en MuiRichText e indice lateral sticky (acordeon bajo lg) cuyos href coinciden uno a uno con los id de los h2 y h3, probado contra los cuatro docs reales de produccion.**

## Performance

- **Duration:** unos 25 min
- **Completed:** 2026-11-08
- **Tasks:** 2 de 2
- **Files:** 2 creados, 2 modificados

## Accomplishments

- `LegalView` concatena los `children` de cada rich text de columna en una raiz sintetica; `extractHeadings` y `MuiRichText` leen esa misma raiz. Con 2 o mas encabezados muestra el `Toc` (primero en el DOM, columna 2 solo desde lg); con menos, el texto ocupa solo el ancho de prosa de 760px.
- Hero: `PageHero compact` con migas Inicio y titulo, eyebrow "Legal" y un h1 con el titulo del doc. Sin lead y sin linea de fecha (no se usa la fecha de modificacion del doc; queda para la fase 56).
- `privacy/page.tsx` y `terms/page.tsx` conservan `generateMetadata`, `revalidate = 60` y `generateStaticParams`; no emiten JSON-LD, igual que antes (SEO-01).
- Docs reales: privacy (8 encabezados h2, 16 nodos) y terms (5 h2, 10 nodos), en es y en.

## Task Commits

1. **Task 1 (tracer): Privacy con indice, probada contra el doc real** - `9ec84cb` (feat)
2. **Task 2: Terms y verificacion de ambos documentos en es y en** - `61e313d` (feat)

La rama NO se empujo (regla de la fase).

## Verificacion

- `tsx scripts/verify/54-legal-ssr.ts`: 62 PASS, 0 FAIL, salida 0. Cubre por cada doc y locale: un h1, cada id una vez, ningun id repetido en la pagina, href del indice igual al conjunto de ids, texto de cada encabezado, parrafo y item (60 caracteres) presente, sin main, sin fecha, dos navs con nombres distintos (migas e indice), indice antes que el texto y eyebrow. Casos sinteticos: un solo h2 sin indice, dos columnas con deduplicado global, HTML del CMS escapado (T-54-40) y doc vacio.
- Comprobacion manual de que la autoprueba mira HTML real: terms es renderiza 45 KB con h1, acordeon h2 movil, nav "En este documento" y cinco h2 con id.
- `npx tsc --noEmit`: salida 0.
- `npm run build` con las variables del plan: salida 0, `/[locale]/privacy` y `/[locale]/terms` compiladas.
- Greps de aceptacion: `generateMetadata` y `getCachedPageBySlug` presentes en las dos rutas; LegalView sin `main`, sin `updatedAt` y sin directiva de cliente.
- No se corrio ningun script de escritura ni migracion, no se leyo `.env` y no se empujo nada. Privacy y Terms no leen `home_page*` ni `about_page*`, asi que la verificacion A7 (logs del preview) no aplica a este plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Ajuste] La autoprueba completa se escribio en la tarea 1**
- La tarea 2 pedia extender `54-legal-ssr.ts` a terms, a en y a la comprobacion de navs. Al escribir el script se armo ya con el bucle completo (privacy y terms, es y en, navs, orden), asi que la tarea 2 solo agrego la ruta de terms. No cambia el resultado.

**2. [Ajuste] Comentarios de LegalView sin las cadenas que los greps prohiben**
- Los greps de aceptacion (`! grep "use client"` y `! grep "updatedAt"`) coincidian con los comentarios del archivo. Se reescribieron sin esas cadenas.

**3. [Cambio de comportamiento] getPage usa la capa cacheada**
- El plan pide `getCachedPageBySlug`; las rutas leian con `payload.find` sin `overrideAccess: false`. La capa cacheada filtra borradores. El doc real es publico y la salida de `generateMetadata` es la misma.

**Total:** ninguna desviacion de contenido ni de contrato. UI-SPEC y el contrato de SEO no cambian.

## Interpretaciones a revisar

- El h2 del acordeon movil del indice agrega un h2 con el texto "En este documento" antes del primer h2 del texto (UI-SPEC lo pide asi). Cuenta como encabezado propio sin signos de puntuacion.
- Los h2 numerados de Payload ("1. Informacion que Recopilamos") llevan punto: excepcion conocida a la regla de encabezados que cierra la fase 56.

## Lo que la autoprueba no puede probar

- El IntersectionObserver del `Toc`, el sticky desde lg, el cambio entre acordeon y columna a 1024px y el foco no oculto por el header quedan para el preview en 54-16.
- El resultado de `getCachedPageBySlug` contra la base del preview: la autoprueba lee la API publica de produccion, no el preview.

## Authentication Gates

Ninguno.

## Known Stubs

Ninguno. La linea de ultima actualizacion no se renderiza por decision de UI-SPEC (sin dato), no es un stub.

## Threat Flags

Ninguno nuevo. T-54-40 (sin HTML en crudo, ids por slugify), T-54-41 (sin fecha) y T-54-42 (texto integro comprobado) quedan mitigados.

## Next Phase Readiness

- Los requisitos PAG-09 y los demas siguen abiertos hasta que la fase los verifique.
- 54-14 o 54-16 hacen el empuje y la verificacion en el preview de `/privacy` y `/terms` en es y en.

## Self-Check: PASSED
