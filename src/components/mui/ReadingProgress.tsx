'use client'

import Box from '@mui/material/Box'
import { useEffect, useState } from 'react'

import { useMotion } from '@/theme/motion'

type Props = {
  /** Id del elemento que se mide: el article del post, no la pagina entera. */
  targetId: string
  /** Nombre accesible de la barra (messages post.progress.label). */
  label: string
}

/**
 * Barra fina de progreso de lectura fija arriba. Es un `progressbar` real
 * (D-19): `aria-valuemin` 0, `aria-valuemax` 100 y `aria-valuenow` entero, que
 * se calcula desde el scroll sobre el elemento objetivo. El sandbox la marcaba
 * `aria-hidden`; aqui la lectora de pantalla puede consultarla.
 *
 * El estado guarda solo el entero: React descarta la actualizacion cuando el
 * valor no cambia, asi que el scroll no provoca trabajo ni ruido en el DOM mas
 * alla de 101 posiciones. El calculo va en requestAnimationFrame. Con el
 * movimiento en pausa (`useMotion`) o con `prefers-reduced-motion` la barra
 * salta sin transicion. No recibe foco ni eventos de puntero.
 */
export function ReadingProgress({ targetId, label }: Props) {
  const { paused } = useMotion()
  const [pct, setPct] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const el = document.getElementById(targetId)
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.6
      const ratio = -rect.top / Math.max(total, 1)
      setPct(Math.min(100, Math.max(0, Math.round(ratio * 100))))
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [targetId])

  return (
    <Box
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      sx={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 1400, pointerEvents: 'none' }}
    >
      <Box
        aria-hidden="true"
        sx={{
          height: '100%',
          width: '100%',
          bgcolor: 'primary.main',
          transformOrigin: 'left center',
          transform: `scaleX(${pct / 100})`,
          transition: paused ? 'none' : 'transform 100ms linear',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      />
    </Box>
  )
}
