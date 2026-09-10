// Misma FORMA exacta que src/app/actions/contact.ts (líneas 27-48/33-34):
// Map a nivel de módulo + ventana de tiempo, x-forwarded-for con fallback a
// x-real-ip y luego 'unknown'. Extraída a util reusable per discreción de
// 47-CONTEXT.md — contact.ts queda sin tocar.
//
// Depende de que el proceso Node sea persistente (PM2/`next start`, no
// serverless) — mismo modelo de despliegue real del proyecto en Dokploy,
// confirmado por el comentario de contact.ts.

export function extractClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
}

export function createIpThrottle(windowMs: number, maxHits: number) {
  const hitLog = new Map<string, number[]>()

  return {
    isThrottled(ip: string): boolean {
      const now = Date.now()
      const existing = hitLog.get(ip) ?? []
      const recent = existing.filter((timestamp) => now - timestamp < windowMs)

      if (recent.length >= maxHits) {
        hitLog.set(ip, recent)
        return true
      }

      recent.push(now)
      hitLog.set(ip, recent)
      return false
    },
  }
}
