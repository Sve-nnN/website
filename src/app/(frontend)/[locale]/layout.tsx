import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { routing } from '@/i18n/routing'
import { SiteDocument } from '@/components/shell/SiteDocument'
import { SITE_URL } from '@/lib/sitemap-data'
import { isPreviewReadonly } from '@/lib/preview'
import { BRAND, BRAND_SUFFIX } from '@/lib/page-title'
import '../../globals.css'

// This file has no src/app/layout.tsx above it — it IS the root of the
// public frontend tree, so the base URL for resolving relative metadata
// (OG images, canonicals) is set here exactly once, sitewide.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // SEO-45: 165 de los 169 titulos del sitio no nombraban a nadie. "Blog",
  // "General", "Apturio" o "Contacto" a secas no dicen de quien es la pagina
  // ni de que va cuando aparecen en una SERP.
  //
  // El sufijo se aplica desde aca, en un solo lugar, pero NO a todos: cada
  // ruta pasa su titulo por `pageTitle()` (src/lib/page-title.ts), que
  // devuelve un string cuando el sufijo entra en 60 caracteres y `absolute`
  // cuando no, o cuando el titulo ya nombra la marca. Google corta cerca de
  // los 60 y el sufijo ocupa 21: agregarselo a un titulo de 55 no suma
  // contexto, le come el final de su propia frase.
  title: {
    template: `%s${BRAND_SUFFIX}`,
    default: BRAND,
  },
  // og:image-derived twitter:image is inherited automatically per Next's
  // Metadata API — no separate twitter.images/twitter.creator declared here.
  // twitter.creator omitted: Juan confirmed no Twitter/X account (41-CONTEXT.md).
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  // Preview del rediseño (fase 53, D-05): noindex, nofollow en el meta robots.
  // Las páginas que declaran su propio `robots` con `index: false` siguen siendo
  // noindex; la cabecera X-Robots-Tag cubre cualquier caso restante. Sin la
  // bandera (producción) no agrega nada.
  ...(isPreviewReadonly() ? { robots: { index: false, follow: false } } : {}),
}

// themeColor lives on the dedicated `viewport` export, NOT inside `metadata`
// — Next.js 15 requires this split; putting themeColor under `metadata`
// silently does nothing.
export const viewport: Viewport = {
  themeColor: '#181818',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  // El documento (html, proveedores, header, main y footer) vive en
  // SiteDocument porque `global-not-found.tsx` necesita el mismo.
  return <SiteDocument locale={locale}>{children}</SiteDocument>
}
