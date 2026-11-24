import type { Metadata, Viewport } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'

import { NotFoundView } from '@/components/pages/NotFoundView'
import { SiteDocument } from '@/components/shell/SiteDocument'
import { BRAND_SUFFIX } from '@/lib/page-title'
import './globals.css'

// 404 de una URL que no coincide con ninguna ruta (PAG-11).
//
// Por que existe este archivo y no solo `[locale]/not-found.tsx`: en Next 15.4
// un `notFound()` lanzado desde una pagina (o desde un catch-all) devuelve 404,
// pero el HTML del servidor es un documento de error vacio y el cliente rehace
// la pagina. Sin header, footer ni h1 en el HTML. Lo midio
// scripts/verify/54-notfound-status.mjs sobre un catch-all `[...rest]` y sobre
// una app minima sin nada del proyecto. La unica 404 que Next renderiza completa
// en el servidor es la de la URL sin ruta, y para esa, con raices de layout en
// segmentos dinamicos, la convencion es `global-not-found` (necesita
// `experimental.globalNotFound` en next.config.mjs).
//
// Este archivo se salta el layout, asi que el documento completo sale de
// `SiteDocument`, el mismo que usa `[locale]/layout.tsx`.
//
// T-54-03: nada de lo que el visitante escribio en la URL llega al HTML ni a la
// metadata. Solo texto de messages.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound')
  return {
    // Aqui no corre `title.template` del layout, el sufijo se agrega a mano.
    title: `${t('metaTitle')}${BRAND_SUFFIX}`,
    // T-54-04: una 404 nunca se indexa.
    robots: { index: false, follow: false },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#181818',
}

export default async function GlobalNotFound() {
  const locale = (await getLocale()) === 'en' ? 'en' : 'es'
  return (
    <SiteDocument locale={locale}>
      <NotFoundView />
    </SiteDocument>
  )
}
