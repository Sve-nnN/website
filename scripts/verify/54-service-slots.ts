/**
 * Prueba de ranuras de la landing de servicio (fase 54, plan 54-09).
 *
 * Descarga los docs REALES de produccion (API publica anonima, solo lectura) de
 * los cuatro servicios en es y en, y comprueba que `composeServiceSlots`:
 *   - encuentra hero y scope,
 *   - da exactamente un `problem`,
 *   - no deja ningun bloque `generic`,
 *   - no pierde ningun bloque (sections + 2 === largo del layout),
 *   - para seo-technical-audit entrega la secuencia exacta de kinds.
 * Ademas corre tres casos sinteticos (tres columnas, reordenado, blockType desconocido).
 *
 *   node_modules/.bin/tsx scripts/verify/54-service-slots.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Si la red falla reintenta una vez y termina con FAIL que nombra la red.
 */
import { composeServiceSlots, type ServiceLayoutBlock } from '../../src/lib/service-slots'

const BASE = process.env.SERVICE_SLOTS_BASE_URL ?? 'https://juan-tech.com'
const SLUGS = ['seo-technical-audit', 'seo-consulting', 'fullstack-development', 'ai-seo-geo'] as const
const LOCALES = ['es', 'en'] as const

const AUDIT_SEQUENCE = [
  'problem',
  'cta',
  'twoColumns',
  'auditor',
  'logos',
  'testimonials',
  'caseProof',
  'faq',
  'cta:closing',
]

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

async function fetchDoc(slug: string, locale: string): Promise<{ layout: ServiceLayoutBlock[] }> {
  const url = `${BASE}/api/pages?where[slug][equals]=${slug}&locale=${locale}&depth=0&limit=1`
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { docs?: Array<{ content?: { layout?: ServiceLayoutBlock[] } }> }
      const doc = json.docs?.[0]
      if (!doc) throw new Error('sin doc en la respuesta')
      return { layout: doc.content?.layout ?? [] }
    } catch (err) {
      lastErr = err
    }
  }
  throw new Error(`red: ${url} fallo dos veces (${lastErr instanceof Error ? lastErr.message : String(lastErr)})`)
}

function sequenceOf(sections: ReturnType<typeof composeServiceSlots>['sections']): string[] {
  return sections.map((s) => (s.kind === 'cta' && s.closing ? 'cta:closing' : s.kind))
}

function col(): { id: string; size: 'full'; richText: never } {
  return { id: 'c', size: 'full', richText: {} as never }
}

async function main(): Promise<void> {
  // ---- Casos sinteticos (no usan la red) ----
  const synthetic = (blocks: Array<Record<string, unknown>>) => blocks as unknown as ServiceLayoutBlock[]

  {
    const slots = composeServiceSlots(
      synthetic([
        { blockType: 'hero' },
        { blockType: 'content', columns: [col()] },
        { blockType: 'content', columns: [col(), col(), col()] },
      ]),
    )
    check(
      slots.sections[1]?.kind === 'prose',
      'sintetico: segundo content con tres columnas',
      `dio ${slots.sections[1]?.kind}, se esperaba prose`,
    )
  }
  {
    const original = synthetic([
      { blockType: 'faq' },
      { blockType: 'content', columns: [col()] },
      { blockType: 'serviceScopeCard' },
      { blockType: 'callToAction' },
      { blockType: 'hero' },
      { blockType: 'callToAction' },
      { blockType: 'content', columns: [col(), col()] },
    ])
    const slots = composeServiceSlots(original)
    const seq = sequenceOf(slots.sections)
    check(
      slots.hero !== null && slots.scope !== null && slots.sections.length + 2 === original.length,
      'sintetico: layout reordenado conserva todos los bloques',
      `hero ${slots.hero !== null}, scope ${slots.scope !== null}, secciones ${slots.sections.length} de ${original.length - 2}`,
    )
    check(
      JSON.stringify(seq) === JSON.stringify(['faq', 'problem', 'cta', 'cta:closing', 'twoColumns']),
      'sintetico: reordenado respeta el orden y marca el ultimo cta como cierre',
      `secuencia ${JSON.stringify(seq)}`,
    )
  }
  {
    const slots = composeServiceSlots(synthetic([{ blockType: 'bloqueQueNoExiste', id: 'x' }]))
    check(
      slots.sections.length === 1 && slots.sections[0]?.kind === 'generic',
      'sintetico: blockType desconocido da generic',
      `dio ${JSON.stringify(slots.sections.map((s) => s.kind))}`,
    )
  }
  {
    const slots = composeServiceSlots(null)
    check(
      slots.hero === null && slots.scope === null && slots.sections.length === 0,
      'sintetico: layout vacio',
      'no devolvio ranuras vacias',
    )
  }

  // ---- Docs reales ----
  for (const slug of SLUGS) {
    for (const locale of LOCALES) {
      const name = `real ${slug} ${locale}`
      let layout: ServiceLayoutBlock[]
      try {
        layout = (await fetchDoc(slug, locale)).layout
      } catch (err) {
        check(false, name, err instanceof Error ? err.message : String(err))
        continue
      }
      const slots = composeServiceSlots(layout)
      const problems = slots.sections.filter((s) => s.kind === 'problem').length
      const generics = slots.sections.filter((s) => s.kind === 'generic').map((s) => s.block.blockType)
      const reasons: string[] = []
      if (!slots.hero) reasons.push('falta hero')
      if (!slots.scope) reasons.push('falta scope')
      if (problems !== 1) reasons.push(`problem aparece ${problems} veces`)
      if (generics.length > 0) reasons.push(`bloques genericos: ${generics.join(', ')}`)
      if (slots.sections.length + 2 !== layout.length) {
        reasons.push(`se perdio un bloque (secciones ${slots.sections.length} + 2 distinto de ${layout.length})`)
      }
      if (slug === 'seo-technical-audit') {
        const seq = sequenceOf(slots.sections)
        if (JSON.stringify(seq) !== JSON.stringify(AUDIT_SEQUENCE)) {
          reasons.push(`secuencia ${JSON.stringify(seq)} distinta de ${JSON.stringify(AUDIT_SEQUENCE)}`)
        }
      }
      check(reasons.length === 0, name, reasons.join('; '))
    }
  }

  if (failures > 0) {
    console.log(`\n${failures} caso(s) en FAIL`)
    process.exit(1)
  }
  console.log('\nPASS 54-service-slots')
}

main().catch((err) => {
  console.log(`FAIL inesperado: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
