import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

// Local API + driver de Postgres: runtime Node, nunca Edge.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cierra el doble opt-in: el enlace que llega por correo pasa por acá y recién
 * entonces el alta pasa a `confirmed`.
 *
 * El token es la única credencial, así que la búsqueda es por token y NUNCA por
 * correo: aceptar `?email=` dejaría dar de alta a cualquiera con solo conocer
 * su dirección, que es justo lo que el doble opt-in existe para impedir.
 *
 * Un token que no existe NO puede terminar en "listo, confirmado": eso le
 * mentiría a quien abrió un enlace viejo. Vuelve con `?newsletter=invalid` y el
 * bloque muestra que el enlace ya no sirve. El token es de 32 bytes aleatorios,
 * así que distinguir válido de inválido no le da nada a nadie; decirle "hecho" a
 * alguien a quien no se le hizo nada sí cuesta.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const home = new URL('/', request.nextUrl.origin)

  if (!token) return NextResponse.redirect(home)

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'subscribers',
      where: { token: { equals: token } },
      limit: 1,
    })

    const subscriber = docs[0]

    // Quien ya se dio de baja no vuelve a entrar por un enlace viejo: eso sería
    // reactivar a alguien que pidió irse. Su clic tampoco puede responder
    // "confirmado", así que cae en el mismo aviso que un enlace vencido.
    const reactivable = Boolean(subscriber) && subscriber.status !== 'unsubscribed'

    if (subscriber && reactivable) {
      await payload.update({
        collection: 'subscribers',
        id: subscriber.id,
        // `unsubscribedAt` se limpia: dejarlo puesto describe a un suscriptor
        // activo con fecha de baja, que es una contradicción en la ficha del
        // admin y lo primero que confunde a quien mira la lista.
        data: {
          status: 'confirmed',
          confirmedAt: new Date().toISOString(),
          unsubscribedAt: null,
        },
      })
    }

    const target = new URL(
      subscriber?.locale === 'en' ? '/en/blog' : '/blog',
      request.nextUrl.origin,
    )
    target.searchParams.set('newsletter', reactivable ? 'confirmed' : 'invalid')

    return NextResponse.redirect(target)
  } catch (err) {
    console.error('Falló la confirmación del alta al correo:', err)
    return NextResponse.redirect(home)
  }
}
