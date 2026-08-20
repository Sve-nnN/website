/**
 * Prueba de humo del alta al correo, contra Resend real.
 *
 * QUÉ PRUEBA DE VERDAD: que la colección `subscribers` acepta el alta, que
 * Resend entrega el correo con el enlace de confirmación bien armado, y que la
 * fila queda `pending`. Los pasos de confirmar y dar de baja se hacen después
 * abriendo las rutas reales (`/api/newsletter/confirm` y `/unsubscribe`), que sí
 * es código de producción sin replicar.
 *
 * QUÉ NO PRUEBA: el server action en sí. `subscribeAction` usa `headers()` para
 * el rate limit, y eso solo existe dentro de un request de Next, así que desde
 * un script no se puede invocar. Lo que sí comparte es la PLANTILLA: se importa
 * el mismo componente de React Email que manda el sitio, así que lo que llega a
 * la bandeja en esta prueba es byte por byte lo que recibe un suscriptor real.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/10-test-newsletter-flow.ts --to alguien@dominio.com --apply
 *
 * Sin `--apply` no escribe ni manda nada. `--base` cambia el host del enlace de
 * confirmación (por defecto el dev server local), porque producción todavía no
 * tiene desplegadas esas rutas.
 */
import { randomBytes } from 'crypto'
import { createElement } from 'react'
import { render } from '@react-email/render'
import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { ConfirmSubscription } from '../../src/emails/ConfirmSubscription'

const APPLY = process.argv.includes('--apply')
const to = process.argv[process.argv.indexOf('--to') + 1]
const baseArg = process.argv.indexOf('--base')
const BASE = baseArg !== -1 ? process.argv[baseArg + 1] : 'http://localhost:3005'

if (!to || !to.includes('@')) {
  console.error('Falta --to <correo>')
  process.exit(1)
}

async function main() {
  const payload = await getPayload({ config })
  console.log(APPLY ? '=== ENVIANDO DE VERDAD ===' : '=== DRY-RUN (no manda nada) ===')
  console.log(`  destinatario: ${to}`)
  console.log(`  base del enlace: ${BASE}`)

  const token = randomBytes(32).toString('hex')

  const { docs } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: to } },
    limit: 1,
  })
  const current = docs[0]
  console.log(`  fila existente: ${current ? `sí (id ${current.id}, ${current.status})` : 'no'}`)

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correr con --apply para escribir y enviar.')
    process.exit(0)
  }

  if (current) {
    await payload.update({
      collection: 'subscribers',
      id: current.id,
      data: { status: 'pending', token, locale: 'es', source: 'prueba-de-humo' },
    })
  } else {
    await payload.create({
      collection: 'subscribers',
      data: { email: to, status: 'pending', token, locale: 'es', source: 'prueba-de-humo' },
    })
  }

  const confirmUrl = `${BASE.replace(/\/$/, '')}/api/newsletter/confirm?token=${token}`

  // `createElement` en vez de JSX: el tsconfig del proyecto tiene `jsx:
  // "preserve"` porque la transformación la hace Next, y `tsx` fuera de Next
  // deja el JSX sin transformar ("React is not defined"). Este script no
  // necesita JSX para nada, así que se evita el problema en vez de pelearse con
  // la config.
  const template = createElement(ConfirmSubscription, { confirmUrl, locale: 'es' as const })

  await payload.sendEmail({
    to,
    subject: 'Confirma tu correo para recibir el blog',
    html: await render(template),
    text: await render(template, { plainText: true }),
  })

  console.log('\n  correo entregado a Resend sin error')
  console.log(`  confirmar:  ${confirmUrl}`)
  console.log(`  dar de baja: ${BASE.replace(/\/$/, '')}/api/newsletter/unsubscribe?token=${token}`)

  const { docs: after } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: to } },
    limit: 1,
  })
  console.log(`\n  estado en base: ${after[0]?.status ?? 'SIN FILA'}`)
  process.exit(after[0]?.status === 'pending' ? 0 : 1)
}

main()
