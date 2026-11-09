'use client'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { UL } from '@/components/mui/lists'
import { Section } from '@/components/mui/Section'
import type { AboutPhoto, HomeAbout } from '@/lib/home-data-b'

const figure = { m: 0, overflow: 'hidden', borderRadius: 2, position: 'relative', bgcolor: 'raised' } as const
const imageSx = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as const

function Figure({ photo, wide }: { photo: AboutPhoto; wide: boolean }) {
  return (
    <Box component="figure" sx={{ ...figure, ...(wide ? { gridColumn: 'span 2', aspectRatio: '16 / 10' } : { aspectRatio: '4 / 5' }) }}>
      <Box
        component="img"
        src={photo.url}
        alt={photo.alt ?? ''}
        {...(photo.width && photo.height ? { width: photo.width, height: photo.height } : {})}
        loading="lazy"
        sx={imageSx}
      />
      {photo.caption && (
        <Typography
          component="figcaption"
          variant="caption"
          sx={{ position: 'absolute', left: 8, bottom: 8, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'rgba(18,20,28,0.8)', color: '#FAFAF7' }}
        >
          {photo.caption}
        </Typography>
      )}
    </Box>
  )
}

/**
 * Sobre mi de la home: texto con contadores y chips, y a la derecha un collage
 * de hasta tres figuras con el alt de Media y el ancho y alto declarados. Sin
 * imagenes el texto ocupa el ancho completo. Cada contador sin valor o sin
 * rotulo se omite. El h2 lleva el id `sobre-t` que nombra la seccion.
 */
export function About({ about }: { about: HomeAbout }) {
  const t = useTranslations('home')
  const photos = about.photos.slice(0, 3)
  const counters = [
    { n: about.seoCount, label: about.seoLabel },
    { n: about.devCount, label: about.devLabel },
  ].filter((c): c is { n: number; label: string } => c.n !== null && c.label !== null)

  return (
    <Section id="sobre">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: photos.length > 0 ? { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) minmax(0,1fr)' } : 'minmax(0,1fr)',
          gap: { xs: 5, md: 8 },
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'grid', gap: 3, justifyItems: 'start' }}>
          <Typography id="sobre-t" variant="h3" component="h2">
            {about.title}
          </Typography>
          {about.paragraphs.map((p, i) => (
            <Typography key={`${i}-${p.slice(0, 24)}`} variant="body1" color="text.secondary" sx={{ fontSize: '1rem', lineHeight: '1.5rem' }}>
              {p}
            </Typography>
          ))}
          {counters.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {counters.map((c) => (
                <Box key={c.label}>
                  <Typography component="p" sx={{ fontSize: '3rem', lineHeight: 1, fontWeight: 600, color: 'accentText' }}>
                    {c.n}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          {about.chips.length > 0 && (
            <UL aria-label={t('areasLabel')} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {about.chips.map((chip) => (
                <Chip key={chip} component="li" label={chip} />
              ))}
            </UL>
          )}
        </Box>
        {photos.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 1.5 }}>
            {photos.map((photo, i) => (
              <Figure key={photo.url} photo={photo} wide={i === 0} />
            ))}
          </Box>
        )}
      </Box>
    </Section>
  )
}
