'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { ScoreRing } from '@/components/mui/ScoreRing'
import { TechChips } from '@/components/mui/TechChips'
import type { HomeSiteItem, SiteScores } from '@/lib/home-data-b'

const RING_KEYS: ReadonlyArray<keyof SiteScores> = ['performance', 'accessibility', 'bestPractices', 'seo']

/**
 * Tarjeta de sitio con enlace estirado: el enlace vive en el titulo (h3) y su
 * `::after` cubre toda la tarjeta, asi el nombre accesible es el titulo visible
 * (SC 2.5.3) y la tarjeta entera sigue siendo clicable. El foco se dibuja en la
 * tarjeta con `:has(a:focus-visible)`.
 *
 * Los puntajes son los reales de Payload: un anillo con puntaje null se omite y,
 * cuando los cuatro son null, tambien la lista y su leyenda.
 */
export function SiteCard({ site }: { site: HomeSiteItem }) {
  const t = useTranslations('home')
  const tc = useTranslations('common')

  const rings = RING_KEYS.filter((k) => typeof site.scores[k] === 'number')
  const image = site.image
  const alt = image?.alt ?? t('sites.screenshotAlt', { domain: site.domain ?? site.name })

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color var(--jt-motion-base, 250ms)',
        '&:hover': { borderColor: 'text.primary' },
        '&:has(a:focus-visible)': { outline: '2px solid var(--jt-palette-accentText)', outlineOffset: '2px' },
      }}
    >
      {image && (
        <Box sx={{ aspectRatio: '16 / 10', bgcolor: 'raised', borderBottom: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <Box
            component="img"
            src={image.url}
            alt={alt}
            {...(image.width && image.height ? { width: image.width, height: image.height } : {})}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
          />
        </Box>
      )}
      <Box sx={{ p: 2.5, display: 'grid', gap: 0.5 }}>
        <Typography variant="h6" component="h3">
          <Link
            component={linkFor(site.href)}
            href={site.href}
            underline="none"
            sx={{ color: 'text.primary', outline: 'none', '&::after': { content: '""', position: 'absolute', inset: 0 } }}
          >
            {site.name}
          </Link>
        </Typography>
        {site.domain && (
          <Typography variant="mono" component="p" sx={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'text.secondary' }}>
            {site.domain}
          </Typography>
        )}
        {site.category && (
          <Typography variant="body2" color="text.secondary">
            {site.category}
          </Typography>
        )}
        {rings.length > 0 && (
          <UL
            aria-label={t('sites.scoresLabel')}
            sx={{ display: 'grid', gridTemplateColumns: `repeat(${rings.length}, minmax(0, 1fr))`, gap: 1, mt: 2 }}
          >
            {rings.map((k) => (
              <ScoreRing
                key={k}
                value={site.scores[k]}
                label={t(`sites.rings.${k}`)}
                srSuffix={t('sites.scoreSuffix')}
              />
            ))}
          </UL>
        )}
        {site.tech.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <TechChips items={site.tech} label={tc('topicsLabel')} />
          </Box>
        )}
      </Box>
    </Card>
  )
}
