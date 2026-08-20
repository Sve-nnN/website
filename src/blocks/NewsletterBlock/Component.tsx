import { getLocale } from 'next-intl/server'

import type { NewsletterBlockType } from '@/payload-types'

import { Container } from '@/components/Container'
import { GrainTexture } from '@/components/GrainTexture'
import { NewsletterForm } from '@/blocks/NewsletterBlock/NewsletterForm'

/**
 * Franja de captura de email, pensada para intercalarse entre dos filas del
 * índice del blog.
 *
 * Va sobre navy porque tiene que leerse como una pausa dentro del listado, no
 * como una card más grande. Es una banda, no una tarjeta: apilar una card
 * gigante entre grillas de cards deja cards dentro de cards.
 */
interface NewsletterBlockComponentProps extends NewsletterBlockType {
  /**
   * `?newsletter=confirmed|unsubscribed`, que es a donde vuelven los enlaces
   * del correo. Llega como sharedProp desde la página porque un bloque no ve
   * los searchParams del request.
   */
  newsletterState?: string
}

const NOTICE = {
  es: {
    confirmed: 'Listo, tu correo quedó confirmado. Vas a recibir los artículos nuevos.',
    unsubscribed: 'Te diste de baja. No vas a recibir más correos míos.',
    invalid: 'Ese enlace ya no sirve. Si querías suscribirte, deja tu correo otra vez acá abajo.',
  },
  en: {
    confirmed: 'Confirmed. You will get new articles from now on.',
    unsubscribed: 'You are unsubscribed. No more emails from me.',
    invalid: 'That link is no longer valid. If you wanted to subscribe, leave your email again below.',
  },
}

export async function NewsletterBlockComponent(props: NewsletterBlockComponentProps) {
  const { title, description, emailLabel, submitLabel, consentText, newsletterState } = props
  const locale = (await getLocale()) as 'es' | 'en'
  const notice =
    newsletterState === 'confirmed' ||
    newsletterState === 'unsubscribed' ||
    newsletterState === 'invalid'
      ? NOTICE[locale][newsletterState]
      : null

  return (
    <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
      <GrainTexture />
      <Container className="relative z-10 py-12 md:py-16">
        <div className="max-w-2xl">
          <h2 className="font-heading text-heading tracking-tight text-balance">{title}</h2>
          {description && <p className="mt-3 max-w-[60ch] text-body opacity-85">{description}</p>}
          {/* El aviso reemplaza al formulario: quien vuelve del correo ya hizo
              lo que este bloque pide, y volver a mostrarle el campo vacío es
              pedirle dos veces lo mismo. */}
          {notice && (
            <p role="status" className="mt-6 text-body text-primary">
              {notice}
            </p>
          )}
          {newsletterState === 'confirmed' || newsletterState === 'unsubscribed' ? null : (
          <NewsletterForm
            locale={locale}
            emailLabel={emailLabel ?? (locale === 'en' ? 'Your email' : 'Tu correo')}
            submitLabel={submitLabel ?? (locale === 'en' ? 'Subscribe' : 'Suscribirme')}
            consentText={consentText}
          />
          )}
        </div>
      </Container>
    </section>
  )
}
