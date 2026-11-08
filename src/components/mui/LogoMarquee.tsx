'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { keyframes } from '@mui/material/styles'

import { useMotion } from '@/theme/motion'

import { UL } from './lists'

const left = keyframes`to { transform: translateX(-50%); }`
const right = keyframes`from { transform: translateX(-50%); } to { transform: translateX(0); }`

export type MarqueeLogo = {
  id: string | number
  src: string
  alt: string
  /** Dimensiones reales del archivo. Sin ellas el logo usa el tamano por defecto. */
  width?: number | null
  height?: number | null
  /** Logo claro que necesita chip oscuro sobre la franja clara. */
  onDark?: boolean | null
}

const MAX = { width: 220, height: 56 } as const
const DEFAULT = { width: 120, height: 48 } as const

/**
 * Tamano en pantalla de un logo: cabe en 220 por 56 px conservando la
 * proporcion y nunca se amplia (un logo pequeno se queda en su tamano real).
 * Sin ancho o alto validos usa 120 por 48 px con `object-fit: contain`.
 */
export function fitLogo(
  width: number | null | undefined,
  height: number | null | undefined,
): { width: number; height: number } {
  if (!width || !height || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { ...DEFAULT }
  }
  const scale = Math.min(1, MAX.width / width, MAX.height / height)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * Logo en escala de grises que recupera el color al pasar el cursor. La segunda
 * copia (`hidden`) es `aria-hidden`, con `alt` vacio, y no se puede enfocar.
 * Los logos claros llevan un chip oscuro para verse sobre la franja clara.
 */
function Logo({ logo, hidden }: { logo: MarqueeLogo; hidden: boolean }) {
  const size = fitLogo(logo.width, logo.height)
  return (
    <Box
      aria-hidden={hidden || undefined}
      sx={{
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        filter: 'grayscale(1)',
        opacity: 0.8,
        transition: 'filter 300ms, opacity 300ms',
        '&:hover': { filter: 'none', opacity: 1 },
        ...(logo.onDark ? { bgcolor: '#181818', borderRadius: 2, px: 2, py: 1.25 } : {}),
      }}
    >
      <Box
        component="img"
        src={logo.src}
        alt={hidden ? '' : logo.alt}
        width={logo.width ?? size.width}
        height={logo.height ?? size.height}
        loading="lazy"
        decoding="async"
        sx={{ width: size.width, height: size.height, display: 'block', objectFit: 'contain' }}
      />
    </Box>
  )
}

function Track({ items, reverse, duration }: { items: MarqueeLogo[]; reverse?: boolean; duration: number }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: 'max-content',
        gap: '96px',
        pr: '96px',
        animation: `${reverse ? right : left} ${duration}s linear infinite`,
      }}
    >
      {[false, true].map((hidden) =>
        items.map((l) => <Logo key={`${hidden}-${l.id}`} logo={l} hidden={hidden} />),
      )}
    </Box>
  )
}

/**
 * Rejilla estatica para movimiento pausado: cada logo una vez, centrada y con
 * salto de linea, sin copias duplicadas. Exportada para probarla sin DOM.
 */
export function LogoStaticGrid({ logos }: { logos: MarqueeLogo[] }) {
  return (
    <Container maxWidth="lg">
      <UL sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '40px 64px' }}>
        {logos.map((l) => (
          <Box component="li" key={l.id}>
            <Logo logo={l} hidden={false} />
          </Box>
        ))}
      </UL>
    </Container>
  )
}

type Props = {
  title: string
  /** Nombre accesible del grupo de logos (messages `home.marquee.groupLabel`). */
  groupLabel: string
  logos: MarqueeLogo[]
}

/**
 * Marquesina de logos de clientes. Los logos llegan por props desde la
 * coleccion `clientes`; el componente no conoce ningun archivo del sandbox.
 * Sin logos no devuelve nada (sin encabezado huerfano).
 *
 * Movimiento: se detiene con hover y, con `useMotion().paused`, se muestra como
 * rejilla estatica con cada logo una vez, para que ninguno quede recortado.
 * La franja es clara en el sitio: casi todos los logos son oscuros.
 */
export function LogoMarquee({ title, groupLabel, logos }: Props) {
  const { paused } = useMotion()
  if (logos.length === 0) return null

  const a = logos.filter((_, i) => i % 2 === 0)
  const b = logos.filter((_, i) => i % 2 === 1).reverse()

  return (
    <Box component="section" id="clientes" aria-labelledby="clientes-t" sx={{ pb: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Typography id="clientes-t" variant="h3" component="h2" sx={{ mb: 6 }}>
          {title}
        </Typography>
      </Container>
      <Box
        role="group"
        aria-label={groupLabel}
        sx={{
          overflow: 'hidden',
          bgcolor: '#FAFAF7',
          borderBlock: 1,
          borderColor: 'divider',
          py: 5,
          ...(paused
            ? {}
            : { display: 'grid', gap: 5, '&:hover > div': { animationPlayState: 'paused' } }),
        }}
      >
        {paused ? (
          <LogoStaticGrid logos={logos} />
        ) : (
          <>
            <Track items={a} duration={80} />
            {b.length > 0 && <Track items={b} reverse duration={90} />}
          </>
        )}
      </Box>
    </Box>
  )
}
