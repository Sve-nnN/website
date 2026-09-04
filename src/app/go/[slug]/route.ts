import { NextResponse, type NextRequest } from 'next/server'

import { getCachedAffiliateLinks } from '@/lib/cache'
import { pickDestination } from '@/lib/affiliate'

// GO-01: Local API + driver de Postgres, runtime Node, nunca Edge — mismo
// motivo que src/app/api/newsletter/confirm/route.ts.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// CONSTRAINT (GO-01, T-47-01): este handler NUNCA lee `request.nextUrl.searchParams`
// en la resolución del destino. Cualquier `?to=`/`?redirect=` que llegue se
// ignora por el simple hecho de no ser código alcanzable — no por un chequeo
// explícito. El destino se resuelve EXCLUSIVAMENTE vía el documento
// admin-autorado en `affiliate-links` (Phase 46), nunca desde la query string.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

  return NextResponse.redirect(destination.url, {
    status: 302,
    headers: { 'Cache-Control': 'no-store' },
  })
}
