'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { ArrowRight, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { Crumb } from '@/components/mui/Crumbs'
import { IconTile } from '@/components/mui/IconTile'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import type { CompareRow, IndexCard } from '@/lib/services-index-data'

type Props = {
  /** Migas de `buildTrail`, ya prefijadas por idioma. */
  crumbs: Crumb[]
  title: string
  lead?: string | null
  cards: IndexCard[]
  rows: CompareRow[]
  /** Destino del botón "Hablar con Juan": el ancla del cierre de la home. */
  contactHref: string
}

/**
 * Índice de servicios: PageHero, lista de tarjetas con enlace estirado y tabla
 * comparativa con desplazamiento horizontal accesible. No declara landmark
 * principal. El foco se dibuja en la tarjeta (`:has(a:focus-visible)`) y el
 * desplazamiento del hover se anula con `html[data-motion="paused"]`. El cierre
 * (CtaSection) lo pone el Server Component que usa esta vista.
 */
export function ServicesIndexView({ crumbs, title, lead, cards, rows, contactHref }: Props) {
  const t = useTranslations('services.index')

  return (
    <>
      <PageHero crumbs={crumbs} eyebrow={t('eyebrow')} title={title} lead={lead ?? undefined} />

      {cards.length > 0 && (
        <Box component="section" aria-label={t('listLabel')} sx={{ pb: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <UL
              role="list"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))' },
                gap: 2,
              }}
            >
              {cards.map((c) => (
                <Box key={c.slug} component="li" sx={{ display: 'grid' }}>
                  <Card
                    sx={{
                      position: 'relative',
                      p: { xs: 3, md: 4 },
                      display: 'grid',
                      gap: 2,
                      alignContent: 'start',
                      transition:
                        'transform var(--jt-motion-slow, 500ms), border-color var(--jt-motion-slow, 500ms)',
                      '&:hover': { borderColor: 'text.primary', transform: 'translateY(-4px)' },
                      'html[data-motion="paused"] &:hover': { transform: 'none' },
                      '&:has(a:focus-visible)': {
                        outline: '2px solid var(--jt-palette-accentText)',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    <IconTile name={c.icon} />
                    <Typography variant="h5" component="h2">
                      <Link
                        component={linkFor(c.href)}
                        href={c.href}
                        underline="none"
                        sx={{
                          color: 'text.primary',
                          '&:focus-visible': { outline: 'none' },
                          '&::after': { content: '""', position: 'absolute', inset: 0 },
                        }}
                      >
                        {c.title}
                      </Link>
                    </Typography>
                    {c.description && (
                      <Typography variant="body1" color="text.secondary">
                        {c.description}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        mt: 1,
                        pt: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                      }}
                    >
                      {c.timeline ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
                        >
                          <Clock size={16} aria-hidden="true" />
                          {c.timeline}
                        </Typography>
                      ) : (
                        <span />
                      )}
                      <Typography
                        variant="body2"
                        aria-hidden="true"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'accentText', fontWeight: 600 }}
                      >
                        {t('viewService')}
                        <ArrowRight size={16} />
                      </Typography>
                    </Box>
                  </Card>
                </Box>
              ))}
            </UL>
          </Container>
        </Box>
      )}

      <Box component="section" aria-labelledby="comparar-t" sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography id="comparar-t" variant="h3" component="h2" sx={{ mb: 4 }}>
            {t('compareTitle')}
          </Typography>

          {rows.length > 0 && (
            <TableContainer
              tabIndex={0}
              role="region"
              aria-label={t('compareLabel')}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell scope="col">{t('columns.service')}</TableCell>
                    <TableCell scope="col">{t('columns.fitsIf')}</TableCell>
                    <TableCell scope="col">{t('columns.outcome')}</TableCell>
                    <TableCell scope="col">{t('columns.time')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.slug}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 600, minWidth: 200 }}>
                        <Link
                          component={linkFor(r.href)}
                          href={r.href}
                          underline="hover"
                          sx={{ color: 'text.primary' }}
                        >
                          {r.title}
                        </Link>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>{r.fitsIf}</TableCell>
                      <TableCell sx={{ minWidth: 280 }}>{r.achieves}</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>{r.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box
            sx={{
              mt: 6,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              p: 4,
              borderRadius: 2,
              bgcolor: 'raised',
            }}
          >
            <Typography variant="h6" component="p" sx={{ maxWidth: 620 }}>
              {t('unsure')}
            </Typography>
            <Button component={linkFor(contactHref)} href={contactHref} variant="contained" size="large">
              {t('talkCta')}
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  )
}
