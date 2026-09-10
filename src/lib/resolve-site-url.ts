import { headers } from 'next/headers'

/**
 * Host público desde el que se arman enlaces de confirmación por correo (alta
 * al blog y, desde Phase 49, alta a un lead magnet).
 *
 * Extraído byte a byte de `src/app/actions/subscribe.tsx` (Phase 49-01,
 * RESEARCH.md Pitfall 5): NO reinventar resolución de host, reusar la que ya
 * arregló el bug de enlaces rotos en producción (`NEXT_PUBLIC_SERVER_URL`
 * vale `http://localhost:3000` en dev y, sin tocar, produce enlaces a ninguna
 * parte en producción).
 *
 * Mismo criterio que `src/lib/public-origin.ts` (que resuelve lo mismo para
 * Route Handlers, no Server Actions — `headers()` en vez de `NextRequest`).
 */
export async function resolveSiteUrl(): Promise<string | null> {
  const headerList = await headers()
  const forwardedHost = headerList.get('x-forwarded-host') ?? headerList.get('host')
  const forwardedProto = headerList.get('x-forwarded-proto')?.split(',')[0]?.trim()

  if (forwardedHost && !/localhost|127\.0\.0\.1/.test(forwardedHost)) {
    return `${forwardedProto || 'https'}://${forwardedHost.split(',')[0].trim()}`
  }

  const configured = process.env.NEXT_PUBLIC_SERVER_URL?.trim()

  if (configured) return configured.replace(/\/$/, '')

  // Sin proxy y sin variable: dev local. El host crudo alcanza.
  return forwardedHost ? `http://${forwardedHost}` : null
}
