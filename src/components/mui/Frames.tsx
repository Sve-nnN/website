'use client'

import Box from '@mui/material/Box'

type Props = {
  src: string
  alt: string
  /** Dominio que se muestra en la barra. Sin dominio la barra solo lleva los puntos. */
  domain?: string | null
  /** Medidas reales de la captura (media de Payload). Evitan el salto de layout. */
  width?: number | null
  height?: number | null
  /** Solo para la captura que abre la pagina: carga sin diferir. */
  priority?: boolean
}

/**
 * Marco de navegador para capturas de escritorio, portado del sandbox. La barra
 * es decorativa (`aria-hidden`). La caja de la captura es 16:10 con
 * `object-fit: cover` y `object-position: top`: las capturas de Payload son de
 * pagina completa (hasta 10879 px de alto), asi que se muestra la parte
 * superior recortada. `width` y `height` explicitos vienen de media.
 *
 * No hay marco de telefono: Payload guarda una captura por sitio (D-14).
 */
export function BrowserFrame({ src, alt, domain, width, height, priority }: Props) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 32px 64px -28px rgba(0,0,0,0.45)',
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1,
          bgcolor: 'raised',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'fieldBorder', opacity: 0.6 }} />
          ))}
        </Box>
        {domain && (
          <Box
            sx={{
              flex: 1,
              px: 2,
              py: 0.5,
              borderRadius: 9999,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '0.75rem',
              lineHeight: '1rem',
              color: 'text.secondary',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {domain}
          </Box>
        )}
      </Box>
      <Box sx={{ aspectRatio: '16 / 10', bgcolor: 'raised', overflow: 'hidden' }}>
        <Box
          component="img"
          src={src}
          alt={alt}
          width={width && height ? width : 1280}
          height={width && height ? height : 800}
          loading={priority ? 'eager' : 'lazy'}
          {...(priority ? { fetchPriority: 'high' as const } : {})}
          sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      </Box>
    </Box>
  )
}
