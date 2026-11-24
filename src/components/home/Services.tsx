'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { FaqAccordion, type FaqItem } from '@/components/mui/FaqAccordion'
import { IconTile } from '@/components/mui/IconTile'
import { linkFor } from '@/components/mui/links'
import { Section } from '@/components/mui/Section'
import { TechChips } from '@/components/mui/TechChips'
import type { HomeServices } from '@/lib/home-data'
import { buildServiceHref } from '@/lib/service-slugs'

type Props = {
  services: HomeServices
  locale: 'es' | 'en'
}

const CONTACT_HREF = '#contacto'

/**
 * Servicios: columna izquierda fija (sticky desde md) con titulo, lead y CTA, y
 * a la derecha un acordeon con un panel abierto a la vez y el primero abierto.
 * El texto de los paneles cerrados queda en el HTML servido. "Ver servicio"
 * solo aparece si el item trae pagina, y su destino sale de buildServiceHref.
 * Sin items no se renderiza.
 */
export function Services({ services, locale }: Props) {
  const t = useTranslations('common')
  if (services.items.length === 0) return null

  const items: FaqItem[] = services.items.map((s) => ({
    question: s.title,
    adornment: s.icon ? <IconTile name={s.icon} /> : undefined,
    answer: (
      // 64px a la izquierda: alinea el detalle con el titulo, a la derecha del icono de 40px mas el hueco de 16px y el relleno del resumen.
      <Box sx={{ display: 'grid', gap: 2, pl: 8 }}>
        {s.body && (
          <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: '1.5rem' }}>
            {s.body}
          </Typography>
        )}
        {s.tags.length > 0 && <TechChips items={s.tags} label={t('topicsLabel')} />}
        {s.servicePage && (
          <Button
            component={linkFor(buildServiceHref(locale, s.servicePage))}
            href={buildServiceHref(locale, s.servicePage)}
            variant="text"
            size="small"
            sx={{ justifySelf: 'start', px: 0 }}
          >
            {t('seeService')}
          </Button>
        )}
      </Box>
    ),
  }))

  return (
    <Section id="servicios" labelledBy="servicios-t">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,5fr) minmax(0,7fr)' },
          gap: { xs: 5, md: 8 },
          alignItems: 'start',
        }}
      >
        <Box
          sx={{
            position: { md: 'sticky' },
            top: { md: 112 },
            maxHeight: { md: 'calc(100vh - 144px)' },
            display: 'grid',
            gap: 3,
            justifyItems: 'start',
          }}
        >
          <Typography id="servicios-t" variant="h3" component="h2">
            {services.title}
          </Typography>
          {services.lead && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '1.25rem', lineHeight: '1.875rem' }}
            >
              {services.lead}
            </Typography>
          )}
          {services.ctaLabel && (
            <Button component={linkFor(CONTACT_HREF)} href={CONTACT_HREF} variant="outlined">
              {services.ctaLabel}
            </Button>
          )}
        </Box>
        <FaqAccordion idPrefix="srv" items={items} />
      </Box>
    </Section>
  )
}
