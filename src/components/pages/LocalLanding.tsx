'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'

import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { splitInlineStat } from '@/lib/local-landing-view'
import { isPlaceholder, omitPlaceholder, withoutPlaceholders } from '@/lib/placeholder'

/**
 * Estadística del hero como aside. La cifra de 72px solo se pinta si el texto
 * empieza con un número; el caption nombra el landmark. Con texto vacío o con un
 * marcador `[PLACEHOLDER]` no renderiza nada (Madrid hoy).
 */
export function LocalHeroStat({ text }: { text: string | null | undefined }) {
  if (!text || isPlaceholder(text)) return null
  const { figure, caption } = splitInlineStat(text)
  if (!figure && !caption) return null
  return (
    <Card
      component="aside"
      {...(caption ? { 'aria-labelledby': 'local-stat-caption' } : { 'aria-label': figure ?? undefined })}
      sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 1.5, boxShadow: '0 24px 48px -24px rgba(0,0,0,0.25)' }}
    >
      {figure && (
        <Typography
          component="p"
          sx={{ fontSize: 72, fontWeight: 600, lineHeight: 1, color: 'accentText', fontVariantNumeric: 'tabular-nums' }}
        >
          {figure}
        </Typography>
      )}
      {caption && (
        <Typography id="local-stat-caption" variant="body2" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Card>
  )
}

export type LocalAction = { label: string; href: string; appearance: 'primary' | 'outline' }

/** Enlaces del hero (los botones del bloque anterior). Sin enlaces no renderiza nada. */
export function LocalHeroActions({ actions }: { actions: LocalAction[] }) {
  if (actions.length === 0) return null
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {actions.map((a) => (
        <Button
          key={`${a.href}-${a.label}`}
          component={linkFor(a.href)}
          href={a.href}
          variant={a.appearance === 'primary' ? 'contained' : 'outlined'}
          size="large"
          endIcon={a.appearance === 'primary' ? <ArrowRight size={20} aria-hidden="true" /> : undefined}
        >
          {a.label}
        </Button>
      ))}
    </Box>
  )
}

type ProofStat = { id?: string | null; value?: string | null; label?: string | null }
type ProofTestimonial = {
  quote?: string | null
  authorName?: string | null
  authorBusiness?: string | null
} | null

/**
 * Prueba local: franja `band` con tarjetas de estadística y, si existe y no es un
 * marcador, la cita. TODO dato pasa por `withoutPlaceholders` e `isPlaceholder`
 * antes de pintarse. Si no queda nada real devuelve null, sin encabezado ni hueco.
 */
export function LocalProof({
  stats,
  testimonial,
}: {
  stats: ProofStat[] | null | undefined
  testimonial: ProofTestimonial | undefined
}) {
  const real = withoutPlaceholders(stats ?? [], ['value', 'label']).filter(
    (s) => (s.value ?? '').trim() !== '' && (s.label ?? '').trim() !== '',
  )
  const quote = testimonial?.quote && !isPlaceholder(testimonial.quote) ? testimonial.quote.trim() : ''
  if (real.length === 0 && quote === '') return null

  const authorName = omitPlaceholder(testimonial?.authorName)
  const authorBusiness = omitPlaceholder(testimonial?.authorBusiness)

  return (
    <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'band.bg', color: 'band.text' }}>
      <Container maxWidth="lg" sx={{ display: 'grid', gap: 4 }}>
        {real.length > 0 && (
          <UL
            role="list"
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0,1fr)',
                md: `repeat(${Math.min(real.length, 3)}, minmax(0,1fr))`,
              },
              gap: 2,
            }}
          >
            {real.map((s, i) => (
              <Box key={s.id ?? i} component="li" sx={{ display: 'grid' }}>
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'band.border',
                    bgcolor: 'band.surface',
                    display: 'grid',
                    gap: 1,
                    alignContent: 'start',
                  }}
                >
                  <Typography
                    component="p"
                    sx={{ fontSize: 48, fontWeight: 600, lineHeight: 1.1, color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {s.value}
                  </Typography>
                  <Typography variant="body2" component="p" sx={{ color: 'band.muted' }}>
                    {s.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </UL>
        )}
        {quote !== '' && (
          <Box
            component="figure"
            sx={{
              m: 0,
              p: 4,
              maxWidth: 760,
              borderRadius: 2,
              border: 1,
              borderColor: 'band.border',
              bgcolor: 'band.surface',
              display: 'grid',
              gap: 3,
            }}
          >
            <Typography component="blockquote" variant="h5" sx={{ m: 0 }}>
              {quote}
            </Typography>
            {(authorName || authorBusiness) && (
              <Box component="figcaption">
                {authorName && (
                  <Typography variant="body1" component="p" sx={{ fontWeight: 600 }}>
                    {authorName}
                  </Typography>
                )}
                {authorBusiness && (
                  <Typography variant="body2" component="p" sx={{ color: 'band.muted' }}>
                    {authorBusiness}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  )
}
