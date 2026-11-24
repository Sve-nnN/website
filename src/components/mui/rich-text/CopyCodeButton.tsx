'use client'
// Botón Copiar de un bloque de código del cuerpo. Vive en la capa cliente
// porque necesita el portapapeles y estado. Recibe solo el texto a copiar.
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { Check, Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

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

type State = 'idle' | 'copied' | 'failed'

/**
 * Botón real (button) con estados de interfaz y una región role="status" que
 * anuncia el resultado sin mover el foco. La región existe siempre en el DOM
 * para que el lector de pantalla anuncie el cambio de texto. Si el
 * portapapeles falla (permiso denegado o contexto no seguro), el estado vuelve
 * a reposo tras anunciar el fallo y el texto del código queda seleccionable.
 */
export function CopyCodeButton({ code }: { code: string }) {
  const t = useTranslations('richText')
  const [state, setState] = useState<State>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    let next: State = 'copied'
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      next = 'failed'
    }
    setState(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2000)
  }

  const copied = state === 'copied'
  const status =
    state === 'copied' ? t('codeCopiedStatus') : state === 'failed' ? t('codeCopyFailedStatus') : ''

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        size="small"
        onClick={copy}
        startIcon={copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        sx={{
          color: 'band.text',
          borderColor: 'band.border',
          '&:hover': { borderColor: 'band.text', bgcolor: 'transparent' },
        }}
      >
        {copied ? t('codeCopied') : t('copyCode')}
        <Box component="span" sx={HIDDEN}>
          {` ${t('codeNoun')}`}
        </Box>
      </Button>
      <Box role="status" aria-live="polite" sx={HIDDEN}>
        {status}
      </Box>
    </>
  )
}
