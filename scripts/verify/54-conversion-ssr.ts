/**
 * Autoprueba de las primitivas de conversion de la fase 54 (plan 54-06).
 *
 * Renderiza cada componente con el arnes de servidor del plan 54-03 (tema real,
 * next-intl y mensajes reales) y comprueba estructura. Sin base de datos y sin
 * JSX (tsconfig fija `jsx: preserve`).
 *
 * Nota sobre Emotion: en el mismo proceso, un estilo ya emitido no se repite en
 * renders posteriores. Por eso cada aserto sobre CSS se hace en el PRIMER render
 * de ese estilo, y los casos posteriores se prueban por estructura o por la
 * igualdad de clases.
 *
 * Uso:
 *   node_modules/.bin/tsx scripts/verify/54-conversion-ssr.ts
 * Imprime PASS o FAIL con el motivo por caso y sale con 1 ante cualquier FAIL.
 */
import * as React from 'react'
import { createElement } from 'react'

import { CaseMetricCard } from '../../src/components/mui/CaseMetricCard'
import { ContactForm } from '../../src/components/mui/ContactForm'
import { CtaPanel } from '../../src/components/mui/CtaPanel'
import { CtaSection } from '../../src/components/mui/CtaSection'
import { LogoMarquee, LogoStaticGrid, fitLogo, type MarqueeLogo } from '../../src/components/mui/LogoMarquee'
import { TestimonialCards } from '../../src/components/mui/TestimonialCards'
import { Toc } from '../../src/components/mui/rich-text/Toc'
import { formatSector, splitHeroMetric } from '../../src/components/mui/split-hero-metric'
import { extractContactEmail } from '../../src/lib/contact-data'
import { countOf, hasId, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx no transforma JSX con `jsx: preserve` y cae al runtime clasico, que busca
// `React` global al renderizar los componentes .tsx. Solo se usa en esta autoprueba.
;(globalThis as { React?: typeof React }).React = React

let failed = 0
function check(name: string, ok: boolean, reason: string) {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failed += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

/** HTML sin las etiquetas style que Emotion inyecta con el CSS global del tema y el de cada componente. */
function markup(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/g, '')
}

/** Clase de la primera etiqueta `ul` del HTML. */
function firstUlClass(html: string): string {
  return /<ul[^>]*class="([^"]+)"/.exec(html)?.[1] ?? ''
}

const EM_DASH = String.fromCharCode(0x2014)
const EN_DASH = String.fromCharCode(0x2013)
const ARROW = String.fromCharCode(0x2192)

// ---------------------------------------------------------------------------
// Tarea 2: helpers puros
// ---------------------------------------------------------------------------
{
  const a = splitHeroMetric('+406% clics interanuales')
  check('splitHeroMetric "+406% clics interanuales"', a.metric === '+406 %' && a.label === 'clics interanuales', JSON.stringify(a))
  const b = splitHeroMetric('+68%')
  check('splitHeroMetric "+68%"', b.metric === '+68 %' && b.label === null, JSON.stringify(b))
  const raw = `0 ${ARROW} 56 clics`
  const c = splitHeroMetric(raw)
  check('splitHeroMetric sin porcentaje devuelve la cadena entera', c.metric === raw && c.label === null, JSON.stringify(c))

  const s1 = formatSector(`Salud ${EM_DASH} Urología`)
  check('formatSector con raya larga', s1 === 'Salud, urología', JSON.stringify(s1))
  const s2 = formatSector(`Salud${EN_DASH}Urología`)
  check('formatSector con raya corta sin espacios', s2 === 'Salud, urología', JSON.stringify(s2))
  check('formatSector sin raya no cambia', formatSector('Turismo') === 'Turismo', 'cambio un sector sin raya')
}

// ---------------------------------------------------------------------------
// Tarea 2: fitLogo
// ---------------------------------------------------------------------------
{
  const wide = fitLogo(1000, 100)
  check('fitLogo cabe en 220 por 56 y conserva proporcion', wide.width === 220 && wide.height === 22, JSON.stringify(wide))
  const tall = fitLogo(400, 200)
  check('fitLogo limita por la altura', tall.width === 112 && tall.height === 56, JSON.stringify(tall))
  const small = fitLogo(100, 40)
  check('fitLogo nunca amplia', small.width === 100 && small.height === 40, JSON.stringify(small))
  const none = fitLogo(null, undefined)
  check('fitLogo sin dimensiones usa 120 por 48', none.width === 120 && none.height === 48, JSON.stringify(none))
  const zero = fitLogo(0, 50)
  check('fitLogo con ancho 0 usa 120 por 48', zero.width === 120 && zero.height === 48, JSON.stringify(zero))
}

// ---------------------------------------------------------------------------
// Tarea 2: LogoMarquee
// ---------------------------------------------------------------------------
{
  const six: MarqueeLogo[] = [1, 2, 3, 4, 5, 6].map((i) => ({
    id: i,
    src: `https://res.cloudinary.com/demo/logo-${i}.png`,
    alt: `Cliente ${i}`,
    width: i === 1 ? 600 : 300,
    height: 100,
    onDark: i === 2 || i === 5,
  }))
  const html = renderToHtml(createElement(LogoMarquee, { title: 'Con quienes trabaje', groupLabel: 'Logos de clientes', logos: six }), 'es')
  check('LogoMarquee: una copia aria-hidden por logo', countOf(html, /<div[^>]*aria-hidden="true"/) === 6, `copias aria-hidden = ${countOf(html, /<div[^>]*aria-hidden="true"/)}`)
  check('LogoMarquee: las copias llevan alt vacio', countOf(html, /alt=""/) === 6, `alt vacio = ${countOf(html, /alt=""/)}`)
  check('LogoMarquee: dos pistas animadas en sentidos opuestos', countOf(html, /@keyframes animation-/) === 2, `keyframes = ${countOf(html, /@keyframes animation-/)}`)
  check('LogoMarquee: chip oscuro para los onDark', countOf(html, /background-color:#181818/) === 1, `reglas con chip oscuro = ${countOf(html, /background-color:#181818/)}`)
  check('LogoMarquee: h2 con el titulo y section con aria-labelledby', /<h2[^>]*id="clientes-t"[^>]*>Con quienes trabaje<\/h2>/.test(html) && hasId(html, 'clientes') && /aria-labelledby="clientes-t"/.test(html), 'falta el h2 o el aria-labelledby')
  check('LogoMarquee: grupo con nombre accesible', /role="group"[^>]*aria-label="Logos de clientes"/.test(html), 'falta role=group con aria-label')
  check('LogoMarquee: width y height declarados y loading lazy en todos', countOf(html, /<img[^>]*width="\d+"[^>]*height="\d+"[^>]*loading="lazy"/) === 12, 'faltan width, height o loading lazy')
  check('LogoMarquee: el logo de 600 por 100 se reduce a 220 por 37 y los de 300 por 100 a 168 por 56', /width:220px;height:37px/.test(html) && /width:168px;height:56px/.test(html), 'los tamanos en pantalla no siguen fitLogo')
  check('LogoMarquee: ninguna ruta del sandbox', !html.includes('/logos/'), 'aparece /logos/ en el HTML')

  const empty = renderToHtml(createElement(LogoMarquee, { title: 'Con quienes trabaje', groupLabel: 'Logos', logos: [] }), 'es')
  check('LogoMarquee sin logos devuelve cadena vacia (sin encabezado huerfano)', markup(empty) === '', `devolvio ${markup(empty).length} caracteres`)

  const one = renderToHtml(createElement(LogoMarquee, { title: 'T', groupLabel: 'G', logos: six.slice(0, 1) }), 'es')
  check('LogoMarquee con un solo logo no deja una segunda pista vacia', countOf(one, /<div[^>]*aria-hidden="true"/) === 1, `copias = ${countOf(one, /<div[^>]*aria-hidden="true"/)}`)

  const grid = renderToHtml(createElement(LogoStaticGrid, { logos: six }), 'es')
  check('Rejilla estatica (movimiento pausado): cada logo una vez y ninguno aria-hidden', countOf(grid, /<img/) === 6 && countOf(grid, /aria-hidden="true"/) === 0 && countOf(grid, /<li/) === 6, `img=${countOf(grid, /<img/)} hidden=${countOf(grid, /aria-hidden="true"/)} li=${countOf(grid, /<li/)}`)
  check('Rejilla estatica: flex-wrap y sin animacion', /flex-wrap:wrap/.test(grid) && !/@keyframes/.test(grid) && !/animation/.test(markup(grid)), 'falta flex-wrap o conserva animation')
}

// ---------------------------------------------------------------------------
// Tarea 2: TestimonialCards (el de tres columnas se prueba primero por Emotion)
// ---------------------------------------------------------------------------
{
  const mk = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: i + 1, quote: `Cita ${i + 1}`, name: `Persona ${i + 1}`, role: i === 0 ? 'CEO de Ejemplo' : null }))
  const three = renderToHtml(createElement(TestimonialCards, { items: mk(3) }), 'es')
  check('TestimonialCards con 3: tres tarjetas', countOf(three, /<figure/) === 3, `tarjetas = ${countOf(three, /<figure/)}`)
  check('TestimonialCards con 3: rejilla de tres columnas', /repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(three), 'no aparece repeat(3, minmax(0,1fr)) en el CSS')

  const zero = renderToHtml(createElement(TestimonialCards, { items: [] }), 'es')
  check('TestimonialCards con 0: nada y ninguna ranura de muestra', markup(zero) === '', `devolvio ${markup(zero).length} caracteres`)

  const one = renderToHtml(createElement(TestimonialCards, { items: mk(1) }), 'es')
  check('TestimonialCards con 1: una tarjeta sin repeticion de tres columnas', countOf(one, /<figure/) === 1 && !/repeat\(3,/.test(one), `tarjetas=${countOf(one, /<figure/)} repeat3=${/repeat\(3,/.test(one)}`)
  check('TestimonialCards con 1: columna de 760px como maximo', /max-width:760px/.test(one), 'falta max-width:760px')

  const two = renderToHtml(createElement(TestimonialCards, { items: mk(2) }), 'es')
  check('TestimonialCards con 2: dos tarjetas en dos columnas desde md', countOf(two, /<figure/) === 2 && /repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(two) && !/repeat\(3,/.test(two), 'no hay repeat(2) o aparece repeat(3)')

  const four = renderToHtml(createElement(TestimonialCards, { items: mk(4) }), 'es')
  check('TestimonialCards con 4: cuatro tarjetas y la misma rejilla que con 3', countOf(four, /<figure/) === 4 && firstUlClass(four) === firstUlClass(three) && firstUlClass(four) !== '', `clase4=${firstUlClass(four)} clase3=${firstUlClass(three)}`)

  check('TestimonialCards: blockquote en figure y avatar con la inicial aria-hidden', /<figure[^>]*><blockquote/.test(three) && /aria-hidden="true"[^>]*>P<\/div>/.test(three), 'falta blockquote o la inicial decorativa')
  check('TestimonialCards: el rol opcional solo aparece cuando existe', countOf(three, /CEO de Ejemplo/) === 1 && countOf(three, /<figcaption/) === 3, 'rol repetido o ausente')
}

// ---------------------------------------------------------------------------
// Tarea 2: CaseMetricCard
// ---------------------------------------------------------------------------
{
  const html = renderToHtml(
    createElement(CaseMetricCard, {
      href: '/case-studies/clinica-x',
      tag: 'Salud, urología',
      metric: '+406 %',
      title: 'Clinica de urologia',
      suffix: 'clics interanuales',
      tone: 'band',
      as: 'div',
    }),
    'es',
  )
  check('CaseMetricCard: h3 con un enlace cuyo href coincide', /<h3[^>]*><a[^>]*href="\/case-studies\/clinica-x"[^>]*>Clinica de urologia<\/a><\/h3>/.test(markup(html)), 'el h3 no contiene el enlace esperado')
  check('CaseMetricCard: cifra de 72px, enlace estirado y foco en la tarjeta', /font-size:4\.5rem/.test(html) && /:has\(a:focus-visible\)/.test(html) && /content:""/.test(html), 'falta cifra de 72px, :has(a:focus-visible) o ::after')
  check('CaseMetricCard: hover sin desplazamiento con movimiento pausado', /html\[data-motion="paused"\]/.test(html) && /translateY\(-4px\)/.test(html), 'falta la regla de movimiento pausado o el translateY')
  check('CaseMetricCard: sufijo y cifra visibles', html.includes('+406 %') && html.includes('clics interanuales'), 'faltan cifra o sufijo')
  const li = renderToHtml(createElement(CaseMetricCard, { href: '/case-studies/y', metric: '+68 %', title: 'Otro', tone: 'paper' }), 'en')
  check('CaseMetricCard como li en EN: href con prefijo de idioma y sin sufijo ni chip', /^<li/.test(markup(li)) && /href="\/en\/case-studies\/y"/.test(li) && !li.includes('MuiChip'), 'no es li, falta el prefijo /en o dibujo un chip vacio')
}

// ---------------------------------------------------------------------------
// Tarea 2: Toc
// ---------------------------------------------------------------------------
{
  const items = [
    { id: 'uno', text: 'Uno', level: 2 },
    { id: 'dos', text: 'Dos', level: 2 },
    { id: 'tres', text: 'Tres', level: 3 },
  ]
  const html = renderToHtml(createElement(Toc, { items, label: 'En este documento' }), 'es')
  for (const it of items) {
    check(`Toc: enlace #${it.id} en el nav y en el acordeon`, countOf(html, new RegExp(`href="#${it.id}"`)) === 2, `enlaces = ${countOf(html, new RegExp(`href="#${it.id}"`))}`)
  }
  check('Toc: nav con aria-label dado por el llamador', /<nav[^>]*aria-label="En este documento"/.test(html) && countOf(html, /<nav/) === 1, `navs = ${countOf(html, /<nav/)}`)
  check('Toc: acordeon colapsado con resumen h2', JSON.stringify(headingLevels(html)) === '[2]' && /<h2[^>]*><button[^>]*aria-expanded="false"/.test(markup(html)), `niveles = ${JSON.stringify(headingLevels(html))}`)
  const controls = /aria-controls="([^"]+)"/.exec(html)?.[1] ?? ''
  check('Toc: aria-controls del acordeon resuelve a un id', controls !== '' && hasId(html, controls), `aria-controls = ${controls}`)
  check('Toc: aria-current true en el enlace activo (el primero)', countOf(html, /aria-current="true"/) === 2, `aria-current = ${countOf(html, /aria-current="true"/)}`)
  check('Toc: el enlace de nivel 3 lleva 16px mas de sangria', /padding-left:calc\(3\.5 \* var\(--jt-spacing\)\)/.test(html), 'no hay sangria extra de 16px para el nivel 3')

  const single = renderToHtml(createElement(Toc, { items: items.slice(0, 1), label: 'En este documento' }), 'es')
  check('Toc con un solo item devuelve cadena vacia', markup(single) === '', `devolvio ${markup(single).length} caracteres`)
}

// ---------------------------------------------------------------------------
// Tarea 3: ContactForm
// ---------------------------------------------------------------------------
{
  const html = renderToHtml(createElement(ContactForm, { variant: 'card', email: 'correo@ejemplo.com', headingId: 'form-t' }), 'es')
  const text = textOf(html)
  check('ContactForm: etiquetas visibles Nombre, Correo electronico y Mensaje', text.includes('Nombre') && text.includes('Correo electr\u00f3nico') && text.includes('Mensaje'), 'falta alguna etiqueta')
  for (const name of ['name', 'email', 'message']) {
    check(`ContactForm: campo ${name} requerido`, new RegExp(`<(input|textarea)[^>]*name="${name}"[^>]*required`).test(html) || new RegExp(`<(input|textarea)[^>]*required[^>]*name="${name}"`).test(html), `el campo ${name} no es required`)
  }
  const labelFors = [...html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1])
  check('ContactForm: cada etiqueta apunta a un id existente', labelFors.length === 4 && labelFors.every((id) => hasId(html, id)), `labels = ${JSON.stringify(labelFors)}`)
  check('ContactForm: autocomplete name y email', /autoComplete="name"/i.test(html) && /autoComplete="email"/i.test(html), 'falta autoComplete')
  check('ContactForm: type email en el correo', /<input[^>]*name="email"[^>]*type="email"|<input[^>]*type="email"[^>]*name="email"/.test(html), 'el correo no es type email')
  check('ContactForm: campo oculto locale con valor es', /<input[^>]*type="hidden"[^>]*name="locale"[^>]*value="es"/.test(html), 'falta el campo oculto locale=es')
  const honeypotTag = /<input[^>]*name="company_website"[^>]*>/.exec(html)?.[0] ?? ''
  check(
    'ContactForm: honeypot company_website en contenedor aria-hidden, tabindex -1 y autocomplete off',
    /aria-hidden="true"[^>]*>(<style[\s\S]*?<\/style>)?<label[^>]*>Sitio web de la empresa<\/label><input[^>]*name="company_website"/.test(html) &&
      /tabindex="-1"/i.test(honeypotTag) &&
      /autoComplete="off"/i.test(honeypotTag),
    `el honeypot no cumple el contrato: ${honeypotTag}`,
  )
  check('ContactForm: sin campos de servicio ni de sitio web', !/name="(service|website)"/.test(html) && !/<select/.test(html), 'aparece un campo del sandbox')
  check('ContactForm: form noValidate con aria-labelledby al titulo', /<form[^>]*aria-labelledby="form-t"/.test(html) && hasId(html, 'form-t') && /<h2[^>]*id="form-t"/.test(html), 'el formulario no se nombra por su h2')
  check('ContactForm: boton de envio', /<button[^>]*type="submit"[^>]*>Enviar mensaje<\/button>/.test(html), 'falta el boton Enviar mensaje')
  check('ContactForm sin estado: ni status ni alert', !/role="status"/.test(html) && !/role="alert"/.test(html), 'muestra un estado sin que lo haya')

  const en = renderToHtml(createElement(ContactForm, { variant: 'card', email: 'correo@ejemplo.com' }), 'en')
  check('ContactForm en EN: locale en y etiquetas en ingles', /<input[^>]*name="locale"[^>]*value="en"/.test(en) && textOf(en).includes('Email address') && textOf(en).includes('Send message'), 'locale o etiquetas incorrectos')

  const ok = renderToHtml(createElement(ContactForm, { variant: 'card', status: 'success', email: 'correo@ejemplo.com' }), 'es')
  check('ContactForm success: role status con titulo, cuerpo y enlace a /contact', /role="status"/.test(ok) && textOf(ok).includes('Mensaje enviado') && textOf(ok).includes('Gracias por escribir') && /<a[^>]*href="\/contact"[^>]*>Enviar otro mensaje<\/a>/.test(ok) && /tabindex="-1"/.test(ok), 'falta role status, el texto, el enlace o tabindex -1')
  check('ContactForm success: reemplaza el formulario', !/<form/.test(ok), 'sigue mostrando el formulario')

  const bad = renderToHtml(createElement(ContactForm, { variant: 'card', status: 'error', email: 'correo@ejemplo.com' }), 'es')
  check('ContactForm error: role alert con el correo y el formulario sigue', /role="alert"/.test(bad) && textOf(bad).includes('escribe directamente a correo@ejemplo.com') && /<form/.test(bad) && /tabindex="-1"/.test(bad), 'falta role alert, el correo, el formulario o tabindex -1')

  const panel = renderToHtml(createElement(ContactForm, { variant: 'panel', email: 'correo@ejemplo.com' }), 'es')
  check('ContactForm panel: nombrado por aria-label y sin h2 propio', /<form[^>]*aria-label="Formulario de contacto"/.test(panel) && !/<h2/.test(panel) && /name="company_website"/.test(panel), 'el panel no se nombra o trae un h2')
}

// ---------------------------------------------------------------------------
// Tarea 3: CtaPanel y CtaSection
// ---------------------------------------------------------------------------
{
  const props = { title: 'Hablemos de tu sitio', lead: 'Lead del cierre', email: 'otro@ejemplo.org', avatarUrl: 'https://res.cloudinary.com/demo/avatar.jpg', name: 'Nombre del autor' }
  const html = renderToHtml(createElement(CtaPanel, props), 'es')
  check('CtaPanel: h2 con el titulo recibido y section nombrada por ese h2', /<h2[^>]*id="cta-title"[^>]*>Hablemos de tu sitio<\/h2>/.test(html) && /<section[^>]*aria-labelledby="cta-title"/.test(html), 'falta el h2 o el aria-labelledby')
  check('CtaPanel: correo visible y boton Copiar correo', textOf(html).includes('otro@ejemplo.org') && /<button[^>]*>Copiar correo<\/button>/.test(html), 'falta el correo o el boton')
  check('CtaPanel: region aria-live polite oculta que no repite nada al inicio', /aria-live="polite"/.test(html), 'falta la region aria-live')
  check('CtaPanel: avatar decorativo y nombre', /<img[^>]*alt=""[^>]*src="https:\/\/res\.cloudinary\.com\/demo\/avatar\.jpg"|<img[^>]*src="https:\/\/res\.cloudinary\.com\/demo\/avatar\.jpg"[^>]*alt=""/.test(html) && textOf(html).includes('Nombre del autor'), 'el avatar no es decorativo o falta el nombre')
  check('CtaPanel: lleva el formulario de panel con honeypot y locale', /name="company_website"/.test(html) && /name="locale"/.test(html), 'falta el formulario')
  check('CtaPanel: dos blobs decorativos y el texto del prototipo ausente', countOf(html, /aria-hidden="true"/) >= 3 && !/Resend/.test(html), 'faltan blobs o aparece el texto del prototipo')
  check('CtaPanel: el correo es el recibido, no uno del codigo', !html.includes('hello@juan-tech.com'), 'aparece un correo fijo')

  const sec = renderToHtml(createElement(CtaSection, props), 'es')
  check('CtaSection: contenedor con id contacto y sin landmark main', hasId(sec, 'contacto') && !/<main/.test(sec) && /id="cta-title"/.test(sec), 'falta id contacto, aparece main o falta el panel')
  const none = renderToHtml(createElement(CtaSection, { lead: 'x', email: 'a@b.c' }), 'es')
  check('CtaSection sin titulo no renderiza nada', markup(none) === '', `devolvio ${markup(none).length} caracteres`)
}

// ---------------------------------------------------------------------------
// Tarea 3: lector de datos (parte pura)
// ---------------------------------------------------------------------------
{
  const page = (info: Array<{ href?: string | null }>) =>
    ({ content: { layout: [{ blockType: 'contactFormBlock', contactInfo: info }] } }) as never
  check('extractContactEmail toma la entrada mailto y quita la query', extractContactEmail(page([{ href: 'https://x.com' }, { href: 'mailto:a@b.co?subject=hola' }])) === 'a@b.co', 'no extrajo el correo')
  check('extractContactEmail sin mailto devuelve null', extractContactEmail(page([{ href: 'tel:+51' }])) === null && extractContactEmail(undefined) === null, 'devolvio algo sin mailto')
  check('extractContactEmail descarta un mailto con direccion invalida', extractContactEmail(page([{ href: 'mailto:juan @x' }])) === null, 'publico una direccion invalida')
}

if (failed > 0) {
  console.log(`\n${failed} caso(s) con FAIL`)
  process.exit(1)
}
console.log('\nPASS 54-conversion-ssr: todos los casos')
