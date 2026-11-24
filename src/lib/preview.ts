/**
 * Bandera del modo preview de solo lectura (fase 53, D-03 y D-05).
 *
 * El preview del rediseño (dev.juan-tech.com) corre el mismo código que
 * producción contra la misma base de datos, así que no puede escribir ni
 * indexarse. Esta función es la compuerta de código: la usan el middleware
 * (runtime Edge), las server actions, los route handlers y `robots.ts`.
 *
 * POR QUÉ NO ES UNA VARIABLE `NEXT_PUBLIC_*`: Next congela esas variables en el
 * build y las incrusta en el bundle del cliente. La bandera tiene que leerse en
 * runtime, en el servidor, para que el mismo build se comporte distinto según el
 * entorno donde arranca. Por eso lee `process.env` en cada llamada y el módulo no
 * importa nada: así carga igual de bien en el sandbox Edge del middleware.
 *
 * El rol Postgres sin INSERT, UPDATE ni DELETE (plan 06) es la barrera real;
 * esta bandera es la segunda capa y evita errores de permisos visibles.
 *
 * La regla de lectura vive en `preview-flag.mjs` (falla cerrado) y la comparte
 * `next.config.mjs`. Es un modulo puro sin dependencias, asi que sigue cargando
 * en el sandbox Edge.
 */
import { parsePreviewFlag } from './preview-flag.mjs'

export function isPreviewReadonly(): boolean {
  return parsePreviewFlag(process.env.PREVIEW_READONLY)
}
