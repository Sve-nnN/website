'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

// Region visualmente oculta, pero presente para los lectores de pantalla.
const HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

/**
 * Boton "Copiar correo". Al copiar cambia a "Correo copiado" durante 2 segundos
 * y una region `aria-live="polite"` repite el texto, para que el cambio se
 * anuncie sin mover el foco. Si el portapapeles falla (permiso denegado o
 * contexto no seguro) no cambia nada: el correo queda seleccionable.
 */
export function CopyEmailButton({ email }: { email: string }) {
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
        variant="outlined"
        size="small"
        onClick={copy}
        startIcon={<Copy size={14} aria-hidden="true" />}
      >
        {copied ? t('emailCopied') : t('copyEmail')}
      </Button>
      <Box aria-live="polite" sx={HIDDEN}>
        {copied ? t('emailCopied') : ''}
      </Box>
    </>
  )
}
