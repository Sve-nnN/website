// Sin 'use client' (fase 60): marcado estatico con las clases de
// `src/theme/static.css`.
import type { ReactNode } from 'react'

type Props = {
  id: string
  title?: string
  lead?: string
  /** Franja con `band.bg`. Implica padding vertical doble. */
  band?: boolean
  children: ReactNode
  /**
   * Id del hijo que da nombre a la región cuando no hay `title`. Sin `title` ni
   * `labelledBy` la sección no emite `aria-labelledby` (IN-09 de 54-REVIEW.md).
   */
  labelledBy?: string
  /** Padding superior en unidades de tema cuando no es band ni py. */
  pt?: number
  /** Padding vertical doble (80 y 96px en md segun la escala de seccion). */
  py?: boolean
}

/**
 * Seccion base. Con `title` emite el h2 (variante h3 del tema) con id
 * `${id}-t` y la región se nombra con él. Sin `title`, la región se nombra con
 * el hijo cuyo id llega en `labelledBy`; sin ninguno de los dos se omite
 * `aria-labelledby`, de modo que nunca queda apuntando a un id inexistente.
 * No declara landmark principal.
 */
export function Section({ id, title, lead, band, children, labelledBy, pt = 0, py }: Props) {
  const doubled = band || py
  const nameId = title ? `${id}-t` : labelledBy
  const className = ['jt-section', doubled ? 'jt-section--double' : '', band ? 'jt-band' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <section
      id={id}
      className={className}
      aria-labelledby={nameId}
      style={!doubled && pt ? { paddingTop: `calc(${pt} * var(--jt-spacing))` } : undefined}
    >
      <div className="jt-container">
        {title && (
          <div className="jt-section__head">
            <h2 id={`${id}-t`} className="jt-h3">
              {title}
            </h2>
            {lead && <p className="jt-body1 jt-section__lead">{lead}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
