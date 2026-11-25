/**
 * Paridad visual antes y despues (fase 60). Solo lectura: abre las mismas rutas
 * en dos servidores y compara, elemento por elemento:
 *
 *   - estructura: etiqueta, texto propio y atributos (sin `class` ni `style`)
 *   - estilos computados de todas las propiedades, tambien de ::before y ::after.
 *     Se omiten `-webkit-box-align`, `-webkit-box-pack` y `-webkit-box-flex`
 *     cuando ninguna de las dos versiones usa `display: -webkit-box`: Emotion las
 *     agrega como prefijo antiguo y no afectan a flex ni a grid.
 *   - caja en pantalla
 *   - estados :hover y :focus-visible forzados por CDP en enlaces, botones y
 *     tarjetas, con las transiciones apagadas
 *   - con `--shots`, capturas de pagina completa comparadas pixel a pixel
 *
 * Uso:
 *   node scripts/verify/60-style-parity.mjs --antes http://localhost:3641 \
 *     --despues http://localhost:3642 [--routes /a,/b] [--widths 360,1200] \
 *     [--states] [--reduced] [--motion paused|running] [--shots /carpeta] [--out /ruta.json]
 *
 * Sale con 1 si hay alguna diferencia.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { chromium } from 'playwright'
import sharp from 'sharp'

const args = process.argv.slice(2)
const value = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const flag = (name) => args.includes(name)

const before = value('--antes').replace(/\/$/, '')
const after = value('--despues').replace(/\/$/, '')
const routes = value('--routes', '/sobre-mi,/blog').split(',').filter(Boolean)
const widths = value('--widths', '360,600,900,1200,1440').split(',').map(Number)
const shots = value('--shots', null)
const out = value('--out', null)
if (shots) mkdirSync(shots, { recursive: true })

/** Elementos del body en orden de documento, con lo que se compara de cada uno. */
function snapshot() {
  const skip = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'LINK', 'META', 'NEXT-ROUTE-ANNOUNCER'])
  const list = []
  // Los ids de useId cambian con la forma del arbol: se comparan normalizados.
  const normalize = (v) => v.replace(/\$ACTION_ID_[0-9a-f]+/g, '$ACTION_ID_X').replace(/(:|«|_)[Rr][0-9a-z]*(:|»|_)/g, 'ID').replace(/mui-[0-9a-z-]+/g, 'mui-ID')
  const styleOf = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo)
    if (pseudo && (cs.content === 'none' || cs.content === 'normal')) return null
    const result = {}
    for (let i = 0; i < cs.length; i += 1) {
      const name = cs[i]
      // Las propiedades personalizadas no pintan nada por si solas.
      if (name.startsWith('--')) continue
      // El nombre de la animacion lo genera Emotion o la hoja estatica.
      if (name === 'animation-name') continue
      result[name] = cs.getPropertyValue(name)
    }
    return result
  }
  const walk = (el, path) => {
    if (skip.has(el.tagName)) return
    const attrs = {}
    for (const a of el.attributes) {
      if (a.name === 'class' || a.name === 'style') continue
      attrs[normalize(a.name)] = normalize(a.value)
    }
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim()
    const r = el.getBoundingClientRect()
    list.push({
      // Tarjetas: cambian al pasar el puntero aunque no sean enlaces.
      card: el.classList.contains('MuiCard-root') || el.classList.contains('jt-card'),
      path,
      tag: el.tagName.toLowerCase(),
      attrs,
      text,
      rect: [r.x, r.y + window.scrollY, r.width, r.height].map((n) => Math.round(n * 10) / 10),
      style: styleOf(el),
      before: styleOf(el, '::before'),
      after: styleOf(el, '::after'),
    })
    el.setAttribute('data-parity', String(list.length - 1))
    // Dentro de un svg no hay estilos que escribamos nosotros.
    if (el.tagName.toLowerCase() === 'svg') return
    let i = 0
    for (const child of el.children) walk(child, `${path}>${child.tagName.toLowerCase()}:${i++}`)
  }
  walk(document.body, 'body')
  // El atributo auxiliar no debe contar como diferencia.
  for (const item of list) delete item.attrs['data-parity']
  return list
}

async function open(browser, base, route, width, { motion, reduced }) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  await context.addInitScript((m) => {
    try {
      window.localStorage.setItem('jt-motion', m)
    } catch {}
  }, motion)
  const page = await context.newPage()
  await page.goto(base + route, { waitUntil: 'load', timeout: 90_000 })
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  // Las imagenes diferidas tienen que estar cargadas en las dos versiones.
  await page.evaluate(async () => {
    for (const img of document.images) img.loading = 'eager'
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => {
      img.addEventListener('load', r, { once: true })
      img.addEventListener('error', r, { once: true })
      setTimeout(r, 8000)
    }))))
    await document.fonts.ready
    // Restaura el atributo para que la comparacion no vea el cambio.
    for (const img of document.images) if (!img.hasAttribute('fetchpriority')) img.loading = 'lazy'
  })
  await page.waitForTimeout(600)
  return { context, page }
}

const LEGACY_BOX = new Set(['-webkit-box-align', '-webkit-box-pack', '-webkit-box-flex'])
const legacyBoxOnly = (key, a, b) => LEGACY_BOX.has(key) && a.display !== '-webkit-box' && b.display !== '-webkit-box'

const diffStyles = (a, b) => {
  if (!a && !b) return []
  if (!a || !b) return [['(pseudo)', a ? 'presente' : 'ausente', b ? 'presente' : 'ausente']]
  return Object.keys({ ...a, ...b })
    .filter((k) => a[k] !== b[k] && !legacyBoxOnly(k, a, b))
    .map((k) => [k, a[k], b[k]])
}

function compare(a, b) {
  const diffs = []
  if (a.length !== b.length) diffs.push({ kind: 'conteo', antes: a.length, despues: b.length })
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i += 1) {
    const x = a[i]
    const y = b[i]
    if (x.path !== y.path) {
      diffs.push({ kind: 'estructura', index: i, antes: x.path, despues: y.path })
      break
    }
    const where = `${x.path.split('>').slice(-4).join('>')} "${x.text.slice(0, 30)}"`
    if (x.text !== y.text) diffs.push({ kind: 'texto', where, antes: x.text, despues: y.text })
    const attrs = diffStyles(x.attrs, y.attrs)
    if (attrs.length) diffs.push({ kind: 'atributos', where, props: attrs })
    if (x.rect.some((v, k) => Math.abs(v - y.rect[k]) > 0.5)) diffs.push({ kind: 'caja', where, antes: x.rect, despues: y.rect })
    for (const part of ['style', 'before', 'after']) {
      const props = diffStyles(x[part], y[part])
      if (props.length) diffs.push({ kind: part, where, props })
    }
  }
  return diffs
}

/** Estilos del elemento forzado, de tres ancestros (por `:has`) y de su subarbol. */
async function forced(page, client, index, pseudo) {
  const { root } = await client.send('DOM.getDocument', { depth: 0 })
  const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-parity="${index}"]` })
  if (!nodeId) return null
  const states = pseudo === 'focus' ? ['focus', 'focus-visible'] : [pseudo]
  await client.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: states })
  const result = await page.evaluate((index) => {
    const el = document.querySelector(`[data-parity="${index}"]`)
    const targets = [el.parentElement?.parentElement?.parentElement, el.parentElement?.parentElement, el.parentElement, el, ...el.querySelectorAll('*')].filter(Boolean)
    return targets.slice(0, 40).map((t) => {
      const read = (pseudoElement) => {
        const cs = getComputedStyle(t, pseudoElement)
        const o = {}
        for (let i = 0; i < cs.length; i += 1) {
          if (!cs[i].startsWith('--') && cs[i] !== 'animation-name') o[cs[i]] = cs.getPropertyValue(cs[i])
        }
        return o
      }
      return { tag: t.tagName.toLowerCase(), style: read(), after: read('::after') }
    })
  }, index)
  await client.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] })
  return result
}

async function compareStates(a, b, list) {
  const clients = []
  for (const side of [a, b]) {
    await side.page.addStyleTag({ content: '*,*::before,*::after{transition:none !important}' })
    const client = await side.context.newCDPSession(side.page)
    await client.send('DOM.enable')
    await client.send('CSS.enable')
    clients.push(client)
  }
  // Un representante por combinacion de etiqueta y estilo base: las tarjetas
  // repetidas comparten reglas.
  const seen = new Map()
  const targets = []
  list.forEach((item, index) => {
    if (!['a', 'button'].includes(item.tag) && !item.card) return
    const key = `${item.tag}|${item.style.color}|${item.style.display}|${item.style['font-size']}|${item.style['background-color']}|${item.path.replace(/:\d+/g, '')}|${item.attrs['aria-current'] ?? ''}`
    const count = seen.get(key) ?? 0
    seen.set(key, count + 1)
    if (count === 0) targets.push(index)
  })
  const diffs = []
  for (const index of targets) {
    // Una tarjeta no es enfocable: forzarle el foco mediria un estado que no existe.
    for (const pseudo of list[index].card && !['a', 'button'].includes(list[index].tag) ? ['hover'] : ['hover', 'focus', 'active']) {
      const x = await forced(a.page, clients[0], index, pseudo)
      const y = await forced(b.page, clients[1], index, pseudo)
      if (!x || !y) continue
      for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
        for (const part of ['style', 'after']) {
          const props = diffStyles(x[i]?.[part], y[i]?.[part])
          if (props.length) {
            diffs.push({
              kind: `estado ${pseudo} ${part}`,
              where: `${list[index].path.split('>').slice(-4).join('>')} "${list[index].text.slice(0, 30)}" nodo ${i} <${x[i]?.tag}>`,
              props,
            })
          }
        }
      }
    }
  }
  return { diffs, checked: targets.length }
}

async function pixelDiff(a, b, name) {
  const buffers = []
  for (const [side, label] of [[a, 'antes'], [b, 'despues']]) {
    const png = await side.page.screenshot({ fullPage: true, animations: 'disabled' })
    writeFileSync(join(shots, `${name}-${label}.png`), png)
    buffers.push(await sharp(png).raw().toBuffer({ resolveWithObject: true }))
  }
  const [x, y] = buffers
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) {
    return { size: [`${x.info.width}x${x.info.height}`, `${y.info.width}x${y.info.height}`], pixels: -1 }
  }
  let pixels = 0
  const c = x.info.channels
  for (let i = 0; i < x.data.length; i += c) {
    if (Math.abs(x.data[i] - y.data[i]) > 8 || Math.abs(x.data[i + 1] - y.data[i + 1]) > 8 || Math.abs(x.data[i + 2] - y.data[i + 2]) > 8) pixels += 1
  }
  return { size: [`${x.info.width}x${x.info.height}`], pixels, ratio: pixels / (x.info.width * x.info.height) }
}

const browser = await chromium.launch()
const report = []
let failed = 0
try {
  for (const route of routes) {
    for (const width of widths) {
      const motion = value('--motion', flag('--states') ? 'running' : 'paused')
      const options = { motion, reduced: flag('--reduced') }
      const a = await open(browser, before, route, width, options)
      const b = await open(browser, after, route, width, options)
      const entry = { route, width }
      const x = await a.page.evaluate(snapshot)
      const y = await b.page.evaluate(snapshot)
      entry.elements = x.length
      // En marcha los blobs se animan: la comparacion base se hace en pausa.
      entry.diffs = flag('--states') ? [] : compare(x, y)
      if (flag('--states')) {
        const states = await compareStates(a, b, x)
        entry.states = states.checked
        entry.diffs.push(...states.diffs)
      }
      if (shots) {
        entry.shot = await pixelDiff(a, b, `${route.replace(/\W+/g, '_') || 'home'}-${width}`)
      }
      await a.context.close()
      await b.context.close()
      const bad = entry.diffs.length > 0 || (entry.shot && entry.shot.pixels !== 0)
      if (bad) failed += 1
      console.log(
        `${bad ? 'DIFF' : 'IGUAL'} ${route} @${width} elementos=${entry.elements}` +
          `${entry.states !== undefined ? ` estados=${entry.states}` : ''} diferencias=${entry.diffs.length}` +
          `${entry.shot ? ` pixeles=${entry.shot.pixels} ${entry.shot.size.join(' vs ')}` : ''}`,
      )
      report.push(entry)
      if (out) writeFileSync(out, JSON.stringify(report, null, 1))
    }
  }
} finally {
  await browser.close()
}

// Resumen agrupado: una linea por propiedad distinta, con un ejemplo.
const groups = new Map()
for (const entry of report) {
  for (const d of entry.diffs) {
    const keys = d.props ? d.props.map((p) => `${d.kind} ${p[0]}: ${p[1]} -> ${p[2]}`) : [`${d.kind}: ${JSON.stringify(d.antes)} -> ${JSON.stringify(d.despues)}`]
    for (const key of keys) {
      const g = groups.get(key) ?? { n: 0, example: `${entry.route} @${entry.width} ${d.where ?? ''}` }
      g.n += 1
      groups.set(key, g)
    }
  }
}
const sorted = [...groups].sort((a, b) => b[1].n - a[1].n)
const limit = Number(value('--max', '80'))
for (const [key, g] of sorted.slice(0, limit)) console.log(`${g.n}x ${key.slice(0, 230)}\n     ${g.example}`)
console.log(`\n${report.length - failed} de ${report.length} combinaciones identicas; ${sorted.length} diferencias distintas`)
process.exit(failed === 0 ? 0 : 1)
