'use client'

import Box from '@mui/material/Box'
import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  /**
   * Nombre accesible de la región cuando desborda. Lo pasa el llamador desde
   * messages y nunca repite texto visible (A11Y.md sección 6, SC 2.5.3).
   */
  label: string
  children: ReactNode
}

/**
 * Contenedor con desplazamiento horizontal que solo se vuelve una región
 * enfocable cuando el contenido de verdad desborda.
 *
 * A11Y.md sección 6 ("Focus Traps Nobody Asked For"): un contenedor
 * desplazable que no desborda no debe llevar `tabindex="0"`, porque agrega una
 * parada de tabulador sin función. Cuando sí desborda, un usuario de teclado
 * necesita enfocarlo para desplazarlo (SC 2.1.1), y el foco necesita un
 * nombre y un rol.
 *
 * El desborde solo se puede medir en el navegador, así que el HTML del
 * servidor sale sin `tabIndex` ni `role` y el cliente los agrega tras medir
 * `scrollWidth` contra `clientWidth`. Un `ResizeObserver` vuelve a medir al
 * cambiar el ancho de la ventana o del contenido (sin movimiento propio).
 */
export function ScrollRegion({ label, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    // El contenedor cambia de ancho con la ventana; el hijo, con su contenido.
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [])

  const focusable = overflows ? { tabIndex: 0, role: 'region', 'aria-label': label } : {}

  return (
    <Box
      ref={ref}
      {...focusable}
      sx={{
        overflowX: 'auto',
        maxWidth: '100%',
        '&:focus-visible': { outline: '2px solid var(--jt-palette-accentText)', outlineOffset: -2 },
      }}
    >
      {children}
    </Box>
  )
}
