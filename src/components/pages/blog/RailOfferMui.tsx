'use client'

import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'
import { useId } from 'react'

import { linkFor } from '@/components/mui/links'
import type { PostRailOffer } from '@/lib/blog-data'

/**
 * Tarjeta de oferta de la columna derecha del post, debajo del indice. Solo
 * escritorio (desde `lg`): en movil la columna se apila arriba del articulo y
 * la tarjeta se comeria la primera pantalla de lectura; ahi el lector ya recibe
 * la oferta inline y el cierre. Registro mas bajo que la oferta inline: sin
 * panel oscuro ni animacion, porque acompana todo el articulo.
 *
 * `aside` nombrado por su titulo; el titulo es un `p` para no tocar el indice de
 * encabezados. `display: none` lo saca tambien del arbol de accesibilidad.
 */
export function RailOfferMui({ offer }: { offer: PostRailOffer }) {
  const titleId = useId()
  const { link } = offer

  return (
    <Box
      component="aside"
      aria-labelledby={titleId}
      sx={{
        display: { xs: 'none', lg: 'grid' },
        gap: 1.5,
        mt: 3,
        p: 3,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'raised',
      }}
    >
      <Box aria-hidden="true" sx={{ width: 40, height: 2, bgcolor: 'primary.main' }} />
      <Typography id={titleId} variant="h6" component="p">
        {offer.title}
      </Typography>
      {offer.body && (
        <Typography variant="body2" color="text.secondary">
          {offer.body}
        </Typography>
      )}
      {link && (
        <Link
          component={linkFor(link.url)}
          href={link.url}
          underline="always"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            minHeight: 40,
            color: 'accentText',
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
          }}
        >
          {link.label}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </Box>
  )
}
