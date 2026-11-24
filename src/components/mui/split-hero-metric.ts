// Modulo puro: sin React ni Payload. Prepara el texto de `heroMetric` y de
// `sector` de los casos para las tarjetas de resultado. La salida del sitio no
// lleva guiones largos ni cortos (regla de voz), asi que los caracteres se
// escriben por codigo y nunca como literales en este archivo.

const MINUS = '\\u2212'
const EN_DASH = '\\u2013'
const EM_DASH = '\\u2014'

// Cifra con signo opcional y simbolo de porcentaje, seguida de su etiqueta.
const METRIC = new RegExp(`^([+\\-${MINUS}]?\\d[\\d.,]*\\s?%)\\s*(.*)$`)
// Raya larga o corta entre sector y subsector, con espacios alrededor o sin ellos.
const SECTOR_DASH = new RegExp(`\\s*[${EN_DASH}${EM_DASH}]\\s*(\\S)`, 'g')

export type SplitMetric = { metric: string; label: string | null }

/**
 * Separa la cifra de su etiqueta ("+406% clics interanuales" da "+406 %" y
 * "clics interanuales"). La cifra sale normalizada con un espacio antes del
 * simbolo de porcentaje. Si el texto no calza (por ejemplo "0 → 56 clics")
 * devuelve la cadena entera como `metric` y `label` null.
 */
export function splitHeroMetric(value: string | null | undefined): SplitMetric {
  const raw = (value ?? '').trim()
  const m = METRIC.exec(raw)
  if (!m) return { metric: raw, label: null }
  const metric = (m[1] ?? '').replace(/\s?%$/, ' %')
  const label = (m[2] ?? '').trim()
  return { metric, label: label === '' ? null : label }
}

/**
 * Reescribe el sector sin raya larga ni corta: la raya que Payload guarda
 * entre sector y subsector pasa a coma y lo que sigue empieza en minuscula
 * ("Salud" y "Urologia" separados por una raya larga dan "Salud, urologia").
 */
export function formatSector(value: string | null | undefined): string {
  return (value ?? '').trim().replace(SECTOR_DASH, (_all, next: string) => `, ${next.toLocaleLowerCase()}`)
}
