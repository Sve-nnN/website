---
phase: 54-paginas-de-conversion-y-utilidad
plan: 02
subsystem: database
tags: [payload, globals, postgres-migration, shadow-content, unstable-cache, i18n-fallback]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 01 (404 en el shell, SiteDocument, scripts 54-*)
provides:
  - global home-page (hero, tagline, vitals, services, cases, process, sites, about, testimonials, faq, cta, contact) privado y sin versions
  - global about-page (hero, bio, counters, specialties, experience, education, talks) privado y sin versions
  - getCachedHomePage y getCachedAboutPage con { data, isFallback } y tag propio
  - clientes.onDark y logo opcional por herramienta de toolStack
  - migracion phase54_shadow_content generada, leida y comprobada, sin aplicar
  - guardia 54-migration-additive.mjs con autoprueba
affects: [54-03, 54-04, 54-07, 54-08, 54-09, 54-10, 54-11, 54-12, 54-13, 54-14, 54-15, 54-16]

plan_head_before: f241589693d6e1ea605bb2ad4aebc7f67bf98be0
actuals:
  tokens: 14700
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Contenido sombra aditivo: copy nuevo en globals que master ignora, nunca se reescribe un campo existente"
    - "Fetcher de global con { data, isFallback }: lee EN con fallbackLocale false y relee con respaldo si el centinela esta vacio"
    - "Guardia de migracion con allow-list de tablas y autoprueba de fixtures"

key-files:
  created:
    - src/globals/HomePage/index.ts
    - src/globals/AboutPage/index.ts
    - src/lib/shadow-icons.ts
    - src/migrations/20261108_043335_phase54_shadow_content.ts
    - src/migrations/20261108_043335_phase54_shadow_content.json
    - scripts/verify/54-migration-additive.mjs
  modified:
    - src/lib/cache-tags.ts
    - src/lib/cache.ts
    - src/payload.config.ts
    - src/collections/Clientes/index.ts
    - src/blocks/ToolStack/config.ts
    - src/payload-types.ts
    - src/migrations/index.ts

key-decisions:
  - "Los globals nuevos no declaran access ni versions: GET /api/globals/home-page y about-page responden 403 al publico (T-54-05)"
  - "Los fetchers leen sin overrideAccess:false, misma excepcion documentada que getCachedHeader"
  - "Centinelas del respaldo EN: tagline en home-page y hero.lead en about-page"
  - "Las tablas del bloque toolStack se llaman groups_tools y _groups_v_tools (por dbName 'groups'), no *tool_stack*"

patterns-established:
  - "Un global de copy nuevo se registra en globals de payload.config y NO en el bloque globals del plugin MCP"

requirements-completed: [PAG-01, PAG-06, PAG-07, PAG-08]

duration: 17min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 02: Modelo de datos sombra y migracion aditiva Summary

**Dos globals privados (home-page y about-page), clientes.onDark y logo por herramienta del stack, con fetchers cacheados que detectan el respaldo EN y una migracion aditiva generada, leida y comprobada, sin aplicar.**

## Performance

- **Duration:** unos 17 min
- **Completed:** 2026-11-08
- **Tasks:** 3 de 3
- **Files:** 6 creados, 7 modificados

## Accomplishments

- `home-page` cubre todos los grupos del plan, incluido `contact` (stepsTitle, faqTitle, steps[] e infoRows[]) que cierra el hueco de datos de Contacto de UI-SPEC.
- `about-page` con hero, bio, counters, specialties, experience, education y talks.
- `getCachedHomePage` y `getCachedAboutPage` devuelven `{ data, isFallback }`, con tag propio, TTL de 60 s y hooks `afterChange` que revalidan tag y rutas.
- `src/lib/shadow-icons.ts` es un modulo puro con las tres listas cerradas de iconos y `toSelectOptions`.
- `Clientes` y `ToolStack/config.ts`: `git diff master --numstat` da 13 y 8 lineas agregadas, 0 eliminadas.
- Guardia `54-migration-additive.mjs`: autoprueba con un fixture valido y tres defectuosos (DROP COLUMN, ALTER COLUMN TYPE, ALTER TABLE sobre posts), todos detectados; PASS sobre la migracion real.

## Task Commits

1. **Task 1 (tracer): global home-page con tagline, fetcher cacheado e isFallback** - `386df31` (feat)
2. **Task 2: modelo completo de home-page y about-page con iconos compartidos** - `52a0e6c` (feat)
3. **Task 3: columnas aditivas, migracion y guardia** - `877823c` (feat)

La rama NO se empujo. `git log origin/feat/mui-redesign..HEAD` lista estos tres commits mas el `docs(54-01)` previo.

## SQL de `up` leido por el ejecutor (para la revision de Juan en 54-07)

Migracion: `src/migrations/20261108_043335_phase54_shadow_content.ts`. Solo `CREATE TYPE`, `CREATE TABLE`, `ADD COLUMN`, `ADD CONSTRAINT` e `CREATE INDEX`. Cero DROP, TRUNCATE, DELETE, RENAME o cambio de tipo en `up`.

**Tipos enum nuevos (5):** `enum_home_page_services_items_icon`, `enum_home_page_services_items_service_page`, `enum_home_page_process_steps_icon`, `enum_home_page_contact_info_rows_icon`, `enum_about_page_hero_chips_icon`.

**Tablas nuevas de home-page (21):** `home_page`, `home_page_locales`, `home_page_vitals_items` (+ `_locales`), `home_page_services_items` (+ `_locales`), `home_page_services_items_tags`, `home_page_process_steps` (+ `_locales`), `home_page_about_paragraphs` (+ `_locales`), `home_page_about_chips` (+ `_locales`), `home_page_about_photos` (+ `_locales`, columna `image_id` hacia media), `home_page_faq_items` (+ `_locales`), `home_page_contact_steps` (+ `_locales`), `home_page_contact_info_rows` (+ `_locales`).

**Tablas nuevas de about-page (8):** `about_page` (columna `hero_photo_id` hacia media), `about_page_locales`, `about_page_hero_chips` (+ `_locales`), `about_page_specialties_items` (+ `_locales`), `about_page_experience_stages` (+ `_locales`).

**Columnas agregadas a tablas existentes (3 sentencias, mas llave foranea e indice):**
- `ALTER TABLE "clientes" ADD COLUMN "on_dark" boolean DEFAULT false`
- `ALTER TABLE "groups_tools" ADD COLUMN "logo_id" integer` (mas FK `groups_tools_logo_id_media_id_fk` a media con `ON DELETE set null` e indice `groups_tools_logo_idx`)
- `ALTER TABLE "_groups_v_tools" ADD COLUMN "logo_id" integer` (mas FK `_groups_v_tools_logo_id_media_id_fk` e indice `_groups_v_tools_logo_idx`)

Las columnas nuevas son nulables, asi que las filas existentes y el codigo de master siguen funcionando. La migracion no toca ninguna otra tabla existente. El `down` contiene DROP por diseno y no se reviso.

## Verificacion

- `54-migration-additive.mjs --selftest`: PASS (valido sin fallos, los tres defectuosos detectados).
- `54-migration-additive.mjs`: PASS sobre `20261108_043335_phase54_shadow_content.ts`.
- `npx tsc --noEmit`: sin errores. `payload-types.ts` regenerado con `HomePage`, `AboutPage`, `Cliente.onDark` y `logo` en el bloque toolStack.
- Comprobacion por script de que `HomePage` y `AboutPage` no exportan `access` ni `versions` y de que todos los grupos requeridos existen.
- `git diff master --numstat` de `Clientes` y `ToolStack/config.ts`: cero lineas eliminadas.
- Los fetchers nuevos no pasan `overrideAccess:false` (el unico `overrideAccess` del diff de `cache.ts` esta en un comentario).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] La lista permitida de la guardia usaba un nombre de tabla que no existe**
- **Found during:** Tarea 3 (primera corrida de la guardia sobre la migracion generada)
- **Issue:** El plan decia "tablas cuyo nombre contiene `tool_stack`", pero `categoryGroups` declara `dbName: 'groups'` (limite de 63 caracteres de Postgres), asi que las tablas reales del bloque son `groups_tools` y `_groups_v_tools` (confirmado en `20260905_060823_phase48_tool_stack_block.ts`). La guardia marcaba como ajenas las seis sentencias legitimas de `logo_id`.
- **Fix:** la guardia acepta esos dos nombres exactos, y por si cambia el `dbName` tambien cualquier tabla con `tool_stack`; la restriccion a la columna `logo_id` (y su FK e indice) se mantiene. El fixture valido de la autoprueba usa los nombres reales.
- **Files modified:** `scripts/verify/54-migration-additive.mjs`
- **Commit:** `877823c`
- **Nota:** no hubo esquema ajeno arrastrado. Revise las 29 tablas y las 3 columnas nuevas una por una contra la lista.

**2. [Rule 1 - Bug] El primer parseo de la guardia cortaba la firma de `up`**
- **Found during:** Tarea 3 (autoprueba)
- **Issue:** la expresion que eliminaba la firma de la funcion paraba en la llave de `{ db }` y dejaba basura como sentencia.
- **Fix:** la guardia extrae el contenido de cada plantilla `sql\`...\``.
- **Commit:** `877823c`

**Total:** 2 correcciones automaticas, ambas dentro del script de verificacion. Sin impacto en el esquema.

### Observaciones sin desviacion

- `payload migrate:create` reformateo la coma final de la entrada anterior en `src/migrations/index.ts` (una linea). Es la salida normal de la herramienta.
- El nombre de la migracion usa la fecha del sistema (`20261108_...`), que ordena despues de todas las existentes.
- El campo `current` de `experience.stages` lleva `defaultValue: false` (checkbox, no es copy).

## Authentication Gates

Ninguno. No se toco ninguna base: `generate:types` y `migrate:create` corrieron con variables de build falsas, y no se aplico ni se empujo nada.

## Known Stubs

Ninguno. Los campos de los globals estan vacios a proposito (sin `defaultValue`: no se inventa copy); el script de carga del plan 54-04 los llena con el copy aprobado del sandbox.

## Threat Flags

Ninguno nuevo. Mitigaciones cumplidas: T-54-05 (sin access ni versions en ambos globals), T-54-06 y T-54-07 (guardia con allow-list, SQL leido), T-54-08 (los globals no estan en el bloque globals del plugin MCP).

## Next Phase Readiness

- Los planes de vistas (54-03 en adelante) pueden leer `getCachedHomePage` y `getCachedAboutPage` y mostrar `TranslationNotice` con `lang es` cuando `isFallback` sea true.
- **No empujar la rama hasta que 54-07 aplique la migracion**: el codigo nuevo consulta tablas que aun no existen en la base compartida (Pitfall 2).
- El plan 54-07 debe confirmar la base con `scripts/db/04-which-database.ts` antes de aplicar.

## Self-Check: PASSED

- Archivos verificados en disco: los seis creados y los siete modificados.
- Commits `386df31`, `52a0e6c` y `877823c` presentes en `git log`.
