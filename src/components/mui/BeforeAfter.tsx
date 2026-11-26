// Sin 'use client' (fase 60): tarjetas, barras y tabla estaticas. Estilos en
// `src/theme/static.css`.
import { useLocale, useTranslations } from 'next-intl'
import type { CSSProperties } from 'react'

import type { CaseResultRow } from '@/lib/case-study-data'

type Props = {
  results: CaseResultRow[]
}

/** Cambio como porcentaje con signo en el idioma de la pagina ("+68 %" en espanol). */
export function formatChange(pct: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 0,
    signDisplay: 'exceptZero',
  }).format(pct)
}

function Bar({ share, strong }: { share: number; strong?: boolean }) {
  return (
    <div className="jt-bar" aria-hidden="true">
      <div className={strong ? 'jt-bar__fill--strong' : undefined} style={{ width: `${Math.max(2, share * 100)}%` }} />
    </div>
  )
}

function ValueRow({
  label,
  value,
  share,
  strong,
}: {
  label: string
  value: string
  share: number | null
  strong?: boolean
}) {
  return (
    <div className={share === null ? 'jt-result__row jt-result__row--nobar' : 'jt-result__row'}>
      <span className="jt-caption">{label}</span>
      {share !== null && <Bar share={share} strong={strong} />}
      <span className="jt-mono jt-result__value">{value}</span>
    </div>
  )
}

/**
 * Resultados antes y despues. Cada metrica es una tarjeta con su etiqueta
 * verbatim de Payload en un h3, el cambio calculado y dos barras con su valor
 * en texto. Todo lo grafico va `aria-hidden`: las barras son refuerzo visual, y
 * la alternativa textual para lector de pantalla es una tabla con `caption` y
 * `scope` (D-12, A11Y-DECISIONS "Barras antes y despues") visualmente oculta
 * que repite etiqueta, antes, despues y cambio de todas las metricas.
 *
 * Una fila sin base numerica (un guion, un texto) muestra sus valores sin barra
 * y sin porcentaje; la tabla los conserva tal como llegan.
 */
export function BeforeAfter({ results }: Props) {
  const t = useTranslations('cases.detail')
  const locale = useLocale()
  if (results.length === 0) return null

  return (
    <>
      <ul
        className="jt-grid jt-grid--upto3"
        role="list"
        style={{ '--jt-columns': Math.min(results.length, 3) } as CSSProperties}
      >
        {results.map((r, i) => (
          <li key={`${i}-${r.label}`} className="jt-card jt-result">
            <h3 className="jt-subtitle1">{r.label}</h3>
            <div className="jt-result__figures" aria-hidden="true">
              {r.pct !== null && <p className="jt-body1 jt-result__change">{formatChange(r.pct, locale)}</p>}
              <div className="jt-result__rows">
                <ValueRow label={t('before')} value={r.before} share={r.beforeShare} />
                <ValueRow label={t('after')} value={r.after} share={r.afterShare} strong />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="jt-sr-only">
        <table className="jt-table">
          <caption>{t('resultsCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('metricColumn')}</th>
              <th scope="col">{t('before')}</th>
              <th scope="col">{t('after')}</th>
              <th scope="col">{t('changeColumn')}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={`${i}-${r.label}`}>
                <th scope="row">{r.label}</th>
                <td>{r.before}</td>
                <td>{r.after}</td>
                <td>{r.pct === null ? t('noBase') : formatChange(r.pct, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
