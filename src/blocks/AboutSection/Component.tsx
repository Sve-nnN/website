import Image from 'next/image'
import { Code } from 'lucide-react'

import type { AboutSectionBlock as AboutSectionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { Button } from '@/components/ui/button'
import { ICON_OPTIONS } from '@/fields/IconPicker/icons'

// Derived directly from ICON_OPTIONS (single source of truth shared with the
// admin IconPickerField) so every icon offered in the admin picker actually
// renders on the frontend — no hand-maintained subset to drift out of sync.
// `Code` remains the safe fallback for any unrecognized/legacy value.
const iconMap = Object.fromEntries(ICON_OPTIONS.map((o) => [o.value, o.Icon]))

export function AboutSectionComponent(props: AboutSectionBlockProps) {
  const { eyebrow, title, paragraphs, photo, features, ctaText, ctaLink } = props

  const photoDoc = typeof photo === 'object' ? photo : null

  return (
    <Container className="py-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className={photoDoc?.url ? 'md:col-span-7' : 'md:col-span-12'}>
          {eyebrow && (
            <p className="text-label uppercase tracking-wide text-primary mb-2">{eyebrow}</p>
          )}
          <h2 className="font-heading text-heading">{title}</h2>
          <div className="mt-4 space-y-4">
            {paragraphs?.map((paragraph, i) => (
              <p key={paragraph.id ?? i} className="text-body text-muted-foreground">
                {paragraph.text}
              </p>
            ))}
          </div>
        </div>
        {photoDoc?.url && (
          <div className="md:col-span-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={photoDoc.url}
                alt={photoDoc.alt ?? title ?? ''}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
      {features && features.length > 0 && (
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((item, i) => {
            const Icon = iconMap[item.icon] ?? Code
            return (
              <div key={item.id ?? i} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-heading text-body font-semibold">{item.title}</p>
                  <p className="mt-1 text-body text-muted-foreground">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {ctaText && ctaLink && (
        <div className="mt-8">
          <Button asChild>
            <a href={ctaLink}>{ctaText}</a>
          </Button>
        </div>
      )}
    </Container>
  )
}
