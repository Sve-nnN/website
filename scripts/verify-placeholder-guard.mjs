#!/usr/bin/env node
// Test del guard de placeholders que usan Hero y LocalProofSection.
//
// Replica src/lib/placeholder.ts. No se importa el modulo TS directamente para
// no arrastrar el toolchain de Next a un script suelto; si tocas uno, toca el
// otro. La forma de los datos de prueba sale del seed real
// (scripts/phase34-apply-local-landing.ts), no de ejemplos inventados.
//
// Uso: node scripts/verify-placeholder-guard.mjs

const MARKER = '[PLACEHOLDER]'
const isPlaceholder = (v) => typeof v === 'string' && v.includes(MARKER)
const omitPlaceholder = (v) => (isPlaceholder(v) ? undefined : v)
const withoutPlaceholders = (items, fields) =>
  !items ? [] : items.filter((item) => !fields.some((f) => isPlaceholder(item[f])))

// Valores exactos que producción servía el 2026-08-14.
const MADRID_STATS = [
  { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (clientes en Espana)' },
  { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (proyectos en Espana)' },
  { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (keywords investigadas)' },
]
const LIMA_STATS = [
  { value: '18', label: 'Asistentes en el taller SEO + IA 2025 (con Arianna Lupi)' },
  { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (clientes en Lima)' },
  { value: '0', label: '[PLACEHOLDER] Reemplazar con dato real (proyectos en Lima)' },
]
const MADRID_INLINE = '[PLACEHOLDER] Estadistica real pendiente — reemplazar antes de publicar'
const LIMA_INLINE = '+18 asistentes en el taller SEO + IA 2025 (con Arianna Lupi)'
const TESTIMONIAL = { quote: '[PLACEHOLDER] Testimonio real pendiente — reemplazar antes de publicar.' }

let failed = 0
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) {
    failed++
    console.log(`          esperado: ${JSON.stringify(want)}`)
    console.log(`          obtenido: ${JSON.stringify(got)}`)
  }
}

t('Madrid pierde sus 3 stats', withoutPlaceholders(MADRID_STATS, ['value', 'label']), [])
t('Lima conserva solo el dato real del taller', withoutPlaceholders(LIMA_STATS, ['value', 'label']), [
  LIMA_STATS[0],
])
t('el inlineStat de Madrid se oculta', omitPlaceholder(MADRID_INLINE), undefined)
t('el inlineStat de Lima sobrevive', omitPlaceholder(LIMA_INLINE), LIMA_INLINE)
t('el testimonio placeholder se detecta', isPlaceholder(TESTIMONIAL.quote), true)
t('un testimonio real no se detecta', isPlaceholder('Juan rehizo nuestra arquitectura.'), false)

// El bloque entero desaparece solo cuando no queda nada real.
const empty = (stats, testimonial) =>
  withoutPlaceholders(stats, ['value', 'label']).length === 0 &&
  !(isPlaceholder(testimonial?.quote) ? undefined : testimonial)?.quote
t('Madrid: el bloque se oculta entero', empty(MADRID_STATS, TESTIMONIAL), true)
t('Lima: el bloque se mantiene', empty(LIMA_STATS, TESTIMONIAL), false)

// Casos borde
t('null no rompe', withoutPlaceholders(null, ['label']), [])
t('undefined pasa sin tocar', omitPlaceholder(undefined), undefined)
t('marcador a mitad de frase tambien cuenta', isPlaceholder('Dato real [PLACEHOLDER] pendiente'), true)
t('valor no-string no rompe', isPlaceholder(42), false)

console.log()
if (failed) {
  console.log(`${failed} casos fallan.`)
  process.exit(1)
}
console.log('todos los casos pasan.')
