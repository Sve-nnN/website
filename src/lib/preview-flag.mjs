/**
 * Regla unica de la bandera `PREVIEW_READONLY` (fase 53, WR-02).
 *
 * Es un modulo `.mjs` puro y sin imports para que lo carguen igual
 * `next.config.mjs` (Node nativo, en el build) y `src/lib/preview.ts` (sandbox
 * Edge del middleware y runtime Node). Asi las dos lecturas no pueden divergir.
 *
 * Falla cerrado: cualquier valor presente que no sea una negativa explicita
 * (`false`, `0`, vacio) activa el modo solo lectura. `TRUE`, `1`, `true ` con
 * espacio final o una comilla sobrante, habituales al pegar en Dokploy, cuentan
 * como activada en lugar de dejar el preview escribiendo contra produccion.
 *
 * @param {string | undefined} raw
 * @returns {boolean}
 */
export function parsePreviewFlag(raw) {
  if (raw === undefined) return false
  const value = raw.trim().toLowerCase()
  return value !== '' && value !== 'false' && value !== '0'
}
