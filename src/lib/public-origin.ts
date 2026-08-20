import type { NextRequest } from 'next/server'

/**
 * Origen público del sitio, para armar redirecciones que el visitante pueda
 * abrir.
 *
 * POR QUÉ NO `request.nextUrl.origin`: detrás de Traefik, el proceso de Next ve
 * la petición como si llegara a su propio puerto interno, así que ese origin
 * resuelve a `https://localhost:3000`. En local no se nota. En producción se
 * notó apenas se desplegó: las rutas de confirmación y de baja del correo
 * redirigían a `https://localhost:3000/blog?...`, o sea a ninguna parte.
 *
 * Es el mismo pozo que ya documenta `src/middleware.ts` con su fetch a loopback:
 * ahí el problema era usar `request.url` para llamar hacia adentro; acá es usar
 * el mismo dato para mandar al visitante hacia afuera. Son las dos caras de
 * confiar en un origin reconstruido detrás de un proxy.
 *
 * Orden de preferencia:
 *   1. `x-forwarded-proto` + `x-forwarded-host`, que es lo que el proxy dice que
 *      pidió el visitante.
 *   2. `NEXT_PUBLIC_SERVER_URL`, si está configurada con el dominio real.
 *   3. El origin del request, que es lo único que queda sin proxy (dev local).
 */
export function publicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()

  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost.split(',')[0].trim()}`
  }

  const configured = process.env.NEXT_PUBLIC_SERVER_URL?.trim()

  // Una URL configurada que apunta a localhost no sirve para redirigir a nadie:
  // es el valor por defecto del entorno de desarrollo, no el dominio del sitio.
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) {
    return configured.replace(/\/$/, '')
  }

  return request.nextUrl.origin
}
