'use client'

import Button from '@mui/material/Button'
import { Pause, Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useMotion } from '@/theme/motion'

/**
 * Pausa todo el movimiento decorativo (D-15, D-16, D-17; SC 2.2.2).
 *
 * La etiqueta es constante: el estado lo lleva solo `aria-pressed`. Cambiar el
 * texto a "Reanudar" además de `aria-pressed` haría que un lector de pantalla
 * anunciara el estado dos veces y con sentido contrario. El valor inicial no se
 * calcula aquí: lo fija el script inline del head antes del primer pintado.
 */
export function MotionToggle() {
  const t = useTranslations('shell')
  const { paused, toggle } = useMotion()
  return (
    <Button
      variant="outlined"
      size="small"
      aria-pressed={paused}
      onClick={toggle}
      startIcon={paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
      sx={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 1200,
        minHeight: 40,
        bgcolor: 'background.paper',
        borderColor: 'divider',
        '&:hover': { bgcolor: 'background.paper' },
      }}
    >
      {t('motionToggle')}
    </Button>
  )
}
