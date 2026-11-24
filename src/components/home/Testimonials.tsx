'use client'

import { useTranslations } from 'next-intl'

import { Section } from '@/components/mui/Section'
import { TestimonialCards, type TestimonialItem } from '@/components/mui/TestimonialCards'
import type { HomeTestimonials } from '@/lib/home-data-b'

/**
 * Testimonios reales de la coleccion: cero no renderiza la seccion, uno es una
 * tarjeta de 760px y nunca hay ranuras de muestra. El rol se arma con la
 * plantilla `home.testimonials.roleAt` cuando hay rol y empresa.
 */
export function Testimonials({ testimonials }: { testimonials: HomeTestimonials }) {
  const t = useTranslations('home')
  if (testimonials.items.length === 0) return null

  const items: TestimonialItem[] = testimonials.items.map((item) => ({
    id: item.id,
    quote: item.quote,
    name: item.name,
    role:
      item.role && item.company ? t('testimonials.roleAt', { role: item.role, company: item.company }) : (item.role ?? item.company),
  }))

  return (
    <Section id="testimonios" band title={testimonials.title}>
      <TestimonialCards items={items} />
    </Section>
  )
}
