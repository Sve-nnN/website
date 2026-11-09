---
phase: 55-casos-websites-blog-y-autores
plan: 04
subsystem: cache
tags: [payload, hooks, unstable_cache, revalidateTag, cache-tags, websites, authors, speaking-events]
requires:
  - phase: 55-01
    provides: CACHE_TAGS.websites() y getCachedWebsitesIndex
provides:
  - CACHE_TAGS.authors() y CACHE_TAGS.speakingEvents()
  - hooks afterChange y afterDelete de Websites, Authors y SpeakingEvents (las seis colecciones de la fase quedan con hook)
  - lecturas cacheadas de autores y eventos con tags
  - 55-cache-tags.ts, verificación estática de hooks y tags
  - IN-07 aplicado (límite 0 y locale en testimonios de servicios)
affects: [55-08, 55-10, 55-12]
tech-stack:
  added: []
  patterns:
    - "cache-tags.ts solo con import type de payload; las colecciones importan los hooks"
    - "Verificación estática con fixtures defectuosos y escáner que ignora comentarios y literales de regex"
key-files:
  created:
    - scripts/verify/55-cache-tags.ts
  modified:
    - src/lib/cache-tags.ts
    - src/collections/Websites/index.ts
    - src/collections/Authors/index.ts
    - src/collections/SpeakingEvents/index.ts
    - src/lib/person.ts
    - src/lib/cta-data.ts
    - src/lib/about-data.ts
    - src/lib/service-view-data.ts
    - src/components/pages/ServiceDetailPage.tsx
key-decisions:
  - "No hay tag por slug para Websites: el detalle comparte websites:all (55-08 usa CACHE_TAGS.websites())"
  - "Authors también invalida posts:all porque la firma de autor aparece en los posts"
  - "about-counts (cuenta de clientes) queda sin tag a propósito, en lista de excepciones del verificador"
  - "getServiceTestimonials recibe locale como parámetro obligatorio y el único llamador lo pasa"
requirements-completed: []
duration: 20min
completed: 2026-11-09
status: complete
commits: 3
plan_head_before: 34830a26ed8d4c939551abaa1e5003a5cbe1ff36
actuals:
  tokens: 14000
  tasks: 3
  commits: 3
---

# Phase 55 Plan 04: Hooks y tags de caché (IN-05) e IN-07 Summary

Websites, Authors y SpeakingEvents ganan hooks afterChange y afterDelete que invalidan sus tags, las lecturas cacheadas de autores y eventos llevan esos tags, y 55-cache-tags.ts verifica todo de forma estática sobre las seis colecciones de la fase.

Nota sobre `commits`: el campo mide los tres commits de este plan. `git rev-list 34830a2..HEAD` da 7 porque 55-03 y 55-05 corrieron en paralelo en el mismo checkout y commitearon en ese intervalo.

## Qué quedó hecho

- **Tarea 1 (tracer), commit da780c7:** `revalidateWebsitesCache` y `revalidateWebsitesCacheOnDelete` en `cache-tags.ts` (tag de colección más `revalidatePath('/', 'layout')`), cableados en `Websites/index.ts` sin tocar campos. Se creó `55-cache-tags.ts` con `--only <coleccion>` y fixtures defectuosos. El literal `'websites:all'` ya no existía en `cache.ts` (55-01 había movido `getCachedArchive` a `CACHE_TAGS.websites()`), así que ese punto del plan no requirió cambio.
- **Tarea 2, commit 71f2cc9:** hooks de Authors y SpeakingEvents cableados sin tocar campos ni access; tags en `getCachedSitePerson`, `getCachedCtaAuthor` y las cachés `about-author` y `about-events`, conservando clave, TTL y forma de retorno. `CACHE_TAGS.authors()`, `CACHE_TAGS.speakingEvents()` y los cuatro hooks nuevos ya habían entrado en `cache-tags.ts` dentro del commit de la tarea 1 (se escribieron juntos en el mismo archivo).
- **Tarea 3, commit d6358ee:** `limit && limit > 0 ? limit : 8` y `locale` en el `find` de testimonios (IN-07).

## Resultados de verificación

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` (tras cada tarea) | PASS |
| `55-cache-tags.ts --only websites` | PASS |
| `55-cache-tags.ts` completo (11 fixtures, seis colecciones, literales, `unstable_cache`, sin import de payload en runtime) | PASS, exit 0 |
| `54-about-ssr.ts` | PASS (0 FAIL) |
| `54-service-ssr.ts` y `54-conversion-ssr.ts` | PASS (0 FAIL) |
| Aceptación por grep (hooks cableados, `CACHE_TAGS.authors()` en person.ts, `CACHE_TAGS.speakingEvents()` en about-data.ts, sin `limit ?? 8`, `limit > 0` presente) | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Firma de `getServiceTestimonials` y su llamador**
- **Found during:** Tarea 3
- **Issue:** pasar `locale` a `find` exige que la función lo reciba; el plan solo lista `service-view-data.ts` en `files`.
- **Fix:** `locale: Locale` como segundo parámetro obligatorio (no opcional, para que un llamador nuevo no vuelva a leer EN por defecto) y una edición de una línea en `ServiceDetailPage.tsx`, el único llamador (`grep` confirmó que no hay otro).
- **Files modified:** src/lib/service-view-data.ts, src/components/pages/ServiceDetailPage.tsx
- **Commit:** d6358ee

**2. [Rule 1 - Bug] Falsos positivos del escáner de `55-cache-tags.ts`**
- **Found during:** Tarea 1 y 2 (ejecución de la propia verificación)
- **Issue:** (a) un literal de regex `/'/g` en `sitemap-data.ts` abría una cadena falsa y dejaba un comentario a la vista; (b) la regex de imports cruzaba imports consecutivos en estilo sin punto y coma; (c) la clave de `about-counts` se leía como `'seo'`.
- **Fix:** el quitador de comentarios salta literales de regex, la regex de imports usa `[^'"]*?`, la clave se toma del arreglo seguido del objeto de opciones.
- **Files modified:** scripts/verify/55-cache-tags.ts (antes del commit de cada tarea)

### Decisiones sobre el plan

- **`about-counts` sin tag.** El plan pide que cada `unstable_cache` de los archivos listados lleve `tags`, pero `getCachedAboutCounts` cuenta `clientes`, una colección que la fase no toca y que no tiene tag ni hook. Crear `CACHE_TAGS.clientes` más un hook en Clientes sale del alcance. Queda en `UNTAGGED_ALLOWED` del verificador con la razón anotada; se actualiza por el TTL de 60 s.
- **Sin tag por slug de Websites.** El plan dice "el tag por slug si existe"; no existe y 55-08 planea usar `CACHE_TAGS.websites()` para el detalle, así que no se inventó.

## Límite documentado (T-55-15)

Los hooks corren en el proceso que ejecuta el admin (producción, master). El preview recibe cambios solo por el TTL de 60 s de `unstable_cache` más la ventana ISR de 60 s. IN-05 se cierra aquí solo de forma estática; la revalidación en vivo queda en la compuerta humana de la fase 57. Está comentado en `cache-tags.ts` junto al bloque de Websites.

## Elementos para la revisión humana de Juan

1. En la compuerta de la fase 57, publicar un cambio en un Website, un Author y un SpeakingEvent desde el admin de producción y comprobar que la página pública se actualiza sin esperar el TTL.
2. El comentario de `src/lib/sitemap-data.ts` (líneas 118 a 129) sigue diciendo que Authors y Websites "have no cache-tag hooks at all". Ahora es falso. No se tocó por estar fuera de los archivos del plan; conviene decidir si el sitemap suma `CACHE_TAGS.websites()` y `CACHE_TAGS.authors()` a sus tags y corregir el comentario.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-55-13: las lecturas conservan `overrideAccess: false` y los hooks solo invalidan. T-55-14: `cache-tags.ts` solo usa `import type` de payload y el verificador lo comprueba. T-55-15 aceptado y documentado en el código.

## Self-Check: PASSED

Archivos modificados y creados presentes; commits da780c7, 71f2cc9 y d6358ee presentes en `git log`.
