'use client'

import Box, { type BoxProps } from '@mui/material/Box'
import { keyframes } from '@mui/material/styles'

import { useMotion } from '@/theme/motion'
import { blobGradient, grainImage } from '@/theme/tokens'

const morph = keyframes`
  0% { border-radius: 58% 42% 52% 48% / 47% 55% 45% 53%; }
  50% { border-radius: 46% 54% 44% 56% / 55% 44% 56% 45%; }
  100% { border-radius: 54% 46% 58% 42% / 44% 58% 42% 56%; }
`

type Props = BoxProps & {
  /** Difuminado del borde en px. 0 deja el borde nitido. */
  feather?: number
}

/**
 * Blob organico con gradiente y grano, compartido por las paginas de la fase 54.
 * Decorativo: `aria-hidden` siempre.
 *
 * Con `feather` el gradiente se desenfoca y el grano se desvanece hacia el
 * borde, asi el contorno se disuelve en el fondo y el grano no se ve fuera de
 * la forma.
 *
 * Movimiento: el estado vive en `html[data-motion]` y se lee con
 * `useMotion().paused` (UI-SPEC, Movimiento). No hay selector de pausa por clase
 * ni media query de movimiento reducido: el script de arranque ya fija
 * `data-motion="paused"` cuando la persona pidio menos movimiento.
 */
export function GrainBlob({ sx, feather = 0, ...rest }: Props) {
  const { paused } = useMotion()
  const soft = feather > 0
  const shape = {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: '58% 42% 52% 48% / 47% 55% 45% 53%',
    background: blobGradient,
    animation: `${morph} 16s ease-in-out infinite alternate`,
    animationPlayState: paused ? 'paused' : 'running',
  }
  return (
    <Box
      aria-hidden="true"
      {...rest}
      sx={[
        { position: 'absolute', pointerEvents: 'none', isolation: 'isolate' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {soft ? (
        <>
          {/* El desenfoque va a la forma, con margen para que no recorte el halo */}
          <Box sx={{ ...shape, inset: `${feather * 0.4}px`, filter: `blur(${feather}px)` }} />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: grainImage,
              backgroundSize: '240px',
              mixBlendMode: 'overlay',
              opacity: 0.55,
              maskImage: 'radial-gradient(closest-side, #000 58%, transparent 96%)',
              WebkitMaskImage: 'radial-gradient(closest-side, #000 58%, transparent 96%)',
            }}
          />
        </>
      ) : (
        <Box
          sx={{
            ...shape,
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              backgroundImage: grainImage,
              backgroundSize: '240px',
              mixBlendMode: 'overlay',
              opacity: 0.55,
            },
          }}
        />
      )}
    </Box>
  )
}
