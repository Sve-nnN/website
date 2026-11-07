// Destino de las rewrites del preview (next.config.mjs, fase 53, D-04 y D-05):
// /admin, /api (salvo la lista permitida) y los sitemaps responden 404 plano.
//
// Vive FUERA de los grupos (frontend) y (payload) a propósito. Una ruta estática
// de primer nivel gana sobre `[locale]`; si el rewrite apuntara a una ruta sin
// handler propio, `/<segmento>` caería en `[locale]/page.tsx`, el layout llamaría
// `notFound()` y, al ser la raíz del árbol, Next respondería 500 (SEO-39, ver
// src/middleware.ts).
export const dynamic = 'force-dynamic'

function notFound() {
  return new Response('Not Found', { status: 404 })
}

export const GET = notFound
export const POST = notFound
export const PUT = notFound
export const PATCH = notFound
export const DELETE = notFound
export const HEAD = notFound
