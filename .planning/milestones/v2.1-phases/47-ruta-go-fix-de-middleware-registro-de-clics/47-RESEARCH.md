# Phase 47: Ruta /go + Fix de Middleware + Registro de Clics - Research

**Researched:** 2026-09-04
**Domain:** Next.js 15 middleware matcher semantics, Node-runtime route handler redirects, Payload Local API append-only writes, bot/IP throttling
**Confidence:** HIGH

## Summary

Esta fase es pequeña y quirúrgica: una línea nueva en el matcher de `src/middleware.ts`, un route handler `/go/[slug]` en runtime Node, una entrada en `robots.ts`, y una tabla `affiliate-clicks` append-only escrita vía `after()`. Todo el código que la fase necesita leer ya existe y fue leído completo en esta sesión: la colección `affiliate-links` (Phase 46, ya mergeada a `docs/seo-handoff`, 13 campos confirmados en `payload-types.ts`), `pickDestination()` (función pura sin acceso a DB), `getCachedAffiliateLinks()` (cache pública que ya aplica el gate `active: true` a través de `overrideAccess: false`, sin necesidad de un filtro manual), y dos route handlers Node-runtime recientes (`newsletter/confirm`, `newsletter/unsubscribe`) que fijan el patrón exacto a seguir para el nuevo handler.

El hallazgo más importante de esta investigación es una corrección a un supuesto del CONTEXT.md: `contact.ts` **no tiene detección de bots por user-agent** — tiene un honeypot de formulario (un campo oculto que un bot rellena y un humano no), que es un mecanismo específico de formularios HTML y no aplica a un GET a `/go/[slug]` sin formulario. Lo único reusable verbatim de `contact.ts` es el patrón de throttle por IP (`Map<string, number[]>` a nivel de módulo, ventana de tiempo, límite de intentos). La detección de bots para `/go/[slug]` tiene que ser nueva: sniffing de `User-Agent` contra una lista de patrones de bot conocidos. Esto no bloquea la fase — es una pieza nueva y pequeña — pero el plan no puede tratarlo como "copiar función de contact.ts" tal cual dice el CONTEXT.md; hay que separarlo en dos utilidades.

El segundo hallazgo es sobre el matcher: el matcher real y actual de `src/middleware.ts` **ya no es** el que cita el ROADMAP como ejemplo del fix (`'/((?!api|admin|go/|_next|_vercel|.*\\..*).*)'`) — ese patrón genérico `.*\\..*` fue reemplazado por una fase posterior (SEO-39) por una lista explícita y finita de exclusiones (`robots\.txt`, `sitemap\.xml`, `favicon.ico`, etc., ver línea 144 del archivo real). El fix de esta fase debe insertar `go/` dentro de esa alternancia real, no reescribir la línea del ROADMAP verbatim — sería una regresión del fix de SEO-39.

**Primary recommendation:** Insertar `go/` (con barra) en la alternancia real del matcher existente (línea 144), construir `/go/[slug]/route.ts` con `runtime = 'nodejs'` siguiendo el patrón exacto de `newsletter/confirm/route.ts`, resolver el destino exclusivamente vía `getCachedAffiliateLinks()` + `pickDestination()`, y usar `after()` (estable desde Next 15.1, confirmado contra la documentación oficial) para la escritura a `affiliate-clicks` sin bloquear la respuesta 302.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Resolución de slug → destino | API / Backend (Route Handler, runtime Node) | Database (Postgres vía Local API) | El destino nunca puede depender de `?to=` (GO-01) — solo el backend, leyendo el documento admin, decide el target |
| Fix del matcher (exclusión de `/go`) | Frontend Server (Edge Middleware) | — | `next-intl`'s `createIntlMiddleware` corre en el Edge runtime del middleware; el matcher es la única superficie que decide si una request entra a esa reescritura |
| `robots.txt` Disallow | CDN / Static (route handler estático de metadata) | — | `src/app/robots.ts` genera un `MetadataRoute.Robots` servido como archivo estático de metadata, sin lógica de negocio |
| Registro de clics (`affiliate-clicks`) | API / Backend (Local API write vía `after()`) | Database (Postgres, tabla nueva) | Escritura fire-and-forget después de emitir la respuesta — no puede pesar en la latencia del 302 (GO-04) |
| Descarte de bots / throttle por IP | API / Backend (mismo route handler) | — | Debe evaluarse ANTES de la escritura, dentro del mismo request, sin estado compartido fuera del proceso Node persistente (mismo criterio que `contact.ts`) |

## User Constraints

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**`/go` sin slug**
- `/go` pelado (sin slug) responde **404**. No hay a dónde mandar a alguien que pega la ruta pelada — no existe página de stack todavía (Phase 48) — y un 404 no agrega lógica extra que nadie va a ejercitar.

### Claude's Discretion
- Estructura interna exacta del handler de `/go/[slug]` (route handler vs. middleware rewrite), mientras cumpla runtime Node + `no-store` + lectura exclusiva del documento admin.
- Forma exacta de reusar la detección de bots y el throttle por IP de `contact.ts` (copiar función vs. extraer a util compartido) — decisión de implementación, no de producto.
- Nombre exacto de los campos de `affiliate-clicks` más allá de lo que ya fija GO-04 (append-only, slug, timestamp, descartar bots/throttle).

### Deferred Ideas (OUT OF SCOPE)
- Arreglar el mismo bug de matcher por prefijo en `api`/`admin` — follow-up explícito, fuera de esta fase.
- Página `/stack` y links inline en contenido — Phase 48.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GO-01 | `/go/[slug]` responde 302 en runtime Node con `no-store`, leyendo el destino exclusivamente del documento autorizado en el admin — nunca de un parámetro `?to=` | Ver "Code Examples" — patrón exacto de `newsletter/confirm/route.ts` (`runtime = 'nodejs'`, `getPayload({config})`, `NextResponse.redirect`) + `getCachedAffiliateLinks()`/`pickDestination()` ya construidos en Phase 46 |
| GO-02 | El matcher de `src/middleware.ts` excluye `/go` escrito como `go/` con barra, verificado por curl contra rutas control | Ver "Pitfall 1" — matcher real citado línea por línea (línea 141-146), fix exacto a aplicar documentado |
| GO-03 | `src/app/robots.ts` incluye `Disallow: /go` | Ver "Code Examples" — `robots.ts` completo leído, `disallow` actual es `['/admin', '/api']` |
| GO-04 | Los clics se registran en `affiliate-clicks` append-only escrita vía `after()`, con descarte de bots y el throttle por IP ya usado en `contact.ts` | Ver "Pitfall 2" — corrección del supuesto de bot-detection de `contact.ts`; ver "Code Examples" — patrón de throttle por IP y patrón `after()` |
</phase_requirements>

## Standard Stack

### Core
Ninguna librería nueva. Todo lo que esta fase necesita ya es dependencia directa del proyecto:

| Capability | API usada | Paquete (ya instalado) | Por qué no hace falta nada nuevo |
|---|---|---|---|
| Redirect 302 sin cache | `NextResponse.redirect()` | `next` 15.4.11 (dependencia raíz) | API nativa de Route Handlers, ya usada en `newsletter/*` |
| Trabajo diferido post-respuesta | `after()` de `next/server` | `next` 15.4.11 | Estable desde Next 15.1 (no experimental) — confirmado contra la documentación oficial `after.mdx`, ver Sources |
| Lectura/escritura del documento admin | Payload Local API (`getPayload`, `payload.create`, `payload.find`) | `payload` 3.85.2 (pineado) | Mismo Local API que usan `contact.ts` y `newsletter/*` |
| Migración de tabla nueva | `payload migrate:create` / `payload migrate` | `payload` 3.85.2 CLI | Mismo flujo que Phase 46, sin script npm dedicado — se invoca el binario directo (ver "Code Examples") |

### Supporting
No aplica — no hay librerías de soporte nuevas para esta fase.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Route Handler `/go/[slug]/route.ts` en runtime Node | Rewrite dentro de `src/middleware.ts` mismo | Rechazado: el middleware de este proyecto corre en Edge runtime (ver comentario líneas 6-24 de `middleware.ts` — `nodejs` middleware requiere Next canary, y el proyecto está pineado a 15.4.11 stable porque `@payloadcms/next@3.85.2` excluye 15.5.x+). Un Route Handler siempre corre en Node por defecto, sin ese problema. |
| `after()` para la escritura de clics | Escribir el `create()` de forma síncrona antes del redirect | Rechazado: bloquearía la respuesta 302 con una escritura a DB, violando el requisito de la fase ("el clic queda registrado sin pesar en la respuesta") |

**Installation:**
```bash
# Ninguna — no hay paquetes nuevos que instalar en esta fase.
```

**Version verification:** No aplica (sin paquetes nuevos). `payload` real instalado: `3.85.2` (confirmado en `package.json`, lockstep con el resto del proyecto). `next`: `15.4.11` (confirmado en `package.json` — nota: distinto del `15.5.20` que documenta `CLAUDE.md`/`STACK.md` como recomendación; el repo real está pineado más abajo por la exclusión de peerDependencies de `@payloadcms/next`, ya documentado en el comentario de `middleware.ts`).

## Package Legitimacy Audit

No aplica — esta fase no instala ningún paquete nuevo. Todo el código usa APIs ya presentes en `next`/`payload`, ambos ya auditados en fases anteriores del proyecto.

## Architecture Patterns

### System Architecture Diagram

```
Clic del visitante en un link "/go/notion"
        │
        ▼
┌───────────────────────────────────────────────┐
│ src/middleware.ts (Edge runtime)               │
│  1. pathname === '/es'? → 308 (sin tocar)      │
│  2. fetch loopback a /api/redirects-lookup     │
│     (no matchea nada para /go/*, sigue)        │
│  3. matcher decide si next-intl toca la ruta:  │
│     con "go/" excluido → NO entra a            │
│     createIntlMiddleware → pasa intacta        │
└───────────────────────────────────────────────┘
        │  (sin rewrite de locale)
        ▼
┌───────────────────────────────────────────────┐
│ src/app/go/[slug]/route.ts (runtime Node)      │
│  1. Bot check (User-Agent) → 404 si bot        │
│  2. Throttle por IP → 404/302-sin-registro     │
│     si excede ventana                          │
│  3. getCachedAffiliateLinks('es')              │
│     .find(doc => doc.slug === params.slug)     │
│  4. doc no existe / active:false → 404         │
│     (mismo código que slug inexistente —       │
│     no filtra cuál de los dos pasó)            │
│  5. pickDestination(doc.destinations, ...)     │
│  6. NextResponse.redirect(target, {302,        │
│     no-store}) — se envía YA                   │
│  7. after(() => payload.create({               │
│       collection: 'affiliate-clicks', ... }))  │
└───────────────────────────────────────────────┘
        │
        ▼
   302 al visitante (ya enviado antes del paso 7)
        │
        ▼ (async, no bloquea)
┌───────────────────────────────────────────────┐
│ Postgres — tabla affiliate_clicks (append-only)│
└───────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── app/
│   ├── go/
│   │   └── [slug]/
│   │       └── route.ts        # GO-01, runtime Node, no-store
│   └── robots.ts                # GO-03, agregar '/go' al disallow[]
├── collections/
│   └── AffiliateClicks/
│       └── index.ts             # GO-04, colección append-only nueva
├── lib/
│   ├── affiliate.ts             # YA EXISTE (pickDestination, Phase 46) — sin tocar
│   ├── bot-detection.ts         # NUEVO — sniffing de User-Agent (no existe hoy en el repo)
│   └── ip-throttle.ts           # NUEVO (o inline en route.ts) — extraído del patrón de contact.ts
├── migrations/
│   └── <timestamp>_affiliate_clicks_collection.ts  # generado por payload migrate:create
└── middleware.ts                 # GO-02, una línea nueva en el matcher (línea 144)
```

### Pattern 1: Route Handler Node-runtime que redirige leyendo del Local API
**What:** Un `GET` en un Route Handler dinámico, forzado a `runtime = 'nodejs'`, que resuelve un documento vía Payload y responde con `NextResponse.redirect`.
**When to use:** Cualquier redirect que necesite el driver de Postgres (Edge no soporta `pg`/Drizzle).
**Example (patrón real leído en este repo, `src/app/api/newsletter/confirm/route.ts`):**
```typescript
// Fuente: src/app/api/newsletter/confirm/route.ts (líneas 1-32), leído completo en esta sesión
import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { publicOrigin } from '@/lib/public-origin'

// Local API + driver de Postgres: runtime Node, nunca Edge.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const origin = publicOrigin(request)
  // ... payload.find(), payload.update(), NextResponse.redirect(target)
}
```
`/go/[slug]/route.ts` debe seguir esta misma forma: `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, y agregar explícitamente `headers: { 'Cache-Control': 'no-store' }` en el `NextResponse.redirect()` (GO-01 lo pide explícito; ninguno de los dos ejemplos de `newsletter/*` lo hace hoy, así que no hay que copiarlo de ahí — hay que agregarlo).

### Pattern 2: Lectura pública gateada por `active` sin filtro manual
**What:** `getCachedAffiliateLinks(locale)` ya aplica el gate de "solo activos" a través del access control de la colección (`authenticatedOrActive`), no de un `where` explícito.
**When to use:** Cualquier lectura pública de `affiliate-links`.
**Example (código real, ya construido en Phase 46):**
```typescript
// Fuente: src/lib/cache.ts:331-346, leído completo en esta sesión
export function getCachedAffiliateLinks(locale: Locale): Promise<AffiliateLink[]> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'affiliate-links',
        locale,
        limit: 100,
        overrideAccess: false,   // <- este flag, no un where, es lo que filtra `active`
      })
      return docs
    },
    ['affiliate-links', locale],
    { tags: [CACHE_TAGS.affiliateLinks()], revalidate: CACHE_TTL_SECONDS },
  )()
}
```
```typescript
// Fuente: src/access/authenticatedOrActive.ts, leído completo en esta sesión
import type { Access } from 'payload'

export const authenticatedOrActive: Access = ({ req: { user } }) => {
  if (user) return true
  return { active: { equals: true } }
}
```
**Consecuencia para GO-01:** el route handler NO necesita comprobar `doc.active === true` a mano — si el `.find()` con `overrideAccess: false` no devuelve nada para ese slug, el doc está inactivo o no existe, y ambos casos deben responder exactamente igual (404), sin distinguir cuál fue (evita filtrar información sobre qué slugs existen en el admin).

### Pattern 3: `pickDestination()` — función pura, sin import de Payload
**Example (código real, Phase 46, sin tocar):**
```typescript
// Fuente: src/lib/affiliate.ts, leído completo en esta sesión
export type Destination = { marketplace: string; url: string }

export function pickDestination(
  destinations: Destination[],
  marketplace: string,
): Destination | undefined {
  return destinations.find((d) => d.marketplace === marketplace) ?? destinations[0]
}
```
**Nota para el plan:** todos los programas que pasan por `/go/` (kinsta, dinorank, digitalocean, other — Amazon nunca pasa por `/go/`, per Phase 46 boundary) típicamente tendrán un solo elemento en `destinations`. El valor de `marketplace` que se le pase a `pickDestination()` en el route handler es de bajo riesgo: si no matchea ningún elemento, cae al fallback `destinations[0]`, que siempre es una URL autorada en el admin — nunca hay un open-redirect posible aquí porque ambas ramas (match y fallback) devuelven un valor del array admin-autorado. Se recomienda pasar un valor fijo (p. ej. `'default'` o el locale de la request) — la decisión exacta queda en el terreno ya delegado a discreción por CONTEXT.md ("estructura interna exacta del handler").

### Pattern 4: Escritura diferida post-respuesta con `after()`
**Example (patrón oficial, Next.js docs — no hay uso de `after()` en el repo todavía, esta fase lo introduce):**
```typescript
// Fuente: Next.js docs oficiales (after.mdx), vía Context7 /vercel/next.js/v15.1.8
import { after } from 'next/server'

export async function GET(request: Request) {
  // ... resolver destino, decidir si es bot/throttled ...
  const response = NextResponse.redirect(target, { status: 302, headers: { 'Cache-Control': 'no-store' } })

  after(async () => {
    // Esto corre DESPUÉS de que la respuesta ya salió — no agrega latencia
    // al 302. `cookies()`/`headers()` siguen disponibles acá dentro de un
    // Route Handler (a diferencia de Server Components).
    await payload.create({ collection: 'affiliate-clicks', data: { /* ... */ } })
  })

  return response
}
```
**Importante:** `after()` respeta el `maxDuration` configurado del route segment — no hace falta configuración adicional para una sola escritura de fila.

### Pattern 5: Throttle por IP a nivel de módulo (proceso Node persistente)
**Example (patrón real, extraíble de `contact.ts`):**
```typescript
// Fuente: src/app/actions/contact.ts:27-48, leído completo en esta sesión
// Reusar la FORMA (Map a nivel de módulo + ventana de tiempo), NO la función
// completa — contact.ts es un server action de formulario, /go/[slug] es un
// GET sin formulario. Extraer la forma a un util si el plan decide compartirla
// con Phase 48/49 (discreción del CONTEXT.md).
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_SUBMISSIONS = 5
const submissionLog = new Map<string, number[]>()

async function isRateLimited(clientIp: string): Promise<boolean> {
  const now = Date.now()
  const existing = submissionLog.get(clientIp) ?? []
  const recent = existing.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
    submissionLog.set(clientIp, recent)
    return true
  }
  recent.push(now)
  submissionLog.set(clientIp, recent)
  return false
}
```
Extracción de IP (mismo patrón, `contact.ts:33-34`):
```typescript
const forwardedFor = headerList.get('x-forwarded-for')
const clientIp = forwardedFor?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown'
```
Este mecanismo depende de que el proceso Node sea persistente (PM2/`next start`, no serverless) — ya documentado y confirmado como el modelo de despliegue real del proyecto (Dokploy, proceso único).

### Anti-Patterns to Avoid
- **Leer `doc.active` a mano tras un `find()` con `overrideAccess: true`:** rompería el gate de seguridad que ya existe (habría que reimplementar el filtro en cada lugar). Usar siempre `overrideAccess: false` y confiar en el access function.
- **Aceptar `?to=` o cualquier parámetro de query como destino:** GO-01 lo prohíbe explícitamente — es la superficie clásica de open redirect.
- **Copiar el honeypot de `contact.ts` como "detección de bots" para `/go/[slug]`:** no hay formulario en un GET; el honeypot no tiene dónde vivir. Ver Pitfall 2.
- **Escribir a `affiliate-clicks` antes de emitir la respuesta:** agrega latencia a un 302 que se supone instantáneo. Usar `after()`.
- **Reescribir el matcher completo copiando el ejemplo del ROADMAP:** el ROADMAP cita una versión vieja/genérica del matcher (`.*\\..*`) que ya no es la real — ver Pitfall 1.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resolver el `origin` público detrás de Traefik | Un helper nuevo de "cuál es mi dominio real" | `src/lib/public-origin.ts` (`publicOrigin(request)`), ya construido y documentado (Phase 49-adjacent, usado por `newsletter/*`) | Mismo problema ya resuelto: `request.nextUrl.origin` resuelve a `localhost:3000` detrás del proxy Traefik |
| Diferenciar slug inexistente de slug inactivo | Una consulta con `overrideAccess: true` + chequeo manual de `active` | `getCachedAffiliateLinks()` con `overrideAccess: false` | Ya filtra por `active` a través del access control — reimplementarlo a mano duplica la lógica de seguridad en dos lugares que pueden divergir |
| Cache de la colección `affiliate-links` | Un nuevo fetcher standalone para `/go/[slug]` | `getCachedAffiliateLinks(locale)` (ya existe, cachea con `unstable_cache` + `revalidateTag`) | Ya cachea, ya tiene invalidación wireada en los hooks de la colección — un segundo fetcher sin cache sería una query nueva a DB en cada clic |

**Key insight:** Casi todo lo que esta fase necesita para GO-01 (lectura, cache, resolución de destino, `active` gate) ya está construido por Phase 46. El trabajo real de esta fase es el matcher (GO-02), el route handler que ensambla esas piezas (GO-01), el robots.txt (GO-03), y la tabla nueva + su escritura diferida (GO-04).

## Common Pitfalls

### Pitfall 1: El matcher citado en el ROADMAP ya no es el matcher real
**What goes wrong:** Copiar literalmente el ejemplo de matcher del ROADMAP (`'/((?!api|admin|go/|_next|_vercel|.*\\..*).*)'`) reintroduciría el bug SEO-39 (exclusión genérica `.*\..*` que devuelve 500 en `/index.html`, `/sitemap_index.xml`, etc.).
**Why it happens:** El ROADMAP fue escrito citando la investigación original de Phase 44/45, antes de que SEO-39 reemplazara esa línea por una lista explícita y finita de exclusiones.
**How to avoid:** El fix real es insertar `go/` dentro de la alternancia actual, leída completa en esta sesión (`src/middleware.ts:141-146`):
```typescript
export const config = {
  matcher: [
    '/',
    '/((?!api|admin|_next|_vercel|\\.well-known|robots\\.txt|sitemap\\.xml|sitemap\\.xsl|sitemap\\.html|llms\\.txt|llms-full\\.txt|site\\.webmanifest|favicon\\.ico|favicon\\.svg|favicon-32x32\\.png|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png).*)',
  ],
}
```
El fix agrega `go/` (con barra, GO-02 lo exige textual) a esa misma alternancia — por ejemplo inmediatamente después de `admin`: `(?!api|admin|go/|_next|_vercel|...)`. La barra después de `go` es lo que lo convierte en una exclusión de segmento completo en vez de prefijo — sin ella, `/golang-para-seo` también quedaría excluido (el mismo trap que el comentario de `isPrefixableHref` en `src/i18n/navigation.ts:53-57` ya resuelve para `/en` vs `/entrevistas`, partiendo el primer segmento en vez de usar `startsWith`).
**Warning signs:** Si el `git diff` de esta línea reintroduce `.*\\..*` en cualquier forma, o si el diff toca algo más que la propia alternancia, es la señal de que se copió el ejemplo viejo del ROADMAP en vez de editar el archivo real.

### Pitfall 2: `contact.ts` no tiene detección de bots reusable para un GET
**What goes wrong:** El CONTEXT.md (línea 22) y el ROADMAP asumen que `contact.ts` ya tiene "detección de bots" lista para copiar. Leído completo en esta sesión, lo único que tiene es un **honeypot de formulario** (`company_website`, un campo oculto — `contact.ts:71-72,80-82`): si vinera relleno, la sumisión se descarta silenciosamente. Es un mecanismo que depende de que exista un `<form>` con campos — no aplica a un `GET /go/notion` sin formulario.
**Why it happens:** El CONTEXT.md fue escrito en discuss-phase sin leer el archivo completo — asumió que "detección de bots" y "throttle por IP" eran la misma pieza reusable.
**How to avoid:** Separar las dos cosas explícitamente en el plan:
  - **Throttle por IP:** sí es 100% reusable en forma (Map a nivel de módulo + ventana de tiempo, ver Pattern 5 arriba).
  - **Detección de bots:** hay que construir un chequeo nuevo por `User-Agent` (regex contra patrones conocidos: `bot`, `crawl`, `spider`, `curl`, `wget`, `python-requests`, etc. — patrón estándar de la industria, no existe ninguna constante ya escrita en este repo para reusar. Confianza: `[ASSUMED]`, revisar con Juan si algún bot legítimo de monitoreo del propio sitio necesita pasar).
**Warning signs:** Un plan que dice "copiar la función `isRateLimited`/honeypot de `contact.ts` tal cual" sin adaptarla es la señal de que no se leyó el archivo completo.

### Pitfall 3: Confundir "slug inexistente" con "slug inactivo" en la respuesta
**What goes wrong:** Si el 404 de un slug inexistente y el 404 de un link desactivado por el editor tienen cualquier diferencia observable (timing, body, header), un actor externo puede enumerar qué slugs existen en el admin aunque estén inactivos.
**Why it happens:** Es tentador loguear/responder distinto "para debug" cuando `doc` es `undefined` por-no-existe vs por-no-activo — pero `getCachedAffiliateLinks()` con `overrideAccess: false` ya los hace indistinguibles en la query (ambos devuelven "no encontrado" en el array).
**How to avoid:** Un solo camino de código para "no se encontró un doc con ese slug en el array devuelto" → 404 genérico. No hacer una segunda query con `overrideAccess: true` "para saber si existía".
**Warning signs:** Cualquier código que llame a `payload.find()` dos veces para el mismo slug (una con `overrideAccess: false` y otra con `true`) dentro del mismo handler.

### Pitfall 4: Migración generada con nombre de tabla que colisiona con convención de Payload para arrays
**What goes wrong:** Si `affiliate-clicks` no tiene ningún campo `array`, la migración generada será una única `CREATE TABLE "affiliate_clicks"` sin tabla hija — más simple que la de `affiliate-links` (que sí generó `affiliate_links_destinations` por su array `destinations`). Un plan que asuma automáticamente "va a generar 2 tablas como Phase 46" puede sorprenderse si el schema de `affiliate-clicks` es plano.
**Why it happens:** Extrapolar el patrón de la migración anterior sin considerar que el schema es distinto (sin arrays).
**How to avoid:** Diseñar `affiliate-clicks` con campos planos (slug, ip-hash opcional, timestamp, user-agent opcional) — sin arrays — y verificar la migración generada real antes de aplicarla, exactamente como hizo Phase 46 (leer `up()`/`down()` completos, confirmar solo `CREATE TABLE`/`CREATE INDEX`, cero `ALTER COLUMN`/`DROP`).
**Warning signs:** Cualquier `ALTER COLUMN`, `DROP TABLE` o `DROP COLUMN` fuera del bloque `down()` en el archivo generado — igual que el gate ya usado en 46-01-PLAN.md.

## Code Examples

### `robots.ts` actual completo (para el diff de GO-03)
```typescript
// Fuente: src/app/robots.ts, leído completo en esta sesión
import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```
El único cambio para GO-03 es `disallow: ['/admin', '/api', '/go']`.

### Comando exacto de migración (mismo flujo que Phase 46)
```bash
# 1. Confirmar contra qué base se escribe (obligatorio, CLAUDE.md Database Safety)
node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts

# 2. Generar la migración (nombre descriptivo, snake_case)
node --env-file=.env node_modules/.bin/payload migrate:create affiliate_clicks_collection

# 3. LEER el archivo generado completo bajo src/migrations/ antes de aplicar —
#    debe contener solo CREATE TABLE/CREATE INDEX/ALTER TABLE...ADD COLUMN
#    sobre payload_locked_documents_rels. Si aparece ALTER COLUMN/DROP TABLE/
#    DROP COLUMN fuera de down(), PARAR.

# 4. Aplicar (aditiva pura, no requiere confirmación de Juan per CLAUDE.md)
node --env-file=.env node_modules/.bin/payload migrate
```
No existe script npm `migrate`/`migrate:create` en `package.json` — se invoca el binario de Payload directo, exactamente como documenta `46-01-PLAN.md:131-133`.

Para correr `next dev`/los scripts contra la base real de Dokploy desde la laptop (necesario para generar/aplicar la migración y para levantar el servidor de verificación curl de GO-02), el túnel SSH documentado en `scripts/db/tunnel.sh` sigue siendo el mecanismo vigente (relay `socat` efímero dentro de `dokploy-network`, túnel local a `127.0.0.1:15432`), leído completo en esta sesión.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Middleware `nodejs` runtime para Local API | Route Handler dedicado + `fetch` loopback desde middleware Edge | Documentado en Phase 2 (02-03-SUMMARY.md), sigue vigente | `/go/[slug]` debe ser un Route Handler, no lógica dentro de `middleware.ts` — el middleware de este proyecto nunca puede llamar `getPayload()` directamente |
| Matcher con exclusión genérica `.*\..*` | Matcher con lista explícita y finita de exclusiones | SEO-39 (fase posterior a la investigación citada por el ROADMAP de v2.1) | El fix de GO-02 debe editar la lista real, no el ejemplo citado en el ROADMAP |

**Deprecated/outdated:** El ejemplo de matcher citado literalmente en `ROADMAP.md` línea 1158 está desactualizado respecto al código real — usar como referencia conceptual (dónde va `go/`, por qué con barra) pero no como diff a aplicar verbatim.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | La detección de bots para `/go/[slug]` debe ser un regex de `User-Agent` contra patrones conocidos (`bot`, `crawl`, `spider`, `curl`, `wget`, `python-requests`, etc.) — no existe ningún patrón ya escrito en este repo para reusar | Pitfall 2 | Bajo/medio — un patrón demasiado agresivo podría bloquear un crawler legítimo (Googlebot no debería llegar nunca a `/go/` de todas formas, por el `Disallow` de GO-03); uno demasiado laxo deja pasar clics de bots simples a `affiliate-clicks`, ensuciando métricas pero sin riesgo de seguridad |
| A2 | El valor de `marketplace` que se le pasa a `pickDestination()` dentro de `/go/[slug]` puede ser un valor fijo (`'default'`) o derivado del locale de la request, sin impacto de seguridad porque ambas ramas del `??` fallback devuelven una URL admin-autorada | Pattern 3 | Bajo — en el peor caso el visitante llega a un destino ligeramente distinto del esperado dentro del mismo documento admin-autorado (nunca a una URL externa no autorizada) |
| A3 | Ningún endpoint de monitoreo interno (uptime checks, health checks) golpea `/go/*` — si alguno lo hiciera, el bot-check por User-Agent podría descartarlo también, lo cual es el comportamiento correcto (no se quiere registrar un clic real por un health check) | Pitfall 2 | Muy bajo — un health check no es un clic real, descartarlo es correcto por diseño |

**Si esta tabla estuviera vacía:** no aplica — hay assumptions genuinas por resolver en discreción del plan, ninguna es bloqueante.

## Open Questions

1. **¿Qué valor de `marketplace` pasa `/go/[slug]` a `pickDestination()`?**
   - What we know: `pickDestination()` es pura y su fallback (`destinations[0]`) siempre devuelve un valor admin-autorado, así que no hay riesgo de seguridad en ninguna elección.
   - What's unclear: si el plan debe derivarlo del locale de la request (`es`/`en`), de un valor fijo, o de otra señal.
   - Recommendation: usar un valor fijo simple (p. ej. `'default'`) salvo que Phase 48 ya haya fijado una convención de `marketplace` distinta para links no-Amazon — verificar contra el research/plan de Phase 48 cuando exista.

2. **¿Qué campos exactos lleva `affiliate-clicks` más allá de los que fija GO-04 (slug, timestamp)?**
   - What we know: append-only, sin campo de conteo mutable, debe permitir descartar bots/throttle antes de escribir (no un campo `isBot` en la fila — si es bot, no se escribe fila).
   - What's unclear: si vale la pena guardar `userAgent`/`referrer`/un hash de IP (sin guardar la IP cruda, por privacidad, coherente con LEG-04 del milestone — "sin tracking que dispare consentimiento").
   - Recommendation: campos mínimos — `slug` (o relación a `affiliate-links`), `clickedAt` (timestamp) — y opcionalmente un `userAgent` de texto libre sin PII. Queda en discreción del plan per CONTEXT.md.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Postgres real (Dokploy, vía túnel SSH) | Generar/aplicar migración de `affiliate-clicks`, curl-verificar GO-01/GO-02 con servidor real | ✓ (vía `scripts/db/tunnel.sh`, no probado en esta sesión de research — confirmado por Phase 46 reciente) | — | Ninguno — no hay sandbox local, per CLAUDE.md Database Safety |
| `payload` CLI (`migrate:create`/`migrate`) | GO-04 | ✓ | 3.85.2 | — |
| Node.js (proceso persistente, para el Map de throttle a nivel de módulo) | GO-04 (throttle) | ✓ (Dokploy despliega como proceso Node único, confirmado por el propio comentario de `contact.ts`) | — | — |

**Missing dependencies with no fallback:** ninguno detectado — no se intentó levantar `next dev` en esta sesión (bloqueado por permisos de lectura de `.env`, y no era necesario: la confirmación del bug del matcher se hizo por lectura de código + documentación oficial de `next-intl`, per instrucción explícita de la tarea de research).

## Validation Architecture

Omitida — `workflow.nyquist_validation` está explícitamente en `false` en `.planning/config.json`.

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` (confirmado en `.planning/config.json`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V4 Access Control | Sí | `authenticatedOrActive` ya gatea `affiliate-links` por `active`; `/go/[slug]` hereda ese gate leyendo vía `overrideAccess: false`, nunca `true` |
| V5 Input Validation | Sí | El `slug` de la URL solo se usa para buscar en el array ya cacheado (comparación exacta de string, no interpolado en SQL ni usado para construir un path de filesystem); `?to=`/cualquier query param se ignora por completo (GO-01) — mitigación directa de open redirect (CWE-601) |
| V11 Business Logic | Sí | Throttle por IP + descarte de bots antes de escribir a `affiliate-clicks`, para que el registro de clics no sea trivialmente inflable |
| V13 API and Web Service | Sí | `Cache-Control: no-store` explícito en la respuesta 302 — sin esto, un CDN/navegador podría cachear un redirect a un destino que el editor cambió después en el admin |
| V6 Cryptography | No | No hay secretos/tokens nuevos en esta fase |
| V2/V3 Auth/Session | No | `/go/[slug]` es público, sin sesión de usuario involucrada |

### Known Threat Patterns for esta fase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Open redirect vía parámetro de query | Tampering | GO-01: el destino se lee EXCLUSIVAMENTE del documento admin — cualquier `?to=`/`?redirect=` recibido se ignora, nunca se interpola en la URL de destino |
| Enumeración de slugs inactivos vía diferencia de respuesta | Information Disclosure | Un único código de camino para "no encontrado" cubre tanto slug-inexistente como slug-inactivo (ver Pitfall 3) |
| Inflado de clics (click fraud interno/bot) | Repudiation / Business logic abuse | Throttle por IP (patrón de `contact.ts`) + descarte por User-Agent antes del `create()` |
| Caché de un redirect stale en el borde/navegador | Tampering (integridad de la respuesta) | `Cache-Control: no-store` explícito, mismo patrón que `sitemap.xml`/`sitemap.html` ya usan en este repo |

## Sources

### Primary (HIGH confidence)
- `src/middleware.ts` (147 líneas, leído completo) — matcher real, mecanismo de fetch loopback, historial de SEO-39
- `src/i18n/routing.ts`, `src/i18n/navigation.ts` (leídos completos) — `localePrefix: 'as-needed'`, `localeDetection: false`, guard `isPrefixableHref`
- `src/lib/affiliate.ts`, `src/collections/AffiliateLinks/index.ts`, `src/access/authenticatedOrActive.ts` (leídos completos) — shape exacto de Phase 46
- `src/payload-types.ts` líneas 1486-1509 (interface `AffiliateLink`, leída completa) — campos verbatim: `id: number; name: string; slug?: string | null; program: 'amazon' | 'kinsta' | 'dinorank' | 'digitalocean' | 'other'; destinations?: { marketplace: string; url: string; id?: string | null; }[] | null; cookieWindowDays?: number | null; commissionNote?: string | null; active?: boolean | null; placement?: ('stack-page' | 'inline-post' | 'both') | null; order?: number | null; tagline?: string | null; whyIUseIt?: string | null; disclosureOverride?: string | null; ctaLabel?: string | null;`
- `src/lib/cache.ts` líneas 331-346 (leídas completas) — `getCachedAffiliateLinks()`
- `src/lib/cache-tags.ts` (leído completo) — `CACHE_TAGS.affiliateLinks()`, hooks de invalidación
- `src/app/actions/contact.ts` (116 líneas, leído completo) — honeypot, throttle por IP, ventana/límite exactos
- `src/app/robots.ts` (leído completo) — `disallow` actual
- `src/app/api/redirects-lookup/route.ts`, `src/app/api/newsletter/confirm/route.ts`, `src/app/api/newsletter/unsubscribe/route.ts` (leídos completos) — patrón de Route Handler Node-runtime
- `src/lib/public-origin.ts` (leído completo)
- `src/migrations/20260903_225836_affiliate_links_collection.ts` (leído completo) — forma de migración generada por `payload migrate:create` para una colección con array
- `scripts/db/tunnel.sh` (leído completo) — mecanismo de acceso a la Postgres real de Dokploy
- `.planning/phases/46-disclosure-legal-esquema-de-links-de-afiliado/46-01-PLAN.md`, `46-01-SUMMARY.md`, `46-CONTEXT.md` (leídos) — comandos exactos de migración ya ejecutados en este mismo repo
- `git log` (verificado en esta sesión) — commits de Phase 46 (`1ec0e45`, `20f95a1`, `d192ae7`, `81432c8` merge) presentes en `docs/seo-handoff`, branch actual
- Context7 `/vercel/next.js/v15.1.8` — `after()` API, estable (no marcado experimental en esta versión de la doc), disponible en Route Handlers con `cookies()`/`headers()` accesibles dentro del callback
- Context7 `/amannn/next-intl` — comportamiento documentado de `localePrefix: 'as-needed'` y su dependencia de que el matcher detecte pathnames sin prefijo

### Secondary (MEDIUM confidence)
- `npm view payload version` (consultado en esta sesión) → `3.88.0` es el latest del registro; el proyecto sigue pineado a `3.85.2` en lockstep — no aplica upgrade en esta fase (sin paquetes nuevos)

### Tertiary (LOW confidence)
- Patrón de regex de User-Agent para detección de bots (Assumption A1) — conocimiento general de la industria, no verificado contra ninguna fuente oficial de este proyecto

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — cero paquetes nuevos, todo el código base ya leído completo
- Architecture: HIGH — patrón de Route Handler Node-runtime ya usado 3 veces en este mismo repo (`redirects-lookup`, `newsletter/confirm`, `newsletter/unsubscribe`)
- Pitfalls: HIGH — el pitfall del matcher se verificó comparando el código real contra el ejemplo del ROADMAP; el pitfall de bot-detection se verificó leyendo `contact.ts` completo

**Research date:** 2026-09-04
**Valid until:** 30 días (stack estable, sin paquetes nuevos que puedan liberar versiones que rompan algo)
