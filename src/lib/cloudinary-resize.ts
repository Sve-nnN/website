// Variantes de ancho para imagenes de Cloudinary servidas como <img> crudo.
//
// Rendimiento (auditoria movil 2026-11-24): las tarjetas del indice del blog
// descargaban la portada completa (1200 px, 87 KB en webp, hasta 404 KB en avif)
// para pintarla a 380 px. Cloudinary entrega la misma imagen a otro ancho con
// `c_limit,w_<n>` en el segmento de transformaciones, y `f_auto,q_auto` ya esta
// en la URL: el peso baja de 87 KB a 8-17 KB en las tarjetas.
//
// Solo toca URLs de Cloudinary con forma `/image/upload/<transformaciones>/...`.
// Cualquier otra URL (Payload local, otro host) vuelve intacta.

const UPLOAD = '/image/upload/'
const TRANSFORM_SEGMENT = /^[a-z]{1,3}_[^/,]+(,[a-z]{1,3}_[^/,]+)*$/
const VERSION_SEGMENT = /^v\d+$/

/** URL de Cloudinary limitada a `width` px de ancho, o la misma URL si no aplica. */
export function cloudinaryWidth(url: string, width: number): string {
  if (!url.includes('res.cloudinary.com') || !url.includes(UPLOAD)) return url
  const at = url.indexOf(UPLOAD) + UPLOAD.length
  const rest = url.slice(at)
  const first = rest.split('/')[0] ?? ''
  const resize = `c_limit,w_${width}`
  if (TRANSFORM_SEGMENT.test(first)) {
    // Ya trae transformaciones: se agrega el limite al mismo segmento.
    return `${url.slice(0, at)}${first},${resize}${rest.slice(first.length)}`
  }
  if (VERSION_SEGMENT.test(first) || first !== '') {
    return `${url.slice(0, at)}${resize}/${rest}`
  }
  return url
}

/** `srcSet` con una entrada por ancho, o undefined si la URL no es de Cloudinary. */
export function cloudinarySrcSet(url: string, widths: readonly number[]): string | undefined {
  if (cloudinaryWidth(url, widths[0] ?? 0) === url) return undefined
  return widths.map((w) => `${cloudinaryWidth(url, w)} ${w}w`).join(', ')
}
