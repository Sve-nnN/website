// Enlace para las vistas estaticas (fase 60). Sin 'use client': sirve igual
// dentro de un Server Component y dentro de un componente cliente. Mismo
// criterio que `linkFor`: el `Link` de next-intl para las rutas internas sin
// prefijo y `next/link` para el resto. Elige el elemento aqui y no pasa la
// funcion como prop, que React Flight no sabe serializar.
import NextLink from 'next/link'
import type { ComponentProps } from 'react'

import { Link as LocaleLink, isPrefixableHref } from '@/i18n/navigation'

type Props = Omit<ComponentProps<typeof NextLink>, 'href' | 'locale'> & { href: string }

export function AppLink({ href, ...props }: Props) {
  return isPrefixableHref(href) ? (
    <LocaleLink href={href} {...props} />
  ) : (
    <NextLink href={href} {...props} />
  )
}
