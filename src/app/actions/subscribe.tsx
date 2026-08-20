'use server'

import { randomBytes } from 'crypto'
import { headers } from 'next/headers'
import { render } from '@react-email/render'
import { getPayload } from 'payload'

import config from '@payload-config'
import { ConfirmSubscription } from '@/emails/ConfirmSubscription'

/**
 * Alta al correo del blog, con doble opt-in real.
 *
 * El correo NO queda dado de alta al enviar el formulario: queda `pending` y se
 * le manda un enlace de confirmación. Es lo que corresponde legalmente en la
 * UE, y además protege de que alguien anote la dirección de otro.
 *
 * Nunca dice si un correo ya estaba en la lista. Responder "ya estás suscrito"
 * convierte el formulario en un oráculo que confirma si una dirección existe en
 * la base, y eso es exactamente lo que se usa para enumerar correos. Un alta
 * repetida reenvía la confirmación y responde igual que un alta nueva.
 */

export type SubscribeState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'invalid' }
  | { status: 'error' }
  | { status: 'unconfigured' }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mismo mecanismo que el formulario de contacto: proceso Node persistente en
// Dokploy, así que un Map de módulo sobrevive entre requests. Ver el comentario
// largo en src/app/actions/contact.ts sobre por qué esto NO es el bug que
// react-doctor cree ver.
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
  es: 'Confirma tu correo para recibir el blog',
  en: 'Confirm your email to get the blog',
}

export async function subscribeAction(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  // Honeypot: lo llenan los bots que completan todos los campos. Se descarta en
  // silencio y se responde éxito, para no darle señal al bot.
  if (formData.get('company_website')) return { status: 'success' }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const locale = String(formData.get('locale') ?? 'es') === 'en' ? 'en' : 'es'
  const source = String(formData.get('source') ?? '').slice(0, 200)

  if (!EMAIL_PATTERN.test(email)) return { status: 'invalid' }

  // Sin URL pública no se puede armar el enlace de confirmación, y mandar un
  // correo con un enlace roto es peor que no mandarlo.
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL

  if (!siteUrl) {
    console.error('NEXT_PUBLIC_SERVER_URL no está seteada — no se puede armar el enlace de confirmación.')
    return { status: 'unconfigured' }
  }

  if (await isRateLimited()) return { status: 'error' }

  try {
    const payload = await getPayload({ config })
    const token = randomBytes(32).toString('hex')

    const { docs: existing } = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
      limit: 1,
    })

    const current = existing[0]

    if (current?.status === 'confirmed') {
      // Ya estaba confirmado. No se reenvía nada y se responde igual que un
      // alta nueva: la respuesta no puede revelar quién está en la lista.
      return { status: 'success' }
    }

    if (current) {
      await payload.update({
        collection: 'subscribers',
        id: current.id,
        // Un alta nueva sobre alguien que se había dado de baja arranca de cero:
        // las fechas viejas describen un ciclo anterior que ya terminó.
        data: {
          status: 'pending',
          token,
          locale,
          source: source || current.source,
          confirmedAt: null,
          unsubscribedAt: null,
        },
      })
    } else {
      await payload.create({
        collection: 'subscribers',
        data: { email, status: 'pending', token, locale, source },
      })
    }

    const confirmUrl = `${siteUrl.replace(/\/$/, '')}/api/newsletter/confirm?token=${token}`
    const template = <ConfirmSubscription confirmUrl={confirmUrl} locale={locale} />

    // La versión en texto plano sale de la MISMA plantilla, no de un string
    // aparte: dos copias del mismo correo divergen a la primera edición, y el
    // texto plano es lo que ven los clientes que bloquean HTML y varios filtros
    // de spam. Un correo sin `text` puntúa peor.
    await payload.sendEmail({
      to: email,
      subject: SUBJECT[locale],
      html: await render(template),
      text: await render(template, { plainText: true }),
    })

    return { status: 'success' }
  } catch (err) {
    // El correo pudo quedar guardado como `pending` aunque el envío falle. Se
    // responde error igual: para quien se suscribe, sin correo de confirmación
    // el alta no ocurrió.
    console.error('Falló el alta al correo del blog:', err)
    return { status: 'error' }
  }
}
