---
phase: 20-seo-local-geo-pages
reviewed: 2026-07-12T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - scripts/seed-phase20-data/types.ts
  - scripts/seed-phase20-data/copy.ts
  - src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx
  - src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx
  - scripts/seed-phase20-geo-pages.ts
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-07-12
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewé los 5 archivos nuevos de la fase 20 (content module, 2 rutas estáticas, seed script) contra
el patrón ya validado en la fase 19. Verificación específica del bug que causó el incidente real en
fase 19 (`CallToAction.richText` perdiendo `localized: true`): confirmado que el campo **sigue
teniendo `localized: true`** en `src/blocks/CallToAction/config.ts:19`, y el seed script de esta
fase no toca schema ni introduce ninguna migración nueva (verificado contra `git diff --stat` del
rango completo de commits y contra el directorio `src/migrations/` — la última migración sigue
siendo la de fase 19, `20260712_202954_phase19_calltoaction_localized`).

Puntos verificados y correctos:
- No hay doble `<h1>`: el Hero block (`src/blocks/Hero/*.tsx`) es el único que renderiza `<h1>`;
  ambas rutas nuevas omiten `<h1>` y `<Container>` manual (correcto — Hero ya envuelve en su propio
  `<Container>`).
- Contenido de Lima y Madrid es genuinamente distinto, no un city-swap: Lima cita hechos reales
  verificables contra `scripts/seed-author-eeat.ts` (UPC, taller de 4h con Arianna Lupi/DinoRANK/Lm
  Marketing, 18 asistentes — coinciden exactamente); Madrid es honesto sobre trabajo remoto ("no
  tengo oficina física en Madrid" / "I don't have a physical office in Madrid" en ambos locales) y
  no fabrica presencia física.
- No hay precios de Juan filtrados: la única cita de datos de mercado con símbolo `€` es "260
  búsquedas/mes, CPC de €3.22" citando keyword research real, tal como exige la restricción — no
  aparece ningún otro precio o tarifa.
- `npx tsc --noEmit` sale limpio (exit 0).
- `reapplyIds`/`upsertPage` son estructuralmente idénticos al patrón ya aprobado en fase 19 (mismo
  id-reuse por índice/blockType, mismo fallback seguro cuando hay mismatch de blockType).
- `sitemap-data.ts` no necesita cambios: las 2 slugs nuevas caen en la rama genérica de `pages`
  (no están en `SERVICE_SLUGS` ni son `SERVICES_INDEX_SLUG`), generando la URL de un solo segmento
  esperada sin código adicional — confirma la discreción de D-08 del plan.

No encontré hallazgos Critical. Un Warning (gap de proceso, no de código) y dos Info menores abajo.

## Warnings

### WR-01: Falta `20-01-SUMMARY.md` pese a que el plan lo exige como output y el seed ya corrió contra la DB real

**File:** `.planning/phases/20-seo-local-geo-pages/` (directorio)
**Issue:** El plan (`20-01-PLAN.md` líneas 288-290) exige crear `20-01-SUMMARY.md` al terminar,
incluyendo la verificación end-to-end del Task 3 (correr el seed dos veces para chequear
idempotencia, curl-verificar las 4 combinaciones URL×locale, chequear que el CTA difiera por
locale — la misma clase de regresión que causó CR-01 en fase 19). El prompt de este review indica
que el seed "ya corrió contra la DB real... creó los docs id=11 y id=12", pero no existe ningún
artefacto en el repo que registre que la verificación de idempotencia (run #2, sin duplicados) o el
curl-check de las 4 URLs efectivamente se ejecutó y pasó. Sin el SUMMARY no hay evidencia trazable
de que el Task 3 (marcado `gate="blocking"` en el plan) se completó según sus `acceptance_criteria`.
**Fix:** Generar `20-01-SUMMARY.md` documentando explícitamente: (1) resultado del run #2 del seed
(sin duplicados), (2) status HTTP de las 4 URLs, (3) confirmación de que el texto del CTA difiere
entre `es`/`en` en ambas páginas (chequeo directo, no solo inferencia del código fuente).

## Info

### IN-01: `upsertPage`/find de página existente no filtra por `locale`, dependiendo implícitamente del locale por defecto

**File:** `scripts/seed-phase20-geo-pages.ts:181-185`
**Issue:** El `payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1 })`
no pasa `locale`, por lo que Payload usa el locale por defecto (`es`, configurado en
`src/payload.config.ts:74`). Esto funciona hoy porque `slug` no está localizado y `defaultLocale`
es `'es'`, pero es un acoplamiento implícito no documentado en el código (a diferencia del comentario
explicativo que sí existe para el resto de la lógica de id-reuse). Es el mismo patrón ya aceptado en
fase 19, así que no es una regresión de esta fase, pero vale dejarlo anotado porque si algún día
`defaultLocale` cambia, este `find` silenciosamente empieza a fallar en encontrar el doc existente y
generaría un duplicado en vez de actualizar.
**Fix:** Agregar un comentario corto explicando la dependencia implícita en `defaultLocale`, o pasar
`locale: 'es'` explícitamente para que la intención quede en el código en vez de en la config global.

### IN-02: Comentario de cabecera del seed script afirma "Not yet run against the real DB" pese a que el script ya se ejecutó

**File:** `scripts/seed-phase20-geo-pages.ts` (mensaje de commit `36768a7`, no en el archivo en sí)
**Issue:** El mensaje de commit de `36768a7` dice "Not yet run against the real DB — pending explicit
approval per the new Database Safety rule", pero el contexto del review indica que el script sí se
corrió después (con aprobación explícita de Juan, creando docs id=11/12). Esto no es un bug de
código, pero el historial de commits queda desalineado con el estado real del sistema si alguien lo
lee más tarde sin el contexto adicional de esta conversación.
**Fix:** Ninguna acción de código requerida; si se genera el `20-01-SUMMARY.md` (WR-01), incluir ahí
la nota de que el seed se corrió post-commit con aprobación explícita, para que quede trazado en un
artefacto que sí se actualiza (a diferencia del mensaje de commit, que es inmutable).

---

_Reviewed: 2026-07-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
