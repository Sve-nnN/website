'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

import type { HeroGrainGradientVariant } from './HeroGrainGradientShader'

/**
 * Envoltorio que difiere el shader WebGL del hero (SEO-06).
 *
 * Medido con Lighthouse mobile contra producción el 2026-08-20, bloqueando
 * únicamente el chunk de `@paper-design/shaders-react`:
 *
 * | Métrica     | Con el shader | Sin el shader |
 * |-------------|---------------|---------------|
 * | Performance | 44            | 82            |
 * | TBT         | 2090 ms       | 50 ms         |
 * | LCP         | 5,8 s         | 4,4 s         |
 *
 * El shader es todo el problema del hilo principal. Y es decoración: el
 * elemento LCP de la home es el párrafo bajo el titular, o sea texto. No hay
 * ninguna razón para que compita por el hilo principal mientras la página
 * todavía se está volviendo usable.
 *
 * Así que se carga después, con tres condiciones en orden: que la página haya
 * terminado de cargar, que el bloque esté cerca del viewport, y que el
 * navegador haya quedado ocioso de verdad (sin fecha límite que lo fuerce).
 * Mientras tanto se ve un degradado CSS con los mismos colores, y el shader
 * entra con un fundido de 700 ms encima. El resultado final es idéntico al de
 * antes; lo único que cambia es cuándo aparece la animación.
 *
 * La primera versión de este diferido usaba `{ timeout: 3000 }` y esperaba
 * solo al viewport. No alcanzaba: el hero está en pantalla desde el primer
 * frame, así que el observer disparaba durante la carga, y el `timeout` es una
 * fecha límite que ejecuta el shader aunque el hilo siga ocupado. Cuatro
 * corridas de Lighthouse el 2026-08-24 dieron TBT de 3840, 196, 119 y 32 ms:
 * el trabajo estaba movido, no sacado.
 *
 * No se toca el diseño: la forma, la paleta y la velocidad siguen viviendo en
 * HeroGrainGradientShader.tsx, con las decisiones de la fase 16 intactas.
 */

const HeroGrainGradientShader = dynamic(() => import('./HeroGrainGradientShader'), {
  // El shader necesita WebGL2, que no existe en el servidor. Renderizarlo en
  // SSR solo agregaría un canvas vacío al HTML que ya pesa.
  ssr: false,
})

/**
 * Respaldo estático, con los mismos hex que el shader
 * (LIGHT_COLORS + NEAR_BLACK en HeroGrainGradientShader.tsx). No busca imitar
 * la forma, sí el tono: sin esto el salto sería de navy sólido a casi negro y
 * se notaría como un parpadeo.
 */
const STATIC_BACKDROP =
  'radial-gradient(120% 120% at 72% 18%, #3A4159 0%, #23283A 38%, #0A0A0F 78%),' +
  ' radial-gradient(60% 60% at 78% 12%, rgba(247, 88, 30, 0.18) 0%, rgba(247, 88, 30, 0) 70%)'

interface HeroGrainGradientProps {
  variant?: HeroGrainGradientVariant
}

export function HeroGrainGradient({ variant = 'default' }: HeroGrainGradientProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const [faded, setFaded] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    // `prefers-reduced-motion` ya está respetado adentro del shader (velocidad
    // 0), pero si el usuario pidió menos movimiento tampoco tiene sentido
    // pagar la descarga y la compilación de un shader que va a quedar quieto.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const view = window
    // `in window` estrecharia el tipo a never en la rama else, de ahi la
    // comprobacion por typeof y no por `in`.
    const supportsIdleCallback = typeof view.requestIdleCallback === 'function'

    let idleHandle: number | undefined
    let observer: IntersectionObserver | undefined

    const scheduleWhenIdle = () => {
      // SIN `timeout`, a proposito. La version anterior usaba
      // `{ timeout: 3000 }`, que es una fecha limite: si el hilo principal
      // nunca queda ocioso, el navegador ejecuta el callback igual a los 3
      // segundos. Medido con Lighthouse el 2026-08-24, eso caia justo dentro
      // de la ventana de medicion y una corrida marco 3840 ms de TBT contra
      // 32 ms de otra. O sea que el diferido movia el trabajo en vez de
      // sacarlo del camino.
      //
      // Sin deadline, el shader entra cuando de verdad sobra tiempo. Si nunca
      // sobra, no entra: queda el degradado CSS, que es el mismo tono y no
      // deja hueco. Un fondo decorativo que no aparece es mejor resultado que
      // una pagina que no responde.
      idleHandle = supportsIdleCallback
        ? view.requestIdleCallback(() => setShouldRender(true))
        : view.setTimeout(() => setShouldRender(true), 2500)
    }

    const watchViewport = () => {
      // `rootMargin` generoso: los bloques de CTA y del formulario de contacto
      // usan este mismo componente más abajo en la página, y conviene que
      // empiecen a cargar un poco antes de entrar en pantalla, no cuando ya se
      // los está mirando.
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          observer?.disconnect()
          scheduleWhenIdle()
        },
        { rootMargin: '200px' },
      )
      observer.observe(node)
    }

    // Nada de esto arranca antes de `load`. El hero esta en el viewport desde
    // el primer frame, asi que sin esta espera el observer disparaba durante
    // la carga y el shader competia con la hidratacion por el mismo hilo.
    if (document.readyState === 'complete') {
      watchViewport()
      return () => {
        observer?.disconnect()
        cancelIdle()
      }
    }

    view.addEventListener('load', watchViewport, { once: true })

    function cancelIdle() {
      if (idleHandle === undefined) return
      if (supportsIdleCallback) {
        view.cancelIdleCallback(idleHandle)
      } else {
        view.clearTimeout(idleHandle)
      }
    }

    return () => {
      view.removeEventListener('load', watchViewport)
      observer?.disconnect()
      cancelIdle()
    }
  }, [])

  // El fundido arranca un frame despues del montaje: si se pusiera la clase
  // final en el mismo commit, el navegador no tiene un estado previo contra
  // el cual interpolar y el shader aparece de golpe.
  useEffect(() => {
    if (!shouldRender) return
    const frame = requestAnimationFrame(() => setFaded(true))
    return () => cancelAnimationFrame(frame)
  }, [shouldRender])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
      data-testid="hero-grain-gradient"
    >
      <div className="absolute inset-0" style={{ background: STATIC_BACKDROP }} aria-hidden="true" />

      {shouldRender && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            faded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <HeroGrainGradientShader variant={variant} />
        </div>
      )}
    </div>
  )
}
