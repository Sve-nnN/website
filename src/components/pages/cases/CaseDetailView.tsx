// Sin 'use client' (fase 60): la vista es estatica. Solo el avatar, el boton, el
// blob de grano y la region desplazable de la tabla son componentes cliente.
// Estilos en `src/theme/static.css`.
import Avatar from '@mui/material/Avatar'
import { ArrowRight, Lightbulb, Quote } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CSSProperties, ReactNode } from 'react'

import { BeforeAfter } from '@/components/mui/BeforeAfter'
import type { Crumb } from '@/components/mui/Crumbs'
import { GrainBlob } from '@/components/mui/GrainBlob'
import { PageHero } from '@/components/mui/PageHero'
import { Section } from '@/components/mui/Section'
import { AppLink } from '@/components/static/AppLink'
import { LinkButton } from '@/components/static/LinkButton'
import type { CaseComparison, CaseDetailProps, CaseIndexItem } from '@/lib/case-study-data'

import { CaseCaptureFigure } from './CaseCaptureFigure'
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

/** Columnas desde `md` para las rejillas que dependen del numero de elementos. */
const columns = (n: number) => ({ '--jt-columns': n }) as CSSProperties

/** Lista con un punto de color a la izquierda, sobre la franja `band`. */
function DotList({ items, label }: { items: string[]; label: string }) {
  return (
    <ul className="jt-dotlist" role="list" aria-label={label}>
      {items.map((text, i) => (
        <li key={`${i}-${text}`}>
          <div className="jt-dotlist__dot" aria-hidden="true" />
          <p className="jt-body2 jt-dotlist__text">{text}</p>
        </li>
      ))}
    </ul>
  )
}

/**
 * Detalle de un caso de exito (D-08). Orden: hero con la cifra y el subtitulo,
 * KPIs, captura de Search Console (solo si el caso la tiene), contexto y reto, solucion, testimonio, resultados antes y despues,
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
            <div className="jt-case-metric">
              <GrainBlob feather={24} sx={{ inset: '-6%', zIndex: 0 }} />
              <div className="jt-case-metric__inner">
                <p
                  className={
                    long
                      ? 'jt-body1 jt-case-metric__value jt-case-metric__value--long'
                      : 'jt-body1 jt-case-metric__value'
                  }
                >
                  {c.metric}
                </p>
                {c.metricLabel && <p className="jt-subtitle1 jt-case-metric__label">{c.metricLabel}</p>}
              </div>
            </div>
          ) : undefined
        }
      />

      {c.kpis.length > 0 && (
        <Section id="numeros" title={t('statsTitle')}>
          <dl className="jt-case-kpis" style={columns(Math.min(c.kpis.length, 4))}>
            {c.kpis.map((k, i) => (
              <div key={`${i}-${k.label}`} className="jt-card jt-case-kpi">
                <dt className="jt-body2">{k.label}</dt>
                <dd className="jt-body1 jt-case-kpi__value">{k.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {c.capture && (
        <Section id="captura" title={t('captureTitle')}>
          <CaseCaptureFigure capture={c.capture} periodMeasured={c.periodAfter} periodCompared={c.periodBefore} />
        </Section>
      )}

      {(hasClient || hasChallenge) && (
        <Section
          id="contexto"
          band
          title={hasClient && hasChallenge ? t('contextTitle') : hasClient ? t('clientTitle') : t('challengeTitle')}
        >
          <div className={hasClient && hasChallenge ? 'jt-case-context jt-case-context--split' : 'jt-case-context'}>
            {hasClient && (
              <div className="jt-stack">
                {hasChallenge && <h3 className="jt-h5">{t('clientTitle')}</h3>}
                {clientContent}
              </div>
            )}
            {hasChallenge && (
              <div className="jt-stack">
                {hasClient && <h3 className="jt-h5">{t('challengeTitle')}</h3>}
                <DotList items={c.challenge} label={t('challengeTitle')} />
              </div>
            )}
          </div>
        </Section>
      )}

      {c.solution.length > 0 && (
        <Section id="solucion" title={t('solutionTitle')}>
          <ol className="jt-grid jt-grid--upto3" role="list" style={columns(Math.min(c.solution.length, 3))}>
            {c.solution.map((s, i) => (
              <li key={`${i}-${s.title}`} className="jt-card jt-case-step">
                <span className="jt-body1 jt-case-step__number" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="jt-h6">{s.title}</h3>
                <p className="jt-body2 jt-case-step__body">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {c.testimonial && (
        <div className="jt-case-quote-wrap">
          <div className="jt-container">
            <figure className="jt-card jt-case-quote">
              <div className="jt-case-quote__icon" aria-hidden="true">
                <Quote size={28} />
              </div>
              <blockquote className="jt-h5 jt-case-quote__text">{`“${c.testimonial.quote}”`}</blockquote>
              <figcaption>
                <p className="jt-subtitle1 jt-case-quote__author">{c.testimonial.authorName}</p>
                {c.testimonial.authorRole && <p className="jt-body2">{c.testimonial.authorRole}</p>}
              </figcaption>
            </figure>
          </div>
        </div>
      )}

      {c.results.length > 0 && (
        <Section id="resultados" title={t('resultsTitle')}>
          {periods && <p className="jt-body2 jt-case-periods">{periods}</p>}
          <BeforeAfter results={c.results} />
        </Section>
      )}

      {comparison && (
        <Section id="comparar" title={t('compareTitle')}>
          <p className="jt-body1 jt-compare-intro">
            {comparison.rankPct !== null
              ? t('compareRankBoth', {
                  pct: comparison.rankPct,
                  pctTotal: comparison.totalPct,
                  abs: comparison.rankAbs,
                  absTotal: comparison.totalAbs,
                })
              : t('compareRankAbs', { abs: comparison.rankAbs, absTotal: comparison.totalAbs })}
          </p>
          <CaseCompareTable comparison={comparison} />
          {comparison.excluded > 0 && <span className="jt-caption jt-compare-note">{t('compareNote')}</span>}
        </Section>
      )}

      {c.lessons && c.lessons.length > 0 && (
        <Section id="lecciones" band title={t('lessonsTitle')}>
          <ul className="jt-grid jt-grid--upto3" role="list" style={columns(Math.min(c.lessons.length, 3))}>
            {c.lessons.map((l, i) => (
              <li key={`${i}-${l.title}`} className="jt-lesson">
                <div className="jt-lesson__icon" aria-hidden="true">
                  <Lightbulb size={18} />
                </div>
                <h3 className="jt-h6">{l.title}</h3>
                <p className="jt-body2 jt-lesson__body">{l.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {conclusionContent && (
        <Section id="conclusion" title={t('conclusionTitle')}>
          {conclusionContent}
        </Section>
      )}

      {c.author && (
        <aside className="jt-case-author-wrap" aria-labelledby="autor-t">
          <div className="jt-container">
            <div
              className={
                c.author.avatar ? 'jt-card jt-case-author jt-case-author--avatar' : 'jt-card jt-case-author'
              }
            >
              {c.author.avatar && <Avatar src={c.author.avatar.url} alt="" sx={{ width: 72, height: 72 }} />}
              <div className="jt-case-author__text">
                <p className="jt-overline jt-accent">{t('authorLabel')}</p>
                <h2 id="autor-t" className="jt-h5">
                  <AppLink className="jt-link jt-link--hover jt-inherit" href={c.author.href}>
                    {c.author.name}
                  </AppLink>
                </h2>
                {c.author.jobTitle && <p className="jt-body2">{c.author.jobTitle}</p>}
                {c.author.bio && <p className="jt-body1">{c.author.bio}</p>}
              </div>
            </div>
          </div>
        </aside>
      )}

      {related.length > 0 && (
        <section className="jt-case-more" aria-labelledby="mas-t">
          <div className="jt-container">
            <div className="jt-case-more__head">
              <h2 id="mas-t" className="jt-h4">
                {t('moreTitle')}
              </h2>
              <LinkButton
                href="/case-studies"
                variant="outlined"
                endIcon={<ArrowRight size={18} aria-hidden="true" />}
              >
                {t('viewAll')}
              </LinkButton>
            </div>
            <ul className="jt-grid jt-grid--cases" role="list">
              {related.map((item) => (
                <li key={item.slug}>
                  <CaseCard item={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
