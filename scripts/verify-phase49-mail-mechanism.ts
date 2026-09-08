#!/usr/bin/env node
/**
 * Verificación de punta a punta del mecanismo de doble opt-in + entrega de
 * lead magnet (Phase 49-01, tracer de la fase).
 *
 * NO invoca `subscribeToLeadMagnetAction` directamente: esa Server Action usa
 * `headers()`/`redirect()` de Next, que solo existen dentro de un request real
 * de Next.js — mismo límite que ya documenta
 * `scripts/db/10-test-newsletter-flow.ts` para `subscribeAction`. En su lugar,
 * este script replica exactamente la escritura que la acción haría vía Local
 * API, y ejercita las rutas/páginas REALES (`/api/newsletter/confirm`,
 * `/blog/confirm`) contra un dev server real con `fetch` — así prueba la
 * mitad nueva del mecanismo que este plan agrega de verdad, no una
 * simulación de esa mitad.
 *
 * Requiere un dev server corriendo en `VERIFY_BASE_URL` (default
 * http://localhost:3000) y los 2 docs `lead-magnets` reales (es/en) ya
 * subidos por `scripts/upload-lead-magnet.ts` (Task 1).
 *
 * Usage:
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-phase49-mail-mechanism.ts --happy-path-only
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-phase49-mail-mechanism.ts
 */
import { randomBytes } from 'crypto'
import { createElement } from 'react'
import { render } from '@react-email/render'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { ConfirmLeadMagnet } from '../src/emails/ConfirmLeadMagnet'
import { verifyDownloadToken } from '../src/lib/download-token'

const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const HAPPY_PATH_ONLY = process.argv.includes('--happy-path-only')

// Dirección real de Juan (la misma que ya recibe los envíos del formulario de
// contacto en producción) — el camino feliz manda un correo real vía Resend
// real, per instrucción del orquestador: "target Juan's own email or a safe
// test address". No hay razón para inventar un dominio de prueba acá: es la
// única prueba de este script que SÍ tiene que demostrar entrega real.
const HAPPY_PATH_TEST_EMAIL = process.env.CONTACT_TO_EMAIL

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

async function runHappyPath(): Promise<void> {
  if (!HAPPY_PATH_TEST_EMAIL) {
    fail('CONTACT_TO_EMAIL no está configurado — hace falta una dirección real para el camino feliz.')
  }

  const payload = await getPayload({ config })

  const { docs: leadMagnets } = await payload.find({
    collection: 'lead-magnets',
    where: { locale: { equals: 'es' } },
    limit: 1,
  })

  const leadMagnet = leadMagnets[0]
  if (!leadMagnet) fail('No hay ningún doc lead-magnets para locale "es" — correr upload-lead-magnet.ts primero.')

  const token = randomBytes(32).toString('hex')

  const { docs: existing } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: HAPPY_PATH_TEST_EMAIL } },
    limit: 1,
  })
  const current = existing[0]

  // Réplica exacta de la rama `resendReady` de `subscribe-lead-magnet.tsx`:
  // arranca de cero (status pending, token nuevo, fechas limpias).
  const data = {
    optInReason: 'lead-magnet' as const,
    leadMagnet: leadMagnet.id,
    source: '/blog/verify-phase49-happy-path',
    locale: 'es' as const,
    token,
    status: 'pending' as const,
    confirmedAt: null,
    unsubscribedAt: null,
  }

  if (current) {
    await payload.update({ collection: 'subscribers', id: current.id, data })
  } else {
    await payload.create({ collection: 'subscribers', data: { ...data, email: HAPPY_PATH_TEST_EMAIL } })
  }

  const confirmUrl = `${BASE_URL}/api/newsletter/confirm?token=${token}`
  const template = createElement(ConfirmLeadMagnet, { confirmUrl, locale: 'es' as const })

  // Envío real vía Resend real — prueba que el key configurado hoy (2026-09-07)
  // efectivamente acepta y entrega el correo, no solo que el código compila.
  await payload.sendEmail({
    to: HAPPY_PATH_TEST_EMAIL,
    subject: 'Confirma tu correo para descargar el checklist',
    html: await render(template),
    text: await render(template, { plainText: true }),
  })

  console.log(`  correo real enviado a ${HAPPY_PATH_TEST_EMAIL} vía Resend, sin excepción.`)

  // Ejercita la ruta REAL de confirmación (no una réplica) contra el dev
  // server real — esto es lo que este plan agrega de nuevo.
  const confirmRes = await fetch(confirmUrl, { redirect: 'manual' })

  if (confirmRes.status < 300 || confirmRes.status >= 400) {
    fail(`/api/newsletter/confirm respondió ${confirmRes.status}, esperaba un redirect 3xx.`)
  }

  const location = confirmRes.headers.get('location')
  if (!location) fail('/api/newsletter/confirm no devolvió header Location.')

  const locationUrl = new URL(location, BASE_URL)

  if (!locationUrl.pathname.endsWith('/blog/confirm')) {
    fail(`Location esperaba terminar en /blog/confirm, fue "${locationUrl.pathname}".`)
  }

  const downloadToken = locationUrl.searchParams.get('token')
  if (!downloadToken) fail('Location de /api/newsletter/confirm no trae ?token=.')

  const verified = verifyDownloadToken(downloadToken)
  if (!verified) fail('El downloadToken emitido por la ruta de confirmación no pasa verifyDownloadToken().')
  if (verified.leadMagnetId !== leadMagnet.id) {
    fail(`El downloadToken apunta a leadMagnetId=${verified.leadMagnetId}, esperaba ${leadMagnet.id}.`)
  }

  console.log(`  /api/newsletter/confirm redirigió a ${locationUrl.pathname} con un downloadToken válido.`)

  // Ejercita la página REAL de confirmación (no una réplica) contra el dev
  // server real.
  const confirmPageRes = await fetch(`${BASE_URL}${locationUrl.pathname}${locationUrl.search}`)
  if (!confirmPageRes.ok) fail(`/blog/confirm respondió ${confirmPageRes.status}.`)

  const html = await confirmPageRes.text()
  const hrefMatch = html.match(/href="([^"]*cloudinary[^"]*)"/i)
  if (!hrefMatch) fail('La página /blog/confirm no renderizó ningún href de Cloudinary en el estado de éxito.')

  const signedUrl = decodeHtmlEntities(hrefMatch[1])
  console.log(`  /blog/confirm renderizó una URL firmada de Cloudinary.`)

  // La URL firmada tiene que servir el PDF real — el punto entero de MAIL-03.
  const downloadRes = await fetch(signedUrl)
  if (!downloadRes.ok) fail(`La URL firmada respondió ${downloadRes.status} en vez de 200.`)

  const bytes = await downloadRes.arrayBuffer()
  if (bytes.byteLength < 1000) fail(`El archivo descargado mide ${bytes.byteLength} bytes — demasiado chico para ser el PDF real.`)

  console.log(`  URL firmada descargó el PDF real (${bytes.byteLength} bytes).`)

  const { docs: afterConfirm } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: HAPPY_PATH_TEST_EMAIL } },
    limit: 1,
  })
  if (afterConfirm[0]?.status !== 'confirmed') {
    fail(`El suscriptor de prueba quedó en status "${afterConfirm[0]?.status}", esperaba "confirmed".`)
  }

  console.log('HAPPY_PATH_OK')
}

async function main() {
  await runHappyPath()

  if (HAPPY_PATH_ONLY) {
    process.exit(0)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
