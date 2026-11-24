'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { IconTile } from '@/components/mui/IconTile'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import type { OtherService } from '@/lib/service-view-data'

/**
 * Otros servicios: h2 en variante h4 y una lista de tarjetas con icono, h3 con
 * enlace estirado y la duracion. El foco se dibuja en la tarjeta
 * (`:has(a:focus-visible)`); el desplazamiento del hover se anula con
 * `html[data-motion="paused"]`. Sin servicios no se monta.
 */
export function OtherServices({ items }: { items: OtherService[] }) {
  const t = useTranslations('services.detail')
  if (items.length === 0) return null
  return (
    <Box component="section" aria-labelledby="otros-t" sx={{ pb: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography id="otros-t" variant="h4" component="h2" sx={{ mb: 3 }}>
          {t('otherTitle')}
        </Typography>
        <UL
          role="list"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(3, minmax(0,1fr))' },
            gap: 2,
          }}
        >
          {items.map((o) => (
            <Box key={o.slug} component="li" sx={{ display: 'grid' }}>
              <Card
                sx={{
                  position: 'relative',
                  p: 3,
                  display: 'grid',
                  gap: 1.5,
                  alignContent: 'start',
                  transition: 'transform var(--jt-motion-slow, 500ms), border-color var(--jt-motion-slow, 500ms)',
                  '&:hover': { borderColor: 'text.primary', transform: 'translateY(-4px)' },
                  'html[data-motion="paused"] &:hover': { transform: 'none' },
                  '&:has(a:focus-visible)': {
                    outline: '2px solid var(--jt-palette-accentText)',
                    outlineOffset: '2px',
                  },
                }}
              >
                <IconTile name={o.icon} />
                <Typography variant="h6" component="h3">
                  <Link
                    component={linkFor(o.href)}
                    href={o.href}
                    underline="none"
                    sx={{
                      color: 'text.primary',
                      '&:focus-visible': { outline: 'none' },
                      '&::after': { content: '""', position: 'absolute', inset: 0 },
                    }}
                  >
                    {o.title}
                  </Link>
                </Typography>
                {o.duration && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <Clock size={16} aria-hidden="true" />
                    <Typography variant="body2" color="text.secondary">
                      {`${t('durationLabel')}: ${o.duration}`}
                    </Typography>
                  </Box>
                )}
              </Card>
            </Box>
          ))}
        </UL>
      </Container>
    </Box>
  )
}
