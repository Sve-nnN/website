'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useLocale, useTranslations } from 'next-intl'

import { UL } from '@/components/mui/lists'
import { visuallyHidden } from '@/components/mui/ScoreRing'
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
    <Box aria-hidden="true" sx={{ height: 12, borderRadius: 9999, bgcolor: 'raised', overflow: 'hidden' }}>
      <Box
        sx={{
          width: `${Math.max(2, share * 100)}%`,
          height: '100%',
          borderRadius: 9999,
          bgcolor: strong ? 'primary.main' : 'fieldBorder',
        }}
      />
    </Box>
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: share === null ? '72px minmax(0,1fr)' : '72px minmax(0,1fr) auto',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {share !== null && <Bar share={share} strong={strong} />}
      <Typography
        variant="mono"
        sx={{ minWidth: share === null ? 0 : 64, textAlign: share === null ? 'left' : 'right', overflowWrap: 'anywhere' }}
      >
        {value}
      </Typography>
    </Box>
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
      <UL
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0,1fr)',
            md: `repeat(${Math.min(results.length, 3)}, minmax(0,1fr))`,
          },
          gap: 2,
        }}
      >
        {results.map((r, i) => (
          <Card key={`${i}-${r.label}`} component="li" sx={{ p: 3, display: 'grid', gap: 2.5, alignContent: 'start' }}>
            <Typography variant="subtitle1" component="h3">
              {r.label}
            </Typography>
            <Box aria-hidden="true" sx={{ display: 'grid', gap: 2.5 }}>
              {r.pct !== null && (
                <Typography component="p" sx={{ fontSize: '3rem', lineHeight: 1, fontWeight: 600, color: 'accentText' }}>
                  {formatChange(r.pct, locale)}
                </Typography>
              )}
              <Box sx={{ display: 'grid', gap: 1 }}>
                <ValueRow label={t('before')} value={r.before} share={r.beforeShare} />
                <ValueRow label={t('after')} value={r.after} share={r.afterShare} strong />
              </Box>
            </Box>
          </Card>
        ))}
      </UL>
      <Box sx={visuallyHidden}>
        <Table>
          <Box component="caption">{t('resultsCaption')}</Box>
          <TableHead>
            <TableRow>
              <TableCell scope="col">{t('metricColumn')}</TableCell>
              <TableCell scope="col">{t('before')}</TableCell>
              <TableCell scope="col">{t('after')}</TableCell>
              <TableCell scope="col">{t('changeColumn')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r, i) => (
              <TableRow key={`${i}-${r.label}`}>
                <TableCell component="th" scope="row">
                  {r.label}
                </TableCell>
                <TableCell>{r.before}</TableCell>
                <TableCell>{r.after}</TableCell>
                <TableCell>{r.pct === null ? t('noBase') : formatChange(r.pct, locale)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  )
}
