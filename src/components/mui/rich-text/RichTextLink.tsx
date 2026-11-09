'use client'
// Enlace interno del texto enriquecido. Vive en la capa cliente a propósito:
// MuiRichText es un Server Component y no puede pasar el resultado de
// `linkFor()` (un forwardRef con función `render`) como `component` de un
// `Link` de MUI, porque React Flight no serializa funciones hacia componentes
// cliente. Aquí solo cruzan datos serializables (`href` y `children`) y la
// elección del componente de enlace ocurre dentro del cliente.
import Link from '@mui/material/Link'
import type { ReactNode } from 'react'

import { linkFor } from '../links'

export function RichTextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link component={linkFor(href)} href={href} underline="always" sx={{ color: 'accentText' }}>
      {children}
    </Link>
  )
}
