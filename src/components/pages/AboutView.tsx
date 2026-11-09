'use client'

import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Briefcase, ExternalLink, Globe, GraduationCap, MapPin, Mic, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { CtaSection } from '@/components/mui/CtaSection'
import { GrainBlob } from '@/components/mui/GrainBlob'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import { visuallyHidden } from '@/components/mui/ScoreRing'
import { TranslationNotice } from '@/components/mui/TranslationNotice'
import type { AboutCounter, AboutData, AboutDateRange, AboutStage } from '@/lib/about-data'
import type { CtaData } from '@/lib/cta-data'
import { buildServicesIndexHref } from '@/lib/service-slugs'

type Props = {
  data: AboutData
  locale: 'es' | 'en'
  /** Datos del cierre (getCtaData en la ruta). Sin ellos no se dibuja el cierre. */
  cta?: CtaData | null
}

/**
 * Sección con encabezado h2 propio (icono decorativo opcional) y franja `band`
 * opcional. Misma escala vertical que Section. Sin landmark main.
 */
function Block({
  id,
  title,
  icon,
  band,
  lang,
  children,
}: {
  id: string
  title: string
  icon?: ReactNode
  band?: boolean
  /** Idioma del encabezado cuando su texto sale del global sin traducir. */
  lang?: string
  children: ReactNode
}) {
  return (
    <Box
      component="section"
      aria-labelledby={`${id}-t`}
      id={id}
      sx={{ py: { xs: 8, md: 12 }, ...(band ? { bgcolor: 'band.bg', color: 'band.text' } : {}) }}
    >
      <Container maxWidth="lg">
        <Typography
          id={`${id}-t`}
          variant="h3"
          component="h2"
          lang={lang}
          sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 1.5 }}
        >
          {icon}
          {title}
        </Typography>
        {children}
      </Container>
    </Box>
  )
}

const QUIET_BAND_CHIP = { bgcolor: 'transparent', color: 'band.text', borderColor: 'band.border' } as const

function CounterCard({ counter, display }: { counter: AboutCounter; display: string }) {
  return (
    // dt primero en el código fuente y la cifra primero en pantalla (order).
    <Card sx={{ p: 3, display: 'grid', gap: 0.5 }}>
      <Typography component="dt" variant="body2" color="text.secondary" sx={{ order: 2 }}>
        {counter.label}
      </Typography>
      <Typography
        component="dd"
        sx={{ m: 0, fontSize: '3rem', lineHeight: 1, fontWeight: 600, color: 'accentText', order: 1 }}
      >
        {display}
      </Typography>
    </Card>
  )
}

function StageContent({ stage, last }: { stage: AboutStage; last: boolean }) {
  const tCommon = useTranslations('common')
  const link = stage.link
  return (
    <TimelineContent sx={{ pt: 0, pb: last ? 0 : 5, pl: 3, minWidth: 0 }}>
      {stage.when && (
        <Typography
          variant="overline"
          sx={{ color: stage.current ? 'accentText' : 'text.secondary', display: 'block' }}
        >
          {stage.when}
        </Typography>
      )}
      <Typography variant="h5" component="h3">
        {stage.role}
      </Typography>
      {stage.org && (
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {stage.org}
        </Typography>
      )}
      {stage.body && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
          {stage.body}
        </Typography>
      )}
      {link &&
        (link.external ? (
          <Button
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            variant="text"
            size="small"
            endIcon={<ExternalLink size={14} aria-hidden="true" />}
            sx={{ px: 0, mt: 1 }}
          >
            {link.label}
            <Box component="span" sx={visuallyHidden}>
              {' '}
              ({tCommon('opensInNewTab')})
            </Box>
          </Button>
        ) : (
          <Button
            component={linkFor(link.href)}
            href={link.href}
            variant="text"
            size="small"
            sx={{ px: 0, mt: 1 }}
          >
            {link.label}
          </Button>
        ))}
    </TimelineContent>
  )
}

/**
 * Vista de Sobre mí (PAG-06). Sin landmark main propio: el documento posee el
 * único. Cada sección sin datos no se dibuja ni deja un encabezado huérfano.
 * En EN, cuando `about-page` no trae el texto traducido (`isFallback`), los
 * textos que salen de ese global van en `lang="es"` y se muestra
 * TranslationNotice. El h1 sale del autor, no del global.
 */
export function AboutView({ data, locale, cta }: Props) {
  const t = useTranslations('about')
  const tCommon = useTranslations('common')

  const showNotice = locale === 'en' && data.isFallback
  const copyLang = showNotice ? 'es' : undefined
  const { hero, bio, counters, specialties, experience, education, talks } = data
  // Las ponencias no se localizan (speaking-events sale en espanol en ambos idiomas).
  const talksLang = locale === 'en' ? 'es' : undefined

  const dateLine = (range: AboutDateRange | null): string | null => {
    if (!range || range.from === '') return null
    return range.to ? t('dateRange', { from: range.from, to: range.to }) : t('dateRangeOpen', { from: range.from })
  }

  const counterCards: { key: string; counter: AboutCounter; display: string }[] = []
  if (counters.years) {
    counterCards.push({ key: 'years', counter: counters.years, display: `${counters.years.value}+` })
  }
  if (counters.seo) counterCards.push({ key: 'seo', counter: counters.seo, display: String(counters.seo.value) })
  if (counters.dev) counterCards.push({ key: 'dev', counter: counters.dev, display: String(counters.dev.value) })

  const showBioBlock = bio !== null || counterCards.length > 0
  const servicesHref = buildServicesIndexHref(locale)

  return (
    <>
      {showNotice && <TranslationNotice esHref="/sobre-mi" />}

      <PageHero
        crumbs={[{ label: tCommon('breadcrumbHome'), href: '/' }, { label: t('crumb') }]}
        eyebrow={hero.eyebrow ?? undefined}
        title={data.name}
        lead={hero.lead ?? undefined}
        aside={
          hero.photo ? (
            <Box
              component="figure"
              sx={{ position: 'relative', m: 0, width: '100%', maxWidth: 420, justifySelf: 'center' }}
            >
              <GrainBlob feather={22} sx={{ inset: '-8%', zIndex: 0 }} />
              <Box
                component="img"
                src={hero.photo.url}
                alt={hero.photo.alt}
                width={hero.photo.width}
                height={hero.photo.height}
                loading="eager"
                fetchPriority="high"
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '4 / 5',
                  objectFit: 'cover',
                  borderRadius: 3,
                  display: 'block',
                  boxShadow: '0 32px 64px -24px rgba(0,0,0,0.5)',
                }}
              />
            </Box>
          ) : undefined
        }
      >
        {hero.chips.length > 0 && (
          <Stack
            direction="row"
            useFlexGap
            spacing={1.5}
            lang={copyLang}
            sx={{ flexWrap: 'wrap', alignItems: 'center' }}
          >
            {hero.chips.map((chip) => (
              <Chip
                key={chip.label}
                icon={
                  chip.icon === 'map-pin' ? (
                    <MapPin size={16} aria-hidden="true" />
                  ) : chip.icon === 'globe' ? (
                    <Globe size={16} aria-hidden="true" />
                  ) : undefined
                }
                label={chip.label}
              />
            ))}
          </Stack>
        )}
      </PageHero>

      {showBioBlock && (
        <Box
          component="section"
          {...(bio?.title ? { 'aria-labelledby': 'about-bio-t' } : { 'aria-label': data.name })}
          sx={{ pb: { xs: 8, md: 10 } }}
        >
          <Container
            maxWidth="lg"
            sx={{
              display: 'grid',
              gridTemplateColumns:
                bio && counterCards.length > 0
                  ? { xs: 'minmax(0,1fr)', md: 'minmax(0,1.3fr) minmax(0,0.7fr)' }
                  : 'minmax(0,1fr)',
              gap: { xs: 5, md: 8 },
              alignItems: 'start',
            }}
          >
            {bio && (
              <Box sx={{ display: 'grid', gap: 2.5, minWidth: 0 }}>
                {bio.title && (
                  <Typography id="about-bio-t" variant="h3" component="h2" lang={copyLang}>
                    {bio.title}
                  </Typography>
                )}
                {bio.paragraphs.map((paragraph, i) => (
                  <Typography
                    key={`${i}-${paragraph.slice(0, 24)}`}
                    variant="body1"
                    color="text.secondary"
                  >
                    {paragraph}
                  </Typography>
                ))}
                <Stack direction="row" useFlexGap spacing={1.5} sx={{ flexWrap: 'wrap', mt: 1 }}>
                  <Button component={linkFor(servicesHref)} href={servicesHref} variant="contained">
                    {t('seeServices')}
                  </Button>
                  <Button component={linkFor('/stack')} href="/stack" variant="outlined">
                    {t('myStack')}
                  </Button>
                </Stack>
              </Box>
            )}
            {counterCards.length > 0 && (
              <Box component="dl" lang={copyLang} sx={{ m: 0, display: 'grid', gap: 2, minWidth: 0 }}>
                {counterCards.map((card) => (
                  <CounterCard key={card.key} counter={card.counter} display={card.display} />
                ))}
              </Box>
            )}
          </Container>
        </Box>
      )}

      {specialties && (
        <Block id="about-areas" title={specialties.title} band lang={copyLang}>
          <UL
            lang={copyLang}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0,1fr)',
                sm: 'repeat(2, minmax(0,1fr))',
                md: 'repeat(4, minmax(0,1fr))',
              },
              gap: 2,
            }}
          >
            {specialties.items.map((item) => (
              <Box
                key={item.title}
                component="li"
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'band.surface',
                  border: 1,
                  borderColor: 'band.border',
                  display: 'grid',
                  gap: 1,
                  alignContent: 'start',
                  minWidth: 0,
                }}
              >
                <Typography variant="h6" component="h3">
                  {item.title}
                </Typography>
                {item.detail && (
                  <Typography variant="body2" sx={{ color: 'band.muted' }}>
                    {item.detail}
                  </Typography>
                )}
              </Box>
            ))}
          </UL>
        </Block>
      )}

      {experience && (
        <Block
          id="about-experience"
          title={experience.title}
          icon={<Briefcase size={28} aria-hidden="true" />}
          lang={copyLang}
        >
          <Box lang={copyLang}>
            {experience.lead && (
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mb: 5 }}>
                {experience.lead}
              </Typography>
            )}
            <Timeline
              position="right"
              aria-label={t('timelineLabel')}
              sx={{
                p: 0,
                m: 0,
                maxWidth: 860,
                [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 },
              }}
            >
              {experience.stages.map((stage, i) => {
                const last = i === experience.stages.length - 1
                return (
                  <TimelineItem key={`${i}-${stage.org ?? ''}-${stage.role}`}>
                    <TimelineSeparator aria-hidden="true">
                      <TimelineDot
                        data-current={stage.current ? 'true' : 'false'}
                        sx={{
                          m: '6px 0',
                          boxShadow: 'none',
                          ...(stage.current
                            ? { bgcolor: 'primary.main', borderColor: 'primary.main' }
                            : { bgcolor: 'background.default', border: '3px solid', borderColor: 'divider' }),
                        }}
                      />
                      {!last && <TimelineConnector sx={{ bgcolor: 'divider' }} />}
                    </TimelineSeparator>
                    <StageContent stage={stage} last={last} />
                  </TimelineItem>
                )
              })}
            </Timeline>
          </Box>
        </Block>
      )}
      {education && (
        <Block
          id="about-education"
          title={education.title}
          icon={<GraduationCap size={28} aria-hidden="true" />}
          lang={copyLang}
        >
          <UL
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))' },
              gap: 2,
            }}
          >
            {education.items.map((item) => {
              const dates = dateLine(item.dates)
              return (
                <Card
                  key={`${item.degree}-${item.institution ?? ''}`}
                  component="li"
                  sx={{ p: 3, display: 'grid', gap: 0.5, minWidth: 0 }}
                >
                  <Typography variant="h6" component="h3">
                    {item.degree}
                  </Typography>
                  {item.institution && <Typography variant="body1">{item.institution}</Typography>}
                  {dates && (
                    <Typography variant="body2" color="text.secondary">
                      {dates}
                    </Typography>
                  )}
                </Card>
              )
            })}
          </UL>
        </Block>
      )}

      {talks && (
        <Block
          id="about-talks"
          title={talks.title}
          icon={<Mic size={28} aria-hidden="true" />}
          band
          lang={copyLang}
        >
          <UL
            lang={talksLang}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))' },
              gap: 2,
            }}
          >
            {talks.items.map((talk) => (
              <Box key={`${talk.title}-${talk.by ?? ''}`} component="li" sx={{ display: 'grid', minWidth: 0 }}>
                <Box
                  sx={{
                    borderRadius: 2,
                    bgcolor: 'band.surface',
                    border: 1,
                    borderColor: 'band.border',
                    overflow: 'hidden',
                    display: 'grid',
                    alignContent: 'start',
                  }}
                >
                  {talk.flyer && (
                    <Box
                      component="img"
                      src={talk.flyer.url}
                      alt={talk.flyer.alt}
                      width={talk.flyer.width}
                      height={talk.flyer.height}
                      loading="lazy"
                      sx={{ width: '100%', height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <Box sx={{ p: 3, display: 'grid', gap: 1.5, minWidth: 0 }}>
                    <Typography variant="h5" component="h3">
                      {talk.title}
                      {talk.by && (
                        <Typography component="span" variant="body2" sx={{ color: 'band.muted', display: 'block' }}>
                          {t('by', { name: talk.by })}
                        </Typography>
                      )}
                    </Typography>
                    {talk.role && (
                      <Typography variant="subtitle1" component="p" sx={{ fontSize: '1rem', color: 'primary.main' }}>
                        {talk.role}
                      </Typography>
                    )}
                    {(talk.location || talk.attendees !== null) && (
                      <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {talk.location && (
                          <Chip
                            size="small"
                            icon={<MapPin size={14} aria-hidden="true" />}
                            label={talk.location}
                            sx={QUIET_BAND_CHIP}
                          />
                        )}
                        {talk.attendees !== null && (
                          <Chip
                            size="small"
                            icon={<Users size={14} aria-hidden="true" />}
                            label={t('attendees', { count: talk.attendees })}
                            lang={talksLang ? locale : undefined}
                            sx={QUIET_BAND_CHIP}
                          />
                        )}
                      </Stack>
                    )}
                    {talk.description && (
                      <Typography variant="body2" sx={{ color: 'band.muted', lineHeight: '1.375rem' }}>
                        {talk.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </UL>
        </Block>
      )}

      {cta && (
        <div lang={cta.isFallback && locale === 'en' ? 'es' : undefined}>
          <CtaSection
            title={cta.title}
            lead={cta.lead}
            email={cta.email}
            name={cta.name}
            avatarUrl={cta.avatarUrl}
          />
        </div>
      )}
    </>
  )
}
