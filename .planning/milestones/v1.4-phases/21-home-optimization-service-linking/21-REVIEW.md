---
phase: 21-home-optimization-service-linking
reviewed: 2026-07-12T21:54:54Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - scripts/seed-phase21-home-optimization.ts
  - scripts/fix-phase21-services-nav-label-en.ts
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-07-12T21:54:54Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Se revisaron los dos scripts de la fase 21: `scripts/seed-phase21-home-optimization.ts` (reescritura de copy de `aboutSection` en Home + nav link "Servicios"/"Services") y `scripts/fix-phase21-services-nav-label-en.ts` (fix puntual no destructivo). Verificación en vivo contra `localhost:3000` confirma que ambos locales muestran el label correcto (`Servicios` en ES, `Services` en EN) apuntando a `/services`, que ningún otro item del nav (Blog, Case Studies, Authors, Contact) fue alterado, y que el copy de `aboutSection` refuerza correctamente el diferenciador Next.js/Payload/SEO en ambos idiomas. `npx tsc --noEmit` sale limpio (exit 0). `payload.config.ts` no fue tocado en ningún commit del rango (confirmado vía `git show --stat` de `131d6ad` y `b3bd896`), respetando la coordinación con el trabajo paralelo de `@payloadcms/plugin-mcp`.

El fix aplicado en `addServicesNavLink` (filtrar `existingEn` por `item.id !== newItemId` antes de re-appendear) es correcto y resuelve la causa raíz documentada. No se detectó un bug simétrico del lado ES: el guard de idempotencia (`alreadyExists`) hace que el script entero salga temprano (`return`) en cualquier re-run posterior a la primera escritura ES exitosa, así que el path de escritura ES nunca vuelve a ejecutarse contra un array que ya contenga el item — el riesgo de colisión de id solo existía en la primera corrida, en el paso ES→EN, que es exactamente el que ya se corrigió. Sin embargo, ese mismo guard introduce un problema de diseño más sutil (ver WR-01): al basarse solo en la existencia del `url`, no en la corrección del `label`, deja al script principal incapaz de auto-sanarse si el label EN se corrompe de nuevo — que es precisamente por lo que hizo falta un script de fix aparte en vez de simplemente re-correr el seed.

El spread `[...layout]` + reemplazo por índice en `updateAboutSectionCopy` es correcto: es un shallow copy del array de blocks con reemplazo puntual del índice de `aboutSection`; todos los demás bloques (Hero, FAQ, contactFormBlock, featuredPosts, etc.) se pasan sin modificar por referencia. Confirmado además que el campo `content` en el schema de `Pages` (`src/collections/Pages/index.ts`) solo contiene `layout` como subcampo, así que `data: { content: { layout } }` no corre riesgo de pisar campos hermanos inexistentes.

## Warnings

### WR-01: El guard de idempotencia de `addServicesNavLink` no verifica corrección del label EN, solo existencia del `url`

**File:** `scripts/seed-phase21-home-optimization.ts:117-121`
**Issue:** `alreadyExists` se calcula únicamente sobre `existingEs.some((item) => item.link?.url === NAV_SERVICES_URL)`. Si el item ya existe pero con un label incorrecto en cualquier locale (exactamente el escenario que ya ocurrió: EN quedó con "Servicios" tras la primera corrida), el guard igual devuelve `true` y el script sale (`return`) sin tocar nada — ni siquiera corre la actualización de `aboutSection`, ya que `addServicesNavLink` retorna antes de que `main()` continúe, pero como está después de `updateAboutSectionCopy` en el orden de `main()`, el copy sí se actualiza igual; el punto es que el nav nunca se autocorrige. Esto obliga, cada vez que se detecte un label mal escrito, a escribir un script de fix ad-hoc nuevo (como ya pasó con `fix-phase21-services-nav-label-en.ts`) en lugar de simplemente re-correr el seed idempotente. El propio script de fix es la prueba viviente de esta limitación de diseño.
**Fix:** Ampliar el guard para verificar también el label esperado por locale, o separar "verificar existencia" de "verificar corrección" y aplicar solo la reparación de label cuando haga falta, por ejemplo:
```ts
const existingItem = existingEs.some((item) => item.link?.url === NAV_SERVICES_URL)
  ? existingEs.find((item) => item.link?.url === NAV_SERVICES_URL)
  : undefined

if (existingItem) {
  console.log('Services nav item already exists — checking label correctness per locale instead of skipping entirely.')
  // reconciliar label ES/EN contra navLabelByLocale por separado, sin volver a appendear
  return
}
```
No es bloqueante para esta corrida puntual (ya verificada en producción), pero vale la pena resolverlo si el nav se va a seguir tocando en fases futuras, para que el propio seed sea la única fuente de verdad y no dependa de scripts de fix desechables.

## Info

### IN-01: Uso de `as never` para evitar el type-checking en los payloads de `update`/`updateGlobal`

**File:** `scripts/seed-phase21-home-optimization.ts:107,128,154`
**Issue:** `content: { layout: layout as never }` y `data: { navItems: navItemsEs/navItemsEn as never }` desactivan por completo la verificación de tipos de TypeScript en el payload enviado a Payload. Un error de forma (por ejemplo, un campo con nombre incorrecto en `NavItem` o en el objeto de bloque) no sería detectado por `tsc --noEmit`, solo se vería en runtime contra la DB real. Es un patrón ya preexistente en el repo (`seed-phase19-service-pages.ts`, `seed-phase20-geo-pages.ts` lo usan igual), así que no es un defecto introducido por esta fase, pero conviene señalarlo como deuda técnica acumulada.
**Fix:** Si se retoca este patrón en una fase futura, considerar tipar explícitamente el shape esperado (`Partial<Page['content']>`, `Partial<Header>`) en vez de `as never`, o al menos `as unknown as X` con un tipo concreto para no perder cobertura de tipos.

### IN-02: Rama defensiva sin cobertura real en `updateAboutSectionCopy` para `paragraphs` vacío

**File:** `scripts/seed-phase21-home-optimization.ts:89-91`
**Issue:** `paragraphs.length ? [...] : [{ text: aboutParagraphCopy[locale] }]` construye un paragraph sin `id` si el array llegara vacío. Dado que `AboutSection.paragraphs` tiene `minRows: 1` en `src/blocks/AboutSection/config.ts:49`, este branch es efectivamente inalcanzable con datos válidos — es código defensivo que nunca se ejercita, y de ejercitarse alguna vez perdería el `id` original (rompiendo el patrón de reutilización de ids documentado en el propio D-06 del plan). No afecta el resultado observado en esta corrida (paragraphs nunca estuvo vacío), es solo una nota de mantenibilidad.
**Fix:** Opcional — se puede dejar como está dado que el schema garantiza `minRows: 1`, o remover el branch y lanzar un error explícito si `paragraphs.length === 0` para hacer fallar rápido ante datos corruptos en lugar de generar un paragraph sin id silenciosamente.

---

_Reviewed: 2026-07-12T21:54:54Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
