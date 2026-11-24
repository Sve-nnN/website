'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { formatLongDateUtc } from './format-date'
import { linkFor } from './links'

export type PostCardImage = {
  url: string
  alt?: string | null
  width?: number | null
  height?: number | null
}

type Props = {
  /** Ruta del post sin prefijo de idioma (la arma `blog-paths` en el servidor). */
  href: string
  title: string
  excerpt?: string | null
  /** Nombre de la categoría, ya resuelto en el idioma de la página. */
  categoryLabel?: string | null
  /** Fecha de publicación en ISO. */
  dateISO?: string | null
  /** Portada de Payload o null. Sin imagen no se reserva un recuadro vacío. */
  image?: PostCardImage | null
  /** Nivel del encabezado del título, para respetar la jerarquía de la página. */
  headingLevel?: 2 | 3 | 4
  /**
   * Entrada destacada: con imagen y desde `md` pone la portada a la izquierda y el
   * texto a la derecha. No cambia el marcado ni el orden de lectura.
   */
  featured?: boolean
}

/**
 * Tarjeta de post compartida por el índice del blog, la categoría, los
 * relacionados y el perfil de autor. Todas las props son serializables: el
 * enlace se resuelve aquí con `linkFor` (Pitfall 17) y nunca llega como
 * `component` desde un Server Component.
 *
 * El título es el enlace y se estira con `::after` a toda la tarjeta; su
 * `outline` queda en none y el foco se dibuja en la tarjeta con
 * `:has(a:focus-visible)`. El nombre accesible del enlace es el título visible.
 * No calcula tiempo de lectura: necesita el cuerpo completo del post (solo lo
 * muestran la página del post y la entrada destacada).
 *
 * Escalas aceptadas: título 20/28 con peso 600 (rol h6), resumen 16/24,
 * metadatos 14 y 12 px.
 */
export function PostCard({
  href,
  title,
  excerpt,
  categoryLabel,
  dateISO,
  image = null,
  headingLevel = 3,
  featured = false,
}: Props) {
  const t = useTranslations('richText')
  const locale = useLocale()
  const date = formatLongDateUtc(dateISO, locale)
  const sideBySide = featured && Boolean(image)

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'grid',
        gridTemplateRows: image ? 'auto 1fr' : '1fr',
        ...(sideBySide
          ? { gridTemplateColumns: { md: 'minmax(0,1.15fr) minmax(0,1fr)' }, gridTemplateRows: { xs: 'auto 1fr', md: '1fr' } }
          : {}),
        transition: 'transform 500ms cubic-bezier(0.22,1,0.36,1), border-color 300ms',
        '&:hover': { borderColor: 'text.primary', transform: 'translateY(-4px)' },
        'html[data-motion="paused"] &:hover': { transform: 'none' },
        '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
        '&:has(a:focus-visible)': { outline: '2px solid var(--jt-palette-accentText)', outlineOffset: 2 },
      }}
    >
      {image && (
        <Box
          sx={{
            aspectRatio: sideBySide ? { xs: '16 / 7', md: 'auto' } : '16 / 7',
            minHeight: sideBySide ? { md: 280 } : undefined,
            bgcolor: 'raised',
            borderBottom: 1,
            borderColor: 'divider',
            ...(sideBySide ? { borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 } } : {}),
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src={image.url}
            alt={image.alt ?? ''}
            width={image.width && image.height ? image.width : 1200}
            height={image.width && image.height ? image.height : 525}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </Box>
      )}
      <Box sx={{ p: sideBySide ? { xs: 3, md: 5 } : 3, display: 'grid', gap: 2, alignContent: sideBySide ? { md: 'center' } : 'start' }}>
        {categoryLabel && (
          <Typography variant="overline" component="p" sx={{ color: 'accentText' }}>
            {categoryLabel}
          </Typography>
        )}
        <Typography
          variant="h6"
          component={`h${headingLevel}`}
          sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          <Link
            component={linkFor(href)}
            href={href}
            underline="none"
            sx={{
              color: 'text.primary',
              outline: 'none',
              '&::after': { content: '""', position: 'absolute', inset: 0 },
            }}
          >
            {title}
          </Link>
        </Typography>
        {excerpt && (
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {excerpt}
          </Typography>
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            color: 'text.secondary',
          }}
        >
          {date && dateISO ? (
            <Typography variant="body2" component="time" dateTime={dateISO}>
              {date}
            </Typography>
          ) : (
            <span />
          )}
          <Typography
            variant="body2"
            component="span"
            aria-hidden="true"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'accentText', fontWeight: 600 }}
          >
            {t('readPost')}
            <ArrowRight size={14} aria-hidden="true" />
          </Typography>
        </Box>
      </Box>
    </Card>
  )
}
