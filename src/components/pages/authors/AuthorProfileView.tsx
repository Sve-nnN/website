'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ExternalLink, MapPin, Users } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import type { Crumb } from '@/components/mui/Crumbs'
import { formatLongDateUtc } from '@/components/mui/format-date'
import { GrainBlob } from '@/components/mui/GrainBlob'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import { PostCard } from '@/components/mui/PostCard'
import { visuallyHidden } from '@/components/mui/ScoreRing'
import { Section } from '@/components/mui/Section'
import { TechChips } from '@/components/mui/TechChips'
import { CaseCard } from '@/components/pages/cases/CaseCard'
import type { AuthorEventItem, AuthorProfileProps, AuthorSocialLink } from '@/lib/authors-data'

import { AuthorTimeline } from './AuthorTimeline'

type Props = {
  /** Migas de `buildAuthorsTrail` con el autor, ya con `href`. */
  crumbs: Crumb[]
  profile: AuthorProfileProps
}

const QUIET_BAND_CHIP = { bgcolor: 'transparent', color: 'band.text', borderColor: 'band.border' } as const

const GRID_3 = {
  display: 'grid',
  gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))', lg: 'repeat(3, minmax(0,1fr))' },
  gap: 2,
  '& > li': { display: 'grid', minWidth: 0 },
} as const

/** Enlace externo del perfil: solo llega aqui una URL http o https ya saneada. */
function ExternalButton({ href, children }: { href: string; children: ReactNode }) {
  const tCommon = useTranslations('common')
  return (
    <Button
      href={href}
      target="_blank"
      rel="noopener"
      variant="outlined"
      size="small"
      endIcon={<ExternalLink size={14} aria-hidden="true" />}
    >
      {children}
      <Box component="span" sx={visuallyHidden}>
        {' '}
        ({tCommon('opensInNewTab')})
      </Box>
    </Button>
  )
}

function SocialLinks({ name, links }: { name: string; links: AuthorSocialLink[] }) {
  const t = useTranslations('authors.profile')
  if (links.length === 0) return null
  return (
    <UL aria-label={t('socialLabel', { name })} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {links.map((link) => (
        <li key={link.platform}>
          {link.href ? (
            <ExternalButton href={link.href}>{t(`platforms.${link.platform}`)}</ExternalButton>
          ) : (
            // Sin URL http o https segura no hay enlace: queda el nombre de la plataforma como texto.
            <Typography variant="body2" color="text.secondary" component="span">
              {t(`platforms.${link.platform}`)}
            </Typography>
          )}
        </li>
      ))}
    </UL>
  )
}

function EventCard({ event }: { event: AuthorEventItem }) {
  const t = useTranslations('authors.profile')
  const locale = useLocale()
  const date = formatLongDateUtc(event.dateISO, locale)
  return (
    <Box
      component="li"
      sx={{ display: 'grid', minWidth: 0 }}
    >
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
        {event.flyer && (
          <Box
            component="img"
            src={event.flyer.url}
            alt={event.flyer.alt}
            width={event.flyer.width}
            height={event.flyer.height}
            loading="lazy"
            sx={{ width: '100%', height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }}
          />
        )}
        <Box sx={{ p: 3, display: 'grid', gap: 1.5, minWidth: 0, overflowWrap: 'anywhere' }}>
          <Typography variant="h5" component="h3">
            {event.title}
            {event.by && (
              <Typography component="span" variant="body2" sx={{ color: 'band.muted', display: 'block' }}>
                {t('by', { name: event.by })}
              </Typography>
            )}
          </Typography>
          {event.role && (
            <Typography variant="subtitle1" component="p" sx={{ fontSize: '1rem', color: 'primary.main' }}>
              {event.role}
            </Typography>
          )}
          {(date || event.location || event.attendees !== null) && (
            <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
              {date && <Chip size="small" label={date} sx={QUIET_BAND_CHIP} />}
              {event.location && (
                <Chip
                  size="small"
                  icon={<MapPin size={14} aria-hidden="true" />}
                  label={event.location}
                  sx={QUIET_BAND_CHIP}
                />
              )}
              {event.attendees !== null && (
                <Chip
                  size="small"
                  icon={<Users size={14} aria-hidden="true" />}
                  label={t('attendees', { count: event.attendees })}
                  lang={locale === 'en' ? 'en' : undefined}
                  sx={QUIET_BAND_CHIP}
                />
              )}
            </Stack>
          )}
          {event.description && (
            <Typography variant="body2" sx={{ color: 'band.muted', lineHeight: '1.375rem' }}>
              {event.description}
            </Typography>
          )}
          {event.coSpeakers.length > 0 && (
            <Typography variant="body2" sx={{ color: 'band.muted' }}>
              {t('coSpeakers', { names: event.coSpeakers.join(', ') })}
            </Typography>
          )}
          {event.link && (
            <Box>
              <ExternalButton href={event.link}>{t('eventLink')}</ExternalButton>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Perfil de autor: PageHero (migas, h1 con el nombre, cargo como lead, bio,
 * anos de experiencia, enlaces sociales y enlaces internos) y las secciones de
 * credenciales, expertise, experiencia, educacion, eventos, entradas y casos.
 * El cierre (CtaSection) lo pone el Server Component de la ruta. No declara
 * landmark principal.
 *
 * Cada seccion sin datos no se dibuja ni deja un encabezado huerfano. Las
 * entradas y los casos entran COMPLETOS y en el HTML del servidor: no hay tope
 * de 50 ni boton de "ver mas" (SEO-03). Sin eyebrows del sandbox: Payload no
 * los tiene.
 *
 * Las ponencias (`speaking-events`) no se localizan: en EN se marcan con
 * `lang="es"` igual que en Sobre mi.
 */
export function AuthorProfileView({ crumbs, profile }: Props) {
  const t = useTranslations('authors.profile')
  const locale = useLocale()
  const talksLang = locale === 'en' ? 'es' : undefined

  const {
    name,
    jobTitle,
    paragraphs,
    avatar,
    yearsExperience,
    credentials,
    expertise,
    experience,
    education,
    events,
    social,
    posts,
    cases,
    isSitePerson,
  } = profile

  return (
    <>
      <PageHero
        crumbs={crumbs}
        title={name}
        lead={jobTitle ?? undefined}
        aside={
          avatar ? (
            <Box
              component="figure"
              sx={{ position: 'relative', m: 0, width: '100%', maxWidth: 320, justifySelf: 'center' }}
            >
              <GrainBlob feather={22} sx={{ inset: '-8%', zIndex: 0 }} />
              <Box
                component="img"
                src={avatar.url}
                alt={avatar.alt}
                width={avatar.width}
                height={avatar.height}
                loading="eager"
                fetchPriority="high"
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '1 / 1',
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
        {paragraphs.map((paragraph, i) => (
          <Typography
            key={`${i}-${paragraph.slice(0, 24)}`}
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 680, overflowWrap: 'anywhere' }}
          >
            {paragraph}
          </Typography>
        ))}
        {yearsExperience !== null && (
          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip label={t('years', { years: yearsExperience })} />
          </Stack>
        )}
        <SocialLinks name={name} links={social} />
        <Stack direction="row" useFlexGap spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          {isSitePerson && (
            <Button component={linkFor('/sobre-mi')} href="/sobre-mi" variant="contained">
              {t('aboutLink')}
            </Button>
          )}
          <Button component={linkFor('/stack')} href="/stack" variant={isSitePerson ? 'outlined' : 'contained'}>
            {t('stackLink')}
          </Button>
        </Stack>
      </PageHero>

      {credentials.length > 0 && (
        <Section id="author-credentials" title={t('credentialsTitle')}>
          <TechChips items={credentials} label={t('credentialsLabel')} />
        </Section>
      )}

      {expertise.length > 0 && (
        <Section id="author-expertise" title={t('expertiseTitle')}>
          <TechChips items={expertise} label={t('expertiseLabel')} />
        </Section>
      )}

      {experience.length > 0 && (
        <Section id="author-experience" title={t('experienceTitle')}>
          <AuthorTimeline items={experience} label={t('experienceLabel')} />
        </Section>
      )}

      {education.length > 0 && (
        <Section id="author-education" title={t('educationTitle')}>
          <AuthorTimeline items={education} label={t('educationLabel')} />
        </Section>
      )}

      {events.length > 0 && (
        <Section id="author-events" title={t('eventsTitle')} band>
          <UL
            aria-label={t('eventsLabel')}
            lang={talksLang}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))' },
              gap: 2,
            }}
          >
            {events.map((event) => (
              <EventCard key={`${event.title}-${event.by ?? ''}`} event={event} />
            ))}
          </UL>
        </Section>
      )}

      {posts.length > 0 && (
        <Section id="author-posts" title={t('postsTitle')}>
          <UL aria-label={t('postsLabel')} sx={GRID_3}>
            {posts.map((post) => (
              <li key={post.href}>
                <PostCard
                  href={post.href}
                  title={post.title}
                  excerpt={post.excerpt}
                  categoryLabel={post.categoryLabel}
                  dateISO={post.dateISO}
                  image={post.image}
                  headingLevel={3}
                />
              </li>
            ))}
          </UL>
        </Section>
      )}

      {cases.length > 0 && (
        <Section id="author-cases" title={t('casesTitle')}>
          <UL aria-label={t('casesLabel')} sx={GRID_3}>
            {cases.map((item) => (
              <li key={item.slug}>
                <CaseCard item={item} headingLevel={3} />
              </li>
            ))}
          </UL>
        </Section>
      )}
    </>
  )
}
