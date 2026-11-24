'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Crumb } from '@/components/mui/Crumbs'
import { formatLongDateUtc } from '@/components/mui/format-date'
import { BrowserFrame } from '@/components/mui/Frames'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import { ProjectCard, ringsWithValue } from '@/components/mui/ProjectCard'
import { ScoreRing } from '@/components/mui/ScoreRing'
import { TechChips } from '@/components/mui/TechChips'
import type { WebsiteIndexItem, WebsiteKind } from '@/lib/websites-data'

type Props = {
  /** Migas de `buildWebsitesTrail`, ya con `href`. */
  crumbs: Crumb[]
  /** Titulo del h1, tal como lo entrega la ruta. */
  title: string
  items: WebsiteIndexItem[]
}

type Filter = 'all' | WebsiteKind

const KIND_ORDER: readonly WebsiteKind[] = ['nextjs', 'wordpress', 'other']

function Featured({ item }: { item: WebsiteIndexItem }) {
  const t = useTranslations('websites.index')
  const locale = useLocale()
  const href = `/websites/${item.slug}`
  const rings = ringsWithValue(item.scores)
  const date = formatLongDateUtc(item.scoresDate, locale)
  const image = item.image
  const meta = [item.industry, item.year ? String(item.year) : null].filter(Boolean).join(' · ')
  const description = [item.tagline, meta].filter(Boolean).join('. ')

  return (
    <Card
      sx={{
        position: 'relative',
        p: { xs: 3, md: 4 },
        bgcolor: 'band.bg',
        color: 'band.text',
        borderColor: 'band.border',
        display: 'grid',
        gridTemplateColumns: image
          ? { xs: 'minmax(0,1fr)', md: 'minmax(0,1.1fr) minmax(0,0.9fr)' }
          : 'minmax(0,1fr)',
        gap: { xs: 4, md: 6 },
        alignItems: 'center',
        transition: 'border-color 300ms',
        '&:hover': { borderColor: 'primary.main' },
        '&:has(a:focus-visible)': { outline: '2px solid var(--jt-palette-primary-main)', outlineOffset: 2 },
      }}
    >
      {image && (
        <BrowserFrame
          src={image.url}
          alt={image.alt ?? t('screenshotAlt', { domain: item.domain ?? item.title })}
          domain={item.domain}
          width={image.width}
          height={image.height}
          priority
        />
      )}
      <Box sx={{ display: 'grid', gap: 2, alignContent: 'center' }}>
        <Typography variant="overline" sx={{ color: 'primary.main' }}>
          {t('featured')} · {t(`kinds.${item.kind}`)}
        </Typography>
        <Typography variant="h3" component="h3">
          <Link
            component={linkFor(href)}
            href={href}
            underline="none"
            sx={{ color: 'inherit', outline: 'none', '&::after': { content: '""', position: 'absolute', inset: 0 } }}
          >
            {item.title}
          </Link>
        </Typography>
        {description && (
          <Typography variant="body1" sx={{ color: 'band.muted' }}>
            {description}
          </Typography>
        )}
        {rings.length > 0 && (
          <Box sx={{ display: 'grid', gap: 1, maxWidth: 420 }}>
            <UL
              aria-label={t('scoresLabel')}
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${rings.length}, minmax(0, 1fr))`,
                gap: 1,
                color: 'band.text',
                '& .MuiTypography-caption': { color: 'band.muted' },
              }}
            >
              {rings.map((k) => (
                <ScoreRing key={k} value={item.scores[k]} label={t(`rings.${k}`)} srSuffix={t('scoreSuffix')} />
              ))}
            </UL>
            {date && (
              <Typography variant="caption" sx={{ color: 'band.muted' }}>
                {t('scoresNote', { date })}
              </Typography>
            )}
          </Box>
        )}
        {item.stack.length > 0 && <TechChips items={item.stack} label={t('stackLabel')} />}
        <Typography
          variant="body2"
          aria-hidden="true"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600, color: 'primary.main' }}
        >
          {t('viewProject')} <ArrowRight size={16} />
        </Typography>
      </Box>
    </Card>
  )
}

/**
 * Indice de Websites: PageHero, filtro por tipo, el primer sitio destacado y
 * las demas tarjetas en rejilla. El cierre (CtaSection) lo pone el Server
 * Component de la ruta. No declara landmark principal.
 *
 * Con el filtro "todos" el HTML del servidor ya trae todas las tarjetas y todos
 * los enlaces: filtrar nunca es la unica via a un sitio (SEO-03). El filtro solo
 * ofrece los tipos que existen en los datos, y no aparece si hay uno solo.
 */
export function WebsitesIndexView({ crumbs, title, items }: Props) {
  const t = useTranslations('websites.index')
  const [filter, setFilter] = useState<Filter>('all')

  const kinds = KIND_ORDER.filter((k) => items.some((i) => i.kind === k))
  const countOf = (k: Filter) => (k === 'all' ? items.length : items.filter((i) => i.kind === k).length)
  const list = items.filter((i) => filter === 'all' || i.kind === filter)
  const [first, ...rest] = list

  return (
    <>
      <PageHero crumbs={crumbs} title={title} />

      <Box component="section" aria-labelledby="proyectos-t" sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          {items.length === 0 ? (
            <Box sx={{ display: 'grid', gap: 1, justifyItems: 'center', textAlign: 'center', py: 8 }}>
              <Typography id="proyectos-t" variant="h3" component="h2">
                {t('emptyTitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('emptyText')}
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 3,
                }}
              >
                <Typography id="proyectos-t" variant="h3" component="h2">
                  {t('listTitle')}
                </Typography>
                {kinds.length > 1 && (
                  <ToggleButtonGroup
                    exclusive
                    value={filter}
                    onChange={(_, v: Filter | null) => v && setFilter(v)}
                    aria-label={t('filterLabel')}
                    size="small"
                    sx={{
                      flexWrap: 'wrap',
                      gap: 1,
                      '& .MuiToggleButtonGroup-grouped': {
                        border: 1,
                        borderColor: 'fieldBorder',
                        borderRadius: '9999px !important',
                        px: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        color: 'text.primary',
                        minHeight: 40,
                        '&.Mui-selected': {
                          bgcolor: 'text.primary',
                          color: 'background.default',
                          '&:hover': { bgcolor: 'text.primary' },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="all">{t('filterOption', { label: t('filterAll'), count: countOf('all') })}</ToggleButton>
                    {kinds.map((k) => (
                      <ToggleButton key={k} value={k}>
                        {t('filterOption', { label: t(`kinds.${k}`), count: countOf(k) })}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                )}
              </Box>
              <Typography role="status" aria-live="polite" variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {filter === 'all'
                  ? t('count', { count: list.length })
                  : t('countWithKind', { count: list.length, kind: t(`kinds.${filter}`) })}
              </Typography>
              {first && (
                <Box sx={{ mb: 2 }}>
                  <Featured item={first} />
                </Box>
              )}
              {rest.length > 0 && (
                <UL
                  aria-label={t('listLabel')}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'minmax(0,1fr)',
                      md: 'repeat(2, minmax(0,1fr))',
                      lg: 'repeat(3, minmax(0,1fr))',
                    },
                    gap: 2,
                    '& > li': { display: 'grid' },
                  }}
                >
                  {rest.map((item) => (
                    <li key={item.slug}>
                      <ProjectCard item={item} />
                    </li>
                  ))}
                </UL>
              )}
            </>
          )}
        </Container>
      </Box>
    </>
  )
}
