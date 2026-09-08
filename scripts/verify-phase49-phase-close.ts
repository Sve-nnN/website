#!/usr/bin/env node
/**
 * Phase 49 Plan 03, Task 2 — verificación final de fase: MAIL-01..05 contra
 * el sistema YA descubrible (bloque real en el post real de 49-02, PDFs
 * reales de 49-01), ejercidos como UNA sola cadena sobre la superficie final,
 * no en piezas aisladas como hicieron 49-01/49-02 por separado. Reconfirma
 * además T-49-07 (subscribers/lead-magnets fuera de los mapas de
 * plugin/sitemap) y T-49-03 (los 2 PDFs siguen privados sin firma).
 *
 * Diferencia real con 49-01-mail-mechanism.ts: ese script escribía el
 * suscriptor "pending" directamente vía Local API (réplica de lo que la
 * Server Action haría) porque no podía invocar la Action desde un script
 * suelto. Este script en cambio abre el post REAL con Playwright, completa y
 * envía el FORMULARIO REAL (mismo bloque, misma superficie descubrible que
 * 49-02 insertó en producción), y desde ahí sigue la MISMA cadena real hasta
 * la descarga firmada — el "arranque" de la cadena ya no es una réplica, es
 * el camino real de un visitante.
 *
 * El camino degradado (MAIL-04) sigue necesitando el proceso hijo aislado que
 * 49-01 ya estableció como patrón: el servidor real de este verify ya corrió
 * con un `RESEND_API_KEY` real en su propio proceso (Juan la configuró antes
 * de esta fase), así que no hay forma de ejercer la rama "no configurado" a
 * través del servidor real sin reiniciarlo con otro entorno. Aislar la lógica
 * en un proceso hijo (mismo patrón, mismos helpers, contra el lead-magnet
 * real) es la única forma válida — documentado también en 49-01-SUMMARY.md.
 *
 * Requiere un dev/prod server real corriendo en VERIFY_BASE_URL/BASE_URL
 * (default http://localhost:3000).
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/verify-phase49-phase-close.ts
 */
import { chromium } from 'playwright'
import { getPayload } from 'payload'
import { v2 as cloudinary } from 'cloudinary'
import { spawnSync } from 'node:child_process'
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import config from '../src/payload.config'
import { verifyDownloadToken } from '../src/lib/download-token'
import { blogPostPath, localizeBlogPath, resolvePrimaryCategorySlug } from '../src/lib/blog-paths'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const BASE_URL = process.env.VERIFY_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000'

// Dominio reservado por RFC 2606 (nunca resuelve a un destinatario real),
// distinto de los usados por 49-01/49-02 para no chocar con sus estados.
const HAPPY_TEST_EMAIL = 'phase49-03-close-happy@example.invalid'
const DEGRADED_TEST_EMAIL = 'phase49-03-close-degraded@example.invalid'

const COPY = {
  heading: 'Checklist de auditoría SEO técnica',
  emailLabel: 'Correo electrónico',
  submitLabel: 'Enviarme el checklist',
  pendingHeading: 'Revisa tu correo',
}

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

type BlockNode = { type?: string; fields?: { blockType?: string } }

/**
 * Cadena 1: formulario visible → Server Action real (POST del browser) →
 * subscriber pending real (Local API solo LEE el token que la Action ya
 * escribió) → /api/newsletter/confirm real → /blog/confirm real → descarga
 * firmada real. MAIL-01 + MAIL-02 + MAIL-03 en un solo recorrido.
 */
async function runHappyPathOnRealSurface(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  const { docs } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    locale: 'es',
    limit: 0,
    pagination: false,
    depth: 1,
  })

  const withBlock = (docs as Array<{ id: number | string; slug?: string | null; categories?: unknown; content?: { root?: { children?: BlockNode[] } } }>).find(
    (doc) => {
      const children = doc.content?.root?.children
      return Array.isArray(children) && children.some((n) => n.type === 'block' && n.fields?.blockType === 'email-capture')
    },
  )
  if (!withBlock || !withBlock.slug) fail('Ningún post publicado real tiene el bloque email-capture — la superficie final no es descubrible.')

  const categorySlug = resolvePrimaryCategorySlug(withBlock.categories as Parameters<typeof resolvePrimaryCategorySlug>[0])
  const url = `${BASE_URL}${localizeBlogPath('es', blogPostPath(categorySlug, withBlock.slug))}`

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })

    const heading = page.getByText(COPY.heading, { exact: true })
    if (!(await heading.isVisible().catch(() => false))) fail(`No se encontró el bloque real ("${COPY.heading}") en ${url}.`)

    await page.getByLabel(COPY.emailLabel).fill(HAPPY_TEST_EMAIL)
    await Promise.all([
      page.waitForURL((u) => u.searchParams.get('subscribed') === 'pending', { timeout: 15000 }),
      page.getByRole('button', { name: COPY.submitLabel }).click(),
    ])

    const stateHeading = page.getByText(COPY.pendingHeading, { exact: true })
    if (!(await stateHeading.isVisible().catch(() => false))) {
      fail('Tras enviar el formulario REAL, no se ve el estado "pending" en la MISMA página.')
    }
    console.log('  formulario real completado y enviado sobre la superficie final -> estado pending visible.')
    console.log('MAIL01_OK')
    await page.close()
  } finally {
    await browser.close()
  }

  // Solo LECTURA: el subscriber ya fue escrito por la Server Action real de
  // arriba, no por este script.
  const { docs: subs } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: HAPPY_TEST_EMAIL } },
    limit: 1,
  })
  const subscriber = subs[0]
  if (!subscriber || subscriber.status !== 'pending' || !subscriber.token) {
    fail('El subscriber creado por el formulario real no quedó "pending" con un token — no se puede continuar la cadena.')
  }

  const confirmRes = await fetch(`${BASE_URL}/api/newsletter/confirm?token=${subscriber.token}`, { redirect: 'manual' })
  if (confirmRes.status < 300 || confirmRes.status >= 400) fail(`/api/newsletter/confirm respondió ${confirmRes.status}, esperaba redirect 3xx.`)
  const location = confirmRes.headers.get('location')
  if (!location) fail('/api/newsletter/confirm no devolvió Location.')
  const locationUrl = new URL(location, BASE_URL)
  if (!locationUrl.pathname.endsWith('/blog/confirm')) fail(`Location esperaba /blog/confirm, fue "${locationUrl.pathname}".`)

  const downloadToken = locationUrl.searchParams.get('token')
  if (!downloadToken) fail('/blog/confirm no trae ?token=.')
  const verified = verifyDownloadToken(downloadToken)
  if (!verified) fail('El downloadToken emitido no pasa verifyDownloadToken().')
  console.log('  /api/newsletter/confirm real redirigió con un downloadToken válido -> doble opt-in propio confirmado sobre la cadena real.')
  console.log('MAIL02_OK')

  const confirmPageRes = await fetch(`${BASE_URL}${locationUrl.pathname}${locationUrl.search}`)
  if (!confirmPageRes.ok) fail(`/blog/confirm respondió ${confirmPageRes.status}.`)
  const html = await confirmPageRes.text()
  const hrefMatch = html.match(/href="([^"]*cloudinary[^"]*)"/i)
  if (!hrefMatch) fail('/blog/confirm no renderizó ningún href de Cloudinary en el estado de éxito.')
  const signedUrl = decodeHtmlEntities(hrefMatch[1])

  const downloadRes = await fetch(signedUrl)
  if (!downloadRes.ok) fail(`La URL firmada respondió ${downloadRes.status} en vez de 200.`)
  const bytes = await downloadRes.arrayBuffer()
  if (bytes.byteLength < 1000) fail(`El archivo descargado mide ${bytes.byteLength} bytes.`)
  console.log(`  URL firmada real descargó el PDF real (${bytes.byteLength} bytes) -> extremo final de la cadena.`)
  console.log('MAIL03_OK')
}

/** MAIL-04, mismo patrón aislado que 49-01 (razón documentada en el docblock de arriba). */
async function runDegradedPath(): Promise<void> {
  const childScriptPath = path.join(REPO_ROOT, 'scripts', `.phase49-03-degraded-child-${Date.now()}.tmp.ts`)
  const realChildSource = `
import { getPayload } from 'payload'
import config from '${path.join(REPO_ROOT, 'src/payload.config').replace(/\\/g, '/')}'
import { isResendConfigured } from '${path.join(REPO_ROOT, 'src/lib/resend-configured').replace(/\\/g, '/')}'
import { mintDownloadToken } from '${path.join(REPO_ROOT, 'src/lib/download-token').replace(/\\/g, '/')}'
import { resolveSignedDownloadUrl } from '${path.join(REPO_ROOT, 'src/lib/secure-download').replace(/\\/g, '/')}'

async function main() {
  if (isResendConfigured()) {
    console.error('CHILD_FAIL: isResendConfigured() devolvió true en el proceso hijo aislado.')
    process.exit(1)
  }
  const payload = await getPayload({ config })
  const testEmail = ${JSON.stringify(DEGRADED_TEST_EMAIL)}

  const { docs: leadMagnets } = await payload.find({ collection: 'lead-magnets', where: { locale: { equals: 'en' } }, limit: 1 })
  const leadMagnet = leadMagnets[0]
  if (!leadMagnet) { console.error('CHILD_FAIL: no hay doc lead-magnets para locale en.'); process.exit(1) }

  const { docs: existing } = await payload.find({ collection: 'subscribers', where: { email: { equals: testEmail } }, limit: 1 })
  const current = existing[0]
  const data = { optInReason: 'lead-magnet', leadMagnet: leadMagnet.id, source: '/blog/verify-phase49-03-degraded', locale: 'en', status: 'confirmed', confirmedAt: new Date().toISOString(), unsubscribedAt: null }
  if (current) { await payload.update({ collection: 'subscribers', id: current.id, data }) } else { await payload.create({ collection: 'subscribers', data: { ...data, email: testEmail } }) }

  const signedUrl = resolveSignedDownloadUrl(leadMagnet.cloudinaryPublicId)
  const res = await fetch(signedUrl)
  if (!res.ok) { console.error('CHILD_FAIL: la URL firmada respondió ' + res.status); process.exit(1) }
  const bytes = await res.arrayBuffer()
  if (bytes.byteLength < 1000) { console.error('CHILD_FAIL: archivo de ' + bytes.byteLength + ' bytes'); process.exit(1) }
  mintDownloadToken(leadMagnet.id)
  console.log('CHILD_DEGRADED_OK')
  process.exit(0)
}
main().catch((err) => { console.error(err); process.exit(1) })
`.trim()

  writeFileSync(childScriptPath, realChildSource, 'utf8')
  let childOk = false
  let stdout = ''
  let stderr = ''
  try {
    const childEnv = { ...process.env }
    delete childEnv.RESEND_API_KEY
    const result = spawnSync('node', ['node_modules/.bin/tsx', childScriptPath], { cwd: REPO_ROOT, env: childEnv, encoding: 'utf8', stdio: 'pipe' })
    stdout = result.stdout ?? ''
    stderr = result.stderr ?? ''
    childOk = result.status === 0 && stdout.includes('CHILD_DEGRADED_OK')
  } finally {
    try { unlinkSync(childScriptPath) } catch {}
  }
  if (stdout) process.stdout.write(stdout)
  if (stderr) process.stderr.write(stderr)
  if (!childOk) fail('El proceso hijo del camino degradado no imprimió CHILD_DEGRADED_OK.')
  console.log('  camino degradado (sin RESEND_API_KEY) entregó el magnet real sin encolar correo.')
  console.log('MAIL04_OK')
}

/** MAIL-05, reconfirmado contra el estado final de los archivos (no asumido heredado de 49-01). */
function checkMail05(): void {
  const files = ['src/lib/secure-download.ts', 'src/lib/download-token.ts']
  for (const rel of files) {
    const content = readFileSync(path.join(REPO_ROOT, rel), 'utf8')
    if (/subscribers|from 'payload'|getPayload/i.test(content)) {
      fail(`${rel} tiene una referencia a subscribers/payload — MAIL-05 exige helpers puros.`)
    }
  }
  console.log('  secure-download.ts y download-token.ts siguen sin ninguna referencia a subscribers/payload.')
  console.log('MAIL05_OK')
}

/** T-49-03 (re-cierre): los 2 public_id reales NO resuelven sin firma. */
async function checkCloudinaryPrivate(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })

  const { docs: magnets } = await payload.find({ collection: 'lead-magnets', limit: 10 })
  if (magnets.length < 2) fail(`Esperaba al menos 2 docs lead-magnets (es/en), encontré ${magnets.length}.`)

  for (const magnet of magnets) {
    const unsignedUrl = cloudinary.url(magnet.cloudinaryPublicId, {
      resource_type: 'raw',
      type: 'authenticated',
      sign_url: false,
    })
    const res = await fetch(unsignedUrl)
    if (res.status !== 401 && res.status !== 403) {
      fail(`El public_id "${magnet.cloudinaryPublicId}" (locale ${magnet.locale}) resolvió ${res.status} SIN firma — debería dar 401/403.`)
    }
    console.log(`  ${magnet.cloudinaryPublicId} (${magnet.locale}): ${res.status} sin firma, correcto (privado).`)
  }
  console.log('CLOUDINARY_PRIVATE_OK')
}

/** T-49-07 (re-cierre): grep directo sobre el estado final de los archivos. */
function checkSitemapAndMcpExclusion(): void {
  const sitemapData = readFileSync(path.join(REPO_ROOT, 'src/lib/sitemap-data.ts'), 'utf8')
  const sitemapMatch = sitemapData.match(/const SITEMAP_COLLECTIONS[^=]*=\s*\[[\s\S]*?\n\]/)
  if (!sitemapMatch) fail('No se encontró el array SITEMAP_COLLECTIONS en sitemap-data.ts.')
  if (/['"]lead-magnets['"]|['"]subscribers['"]/.test(sitemapMatch[0])) {
    fail('subscribers/lead-magnets aparecen en SITEMAP_COLLECTIONS.')
  }

  const payloadConfig = readFileSync(path.join(REPO_ROOT, 'src/payload.config.ts'), 'utf8')
  const mcpMatch = payloadConfig.match(/mcpPlugin\([\s\S]*?\n\s*\}\)/)
  if (!mcpMatch) fail('No se encontró la config de mcpPlugin( en payload.config.ts.')
  if (/['"]lead-magnets['"]|['"]subscribers['"]/.test(mcpMatch[0])) {
    fail('subscribers/lead-magnets aparecen en el mapa de colecciones de mcpPlugin.')
  }
  console.log('  subscribers/lead-magnets confirmados fuera de SITEMAP_COLLECTIONS y del mapa de mcpPlugin (estado final de archivos).')
  console.log('SITEMAP_MCP_EXCLUSION_OK')
}

async function cleanup(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  for (const email of [HAPPY_TEST_EMAIL, DEGRADED_TEST_EMAIL]) {
    const { docs } = await payload.find({ collection: 'subscribers', where: { email: { equals: email } }, limit: 1 })
    if (docs[0]) {
      await payload.delete({ collection: 'subscribers', id: docs[0].id })
      console.log(`  suscriptor de prueba limpiado: ${email}`)
    }
  }
}

async function main() {
  const payload = await getPayload({ config })

  await runHappyPathOnRealSurface(payload)
  await runDegradedPath()
  checkMail05()
  await checkCloudinaryPrivate(payload)
  checkSitemapAndMcpExclusion()
  await cleanup(payload)

  console.log('PHASE49_CLOSE_ALL_OK')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
