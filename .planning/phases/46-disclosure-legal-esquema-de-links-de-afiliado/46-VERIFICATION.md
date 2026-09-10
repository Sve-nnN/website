---
phase: 46-disclosure-legal-esquema-de-links-de-afiliado
verified: 2026-09-04T06:01:40Z
status: passed
score: 3/5 must-haves verified
behavior_unverified: 2
overrides_applied: 0
behavior_unverified_items:
  - truth: "SC-3: la colección affiliate-links existe en Postgres con la matriz aprobada y COUNT(*) = 0 al momento de la aprobación/cierre del plan"
    test: "Conectar contra la Postgres real de Dokploy (scripts/db/tunnel.sh + node --env-file=.env node_modules/.bin/tsx scripts/verify-affiliate-links-schema.ts, o un SELECT COUNT(*) FROM affiliate_links directo) y confirmar 0 filas"
    expected: "COUNT(*) = 0 en la tabla affiliate_links de producción"
    why_human: "El verificador no pudo abrir el túnel SSH a Dokploy — el sandbox de esta sesión bloqueó la acción dos veces ('Permission for this action was denied by the Claude Code auto mode classifier'). No hay forma de leer el estado real de la base de producción sin ese túnel; el código y la migración están verificados, pero el estado de la tabla en vivo no."
  - truth: "SC-4 (mitad DB): la migración aditiva fue aplicada contra el Postgres real de Dokploy"
    test: "Confirmar en la tabla payload_migrations de producción que 20260903_225836_affiliate_links_collection está registrada, y que las tablas affiliate_links/affiliate_links_locales/affiliate_links_destinations existen"
    expected: "Migración presente en el ledger de producción, tablas creadas"
    why_human: "Misma limitación de acceso a la base real — el verificador confirmó que el archivo de migración es puramente aditivo (leyendo su código fuente) pero no pudo confirmar que se corrió contra la base real, solo que el SUMMARY.md lo afirma."
coincidental_reliance_items: []
human_verification:
  - test: "Abrir scripts/db/tunnel.sh y correr un SELECT COUNT(*) FROM affiliate_links; contra la Postgres real de Dokploy"
    expected: "0 filas"
    why_human: "Acceso a producción vía túnel SSH, bloqueado para este verificador por el sandbox"
  - test: "Confirmar en payload_migrations (producción) que 20260903_225836_affiliate_links_collection aparece aplicada"
    expected: "Fila presente con ese nombre de migración"
    why_human: "Mismo bloqueo de acceso a producción"
  - test: "Decidir si Phase 46 necesita mergearse a master/desplegarse antes de considerarse 'cerrada', dado que sus 6 commits solo existen en la rama local docs/seo-handoff (no en origin, no en master)"
    expected: "Confirmación explícita de Juan sobre si el deploy es scope de esta fase o de una fase posterior de consolidación"
    why_human: "Es una decisión de proceso/alcance, no algo que el código pueda responder por sí mismo — ver hallazgo operacional abajo"
---

# Phase 46: Disclosure Legal + Esquema de Links de Afiliado — Verification Report

**Phase Goal:** Todo lo que un link de afiliado necesita para poder existir queda construido y aprobado antes de que se renderice el primero: el disclosure bilingüe vive en código y no en el CMS, `/privacy` cubre el flujo de email, y la colección `affiliate-links` existe con su matriz de localización congelada y su migración aditiva leída antes de aplicarse contra la base real.
**Verified:** 2026-09-04T06:01:40Z
**Status:** human_needed
**Re-verification:** No — initial verification (un `46-VERIFICATION.md` previo existía, pero era el reporte de **verificación de planes** de `/gsd-plan-phase`, no un reporte de verificación de fase ejecutada — no tenía `gaps:` ni el formato de este workflow, así que se trató como modo inicial)

## Goal Achievement

### Observable Truths (5 Success Criteria del ROADMAP)

| # | Truth (Success Criteria) | Status | Evidence |
|---|---------------------------|--------|----------|
| 1 | `AffiliateDisclosure` renderiza copy bilingüe de `messages/{es,en}.json` (nunca del CMS); frase de Amazon verbatim en ambos idiomas; cero-tracking-con-consentimiento escrito como constraint del milestone | ✓ VERIFIED | `AffiliateDisclosure.tsx` usa exclusivamente `getTranslations` (sin `payload.find`); `messages/es.json`/`en.json` tienen `affiliateDisclosure.generalDisclosure` + `amazonDisclosure`; EN = "As an Amazon Associate I earn from qualifying purchases." (verbatim de Amazon); ES = "Como Afiliado de Amazon, obtengo ingresos por las compras que califican." (frase aprobada por Juan según 46-02-SUMMARY.md); `grep` sobre toda la superficie de afiliados no encuentra `document.cookie|localStorage|referrerPolicy|gtag|ga(|/go/`; ROADMAP.md Phase 46 documenta la restricción en "Constraints duras" |
| 2 | `/privacy` responde en ambos locales con formulario de email, Resend como encargado del tratamiento, retención y proceso de baja — verificado con curl sobre HTML renderizado | ✓ VERIFIED | `curl https://juan-tech.com/privacy` y `/en/privacy` → 200 en ambos. HTML renderizado tiene 8 secciones `<h2>` en cada locale (1-6 originales + 2 nuevas). Sección 7 ES: "Formulario de Alta al Correo" menciona "Resend, que actúa como encargado del tratamiento"; EN: "Newsletter Sign-up Form" menciona "Resend, which acts as data processor". Sección 8 ES/EN: retención de 12 meses (misma ventana que sección 4) + proceso de baja (link en cada correo o vía contacto). Las 6 secciones originales (1-6) están intactas verbatim en ambos locales, comparadas contra `scripts/humanize-legal-pages.ts` y `scripts/update-privacy-resend.ts` |
| 3 | Matriz de localización de `affiliate-links` escrita campo por campo y aprobada por Juan, con la base sin un solo documento (`COUNT(*) = 0` al momento de la aprobación) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | La matriz está escrita y aprobada en `46-CONTEXT.md` ("Mode: Smart discuss (autonomous) — 2 áreas presentadas, ambas aceptadas por Juan sin cambios"), **antes** de la implementación — la aprobación-antes-de-contenido está estructuralmente satisfecha por el orden cronológico del workflow. El código de la colección (`src/collections/AffiliateLinks/index.ts`) reproduce los 13 campos exactos de la matriz congelada. Lo que el verificador **no pudo confirmar de forma independiente** es el estado actual de `COUNT(*)` en la Postgres real de Dokploy — requiere el túnel SSH de `scripts/db/tunnel.sh`, bloqueado dos veces por el sandbox de esta sesión ("Permission for this action was denied by the Claude Code auto mode classifier"). El 46-01-SUMMARY.md documenta un round-trip de verificación (crear ES → actualizar EN → leer ambos locales → borrar) con `COUNT(*) = 0` confirmado en la corrida final, pero esa es una afirmación del ejecutor, no algo que este verificador pudo re-ejercitar |
| 4 | `affiliate-links` existe con `active` en vez de drafts, sin `rel` ni `price`, con `cookieWindowDays`/`commissionNote` gateados por field-access, migración puramente aditiva leída antes de aplicarse | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | **Código: VERIFIED.** `index.ts` tiene `active: { type: 'checkbox' }`, sin bloque `versions`. `grep -n '"rel"\|"price"'` sobre el archivo → sin matches (campos genuinamente ausentes, no solo comentados). `cookieWindowDays`/`commissionNote` llevan `access: { read: authenticatedFieldRead }`, mismo patrón que `src/fields/targetKeyword.ts` (`authenticatedFieldRead` ⇒ `Boolean(user)`). `payload-types.ts` (`AffiliateLink` interface) confirma la misma forma de 13 campos, sin `rel`/`price`. La migración `src/migrations/20260903_225836_affiliate_links_collection.ts` tiene en `up()` únicamente `CREATE TYPE`/`CREATE TABLE`/`CREATE INDEX`/`ALTER TABLE ... ADD COLUMN`; los únicos `DROP TABLE`/`DROP COLUMN`/`DISABLE ROW LEVEL SECURITY` están en `down()`, donde corresponde. **Estado en producción: NO VERIFICADO independientemente** por el mismo bloqueo de túnel SSH — ver hallazgo operacional abajo sobre el estado real de despliegue |
| 5 | `getCachedAffiliateLinks()` única lectura pública (`overrideAccess:false`, cache tags, hooks); `pickDestination()` pura sin DB; `AffiliateLink` emite `rel="sponsored nofollow noopener"` con Amazon directo y `tag=` visible | ✓ VERIFIED | `grep -rn "collection: 'affiliate-links'" src/` → solo aparece en `src/lib/cache.ts:336` dentro de `getCachedAffiliateLinks()`, con `overrideAccess: false` explícito. `src/lib/affiliate.ts` no importa `payload` ni `@payload-config` — función pura confirmada por lectura directa. Hooks `afterChange`/`afterDelete` en `AffiliateLinks/index.ts` llaman `revalidateAffiliateLinksCache`/`OnDelete` (`cache-tags.ts`), que invalidan `CACHE_TAGS.affiliateLinks()` — el mismo tag que consume `getCachedAffiliateLinks()`. `AffiliateLink.tsx` verificado por **ejecución real e independiente** de `scripts/verify-affiliate-link-component.ts` (`node node_modules/.bin/tsx scripts/verify-affiliate-link-component.ts` → `PASS`): `rel="sponsored nofollow noopener"` exacto, `tag=juantech02-20` preservado verbatim, sin `referrerpolicy`, sin `/go/` |

**Score:** 3/5 truths verified (2 present + wired en código, con el estado de base de datos de producción sin confirmar por este verificador)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/collections/AffiliateLinks/index.ts` | 13 campos exactos, sin `rel`/`price`, `active` en vez de drafts | ✓ VERIFIED | Leído completo, coincide con 46-CONTEXT.md campo por campo |
| `src/access/authenticatedOrActive.ts` | Espejo de `authenticatedOrPublished` con `active: true` | ✓ VERIFIED | Leído, patrón correcto |
| `src/lib/affiliate.ts` (`pickDestination`) | Función pura, sin import de payload | ✓ VERIFIED | Confirmado, cero imports externos |
| `src/lib/cache.ts` (`getCachedAffiliateLinks`) | Única lectura pública, `overrideAccess:false` | ✓ VERIFIED | Leído en contexto, `overrideAccess: false` explícito |
| `src/lib/cache-tags.ts` (tag + hooks) | `CACHE_TAGS.affiliateLinks` + hooks de invalidación | ✓ VERIFIED | Confirmado, wireado en la colección |
| `src/components/AffiliateLink.tsx` | `rel` hardcodeado, sin JS de cliente | ✓ VERIFIED + comportamiento probado (`PASS` en ejecución real) |
| `src/components/AffiliateDisclosure.tsx` | Server component, `getTranslations`, sin CMS | ✓ VERIFIED | Leído completo |
| `src/migrations/20260903_225836_affiliate_links_collection.ts` | Puramente aditivo en `up()` | ✓ VERIFIED | `up()` solo CREATE/ADD COLUMN; destructivo solo en `down()` |
| `messages/es.json` / `messages/en.json` (`affiliateDisclosure`) | Namespace completo, frase Amazon verbatim | ✓ VERIFIED | Confirmado por lectura directa del JSON parseado |
| Contenido `/privacy` (secciones 7-8) | Resend, retención, baja, en ambos locales | ✓ VERIFIED | Confirmado por curl contra el sitio real en vivo |
| Estado de `affiliate_links` en Postgres de producción | `COUNT(*) = 0`, tablas creadas por la migración | ⚠️ NO VERIFICADO | Túnel SSH a Dokploy bloqueado por el sandbox de esta sesión |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `AffiliateLinks.hooks.afterChange/afterDelete` | `getCachedAffiliateLinks()` | `revalidateAffiliateLinksCache`/`OnDelete` → `CACHE_TAGS.affiliateLinks()` | ✓ WIRED | Mismo string de tag en ambos lados (`'affiliate-links:all'`) |
| `payload.config.ts` | `AffiliateLinks` | Import + registro en `collections:` | ✓ WIRED | Fuera de `seoPlugin`/`redirectsPlugin`/`searchPlugin`/`mcpPlugin`, como exige el plan |
| `pickDestination()` | (ninguna DB) | Función pura standalone | ✓ WIRED (aislamiento confirmado) | Cero imports de `payload`/config |
| `scripts/update-privacy-resend.ts` | `pages` (slug=privacy) | `payload.update()` reusando `blockId`/`columnId` entre locales | ✓ WIRED | Confirmado por curl en vivo — el contenido escrito coincide carácter por carácter con el HTML servido |
| Componentes `AffiliateLink`/`AffiliateDisclosure` | Cualquier página de la app | (ninguno todavía) | ⚠️ ORPHANED (esperado) | Cero imports fuera de los scripts de verificación — correcto para esta fase: el consumo real es Phase 47/48, y el CONTEXT.md lo deja explícito como "Deferred" |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `AffiliateLink` emite `rel` exacto, preserva `tag=`, sin `referrerpolicy`/`/go/` | `node node_modules/.bin/tsx scripts/verify-affiliate-link-component.ts` | `PASS` | ✓ PASS (ejecutado por el verificador, no solo citado del SUMMARY) |
| Compilación TypeScript del proyecto | `npx tsc --noEmit` | Sin salida (limpio) | ✓ PASS |
| `/privacy` responde 200 en ambos locales con las 8 secciones esperadas | `curl https://juan-tech.com/privacy` + `/en/privacy` | 200 + 8 `<h2>` cada uno, contenido correcto | ✓ PASS |
| Ausencia de `rel`/`price` como nombres de campo en la colección | `grep -n '"rel"\|"price"' src/collections/AffiliateLinks/index.ts` | Sin matches | ✓ PASS |
| Ausencia de tracking con consentimiento en la superficie de afiliados | `grep -rniE "document\.cookie\|localStorage\|referrerPolicy\|gtag\|ga(\|/go/"` sobre los 6 archivos core | Sin matches | ✓ PASS |
| Estado de `affiliate_links` en Postgres de producción (`COUNT(*)`, ledger de migraciones) | `scripts/db/tunnel.sh` + `scripts/verify-affiliate-links-schema.ts` o SQL directo | No ejecutado — permiso denegado por el sandbox dos veces | ? SKIP (rutado a verificación humana) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| LEG-01 | 46-02 | Disclosure bilingüe antes del primer link, copy en `messages/` | ✓ SATISFIED | `AffiliateDisclosure.tsx` + namespace en ambos JSON |
| LEG-02 | 46-02 | Frase de Amazon verbatim ES/EN donde haya links de Amazon | ✓ SATISFIED | Confirmado en `messages/es.json`/`en.json` |
| LEG-03 | 46-02 | `/privacy` cubre formulario, Resend, retención, baja | ✓ SATISFIED | Confirmado por curl en vivo, ambos locales |
| LEG-04 | 46-02 | Prohibición de tracking-con-consentimiento escrita | ✓ SATISFIED | Constraint en ROADMAP.md + grep limpio en código |
| AFF-01 | 46-01 | Colección con matriz congelada y aprobada antes de cargar contenido | ✓ SATISFIED (código) / ⚠️ estado DB no confirmado | Matriz en CONTEXT.md ≡ código; COUNT(*) en vivo no verificado por el verificador |
| AFF-02 | 46-01 | `destinations` NO localizado, `pickDestination()` puro | ✓ SATISFIED | Confirmado por lectura + test de cache script (no re-ejecutado, requiere DB) |
| AFF-03 | 46-01 | `rel="sponsored nofollow noopener"` estructural, nunca campo CMS | ✓ SATISFIED | Confirmado por test ejecutado (`PASS`) + ausencia del campo `rel` |
| AFF-04 | 46-01 | Amazon directo, sin cloaking, `tag=` visible, sin `referrerPolicy` | ✓ SATISFIED | Confirmado por test ejecutado (`PASS`) |
| AFF-05 | 46-01 | `getCachedAffiliateLinks()` única lectura, `overrideAccess:false`, cache tags/hooks | ✓ SATISFIED | Confirmado por lectura de código, único call-site |
| AFF-06 | 46-01 | Migración puramente aditiva, leída antes de aplicarse | ✓ SATISFIED (código) / ⚠️ aplicación en prod no confirmada | `up()`/`down()` leídos completos; aplicación real contra Dokploy no re-verificable por el sandbox |

Ninguno de los 10 requirements aparece huérfano — los 10 mapeados a Phase 46 en REQUIREMENTS.md están cubiertos por 46-01/46-02.

### Anti-Patterns Found

Ninguno. `grep` de `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|placeholder|coming soon|not yet implemented` sobre los 11 archivos creados/modificados por esta fase no encontró coincidencias. No hay `return null`/`return {}`/handlers vacíos en los componentes nuevos.

### Hallazgo Operacional (no bloqueante para las 5 Success Criteria, pero relevante)

**Los 6 commits de Phase 46 (`1ec0e45`, `20f95a1`, `d192ae7`, `5684d4a`, `97ceeb3`, `dc1e30c`) existen únicamente en la rama local `docs/seo-handoff` de este checkout — no están en `origin/docs/seo-handoff`, no están en `master`, no están pusheados.** Confirmado con `git merge-base --is-ancestor` contra `master` y `origin/docs/seo-handoff` (ambos negativos) y `git branch -a --contains 1ec0e45` (solo devuelve `docs/seo-handoff` local).

Consistente con esto: `curl https://juan-tech.com/api/affiliate-links` devuelve `404 {"message":"Route not found"}` en producción, mientras que `/api/posts` y `/api/pages` responden con datos reales — es decir, la colección `affiliate-links` **no está desplegada** en el sitio en vivo todavía. Esto no contradice ninguna de las 5 Success Criteria (ninguna exige que la colección esté expuesta en producción — el consumo real es Phase 47/48), y es coherente con el patrón de este proyecto donde las escrituras a la base de Dokploy (migración, contenido de `/privacy`) se hacen vía scripts locales con túnel SSH, independientes del deploy de la app. La actualización de `/privacy` sí es visible en vivo porque es un cambio de **datos** (contenido de un bloque `richText` ya soportado por el código desplegado), no de **código nuevo**.

Se documenta porque la instrucción de lanzamiento de esta verificación decía "worktree already merged — work on the primary checkout", lo cual no coincide con el estado real de git (nada mergeado a `master` ni pusheado a `origin`). Puede ser una imprecisión de lenguaje del orquestador (merge del worktree al checkout local, no merge a `master`) o puede ser una fase de consolidación pendiente — queda como pregunta para Juan, no como gap de Phase 46.

### Human Verification Required

#### 1. Confirmar `COUNT(*) = 0` en `affiliate_links` contra la Postgres real de Dokploy

**Test:** `bash scripts/db/tunnel.sh` (en una terminal) y, en otra, `export DATABASE_URI=...` (según las instrucciones que imprime el script) seguido de `node --env-file=.env node_modules/.bin/tsx scripts/verify-affiliate-links-schema.ts`, o un `SELECT COUNT(*) FROM affiliate_links;` directo por `psql`.
**Expected:** 0 filas.
**Why human:** El túnel SSH a producción fue bloqueado dos veces por el clasificador de modo automático del sandbox de este verificador ("Permission for this action was denied by the Claude Code auto mode classifier"). No hay forma de leer el estado real de la base sin ese túnel.

#### 2. Confirmar que la migración `20260903_225836_affiliate_links_collection` está aplicada en producción

**Test:** Contra la misma conexión de arriba, `SELECT * FROM payload_migrations WHERE name LIKE '%affiliate_links%';` (o correr `payload migrate:status` apuntando a `DATABASE_URI` de producción).
**Expected:** Fila presente confirmando que la migración corrió.
**Why human:** Mismo bloqueo de acceso a producción — el archivo de migración en sí fue verificado como puramente aditivo por lectura de código, pero que se haya *aplicado* contra la base real es un hecho externo que este verificador no pudo comprobar.

#### 3. Decidir si el estado "no mergeado a master / no desplegado" bloquea el cierre de Phase 46

**Test:** Revisar el hallazgo operacional de arriba y decidir si Phase 46 requiere merge a `master` (y por tanto deploy vía Dokploy) antes de considerarse cerrada, o si eso queda correctamente diferido a una fase de consolidación posterior.
**Expected:** Una decisión explícita de Juan, documentada en STATE.md o en este archivo vía `overrides:`.
**Why human:** Es una decisión de alcance/proceso del milestone, no algo verificable por el código.

### Gaps Summary

No se encontraron gaps (ningún artefacto falta, ningún link está desconectado, ningún anti-patrón bloqueante). Las 5 Success Criteria están verificadas a nivel de código, con comportamiento ejecutado y confirmado de forma independiente donde fue posible sin tocar producción (compilación TypeScript, el test de `AffiliateLink`, curl contra `/privacy` en vivo). Las únicas dos piezas sin confirmar de forma independiente son estados de la base de datos de producción (`COUNT(*) = 0` y que la migración se aplicó), bloqueadas por restricciones del sandbox de este verificador, no por evidencia de que algo esté mal — de ahí `status: human_needed` en vez de `gaps_found`.

---

*Verified: 2026-09-04T06:01:40Z*
*Verifier: Claude (gsd-verifier)*
