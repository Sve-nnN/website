'use client'

// Boton de MUI que navega a una ruta del sitio, para usarlo desde un Server
// Component. Solo cruzan datos serializables (`href`, `sx`, iconos ya
// renderizados); la eleccion del componente de enlace ocurre en el cliente.
import Button, { type ButtonProps } from '@mui/material/Button'

import { linkFor } from '@/components/mui/links'

type Props = Pick<ButtonProps, 'variant' | 'size' | 'sx' | 'endIcon' | 'startIcon' | 'children'> & { href: string }

export function LinkButton({ href, ...props }: Props) {
  return <Button component={linkFor(href)} href={href} {...props} />
}
