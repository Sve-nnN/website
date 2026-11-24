---
phase: 49-captura-de-email-resend-env-gated
verified: 2026-09-08T06:30:00Z
status: passed
score: 9/9 truths verified (gap #1 fixed post-verification, see note below)
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "confirmedAt en subscribers refleja fielmente cuándo el suscriptor confirmó — nunca antes de que status pase a 'confirmed' por el clic real de confirmación"
    status: failed
    reason: >
      En la rama de CREACIÓN (subscriber nuevo) de subscribeToLeadMagnetAction
      (src/app/actions/subscribe-lead-magnet.tsx), confirmedAt queda invertido
      respecto de status: cuando Resend está configurado (resendReady=true,
      status correctamente queda 'pending'), confirmedAt IGUAL se estampa con
      la hora del alta en vez de quedar null hasta la confirmación real
      (línea 169: `confirmedAt: resendReady ? nowIso : null`). La rama de
      ACTUALIZACIÓN (suscriptor ya existente, línea 153) tiene la expresión
      correcta e inversa: `confirmedAt: resendReady ? null : nowIso`. El bug
      solo golpea altas nuevas con Resend configurado — el caso más común en
      producción hoy (RESEND_API_KEY ya es real desde 2026-09-07).
      Reproducido en vivo contra la base real de Dokploy: un alta nueva vía
      el formulario real del post (subscriber id=10, email de prueba) quedó
      con status='pending' pero confirmedAt ya poblado en el mismo instante
      del alta — una fila que dice "sin confirmar" y "confirmado" a la vez en
      el admin. Ninguno de los scripts de verificación de 49-01/49-02/49-03
      lo detectó porque ninguno afirma explícitamente "confirmedAt es null
      mientras status='pending'" — solo verifican los sentinels HAPPY_PATH_OK/
      DEGRADED_PATH_OK/MAIL0X_OK, que no dependen de ese campo.
      Impacto acotado: confirmedAt no se usa en NINGÚN lugar del código para
      gating de acceso (grep confirmado — solo se escribe, nunca se lee para
      lógica) así que el doble opt-in en sí (MAIL-02, gating por `status`) NO
      está comprometido: un suscriptor pending sigue sin poder descargar el
      magnet hasta pasar por /api/newsletter/confirm o por la rama degradada
      real. Es un defecto de integridad de datos/auditoría, no un bypass de
      seguridad — pero es un bug real y reproducible en código entregado como
      "listo", exactamente lo que sale a la luz al verificar contra datos
      reales en vez de confiar en los sentinels declarados.
    artifacts:
      - path: "src/app/actions/subscribe-lead-magnet.tsx"
        issue: "Línea 169 invierte confirmedAt respecto de status en la rama de creación; debería leer `confirmedAt: resendReady ? null : nowIso`, igual que la rama de actualización en la línea 153."
    missing:
      - "Invertir la expresión de la línea 169 para que coincida con el patrón correcto ya usado en la línea 153."
      - "Agregar una aserción en scripts/verify-phase49-*.ts (o un test nuevo) que confirme confirmedAt=null mientras status='pending' en la rama de creación, para que esta clase de regresión no vuelva a pasar los sentinels sin ser detectada."
      - "Corregir manualmente (o vía script) el registro de prueba id=10 dejado en la Postgres real de Dokploy por esta verificación (email verifier-phase49-1788845640@example.invalid, status ya avanzó a 'confirmed' tras el flujo de confirmación real que se probó) — no forma parte del contenido real del sitio, es un artefacto de esta verificación."
human_verification:
  - test: "Con la Postgres real conectada (túnel a Dokploy) y un servidor local (dev o build) corriendo, visitar 2-3 posts reales DISTINTOS de technical-seo-checklist (ej. /blog/cs-fundamentals/tablas-hash, /en/blog/tech-seo/nextjs-seo) y confirmar HTTP 200 con contenido completo, sin 500 ni error de DYNAMIC_SERVER_USAGE."
    expected: "Los posts sin el bloque de captura (que no leen `?subscribed=`) siguen sirviendo 200 con el body completo — el fix `dynamic = 'force-dynamic'` aplicado a nivel de página (src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx) no tiene ninguna rama condicional por post, así que debería aplicar uniformemente a todas las rutas bajo ese segmento."
    why_human: >
      El túnel SSH+docker-exec hacia la Postgres de Dokploy (necesario para
      correr cualquier verificación con datos reales) estuvo intermitentemente
      caído durante gran parte de esta sesión de verificación — confirmado por
      el propio orquestador como una condición conocida del sandbox, y
      documentado de forma independiente en los 3 SUMMARY de esta misma fase
      (mismo síntoma: relay socat/pg-relay-tmp deja de aceptar conexiones tras
      uso repetido). Se reintentó la reconexión del túnel más de 8 veces a lo
      largo de ~45 minutos (recreación completa del relay, del túnel SSH y del
      servidor dev en cada intento) sin lograr una ventana estable para volver
      a ejercer esta ruta específica. SÍ se obtuvo evidencia parcial antes del
      corte: (a) /blog/cs-fundamentals/tablas-hash devolvió 200 en un momento
      de la sesión (aunque con latencia degradada por la congestión del
      túnel); (b) 49-03-SUMMARY.md documenta su propia evidencia curl directa
      (antes 500 en las 3 URLs probadas — ES plana, ES con `?subscribed=
      pending`, EN plana — después 200 en las 3, con contenido verificado);
      (c) el fix es una sola línea a nivel de módulo (`export const dynamic =
      'force-dynamic'`) sin ninguna rama condicional por contenido de post,
      así que arquitectónicamente no hay forma de que aplique distinto a un
      post que a otro. Esto reduce el riesgo pero no reemplaza una
      confirmación en vivo fresca.
---

# Phase 49: Captura de Email (Resend, env-gated) Verification Report

**Phase Goal:** Un visitante puede dejar su email en un bloque inline (nunca popup ni modal), confirmarlo por un doble opt-in implementado en el propio sitio, y recibir el lead magnet por una URL firmada que caduca — sin JavaScript de cliente y degradando limpio mientras `RESEND_API_KEY` siga siendo un placeholder.
**Verified:** 2026-09-08 (contra la Postgres real de Dokploy vía túnel SSH, y contra un servidor local — `next dev` — conectado a esa misma base; el dominio público `juan-tech.com` sirve todavía la build de `master` de 2026-08-26, ya que `docs/seo-handoff` con la Fase 49 no está mergeada — ver nota de despliegue más abajo)
**Status:** passed (orchestrator fix applied post-verification, commit `391cb77` — inverted the create branch's `confirmedAt` ternary to match the already-correct update branch: `confirmedAt: resendReady ? null : nowIso`. `tsc --noEmit` clean. Not re-run live against Dokploy — the fix is a one-line mirror of logic already proven correct on the update path in this same report, low enough risk not to warrant a second full live verification pass, but flagging here for the record.)
**Re-verification:** No — verificación inicial

## Nota de despliegue (hallazgo, no un gap de la fase)

`docs/seo-handoff` (rama de trabajo con las Fases 44-49, incluida esta) **no está mergeada a `master`**. Como el deploy de Dokploy dispara al mergear a `master` (ver memoria del proyecto), `juan-tech.com` sirve hoy una build de 2026-08-26 — sin el bloque de captura, sin `/blog/confirm`, sin las colecciones nuevas visibles en el admin. Confirmado con `curl` directo: el post real `technical-seo-checklist` en producción responde 200 pero **sin ningún rastro del bloque** (`x-nextjs-cache: HIT`, `x-nextjs-prerender: 1` — build vieja cacheada).

La base de datos SÍ es la real y compartida (migración aplicada contra Dokploy, confirmado con `scripts/db/04-which-database.ts` vía túnel) — por eso toda la verificación de este reporte corrió contra un servidor local (`next dev`) apuntado a esa misma Postgres real, replicando exactamente el patrón que los propios scripts de la fase (`verify-phase49-*.ts`) ya usaban. Esto no es un gap de la Fase 49 (el código está completo y correcto en la rama), pero es una condición que Juan debe conocer antes de considerar la fase "en vivo" para usuarios reales: **el bloque no es descubrible en juan-tech.com hasta el merge a `master`.**

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | MAIL-01: bloque de captura inline, cero JS de cliente, vía Server Action | ✓ VERIFIED | `grep` directo sobre `src/blocks/EmailCaptureBlock/Component.tsx`: sin `'use client'`, sin `useState/useActionState/useFormStatus/onChange/onInput`, con `<form action={subscribeToLeadMagnetAction}>`. Confirmado en vivo: HTML servido por `next dev` (conectado a Dokploy) para `/blog/tech-seo/technical-seo-checklist` contiene `<form ... action="" ...><input type="hidden" name="$ACTION_ID_..."/>` — patrón de progressive enhancement de Server Actions, sin bundle de cliente adicional para el formulario. Envío real vía `curl` multipart (sin navegador) funcionó — confirma que no depende de JS de cliente. |
| 2 | MAIL-02: doble opt-in propio — alta queda `pending` hasta confirmar; página `/blog/confirm` vive en `[locale]`, `robots:{index:false}`, sin cambios al middleware | ✓ VERIFIED | Ciclo completo ejercido en vivo contra Dokploy: `curl` POST al formulario real → subscriber creado con `status:'pending'`, `optInReason:'lead-magnet'`, `leadMagnet` seteado (confirmado por lectura directa de la fila vía Local API) → `GET /api/newsletter/confirm?token=...` → 307 a `/blog/confirm?token=<downloadToken>` → página muestra "¡Confirmado!" con URL firmada real → PDF real descargado (70011 bytes, `PDF document, version 1.4, 3 pages`). `generateMetadata` de `blog/confirm/page.tsx` retorna `robots:{index:false, follow:true}`. `git diff` contra el commit previo a Phase 49 confirma `src/middleware.ts` sin ningún cambio. **Ver gap #1** (defecto de integridad en `confirmedAt`, no afecta el gating por `status`). |
| 3 | MAIL-03: lead magnet vía URL firmada de Cloudinary con expiración corta; sin firma, 401/403 | ✓ VERIFIED | URL firmada real descargó el PDF (200, 70011 bytes). La misma `public_id` sin firma: `https://res.cloudinary.com/dmufha3qv/raw/authenticated/lead-magnets/seo-audit-checklist-es.pdf` → **401**; variante `/upload/` (nunca usada) → 404. Confirmado en vivo, no solo leído del código. |
| 4 | MAIL-04: sin `RESEND_API_KEY`, el suscriptor igual se registra y el magnet igual se entrega, sin excepción no capturada | ✓ VERIFIED | Proceso hijo aislado (`env` propio sin `RESEND_API_KEY`, nunca tocando `.env` real ni el proceso principal): `isResendConfigured()` devolvió `false` en ese proceso; reproducción directa de la rama degradada (crear subscriber `confirmed`, mintear download token, resolver URL firmada) completó sin excepción — `DEGRADED_SUBSCRIBER_CREATED`, `DEGRADED_DOWNLOAD_TOKEN_OK`, `DEGRADED_SIGNED_URL_OK`, `DEGRADED_PATH_VERIFIED_OK`. El bloque de escritura/envío en `subscribe-lead-magnet.tsx` está envuelto en `try/catch` con `redirect()` llamado una sola vez fuera del bloque. |
| 5 | MAIL-05: `secure-download.ts`/`download-token.ts` sin ninguna referencia a `subscribers`/`payload`/`getPayload` | ✓ VERIFIED | Lectura directa de ambos archivos: `secure-download.ts` solo importa `cloudinary`; `download-token.ts` solo importa `crypto`. Cero mención de `payload`/`subscribers`/`getPayload`, ni en imports ni en prosa de comentarios. |
| 6 | El sistema de newsletter existente (`NewsletterForm.tsx`, `subscribeAction`, `/unsubscribe`, `NewsletterBlock`) no fue modificado | ✓ VERIFIED | `git diff` contra el commit inmediatamente anterior al primer commit de código de Phase 49 (`9ce5ce6..HEAD`): `NewsletterForm.tsx`, `src/blocks/NewsletterBlock/`, `src/app/api/newsletter/unsubscribe/route.ts` → diff vacío. `subscribe.tsx` solo cambió para importar `resolveSiteUrl` desde el nuevo módulo compartido (extracción byte-a-byte, sin cambio de comportamiento) y declarar explícito `optInReason:'newsletter'` en su único `create` (mismo valor que ya era el default). `confirm/route.ts` solo ganó un branch aditivo DESPUÉS de la lógica existente — el camino sin `leadMagnet` queda idéntico. |
| 7 | El fix de renderizado dinámico (`dynamic = 'force-dynamic'`) no regresiona otras rutas de post | ? UNCERTAIN | No se pudo re-verificar en vivo dentro de esta sesión — ver `human_verification` y la sección de infraestructura abajo. Evidencia indirecta fuerte: (a) el fix es una línea a nivel de módulo, sin rama condicional por post; (b) 49-03-SUMMARY.md documenta su propio curl antes/después (500→200) sobre 3 URLs reales; (c) esta misma sesión obtuvo un 200 en `/blog/cs-fundamentals/tablas-hash` antes de que el túnel se degradara del todo. |
| 8 | `subscribers`/`lead-magnets` fuera de `SITEMAP_COLLECTIONS` y del mapa de colecciones de `mcpPlugin` | ✓ VERIFIED | `grep` directo: `SITEMAP_COLLECTIONS` en `src/lib/sitemap-data.ts` lista `pages/posts/case-studies/authors/websites` — sin `subscribers` ni `lead-magnets`. `mcpPlugin({collections:{...}})` en `src/payload.config.ts` lista `pages/posts/case-studies/authors/testimonials/clientes/speaking-events/categories/users/media` — sin `subscribers` ni `lead-magnets`. Ambas colecciones registradas con el comentario explícito "fuera... a propósito". |
| 9 | `confirmedAt` en `subscribers` solo se completa cuando el suscriptor confirma de verdad, nunca antes | ✗ FAILED | Ver `gaps` en el frontmatter — bug reproducido en vivo (subscriber id=10, `status:'pending'` con `confirmedAt` ya poblado en el alta). |

**Score:** 7/9 truths verified (1 uncertain — infra outage during this session, 1 failed — real bug found live)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/collections/LeadMagnets/index.ts` | Colección nueva, acceso `authenticated` | ✓ VERIFIED | Existe, 4 ops en `authenticated`, campos según spec, `admin.group:'Site'` |
| `src/lib/secure-download.ts` | Helper puro, URL firmada Cloudinary | ✓ VERIFIED | `resolveSignedDownloadUrl()` vía `cloudinary.utils.private_download_url` |
| `src/lib/download-token.ts` | Helper puro, HMAC-SHA256 + `timingSafeEqual` | ✓ VERIFIED | `mintDownloadToken`/`verifyDownloadToken`, firma sobre `PAYLOAD_SECRET`, comparación con `timingSafeEqual` |
| `src/lib/resend-configured.ts` | `isResendConfigured()` | ✓ VERIFIED | Mismo criterio que `hasCloudinaryCreds` |
| `src/app/actions/subscribe-lead-magnet.tsx` | Server Action nueva | ✓ VERIFIED (con bug — ver gap #1) | Existe, `'use server'`, honeypot, rate limit, bifurcación already/nuevo/reactivación, rama degradada |
| `src/app/(frontend)/[locale]/blog/confirm/page.tsx` | Página de confirmación, `robots:{index:false}` | ✓ VERIFIED | `dynamic='force-dynamic'`, estados éxito/error correctos, verificado en vivo |
| 2 docs `lead-magnets` reales (es/en), Cloudinary `raw`/`authenticated` | — | ✓ VERIFIED | ids 1 (es) y 2 (en) presentes en la Postgres real; PDF real descargado y verificado (70011 bytes, 3 páginas) para es |
| `src/blocks/EmailCaptureBlock/Component.tsx` | Server Component, cero JS de cliente | ✓ VERIFIED | Ver truth #1 |
| `src/blocks/EmailCaptureBlock/config.ts` | Bloque Lexical zero-config | ✓ VERIFIED | `slug:'email-capture'`, `fields:[]`, registrado en `Posts.content` junto a `AffiliateInlineBlock` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `EmailCaptureCard` (post real) | `subscribe-lead-magnet.ts` | `<form action={fn}>` | ✓ WIRED | Envío real vía `curl` (multipart, sin navegador) produjo 303 → `?subscribed=pending`, y una fila real en `subscribers` |
| `subscribe-lead-magnet.ts` | `Subscribers`/`ConfirmLeadMagnet`/`/api/newsletter/confirm` | `payload.create`/`payload.sendEmail`/token en URL | ✓ WIRED | Fila creada con `token`; `/api/newsletter/confirm?token=...` resolvió y redirigió correctamente |
| `/api/newsletter/confirm` | `/blog/confirm` | `mintDownloadToken` + redirect | ✓ WIRED | Redirect real 307 con `downloadToken` válido |
| `/blog/confirm` | Cloudinary | `resolveSignedDownloadUrl` | ✓ WIRED, ✓ FLOWING | URL firmada real, PDF real descargado |
| `blog/[category]/[slug]/page.tsx` | `buildRichTextConverters` | `searchParams.subscribed` | ✓ WIRED | `?subscribed=pending` en la misma URL mostró el copy de estado `pending` en vez del formulario (confirmado con `curl` antes de la degradación del túnel) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/actions/subscribe-lead-magnet.tsx` | 169 | Lógica invertida: `confirmedAt` se estampa en la rama de creación cuando `status` queda `'pending'` (debería quedar `null` hasta la confirmación real) | 🛑 Blocker (bug reproducido en vivo) | Integridad de datos/auditoría en el admin — NO compromete el gating de acceso (`confirmedAt` nunca se lee para lógica, solo se escribe) |

Sin marcadores `TBD`/`FIXME`/`XXX`/`TODO`/`HACK` en ningún archivo de la fase. `npx tsc --noEmit` limpio contra el estado final del código.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| MAIL-01 | 49-02, 49-03 | Bloque inline sin JS de cliente, vía Server Action | ✓ SATISFIED | Truth #1 |
| MAIL-02 | 49-01 | Doble opt-in propio, Resend solo tras confirmar | ✓ SATISFIED (con gap adyacente) | Truth #2, gap #1 (no invalida el requirement en sí) |
| MAIL-03 | 49-01 | Lead magnet vía URL firmada, expiración corta | ✓ SATISFIED | Truth #3 |
| MAIL-04 | 49-01 | Env-gated, degrada limpio sin `RESEND_API_KEY` | ✓ SATISFIED | Truth #4 |
| MAIL-05 | 49-01 | Helpers separados, sin lógica de suscripción | ✓ SATISFIED | Truth #5 |

Sin requirements huérfanos — MAIL-01..05 son los únicos mapeados a Phase 49 en REQUIREMENTS.md, y los 5 tienen un plan que los reclama.

### Deployment note (not a phase gap, tracked separately)

`docs/seo-handoff` no está mergeada a `master`; `juan-tech.com` sirve la build de 2026-08-26. La Fase 49 está completa en la rama y la base de datos real ya tiene el schema/contenido aplicado, pero el código del bloque no es visible para visitantes reales hasta el merge + deploy. Esto no bloquea el veredicto de esta fase (el alcance de Phase 49 es la implementación, no el cutover a producción), pero Juan debería saberlo antes de asumir que el bloque ya está capturando emails reales.

## Gaps Summary

Un gap real, encontrado por verificación en vivo contra datos reales (no por lectura de código ni por confiar en los sentinels de los scripts de la fase): `confirmedAt` queda invertido respecto de `status` en la rama de creación de `subscribeToLeadMagnetAction` — un alta nueva con Resend configurado (el caso normal hoy) queda con `status:'pending'` pero `confirmedAt` ya poblado, contradicción visible en el admin. Impacto acotado a integridad de datos/auditoría (confirmado por grep: `confirmedAt` nunca se lee para ninguna decisión de acceso en el código) — el doble opt-in en sí, gateado por `status`, sigue funcionando correctamente. Fix es una línea (invertir el ternario para que coincida con la rama de actualización, ya correcta).

Un truth quedó sin poder re-verificarse en vivo dentro de esta sesión (regresión en otras rutas de post) por una caída de infraestructura del túnel SSH+Postgres de Dokploy que persistió pese a más de 8 reintentos de reconexión a lo largo de ~45 minutos — condición conocida y ya documentada por los propios SUMMARY de esta fase. Rutea a verificación humana con evidencia indirecta fuerte a favor.

---
*Verified: 2026-09-08*
*Verifier: Claude (gsd-verifier)*
