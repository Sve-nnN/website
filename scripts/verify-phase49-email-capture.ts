#!/usr/bin/env node
/**
 * Phase 49 Plan 02, Task 2 (MAIL-01) — verificación con navegador real
 * (Playwright) de que `EmailCaptureBlock` es discoverable y funcional dentro
 * de un post real y publicado.
 *
 * Encuentra por sí mismo (Local API) el post que
 * scripts/seed-phase49-email-capture-post.ts insertó el bloque en — no
 * depende de parsear el stdout de ese script, así los dos scripts quedan
 * desacoplados. Abre el post real (es y en) contra un dev server real, ubica
 * el formulario por su heading/label accesible, lo completa con un email de
 * prueba desechable (distinto al usado en 49-01, dominio reservado
 * RFC 2606 `.invalid` para no entregar nada a un destinatario real), lo
 * envía, y confirma que la MISMA página ahora muestra el estado
 * pending/already en vez del formulario vacío otra vez.
 *
 * Requiere un dev server ya corriendo en VERIFY_BASE_URL/BASE_URL (default
 * http://localhost:3000) — no levanta el suyo propio.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/verify-phase49-email-capture.ts
 */
import { chromium, type Browser } from 'playwright'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { blogPostPath, localizeBlogPath, resolvePrimaryCategorySlug } from '../src/lib/blog-paths'

type Locale = 'es' | 'en'

const BASE_URL = process.env.VERIFY_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000'

// Dominio reservado por RFC 2606 (nunca resuelve a un destinatario real) —
// distinto al usado por scripts/verify-phase49-mail-mechanism.ts (49-01)
// para no chocar con el estado "already" de esos tests.
const TEST_EMAILS: Record<Locale, string> = {
  es: 'phase49-02-block-verify-es@example.invalid',
  en: 'phase49-02-block-verify-en@example.invalid',
}

const COPY: Record<
  Locale,
  {
    heading: string
    emailLabel: string
    submitLabel: string
    pendingHeading: string
    alreadyHeading: string
  }
> = {
  es: {
    heading: 'Checklist de auditoría SEO técnica',
    emailLabel: 'Correo electrónico',
    submitLabel: 'Enviarme el checklist',
    pendingHeading: 'Revisa tu correo',
    alreadyHeading: 'Ya estás suscrito',
  },
  en: {
    heading: 'Technical SEO audit checklist',
    emailLabel: 'Email address',
    submitLabel: 'Send me the checklist',
    pendingHeading: 'Check your email',
    alreadyHeading: "You're already subscribed",
  },
}

type BlockNode = { type?: string; fields?: { blockType?: string } }
type SeededPost = { id: number | string; slug?: string | null; categories?: unknown }

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

async function findSeededPost(payload: Awaited<ReturnType<typeof getPayload>>): Promise<SeededPost> {
  const { docs } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    locale: 'es',
    limit: 0,
    pagination: false,
    depth: 1,
  })

  const withBlock = (docs as Array<SeededPost & { content?: { root?: { children?: BlockNode[] } } }>).find(
    (doc) => {
      const children = doc.content?.root?.children
      return Array.isArray(children) && children.some((n) => n.type === 'block' && n.fields?.blockType === 'email-capture')
    },
  )

  if (!withBlock) {
    fail(
      'Ningún post publicado tiene el bloque email-capture insertado — correr primero scripts/seed-phase49-email-capture-post.ts.',
    )
  }

  return withBlock
}

async function verifyLocale(
  browser: Browser,
  locale: Locale,
  slug: string,
  categorySlug: string,
): Promise<void> {
  const path = localizeBlogPath(locale, blogPostPath(categorySlug, slug))
  const url = `${BASE_URL}${path}`
  const copy = COPY[locale]

  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle' })

    const heading = page.getByText(copy.heading, { exact: true })
    if (!(await heading.isVisible().catch(() => false))) {
      fail(`[${locale}] no se encontró el heading "${copy.heading}" en ${url}`)
    }

    const emailInput = page.getByLabel(copy.emailLabel)
    if (!(await emailInput.isVisible().catch(() => false))) {
      fail(`[${locale}] no se encontró el campo de email (label "${copy.emailLabel}") en ${url}`)
    }

    await emailInput.fill(TEST_EMAILS[locale])

    const [, ] = await Promise.all([
      page.waitForURL((u) => u.searchParams.has('subscribed'), { timeout: 15000 }),
      page.getByRole('button', { name: copy.submitLabel }).click(),
    ])

    const subscribedParam = new URL(page.url()).searchParams.get('subscribed')
    if (subscribedParam !== 'pending' && subscribedParam !== 'already') {
      fail(
        `[${locale}] tras enviar el formulario, ?subscribed=${subscribedParam} — esperaba "pending" o "already".`,
      )
    }

    const expectedStateHeading = subscribedParam === 'pending' ? copy.pendingHeading : copy.alreadyHeading
    const stateHeading = page.getByText(expectedStateHeading, { exact: true })
    if (!(await stateHeading.isVisible().catch(() => false))) {
      fail(
        `[${locale}] tras el redirect a ?subscribed=${subscribedParam}, no se encontró el heading de estado "${expectedStateHeading}".`,
      )
    }

    const formStillVisible = await page
      .locator('#email-capture-email')
      .isVisible()
      .catch(() => false)
    if (formStillVisible) {
      fail(`[${locale}] el formulario sigue visible después del submit — no hubo swap de estado real.`)
    }

    console.log(
      `  [${locale}] OK — subscribed=${subscribedParam}, heading de estado "${expectedStateHeading}" visible, formulario reemplazado.`,
    )
  } finally {
    await page.close()
  }
}

/**
 * Limpia únicamente los 2 suscriptores de prueba que este script crea —
 * nunca toca los docs `lead-magnets` reales ni los suscriptores de prueba de
 * otros scripts (dominios/emails distintos, ver TEST_EMAILS arriba).
 */
async function cleanup(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  for (const email of Object.values(TEST_EMAILS)) {
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
  const payload = await getPayload({ config })
  const post = await findSeededPost(payload)

  if (!post.slug) {
    fail(`El post con el bloque email-capture (id=${post.id}) no tiene slug.`)
  }

  const categorySlug = resolvePrimaryCategorySlug(
    post.categories as Parameters<typeof resolvePrimaryCategorySlug>[0],
  )

  const browser = await chromium.launch()

  try {
    await verifyLocale(browser, 'es', post.slug, categorySlug)
    await verifyLocale(browser, 'en', post.slug, categorySlug)
  } finally {
    await browser.close()
  }

  await cleanup(payload)

  console.log('PASS')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
