/**
 * Autoprueba de render de Contacto (fase 54, plan 54-12).
 *
 * Pasa el copy sembrado (HOME_COPY_ES: contact y faq) y un doc `contact` de
 * prueba por `assembleContactData`, renderiza ContactView con el arnes de
 * servidor y comprueba la estructura del HTML. No toca base ni red.
 *
 *   node_modules/.bin/tsx scripts/verify/54-contact-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { ContactView } from '../../src/components/pages/ContactView'
import { assembleContactData, extractContactEmail, type ContactData } from '../../src/lib/contact-data'
import { HOME_COPY_ES } from '../db/data/54-home-copy'
import { countOf, hasId, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx usa el runtime clasico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

// Correo de prueba: dominio reservado para ejemplos, nunca el real.
const TEST_EMAIL = 'correo@ejemplo.com'

const DOC = {
  title: 'Contacto',
  meta: { title: 'Contacto | Juan Carlos Angulo' },
  content: {
    layout: [
      {
        blockType: 'contactFormBlock',
        title: 'Hablemos',
        contactInfo: [{ icon: 'mail', href: `mailto:${TEST_EMAIL}`, title: 'Email', value: TEST_EMAIL }],
      },
    ],
  },
}

const DOC_WITH_HERO = {
  ...DOC,
  content: {
    layout: [
      { blockType: 'hero', title: 'Titulo del hero de contacto', subtitle: 'Lead del hero de contacto' },
      ...DOC.content.layout,
    ],
  },
}

function build(
  overrides: Partial<ContactData> = {},
  doc: Parameters<typeof assembleContactData>[0] = DOC,
  isFallback = false,
): ContactData {
  return { ...assembleContactData(doc, HOME_COPY_ES as never, isFallback, 'Contacto'), ...overrides }
}

type Status = 'success' | 'error' | null

function render(data: ContactData, status: Status = null, locale: 'es' | 'en' = 'es'): string {
  return renderToHtml(
    createElement(ContactView, { data, locale, status, formEmail: data.email ?? '' }),
    locale,
  ).replace(/<style[\s\S]*?<\/style>/g, '')
}

// ---------------------------------------------------------------------------
// Mapeo
// ---------------------------------------------------------------------------
{
  const data = build()
  check(data.email === TEST_EMAIL, 'mapeo: el correo sale de contactInfo (href mailto)', `email = ${data.email}`)
  check(data.title === 'Contacto', 'mapeo: sin hero el h1 es el titulo del doc', `title = ${data.title}`)
  check(data.schemaName === 'Contacto | Juan Carlos Angulo', 'mapeo: schemaName conserva meta.title', `schemaName = ${data.schemaName}`)
  check(data.steps?.items.length === 3, 'mapeo: tres pasos', `pasos = ${data.steps?.items.length}`)
  check(data.infoRows.length === 3 && data.infoRows.every((r) => r.icon), 'mapeo: tres filas con icono valido', JSON.stringify(data.infoRows.map((r) => r.icon)))
  check(data.faq?.items.length === 5 && data.faq.title === 'Antes de escribir', 'mapeo: cinco preguntas y titulo de la FAQ', `faq = ${data.faq?.items.length}`)

  const withHero = build({}, DOC_WITH_HERO)
  check(withHero.title === 'Titulo del hero de contacto' && withHero.lead === 'Lead del hero de contacto', 'mapeo: el hero del doc da h1 y lead', `${withHero.title} / ${withHero.lead}`)

  check(extractContactEmail({ content: { layout: [{ blockType: 'contactFormBlock', contactInfo: [{ href: 'https://x.com' }] }] } }) === null, 'mapeo: un href que no es mailto no da correo', 'devolvio un correo')
  check(extractContactEmail({ content: { layout: [{ blockType: 'contactFormBlock', contactInfo: [{ href: 'mailto:no-es-un-correo' }] }] } }) === null, 'mapeo: un mailto sin direccion valida no da correo', 'devolvio un correo')

  const placeholders = assembleContactData(
    DOC,
    { contact: { stepsTitle: '[PLACEHOLDER] titulo', steps: [{ title: 'Paso', body: 'x' }] }, faq: { items: [] } } as never,
    false,
    'Contacto',
  )
  check(placeholders.steps === null, 'mapeo: [PLACEHOLDER] se filtra siempre', 'la franja de pasos paso con marcador')
}

// ---------------------------------------------------------------------------
// Render completo en ES
// ---------------------------------------------------------------------------
{
  const html = render(build())
  const levels = headingLevels(html)
  check(levels.filter((l) => l === 1).length === 1, 'es: un solo h1', `niveles = ${JSON.stringify(levels)}`)
  check(!/<main[\s>]/.test(html) && !/<\/main>/.test(html), 'es: ninguna apertura de main', 'la vista declara main')
  check(textOf(html).includes('Contacto'), 'es: el h1 muestra el titulo del doc', 'no aparece el titulo')

  for (const name of ['name', 'email', 'message']) {
    const field = html.match(new RegExp(`<(?:input|textarea)[^>]*name="${name}"[^>]*>`))
    const id = field?.[0].match(/\sid="([^"]+)"/)?.[1]
    check(
      Boolean(id) && new RegExp(`<label[^>]*for="${id}"`).test(html),
      `es: el campo ${name} tiene etiqueta asociada`,
      `campo = ${field?.[0] ?? 'ausente'}`,
    )
  }
  check(/<input[^>]*type="hidden"[^>]*name="locale"[^>]*value="es"/.test(html), 'es: campo oculto locale con valor es', 'falta locale=es')
  check(
    /aria-hidden="true"[^>]*>(?:(?!<\/div>)[\s\S])*name="company_website"/.test(html) &&
      /<input[^>]*tabindex="-1"[^>]*name="company_website"|<input[^>]*name="company_website"[^>]*tabindex="-1"/.test(html),
    'es: honeypot company_website oculto y sin foco',
    'falta el honeypot o no esta oculto',
  )
  check(!/name="service"|name="website"/.test(html), 'es: sin campos de servicio ni de sitio web', 'aparecio un campo que la accion no lee')

  // Las migas tambien son una lista ordenada: los pasos se miden dentro de su seccion.
  const stepsHtml = html.match(/<section[^>]*id="contact-steps"[\s\S]*?<\/section>/)?.[0] ?? ''
  check(countOf(stepsHtml, /<ol[\s>]/) === 1, 'es: una sola lista ordenada de pasos', `ol = ${countOf(stepsHtml, /<ol[\s>]/)}`)
  const olHtml = stepsHtml.match(/<ol[\s\S]*?<\/ol>/)?.[0] ?? ''
  check(countOf(olHtml, /<li[\s>]/) === 3, 'es: tres tarjetas en la lista ordenada', `li = ${countOf(olHtml, /<li[\s>]/)}`)
  check(countOf(olHtml, /<span[^>]*aria-hidden="true"[^>]*>0[123]<\/span>/) === 3, 'es: tres numerales 01 a 03 con aria-hidden', 'numerales no ocultos')
  check(countOf(olHtml, /<h3[\s>]/) === 3, 'es: cada paso lleva un h3', `h3 = ${countOf(olHtml, /<h3[\s>]/)}`)

  const answers = HOME_COPY_ES.faq.items.map((i) => i.answer)
  const text = textOf(html)
  check(answers.every((a) => text.includes(a)), 'es: las cinco respuestas estan en el HTML aunque cuatro esten cerradas', 'falta alguna respuesta')
  check(countOf(html, /aria-expanded="false"/) === 4 && countOf(html, /aria-expanded="true"/) === 1, 'es: un panel abierto y cuatro cerrados', `abiertos = ${countOf(html, /aria-expanded="true"/)}`)
  check(hasId(html, 'contact-steps-t') && hasId(html, 'contact-faq-t'), 'es: las dos secciones tienen su encabezado con id', 'falta contact-steps-t o contact-faq-t')

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  check(new Set(ids).size === ids.length, 'es: ningun id repetido', `repetidos = ${ids.filter((v, i) => ids.indexOf(v) !== i).join(', ')}`)

  check(html.includes(`href="mailto:${TEST_EMAIL}"`), 'es: boton Escribir un correo con mailto', 'falta el mailto')
  check(text.includes('Copiar correo') && text.includes(TEST_EMAIL), 'es: boton Copiar correo y correo visible', 'falta el boton o el correo')
  check(/aria-live="polite"/.test(html), 'es: region aria-live para el correo copiado', 'falta aria-live')
  check(html.includes('href="/servicios"') && text.includes('Mira los servicios'), 'es: enlace Mira los servicios a /servicios', 'falta el enlace')
  check(!html.includes('hello@juan-tech.com'), 'es: el correo real no esta en el codigo de la vista', 'aparecio el correo real en el fixture')

  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => textOf(m[1]))
  check(!h2.some((t) => /[.,]/.test(t) && t !== 'Cuéntame de tu proyecto'), 'es: ningun h2 de esta pagina con punto ni coma', JSON.stringify(h2))
}

// ---------------------------------------------------------------------------
// Estados del formulario
// ---------------------------------------------------------------------------
{
  const ok = render(build(), 'success')
  check(/role="status"/.test(ok), 'success: hay un role status', 'falta role status')
  check(!/<form[\s>]/.test(ok), 'success: sin formulario', 'el formulario sigue en pantalla')
  check(textOf(ok).includes('Mensaje enviado') && textOf(ok).includes('Enviar otro mensaje'), 'success: titulo y enlace para enviar otro', 'falta el texto')
  check(/href="\/contact"/.test(ok), 'success: Enviar otro mensaje apunta a /contact', 'falta el href')

  const fail = render(build(), 'error')
  check(/role="alert"/.test(fail), 'error: hay un role alert', 'falta role alert')
  check(textOf(fail).includes(TEST_EMAIL) && /<form[\s>]/.test(fail), 'error: muestra el correo y conserva el formulario', 'falta el correo o el formulario')
}

// ---------------------------------------------------------------------------
// Sin datos
// ---------------------------------------------------------------------------
{
  const html = render(build({ email: null, steps: null, infoRows: [], faq: null, lead: null }))
  check(!hasId(html, 'contact-steps-t') && !hasId(html, 'contact-faq-t'), 'sin datos: ninguna seccion huerfana', 'quedo un encabezado de seccion')
  check(!/id="contact-steps"/.test(html), 'sin datos: sin seccion ni lista de pasos', 'quedo la seccion de pasos')
  check(!html.includes('mailto:') && !textOf(html).includes('Copiar correo'), 'sin datos: sin tarjeta de correo', 'quedo la tarjeta de correo')
  check(countOf(html, /<form[\s>]/) === 1 && headingLevels(html)[0] === 1, 'sin datos: queda el h1 y el formulario', 'falta el h1 o el formulario')
  check(!/<main[\s>]/.test(html), 'sin datos: ninguna apertura de main', 'la vista declara main')
}

// ---------------------------------------------------------------------------
// EN
// ---------------------------------------------------------------------------
{
  const strict = render(build({}, DOC, false), null, 'en')
  check(!/role="note"/.test(strict) && !/lang="es"/.test(strict), 'en: con texto traducido no hay aviso ni lang es', 'aparecio el aviso o lang es')
  check(strict.includes('href="/en/services"'), 'en: el enlace de servicios usa /en/services', 'falta /en/services')
  check(/<input[^>]*type="hidden"[^>]*name="locale"[^>]*value="en"/.test(strict), 'en: campo oculto locale con valor en', 'falta locale=en')

  const fallback = render(build({}, DOC, true), null, 'en')
  check(/role="note"/.test(fallback), 'en: con texto sombra sin traducir se muestra TranslationNotice (role note)', 'falta el aviso')
  check(countOf(fallback, /lang="es"/) >= 4, 'en: el texto en espanol va envuelto en lang es', `lang es = ${countOf(fallback, /lang="es"/)}`)
  check(headingLevels(fallback).filter((l) => l === 1).length === 1, 'en: un solo h1', 'h1 repetido')
}

if (failures > 0) {
  console.log(`\n${failures} comprobacion(es) fallaron`)
  process.exit(1)
}
console.log('\nPASS 54-contact-ssr')
