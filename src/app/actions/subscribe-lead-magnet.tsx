'use server'

import { randomBytes } from 'crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { render } from '@react-email/render'
import { getPayload } from 'payload'

import config from '@payload-config'
import { ConfirmLeadMagnet } from '@/emails/ConfirmLeadMagnet'
import { resolveSiteUrl } from '@/lib/resolve-site-url'
import { isResendConfigured } from '@/lib/resend-configured'
import { mintDownloadToken } from '@/lib/download-token'

/**
 * Alta al lead magnet (Phase 49-01) — Server Action NUEVA, separada de
 * `subscribeAction` (`src/app/actions/subscribe.tsx`). Comparte la colección
 * `subscribers` y el patrón de token/doble opt-in, pero NUNCA toca el
 * FormData ni los redirects de `subscribeAction` — esa acción sigue siendo
 * exclusiva del newsletter del blog (49-CONTEXT.md, RESEARCH.md Open
 * Question 1).
 *
 * Zero client JS: pensada para `<form action={subscribeToLeadMagnetAction}>`
 * (patrón ya probado por `ContactFormBlockComponent`/`sendContactMessage`),
 * por eso redirige con `redirect()` de `next/navigation` en vez de devolver
 * un estado a `useActionState` como hace `subscribeAction`.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mismo mecanismo y misma ventana que subscribe.tsx/contact.ts: proceso Node
// persistente en Dokploy, un Map de módulo sobrevive entre requests.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const submissionLog = new Map<string, number[]>()

async function isRateLimited(): Promise<boolean> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  const clientIp = forwardedFor?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown'

  const now = Date.now()
  const recent = (submissionLog.get(clientIp) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX) {
    submissionLog.set(clientIp, recent)
    return true
  }

  recent.push(now)
  submissionLog.set(clientIp, recent)
  return false
}

const SUBJECT = {
  es: 'Confirma tu correo para descargar el checklist',
  en: 'Confirm your email to download the checklist',
}

function relationId(value: number | { id: number } | null | undefined): number | null {
  if (value == null) return null
  return typeof value === 'number' ? value : value.id
}

export async function subscribeToLeadMagnetAction(formData: FormData): Promise<void> {
  const postPath = String(formData.get('postPath') ?? '/blog')
  const locale = String(formData.get('locale') ?? 'es') === 'en' ? 'en' : 'es'

  // Honeypot: lo llenan los bots que completan todos los campos. Se descarta
  // en silencio y se redirige como si hubiera funcionado, mismo patrón que
  // contact.ts/subscribe.tsx.
  if (formData.get('company_website')) {
    redirect(`${postPath}?subscribed=pending`)
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  // 49-UI-SPEC.md no define un estado "invalid" separado para este bloque —
  // un email inválido colapsa en el mismo `?subscribed=error` que cualquier
  // otro fallo, a diferencia de `subscribeAction` que sí distingue `invalid`.
  if (!EMAIL_PATTERN.test(email)) {
    redirect(`${postPath}?subscribed=error`)
  }

  if (await isRateLimited()) {
    redirect(`${postPath}?subscribed=error`)
  }

  // `redirect()` throws internamente (NEXT_REDIRECT) — todo el trabajo de
  // escritura/envío queda en el try/catch de abajo, pero el `redirect()` real
  // se llama UNA sola vez, al final, afuera del try/catch (mismo criterio que
  // `sendContactMessage` en contact.ts: así un redirect exitoso nunca se
  // confunde con un fallo).
  let target = `${postPath}?subscribed=error`

  try {
    const payload = await getPayload({ config })

    const { docs: leadMagnets } = await payload.find({
      collection: 'lead-magnets',
      where: { locale: { equals: locale } },
      limit: 1,
    })

    const leadMagnet = leadMagnets[0]

    if (!leadMagnet) {
      // No debería pasar tras Task 1 de este mismo plan (2 docs reales
      // es/en) — si pasa, es una desconfiguración del admin, no un bug del
      // visitante.
      console.error(`No hay lead-magnets configurado para el locale "${locale}".`)
    } else {
      const { docs: existing } = await payload.find({
        collection: 'subscribers',
        where: { email: { equals: email } },
        limit: 1,
      })

      const current = existing[0]

      const alreadyHasThisMagnet =
        current?.status === 'confirmed' &&
        current?.optInReason === 'lead-magnet' &&
        relationId(current.leadMagnet) === leadMagnet.id

      if (alreadyHasThisMagnet) {
        // T-49-02 (accept): revela únicamente que este correo ya optó por
        // ESTE lead magnet, nunca lo muestra en pantalla. No se escribe ni
        // se reenvía nada — igual que `subscribeAction` con un `confirmed`.
        target = `${postPath}?subscribed=already`
      } else {
        const token = randomBytes(32).toString('hex')
        const resendReady = isResendConfigured()
        const nowIso = new Date().toISOString()

        let subscriberId: number

        if (current) {
          // Cualquier otro caso (nuevo pending reenviando, solo-newsletter
          // sumando el magnet, o reactivando desde `unsubscribed`) arranca de
          // cero: las fechas/estado de un ciclo anterior no describen este
          // alta, mismo criterio que `subscribeAction` ya aplica.
          const updated = await payload.update({
            collection: 'subscribers',
            id: current.id,
            data: {
              optInReason: 'lead-magnet',
              leadMagnet: leadMagnet.id,
              source: postPath,
              locale,
              token,
              status: resendReady ? 'pending' : 'confirmed',
              confirmedAt: resendReady ? null : nowIso,
              unsubscribedAt: null,
            },
          })
          subscriberId = updated.id
        } else {
          const created = await payload.create({
            collection: 'subscribers',
            data: {
              email,
              optInReason: 'lead-magnet',
              leadMagnet: leadMagnet.id,
              source: postPath,
              locale,
              token,
              status: resendReady ? 'pending' : 'confirmed',
              confirmedAt: resendReady ? nowIso : null,
            },
          })
          subscriberId = created.id
        }

        if (resendReady) {
          const siteUrl = await resolveSiteUrl()

          if (!siteUrl) {
            console.error('No hay host público para armar el enlace de confirmación del lead magnet.')
          } else {
            const confirmUrl = `${siteUrl.replace(/\/$/, '')}/api/newsletter/confirm?token=${token}`
            const template = <ConfirmLeadMagnet confirmUrl={confirmUrl} locale={locale} />

            await payload.sendEmail({
              to: email,
              subject: SUBJECT[locale],
              html: await render(template),
              text: await render(template, { plainText: true }),
            })

            target = `${postPath}?subscribed=pending`
          }
        } else {
          // MAIL-04: sin RESEND_API_KEY real, el suscriptor queda `confirmed`
          // de una y el magnet se entrega EN ESTE MISMO request — nunca
          // queda `pending` sin ninguna forma posible de confirmar.
          void subscriberId
          const downloadToken = mintDownloadToken(leadMagnet.id)
          target = `${locale === 'en' ? '/en' : ''}/blog/confirm?token=${downloadToken}`
        }
      }
    }
  } catch (err) {
    // El correo/la fila pudieron quedar a medio escribir si el envío falla
    // después de guardar. Se redirige a error igual: sin confirmación
    // posible, el alta no ocurrió desde la perspectiva del visitante.
    console.error('Falló el alta al lead magnet:', err)
    target = `${postPath}?subscribed=error`
  }

  redirect(target)
}
