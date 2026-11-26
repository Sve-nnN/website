// Sin 'use client' (fase 60): tarjeta estatica. Estilos en
// `src/theme/static.css`.
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AppLink } from '@/components/static/AppLink'
import type { CaseIndexItem } from '@/lib/case-study-data'

type Props = {
  item: CaseIndexItem
  /** Tarjeta destacada: franja oscura. La cifra sigue a 72 px (escala aceptada). */
  featured?: boolean
  /** Nivel del encabezado del titulo. 3 por defecto (h1 de la pagina, h2 de la seccion). */
  headingLevel?: 2 | 3
}

// Una cifra que no se pudo separar de su etiqueta ("0 a 56 clics") llega entera
// y no cabe a 72 px en una tarjeta de tres columnas: baja a 48 px, que es parte
// de la escala display aceptada el 2026-11-08.
const LONG_METRIC = 9

/**
 * Tarjeta de caso: sector, cifra de cabeza, titulo con enlace estirado,
 * subtitulo y una senal de lectura. El enlace vive en el titulo y su pseudo
 * elemento cubre la tarjeta; el `outline` del enlace queda en none y el foco
 * se dibuja en la tarjeta con `:has(a:focus-visible)`. El nombre accesible del
 * enlace es el titulo visible.
 */
export function CaseCard({ item, featured, headingLevel = 3 }: Props) {
  const t = useTranslations('cases.index')
  const href = `/case-studies/${item.slug}`
  const heading = `h${headingLevel}` as 'h2' | 'h3'
  const long = item.metric.length > LONG_METRIC

  const Variant = featured ? 'jt-h4' : 'jt-h6'
  const Heading = heading

  return (
    <div className={featured ? 'jt-card jt-casecard jt-casecard--featured' : 'jt-card jt-casecard'}>
      {item.sector && (
        <div
          className={
            featured
              ? 'jt-chip jt-chip--small jt-chip--band jt-casecard__sector'
              : 'jt-chip jt-chip--small jt-casecard__sector'
          }
        >
          <span className="jt-chip__label">{item.sector}</span>
        </div>
      )}
      {item.metric && (
        <div className="jt-casecard__figure">
          <p
            className={
              long
                ? 'jt-body1 jt-casecard__metric jt-casecard__metric--long'
                : 'jt-body1 jt-casecard__metric'
            }
          >
            {item.metric}
          </p>
          {item.metricLabel && <p className="jt-body2 jt-casecard__label">{item.metricLabel}</p>}
        </div>
      )}
      <Heading className={Variant}>
        <AppLink className="jt-link jt-casecard__link jt-stretched" href={href}>
          {item.title}
        </AppLink>
      </Heading>
      {item.subtitle && <p className="jt-body2 jt-casecard__subtitle">{item.subtitle}</p>}
      <p className="jt-body2 jt-casecard__more" aria-hidden="true">
        {t('viewCase')} <ArrowRight size={16} />
      </p>
    </div>
  )
}
