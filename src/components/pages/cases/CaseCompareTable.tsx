'use client'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useLocale, useTranslations } from 'next-intl'

import { formatChange } from '@/components/mui/BeforeAfter'
import { linkFor } from '@/components/mui/links'
import { ScrollRegion } from '@/components/mui/ScrollRegion'
import type { CaseComparison } from '@/lib/case-study-data'

type Props = {
  comparison: CaseComparison
}

const MONO = { fontFamily: 'var(--font-geist-mono)' } as const

/**
 * Tabla comparativa de clics organicos anuales entre casos (D-09, D-29).
 * Lleva `caption`, `scope="col"` en los encabezados y `scope="row"` en la
 * primera celda de cada fila, y va dentro de `ScrollRegion`, que solo se vuelve
 * enfocable cuando la tabla desborda. Las barras de escala son refuerzo visual:
 * su columna entera es `aria-hidden` y el numero esta en texto. El caso actual
 * se marca con texto ("Este caso") y `aria-current`, no solo con color.
 *
 * Los enlaces a los otros casos usan `linkFor`; el caso actual no es enlace.
 */
export function CaseCompareTable({ comparison }: Props) {
  const t = useTranslations('cases.detail')
  const locale = useLocale()

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <ScrollRegion label={t('compareScrollLabel')}>
        <Table sx={{ minWidth: 640 }}>
          <Box
            component="caption"
            sx={{ captionSide: 'top', textAlign: 'left', px: 2, py: 1.5, color: 'text.secondary', fontSize: '0.875rem', lineHeight: '1.25rem' }}
          >
            {t('compareCaption')}
          </Box>
          <TableHead>
            <TableRow>
              <TableCell scope="col">{t('caseColumn')}</TableCell>
              <TableCell scope="col">{t('sectorColumn')}</TableCell>
              <TableCell scope="col" align="right">
                {t('before')}
              </TableCell>
              <TableCell scope="col" align="right">
                {t('after')}
              </TableCell>
              <TableCell scope="col" align="right">
                {t('changeColumn')}
              </TableCell>
              <TableCell scope="col" aria-hidden="true" sx={{ display: { xs: 'none', md: 'table-cell' }, minWidth: 160 }}>
                {t('scaleColumn')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comparison.rows.map((r) => (
              <TableRow key={r.slug} sx={r.current ? { bgcolor: 'raised' } : undefined}>
                <TableCell component="th" scope="row" sx={{ minWidth: 220 }}>
                  {r.current ? (
                    <Box sx={{ display: 'grid', gap: 0.5 }}>
                      <Typography variant="body2" aria-current="page" sx={{ fontWeight: 600 }}>
                        {r.title}
                      </Typography>
                      <Chip label={t('compareThis')} size="small" sx={{ justifySelf: 'start' }} />
                    </Box>
                  ) : (
                    <Link
                      component={linkFor(`/case-studies/${r.slug}`)}
                      href={`/case-studies/${r.slug}`}
                      underline="hover"
                      sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.875rem' }}
                    >
                      {r.title}
                    </Link>
                  )}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.sector}</TableCell>
                <TableCell align="right" sx={MONO}>
                  {r.before}
                </TableCell>
                <TableCell align="right" sx={{ ...MONO, fontWeight: 600 }}>
                  {r.after}
                </TableCell>
                <TableCell align="right" sx={{ ...MONO, color: 'accentText', fontWeight: 600 }}>
                  {r.pct === null ? t('compareNoBase') : formatChange(r.pct, locale)}
                </TableCell>
                <TableCell aria-hidden="true" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <Box sx={{ height: 10, borderRadius: 9999, bgcolor: 'raised', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${Math.max(2, r.share * 100)}%`,
                        height: '100%',
                        borderRadius: 9999,
                        bgcolor: r.current ? 'primary.main' : 'fieldBorder',
                      }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollRegion>
    </Box>
  )
}
