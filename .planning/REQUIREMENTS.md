# Requirements: Milestone v2.1 — Monetización del Sitio (Research + Fundaciones)

**Defined:** 2026-08-13
**Core Value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO — tanto en el contenido como en la ejecución técnica (rendimiento y SEO impecables). Si el rendimiento o el SEO fallan, el sitio no cumple su propósito.

**Nota de encuadre:** este milestone construye el mecanismo de monetización correctamente y barato, para que esté en su lugar cuando el tráfico crezca — no para generar ingresos significativos hoy. El research modeló Amazon en $2-$9/mes con 1.000 visitas a la página de stack. Los programas que sí pagan (DinoRANK 10% recurrente, Kinsta 10% vitalicio, DigitalOcean 10%/12 meses) valen 10-50x por conversión, y ninguno exige tráfico alto.

## v2.1 Requirements

### Baseline de Regresión

- [ ] **BASE-01**: Existe un baseline de Lighthouse/CWV + H1 + JSON-LD + canonical/hreflang de las rutas críticas (Home, 4 landings de servicio, 2 geo, ambos locales) capturado **antes** de cualquier cambio renderizado, siguiendo el patrón REG-01/REG-02 de v1.7
- [ ] **BASE-02**: Existe un snapshot de Search Console (impresiones, clics, posición media) de esas mismas rutas, para poder distinguir después "la monetización diluyó el clúster de servicios" de estacionalidad
- [ ] **BASE-03**: El tráfico mensual real del sitio queda documentado con número, porque dos programas (Semrush, Hostinger afiliados) se gatean en ~1.000 visitas únicas y el modelo de ingresos se parametriza sobre ese valor

### Decisiones y Postulaciones

- [ ] **DEC-01**: El estado real de la cuenta de Amazon Associates queda documentado junto con el plan de reactivación — la cuenta se cerró por no alcanzar las 3 ventas calificadas, y la reactivación exige el disclosure ya publicado
- [ ] **DEC-02**: El modelo de ingresos queda escrito con la multiplicación explícita (tasa de Amazon 2,50% en componentes de PC, CTR de link, conversión de compra, ventana de cookie de 24h), no como una estimación vaga
- [ ] **DEC-03**: La decisión de plataforma de pago queda registrada — Polar como merchant of record, motivada por que Stripe no opera en Perú y por que un vendedor establecido en Perú no tiene umbral de IVA europeo — con la cuenta abierta y cero código escrito en este milestone
- [ ] **DEC-04**: Existe una lista priorizada de programas de afiliados con orden de postulación (DinoRANK → DigitalOcean → Kinsta), umbrales de aceptación, y la lista explícita de los que no tienen programa usable (Cloudflare, Cloudinary, Resend, Payload, Neon, Cursor, Claude, Ahrefs)
- [ ] **DEC-05**: Quedan descartadas por escrito las mitigaciones equivocadas que la asesoría popular recomienda: subdominio de afiliados, `noindex` en páginas de ingresos, banner de cookies, y Amazon FBA

### Legal y Disclosure

- [ ] **LEG-01**: Un componente de disclosure bilingüe se renderiza **antes** del primer link de afiliado en orden del DOM, con la copia en `messages/{es,en}.json` y no en contenido del CMS
- [ ] **LEG-02**: La frase textual de Amazon ("As an Amazon Associate I earn from qualifying purchases." y su versión en español) aparece donde haya links de Amazon
- [ ] **LEG-03**: `/privacy` queda actualizada cubriendo el formulario de email, Resend como encargado del tratamiento, retención de datos y proceso de baja
- [ ] **LEG-04**: Queda escrita como restricción del milestone la prohibición de cualquier tracking que dispare consentimiento — sin GA4, sin píxeles, sin IDs de clic por usuario, sin `document.cookie`/`localStorage` en la ruta de afiliado

### Sistema de Links de Afiliado

- [ ] **AFF-01**: Existe la colección `affiliate-links` con la matriz de localización campo por campo **congelada y aprobada antes de cargar cualquier contenido** — prosa localizada, identificadores y URLs no
- [ ] **AFF-02**: Los destinos por mercado viven en un array NO localizado con clave `marketplace`, resueltos en render por una función pura `pickDestination()` en `src/lib/affiliate.ts`
- [ ] **AFF-03**: El componente `AffiliateLink` emite `rel="sponsored nofollow noopener"` estructuralmente desde el código — nunca como campo editable en el CMS, nunca a criterio del editor
- [ ] **AFF-04**: Los links de Amazon se renderizan directos y sin cloaking, con el `tag=` visible y sin `referrerPolicy` override, cumpliendo la prohibición textual de Redirecting Links de las Program Policies
- [ ] **AFF-05**: Las lecturas pasan por un único `getCachedAffiliateLinks()` con `overrideAccess: false`, con cache tags y hooks de revalidación
- [ ] **AFF-06**: La migración de esquema es puramente aditiva (`CREATE TABLE`/`ADD COLUMN`), leída antes de aplicarse contra la base real

### Ruta de Redirección

- [ ] **GO-01**: `/go/[slug]` responde 302 en runtime Node con `no-store`, leyendo el destino exclusivamente del documento autorizado en el admin — nunca de un parámetro `?to=`
- [ ] **GO-02**: El matcher de `src/middleware.ts` excluye `/go` escrito como `go/` **con barra** (el lookahead matchea por prefijo, no por segmento: un `go` pelado se llevaría puestos `/gobierno`, `/golang-para-seo` y cualquier slug futuro que empiece con esas letras), verificado por curl contra rutas control (`/`, `/en`, `/servicios`, `/en/services`, `/blog`) más al menos un slug señuelo que empiece con "go" — sin este fix cada clic de afiliado devuelve 404
- [ ] **GO-03**: `src/app/robots.ts` incluye `Disallow: /go`
- [ ] **GO-04**: Los clics se registran en una tabla `affiliate-clicks` append-only escrita vía `after()` después de emitir el redirect, con descarte de bots y el throttle por IP ya usado en `contact.ts`

### Página de Stack

- [ ] **STACK-01**: Existe un bloque `ToolStack` y la página `/stack` servida en ambos locales bajo un segmento único, sin tocar `sitemap-data.ts`, `canonical.ts` ni `breadcrumbs.ts`
- [ ] **STACK-02**: Cada herramienta listada tiene al menos 100 palabras de experiencia propia y de primera mano en cada locale, sin copy de fabricante ni tablas de especificaciones
- [ ] **STACK-03**: La página incluye un bloque "qué elegiría hoy si empezara de cero", ausente en las cinco páginas de referencia estudiadas
- [ ] **STACK-04**: La página incluye al menos una recomendación destacada que no paga comisión y negativos honestos sobre las herramientas listadas
- [ ] **STACK-05**: La página se enlaza desde el footer y la página de autor, y **no** desde el nav principal, para no diluir el clúster de servicios que ya rankea
- [ ] **STACK-06**: Cada herramienta enlaza al case study o la página de servicio donde Juan la usó realmente, convirtiendo el riesgo de dilución en refuerzo del clúster

### Links Inline en Contenido

- [ ] **INL-01**: Existe un inline block de afiliado usable dentro del rich text de Posts, emitiendo el mismo `rel` estructural y sin migración de esquema
- [ ] **INL-02**: El disclosure se inyecta automáticamente en cualquier post que contenga links de afiliado, detectado por un escaneo puro del estado del editor y sin consulta extra

### Captura de Email

- [ ] **MAIL-01**: Existe un bloque de captura de email inline (nunca popup ni modal), resuelto con Server Action y sin JavaScript de cliente
- [ ] **MAIL-02**: El doble opt-in está implementado en el propio sitio (Resend no lo trae), y Resend solo recibe direcciones ya confirmadas
- [ ] **MAIL-03**: El lead magnet se entrega vía URL firmada de Cloudinary con expiración corta, no como archivo público
- [ ] **MAIL-04**: El flujo está env-gated y degrada limpio sin `RESEND_API_KEY` real — el suscriptor se registra y el magnet se entrega aunque falte la credencial
- [ ] **MAIL-05**: `secure-download.ts` y `download-token.ts` quedan como helpers separados, para que la tienda de v2.2 sea una adición y no una reescritura

### Gate de Cierre

- [ ] **GATE-01**: Paridad verificada contra el baseline: sin caída de más de 5 puntos de performance, sin cruce de banda de CWV, no más de 5 KB de JavaScript de cliente agregado, delta de CLS 0.00
- [ ] **GATE-02**: Aserciones específicas del milestone: cero anchors a dominios de afiliado sin `sponsored`; el disclosure precede al primer anchor de afiliado en orden del DOM; ambos locales resuelven a un destino no vacío y distinto; grep confirma que todo `payload.find(` lleva `overrideAccess: false` o una exención documentada

## v2.2 Requirements

Diferidos. Reconocidos pero fuera de este roadmap.

### Productos Digitales

- **PROD-01**: Colección de productos digitales en Payload
- **PROD-02**: Checkout vía Polar (hosted redirect, cero JS de cliente)
- **PROD-03**: Route handler de webhook con verificación de firma e idempotencia
- **PROD-04**: Registro de órdenes y entrega segura reutilizando los helpers de MAIL-05
- **PROD-05**: Primer producto real — el research recomienda la implementación de referencia Next.js + Payload con SEO ($79-199) como la única genuinamente no copiable

### Contenido Comercial

- **CONT-01**: Keyword research de términos comerciales en ES y EN
- **CONT-02**: Estructura de contenido de comparativas y reviews, con la profundidad que exige la política de afiliación fina de Google
- **CONT-03**: Postulación a Semrush y Hostinger afiliados una vez confirmado el umbral de ~1.000 visitas mensuales

### Amazon FBA

- **FBA-01**: Evaluación de marca propia de accesorios con números reales (márgenes, capital, competencia) — negocio aparte, no una feature del sitio

## Out of Scope

| Feature | Razón |
|---------|-------|
| Amazon FBA | Es un negocio de inventario y logística con capital propio, no una feature de la web. Diferido a milestone futuro con evaluación propia |
| Stripe (directo, Managed Payments, `plugin-stripe`, `plugin-ecommerce`) | Stripe no opera en Perú — verificado contra `stripe.com/global`, en LATAM solo Brasil y México |
| Lemon Squeezy | SDK congelado desde 2024-11-05 y su camino declarado es converger a Stripe Managed Payments, que Perú no alcanza. Sería construir una integración que ya se sabe que hay que rehacer |
| Gumroad | ~12,9% + $0,80 efectivo, peor integración y sin ventaja compensatoria |
| GA4 / Google Tag Manager | El loader de GA4 pesa 419.047 bytes medidos. Contradice el presupuesto de performance y dispararía consentimiento |
| Cualquier tracker de afiliados del lado del cliente | Mismo motivo, más el sesgo de ad-blockers en una audiencia de devs y SEOs |
| Popups y modales de captura de email | Destrozan CLS/INP en un sitio que ya corre un shader WebGL en el hero |
| Publicidad display, posts patrocinados de terceros | Patrón canónico de afiliación fina y de abuso de reputación del sitio |
| Cloaking de links de Amazon vía `/go/` | Prohibido textualmente por las Program Policies de Amazon (2026-04-14). Sanción: terminación más pérdida de comisiones acumuladas |
| Subdominio de afiliados o `noindex` en páginas de ingresos | La documentación de Google advierte que mover a subdominio "puede parecer un intento de eludir las políticas de spam". Sería contraproducente |
| Banner de consentimiento de cookies | Se diseña para no necesitarlo nunca. Un 302 agregado y sin cookies queda fuera del art. 5(3) de ePrivacy |
| Tablas de precios por herramienta, roundups de "las 25 mejores", ordenar por comisión | Patrones de afiliación fina que arrastran el sitio entero desde que HCU se fusionó con el core en marzo 2024 |
| Checklist genérico de SEO como producto | Commoditizado a $0 — Aleyda Solis regala un equivalente sin gate |
| `subscribers`, `affiliate-clicks`, `lead-magnets` en el mapa de colecciones de `mcpPlugin` | `subscribers` filtraría emails por MCP |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BASE-01 | Phase 45 | Pending |
| BASE-02 | Phase 45 | Pending |
| BASE-03 | Phase 45 | Pending |
| DEC-01 | Phase 44 | Pending |
| DEC-02 | Phase 44 | Pending |
| DEC-03 | Phase 44 | Pending |
| DEC-04 | Phase 44 | Pending |
| DEC-05 | Phase 44 | Pending |
| LEG-01 | Phase 46 | Pending |
| LEG-02 | Phase 46 | Pending |
| LEG-03 | Phase 46 | Pending |
| LEG-04 | Phase 46 | Pending |
| AFF-01 | Phase 46 | Pending |
| AFF-02 | Phase 46 | Pending |
| AFF-03 | Phase 46 | Pending |
| AFF-04 | Phase 46 | Pending |
| AFF-05 | Phase 46 | Pending |
| AFF-06 | Phase 46 | Pending |
| GO-01 | Phase 47 | Pending |
| GO-02 | Phase 47 | Pending |
| GO-03 | Phase 47 | Pending |
| GO-04 | Phase 47 | Pending |
| STACK-01 | Phase 48 | Pending |
| STACK-02 | Phase 48 | Pending |
| STACK-03 | Phase 48 | Pending |
| STACK-04 | Phase 48 | Pending |
| STACK-05 | Phase 48 | Pending |
| STACK-06 | Phase 48 | Pending |
| INL-01 | Phase 48 | Pending |
| INL-02 | Phase 48 | Pending |
| MAIL-01 | Phase 49 | Pending |
| MAIL-02 | Phase 49 | Pending |
| MAIL-03 | Phase 49 | Pending |
| MAIL-04 | Phase 49 | Pending |
| MAIL-05 | Phase 49 | Pending |
| GATE-01 | Phase 50 | Pending |
| GATE-02 | Phase 50 | Pending |

**Coverage:**
- v2.1 requirements: 37 total
- Mapped to phases: 37 ✓
- Unmapped: 0

**Por fase:**

| Phase | Requirements | Total |
|-------|--------------|-------|
| Phase 44 — Decisiones de Monetización | DEC-01..05 | 5 |
| Phase 45 — Baseline de Regresión ⚠️ BLOQUEADA | BASE-01..03 | 3 |
| Phase 46 — Disclosure Legal + Esquema de Links de Afiliado | LEG-01..04, AFF-01..06 | 10 |
| Phase 47 — Ruta /go + Fix de Middleware + Registro de Clics | GO-01..04 | 4 |
| Phase 48 — Página de Stack + Links Inline en Contenido | STACK-01..06, INL-01, INL-02 | 8 |
| Phase 49 — Captura de Email (Resend, env-gated) | MAIL-01..05 | 5 |
| Phase 50 — Gate de Cierre de Monetización | GATE-01, GATE-02 | 2 |

**⚠️ Phase 45 bloqueada por infraestructura (2026-08-13):** los 3 requirements BASE no se pueden ejecutar hasta que se resuelvan dos dependencias externas — (a) Neon caído (`read ECONNRESET` en endpoint directo y `-pooler`, "TCP 5432 unreachable" registrado desde antes de este milestone), sin el cual no renderiza ninguna página y no hay Lighthouse posible; (b) juan-tech.com no está dado de alta como proyecto en Ahrefs, la única vía a Search Console disponible en sesión — alternativa: Juan pega los números de GSC a mano.

**Es un gate duro, no un ítem posponible.** El valor entero del baseline es ser una medición *previa*: si corre después de que las Phases 46-49 cambiaron el sitio, ya no mide nada y la Phase 50 se queda sin contra qué comparar. Ninguna fase que cambie un byte renderizado puede empezar antes de que Phase 45 cierre. Si Neon sigue caído cuando Phase 44 termine, el milestone se detiene ahí a propósito.

**Efecto sobre DEC-02:** el modelo de ingresos se escribe paramétrico sobre `V` (tráfico mensual), con los tramos ya calculados para V=1.000 y V=10.000. `V` se reemplaza por el número real en Phase 45 sin rehacer el documento.

---
*Requirements defined: 2026-08-13*
*Last updated: 2026-08-13 — roadmap reestructurado: decisiones (Phase 44) separadas del baseline (Phase 45, bloqueada por Neon + GSC); fases posteriores renumeradas 46-50; 37/37 requirements mapeados*
