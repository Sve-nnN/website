'use client'

import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { linkFor } from './links'

export type Crumb = { label: string; href?: string }

/**
 * Ruta de migas. La pagina actual (la ultima) va como texto con
 * `aria-current="page"` y peso 600. El nombre accesible de la navegacion sale
 * de messages (`common.breadcrumbsLabel`); las etiquetas llegan por props.
 *
 * Los hrefs que llegan de `buildTrail` ya traen el prefijo de idioma y los
 * internos sin prefijo los resuelve `linkFor` con `isPrefixableHref`.
 */
export function Crumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations('common')
  return (
    <Breadcrumbs
      aria-label={t('breadcrumbsLabel')}
      separator={<ChevronRight size={14} aria-hidden="true" />}
      sx={{ mb: 3, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}
    >
      {items.map((c, i) =>
        c.href && i < items.length - 1 ? (
          <Link
            key={`${i}-${c.label}`}
            component={linkFor(c.href)}
            href={c.href}
            underline="hover"
            sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: '1.25rem' }}
          >
            {c.label}
          </Link>
        ) : (
          <Typography
            key={`${i}-${c.label}`}
            aria-current="page"
            sx={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: 'text.primary', fontWeight: 600 }}
          >
            {c.label}
          </Typography>
        ),
      )}
    </Breadcrumbs>
  )
}
