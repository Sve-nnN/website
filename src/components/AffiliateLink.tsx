// CONSTRAINT (AFF-03/AFF-04, LEG-04): `rel` hardcodeado, nunca un campo del
// CMS. Sin override del atributo de referrer del navegador. Sin ninguna ruta
// de redirect propia para el href que llega a este componente (Amazon
// Program Policies 2026-04-14 prohíben los Redirecting Links). Cero JS de
// cliente, cero tracking — sin onClick, sin cookies ni almacenamiento local
// del navegador aquí.

import React, { type ReactNode } from 'react'

export function AffiliateLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a href={href} target="_blank" rel="sponsored nofollow noopener" className={className}>
      {children}
    </a>
  )
}
