'use client'

import Box from '@mui/material/Box'
import Button, { type ButtonProps } from '@mui/material/Button'
import { Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

// Region visualmente oculta, pero presente para los lectores de pantalla.
const HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

type Props = {
  email: string
  /** Variante del boton. La pagina Contacto usa `outlined`; el panel oscuro, `text` con su propio `sx`. */
  variant?: ButtonProps['variant']
  /** Estilo extra del boton (el panel oscuro lo pinta claro sobre fondo oscuro). */
  sx?: ButtonProps['sx']
  /** Icono de copiar a la izquierda del texto. El panel oscuro no lo lleva. */
  icon?: boolean
}

/**
 * Boton "Copiar correo", unica implementacion del sitio (la usan la pagina
 * Contacto y CtaPanel). Al copiar cambia a "Correo copiado" durante 2 segundos
 * y una region `aria-live="polite"` repite el texto, para que el cambio se
 * anuncie sin mover el foco. Si el portapapeles falla (permiso denegado o
 * contexto no seguro) no cambia nada: el correo queda seleccionable.
 */
export function CopyEmailButton({ email, variant = 'outlined', sx, icon = true }: Props) {
  const t = useTranslations('common')
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      return
    }
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size="small"
        onClick={copy}
        startIcon={icon ? <Copy size={14} aria-hidden="true" /> : undefined}
        sx={sx}
      >
        {copied ? t('emailCopied') : t('copyEmail')}
      </Button>
      <Box aria-live="polite" sx={HIDDEN}>
        {copied ? t('emailCopied') : ''}
      </Box>
    </>
  )
}
