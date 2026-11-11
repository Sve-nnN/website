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

const {
  LEGAL_FACTS,
  LEGAL_EFFECTIVE_DATE,
  DECISIONS,
  PRIVACY_ES,
  TERMS_ES,
  PRIVACY_EN,
  TERMS_EN,
  buildTermsEn,
  buildPrivacyEs,
  buildTermsEs,
  buildPrivacyEn,
  withEvidenceFrom,
  PRIVACY_URL_ES,
  PRIVACY_URL_EN,
} = copy

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
  { label: 'una linea de fecha efectiva', test: (t) => /vigente desde|ultima actualizacion|última actualización|effective as of|effective date|last updated/i.test(t) },
]

const PROVIDERS = ['Resend', 'Cloudinary', 'Hetzner', 'Cloudflare']

/** Nombres de proveedores que el texto legal podria nombrar. Los de LEGAL_FACTS son los unicos permitidos. */
const KNOWN_PROVIDER_WORDS = ['Resend', 'Cloudinary', 'Hetzner', 'Cloudflare', 'Dokploy', 'Google', 'Amazon', 'Vercel', 'Neon', 'Hostinger', 'Mailchimp', 'Stripe']

/** Nombres de proveedores del texto que no estan en el conjunto permitido (los de LEGAL_FACTS). */
export function strayProviders(text: string, allowed: ReadonlySet<string>): string[] {
  return KNOWN_PROVIDER_WORDS.filter((w) => text.includes(w) && !allowed.has(w))
}

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

/** Enlaces de un documento en orden. La URL de privacidad del ES se compara con la del EN. */
export function linkHrefs(sections: readonly LegalSection[]): string[] {
  const out: string[] = []
  const take = (c: LegalSection['blocks'][number]) => {
    const parts = c.type === 'p' ? [c.content] : c.items.map((i) => i.content)
    for (const content of parts) for (const part of Array.isArray(content) ? content : [content]) if (typeof part !== 'string') out.push(part.href)
  }
  for (const s of sections) s.blocks.forEach(take)
  return out
}

/** Problemas de paridad ES y EN (T-56-36): mismas secciones, mismos bloques, mismos enlaces y mismos proveedores. */
export function parityProblems(es: readonly LegalSection[], en: readonly LegalSection[], providers: readonly string[]): string[] {
  const problems: string[] = []
  if (es.length !== en.length) problems.push(`secciones: ${es.length} en espanol y ${en.length} en ingles`)
  for (let i = 0; i < Math.min(es.length, en.length); i++) {
    const a = es[i].blocks
    const b = en[i].blocks
    if (a.length !== b.length) {
      problems.push(`seccion ${i + 1}: ${a.length} bloques en espanol y ${b.length} en ingles`)
      continue
    }
    a.forEach((block, j) => {
      const other = b[j]
      if (block.type !== other.type) problems.push(`seccion ${i + 1}, bloque ${j + 1}: tipo distinto`)
      else if (block.type === 'ul' && other.type === 'ul' && block.items.length !== other.items.length) {
        problems.push(`seccion ${i + 1}, lista ${j + 1}: ${block.items.length} elementos en espanol y ${other.items.length} en ingles`)
      } else if (block.type === 'p' && other.type === 'p' && block.evidence !== other.evidence) problems.push(`seccion ${i + 1}, bloque ${j + 1}: evidencia distinta`)
    })
  }
  const toNeutral = (u: string) => (u === PRIVACY_URL_EN ? PRIVACY_URL_ES : u)
  const esLinks = linkHrefs(es).join(' ')
  const enLinks = linkHrefs(en).map(toNeutral).join(' ')
  if (esLinks !== enLinks) problems.push(`enlaces distintos: ES [${esLinks}] y EN [${enLinks}]`)
  const esText = es.flatMap(sectionTexts).join('\n')
  const enText = en.flatMap(sectionTexts).join('\n')
  for (const w of providers) {
    if (esText.includes(w) !== enText.includes(w)) problems.push(`el proveedor ${w} no aparece en los dos idiomas`)
  }
  return problems
}

/** Un hecho no se afirma en un idioma y se calla en el otro (valor y detalles de texto). */
export function factParityProblems(facts: typeof LEGAL_FACTS): string[] {
  const problems: string[] = []
  for (const [key, f] of Object.entries(facts)) {
    if ((f.value.trim() === '') !== ((f.valueEn ?? '').trim() === '')) problems.push(`${key}: value y valueEn no estan los dos llenos o los dos vacios`)
    for (const [dk, dv] of Object.entries(f.details ?? {})) {
      if (dk === 'mentionDataLaw') continue
      if ((dv.trim() === '') !== ((f.detailsEn?.[dk] ?? '').trim() === '')) problems.push(`${key}.${dk}: ES y EN no estan los dos llenos o los dos vacios`)
    }
    for (const dk of Object.keys(f.detailsEn ?? {})) if (!(dk in (f.details ?? {}))) problems.push(`${key}.${dk}: existe en detailsEn y no en details`)
  }
  return problems
}

/** El ingles no arrastra espanol: sin tildes, enye ni signos de apertura. */
export function spanishLeaks(sections: readonly LegalSection[]): string[] {
  const all = sections.flatMap(sectionTexts).join('\n')
  return all.match(/[áéíóúñ¿¡Á-Ú]/g) ?? []
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
const DOC_IDS = ['LEGAL-PRIVACY-ES', 'LEGAL-PRIVACY-EN', 'LEGAL-TERMS-ES', 'LEGAL-TERMS-EN']
const FACT_IDS = FACT_KEYS.map((k) => `LEGAL-FACT-${k.replace(/_/g, '-')}`)
check(
  validateDecisions(DECISIONS).length === 0 &&
    DECISIONS.length === DOC_IDS.length + FACT_IDS.length &&
    DECISIONS.every((d) => d.gate === 'aprobado' && d.id.startsWith('LEGAL-')) &&
    [...DOC_IDS, ...FACT_IDS].every((id) => DECISIONS.some((d) => d.id === id)),
  'DECISIONS: una por documento e idioma (4) y una por hecho (6), validas y con gate aprobado',
  validateDecisions(DECISIONS).join('; ') || `cantidad ${DECISIONS.length}: ${DECISIONS.map((d) => d.id).join(', ')}`,
)
check(
  DECISIONS.filter((d) => DOC_IDS.includes(d.id)).every((d) => d.status === 'propuesto' && d.options !== undefined && d.recommended === 'propuesto' && d.chosen === 'propuesto'),
  'las cuatro decisiones de documento quedan propuesto hasta que Juan responda',
  'una decision de documento no esta propuesta',
)
check(
  DOC_IDS.every((id) => {
    const d = DECISIONS.find((x) => x.id === id)
    const lang = id.endsWith('-EN') ? 'en' : 'es'
    const other = lang === 'en' ? 'es' : 'en'
    return !!d?.preview?.[lang] && d.preview[lang]!.includes('## ') && d.preview[other] === undefined
  }),
  'cada decision de documento trae su texto completo como vista previa para 56-review-export',
  'falta la vista previa o esta en el idioma equivocado',
)
check(
  DECISIONS.filter((d) => FACT_IDS.includes(d.id)).every((d) => Object.values(d.options ?? {}).every((o) => (o.es ?? '') !== '' && (o.en ?? '') !== '')),
  'cada opcion de cada hecho trae el valor en espanol y en ingles',
  'una opcion sin es o sin en',
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

// ---------------------------------------------------------------- privacy en ingles (plan 56-11)

{
  const enProblems = docProblems(PRIVACY_EN, [...PROVIDERS, 'NEXT_LOCALE', 'hello@juan-tech.com'])
  check(enProblems.length === 0, 'PRIVACY_EN cumple encabezados, evidencia, proveedores y cadenas prohibidas', enProblems.join(' | '))
  const enHeads = extractHeadings(sectionsToLexical(PRIVACY_EN).root as unknown as LexicalRootLike)
  check(
    enHeads.length === PRIVACY_EN.length && enHeads.every((h, i) => h.text === PRIVACY_EN[i].title && h.level === 2) && new Set(enHeads.map((h) => h.id)).size === enHeads.length,
    'extractHeadings acepta PRIVACY_EN: un h2 por seccion e ids unicos',
    `${enHeads.length} de ${PRIVACY_EN.length}`,
  )
  const par = parityProblems(PRIVACY_ES, PRIVACY_EN, [...PROVIDERS, 'Dokploy', 'NEXT_LOCALE', 'hello@juan-tech.com'])
  check(par.length === 0 && PRIVACY_EN.length === PRIVACY_ES.length, 'PRIVACY_EN y PRIVACY_ES: mismas secciones, bloques, enlaces, evidencia y proveedores', par.join(' | '))
  const factPar = factParityProblems(LEGAL_FACTS)
  check(factPar.length === 0, 'cada hecho de LEGAL_FACTS esta en los dos idiomas o en ninguno', factPar.join(' | '))
  check(spanishLeaks(PRIVACY_EN).length === 0, 'PRIVACY_EN no trae tildes ni signos del espanol', spanishLeaks(PRIVACY_EN).join(''))
  const enAll = PRIVACY_EN.flatMap(sectionTexts).join('\n')
  check(/does not store them in any database/.test(enAll), 'privacy EN dice que el formulario de contacto no guarda nada en la base', 'falta la frase')
  check(/I do not store your IP address/.test(enAll) && /server's memory/.test(enAll), 'privacy EN dice que la IP solo vive en memoria y no se guarda', 'falta la frase')
  check(/two steps/.test(enAll), 'privacy EN describe la confirmacion en dos pasos de los suscriptores', 'falta la frase')
  check(!enAll.includes('Germany') && enAll.includes('an email provider'), 'sin region ni buzon confirmados el EN no inventa ninguno', 'el texto nombra un dato sin confirmar')
  check(
    /legal rights|rights/.test(enAll) && ['Access', 'Correction', 'Deletion', 'Portability', 'Restriction', 'Objection', 'Withdrawing your consent'].every((r) => enAll.includes(r)),
    'privacy EN nombra los siete derechos (acceso, correccion, supresion, portabilidad, limitacion, oposicion y retiro del consentimiento)',
    'falta un derecho',
  )
  const changedEn = buildPrivacyEn({
    ...LEGAL_FACTS,
    HOSTING: { ...LEGAL_FACTS.HOSTING, detailsEn: { region: 'Germany', logRetention: '14 days' } },
    MAILBOX_PROVIDER: { ...LEGAL_FACTS.MAILBOX_PROVIDER, valueEn: 'TestProvider' },
    RETENTION_CONTACT_EMAIL: { ...LEGAL_FACTS.RETENTION_CONTACT_EMAIL, valueEn: '6 months' },
  })
    .flatMap(sectionTexts)
    .join('\n')
  check(
    changedEn.includes('The server is in Germany') && changedEn.includes('TestProvider') && changedEn.includes('up to 6 months') && changedEn.includes('14 days'),
    'cambiar un hecho de LEGAL_FACTS cambia el texto en ingles',
    'el texto en ingles no cambio',
  )
  const noLaw = buildPrivacyEn({ ...LEGAL_FACTS, GOVERNING_LAW: { ...LEGAL_FACTS.GOVERNING_LAW, details: { ...LEGAL_FACTS.GOVERNING_LAW.details, mentionDataLaw: 'no' } } })
    .flatMap(sectionTexts)
    .join('\n')
  check(enAll.includes('Law 29733') && !noLaw.includes('Law 29733'), 'mentionDataLaw=no quita la ley de datos en ingles', 'la bandera no cambia el ingles')
  let threw = false
  try {
    withEvidenceFrom(PRIVACY_ES, [{ title: 'Solo una', blocks: [{ type: 'p', content: 'x' }] }], 'fixture')
  } catch {
    threw = true
  }
  check(threw, 'withEvidenceFrom lanza si el ingles tiene otra estructura que el espanol', 'no lanzo')
  const shortEn = PRIVACY_EN.slice(0, -1)
  check(parityProblems(PRIVACY_ES, shortEn, PROVIDERS).some((p) => /secciones/.test(p)), 'la paridad detecta una seccion que falta en ingles', 'no detecto nada')
  const rename = (content: string | (string | { text: string; href: string })[]): typeof content =>
    typeof content === 'string'
      ? content.replace(/Resend/g, 'Mailer')
      : content.map((part) => (typeof part === 'string' ? part.replace(/Resend/g, 'Mailer') : part))
  const noResend: LegalSection[] = PRIVACY_EN.map((sec) => ({
    ...sec,
    blocks: sec.blocks.map((b) => (b.type === 'p' ? { ...b, content: rename(b.content) } : { ...b, items: b.items.map((it) => ({ ...it, content: rename(it.content) })) })),
  }))
  check(parityProblems(PRIVACY_ES, noResend, PROVIDERS).some((p) => /Resend/.test(p)), 'la paridad detecta un proveedor que falta en ingles', 'no detecto nada')
  check(factParityProblems({ ...LEGAL_FACTS, MAILBOX_PROVIDER: { ...LEGAL_FACTS.MAILBOX_PROVIDER, value: 'ProveedorX' } }).length === 1, 'la paridad de hechos detecta un valor solo en espanol', 'no detecto nada')
}

// ---------------------------------------------------------------- terminos

{
  const termsProblems = docProblems(TERMS_ES, ['hello@juan-tech.com'])
  check(termsProblems.length === 0, 'TERMS_ES cumple encabezados, evidencia y cadenas prohibidas', termsProblems.join(' | '))
  const termsLex = sectionsToLexical(TERMS_ES)
  const termsHeads = extractHeadings(termsLex.root as unknown as LexicalRootLike)
  check(termsHeads.length === TERMS_ES.length && termsHeads.every((h, i) => h.text === TERMS_ES[i].title), 'extractHeadings acepta el estado de TERMS_ES', `${termsHeads.length} de ${TERMS_ES.length}`)
  const allowed = new Set([...PROVIDERS, ...Object.values(LEGAL_FACTS).map((f) => f.value).filter(Boolean)])
  const termsAll = TERMS_ES.flatMap(sectionTexts).join('\n')
  const stray = strayProviders(termsAll, allowed)
  check(stray.length === 0, 'ninguna seccion de terms nombra un proveedor que no sea de LEGAL_FACTS', stray.join(', '))
  check(/Perú/.test(termsAll) && termsAll.includes(LEGAL_FACTS.GOVERNING_LAW.value), 'terms usa la ley aplicable de LEGAL_FACTS.GOVERNING_LAW', 'falta')
  const changedTerms = buildTermsEs({ ...LEGAL_FACTS, GOVERNING_LAW: { ...LEGAL_FACTS.GOVERNING_LAW, value: 'PaísDePrueba' } }).flatMap(sectionTexts).join('\n')
  check(changedTerms.includes('PaísDePrueba'), 'cambiar GOVERNING_LAW cambia terms', 'terms no cambio')
  check(/comisi/.test(termsAll) && /sin costo/.test(termsAll), 'terms divulga los enlaces de afiliado', 'falta la divulgacion')
}

// ---------------------------------------------------------------- terminos en ingles (plan 56-11)

{
  const termsEnProblems = docProblems(TERMS_EN, ['hello@juan-tech.com'])
  check(termsEnProblems.length === 0, 'TERMS_EN cumple encabezados, evidencia y cadenas prohibidas', termsEnProblems.join(' | '))
  const heads = extractHeadings(sectionsToLexical(TERMS_EN).root as unknown as LexicalRootLike)
  check(heads.length === TERMS_EN.length && heads.every((h, i) => h.text === TERMS_EN[i].title && h.level === 2), 'extractHeadings acepta el estado de TERMS_EN', `${heads.length} de ${TERMS_EN.length}`)
  const par = parityProblems(TERMS_ES, TERMS_EN, PROVIDERS)
  check(par.length === 0 && TERMS_EN.length === TERMS_ES.length, 'TERMS_EN y TERMS_ES: mismas secciones, bloques, enlaces y evidencia', par.join(' | '))
  check(spanishLeaks(TERMS_EN).length === 0, 'TERMS_EN no trae tildes ni signos del espanol', spanishLeaks(TERMS_EN).join(''))
  const allowed = new Set([...PROVIDERS, ...Object.values(LEGAL_FACTS).map((f) => f.value).filter(Boolean)])
  const termsEnAll = TERMS_EN.flatMap(sectionTexts).join('\n')
  const stray = strayProviders(termsEnAll, allowed)
  check(stray.length === 0, 'ninguna seccion de terms EN nombra un proveedor que no sea de LEGAL_FACTS', stray.join(', '))
  check(termsEnAll.includes('Peru') && termsEnAll.includes(LEGAL_FACTS.GOVERNING_LAW.valueEn ?? ''), 'terms EN usa la ley aplicable de LEGAL_FACTS.GOVERNING_LAW', 'falta')
  const changedTermsEn = buildTermsEn({ ...LEGAL_FACTS, GOVERNING_LAW: { ...LEGAL_FACTS.GOVERNING_LAW, valueEn: 'TestCountry' } }).flatMap(sectionTexts).join('\n')
  check(changedTermsEn.includes('TestCountry'), 'cambiar GOVERNING_LAW cambia terms EN', 'terms EN no cambio')
  check(/commission/.test(termsEnAll) && /no extra cost/.test(termsEnAll), 'terms EN divulga los enlaces de afiliado', 'falta la divulgacion')
  const linksEn = linkHrefs(TERMS_EN)
  check(linksEn.includes(PRIVACY_URL_EN) && !linksEn.includes(PRIVACY_URL_ES), 'terms EN enlaza a la privacidad en ingles', linksEn.join(', '))
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
check(
  strayProviders('Uso Amazon y Resend', new Set(['Resend'])).join() === 'Amazon' && strayProviders('Solo Resend', new Set(['Resend'])).length === 0,
  'la autoprueba detecta un proveedor fuera de LEGAL_FACTS en terms',
  'strayProviders no detecto Amazon',
)
check(docProblems([section('Datos', 'Resend')], goodReq).length === 0, 'la autoprueba acepta un documento bueno', docProblems([section('Datos', 'Resend')], goodReq).join(' | '))

if (failures > 0) {
  console.log(`\nFAIL ${failures} caso(s)`)
  process.exit(1)
}
console.log('\nPASS autoprueba legal')
