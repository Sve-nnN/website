'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Barra de avance de lectura, anclada bajo el header sticky.
 *
 * Es decorativa y va `aria-hidden`: no comunica nada que el lector no pueda
 * obtener de la barra de scroll del navegador, y anunciar un porcentaje que
 * cambia con cada rueda del mouse sería ruido puro en un lector de pantalla.
 *
 * Mide el ARTÍCULO, no la página. Un post corto seguido de autor, artículos
 * relacionados y banda de cierre llega al 100% de scroll de página con medio
 * artículo sin leer; medir el elemento hace que "lleno" signifique "terminaste
 * de leer", que es lo único que la barra promete.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0)
  // El header sticky no expone su alto como token, y hardcodear un valor deja
  // la barra flotando sobre la navegación en cuanto cambie el padding del
  // header. Se mide del DOM y se re-mide al redimensionar.
  const [headerOffset, setHeaderOffset] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    const measure = () => {
      frame.current = null
      const rect = target.getBoundingClientRect()
      // Distancia recorrida desde que el artículo empieza hasta que su final
      // cruza el borde inferior del viewport.
      const total = rect.height - window.innerHeight
      if (total <= 0) {
        setProgress(rect.bottom <= window.innerHeight ? 1 : 0)
        return
      }
      setProgress(Math.min(1, Math.max(0, -rect.top / total)))
    }

    // El listener de scroll solo agenda; la medición corre en rAF. Leer
    // getBoundingClientRect en cada evento de scroll fuerza reflow sincrónico
    // en la ruta que tiene que mantenerse a 60fps.
    const onScroll = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(measure)
    }

    // El alto del header solo cambia al redimensionar, así que se lee ahí y no
    // en cada evento de scroll: `offsetHeight` fuerza reflow.
    const measureHeader = () => setHeaderOffset(document.querySelector('header')?.offsetHeight ?? 0)
    const onResize = () => {
      measureHeader()
      onScroll()
    }

    measure()
    measureHeader()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [targetId])

  return (
    <div
      aria-hidden="true"
      style={{ top: headerOffset }}
      className="sticky z-30 h-0.5 w-full bg-transparent"
    >
      <div
        className="h-full origin-left bg-primary"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
