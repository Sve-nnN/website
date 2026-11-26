// Server Component (como el resto del detalle, fase 60): solo `ScrollRegion` es
// cliente. Estilos en `src/theme/static.css`.
import { useLocale, useTranslations } from 'next-intl'
import type { CSSProperties } from 'react'

import { ScrollRegion } from '@/components/mui/ScrollRegion'
import { formatIsoRange, type CaseCapture } from '@/lib/case-capture'
import { cloudinarySrcSet } from '@/lib/cloudinary-resize'

type Props = {
  capture: CaseCapture
  /** `results.periodAfter` del caso. null si no esta cargado. */
  periodMeasured: string | null
  /** `results.periodBefore` del caso. null si no esta cargado. */
  periodCompared: string | null
}

/**
 * Captura de Search Console con su pie. Por debajo de la mitad de su ancho en
 * pixeles (el tamano al que se vio en pantalla) la imagen no se encoge mas: se
 * desplaza en horizontal, para que las cifras sigan legibles en un telefono. El
 * enlace del pie abre el archivo completo. El pie solo repite lo que el caso
 * tiene guardado: sin periodo cargado queda la fuente sola.
 */
export function CaseCaptureFigure({ capture, periodMeasured, periodCompared }: Props) {
  const t = useTranslations('cases.detail')
  const locale = useLocale()
  const { url, alt, width, height } = capture
  const min = Math.round(width / 2)
  const period = (value: string) => {
    const range = formatIsoRange(value, locale)
    return range ? t('captureRange', range) : value
  }

  return (
    <figure className="jt-capture" style={{ '--jt-capture-min': `${min}px` } as CSSProperties}>
      <div className="jt-capture__frame">
        <ScrollRegion label={t('captureScrollLabel')}>
          <img
            className="jt-capture__img"
            src={url}
            srcSet={cloudinarySrcSet(url, [min, 1100, width].filter((w) => w <= width))}
            sizes={`(max-width: 827px) ${min}px, (max-width: 1199px) calc(100vw - 74px), 1126px`}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
          />
        </ScrollRegion>
      </div>
      <figcaption className="jt-capture__caption">
        <p className="jt-body2 jt-capture__hint">{t('captureScrollHint')}</p>
        <p className="jt-body2 jt-secondary">
          {[
            t('captureSource'),
            periodMeasured ? t('captureMeasured', { period: period(periodMeasured) }) : null,
            periodCompared ? t('captureCompared', { period: period(periodCompared) }) : null,
          ]
            .filter(Boolean)
            .join(' ')}
        </p>
        <p className="jt-body2">
          <a className="jt-link jt-link--always jt-accent jt-capture__full" href={url}>
            {t('captureFull', { width: String(width), height: String(height) })}
          </a>
        </p>
      </figcaption>
    </figure>
  )
}
