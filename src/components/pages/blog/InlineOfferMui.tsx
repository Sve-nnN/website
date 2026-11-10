'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'
import { useId } from 'react'
import { useTranslations } from 'next-intl'

import { GrainBlob } from '@/components/mui/GrainBlob'
import { linkFor } from '@/components/mui/links'
import type { PostInlineOffer } from '@/lib/blog-data'

/**
 * Oferta inline del post, colocada entre las dos mitades del cuerpo por la
 * ruta (`splitContentForOffer`). El texto vive en el global blog-promo (omitirlo
 * reduce texto indexable). Panel oscuro con colores fijos, igual que el cierre:
 * el texto siempre cae sobre una capa oscura propia y el contraste no depende
 * del movimiento del blob. Sin badge, sin urgencia y con una sola accion.
 *
 * Es un `aside` nombrado por su titulo (o por una etiqueta generica si el
 * global no trae titulo). El titulo es un `p`, no un encabezado: dentro del
 * articulo no debe alterar el indice de encabezados.
 */
export function InlineOfferMui({ offer }: { offer: PostInlineOffer }) {
  const t = useTranslations('post.offer')
  const titleId = useId()
  const { link } = offer

  return (
    <Box
      component="aside"
      aria-labelledby={offer.title ? titleId : undefined}
      aria-label={offer.title ? undefined : t('label')}
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        my: 6,
        bgcolor: '#12141C',
        color: '#FAFAF7',
        borderRadius: { xs: 3, md: 4 },
        p: { xs: '32px 24px', md: '40px 48px' },
        display: 'grid',
        gap: 2,
      }}
    >
      <GrainBlob sx={{ zIndex: -2, width: 360, aspectRatio: '1', right: -140, top: -180, filter: 'blur(8px)' }} />
      <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, zIndex: -1, background: 'rgba(18,20,28,0.6)' }} />
      {offer.title && (
        <Typography id={titleId} variant="h5" component="p">
          {offer.title}
        </Typography>
      )}
      <Typography variant="body1" sx={{ maxWidth: 560, color: 'rgba(250,250,247,0.86)' }}>
        {offer.text}
      </Typography>
      {link && (
        <Box>
          <Button
            component={linkFor(link.url)}
            href={link.url}
            endIcon={<ArrowRight size={16} aria-hidden="true" />}
            sx={{ bgcolor: '#FAFAF7', color: '#12141C', minHeight: 44, '&:hover': { bgcolor: '#FFFFFF' } }}
          >
            {link.label}
          </Button>
        </Box>
      )}
    </Box>
  )
}
