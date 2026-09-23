# Phase 50 Plan 02: GATE-02 — Veredicto de Cierre de Monetización (Afiliación)

**Fecha:** 2026-09-10
**Fuente de datos:** `50-affiliate-crawl.json` (crawl HTML real + grep de código) + grep directo de `src/lib/cache.ts`, `src/lib/sitemap-data.ts`, `src/payload.config.ts`.

## GATE-02: PASS

Las 5 aserciones de GATE-02 (ROADMAP Phase 50, Success Criteria 2-4) se cumplen sobre HTML/HTTP real y grep de código real. Con una salvedad crítica de alcance documentada abajo (Hallazgo 0).

---

## Hallazgo 0 (crítico, de alcance — no es un FAIL de GATE-02 en sí)

**El crawl no se pudo hacer contra `https://juan-tech.com` como pedía el plan, porque el código de Phases 46-49 nunca se desplegó a producción.**

Verificado empíricamente:
- `curl https://juan-tech.com/stack` → HTTP 404 (dos intentos, no transitorio)
- `curl https://juan-tech.com/go/dinorank` → HTTP 404 (misma respuesta que un slug inexistente, pero porque la ruta `/go/[slug]` no existe en el build desplegado, no por la lógica de negocio de la ruta)
- El worktree de ejecución (rama `docs/seo-handoff`, HEAD real con todo el trabajo de Phases 44-50) está **106 commits por delante** de `master`
- Dokploy despliega únicamente desde `master` (memoria del proyecto: "Deploy: Dokploy auto al mergear a master")
- La Postgres real de Dokploy SÍ tiene el schema y el contenido (migraciones se aplicaron directo vía túnel SSH, independiente del deploy del código) — confirmado `pages.stack` publicado, 7 docs reales en `affiliate-links`, 1 post real con `affiliate-inline`

Este mismo problema ya ocurrió y se resolvió con el mismo patrón en Phase 48.5-03 ("Verificación contra dev server local vía túnel SSH, nunca contra producción, porque /stack (Phase 48) no llegó a master todavía").

**Fix aplicado (Rule 3, blocking issue con precedente ya establecido en este repo):** se corrió `next build` + `next start` local en este worktree (HEAD real de `docs/seo-handoff`) contra la Postgres **real** de Dokploy vía túnel SSH, sirviendo en `localhost:3877`. El HTML crawleado es HTML real renderizado por código real contra datos reales de producción — cumple el requisito de 50-CONTEXT.md de "verificado sobre HTML renderizado real, nunca por lectura de código" — pero **no es HTML servido hoy por el dominio público**, porque ese dominio todavía no ejecuta este código.

**Implicación para 50-03 y para Juan:** GATE-02 tal como se mide aquí certifica que el código, **una vez desplegado**, cumple las 5 aserciones. No certifica que `juan-tech.com` las cumple *hoy*, porque hoy no sirve ninguna de las superficies de Phases 46-49. El milestone v2.1 completo (Phases 44-49) sigue sin mergear a `master` / desplegar a producción. Esto es información que 50-03 debe propagar al veredicto de cierre del milestone — el gate técnico pasa, pero el deploy real sigue pendiente.

---

## Aserción 1: Cero anchors de afiliado sin `sponsored`

**PASS.**

| Superficie | Locale | Anchors de afiliado | Con `rel="sponsored nofollow noopener"` exacto |
|---|---|---|---|
| `/stack` | es | 19 (9 tools + gear Amazon) | 19/19 |
| `/stack` | en | 19 | 19/19 |
| Post `guia-keyword-research` (`affiliate-inline`, DinoRANK) | es | 1 (`/go/dinorank`) | 1/1 |
| Post `guia-keyword-research` (`affiliate-inline`, DinoRANK) | en | 1 (`/go/dinorank`) | 1/1 |

Grep de verificación (0 resultados esperados y obtenidos, ambos locales de `/stack`):
```
grep -oE '<a [^>]*href="[^"]*"[^>]*>' <html> \
  | grep -iE 'amazon|hostinger|kinsta|dinorank|digitalocean|dataforseo|ahrefs\.com|resend\.com|cloudinary\.com|payloadcms\.com' \
  | grep -v 'rel="sponsored nofollow noopener"'
```
→ sin salida en ambos locales.

**Controles negativos confirmados sin `sponsored`** (producto propio, por diseño — Phase 48.5):
- `AuditorHighlight` (Home): `<a href="https://auditor.juan-tech.com" rel="noopener">`
- `AuditorCallout` (landing SEO Técnico): `<a href="https://auditor.juan-tech.com" rel="noopener">`
- `noCommissionPick` (Google Search Console, en `/stack`): `<a href="https://search.google.com/search-console" rel="noopener">`
- `EmailCaptureCard` → `/privacy` (post `technical-seo-checklist`): sin atributo `rel`, sin `AffiliateLink`

---

## Aserción 2: Disclosure precede al primer anchor de afiliado en orden del DOM

**PASS**, todas las superficies donde ambos coexisten.

| Superficie | Locale | Offset disclosure (`role="note"`) | Offset primer anchor afiliado | Orden correcto |
|---|---|---|---|---|
| `/stack` | es | 9725 | 13059 | ✓ |
| `/stack` | en | 9741 | 12925 | ✓ |
| Post `guia-keyword-research` | es | 15782 | 17914 | ✓ |
| Post `guia-keyword-research` | en | 15636 | 17632 | ✓ |

---

## Aserción 3: Ningún link de Amazon pasa por `/go/`

**PASS — satisfecha de forma vacua por diseño, no por accidente.**

- 0 de 7 docs reales en `affiliate-links` tiene `program: 'amazon'`. Amazon en este sitio se renderiza **siempre directo** vía `GearCard` (hardcoded en `/stack`, `rel="sponsored nofollow noopener"` confirmado arriba), nunca vía `affiliate-links`/`/go/` — consistente con Phase 46/47 (Amazon Program Policies 2026-04-14 prohíben redirecting links).
- Confirmado también en runtime: no existe ningún slug Amazon que probar contra `/go/`, y el propio contrato del route handler (`pickDestination` sin match → 404 genérico, nunca 500 ni open redirect) ya está probado contra el caso real más cercano (`google-search-console`, activo pero con `destinations: []`).

---

## Aserción 4: Paridad de locales por dato

**PASS.**

- `/go/[slug]` vive fuera de `[locale]` (confirmado en 47-CONTEXT.md) — no existe `/en/go/<slug>`; el handler resuelve `locale='es'` fijo por diseño porque `slug`/`active`/`destinations`/`program` no están localizados. La paridad de locales para esta superficie no aplica a la ruta en sí.
- Aplica en su lugar a: (a) `destinations[]` con URLs distintas por `marketplace` dentro del mismo doc — confirmado: `dataforseo` tiene 3 marketplaces (`default`/`platform`/`sheets`) con URLs distintas, `dinorank` tiene 2 (`default`/`registro`); y (b) el copy del disclosure de Amazon variando por locale — confirmado en `messages/es.json`/`en.json`: ES "Como Afiliado de Amazon, obtengo ingresos por las compras que califican." vs EN "As an Amazon Associate I earn from qualifying purchases." — distintos, nunca idénticos accidentalmente.
- Los 6 slugs activos con destino real resuelven 302 con `Location` no vacío, verificado 1:1 contra el dato crudo del doc (`ahrefs`→ahrefs.com, `resend`→resend.com, `cloudinary`→cloudinary.com/invites/..., `payload`→payloadcms.com, `dataforseo`→dataforseo.com/?aff=..., `dinorank`→dinorank.com/?afid=...).
- El único doc sin destino real (`google-search-console`, `destinations: []`) nunca se renderiza vía `/go/` en ningún flujo real (ver Hallazgo de higiene de datos abajo) — su 404 es comportamiento correcto del route handler, no un link roto expuesto a un usuario.

---

## Aserción 5: `overrideAccess: false` + exclusión de colecciones privadas

**PASS.**

- `src/lib/cache.ts`: 13 llamadas `payload.find(`/`findByID(`/`findGlobal(`, 12/13 con `overrideAccess: false` explícito. La única excepción (`getCachedFeaturedContent`, línea 66) tiene una exención documentada y verificada: `featured-content` no tiene `versions`/drafts (no hay estado borrador que filtrar), y el `access` por defecto de Payload para globals sin bloque `access` explícito ya deniega lectura no autenticada — el propio comentario del código documenta que agregar `overrideAccess:false` ahí rompió Home en producción con 500 hasta que se quitó. **No es un gap** (Pitfall 3 de 50-RESEARCH.md, verificado).
- `SITEMAP_COLLECTIONS` (`src/lib/sitemap-data.ts`): `pages`, `posts`, `case-studies`, `authors`, `websites` — 0 coincidencias de `subscribers`/`affiliate-clicks`/`lead-magnets`.
- `mcpPlugin` (`src/payload.config.ts`): colecciones `pages`, `posts`, `case-studies`, `authors`, `testimonials`, `clientes`, `speaking-events`, `categories`, `users`, `media`; globals `llms`, `header`, `footer`, `featured-content`, `blog-promo` — 0 coincidencias de `subscribers`/`affiliate-clicks`/`lead-magnets`.

---

## Hallazgo de higiene de datos (no bloqueante)

`affiliate-links` doc `google-search-console` tiene `destinations: []` pese a `active: true`. No es un link roto expuesto: se usa exclusivamente como `noCommissionPick` en `/stack`, cuyo `linkHref` está hardcodeado a `https://search.google.com/search-console` en `ToolStackComponent.tsx` cuando `program === 'google-search-console'`, ignorando por completo `destinations[]`. `/go/google-search-console` (si alguien lo visitara a mano) da 404 idéntico a un slug inexistente — comportamiento correcto, sin enumeración posible. Recomendación no bloqueante: limpiar o documentar el campo `destinations` vacío en ese doc específico.

---

## Cobertura completa

Ninguna superficie quedó sin verificar por falta de contenido real — ambas Open Questions del research se resolvieron con datos reales (0 docs Amazon, 1 post con `affiliate-inline`), y ese post real se crawleó en ambos locales.

## Veredicto

**GATE-02: PASS**

Con la salvedad de alcance documentada en el Hallazgo 0: el gate certifica el código tal como existe en `docs/seo-handoff`, no lo que `juan-tech.com` sirve hoy (que sigue en el build de `master`, previo al milestone v2.1). El deploy real (merge a `master`) queda como acción pendiente fuera del alcance de esta fase de medición.
