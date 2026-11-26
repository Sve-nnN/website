// Sin 'use client' (fase 60): tabla estatica; solo `ScrollRegion` es cliente.
// Estilos en `src/theme/static.css`.
import { useLocale, useTranslations } from 'next-intl'

import { formatChange } from '@/components/mui/BeforeAfter'
import { ScrollRegion } from '@/components/mui/ScrollRegion'
import { AppLink } from '@/components/static/AppLink'
import type { CaseComparison } from '@/lib/case-study-data'

type Props = {
  comparison: CaseComparison
}

/**
 * Tabla comparativa de clics organicos anuales entre casos (D-09, D-29).
 * Lleva `caption`, `scope="col"` en los encabezados y `scope="row"` en la
 * primera celda de cada fila, y va dentro de `ScrollRegion`, que solo se vuelve
 * enfocable cuando la tabla desborda. Las barras de escala son refuerzo visual:
 * su columna entera es `aria-hidden` y el numero esta en texto. El caso actual
 * se marca con texto ("Este caso") y `aria-current`, no solo con color.
 *
 * Los enlaces a los otros casos usan `AppLink`; el caso actual no es enlace.
 */
export function CaseCompareTable({ comparison }: Props) {
  const t = useTranslations('cases.detail')
  const locale = useLocale()

  return (
    <div className="jt-compare">
      <ScrollRegion label={t('compareScrollLabel')}>
        <table className="jt-table">
          <caption>{t('compareCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('caseColumn')}</th>
              <th scope="col">{t('sectorColumn')}</th>
              <th scope="col" className="jt-cell--right">
                {t('before')}
              </th>
              <th scope="col" className="jt-cell--right">
                {t('after')}
              </th>
              <th scope="col" className="jt-cell--right">
                {t('changeColumn')}
              </th>
              <th scope="col" aria-hidden="true" className="jt-cell--scale">
                {t('scaleColumn')}
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((r) => (
              <tr key={r.slug} className={r.current ? 'jt-compare__current' : undefined}>
                <th scope="row" className="jt-cell--case">
                  {r.current ? (
                    <div className="jt-compare__this">
                      <p className="jt-body2 jt-compare__title" aria-current="page">
                        {r.title}
                      </p>
                      <div className="jt-chip jt-chip--small jt-justify-start">
                        <span className="jt-chip__label">{t('compareThis')}</span>
                      </div>
                    </div>
                  ) : (
                    <AppLink className="jt-link jt-link--hover jt-compare__link" href={`/case-studies/${r.slug}`}>
                      {r.title}
                    </AppLink>
                  )}
                </th>
                <td className="jt-cell--nowrap">{r.sector}</td>
                <td className="jt-cell--right jt-cell--mono">{r.before}</td>
                <td className="jt-cell--right jt-cell--mono jt-cell--strong">{r.after}</td>
                <td className="jt-cell--right jt-cell--mono jt-cell--accent">
                  {r.pct === null ? t('compareNoBase') : formatChange(r.pct, locale)}
                </td>
                <td aria-hidden="true" className="jt-cell--scale">
                  <div className="jt-bar jt-bar--thin">
                    <div
                      className={r.current ? 'jt-bar__fill--strong' : undefined}
                      style={{ width: `${Math.max(2, r.share * 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    </div>
  )
}
