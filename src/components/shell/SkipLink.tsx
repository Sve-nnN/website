'use client'

import Link from '@mui/material/Link'
import { useTranslations } from 'next-intl'

/**
 * Enlace de salto (D-13, SC 2.4.1). Es el primer elemento enfocable del
 * documento y apunta al único `main#main-content` que posee el layout. Queda
 * fuera de pantalla hasta recibir el foco y entonces baja a 8 px del borde.
 */
export function SkipLink() {
  const t = useTranslations('shell')
  return (
    <Link
      href="#main-content"
      sx={{
        position: 'absolute',
        left: 8,
        top: -64,
        zIndex: 1300,
        bgcolor: 'background.paper',
        p: 2,
        borderRadius: '4px',
        color: 'accentText',
        '&:focus': { top: 8 },
      }}
    >
      {t('skipLink')}
    </Link>
  )
}
