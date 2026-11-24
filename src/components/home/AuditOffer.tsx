'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Check } from 'lucide-react'

import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import { Section } from '@/components/mui/Section'
import type { HomeAuditOffer } from '@/lib/home-data-b'

const CONTACT_HREF = '#contacto'

/**
 * Oferta de auditoria en franja `band`: titulo y descripcion, el precio como
 * cifra de 48px en `primary.main` con su leyenda, la lista de lo que incluye
 * con marca de verificacion en circulo de 32px, las notas de credito y de
 * entrega y un unico boton contained hacia #contacto (sin rotulo en el CMS ni
 * en el hero, no hay boton: no se inventa copy).
 */
export function AuditOffer({ offer }: { offer: HomeAuditOffer }) {
  return (
    <Section id="oferta" band title={offer.title} lead={offer.description ?? undefined}>
      <Box sx={{ display: 'grid', gap: 5, justifyItems: 'start' }}>
        {offer.price && (
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography component="p" sx={{ fontSize: '3rem', lineHeight: 1, fontWeight: 600, color: 'primary.main' }}>
              {offer.price}
            </Typography>
            {offer.priceCaption && (
              <Typography variant="body2" sx={{ color: 'band.muted' }}>
                {offer.priceCaption}
              </Typography>
            )}
          </Box>
        )}
        {offer.includes.length > 0 && (
          <UL
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2, minmax(0,1fr))' },
              gap: 2,
              width: '100%',
            }}
          >
            {offer.includes.map((item, i) => (
              <Box key={`${i}-${item}`} component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 32,
                    height: 32,
                    flex: 'none',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  }}
                >
                  <Check size={18} strokeWidth={2.5} />
                </Box>
                <Typography variant="body1" sx={{ pt: 0.5 }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </UL>
        )}
        {(offer.creditNote || offer.deliveryNote) && (
          <Box sx={{ display: 'grid', gap: 1 }}>
            {offer.creditNote && (
              <Typography variant="body2" sx={{ color: 'band.muted' }}>
                {offer.creditNote}
              </Typography>
            )}
            {offer.deliveryNote && (
              <Typography variant="body2" sx={{ color: 'band.muted' }}>
                {offer.deliveryNote}
              </Typography>
            )}
          </Box>
        )}
        {offer.ctaLabel && (
          <Button component={linkFor(CONTACT_HREF)} href={CONTACT_HREF} variant="contained" size="large">
            {offer.ctaLabel}
          </Button>
        )}
      </Box>
    </Section>
  )
}
