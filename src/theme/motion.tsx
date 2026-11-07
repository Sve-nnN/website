'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

import { MOTION_STORAGE_KEY } from './motion-init'

/**
 * Contexto de movimiento (D-15, D-16). El estado vive en el atributo
 * `data-motion` de `<html>` y no en `useState`: el script inline de
 * `MOTION_INIT_SCRIPT` lo fija antes del primer pintado, así que el DOM ya es
 * la fuente de verdad cuando React hidrata. Un estado propio de React
 * arrancaría en `running` y tendría que corregirse después, con parpadeo.
 *
 * `useSyncExternalStore` observa el atributo con un `MutationObserver`. El
 * snapshot de servidor devuelve `false` (running) porque el servidor no conoce
 * la preferencia de la persona. Es el mismo patrón que `SiteHeaderChrome`.
 *
 * Convive con el `MotionProvider` viejo (LazyMotion strict), que se queda hasta
 * la fase 57 (D-17) y lee `useMotion()` para pausar `motion/react`.
 */
type MotionValue = { paused: boolean; toggle: () => void }

const MotionContext = createContext<MotionValue>({ paused: false, toggle: () => {} })

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-motion'],
  })
  return () => observer.disconnect()
}

function getSnapshot() {
  return document.documentElement.getAttribute('data-motion') === 'paused'
}

function getServerSnapshot() {
  return false
}

export function MotionStateProvider({ children }: { children: ReactNode }) {
  const paused = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    const next = document.documentElement.getAttribute('data-motion') === 'paused' ? 'running' : 'paused'
    try {
      window.localStorage.setItem(MOTION_STORAGE_KEY, next)
    } catch {
      // El almacenamiento puede estar bloqueado; el atributo igual cambia.
    }
    document.documentElement.setAttribute('data-motion', next)
  }, [])

  const value = useMemo(() => ({ paused, toggle }), [paused, toggle])

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}

export function useMotion(): MotionValue {
  return useContext(MotionContext)
}
