'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { linkFor } from '@/components/mui/links'
import type { BlogPostItem } from '@/lib/blog-data'

type Props = {
  /** Entrada publicada antes dentro de la categoria, o null. */
  previous: BlogPostItem | null
  /** Entrada publicada despues dentro de la categoria, o null. */
  next: BlogPostItem | null
}

/**
 * Anterior y siguiente dentro de la categoria del post: un `nav` etiquetado con
 * dos enlaces reales. Un extremo sin vecino deja su celda vacia en lugar de un
 * enlace roto. Sin los dos vecinos no se pinta nada.
 */
export function PostPrevNext({ previous, next }: Props) {
  const t = useTranslations('post.nav')
  if (!previous && !next) return null

  const button = {
    height: 'auto',
    py: 1.5,
    textAlign: 'left',
    whiteSpace: 'normal',
    minHeight: 56,
  } as const

  return (
    <Box
      component="nav"
      aria-label={t('label')}
      sx={{ mt: 5, display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2, minmax(0,1fr))' }, gap: 2 }}
    >
      {previous ? (
        <Button
          component={linkFor(previous.href)}
          href={previous.href}
          variant="outlined"
          startIcon={<ArrowLeft size={18} aria-hidden="true" />}
          sx={{ ...button, justifyContent: 'flex-start' }}
        >
          <Box component="span" sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
            <Typography variant="caption" component="span" color="text.secondary">
              {t('previous')}
            </Typography>
            <Box component="span" sx={{ overflowWrap: 'anywhere' }}>
              {previous.title}
            </Box>
          </Box>
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button
          component={linkFor(next.href)}
          href={next.href}
          variant="outlined"
          endIcon={<ArrowRight size={18} aria-hidden="true" />}
          sx={{ ...button, justifyContent: 'space-between' }}
        >
          <Box component="span" sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
            <Typography variant="caption" component="span" color="text.secondary">
              {t('next')}
            </Typography>
            <Box component="span" sx={{ overflowWrap: 'anywhere' }}>
              {next.title}
            </Box>
          </Box>
        </Button>
      ) : (
        <span />
      )}
    </Box>
  )
}
