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
import { spawnSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import config from '../src/payload.config'
import { ConfirmLeadMagnet } from '../src/emails/ConfirmLeadMagnet'
import { verifyDownloadToken } from '../src/lib/download-token'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')

const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const HAPPY_PATH_ONLY = process.argv.includes('--happy-path-only')

// Dirección real de Juan (la misma que ya recibe los envíos del formulario de
// contacto en producción) — el camino feliz manda un correo real vía Resend
// real, per instrucción del orquestador: "target Juan's own email or a safe
// test address". No hay razón para inventar un dominio de prueba acá: es la
// única prueba de este script que SÍ tiene que demostrar entrega real.
const HAPPY_PATH_TEST_EMAIL = process.env.CONTACT_TO_EMAIL

// Dominio reservado por RFC 2606 — nunca resuelve a un destinatario real, así
// que ni por error este camino (que por diseño NO debe encolar ningún correo)
// termina entregando algo a alguien. Camino degradado + anti-enumeración usan
// la misma dirección de prueba.
const DEGRADED_TEST_EMAIL = 'phase49-degraded-path@example.invalid'

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

/**
 * (1) CAMINO DEGRADADO (MAIL-04) — corre en un proceso hijo de Node
 * completamente aislado, con un `env` propio que OMITE `RESEND_API_KEY`
 * (nunca `delete process.env.RESEND_API_KEY` en este proceso principal, que
 * sigue necesitando la key real para el camino feliz de arriba). El proceso
 * hijo confirma `isResendConfigured() === false` en su propio contexto y
 * ejecuta ahí mismo la escritura que la rama sin Resend de
 * `subscribe-lead-magnet.tsx` haría: suscriptor `confirmed` de una, token de
 * descarga minteado, URL firmada resuelta y curleada — todo sin que se
 * encole un solo correo.
 */
async function runDegradedPath(): Promise<void> {
  // Dentro de `scripts/`, NO en el tmpdir del SO: la resolución de módulos de
  // Node camina hacia arriba desde la ubicación del propio archivo buscando
  // `node_modules`, y el tmpdir del SO no tiene ningún ancestro con el
  // `node_modules` del proyecto — `import ... from 'payload'` fallaría con
  // MODULE_NOT_FOUND. El archivo se borra en el `finally` de abajo pase lo
  // que pase.
  const childScriptPath = path.join(REPO_ROOT, 'scripts', `.phase49-degraded-child-${Date.now()}.tmp.ts`)

  const realChildSource = `
import { getPayload } from 'payload'
import config from '${path.join(REPO_ROOT, 'src/payload.config').replace(/\\/g, '/')}'
import { isResendConfigured } from '${path.join(REPO_ROOT, 'src/lib/resend-configured').replace(/\\/g, '/')}'
import { mintDownloadToken } from '${path.join(REPO_ROOT, 'src/lib/download-token').replace(/\\/g, '/')}'
import { resolveSignedDownloadUrl } from '${path.join(REPO_ROOT, 'src/lib/secure-download').replace(/\\/g, '/')}'

async function main() {
  if (isResendConfigured()) {
    console.error('CHILD_FAIL: isResendConfigured() devolvió true dentro del proceso hijo aislado.')
    process.exit(1)
  }
  console.log('  proceso hijo aislado: isResendConfigured() === false, confirmado.')

  const payload = await getPayload({ config })
  const testEmail = ${JSON.stringify(DEGRADED_TEST_EMAIL)}

  const { docs: leadMagnets } = await payload.find({
    collection: 'lead-magnets',
    where: { locale: { equals: 'es' } },
    limit: 1,
  })
  const leadMagnet = leadMagnets[0]
  if (!leadMagnet) {
    console.error('CHILD_FAIL: no hay ningún doc lead-magnets para locale "es".')
    process.exit(1)
  }

  const { docs: existing } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: testEmail } },
    limit: 1,
  })
  const current = existing[0]

  const data = {
    optInReason: 'lead-magnet',
    leadMagnet: leadMagnet.id,
    source: '/blog/verify-phase49-degraded-path',
    locale: 'es',
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
    unsubscribedAt: null,
  }

  if (current) {
    await payload.update({ collection: 'subscribers', id: current.id, data })
  } else {
    await payload.create({ collection: 'subscribers', data: { ...data, email: testEmail } })
  }

  const downloadToken = mintDownloadToken(leadMagnet.id)
  const signedUrl = resolveSignedDownloadUrl(leadMagnet.cloudinaryPublicId)

  const res = await fetch(signedUrl)
  if (!res.ok) {
    console.error('CHILD_FAIL: la URL firmada respondió ' + res.status + ' en vez de 200.')
    process.exit(1)
  }
  const bytes = await res.arrayBuffer()
  if (bytes.byteLength < 1000) {
    console.error('CHILD_FAIL: el archivo descargado mide ' + bytes.byteLength + ' bytes.')
    process.exit(1)
  }

  console.log('  suscriptor de prueba quedó "confirmed" sin enviar ningún correo; magnet descargable (' + bytes.byteLength + ' bytes).')
  console.log('CHILD_DEGRADED_OK')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
`.trim()

  writeFileSync(childScriptPath, realChildSource, 'utf8')

  // `fail()` hace `process.exit()`, que NO corre los `finally` pendientes —
  // por eso el resultado se guarda en una variable y `fail()` se llama
  // recién después del `finally` de abajo, para garantizar que el archivo
  // temporal se borre pase lo que pase, incluso si el hijo falla.
  let childOk = false
  let stdout = ''
  let stderr = ''

  try {
    // `env` propio: copia de `process.env` SIN `RESEND_API_KEY` — nunca se
    // toca `process.env` del proceso principal, que sigue vivo y con la key
    // real (el camino feliz de arriba ya corrió, pero por higiene el proceso
    // padre nunca debe quedar en un estado donde su propia key desaparezca).
    const childEnv = { ...process.env }
    delete childEnv.RESEND_API_KEY

    const result = spawnSync('node', ['node_modules/.bin/tsx', childScriptPath], {
      cwd: REPO_ROOT,
      env: childEnv,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    stdout = result.stdout ?? ''
    stderr = result.stderr ?? ''
    childOk = result.status === 0 && stdout.includes('CHILD_DEGRADED_OK')
  } finally {
    try {
      unlinkSync(childScriptPath)
    } catch {
      // Nada que hacer si ya no existe.
    }
  }

  if (stdout) process.stdout.write(stdout)
  if (stderr) process.stderr.write(stderr)

  if (!childOk) fail('El proceso hijo del camino degradado no imprimió CHILD_DEGRADED_OK.')

  console.log('DEGRADED_PATH_OK')
}

/**
 * (2) ANTI-ENUMERACIÓN — corre en ESTE proceso (no hace falta aislar
 * `RESEND_API_KEY` acá, esto no manda correos). Replica directamente la
 * misma lógica de búsqueda-y-bifurcación de `subscribe-lead-magnet.tsx`
 * (imposible invocar la Server Action real desde un script, ver el docblock
 * de arriba) sobre el suscriptor de prueba que el camino degradado acaba de
 * dejar `confirmed`.
 */
async function runAntiEnumeration(): Promise<void> {
  const payload = await getPayload({ config })

  const { docs: leadMagnets } = await payload.find({
    collection: 'lead-magnets',
    where: { locale: { equals: 'es' } },
    limit: 1,
  })
  const leadMagnet = leadMagnets[0]
  if (!leadMagnet) fail('No hay ningún doc lead-magnets para locale "es".')

  const { docs: before } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: DEGRADED_TEST_EMAIL } },
    limit: 1,
  })
  const confirmedSubscriber = before[0]
  if (!confirmedSubscriber || confirmedSubscriber.status !== 'confirmed') {
    fail('El suscriptor de prueba del camino degradado no quedó "confirmed" — no se puede probar anti-enumeración.')
  }

  const relationId = (value: number | { id: number } | null | undefined): number | null =>
    value == null ? null : typeof value === 'number' ? value : value.id

  const alreadyHasThisMagnet =
    confirmedSubscriber.status === 'confirmed' &&
    confirmedSubscriber.optInReason === 'lead-magnet' &&
    relationId(confirmedSubscriber.leadMagnet) === leadMagnet.id

  if (!alreadyHasThisMagnet) {
    fail('La condición "already" no reconoció al suscriptor ya confirmado con este mismo lead magnet.')
  }

  console.log('  rama "already" reconocida: ningún payload.create/update se ejecuta, ningún correo se encola.')

  // Marca al mismo suscriptor como `unsubscribed` y repite la bifurcación —
  // tiene que tratarse como "arranca de cero" (nuevo pending, nuevo token),
  // mismo criterio que ya aplica `subscribeAction` para una reactivación.
  await payload.update({
    collection: 'subscribers',
    id: confirmedSubscriber.id,
    data: { status: 'unsubscribed', unsubscribedAt: new Date().toISOString() },
  })

  const { docs: afterUnsub } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: DEGRADED_TEST_EMAIL } },
    limit: 1,
  })
  const unsubscribedSubscriber = afterUnsub[0]
  if (!unsubscribedSubscriber) fail('El suscriptor de prueba desapareció después de marcarlo como unsubscribed.')

  const stillAlready =
    unsubscribedSubscriber?.status === 'confirmed' &&
    unsubscribedSubscriber?.optInReason === 'lead-magnet' &&
    relationId(unsubscribedSubscriber?.leadMagnet) === leadMagnet.id

  if (stillAlready) {
    fail('La condición "already" siguió dando true después de marcar al suscriptor como unsubscribed.')
  }

  const newToken = randomBytes(32).toString('hex')

  await payload.update({
    collection: 'subscribers',
    id: unsubscribedSubscriber.id,
    data: {
      optInReason: 'lead-magnet',
      leadMagnet: leadMagnet.id,
      locale: 'es',
      token: newToken,
      status: 'pending',
      confirmedAt: null,
      unsubscribedAt: null,
    },
  })

  const { docs: afterReactivate } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: DEGRADED_TEST_EMAIL } },
    limit: 1,
  })

  if (afterReactivate[0]?.status !== 'pending' || afterReactivate[0]?.token !== newToken) {
    fail('La reactivación desde "unsubscribed" no dejó al suscriptor en "pending" con el token nuevo.')
  }

  console.log('  reactivación desde "unsubscribed" tratada como alta nueva: status "pending", token nuevo.')
  console.log('ANTI_ENUMERATION_OK')
}

/**
 * Limpia únicamente los suscriptores de prueba que este script creó
 * (camino feliz + camino degradado/anti-enumeración) — nunca toca los 2 docs
 * `lead-magnets` reales (es/en) que Task 1 subió a Cloudinary.
 */
async function cleanup(): Promise<void> {
  const payload = await getPayload({ config })

  const testEmails = [HAPPY_PATH_TEST_EMAIL, DEGRADED_TEST_EMAIL].filter(
    (email): email is string => Boolean(email),
  )

  for (const email of testEmails) {
    const { docs } = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
      limit: 1,
    })

    if (docs[0]) {
      await payload.delete({ collection: 'subscribers', id: docs[0].id })
      console.log(`  suscriptor de prueba limpiado: ${email}`)
    }
  }
}

async function main() {
  await runHappyPath()

  if (HAPPY_PATH_ONLY) {
    process.exit(0)
  }

  await runDegradedPath()
  await runAntiEnumeration()
  await cleanup()

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
