'use client'

import Box, { type BoxProps } from '@mui/material/Box'

// El tema no trae reset global de listas a proposito (Pitfall 5 de
// 54-RESEARCH.md): una lista suelta mostraria viñetas y el margen del
// navegador. Toda lista de la fase usa UL u OL, que llevan el reset en su
// propio `sx`. Ninguna vista declara `ul` u `ol` a mano.
//
// `role="list"` por defecto (IN-08 de 54-REVIEW.md): con `list-style: none`
// VoiceOver en Safari deja de anunciar el elemento como lista. Se esparce
// `rest` DESPUES del valor por defecto, así un `role` recibido lo sobrescribe.
const reset = { listStyle: 'none', margin: 0, padding: 0 } as const

function withReset(sx: BoxProps['sx']): BoxProps['sx'] {
  return [reset, ...(Array.isArray(sx) ? sx : [sx])] as BoxProps['sx']
}

/** Lista sin orden con reset explicito. Acepta `sx` y el resto de props de Box. */
export function UL({ sx, ...rest }: Omit<BoxProps<'ul'>, 'component'>) {
  return <Box component="ul" role="list" {...rest} sx={withReset(sx)} />
}

/** Lista ordenada con reset explicito. Acepta `sx` y el resto de props de Box. */
export function OL({ sx, ...rest }: Omit<BoxProps<'ol'>, 'component'>) {
  return <Box component="ol" role="list" {...rest} sx={withReset(sx)} />
}
