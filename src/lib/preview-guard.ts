import { isPreviewReadonly } from './preview'

/**
 * Guarda de runtime para las rutas de Payload (fase 53, WR-03).
 *
 * `rewrites()` y `headers()` de next.config.mjs se fijan en el build. Si la
 * bandera `PREVIEW_READONLY` solo llega como variable de runtime, el codigo queda
 * en solo lectura pero `/admin` y la API de Payload seguirian expuestos. Esta
 * guarda lee la bandera en cada peticion, sin depender de cuando se construyo, y
 * responde el mismo 404 plano que `/preview-blocked`.
 *
 * Preserva el tipo del handler para que Next siga validando la firma de la ruta.
 */
export function guardPreviewRoute<Args extends unknown[]>(
  handler: (...args: Args) => Response | Promise<Response>,
): (...args: Args) => Response | Promise<Response> {
  return (...args: Args) =>
    isPreviewReadonly() ? new Response('Not Found', { status: 404 }) : handler(...args)
}
