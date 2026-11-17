'use client'

// Fase 57 (D-04 F1): el estado `?subscribed=` de la captura de email se lee
// aquí, en el cliente, y no en el servidor del post. Leer `searchParams` en la
// página volvía dinámica toda la ruta (force-dynamic, sin caché, TTFB de 1,6 a
// 2 s). Con la lectura en el cliente el HTML del post no depende del parámetro
// y la ruta vuelve a la caché incremental (revalidate).
//
// El servidor pinta el `fallback` del Suspense que envuelve este componente:
// el formulario normal, igual que una visita sin parámetro, así que el HTML
// cacheado es el mismo para todos (T-57-20). Tras hidratar, este componente
// elige cuál de los bloques ya renderizados por el servidor mostrar.
// `subscribed` solo elige entre textos fijos; nunca se interpola (T-49-08).
import type { ReactNode } from 'react'

import { useSearchParams } from 'next/navigation'

const SUBSCRIBED_STATES = ['pending', 'already', 'error'] as const
export type SubscribedState = (typeof SUBSCRIBED_STATES)[number]

export function isSubscribedState(value: string | null | undefined): value is SubscribedState {
  return typeof value === 'string' && (SUBSCRIBED_STATES as readonly string[]).includes(value)
}

export type EmailCaptureStateProps = {
  /**
   * Estado fijado desde fuera. Solo lo usan las pruebas SSR y cualquier
   * llamador que ya conozca el estado; la página del post no lo pasa.
   */
  forcedState?: string
  /** Formulario sin estado (también es el fallback del servidor). */
  form: ReactNode
  /** Formulario marcado como inválido, con foco y enlazado al mensaje de error. */
  errorForm: ReactNode
  pending: ReactNode
  already: ReactNode
  error: ReactNode
}

export function EmailCaptureState({ forcedState, form, errorForm, pending, already, error }: EmailCaptureStateProps) {
  const params = useSearchParams()
  const raw = forcedState ?? params?.get('subscribed') ?? undefined
  const state = isSubscribedState(raw) ? raw : null

  if (state === 'pending') return <>{pending}</>
  if (state === 'already') return <>{already}</>
  if (state === 'error') {
    // El formulario sigue visible tras un error para reintentar sin editar la URL.
    return (
      <>
        {error}
        {errorForm}
      </>
    )
  }
  return <>{form}</>
}
