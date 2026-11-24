'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { GrainBlob } from '@/components/mui/GrainBlob'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import type { BlogClosingData } from '@/lib/blog-data'

/**
 * Cierre de las superficies del blog en MUI. Es la version MUI de `BlogClosing`:
 * el texto sale del global blog-promo, que la ruta resuelve con
 * `getCachedBlogPromo` y `resolveBlogPromo` (por categoria) y convierte con
 * `toClosingProps`. Es el UNICO cierre de la pagina: no se apila con CtaSection
 * para no duplicar la peticion ni perder texto indexable (pregunta abierta 1 de
 * RESEARCH, supuesto A11). Las ofertas inline y de riel del post las hace 55-11.
 *
 * Panel oscuro con colores fijos, igual que CtaPanel: el texto siempre cae sobre
 * una capa oscura propia, asi el contraste no depende del movimiento del blob.
 */
export function BlogClosingMui({ closing }: { closing: BlogClosingData }) {
  const t = useTranslations('blog.closing')
  const { primary, secondary } = closing

  return (
    <Box component="section" aria-labelledby="blog-closing-t" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            position: 'relative',
            isolation: 'isolate',
            overflow: 'hidden',
            bgcolor: '#12141C',
            color: '#FAFAF7',
            borderRadius: { xs: 3, md: 4 },
            p: { xs: '40px 24px', md: '64px 80px' },
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) auto' },
            gap: { xs: 5, md: 8 },
            alignItems: 'end',
          }}
        >
          <GrainBlob sx={{ zIndex: -2, width: 520, aspectRatio: '1', right: -200, top: -260, filter: 'blur(8px)' }} />
          <Box
            aria-hidden="true"
            sx={{ position: 'absolute', inset: 0, zIndex: -1, background: 'rgba(18,20,28,0.6)' }}
          />

          <Box sx={{ display: 'grid', gap: 3, minWidth: 0 }}>
            <Typography id="blog-closing-t" variant="h3" component="h2">
              {closing.heading}
            </Typography>
            {closing.body && (
              <Typography variant="body1" sx={{ maxWidth: 620, color: 'rgba(250,250,247,0.86)' }}>
                {closing.body}
              </Typography>
            )}
            {closing.points.length > 0 && (
              <UL aria-label={t('pointsLabel')} sx={{ display: 'grid', gap: 1.5 }}>
                {closing.points.map((item) => (
                  <Box
                    key={item}
                    component="li"
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, color: 'rgba(250,250,247,0.92)' }}
                  >
                    <Box component="span" aria-hidden="true" sx={{ display: 'inline-flex', mt: '4px', color: '#FAFAF7' }}>
                      <Check size={16} />
                    </Box>
                    <Typography variant="body1" component="span">
                      {item}
                    </Typography>
                  </Box>
                ))}
              </UL>
            )}
          </Box>

          {(primary || secondary) && (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row', md: 'column' }, gap: 1.5, alignItems: { xs: 'stretch', md: 'flex-start' } }}>
              {primary && (
                <Button
                  component={linkFor(primary.url)}
                  href={primary.url}
                  size="large"
                  sx={{ bgcolor: '#FAFAF7', color: '#12141C', minHeight: 48, '&:hover': { bgcolor: '#FFFFFF' } }}
                >
                  {primary.label}
                </Button>
              )}
              {secondary && (
                <Link
                  component={linkFor(secondary.url)}
                  href={secondary.url}
                  underline="always"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 40,
                    color: '#FAFAF7',
                    fontWeight: 600,
                    '&:focus-visible': { outline: '2px solid #FAFAF7', outlineOffset: 2 },
                  }}
                >
                  {secondary.label}
                </Link>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  )
}
