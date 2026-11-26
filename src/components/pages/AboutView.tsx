// Sin 'use client' (fase 60): la vista es estatica. Solo los botones, el blob de
// grano, el aviso de traduccion y el cierre con formulario son componentes
// cliente. Estilos en `src/theme/static.css`. El recorrido conserva las clases de
// `Timeline` de `@mui/lab`, que usan los contratos de verify.
import Button from '@mui/material/Button'
import { Briefcase, ExternalLink, Globe, GraduationCap, MapPin, Mic, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { CtaSection } from '@/components/mui/CtaSection'
import { GrainBlob } from '@/components/mui/GrainBlob'
import { PageHero } from '@/components/mui/PageHero'
import { TranslationNotice } from '@/components/mui/TranslationNotice'
import { LinkButton } from '@/components/static/LinkButton'
import { cloudinarySrcSet, cloudinaryWidth } from '@/lib/cloudinary-resize'
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
    <section className={band ? 'jt-block jt-band' : 'jt-block'} aria-labelledby={`${id}-t`} id={id}>
      <div className="jt-container">
        <h2 id={`${id}-t`} className="jt-h3 jt-block__title" lang={lang}>
          {icon}
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}

function CounterCard({ counter, display }: { counter: AboutCounter; display: string }) {
  return (
    // dt primero en el código fuente y la cifra primero en pantalla (order).
    <div className="jt-card jt-about-counter">
      <dt className="jt-body2">{counter.label}</dt>
      <dd className="jt-body1 jt-about-counter__value">{display}</dd>
    </div>
  )
}

function StageContent({ stage, last }: { stage: AboutStage; last: boolean }) {
  const tCommon = useTranslations('common')
  const link = stage.link
  return (
    <div
      className={
        last
          ? 'jt-body1 jt-timeline__content jt-timeline__content--last MuiTimelineContent-root'
          : 'jt-body1 jt-timeline__content MuiTimelineContent-root'
      }
    >
      {stage.when && (
        <span
          className={
            stage.current ? 'jt-overline jt-timeline__when jt-timeline__when--current' : 'jt-overline jt-timeline__when'
          }
        >
          {stage.when}
        </span>
      )}
      <h3 className="jt-h5">{stage.role}</h3>
      {stage.org && <p className="jt-body1 jt-semibold">{stage.org}</p>}
      {stage.body && <p className="jt-body1 jt-timeline__body">{stage.body}</p>}
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
            <span className="jt-sr-only">
              {' '}
              ({tCommon('opensInNewTab')})
            </span>
          </Button>
        ) : (
          <LinkButton href={link.href} variant="text" size="small" sx={{ px: 0, mt: 1 }}>
            {link.label}
          </LinkButton>
        ))}
    </div>
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
            <figure className="jt-about-figure">
              <GrainBlob feather={22} sx={{ inset: '-8%', zIndex: 0 }} />
              <img
                className="jt-about-photo"
                src={cloudinaryWidth(hero.photo.url, 840)}
                srcSet={cloudinarySrcSet(hero.photo.url, [420, 640, 840])}
                sizes="(min-width: 600px) 420px, 100vw"
                alt={hero.photo.alt}
                width={hero.photo.width}
                height={hero.photo.height}
                loading="eager"
                fetchPriority="high"
              />
            </figure>
          ) : undefined
        }
      >
        {hero.chips.length > 0 && (
          <div className="jt-row jt-row--center" lang={copyLang}>
            {hero.chips.map((chip) => (
              <div key={chip.label} className="jt-chip">
                {chip.icon === 'map-pin' ? (
                  <MapPin size={16} aria-hidden="true" />
                ) : chip.icon === 'globe' ? (
                  <Globe size={16} aria-hidden="true" />
                ) : null}
                <span className="jt-chip__label">{chip.label}</span>
              </div>
            ))}
          </div>
        )}
      </PageHero>

      {showBioBlock && (
        <section
          className="jt-about-bio"
          {...(bio?.title ? { 'aria-labelledby': 'about-bio-t' } : { 'aria-label': data.name })}
        >
          <div
            className={
              bio && counterCards.length > 0
                ? 'jt-container jt-about-bio__grid jt-about-bio__grid--split'
                : 'jt-container jt-about-bio__grid'
            }
          >
            {bio && (
              <div className="jt-about-bio__text">
                {bio.title && (
                  <h2 id="about-bio-t" className="jt-h3" lang={copyLang}>
                    {bio.title}
                  </h2>
                )}
                {bio.paragraphs.map((paragraph, i) => (
                  <p key={`${i}-${paragraph.slice(0, 24)}`} className="jt-body1">
                    {paragraph}
                  </p>
                ))}
                <div className="jt-row jt-about-bio__actions">
                  <LinkButton href={servicesHref} variant="contained">
                    {t('seeServices')}
                  </LinkButton>
                  <LinkButton href="/stack" variant="outlined">
                    {t('myStack')}
                  </LinkButton>
                </div>
              </div>
            )}
            {counterCards.length > 0 && (
              <dl className="jt-about-counters" lang={copyLang}>
                {counterCards.map((card) => (
                  <CounterCard key={card.key} counter={card.counter} display={card.display} />
                ))}
              </dl>
            )}
          </div>
        </section>
      )}

      {specialties && (
        <Block id="about-areas" title={specialties.title} band lang={copyLang}>
          <ul className="jt-grid jt-grid--areas" role="list" lang={copyLang}>
            {specialties.items.map((item) => (
              <li key={item.title} className="jt-band-card">
                <h3 className="jt-h6">{item.title}</h3>
                {item.detail && <p className="jt-body2 jt-band-muted">{item.detail}</p>}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {experience && (
        <Block
          id="about-experience"
          title={experience.title}
          icon={<Briefcase size={28} aria-hidden="true" />}
          lang={copyLang}
        >
          <div lang={copyLang}>
            {experience.lead && <p className="jt-body1 jt-experience-lead">{experience.lead}</p>}
            <ul className="jt-timeline MuiTimeline-root" aria-label={t('timelineLabel')}>
              {experience.stages.map((stage, i) => {
                const last = i === experience.stages.length - 1
                return (
                  <li key={`${i}-${stage.org ?? ''}-${stage.role}`} className="jt-timeline__item MuiTimelineItem-root">
                    <div className="jt-timeline__separator" aria-hidden="true">
                      <span
                        className="jt-timeline__dot MuiTimelineDot-root"
                        data-current={stage.current ? 'true' : 'false'}
                      />
                      {!last && <span className="jt-timeline__connector" />}
                    </div>
                    <StageContent stage={stage} last={last} />
                  </li>
                )
              })}
            </ul>
          </div>
        </Block>
      )}
      {education && (
        <Block
          id="about-education"
          title={education.title}
          icon={<GraduationCap size={28} aria-hidden="true" />}
          lang={copyLang}
        >
          <ul className="jt-grid jt-grid--two" role="list">
            {education.items.map((item) => {
              const dates = dateLine(item.dates)
              return (
                <li key={`${item.degree}-${item.institution ?? ''}`} className="jt-card jt-education">
                  <h3 className="jt-h6">{item.degree}</h3>
                  {item.institution && <p className="jt-body1">{item.institution}</p>}
                  {dates && <p className="jt-body2">{dates}</p>}
                </li>
              )
            })}
          </ul>
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
          <ul className="jt-grid jt-grid--two" role="list" lang={talksLang}>
            {talks.items.map((talk) => (
              <li key={`${talk.title}-${talk.by ?? ''}`} className="jt-talk">
                <div className="jt-talk__card">
                  {talk.flyer && (
                    <img
                      className="jt-talk__flyer"
                      src={talk.flyer.url}
                      alt={talk.flyer.alt}
                      width={talk.flyer.width}
                      height={talk.flyer.height}
                      loading="lazy"
                    />
                  )}
                  <div className="jt-talk__body">
                    <h3 className="jt-h5">
                      {talk.title}
                      {talk.by && <span className="jt-body2 jt-talk__by">{t('by', { name: talk.by })}</span>}
                    </h3>
                    {talk.role && <p className="jt-subtitle1 jt-talk__role">{talk.role}</p>}
                    {(talk.location || talk.attendees !== null) && (
                      <div className="jt-row jt-row--tight">
                        {talk.location && (
                          <div className="jt-chip jt-chip--small jt-chip--band">
                            <MapPin size={14} aria-hidden="true" />
                            <span className="jt-chip__label">{talk.location}</span>
                          </div>
                        )}
                        {talk.attendees !== null && (
                          <div className="jt-chip jt-chip--small jt-chip--band" lang={talksLang ? locale : undefined}>
                            <Users size={14} aria-hidden="true" />
                            <span className="jt-chip__label">{t('attendees', { count: talk.attendees })}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {talk.description && <p className="jt-body2 jt-talk__description">{talk.description}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
