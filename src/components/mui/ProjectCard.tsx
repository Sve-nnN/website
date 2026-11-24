'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import type { WebsiteIndexItem } from '@/lib/websites-data'

import { formatLongDateUtc } from './format-date'
import { linkFor } from './links'
import { UL } from './lists'
import { ScoreRing } from './ScoreRing'
import { TechChips } from './TechChips'

export const RING_KEYS = ['performance', 'accessibility', 'bestPractices', 'seo'] as const

/** Las claves de los puntajes que traen un numero, en el orden de los anillos. */
export function ringsWithValue(scores: WebsiteIndexItem['scores']): Array<(typeof RING_KEYS)[number]> {
  return RING_KEYS.filter((k) => typeof scores[k] === 'number')
}

/**
 * Tarjeta de proyecto portada del sandbox: captura de escritorio recortada
 * 16:10, titulo (h3) con enlace estirado, tagline, industria y anio, cuatro
 * anillos de puntaje y stack. El foco se dibuja en la tarjeta con
 * `:has(a:focus-visible)`.
 *
 * Los puntajes son los reales de Payload: un anillo con puntaje null se omite y,
 * cuando los cuatro son null, tambien la lista y la nota. La nota usa la fecha
 * de `lighthouseCapturedAt` y no afirma el dispositivo (Payload no lo guarda).
 */
export function ProjectCard({ item }: { item: WebsiteIndexItem }) {
  const t = useTranslations('websites.index')
  const locale = useLocale()
  const href = `/websites/${item.slug}`
  const rings = ringsWithValue(item.scores)
  const date = formatLongDateUtc(item.scoresDate, locale)
  const image = item.image
  const alt = image?.alt ?? t('screenshotAlt', { domain: item.domain ?? item.title })
  const meta = [item.industry, item.year ? String(item.year) : null].filter(Boolean).join(' · ')

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        transition: 'transform 500ms cubic-bezier(0.22,1,0.36,1), border-color 300ms',
        '&:hover': { transform: 'translateY(-4px)', borderColor: 'text.primary' },
        'html[data-motion="paused"] &:hover': { transform: 'none' },
        '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
        '&:has(a:focus-visible)': { outline: '2px solid var(--jt-palette-accentText)', outlineOffset: 2 },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '16 / 10',
          bgcolor: 'raised',
          borderBottom: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {image && (
          <Box
            component="img"
            src={image.url}
            alt={alt}
            width={image.width && image.height ? image.width : 1280}
            height={image.width && image.height ? image.height : 800}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
          />
        )}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            left: 16,
            top: 16,
            px: 1,
            py: 0.5,
            borderRadius: 9999,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            fontWeight: 600,
          }}
        >
          {t(`kinds.${item.kind}`)}
        </Typography>
      </Box>
      <Box sx={{ p: 3, display: 'grid', gap: 1, alignContent: 'start' }}>
        <Typography variant="h6" component="h3">
          <Link
            component={linkFor(href)}
            href={href}
            underline="none"
            sx={{ color: 'text.primary', outline: 'none', '&::after': { content: '""', position: 'absolute', inset: 0 } }}
          >
            {item.title}
          </Link>
        </Typography>
        {item.tagline && (
          <Typography variant="body2" color="text.secondary">
            {item.tagline}
          </Typography>
        )}
        {meta && (
          <Typography variant="body2" color="text.secondary">
            {meta}
          </Typography>
        )}
        {rings.length > 0 && (
          <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
            <UL
              aria-label={t('scoresLabel')}
              sx={{ display: 'grid', gridTemplateColumns: `repeat(${rings.length}, minmax(0, 1fr))`, gap: 1 }}
            >
              {rings.map((k) => (
                <ScoreRing key={k} value={item.scores[k]} label={t(`rings.${k}`)} srSuffix={t('scoreSuffix')} />
              ))}
            </UL>
            {date && (
              <Typography variant="caption" color="text.secondary">
                {t('scoresNote', { date })}
              </Typography>
            )}
          </Box>
        )}
        {item.stack.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <TechChips items={item.stack.slice(0, 4)} label={t('stackLabel')} />
          </Box>
        )}
        <Typography
          variant="body2"
          aria-hidden="true"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600, color: 'accentText', mt: 2 }}
        >
          {t('viewProject')} <ArrowRight size={16} />
        </Typography>
      </Box>
    </Card>
  )
}
