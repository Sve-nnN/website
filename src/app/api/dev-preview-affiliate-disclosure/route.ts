import { NextResponse, type NextRequest } from 'next/server'

import { AffiliateDisclosure } from '@/components/AffiliateDisclosure'

// THROWAWAY (Phase 46 Plan 02, Task 1): existe únicamente para probar
// AffiliateDisclosure de punta a punta con next-intl real ANTES de que
// exista una página real que lo monte (Phase 48). Bajo /api, ya excluido
// del matcher de middleware y de robots.ts (disallow: ['/admin', '/api']).
// Borrado en Task 3 apenas cumple su propósito.
//
// NO usa react-dom/server: Next bloquea a nivel de build cualquier import
// (aunque sea transitivo) de react-dom/server dentro del grafo de módulos de
// la app ("You're importing a component that imports react-dom/server").
// En su lugar se invoca el componente real y se extrae el texto de
// `element.props.children` — sigue exercitando next-intl/getTranslations de
// punta a punta contra el request real, que es el único propósito de esta
// ruta temporal.
export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get('locale')
  const locale = localeParam === 'en' ? 'en' : 'es'
  const hasAmazonLinks = request.nextUrl.searchParams.get('hasAmazonLinks') === 'true'

  const element = await AffiliateDisclosure({ locale, hasAmazonLinks })
  const children = element.props.children as unknown[]
  const text = children.filter((c): c is string => typeof c === 'string').join('')

  return new NextResponse(`<p>${text}</p>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
