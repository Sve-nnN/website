import { NextResponse, after, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getCachedAffiliateLinks } from '@/lib/cache'
import { pickDestination } from '@/lib/affiliate'
import { isBotUserAgent } from '@/lib/bot-detection'
import { createIpThrottle, extractClientIp } from '@/lib/ip-throttle'

// GO-01: Local API + driver de Postgres, runtime Node, nunca Edge — mismo
// motivo que src/app/api/newsletter/confirm/route.ts.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GO-04: env vars permiten que scripts/verify-affiliate-clicks-write.ts use
// una ventana corta y determinística; en producción caen a los defaults
// (10 min / 20 hits por IP).
const CLICK_THROTTLE_WINDOW_MS = Number(process.env.GO_CLICK_THROTTLE_WINDOW_MS) || 10 * 60 * 1000
const CLICK_THROTTLE_MAX_HITS = Number(process.env.GO_CLICK_THROTTLE_MAX_HITS) || 20
const clickThrottle = createIpThrottle(CLICK_THROTTLE_WINDOW_MS, CLICK_THROTTLE_MAX_HITS)

// CONSTRAINT (GO-01, T-47-01): este handler NUNCA lee `request.nextUrl.searchParams`
// en la resolución del destino. Cualquier `?to=`/`?redirect=` que llegue se
// ignora por el simple hecho de no ser código alcanzable — no por un chequeo
// explícito. El destino se resuelve EXCLUSIVAMENTE vía el documento
// admin-autorado en `affiliate-links` (Phase 46), nunca desde la query string.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Locale fijo a propósito: `slug`/`active`/`destinations`/`program` NO están
  // localizados en `affiliate-links` (matriz de localización congelada en
  // 46-CONTEXT.md), así que el locale del visitante no cambia qué documento
  // resuelve. `getCachedAffiliateLinks` ya aplica el gate `active: true` a
  // través del access control de la colección (`overrideAccess: false`) — no
  // hace falta un `where` manual.
  const docs = await getCachedAffiliateLinks('es')
  const doc = docs.find((d) => d.slug === slug)

  // Pitfall 3 (47-RESEARCH.md): un slug inexistente y un slug inactivo deben
  // ser INDISTINGUIBLES en la respuesta (mismo status, mismo body) — de lo
  // contrario un actor externo podría enumerar qué slugs existen en el admin
  // aunque estén inactivos. `getCachedAffiliateLinks` con `overrideAccess:
  // false` ya los hace indistinguibles en la query (ambos devuelven "no
  // encontrado" en el array `docs`), así que un único camino de código basta.
  // PROHIBIDO: una segunda consulta con `overrideAccess: true` "para saber
  // cuál de los dos pasó" — reimplementaría el filtro de seguridad a mano.
  if (!doc || !doc.active) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // 'default' es un valor fijo de bajo riesgo (47-RESEARCH.md Open Question 1
  // / Assumption A2): si ningún `destinations[].marketplace` coincide,
  // `pickDestination` ya cae al primer elemento del array — ambas ramas
  // devuelven una URL admin-autorada, nunca hay open-redirect posible.
  const destination = pickDestination(doc.destinations ?? [], 'default')

  // Link mal configurado en el admin (sin destinos) — mismo 404 genérico,
  // nunca un error 500.
  if (!destination) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const response = NextResponse.redirect(destination.url, {
    status: 302,
    headers: { 'Cache-Control': 'no-store' },
  })

  // GO-04: la respuesta 302 SIEMPRE sale, sin importar shouldLog — un bot o
  // un IP throttled igual llegan a destino, solo se suprime la escritura del
  // log. Bot-detection y throttle deciden únicamente si `after()` corre,
  // nunca si el redirect se emite.
  const userAgent = request.headers.get('user-agent')
  const clientIp = extractClientIp(request.headers)
  const shouldLog = !isBotUserAgent(userAgent) && !clickThrottle.isThrottled(clientIp)

  if (shouldLog) {
    after(async () => {
      const payload = await getPayload({ config })
      await payload.create({
        collection: 'affiliate-clicks',
        data: { slug, userAgent: userAgent ?? undefined },
      })
    })
  }

  return response
}
