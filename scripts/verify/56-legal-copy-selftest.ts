/**
 * Autoprueba del texto legal en espanol (fase 56, plan 56-05, CONT-03).
 *
 * No toca ninguna base ni la red. Comprueba, sobre PRIVACY_ES (y TERMS_ES cuando existe):
 *   - el constructor Lexical produce un estado que acepta extractHeadings;
 *   - los enlaces solo son https o mailto;
 *   - cada hecho de LEGAL_FACTS tiene status valido y evidencia, y DECISIONS es valido;
 *   - ningun encabezado lleva punto, coma ni numero inicial;
 *   - cada bloque y cada elemento de lista lleva evidencia;
 *   - estan los proveedores reales (Resend, Cloudinary, Hetzner, Cloudflare), NEXT_LOCALE
 *     y hello@juan-tech.com en privacy;
 *   - no aparecen el hosting anterior, Google Analytics, Cloudflare Insights, rayas largas
 *     o medias, marcadores de ranura ni una fecha efectiva (D-09);
 *   - cambiar un hecho de LEGAL_FACTS cambia el texto (la correccion es de una linea);
 *   - la propia autoprueba rechaza fixtures defectuosos.
 *
 *   node_modules/.bin/tsx scripts/verify/56-legal-copy-selftest.ts
 *
 * Imprime PASS o FAIL por caso y sale con 1 ante cualquier FAIL.
 */
import * as copy from '../db/data/56-legal-copy'
import { validateDecisions } from '../db/data/56-content-decisions'
import {
  assertSafeHref,
  inlineText,
  sectionsToLexical,
  sectionTexts,
  type LegalSection,
} from '../db/data/56-legal-lexical'
import { extractHeadings, type LexicalRootLike } from '../../src/components/mui/rich-text/lexical-toc'

const { LEGAL_FACTS, LEGAL_EFFECTIVE_DATE, DECISIONS, PRIVACY_ES, buildPrivacyEs } = copy
// TERMS_ES lo agrega la tarea 2; la autoprueba lo exige en cuanto existe.
const TERMS_ES = (copy as { TERMS_ES?: LegalSection[] }).TERMS_ES
const buildTermsEs = (copy as { buildTermsEs?: (f: typeof LEGAL_FACTS) => LegalSection[] }).buildTermsEs

// Las cadenas prohibidas se arman por codigo para que este archivo no las contenga.
const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const SLOT = String.fromCharCode(123, 123)
const OLD_HOST = ['Host', 'inger'].join('')
const OLD_ANALYTICS = ['Google', ' ', 'Analytics'].join('')
const OLD_INSIGHTS = ['Cloudflare', ' ', 'Insights'].join('')

const FORBIDDEN: { label: string; test: (t: string) => boolean }[] = [
  { label: 'el hosting anterior', test: (t) => t.toLowerCase().includes(OLD_HOST.toLowerCase()) },
  { label: 'la analitica anterior', test: (t) => t.toLowerCase().includes(OLD_ANALYTICS.toLowerCase()) },
  { label: 'Cloudflare anterior de analitica', test: (t) => t.toLowerCase().includes(OLD_INSIGHTS.toLowerCase()) },
  { label: 'raya larga', test: (t) => t.includes(EM_DASH) },
  { label: 'raya media', test: (t) => t.includes(EN_DASH) },
  { label: 'marcador de ranura', test: (t) => t.includes(SLOT) },
  // D-09: el texto no inventa ni fija la fecha efectiva (un ano de cuatro cifras delataria una).
  { label: 'un ano o una fecha efectiva', test: (t) => /\b(19|20)\d{2}\b/.test(t) },
  { label: 'una linea de fecha efectiva', test: (t) => /vigente desde|ultima actualizacion|última actualización|effective as of/i.test(t) },
]

const PROVIDERS = ['Resend', 'Cloudinary', 'Hetzner', 'Cloudflare']

/** Nombres de proveedores que el texto legal podria nombrar. Los de LEGAL_FACTS son los unicos permitidos. */
const KNOWN_PROVIDER_WORDS = ['Resend', 'Cloudinary', 'Hetzner', 'Cloudflare', 'Dokploy', 'Google', 'Amazon', 'Vercel', 'Neon', 'Hostinger', 'Mailchimp', 'Stripe']

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) console.log(`PASS ${name}`)
  else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

/** Problemas de un documento: encabezados, evidencia, cadenas prohibidas y requeridas. */
export function docProblems(sections: readonly LegalSection[], required: readonly string[]): string[] {
  const problems: string[] = []
  for (const s of sections) {
    if (/[.,]/.test(s.title)) problems.push(`encabezado con punto o coma: "${s.title}"`)
    if (/^\s*\d/.test(s.title)) problems.push(`encabezado con numero inicial: "${s.title}"`)
    if (s.blocks.length === 0) problems.push(`seccion sin bloques: "${s.title}"`)
    for (const b of s.blocks) {
      if (b.type === 'p') {
        if (!b.evidence?.trim()) problems.push(`parrafo sin evidencia en "${s.title}"`)
      } else {
        for (const it of b.items) if (!it.evidence?.trim()) problems.push(`elemento sin evidencia en "${s.title}": ${inlineText(it.content).slice(0, 40)}`)
      }
    }
  }
  const all = sections.flatMap(sectionTexts).join('\n')
  for (const f of FORBIDDEN) if (f.test(all)) problems.push(`contiene ${f.label}`)
  for (const r of required) if (!all.includes(r)) problems.push(`falta "${r}"`)
  return problems
}

function section(title: string, text = 'texto', evidence = 'evidencia'): LegalSection {
  return { title, blocks: [{ type: 'p', content: text, evidence }] }
}

// ---------------------------------------------------------------- hechos y decisiones

check(LEGAL_EFFECTIVE_DATE === '', 'LEGAL_EFFECTIVE_DATE vacia hasta el corte (D-09)', `vale "${LEGAL_EFFECTIVE_DATE}"`)

const FACT_KEYS = ['HOSTING', 'MAILBOX_PROVIDER', 'RETENTION_CONTACT_EMAIL', 'RETENTION_SUBSCRIBERS', 'COOKIE_BANNER', 'GOVERNING_LAW'] as const
check(
  FACT_KEYS.every((k) => k in LEGAL_FACTS) && Object.keys(LEGAL_FACTS).length === FACT_KEYS.length,
  'LEGAL_FACTS tiene los seis hechos',
  `claves: ${Object.keys(LEGAL_FACTS).join(', ')}`,
)
for (const k of FACT_KEYS) {
  const f = LEGAL_FACTS[k]
  const okStatus = f.status === 'propuesto' || f.status === 'pendiente' || f.status === 'aprobado'
  check(okStatus && f.evidence.trim().length > 20 && f.label.trim() !== '', `LEGAL_FACTS.${k} tiene status, etiqueta y evidencia`, `status=${f.status}`)
}
check(LEGAL_FACTS.HOSTING.value === 'Hetzner', 'HOSTING nombra a Hetzner (D-08)', `vale "${LEGAL_FACTS.HOSTING.value}"`)
check(
  validateDecisions(DECISIONS).length === 0 && DECISIONS.length === 6 && DECISIONS.every((d) => d.gate === 'aprobado' && d.id.startsWith('LEGAL-')),
  'DECISIONS: seis decisiones LEGAL-, validas y con gate aprobado',
  validateDecisions(DECISIONS).join('; ') || `cantidad ${DECISIONS.length}`,
)

// ---------------------------------------------------------------- constructor Lexical

const lex = sectionsToLexical(PRIVACY_ES)
const heads = extractHeadings(lex.root as unknown as LexicalRootLike)
check(
  heads.length === PRIVACY_ES.length && heads.every((h, i) => h.text === PRIVACY_ES[i].title && h.level === 2),
  'extractHeadings acepta el estado de PRIVACY_ES y reconoce un h2 por seccion',
  `${heads.length} encabezados para ${PRIVACY_ES.length} secciones`,
)
check(new Set(heads.map((h) => h.id)).size === heads.length, 'los ids de los encabezados son unicos', 'ids repetidos')
const nodeTypes = new Set<string>()
const linkUrls: string[] = []
function walk(node: unknown): void {
  if (!node || typeof node !== 'object') return
  const n = node as { type?: string; fields?: { url?: string }; children?: unknown[] }
  if (n.type) nodeTypes.add(n.type)
  if (n.type === 'link' && n.fields?.url) linkUrls.push(n.fields.url)
  n.children?.forEach(walk)
}
walk(lex.root)
check(['heading', 'paragraph', 'list', 'listitem', 'link', 'text'].every((t) => nodeTypes.has(t)), 'el estado trae encabezado, parrafo, lista, elemento, enlace y texto', [...nodeTypes].join(', '))
check(linkUrls.length > 0 && linkUrls.every((u) => /^(https:\/\/|mailto:)/.test(u)), 'todos los enlaces son https o mailto', linkUrls.join(', '))
check(JSON.stringify(lex).includes('"<') === false && !/<\/?[a-z]+[ >]/i.test(JSON.stringify(lex)), 'el texto entra como nodos de texto, sin HTML', 'hay etiquetas en el estado')
let rejectedJs = false
let rejectedHttp = false
try {
  assertSafeHref('javascript:alert(1)')
} catch {
  rejectedJs = true
}
try {
  assertSafeHref('http://ejemplo.com')
} catch {
  rejectedHttp = true
}
check(rejectedJs && rejectedHttp, 'assertSafeHref rechaza javascript: y http:', `js=${rejectedJs} http=${rejectedHttp}`)

// ---------------------------------------------------------------- reglas del documento

const privacyProblems = docProblems(PRIVACY_ES, [...PROVIDERS, 'NEXT_LOCALE', 'hello@juan-tech.com'])
check(privacyProblems.length === 0, 'PRIVACY_ES cumple encabezados, evidencia, proveedores y cadenas prohibidas', privacyProblems.join(' | '))

const privacyAll = PRIVACY_ES.flatMap(sectionTexts).join('\n')
check(
  /no los guarda en ninguna base de datos/.test(privacyAll),
  'privacy dice que el formulario de contacto no guarda nada en la base (corrige D-08)',
  'falta la frase',
)
check(/No guardo tu dirección IP/.test(privacyAll) && /memoria del servidor/.test(privacyAll), 'privacy dice que la IP solo vive en memoria y no se guarda', 'falta la frase')
check(/doble|dos pasos/.test(privacyAll), 'privacy describe la confirmacion en dos pasos de los suscriptores', 'falta la frase')

// ---------------------------------------------------------------- el cambio de un hecho es de una linea

const changedFacts = {
  ...LEGAL_FACTS,
  HOSTING: { ...LEGAL_FACTS.HOSTING, details: { region: 'Alemania', logRetention: '14 días' } },
  MAILBOX_PROVIDER: { ...LEGAL_FACTS.MAILBOX_PROVIDER, value: 'ProveedorDePrueba' },
  RETENTION_CONTACT_EMAIL: { ...LEGAL_FACTS.RETENTION_CONTACT_EMAIL, value: '6 meses' },
}
const changed = buildPrivacyEs(changedFacts).flatMap(sectionTexts).join('\n')
check(
  changed.includes('El servidor está en Alemania') && changed.includes('ProveedorDePrueba') && changed.includes('hasta 6 meses') && changed.includes('14 días'),
  'cambiar un hecho de LEGAL_FACTS cambia el texto',
  'el texto no cambio',
)
check(!privacyAll.includes('Alemania') && privacyAll.includes('un proveedor de correo'), 'sin region ni buzon confirmados el texto no inventa ninguno', 'el texto nombra un dato sin confirmar')

// ---------------------------------------------------------------- terminos (tarea 2)

if (TERMS_ES && buildTermsEs) {
  const termsProblems = docProblems(TERMS_ES, ['hello@juan-tech.com'])
  check(termsProblems.length === 0, 'TERMS_ES cumple encabezados, evidencia y cadenas prohibidas', termsProblems.join(' | '))
  const termsLex = sectionsToLexical(TERMS_ES)
  const termsHeads = extractHeadings(termsLex.root as unknown as LexicalRootLike)
  check(termsHeads.length === TERMS_ES.length && termsHeads.every((h, i) => h.text === TERMS_ES[i].title), 'extractHeadings acepta el estado de TERMS_ES', `${termsHeads.length} de ${TERMS_ES.length}`)
  const allowed = new Set([...PROVIDERS, ...Object.values(LEGAL_FACTS).map((f) => f.value).filter(Boolean)])
  const termsAll = TERMS_ES.flatMap(sectionTexts).join('\n')
  const stray = KNOWN_PROVIDER_WORDS.filter((w) => termsAll.includes(w) && !allowed.has(w))
  check(stray.length === 0, 'ninguna seccion de terms nombra un proveedor que no sea de LEGAL_FACTS', stray.join(', '))
  check(/Perú/.test(termsAll) && termsAll.includes(LEGAL_FACTS.GOVERNING_LAW.value), 'terms usa la ley aplicable de LEGAL_FACTS.GOVERNING_LAW', 'falta')
  const changedTerms = buildTermsEs({ ...LEGAL_FACTS, GOVERNING_LAW: { ...LEGAL_FACTS.GOVERNING_LAW, value: 'PaísDePrueba' } }).flatMap(sectionTexts).join('\n')
  check(changedTerms.includes('PaísDePrueba'), 'cambiar GOVERNING_LAW cambia terms', 'terms no cambio')
  check(/comisi/.test(termsAll) && /sin costo/.test(termsAll), 'terms divulga los enlaces de afiliado', 'falta la divulgacion')
}

// ---------------------------------------------------------------- la autoprueba rechaza lo malo

const goodReq = ['Resend']
const bad: { name: string; sections: LegalSection[]; expect: RegExp }[] = [
  { name: 'encabezado con numero', sections: [section('1 Quién soy', 'Resend')], expect: /numero inicial/ },
  { name: 'encabezado con punto', sections: [section('Quién soy.', 'Resend')], expect: /punto o coma/ },
  { name: 'encabezado con coma', sections: [section('Datos, cookies', 'Resend')], expect: /punto o coma/ },
  { name: 'bloque sin evidencia', sections: [section('Datos', 'Resend', '')], expect: /sin evidencia/ },
  { name: 'hosting anterior', sections: [section('Datos', `Resend y ${OLD_HOST}`)], expect: /hosting anterior/ },
  { name: 'analitica anterior', sections: [section('Datos', `Resend y ${OLD_ANALYTICS}`)], expect: /analitica anterior/ },
  { name: 'Cloudflare Insights', sections: [section('Datos', `Resend y ${OLD_INSIGHTS}`)], expect: /Cloudflare anterior/ },
  { name: 'raya larga', sections: [section('Datos', `Resend ${EM_DASH} algo`)], expect: /raya larga/ },
  { name: 'raya media', sections: [section('Datos', `Resend ${EN_DASH} algo`)], expect: /raya media/ },
  { name: 'marcador de ranura', sections: [section('Datos', `Resend ${SLOT}pendiente}}`)], expect: /marcador/ },
  { name: 'fecha efectiva inventada', sections: [section('Datos', 'Resend, vigente desde el 3 de enero de 2026')], expect: /ano o una fecha|linea de fecha/ },
  { name: 'proveedor requerido ausente', sections: [section('Datos', 'nada')], expect: /falta "Resend"/ },
]
for (const c of bad) {
  const found = docProblems(c.sections, goodReq)
  check(found.some((p) => c.expect.test(p)), `la autoprueba rechaza: ${c.name}`, found.join(' | ') || 'no detecto nada')
}
check(docProblems([section('Datos', 'Resend')], goodReq).length === 0, 'la autoprueba acepta un documento bueno', docProblems([section('Datos', 'Resend')], goodReq).join(' | '))

if (failures > 0) {
  console.log(`\nFAIL ${failures} caso(s)`)
  process.exit(1)
}
console.log('\nPASS autoprueba legal')
