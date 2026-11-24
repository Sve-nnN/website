---
phase: 56-contenido-pendiente-de-juan
plan: 03
subsystem: schema
tags: [legal-pages, shadow-global, additive-migration, cache, verify-schema, d-02, d-09, cont-03]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: 56-01 (guardia de contenido, orquestador 56-run-all, convencion DECISIONS de 56-gate)
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: patron de global privado sin access ni versions (HomePage, AboutPage) y 54-seed-lib
  - phase: 55-casos-websites-blog-y-autores
    provides: molde de la guardia de migracion aditiva y de migrate:create con variables falsas
provides:
  - Global privado legal-pages (effectiveDate de solo dia, privacy.body y terms.body Lexical localizados) sin access ni versions
  - CACHE_TAGS.legalPages, hook revalidateLegalPagesCache y getCachedLegalPages(locale) con fallbackLocale false y respaldo a null
  - Migracion aditiva 20261110_220805_phase56_legal_shadow (generada y revisada, NO aplicada) con su snapshot json
  - 56-migration-additive.mjs, guardia con selftest de 11 defectuosos
  - 25-phase56-verify-schema.ts de solo lectura (legal-pages, home-page, about-page) y 56-seed-lib.ts con evaluadores puros y mergeGroupAllowShrink
affects: [56-08, 56-12, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "Texto que master ya sirve vive en un global sombra que master no conoce; la ruta lee el global y cae al doc pages del mismo idioma"
    - "El remedio de permission denied del rol del preview vive dentro de la migracion (DO guardado con GRANT SELECT)"
    - "La guardia de migracion admite un unico bloque DO con la forma exacta BEGIN IF EXISTS GRANT END IF END"
key-files:
  created:
    - src/globals/LegalPages/index.ts
    - src/migrations/20261110_220805_phase56_legal_shadow.ts
    - src/migrations/20261110_220805_phase56_legal_shadow.json
    - scripts/verify/56-migration-additive.mjs
    - scripts/db/25-phase56-verify-schema.ts
    - scripts/db/data/56-seed-lib.ts
  modified:
    - src/payload.config.ts
    - src/lib/cache-tags.ts
    - src/lib/cache.ts
    - src/payload-types.ts
    - src/migrations/index.ts
key-decisions:
  - "getCachedLegalPages devuelve privacy y terms como null cuando el cuerpo del idioma no tiene texto (un parrafo vacio no cuenta), para que la ruta caiga al doc pages de ese idioma"
  - "Una lectura que lanza (tabla ausente o permission denied) devuelve todo null y registra console.error con la etiqueta legal-pages: asi un despliegue antes de la migracion no rompe /privacy ni /terms (T-56-11)"
  - "La guardia exige la forma exacta del bloque DO y que el GRANT cubra las dos tablas, no solo que el rol sea el correcto"
  - "El numero de etapas esperado de about-page se deriva de ABOUT_COPY_ES de 56-about-copy.ts, no se cablea"
patterns-established:
  - "Un modulo scripts/db/data/56-*.ts que no registra decisiones exporta DECISIONS: [] para cumplir la convencion de 56-gate"
requirements-completed: []
duration: 25min
completed: 2026-11-10
status: complete
commits: 3
plan_head_before: b2c3883dc9a4ac964dd6168cde7796a3233d27e9
actuals:
  tokens: 11000
  tasks: 3
  commits: 3
---

# Phase 56 Plan 03: Global legal-pages sombra y migracion aditiva Summary

Global privado legal-pages con su lectura cacheada y respaldo por idioma, migracion aditiva que solo crea dos tablas nuevas (generada y revisada, sin aplicar), guardia que rechaza cualquier otra sentencia y verificador de solo lectura para que Juan compruebe esquema y siembra en 56-12 con el usuario dueno y con el rol del preview. Cero escrituras a la base, cero acceso a ella, nada empujado.

## Que quedo hecho

**Task 1 (tracer): global y lectura de punta a punta.**
- `src/globals/LegalPages/index.ts`: slug `legal-pages`, grupo Site, `effectiveDate` (fecha de solo dia, no localizada, vacia hasta el corte), grupos `privacy` y `terms` con `body` richText Lexical localizado. Sin `access` ni `versions` (T-54-05, T-56-09), documentado en el comentario del archivo. Hook `afterChange: revalidateLegalPagesCache`.
- `cache-tags.ts`: `CACHE_TAGS.legalPages()` y `revalidateLegalPagesCache` con el molde de `revalidateAboutPageCache`. `payload.config.ts` registra `LegalPages`.
- `cache.ts`: `getCachedLegalPages(locale)` con `unstable_cache`, depth 0, `fallbackLocale: false`, TTL de los demas. Devuelve `{ privacy, terms, effectiveDate }` con `null` por campo vacio. Si lanza, devuelve todo `null` y escribe `legal-pages: lectura fallida, se usa el doc pages (...)` con `console.error`.
- Tipos regenerados con variables falsas de build y sin cargar `.env`: solo 71 lineas nuevas (`LegalPage` y `LegalPagesSelect`), sin deriva.

**Task 2: migracion aditiva.**
- Generada con `PAYLOAD_SECRET=build-only DATABASE_URI=postgresql://build:build@127.0.0.1:5432/build payload migrate:create phase56_legal_shadow`. SQL leido completo (ver abajo).
- Unica edicion manual: bloque `DO $$ ... $$` al final de `up` que, solo si existe el rol `juantech_preview_ro`, hace `GRANT SELECT` sobre las dos tablas nuevas. `down` intacto.
- `56-migration-additive.mjs`: aisla `up`, exige solo CREATE TABLE de las dos tablas, ADD CONSTRAINT FOREIGN KEY e indices sobre ellas, y como unica excepcion el bloque DO con la forma exacta y las dos tablas hacia `juantech_preview_ro`. Comprueba ademas el `.json` de snapshot y la entrada en `index.ts`. `--selftest` con un fixture valido y 11 defectuosos (tabla extra, GRANT a otro rol, GRANT sobre tabla ajena, GRANT suelto fuera del DO, DROP COLUMN, ADD COLUMN, CREATE TYPE, TRUNCATE, REFERENCES ajeno, tabla faltante, DO con DELETE).

**Task 3: verificador de solo lectura y evaluadores puros.**
- `56-seed-lib.ts`: `evaluateLegalState`, `evaluateShadow56State`, `lexicalHasText`, `HOME_LIST_COUNTS`, `mergeGroupAllowShrink` (devuelve el grupo recortado y la lista de filas descartadas con ruta e id), y reexporta `assertSafeTarget`, `safeTarget`, `mergeGroup`, `findPendingMarkers`, `assertNoForbiddenChars` de 54-seed-lib.
- `25-phase56-verify-schema.ts`: llama `assertSafeTarget` antes de abrir Payload, imprime `safeTarget`, lee con `fallbackLocale: false` por locale es y en los tres globals, y sale 1 ante cualquier FAIL. Banderas `--expect-seeded`, `--expect-date`, `--expect-shadow-seeded`, `--selftest`. Un `permission denied` marca `permissionDenied` y el FAIL explica que el rol conectado no puede leer las tablas nuevas y que falta el GRANT SELECT de la migracion.

## Resumen de la migracion (para la revision de Juan antes de 56-12)

Archivo: `src/migrations/20261110_220805_phase56_legal_shadow.ts` (y `.json`). Sentencias de `up`:

1. `CREATE TABLE "legal_pages"`: `id serial PK`, `effective_date timestamp(3) with time zone`, `updated_at`, `created_at`.
2. `CREATE TABLE "legal_pages_locales"`: `privacy_body jsonb`, `terms_body jsonb`, `id serial PK`, `_locale "_locales" NOT NULL`, `_parent_id integer NOT NULL`.
3. `ALTER TABLE "legal_pages_locales" ADD CONSTRAINT "legal_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade`.
4. `CREATE UNIQUE INDEX "legal_pages_locales_locale_parent_id_unique" ON "legal_pages_locales" ("_locale","_parent_id")`.
5. `DO $$ ... IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'juantech_preview_ro') THEN GRANT SELECT ON TABLE "legal_pages", "legal_pages_locales" TO "juantech_preview_ro"; END IF ... $$`.

`up` no tiene DROP, ALTER COLUMN, ADD COLUMN, CREATE TYPE ni nada sobre tablas existentes. El enum `_locales` ya existe y solo se referencia. Los unicos DROP estan en `down` (`DROP TABLE "legal_pages" CASCADE` y `DROP TABLE "legal_pages_locales" CASCADE`), que solo borra las dos tablas nuevas. Cero deriva de esquema ajeno.

## Verificacion

- Task 1: `generate:types`, `grep legal-pages` en tipos, `npx tsc --noEmit`, `55-cache-tags.ts` (todo PASS, incluido que ninguna cadena con forma de tag aparece como literal fuera de cache-tags), `53-write-gates.mjs` (OK). Criterios de aceptacion: el global no declara `access` ni `versions`, `getCachedLegalPages` existe, `LegalPages` esta registrado. Barrera del tracer: con `AUTO_CFG` falso y `HUMAN_VERIFY_MODE=end-of-phase` y verificacion solo automatizada, se re-corrio de punta a punta y paso antes de expandir.
- Task 2: `56-migration-additive.mjs --selftest` (12 PASS), la guardia sobre la migracion real (PASS, lista las dos tablas), 2 archivos `phase56_legal_shadow` (ts y json), `tsc`. `git diff -- src/migrations/index.ts` muestra solo el import y la entrada nuevas y la coma de la entrada anterior.
- Task 3: `25-phase56-verify-schema.ts --selftest` (20 casos en PASS, sale 0: estado legal vacio, sembrado, con y sin fecha, permission denied, centinela EN, marcador de ranura, cantidad de etapas, mergeGroupAllowShrink y que mergeGroup de la 54 sigue lanzando), `56-content-guard.mjs` (datos y scripts PASS), `npx tsc --noEmit`, `56-run-all.mjs --selftest` y `--selftests` (0 FAIL). `56-gate.ts` sigue saliendo 0 con el modulo nuevo.
- Criterios: ningun `payload.create|update|updateGlobal|delete` en 25-phase56-verify-schema.ts; contiene `permission denied`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 56-seed-lib.ts debe exportar DECISIONS**
- **Found during:** Task 3, al revisar `56-gate.ts`.
- **Issue:** el gate descubre todo `scripts/db/data/56-*.ts` (salvo el registro) y marca como problema de forma un modulo sin `DECISIONS`. `56-seed-lib.ts` no registra decisiones.
- **Fix:** `export const DECISIONS: Decision[] = []` con el tipo importado de `56-content-decisions`.
- **Files modified:** `scripts/db/data/56-seed-lib.ts`
- **Commit:** 4ec52a4

**2. [Rule 3 - Blocking] La guardia no podia usar el molde de 55 para un bloque DO**
- **Found during:** Task 2.
- **Issue:** el molde parte las sentencias por `;`, y el bloque DO contiene `;` internos; el GRANT guardado habria fallado como "sentencia fuera de la lista".
- **Fix:** la guardia extrae primero los bloques `DO $$ ... $$` y los valida con una forma exacta; el resto sigue por el flujo del molde. Un GRANT suelto fuera del DO falla.
- **Files modified:** `scripts/verify/56-migration-additive.mjs`
- **Commit:** cf5379a

### Decisiones de implementacion (no son desviaciones del plan)

- `cache.ts` lleva un helper local `lexicalWithText` en vez de importar `lexicalOrNull` de `case-study-data.ts`: ese modulo importa componentes y `sitemap-data`, y `cache.ts` debe seguir libre de ellos.
- El tipo generado se llama `LegalPage` (singular, por la etiqueta del slug); en `cache.ts` se importa con alias `LegalPages`.
- El numero de etapas esperado de about-page se importa de `ABOUT_COPY_ES` de `scripts/db/data/56-about-copy.ts` (lo escribe el plan 56-04, ya en la rama). Si 56-04 cambia la cantidad de etapas, el verificador la sigue sin edicion.

### Notas de proceso

- `commits: 3` cuenta los commits de este plan (03c13df, cf5379a, 4ec52a4). `git rev-list` desde `plan_head_before` da mas porque los planes 56-02 y 56-04 corrieron en paralelo en el mismo checkout y commitearon en la misma rama.
- Nunca se uso `git add -A`, `stash` ni `reset`. `scripts/_tmp-dump-b0303.ts`, `scripts/_tmp-extract-b0303.ts` y los cambios de 56-04 en `scripts/db/23-phase54-verify-schema.ts` se dejaron intactos.

## Auth gates

Ninguno. El plan no abre la base ni la red.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno fuera del registro del plan. T-56-08 (GRANT guardado en la migracion, verificacion con el rol real en 56-12), T-56-09 (sin access ni versions), T-56-10 (guardia rechaza todo lo ajeno; el SQL generado salio limpio) y T-56-11 (getter con respaldo, rama sin empujar) quedan mitigados en codigo.

## Items abiertos para Juan

1. **La migracion NO esta aplicada y la rama NO esta empujada.** La aplica 56-12 contigo. Empujar antes no rompe `/privacy` ni `/terms` gracias al respaldo del getter, pero el log mostraria `legal-pages:` por cada lectura hasta aplicarla.
2. **Revisa el SQL de la seccion "Resumen de la migracion"**: es puramente aditivo (dos tablas nuevas, una llave foranea, un indice unico y un GRANT guardado). No requiere aprobacion nombrada segun la regla de la base, pero 56-12 es tu punto de control.
3. **Quien consuma `getCachedLegalPages`** (plan 56-08) debe usar el doc pages del mismo idioma cuando el valor sea `null`, y renderizar `effectiveDate` solo cuando exista (D-09; la clave `legal.effectiveOn` ya esta en messages).
4. **En 56-12 corre `25-phase56-verify-schema.ts` dos veces** (usuario dueno y rol `juantech_preview_ro`) para confirmar que el GRANT llego.

## Self-Check: PASSED

Archivos creados presentes: `src/globals/LegalPages/index.ts`, `src/migrations/20261110_220805_phase56_legal_shadow.ts` y `.json`, `scripts/verify/56-migration-additive.mjs`, `scripts/db/25-phase56-verify-schema.ts`, `scripts/db/data/56-seed-lib.ts`. Commits 03c13df, cf5379a y 4ec52a4 presentes en la rama feat/mui-redesign.
