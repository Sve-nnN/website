import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { publicOrigin } from '@/lib/public-origin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Baja en un clic, desde el enlace que va al pie de cada correo.
 *
 * Sin pantalla de confirmación ni login: darse de baja tiene que costar menos
 * que suscribirse. La fila NO se borra, se marca `unsubscribed`, para que un
 * alta posterior sepa que esa persona ya se había ido una vez.
 *
 * Mismo criterio que la confirmación: se busca por token, y un token que no
 * existe vuelve con `?newsletter=invalid` en vez de decir que se dio de baja
 * algo que no existe.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  // Detrás del proxy, `request.nextUrl.origin` es el puerto interno del
  // contenedor. Ver src/lib/public-origin.ts.
  const origin = publicOrigin(request)
  const home = new URL('/', origin)

  if (!token) return NextResponse.redirect(home)

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'subscribers',
      where: { token: { equals: token } },
      limit: 1,
    })

    const subscriber = docs[0]

    if (subscriber) {
      await payload.update({
        collection: 'subscribers',
        id: subscriber.id,
        data: { status: 'unsubscribed', unsubscribedAt: new Date().toISOString() },
      })
    }

    const target = new URL(
      subscriber?.locale === 'en' ? '/en/blog' : '/blog',
      origin,
    )
    target.searchParams.set('newsletter', subscriber ? 'unsubscribed' : 'invalid')

    return NextResponse.redirect(target)
  } catch (err) {
    console.error('Falló la baja del correo:', err)
    return NextResponse.redirect(home)
  }
}
