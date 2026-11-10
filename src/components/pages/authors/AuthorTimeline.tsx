'use client'

import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { visuallyHidden } from '@/components/mui/ScoreRing'
import type { AuthorTimelineItem } from '@/lib/authors-data'

type Props = {
  items: AuthorTimelineItem[]
  /** Nombre accesible de la lista, ya traducido (experiencia o educacion). */
  label: string
}

/**
 * Linea de tiempo de experiencia y educacion del perfil, con el patron de
 * AboutView (fase 54): `Timeline` de @mui/lab, que emite `ul` con un `li` por
 * etapa. El separador (punto y conector) es decorativo y va en aria-hidden; la
 * fecha vive DENTRO del contenido de cada item, y cada etapa abre con un h3.
 *
 * El punto de una etapa en curso se distingue por color Y por texto: el rango
 * de fechas dice "a hoy" y un texto visible solo para lectores de pantalla
 * anuncia "En curso". `role="list"` se declara a mano porque la lista no
 * muestra viñetas y VoiceOver en Safari deja de anunciarla.
 *
 * `overflowWrap: 'anywhere'` en el contenido: la descripcion que viene del CMS
 * puede traer una URL pegada (medido en vivo: "Mas info: https://www.aprendoclub.com/diplomado"
 * ensanchaba la pagina a 358 px en 320 px) y sin espacios no hay donde partir la linea.
 *
 * Sin items no pinta nada: la seccion que la contiene tampoco pinta encabezado.
 */
export function AuthorTimeline({ items, label }: Props) {
  const t = useTranslations('authors.profile')
  if (items.length === 0) return null

  return (
    <Timeline
      position="right"
      role="list"
      aria-label={label}
      sx={{
        p: 0,
        m: 0,
        maxWidth: 860,
        [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 },
      }}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1
        const dates = item.dates
        const dateLine = dates
          ? dates.to
            ? t('dateRange', { from: dates.from, to: dates.to })
            : t('dateRangeOpen', { from: dates.from })
          : null
        return (
          <TimelineItem key={`${i}-${item.org ?? ''}-${item.title}`}>
            <TimelineSeparator aria-hidden="true">
              <TimelineDot
                data-current={item.current ? 'true' : 'false'}
                sx={{
                  m: '6px 0',
                  boxShadow: 'none',
                  ...(item.current
                    ? { bgcolor: 'primary.main', borderColor: 'primary.main' }
                    : { bgcolor: 'background.default', border: '3px solid', borderColor: 'divider' }),
                }}
              />
              {!last && <TimelineConnector sx={{ bgcolor: 'divider' }} />}
            </TimelineSeparator>
            <TimelineContent sx={{ pt: 0, pb: last ? 0 : 5, pl: 3, minWidth: 0, overflowWrap: 'anywhere' }}>
              {dateLine && (
                <Typography
                  variant="overline"
                  sx={{ color: item.current ? 'accentText' : 'text.secondary', display: 'block' }}
                >
                  {dateLine}
                </Typography>
              )}
              <Typography variant="h5" component="h3">
                {item.title}
                {item.current && (
                  <Box component="span" sx={visuallyHidden}>
                    {' '}
                    ({t('current')})
                  </Box>
                )}
              </Typography>
              {item.org && (
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {item.org}
                </Typography>
              )}
              {item.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
                  {item.description}
                </Typography>
              )}
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
