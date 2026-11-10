'use client'

import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ArrowRight, Lightbulb, Quote } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { BeforeAfter } from '@/components/mui/BeforeAfter'
import type { Crumb } from '@/components/mui/Crumbs'
import { GrainBlob } from '@/components/mui/GrainBlob'
import { linkFor } from '@/components/mui/links'
import { OL, UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import { Section } from '@/components/mui/Section'
import type { CaseComparison, CaseDetailProps, CaseIndexItem } from '@/lib/case-study-data'

import { CaseCard } from './CaseCard'
import { CaseCompareTable } from './CaseCompareTable'

type Props = {
  /** Migas de `buildCaseStudiesTrail`, ya con `href`. */
  crumbs: Crumb[]
  caseStudy: CaseDetailProps
  /**
   * Cuerpo ya renderizado en el servidor con `MuiRichText` (un Server
   * Component no se importa desde aqui). null cuando el caso no tiene el texto:
   * la seccion no emite encabezado.
   */
  clientContent: ReactNode
  conclusionContent: ReactNode
  /** Hasta tres casos para "Mas casos de exito" (`pickRelatedCases`). */
  related: CaseIndexItem[]
  /**
   * Comparacion de clics con los demas casos (`buildCaseComparison`). null si
   * este caso no mide clics anuales: la vista no renderiza la seccion ni su nota.
   */
  comparison?: CaseComparison | null
}

// Una cifra que no se separo de su etiqueta llega entera y no cabe a 72 px: baja
// a 48 px (escala display aceptada el 2026-11-08), igual que en CaseCard.
const LONG_METRIC = 9

/** Lista con un punto de color a la izquierda, sobre la franja `band`. */
function DotList({ items, label }: { items: string[]; label: string }) {
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
          <Box aria-hidden="true" sx={{ width: 10, height: 10, mt: '8px', borderRadius: '50%', bgcolor: 'error.main' }} />
          <Typography variant="body2" sx={{ lineHeight: '1.5rem' }}>
            {text}
          </Typography>
        </Box>
      ))}
    </UL>
  )
}

/**
 * Detalle de un caso de exito (D-08). Orden: hero con la cifra y el subtitulo,
 * KPIs, contexto y reto, solucion, testimonio, resultados antes y despues,
 * comparativos, lecciones (solo si hay) y conclusion; al final el autor
 * (E-E-A-T) y mas casos. El cierre (CtaSection)
 * lo pone el Server Component de la ruta. No declara landmark principal.
 *
 * Toda seccion sin datos se omite junto con su encabezado y su overline: sin
 * KPIs no hay seccion de numeros, sin contexto ni reto no hay seccion de
 * contexto. Las etiquetas de metricas y KPIs salen verbatim de Payload.
 */
export function CaseDetailView({ crumbs, caseStudy: c, clientContent, conclusionContent, related, comparison = null }: Props) {
  const t = useTranslations('cases.detail')

  const eyebrow = [c.clientName, c.sector, c.period].filter(Boolean).join(' · ')
  const hasClient = Boolean(clientContent)
  const hasChallenge = c.challenge.length > 0
  const periods = [
    c.periodBefore ? t('periodBefore', { period: c.periodBefore }) : null,
    c.periodAfter ? t('periodAfter', { period: c.periodAfter }) : null,
  ]
    .filter(Boolean)
    .join(' ')
  const long = c.metric.length > LONG_METRIC

  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={eyebrow || undefined}
        title={c.title}
        lead={c.deck ?? undefined}
        aside={
          c.metric ? (
            <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center', minHeight: 280 }}>
              <GrainBlob feather={24} sx={{ inset: '-6%', zIndex: 0 }} />
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', p: 3 }}>
                <Typography
                  component="p"
                  sx={{
                    fontSize: long ? '3rem' : '4.5rem',
                    lineHeight: 1,
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    overflowWrap: 'anywhere',
                    color: 'primary.contrastText',
                  }}
                >
                  {c.metric}
                </Typography>
                {c.metricLabel && (
                  <Typography variant="subtitle1" component="p" sx={{ color: 'primary.contrastText', mt: 1 }}>
                    {c.metricLabel}
                  </Typography>
                )}
              </Box>
            </Box>
          ) : undefined
        }
      />

      {c.kpis.length > 0 && (
        <Section id="numeros" title={t('statsTitle')}>
          <Box
            component="dl"
            sx={{
              m: 0,
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0,1fr))',
                md: `repeat(${Math.min(c.kpis.length, 4)}, minmax(0,1fr))`,
              },
              gap: 2,
            }}
          >
            {c.kpis.map((k, i) => (
              <Card key={`${i}-${k.label}`} component="div" sx={{ p: 3, display: 'grid', gap: 0.5, alignContent: 'start' }}>
                <Typography component="dt" variant="body2" color="text.secondary">
                  {k.label}
                </Typography>
                <Typography
                  component="dd"
                  sx={{
                    m: 0,
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    lineHeight: 1.1,
                    fontWeight: 600,
                    color: 'accentText',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {k.value}
                </Typography>
              </Card>
            ))}
          </Box>
        </Section>
      )}

      {(hasClient || hasChallenge) && (
        <Section
          id="contexto"
          band
          title={hasClient && hasChallenge ? t('contextTitle') : hasClient ? t('clientTitle') : t('challengeTitle')}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0,1fr)',
                md: hasClient && hasChallenge ? 'repeat(2, minmax(0,1fr))' : 'minmax(0,1fr)',
              },
              gap: { xs: 4, md: 8 },
              alignItems: 'start',
            }}
          >
            {hasClient && (
              <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
                {hasChallenge && (
                  <Typography variant="h5" component="h3">
                    {t('clientTitle')}
                  </Typography>
                )}
                {clientContent}
              </Box>
            )}
            {hasChallenge && (
              <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
                {hasClient && (
                  <Typography variant="h5" component="h3">
                    {t('challengeTitle')}
                  </Typography>
                )}
                <DotList items={c.challenge} label={t('challengeTitle')} />
              </Box>
            )}
          </Box>
        </Section>
      )}

      {c.solution.length > 0 && (
        <Section id="solucion" title={t('solutionTitle')}>
          <OL
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0,1fr)',
                md: `repeat(${Math.min(c.solution.length, 3)}, minmax(0,1fr))`,
              },
              gap: 2,
            }}
          >
            {c.solution.map((s, i) => (
              <Card key={`${i}-${s.title}`} component="li" sx={{ p: 3, display: 'grid', gap: 1.5, alignContent: 'start' }}>
                <Typography
                  aria-hidden="true"
                  component="span"
                  sx={{ fontFamily: 'var(--font-geist-mono)', fontSize: '2rem', lineHeight: 1, fontWeight: 600, color: 'accentText' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </Typography>
                <Typography variant="h6" component="h3">
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: '1.375rem' }}>
                  {s.body}
                </Typography>
              </Card>
            ))}
          </OL>
        </Section>
      )}

      {c.testimonial && (
        <Box sx={{ pb: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Card component="figure" sx={{ m: 0, p: { xs: 3, md: 5 }, display: 'grid', gap: 3, bgcolor: 'raised' }}>
              <Box aria-hidden="true" sx={{ color: 'accentText', display: 'flex' }}>
                <Quote size={28} />
              </Box>
              <Typography component="blockquote" variant="h5" sx={{ m: 0, maxWidth: 820 }}>
                {`“${c.testimonial.quote}”`}
              </Typography>
              <Box component="figcaption">
                <Typography variant="subtitle1" component="p" sx={{ fontSize: '1rem' }}>
                  {c.testimonial.authorName}
                </Typography>
                {c.testimonial.authorRole && (
                  <Typography variant="body2" color="text.secondary">
                    {c.testimonial.authorRole}
                  </Typography>
                )}
              </Box>
            </Card>
          </Container>
        </Box>
      )}

      {c.results.length > 0 && (
        <Section id="resultados" title={t('resultsTitle')}>
          {periods && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {periods}
            </Typography>
          )}
          <BeforeAfter results={c.results} />
        </Section>
      )}

      {comparison && (
        <Section id="comparar" title={t('compareTitle')}>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem', lineHeight: '1.75rem', maxWidth: 820, mb: 4 }}>
            {comparison.rankPct !== null
              ? t('compareRankBoth', {
                  pct: comparison.rankPct,
                  pctTotal: comparison.totalPct,
                  abs: comparison.rankAbs,
                  absTotal: comparison.totalAbs,
                })
              : t('compareRankAbs', { abs: comparison.rankAbs, absTotal: comparison.totalAbs })}
          </Typography>
          <CaseCompareTable comparison={comparison} />
          {comparison.excluded > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              {t('compareNote')}
            </Typography>
          )}
        </Section>
      )}

      {c.lessons && c.lessons.length > 0 && (
        <Section id="lecciones" band title={t('lessonsTitle')}>
          <UL
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0,1fr)',
                md: `repeat(${Math.min(c.lessons.length, 3)}, minmax(0,1fr))`,
              },
              gap: 2,
            }}
          >
            {c.lessons.map((l, i) => (
              <Box
                key={`${i}-${l.title}`}
                component="li"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'band.surface',
                  border: 1,
                  borderColor: 'band.border',
                  display: 'grid',
                  gap: 1.5,
                  alignContent: 'start',
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Lightbulb size={18} />
                </Box>
                <Typography variant="h6" component="h3">
                  {l.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'band.muted', lineHeight: '1.5rem' }}>
                  {l.body}
                </Typography>
              </Box>
            ))}
          </UL>
        </Section>
      )}

      {conclusionContent && (
        <Section id="conclusion" title={t('conclusionTitle')}>
          {conclusionContent}
        </Section>
      )}

      {c.author && (
        <Box component="aside" aria-labelledby="autor-t" sx={{ pb: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Card
              sx={{
                p: { xs: 3, md: 4 },
                display: 'grid',
                gridTemplateColumns: c.author.avatar ? 'auto minmax(0,1fr)' : 'minmax(0,1fr)',
                gap: 3,
                alignItems: 'start',
              }}
            >
              {c.author.avatar && <Avatar src={c.author.avatar.url} alt="" sx={{ width: 72, height: 72 }} />}
              <Box sx={{ display: 'grid', gap: 1, minWidth: 0 }}>
                <Typography variant="overline" component="p" sx={{ color: 'accentText' }}>
                  {t('authorLabel')}
                </Typography>
                <Typography id="autor-t" variant="h5" component="h2">
                  <Link component={linkFor(c.author.href)} href={c.author.href} underline="hover" sx={{ color: 'inherit' }}>
                    {c.author.name}
                  </Link>
                </Typography>
                {c.author.jobTitle && (
                  <Typography variant="body2" color="text.secondary">
                    {c.author.jobTitle}
                  </Typography>
                )}
                {c.author.bio && <Typography variant="body1">{c.author.bio}</Typography>}
              </Box>
            </Card>
          </Container>
        </Box>
      )}

      {related.length > 0 && (
        <Box component="section" aria-labelledby="mas-t" sx={{ pb: { xs: 8, md: 10 } }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 4 }}>
              <Typography id="mas-t" variant="h4" component="h2">
                {t('moreTitle')}
              </Typography>
              <Button
                component={linkFor('/case-studies')}
                href="/case-studies"
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
                '& > li': { display: 'grid', minWidth: 0 },
              }}
            >
              {related.map((item) => (
                <li key={item.slug}>
                  <CaseCard item={item} />
                </li>
              ))}
            </UL>
          </Container>
        </Box>
      )}
    </>
  )
}
