// Sin 'use client' (fase 60): solo `GrainBlob` es cliente. El resto es marcado
// estatico con las clases de `src/theme/static.css`.
import type { ReactNode } from 'react'

import { Crumbs, type Crumb } from './Crumbs'
import { GrainBlob } from './GrainBlob'

type Props = {
  crumbs: Crumb[]
  eyebrow?: string
  title: string
  lead?: string
  children?: ReactNode
  aside?: ReactNode
  /** Variante para paginas legales y busqueda: h1 mas bajo. */
  compact?: boolean
}

/**
 * Cabecera de paginas interiores: migas, eyebrow, h1, lead y un blob de grano
 * difuminado. Emite exactamente un h1 (`#page-title`) al que apunta
 * `aria-labelledby`. Nunca declara un landmark principal: el layout pone el unico main.
 *
 * Escala vertical de UI-SPEC: pt 128 y 160, pb 48 y 80.
 */
export function PageHero({ crumbs, eyebrow, title, lead, children, aside, compact }: Props) {
  return (
    <section className="jt-hero" aria-labelledby="page-title">
      <GrainBlob
        feather={28}
        sx={{
          width: { xs: 360, md: 560 },
          aspectRatio: '1',
          right: { xs: -160, md: -120 },
          top: { xs: -140, md: -200 },
          opacity: 0.55,
          zIndex: 0,
        }}
      />
      <div className={aside ? 'jt-container jt-hero__inner jt-hero__inner--aside' : 'jt-container jt-hero__inner'}>
        <div className="jt-hero__body">
          <Crumbs items={crumbs} />
          {eyebrow && <span className="jt-overline jt-accent">{eyebrow}</span>}
          <h1
            id="page-title"
            className={compact ? 'jt-h1 jt-hero__title jt-hero__title--compact' : 'jt-h1 jt-hero__title'}
          >
            {title}
          </h1>
          {lead && <p className="jt-body1 jt-hero__lead">{lead}</p>}
          {children}
        </div>
        {aside}
      </div>
    </section>
  )
}
