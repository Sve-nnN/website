import { Mail, Phone, MapPin, Link2, Code2 } from 'lucide-react'

import type { ContactFormBlock as ContactFormBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
  } = props

  return (
    <Container className="py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          {eyebrow && <p className="text-label text-primary">{eyebrow}</p>}
          <h2 className="font-display text-heading mt-1">{title}</h2>
          {description && <p className="mt-3 text-body text-muted-foreground">{description}</p>}

          <form action={onSubmit} className="mt-8 space-y-4">
            <Input name="name" placeholder="Name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Textarea name="message" placeholder="Message" required rows={5} />
            <Button type="submit">{submitLabel}</Button>
          </form>
        </div>

        <div className="bg-secondary text-secondary-foreground rounded-lg p-8">
          {sidebarTitle && <h3 className="font-display text-heading">{sidebarTitle}</h3>}
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
                <li key={i}>
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
    </Container>
  )
}
