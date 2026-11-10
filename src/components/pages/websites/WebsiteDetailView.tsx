'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ArrowLeft, ArrowRight, Check, ExternalLink, Flag } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import type { Crumb } from '@/components/mui/Crumbs'
import { formatLongDateUtc } from '@/components/mui/format-date'
import { BrowserFrame } from '@/components/mui/Frames'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import { ProjectCard, ringsWithValue } from '@/components/mui/ProjectCard'
import { ScoreRing, visuallyHidden } from '@/components/mui/ScoreRing'
import { Section } from '@/components/mui/Section'
import { TechChips } from '@/components/mui/TechChips'
import type { WebsiteDetailProps, WebsiteIndexItem, WebsiteNeighbor } from '@/lib/websites-data'

type Props = {
  /** Migas de `buildWebsitesTrail`, ya con `href`. */
  crumbs: Crumb[]
  site: WebsiteDetailProps
  /** Sitio anterior y siguiente segun el orden del indice. null si no hay navegacion. */
  neighbors: { prev: WebsiteNeighbor; next: WebsiteNeighbor } | null
  /** Hasta tres sitios para "Mas proyectos" (`pickSuggested`). */
  suggested: WebsiteIndexItem[]
}

/** Lista de puntos con un icono redondo a la izquierda, sobre la franja `band`. */
function MarkedList({
  items,
  tone,
  label,
}: {
  items: string[]
  tone: 'check' | 'flag'
  label: string
}) {
  return (
    <UL aria-label={label} sx={{ display: 'grid', gap: 1.5 }}>
      {items.map((text, i) => (
        <Box
          key={`${i}-${text}`}
          component="li"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 2,
            p: 2.5,
            borderRadius: 2,
            bgcolor: 'band.surface',
            border: 1,
            borderColor: 'band.border',
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              ...(tone === 'check'
                ? { bgcolor: 'primary.main', color: 'primary.contrastText' }
                : { border: '2px solid', borderColor: 'warning.main', color: 'warning.main' }),
            }}
          >
            {tone === 'check' ? <Check size={16} strokeWidth={3} /> : <Flag size={14} />}
          </Box>
          <Typography variant="body1" sx={{ lineHeight: '1.625rem' }}>
            {text}
          </Typography>
        </Box>
      ))}
    </UL>
  )
}

/**
 * Detalle de un sitio (D-13 a D-15). Hero con la captura unica en `BrowserFrame`
 * y el enlace externo, puntajes, aspectos destacados y retos, stack, caso
 * relacionado, anterior y siguiente, y mas proyectos. El cierre (CtaSection) lo
 * pone el Server Component de la ruta. No declara landmark principal.
 *
 * Todo bloque sin datos se omite junto con su encabezado: sin puntajes no hay
 * seccion de rendimiento, sin caso relacionado no hay enlace. El enlace externo
 * se arma solo desde `site.domain`, que `domainFor` ya valido (T-55-27).
 */
export function WebsiteDetailView({ crumbs, site, neighbors, suggested }: Props) {
  const t = useTranslations('websites.detail')
  const tIndex = useTranslations('websites.index')
  const locale = useLocale()

  const rings = ringsWithValue(site.scores)
  const date = formatLongDateUtc(site.scoresDate, locale)
  const eyebrow = [site.industry, site.year ? String(site.year) : null].filter(Boolean).join(' · ')
  const image = site.image
  const hasBuild = site.highlights.length > 0 || site.challenges.length > 0

  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={eyebrow || undefined}
        title={site.title}
        lead={site.tagline ?? undefined}
        aside={
          image ? (
            <BrowserFrame
              src={image.url}
              alt={image.alt ?? t('screenshotAlt', { domain: site.domain ?? site.title })}
              domain={site.domain}
              width={image.width}
              height={image.height}
              priority
            />
          ) : undefined
        }
      >
        <Stack direction="row" useFlexGap spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {site.domain && (
            <Button
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener"
              variant="contained"
              size="large"
              endIcon={<ExternalLink size={18} aria-hidden="true" />}
            >
              {t('visit')}
              <Box component="span" sx={visuallyHidden}>
                {` (${t('opensInNewTab')})`}
              </Box>
            </Button>
          )}
          <Chip label={tIndex(`kinds.${site.kind}`)} />
        </Stack>
      </PageHero>

      {rings.length > 0 && (
        <Section id="puntajes" title={t('scoresTitle')}>
          {date && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {t('scoresNote', { date })}
            </Typography>
          )}
          <UL
            aria-label={t('scoresLabel')}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: `repeat(${rings.length}, minmax(0,1fr))` },
              gap: 2,
            }}
          >
            {rings.map((k) => (
              <Card key={k} component="li" sx={{ p: 3, display: 'grid', placeItems: 'center' }}>
                <ScoreRing value={site.scores[k]} label={t(`rings.${k}`)} srSuffix={t('scoreSuffix')} size={88} as="div" />
              </Card>
            ))}
          </UL>
        </Section>
      )}

      {hasBuild && (
        <Section id="detalle" band title={t('buildTitle')}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0,1fr)',
                md: site.highlights.length > 0 && site.challenges.length > 0 ? 'repeat(2, minmax(0,1fr))' : 'minmax(0,1fr)',
              },
              gap: { xs: 4, md: 6 },
              alignItems: 'start',
            }}
          >
            {site.highlights.length > 0 && (
              <Box>
                <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                  {t('highlightsTitle')}
                </Typography>
                <MarkedList items={site.highlights} tone="check" label={t('highlightsTitle')} />
              </Box>
            )}
            {site.challenges.length > 0 && (
              <Box>
                <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                  {t('challengesTitle')}
                </Typography>
                <MarkedList items={site.challenges} tone="flag" label={t('challengesTitle')} />
              </Box>
            )}
          </Box>
        </Section>
      )}

      {site.stack.length > 0 && (
        <Section id="stack" title={t('stackTitle')}>
          <TechChips items={site.stack} label={t('stackLabel')} />
        </Section>
      )}

      {site.relatedCase && (
        <Section id="caso" band title={t('relatedCaseTitle')}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
            <Typography variant="h5" component="h3">
              {site.relatedCase.title}
            </Typography>
            <Button
              component={linkFor(site.relatedCase.href)}
              href={site.relatedCase.href}
              variant="contained"
              endIcon={<ArrowRight size={18} aria-hidden="true" />}
            >
              {t('relatedCaseLink')}
            </Button>
          </Box>
        </Section>
      )}

      {neighbors && (
        <Box component="nav" aria-label={t('navLabel')} sx={{ py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg" sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 }}>
            <Button
              component={linkFor(`/websites/${neighbors.prev.slug}`)}
              href={`/websites/${neighbors.prev.slug}`}
              variant="outlined"
              startIcon={<ArrowLeft size={18} aria-hidden="true" />}
            >
              {t('previous', { title: neighbors.prev.title })}
            </Button>
            <Button
              component={linkFor(`/websites/${neighbors.next.slug}`)}
              href={`/websites/${neighbors.next.slug}`}
              variant="outlined"
              endIcon={<ArrowRight size={18} aria-hidden="true" />}
            >
              {t('next', { title: neighbors.next.title })}
            </Button>
          </Container>
        </Box>
      )}

      {suggested.length > 0 && (
        <Box component="section" aria-labelledby="mas-t" sx={{ pb: { xs: 8, md: 10 } }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 4 }}>
              <Typography id="mas-t" variant="h4" component="h2">
                {t('moreTitle')}
              </Typography>
              <Button
                component={linkFor('/websites')}
                href="/websites"
                variant="outlined"
                endIcon={<ArrowRight size={18} aria-hidden="true" />}
              >
                {t('viewAll')}
              </Button>
            </Box>
            <UL
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(3, minmax(0,1fr))' },
                gap: 2,
                '& > li': { display: 'grid' },
              }}
            >
              {suggested.map((item) => (
                <li key={item.slug}>
                  <ProjectCard item={item} />
                </li>
              ))}
            </UL>
          </Container>
        </Box>
      )}
    </>
  )
}
