import { Mail, Phone, MapPin, Link2, Code2 } from 'lucide-react'

import type { ContactFormBlock as ContactFormBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HeroGrainGradient } from '@/components/HeroGrainGradient'

// lucide-react no longer ships brand icons (linkedin/github removed) —
// Link2/Code2 are the closest generic-icon substitutes.
const iconMap = {
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
  linkedin: Link2,
  github: Code2,
}

interface ContactFormComponentProps extends ContactFormBlockProps {
  // 05-12 supplies the real Resend-backed server action; this component only
  // renders markup/copy from the block config, never invents a submit path.
  onSubmit?: (formData: FormData) => Promise<void>
  locale?: string
  // 'true' | 'false' | undefined — set by the contact page from ?sent=
  // search param after the server action redirects back.
  sent?: string
  // Sourced from CONTACT_TO_EMAIL by the calling page — the UI-SPEC error
  // copy's example address is illustrative only, never hardcoded here.
  contactEmail?: string
}

export function ContactFormBlockComponent(props: ContactFormComponentProps) {
  const {
    eyebrow,
    title,
    description,
    submitLabel,
    sidebarTitle,
    sidebarDescription,
    socialProofText,
    contactInfo,
    onSubmit = async () => {},
    locale,
    sent,
    contactEmail,
  } = props

  const isEs = locale === 'es'
  const successMessage = isEs
    ? '¡Gracias! Tu mensaje fue enviado correctamente.'
    : 'Thanks! Your message was sent successfully.'
  const errorMessage = isEs
    ? `Algo salió mal al enviar tu mensaje. Intenta de nuevo${contactEmail ? `, o escribe directamente a ${contactEmail}` : ''}.`
    : `Something went wrong sending your message. Please try again${contactEmail ? `, or email ${contactEmail} directly` : ''}.`

  const fieldLabels = isEs
    ? { name: 'Nombre', email: 'Correo electrónico', message: 'Mensaje' }
    : { name: 'Name', email: 'Email', message: 'Message' }

  return (
    <Container id="contact" className="py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          {/* POLISH: AA contrast — `text-primary` (#F7581E) is 3.15:1 on the
              light background; `text-primary-text` (#D03D07) is 4.61:1. */}
          {eyebrow && <p className="text-label text-primary-text">{eyebrow}</p>}
          <h2 className="font-heading text-heading mt-1">{title}</h2>
          {description && <p className="mt-3 text-body text-muted-foreground">{description}</p>}

          {/* Success state carries task-critical information, so it needs the
              AA-safe variant even more than the eyebrow does. */}
          {sent === 'true' && <p className="mt-4 text-body text-primary-text">{successMessage}</p>}
          {sent === 'false' && <p className="mt-4 text-body text-destructive">{errorMessage}</p>}

          <form action={onSubmit} className="mt-8 space-y-4">
            <input type="hidden" name="locale" value={locale} />
            {/* Honeypot: hidden from real users via CSS, bots that fill every
                field will populate it — dropped silently by the server action. */}
            <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
              <label htmlFor="company_website">Company website</label>
              <input type="text" id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
            </div>
            {/* SEO-11.4: los tres campos estaban rotulados en ingles en las dos
                versiones del sitio, y el rotulo era un `placeholder`, que
                desaparece al escribir y no lo lee todo lector de pantalla como
                nombre accesible. Ahora cada campo lleva su `<label>` visible
                asociado por `htmlFor`/`id`, en el idioma de la pagina. */}
            <div className="space-y-1">
              <label htmlFor="contact-name" className="block text-label">
                {fieldLabels.name}
              </label>
              <Input id="contact-name" name="name" autoComplete="name" required />
            </div>
            <div className="space-y-1">
              <label htmlFor="contact-email" className="block text-label">
                {fieldLabels.email}
              </label>
              <Input id="contact-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-1">
              <label htmlFor="contact-message" className="block text-label">
                {fieldLabels.message}
              </label>
              <Textarea id="contact-message" name="message" required rows={5} />
            </div>
            <Button type="submit">{submitLabel}</Button>
          </form>
        </div>

        {/* POLISH (35, .pen ContactForm Sidebar): .pen models a 16px corner
            radius on this CTA-styled sidebar panel, matching the same
            `rounded-2xl` already used by the sibling CallToAction block
            (same HeroGrainGradient `cta` variant) — plain `rounded-lg` (8px,
            the base --radius token) undersold the panel's CTA-like styling. */}
        <div className="relative overflow-hidden rounded-2xl">
          <HeroGrainGradient variant="cta" />
          <div className="absolute inset-0 bg-black/25" aria-hidden="true" />
          <div className="relative z-10 text-secondary-foreground p-8">
            {sidebarTitle && <h3 className="font-heading text-heading">{sidebarTitle}</h3>}
            {sidebarDescription && <p className="mt-3 text-body opacity-90">{sidebarDescription}</p>}

            <ul className="mt-6 space-y-4">
              {contactInfo?.map((info, i) => {
                const Icon = iconMap[info.icon as keyof typeof iconMap] ?? Mail
                const content = (
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 text-primary" />
                    <div>
                      <p className="text-label">{info.title}</p>
                      <p className="text-body">{info.value}</p>
                    </div>
                  </div>
                )

                return (
                  <li key={info.id ?? i}>
                    {info.href ? (
                      <a href={info.href} className="hover:opacity-80">
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                )
              })}
            </ul>

            {socialProofText && <p className="mt-8 text-label opacity-80">{socialProofText}</p>}
          </div>
        </div>
      </div>
    </Container>
  )
}
