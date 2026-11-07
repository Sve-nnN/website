// Paridad es/en del namespace `shell` (fase 53, plan 04).
//
// Exige: mismo conjunto de rutas de clave en ambos idiomas, las 21 claves
// requeridas con texto no vacio, las mismas variables ICU `{...}` clave por
// clave, ningun guion largo ni corto en los valores y un tagline sin punto final.
//
// Solo mira `shell`: otros namespaces del repo tienen guiones largos heredados.
// Imprime OK o FAIL motivo, y sale con 1 si algo falla.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const REQUIRED = [
  'skipLink',
  'brandAria',
  'openMenu',
  'closeMenu',
  'langButtonAria',
  'langGroup',
  'motionToggle',
  'ctaFallback',
  'tagline',
  'opensInNewTab',
  'servicesTitle',
  'servicesIndex',
  'groupLabel',
  'legalLabel',
  'socialLabel',
  'landmarks.header',
  'landmarks.navMain',
  'landmarks.menu',
  'landmarks.navFooter',
  'landmarks.footer',
  'landmarks.main',
]

// Caracteres prohibidos escritos por codigo para que este archivo tampoco los contenga.
const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)

const failures = []
const fail = (reason) => failures.push(reason)

function load(locale) {
  const raw = fs.readFileSync(path.join(root, 'messages', `${locale}.json`), 'utf8')
  const json = JSON.parse(raw)
  if (!json.shell || typeof json.shell !== 'object') {
    fail(`${locale}: falta el namespace shell`)
    return {}
  }
  return json.shell
}

function flatten(obj, prefix = '') {
  const out = {}
  for (const [key, value] of Object.entries(obj)) {
    const route = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') Object.assign(out, flatten(value, route))
    else out[route] = value
  }
  return out
}

const es = flatten(load('es'))
const en = flatten(load('en'))

const esKeys = Object.keys(es).sort()
const enKeys = Object.keys(en).sort()
for (const key of esKeys) if (!(key in en)) fail(`clave solo en es: ${key}`)
for (const key of enKeys) if (!(key in es)) fail(`clave solo en en: ${key}`)

for (const [locale, flat] of [
  ['es', es],
  ['en', en],
]) {
  for (const key of REQUIRED) {
    const value = flat[key]
    if (typeof value !== 'string' || value.trim() === '') fail(`${locale}: falta o esta vacia la clave ${key}`)
  }
  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== 'string') {
      fail(`${locale}: ${key} no es texto`)
      continue
    }
    if (value.includes(EM_DASH) || value.includes(EN_DASH)) fail(`${locale}: ${key} contiene guion largo o corto`)
  }
  if (typeof flat.tagline === 'string' && flat.tagline.trim().endsWith('.')) fail(`${locale}: tagline termina en punto`)
}

const vars = (text) => (String(text).match(/\{[^}]+\}/g) ?? []).sort().join(',')
for (const key of esKeys) {
  if (key in en && vars(es[key]) !== vars(en[key])) {
    fail(`variables ICU distintas en ${key}: es [${vars(es[key])}] en [${vars(en[key])}]`)
  }
}

if (failures.length > 0) {
  for (const reason of failures) console.log(`FAIL ${reason}`)
  process.exit(1)
}
console.log('OK')
