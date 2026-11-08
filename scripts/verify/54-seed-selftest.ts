/**
 * Autoprueba de los scripts de siembra de la fase 54 (plan 54-04).
 *
 * tsc no revisa scripts/ (excluido en tsconfig): la forma de los datos se
 * comprueba aquí, en tiempo de ejecución. No toca ninguna base ni la red.
 *
 *   node_modules/.bin/tsx scripts/verify/54-seed-selftest.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  assertNoForbiddenChars,
  assertPendingMarkersOnlyIn,
  assertSafeTarget,
  buildDiff,
  layoutDiffIgnoring,
  mergeGroup,
  missingCloudinaryVars,
  normalizeName,
  prepareImage,
  safeTarget,
} from '../db/data/54-seed-lib'
import { MEDIA_MANIFEST } from '../db/data/54-media-manifest'
import { ABOUT_COPY_ES, ABOUT_PENDING_PATHS } from '../db/data/54-about-copy'
import { HOME_COPY_ES, ON_DARK_FILES, SANDBOX_LOGOS } from '../db/data/54-home-copy'
import { SERVICE_SLUGS } from '../../src/lib/service-slugs'
import {
  ABOUT_CHIP_ICON_NAMES,
  CONTACT_ICON_NAMES,
  SERVICE_ICON_NAMES,
} from '../../src/lib/shadow-icons'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

let failures = 0

function check(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (err) {
    failures++
    console.log(`FAIL ${name}: ${(err as Error).message}`)
  }
}

function expectThrows(fn: () => unknown, label: string) {
  let threw = false
  try {
    fn()
  } catch {
    threw = true
  }
  if (!threw) throw new Error(`${label}: debía lanzar y no lanzó`)
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

const EM = String.fromCharCode(0x2014)
const EN = String.fromCharCode(0x2013)
const OPEN = '{' + '{'

// ---------------------------------------------------------------------------
// Guardias de base
// ---------------------------------------------------------------------------
check('assertSafeTarget rechaza neon.tech (la base abandonada del incidente)', () => {
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@ep-hidden-heart-atc1vys8.neon.tech/neondb', false, false),
    'neon.tech',
  )
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@ep-x.neon.tech/juantech', true, true),
    'neon.tech con nombre juantech',
  )
})

check('assertSafeTarget rechaza una base que no se llama juantech', () => {
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@127.0.0.1:15432/otra', false, false),
    'base distinta',
  )
})

check('assertSafeTarget rechaza hosts desconocidos', () => {
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@db.ejemplo.com:5432/juantech', false, false),
    'host desconocido',
  )
})

check('assertSafeTarget rechaza URI ausente o no parseable', () => {
  expectThrows(() => assertSafeTarget(undefined, false, false), 'sin URI')
  expectThrows(() => assertSafeTarget('esto no es una url', false, false), 'URI rota')
})

check('assertSafeTarget rechaza --apply sin --db-checked', () => {
  expectThrows(
    () => assertSafeTarget('postgresql://u:p@127.0.0.1:15432/juantech', true, false),
    'apply sin dbChecked',
  )
})

check('assertSafeTarget acepta 127.0.0.1:15432/juantech con ambos flags y en dry-run', () => {
  const t = assertSafeTarget('postgresql://u:p@127.0.0.1:15432/juantech?sslmode=disable', true, true)
  assert(t.host === '127.0.0.1' && t.port === '15432' && t.database === 'juantech', 'partes mal leídas')
  assertSafeTarget('postgresql://u:p@shared-postgres:5432/juantech', false, false)
  assertSafeTarget('postgresql://u:p@localhost:5432/juantech', false, false)
})

check('safeTarget nunca imprime usuario ni contraseña', () => {
  const s = safeTarget('postgresql://usuario_secreto:clave_secreta@127.0.0.1:15432/juantech')
  assert(s === '127.0.0.1:15432/juantech', `salida inesperada: ${s}`)
  assert(!s.includes('secret'), 'filtró credenciales')
})

// ---------------------------------------------------------------------------
// Diff y fusión
// ---------------------------------------------------------------------------
check('buildDiff: igual no produce diferencias, un campo distinto sí', () => {
  const a = { hero: { title: 'x', lead: 'y' }, items: [{ t: '1' }, { t: '2' }] }
  assert(buildDiff(a, { hero: { title: 'x', lead: 'y' }, items: [{ t: '1' }, { t: '2' }] }).length === 0, 'iguales dieron diff')
  const d = buildDiff(a, { hero: { title: 'x', lead: 'otro' }, items: [{ t: '1' }, { t: '2' }] })
  assert(d.length === 1 && d[0] === 'hero.lead', `diff inesperado: ${d.join(',')}`)
})

check('buildDiff ignora claves extra de lo leído (id) y detecta filas de más o de menos', () => {
  const current = { items: [{ id: 'a', t: '1' }] }
  assert(buildDiff(current, { items: [{ t: '1' }] }).length === 0, 'el id contó como diferencia')
  assert(buildDiff(current, { items: [{ t: '1' }, { t: '2' }] }).length > 0, 'no detectó fila nueva')
})

check('mergeGroup conserva ids y lanza si la base tiene filas sobrantes', () => {
  const merged = mergeGroup({ items: [{ id: 'a', t: 'viejo', extra: 1 }] }, { items: [{ t: 'nuevo' }] }) as {
    items: { id: string; t: string; extra: number }[]
  }
  assert(merged.items[0].id === 'a' && merged.items[0].t === 'nuevo' && merged.items[0].extra === 1, 'fusión incorrecta')
  expectThrows(() => mergeGroup({ items: [{ id: 'a' }, { id: 'b' }] }, { items: [{ t: 'x' }] }), 'filas sobrantes')
})

// ---------------------------------------------------------------------------
// Nombres y chequeos de copy
// ---------------------------------------------------------------------------
check('normalizeName: money-com y money.com coinciden; acentos y puntuación se ignoran', () => {
  assert(normalizeName('money-com') === normalizeName('Money.com'), 'money')
  assert(normalizeName('Crédito USS') === normalizeName('credito-uss'), 'credito-uss')
  assert(normalizeName('Dr. Manuel A. Vargas Hidalgo') === normalizeName('dr-manuel-a-vargas-hidalgo'), 'dr vargas')
  assert(normalizeName('Apturio') !== normalizeName('Aprendoclub'), 'distintos coinciden')
})

check('assertNoForbiddenChars rechaza guion largo, guion corto y marcador de ranura', () => {
  expectThrows(() => assertNoForbiddenChars({ a: `uno ${EM} dos` }), 'guion largo')
  expectThrows(() => assertNoForbiddenChars({ a: [`uno ${EN} dos`] }), 'guion corto')
  expectThrows(() => assertNoForbiddenChars({ a: `${OPEN}testimonio}}` }), 'marcador')
  assertNoForbiddenChars({ a: 'texto limpio, con coma y punto.' })
})

check('assertNoForbiddenChars exime el marcador solo en la ruta permitida, nunca los guiones', () => {
  const obj = { experience: { stages: [{ when: `${OPEN}pendiente}} fecha` }] } }
  assertNoForbiddenChars(obj, ['experience.stages[].when'])
  expectThrows(() => assertNoForbiddenChars(obj, ['otra.ruta']), 'ruta no permitida')
  expectThrows(
    () => assertNoForbiddenChars({ experience: { stages: [{ when: `${OPEN}x}} ${EM}` }] } }, ['experience.stages[].when']),
    'guion en ruta eximida',
  )
})

check('assertPendingMarkersOnlyIn deja pasar la ruta permitida y rechaza las demás', () => {
  const ok = { experience: { stages: [{ when: `${OPEN}pendiente}}` }] } }
  assertPendingMarkersOnlyIn(ok, ['experience.stages[].when'])
  expectThrows(
    () => assertPendingMarkersOnlyIn({ ...ok, faq: { items: [{ answer: `${OPEN}x}}` }] } }, ['experience.stages[].when']),
    'marcador fuera de ruta',
  )
  assertPendingMarkersOnlyIn({ limpio: 'sí' }, [])
})

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------
check('HOME_COPY_ES.tagline y hero no contienen caracteres prohibidos ni marcadores', () => {
  assertNoForbiddenChars({ tagline: HOME_COPY_ES.tagline, hero: HOME_COPY_ES.hero })
  assert(typeof HOME_COPY_ES.tagline === 'string' && HOME_COPY_ES.tagline.length > 20, 'tagline vacío')
  for (const k of ['eyebrow', 'titleLine1', 'titleLine2', 'lead', 'ctaLabel', 'ctaHref', 'statValue', 'statCaption']) {
    assert(typeof (HOME_COPY_ES.hero as Record<string, unknown>)[k] === 'string', `hero.${k} falta`)
  }
})

check('el copy de la home pasa assertNoForbiddenChars y assertPendingMarkersOnlyIn (sin marcadores)', () => {
  assertNoForbiddenChars(HOME_COPY_ES)
  assertPendingMarkersOnlyIn(HOME_COPY_ES, [])
})

check('el copy de Sobre mí pasa los chequeos y el único marcador es la fecha de aprendoclub', () => {
  assertNoForbiddenChars(ABOUT_COPY_ES, ABOUT_PENDING_PATHS)
  assertPendingMarkersOnlyIn(ABOUT_COPY_ES, ABOUT_PENDING_PATHS)
  const aprendo = ABOUT_COPY_ES.experience.stages.filter((s) => s.when.includes(OPEN))
  assert(aprendo.length === 1 && aprendo[0].org === 'aprendoclub', 'el marcador debe estar solo en la etapa de aprendoclub')
})

/** Recorre el copy y devuelve [ruta, valor] de cada clave cuyo nombre esté en `names`. */
function collect(obj: unknown, names: string[], path = '', out: [string, string][] = []) {
  if (Array.isArray(obj)) obj.forEach((v, i) => collect(v, names, `${path}[${i}]`, out))
  else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const p = path ? `${path}.${k}` : k
      if (names.includes(k) && typeof v === 'string') out.push([p, v])
      collect(v, names, p, out)
    }
  }
  return out
}

check('títulos de sección y de grupo sin punto ni coma (los de ítem, sin coma ni punto final)', () => {
  const copies = { home: HOME_COPY_ES, about: ABOUT_COPY_ES }
  for (const [label, copy] of Object.entries(copies)) {
    for (const [p, v] of collect(copy, ['title', 'stepsTitle', 'faqTitle'])) {
      const isItem = p.includes('[')
      assert(!v.includes(','), `${label}.${p}: lleva coma ("${v}")`)
      assert(!v.trimEnd().endsWith('.'), `${label}.${p}: termina en punto ("${v}")`)
      // Los encabezados de sección y de grupo no admiten ningún punto. En los
      // ítems se tolera el punto interior de un nombre propio (Next.js).
      if (!isItem) assert(!v.includes('.'), `${label}.${p}: lleva punto ("${v}")`)
    }
    for (const [p, v] of collect(copy, ['titleLine1', 'titleLine2'])) {
      assert(!/[.,]/.test(v), `${label}.${p}: lleva punto o coma ("${v}")`)
    }
  }
})

check('conteos de ítems del copy', () => {
  const H = HOME_COPY_ES
  assert(H.services.items.length === 5, `services.items = ${H.services.items.length}`)
  assert(H.process.steps.length === 4, `process.steps = ${H.process.steps.length}`)
  assert(H.vitals.items.length === 4, `vitals.items = ${H.vitals.items.length}`)
  assert(H.faq.items.length === 5, `faq.items = ${H.faq.items.length}`)
  assert(H.contact.steps.length === 3, `contact.steps = ${H.contact.steps.length}`)
  assert(H.contact.infoRows.length === 3, `contact.infoRows = ${H.contact.infoRows.length}`)
  assert(H.about.chips.length === 5 && H.about.paragraphs.length === 2 && H.about.photos.length === 3, 'about de la home')
  assert(ABOUT_COPY_ES.experience.stages.length === 5, `experience.stages = ${ABOUT_COPY_ES.experience.stages.length}`)
  assert(ABOUT_COPY_ES.specialties.items.length === 4, 'specialties.items')
})

check('no se siembra sites.note ni ranuras de testimonio', () => {
  assert(!('note' in (HOME_COPY_ES.sites ?? {})), 'sites.note no debe sembrarse')
  assert(Object.keys(HOME_COPY_ES.testimonials).join() === 'title', 'testimonials solo lleva title')
})

check('los valores de select existen en las listas cerradas del sistema de diseño', () => {
  for (const it of HOME_COPY_ES.services.items) {
    assert((SERVICE_ICON_NAMES as readonly string[]).includes(it.icon), `icono de servicio inválido: ${it.icon}`)
    if ('servicePage' in it) assert((SERVICE_SLUGS as readonly string[]).includes(it.servicePage as string), `servicePage inválido: ${it.servicePage}`)
  }
  for (const st of HOME_COPY_ES.process.steps) assert((SERVICE_ICON_NAMES as readonly string[]).includes(st.icon), `icono de paso inválido: ${st.icon}`)
  for (const r of HOME_COPY_ES.contact.infoRows) assert((CONTACT_ICON_NAMES as readonly string[]).includes(r.icon), `icono de contacto inválido: ${r.icon}`)
  for (const c of ABOUT_COPY_ES.hero.chips) if ('icon' in c) assert((ABOUT_CHIP_ICON_NAMES as readonly string[]).includes(c.icon as string), `icono de chip inválido: ${c.icon}`)
})

check('los nombres de campo del copy existen en src/globals (grupos y subcampos)', () => {
  const sources = {
    home: readFileSync(join(ROOT, 'src/globals/HomePage/index.ts'), 'utf8'),
    about: readFileSync(join(ROOT, 'src/globals/AboutPage/index.ts'), 'utf8'),
  }
  const missing: string[] = []
  function walk(obj: unknown, src: string, label: string, path = '') {
    if (Array.isArray(obj)) return obj.forEach((v) => walk(v, src, label, path))
    if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        if (!new RegExp(`['"]${k}['"]`).test(src)) missing.push(`${label}.${path ? path + '.' : ''}${k}`)
        walk(v, src, label, path ? `${path}.${k}` : k)
      }
    }
  }
  walk(HOME_COPY_ES, sources.home, 'home')
  walk(ABOUT_COPY_ES, sources.about, 'about')
  assert(missing.length === 0, `campos sin declarar en el global: ${missing.join(', ')}`)
})

check('ON_DARK_FILES no está vacío y sale de SANDBOX_LOGOS', () => {
  assert(Array.isArray(ON_DARK_FILES) && ON_DARK_FILES.length > 0, 'ON_DARK_FILES vacío')
  assert(ON_DARK_FILES.every((f) => SANDBOX_LOGOS.some((l) => l.file === f && l.onDark)), 'archivo onDark fuera de la lista')
  assert(new Set(SANDBOX_LOGOS.map((l) => l.file)).size === SANDBOX_LOGOS.length, 'archivos repetidos en SANDBOX_LOGOS')
})

check('el mapeo por nombre normalizado enlaza los logos del sandbox con nombres de cliente plausibles', () => {
  const clientes = ['Money.com', 'Winaypaq', 'Crédito USS', 'Dr. Manuel A. Vargas Hidalgo', 'Apturio']
  const hit = (file: string) => clientes.filter((c) => normalizeName(c) === normalizeName(file.replace(/\.webp$/, '')))
  assert(hit('money-com.webp').join() === 'Money.com', 'money-com')
  assert(hit('winaypaq.webp').join() === 'Winaypaq', 'winaypaq')
  assert(hit('credito-uss.webp').join() === 'Crédito USS', 'credito-uss')
  assert(hit('dr-manuel-a-vargas-hidalgo.webp').length === 1, 'dr vargas')
})

// ---------------------------------------------------------------------------
// Manifiesto de medios y guardia de diff del doc stack
// ---------------------------------------------------------------------------
check('el manifiesto tiene 4 fotos y 9 logos con alt', () => {
  assert(MEDIA_MANIFEST.photos.length === 4, `fotos = ${MEDIA_MANIFEST.photos.length}`)
  assert(MEDIA_MANIFEST.logos.length === 9, `logos = ${MEDIA_MANIFEST.logos.length}`)
  for (const e of [...MEDIA_MANIFEST.photos, ...MEDIA_MANIFEST.logos]) assert(e.alt.trim().length > 0, `alt vacío en ${e.file}`)
  const heroes = MEDIA_MANIFEST.photos.filter((p) => p.target.global === 'about-page')
  assert(heroes.length === 1 && heroes[0].width === 1122 && heroes[0].height === 1402, 'foto de Sobre mí 1122x1402')
  const idx = MEDIA_MANIFEST.photos.filter((p) => p.target.global === 'home-page').map((p) => (p.target as { index: number }).index)
  assert(idx.join() === '0,1,2', `índices de la home: ${idx.join()}`)
})

check('cada ruta de origen del manifiesto existe en disco (el sandbox debe estar en esta máquina)', () => {
  const missing = [...MEDIA_MANIFEST.photos, ...MEDIA_MANIFEST.logos].map((e) => e.file).filter((f) => !existsSync(join(ROOT, f)))
  assert(missing.length === 0, `faltan: ${missing.join(', ')}`)
})

check('los nombres de herramienta del manifiesto coinciden con los del seed del stack', () => {
  const src = readFileSync(join(ROOT, 'scripts/seed-phase48-stack-content.ts'), 'utf8')
  const missing = MEDIA_MANIFEST.logos.map((l) => l.toolName).filter((n) => !src.includes(`name: '${n}'`))
  assert(missing.length === 0, `sin herramienta con ese nombre: ${missing.join(', ')}`)
  const norms = MEDIA_MANIFEST.logos.map((l) => normalizeName(l.toolName))
  assert(new Set(norms).size === norms.length, 'dos logos con el mismo nombre normalizado')
})

check('el alt de la foto de Sobre mí coincide con el borrador de A11Y-DECISIONS (si el sandbox lo trae)', () => {
  const f = join(ROOT, 'designs/design-system-mui/A11Y-DECISIONS.md')
  if (!existsSync(f)) return
  const hero = MEDIA_MANIFEST.photos.find((p) => p.key === 'about-hero')
  assert(hero && readFileSync(f, 'utf8').includes(hero.alt), 'el alt del manifiesto no aparece en A11Y-DECISIONS')
})

const heavyConversion = (async () => {
  const heavy = MEDIA_MANIFEST.photos.filter((p) => p.heavy)
  assert(heavy.length === 1 && heavy[0].file.endsWith('escritorio.png'), 'solo escritorio.png debe estar marcado como pesado')
  const tmp = mkdtempSync(join(tmpdir(), 'p54-selftest-'))
  try {
    const out = await prepareImage(join(ROOT, heavy[0].file), true, tmp, 'p54-test')
    assert(out.converted && out.path.endsWith('.webp'), 'no se convirtió a WebP')
    assert(out.path.startsWith(tmpdir() + sep) || out.path.startsWith(tmp), 'escribió fuera del directorio temporal')
    assert(!out.path.startsWith(ROOT + sep), 'escribió dentro del repo')
    assert(out.bytes < 600 * 1024, `pesa ${out.bytes} bytes tras convertir`)
    const { default: sharp } = await import('sharp')
    const meta = await sharp(out.path).metadata()
    assert((meta.width ?? 9999) <= 1600, `ancho ${meta.width}`)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})()

check('missingCloudinaryVars detecta la ausencia sin imprimir valores', () => {
  assert(missingCloudinaryVars({}).length === 3, 'debía faltar las tres')
  assert(missingCloudinaryVars({ CLOUDINARY_CLOUD_NAME: 'a', CLOUDINARY_API_KEY: 'b' }).join() === 'CLOUDINARY_API_SECRET', 'solo el secreto')
  assert(missingCloudinaryVars({ CLOUDINARY_CLOUD_NAME: 'a', CLOUDINARY_API_KEY: 'b', CLOUDINARY_API_SECRET: 'c' }).length === 0, 'completas')
})

check('layoutDiffIgnoring ignora logo y detecta texto, id y orden', () => {
  const base = [
    {
      id: 'b1',
      blockType: 'toolStack',
      categoryGroups: [{ id: 'g1', heading: 'SEO', tools: [{ id: 't1', name: 'Ahrefs', pro: 'rápido' }, { id: 't2', name: 'DinoRANK', pro: 'barato' }] }],
    },
  ]
  const withLogo = JSON.parse(JSON.stringify(base))
  withLogo[0].categoryGroups[0].tools[0].logo = 42
  assert(layoutDiffIgnoring(base, withLogo, ['logo']).length === 0, 'agregar logo contó como diferencia')
  const text = JSON.parse(JSON.stringify(withLogo))
  text[0].categoryGroups[0].tools[1].pro = 'otro texto'
  assert(layoutDiffIgnoring(base, text, ['logo']).length > 0, 'no detectó la diferencia de texto')
  const id = JSON.parse(JSON.stringify(withLogo))
  id[0].categoryGroups[0].tools[0].id = 'nuevo'
  assert(layoutDiffIgnoring(base, id, ['logo']).length > 0, 'no detectó el cambio de id')
  const order = JSON.parse(JSON.stringify(withLogo))
  order[0].categoryGroups[0].tools.reverse()
  assert(layoutDiffIgnoring(base, order, ['logo']).length > 0, 'no detectó el cambio de orden')
  const extra = JSON.parse(JSON.stringify(withLogo))
  extra[0].categoryGroups[0].tools[0].campoNuevo = 'x'
  assert(layoutDiffIgnoring(base, extra, ['logo']).length > 0, 'no detectó una clave extra')
  const fewer = JSON.parse(JSON.stringify(withLogo))
  fewer[0].categoryGroups[0].tools.pop()
  assert(layoutDiffIgnoring(base, fewer, ['logo']).length > 0, 'no detectó una herramienta de menos')
})

check('revisión estática de los scripts 20, 21 y 22: guardias presentes y sin operaciones de borrado', () => {
  const names = ['20-phase54-seed-shadow-content.ts', '21-phase54-upload-media.ts', '22-phase54-stack-logos.ts']
  for (const n of names) {
    const src = readFileSync(join(ROOT, 'scripts/db', n), 'utf8')
    assert(src.includes('db-checked'), `${n}: falta --db-checked`)
    assert(src.includes('assertSafeTarget'), `${n}: falta assertSafeTarget`)
    assert(src.includes('fallbackLocale'), `${n}: falta fallbackLocale`)
    assert(!/payload\.(delete|deleteGlobal)\b|\bdeleteByID\b/.test(src), `${n}: contiene una operación de borrado`)
    assert(!/git\s+clean|DROP\s|TRUNCATE/i.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), `${n}: contiene DROP o TRUNCATE`)
    assert(!src.includes("from '../../src/payload.config'") , `${n}: importa payload.config de forma estática (debe ser dinámico tras la guardia)`)
  }
  const s21 = readFileSync(join(ROOT, 'scripts/db', names[1]), 'utf8')
  assert(s21.includes('missingCloudinaryVars'), 'script 21: falta la guardia de Cloudinary')
  assert(readFileSync(join(ROOT, 'scripts/db', names[2]), 'utf8').includes('missingCloudinaryVars'), 'script 22: falta la guardia de Cloudinary')
  assert(s21.includes('alts-confirmed'), 'script 21: falta --alts-confirmed')
  const s22 = readFileSync(join(ROOT, 'scripts/db', names[2]), 'utf8')
  assert(s22.includes('_status') && s22.includes('draft: false'), 'script 22: faltan _status o draft false')
  assert(s22.indexOf("['en', 'es']") !== -1, 'script 22: el orden de escritura debe ser EN y luego ES')
  const s20 = readFileSync(join(ROOT, 'scripts/db', names[0]), 'utf8')
  assert(s20.includes('draft: false'), 'script 20: falta draft false en el update de clientes')
})

await heavyConversion.then(
  () => console.log('PASS escritorio.png se convierte a WebP de 1600 px o menos en un directorio temporal del sistema'),
  (err: Error) => {
    failures++
    console.log(`FAIL escritorio.png se convierte a WebP: ${err.message}`)
  },
)

if (failures > 0) {
  console.log(`\n${failures} caso(s) en FAIL`)
  process.exit(1)
}
console.log('\nTodos los casos en PASS')
