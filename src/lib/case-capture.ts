// Captura de Search Console de un caso de exito: criterio unico para la figura
// del detalle y para la imagen social. Funciones puras, sin CMS.
//
// Solo cuenta como captura la media cuyo archivo empieza por `gsc-`. El pie de la
// figura afirma que la fuente es Search Console, asi que una portada cualquiera
// (ilustracion, foto de relleno) no puede entrar por esta via: se sigue usando
// como hasta ahora en la imagen social y en el JSON-LD.

const CAPTURE_PREFIX = 'gsc-'

export type CaseCapture = {
  url: string
  alt: string
  width: number
  height: number
}

/** true si la media poblada es una captura de Search Console segun su archivo. */
export function isSearchConsoleCapture(media: unknown): boolean {
  if (!media || typeof media !== 'object') return false
  const filename = (media as { filename?: unknown }).filename
  if (typeof filename !== 'string') return false
  // El adaptador de Cloudinary guarda `media/<nombre>`; en local es solo el nombre.
  return filename.slice(filename.lastIndexOf('/') + 1).startsWith(CAPTURE_PREFIX)
}

/**
 * Props de la figura, o null. Sin texto alternativo o sin dimensiones no hay
 * figura: una captura sin `alt` es inaccesible y sin medidas mueve la pagina.
 */
export function toCaseCapture(media: unknown): CaseCapture | null {
  if (!isSearchConsoleCapture(media)) return null
  const m = media as { url?: unknown; alt?: unknown; width?: unknown; height?: unknown }
  const url = typeof m.url === 'string' ? m.url.trim() : ''
  const alt = typeof m.alt === 'string' ? m.alt.trim() : ''
  if (!url || !alt) return null
  if (typeof m.width !== 'number' || typeof m.height !== 'number' || m.width <= 0 || m.height <= 0) {
    return null
  }
  return { url, alt, width: m.width, height: m.height }
}

const ISO_RANGE = /^(\d{4}-\d{2}-\d{2})\s*\/\s*(\d{4}-\d{2}-\d{2})$/

/**
 * "2026-07-12 / 2026-11-22" a sus dos fechas escritas en el idioma de la pagina.
 * Cualquier otra forma ("Jul 2025 a Jun 2026") o una fecha imposible dan null:
 * quien llama muestra el texto tal como esta guardado.
 */
export function formatIsoRange(value: string, locale: string): { from: string; to: string } | null {
  const match = ISO_RANGE.exec(value.trim())
  if (!match) return null
  const format = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const dates: string[] = []
  for (const iso of [match[1]!, match[2]!]) {
    const date = new Date(`${iso}T00:00:00Z`)
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return null
    dates.push(format.format(date))
  }
  return { from: dates[0]!, to: dates[1]! }
}
