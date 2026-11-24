'use client'

import Typography from '@mui/material/Typography'

import { FaqAccordion, type FaqItem } from '@/components/mui/FaqAccordion'
import { Section } from '@/components/mui/Section'
import type { HomeFaq } from '@/lib/home-data-b'

/**
 * Preguntas frecuentes de la home: la misma lista que usa Contacto
 * (`home-page.faq`). El texto de los paneles cerrados queda en el HTML servido.
 * Sin items no se renderiza.
 */
export function Faq({ faq }: { faq: HomeFaq }) {
  if (faq.items.length === 0) return null

  const items: FaqItem[] = faq.items.map((it) => ({
    question: it.question,
    answer: (
      <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: '1.5rem' }}>
        {it.answer}
      </Typography>
    ),
  }))

  return (
    <Section id="faq" py title={faq.title}>
      <FaqAccordion idPrefix="faq" items={items} />
    </Section>
  )
}
